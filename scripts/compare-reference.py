"""Private source comparison. Run verify:exports first; never commit generated records.
GULBAHAR_REFERENCE_PDF and DOUBLE_LEAF_REFERENCE_PDF may override local sources.
Requires pypdf, pymupdf, Pillow, numpy and zxing-cpp.
"""
from pathlib import Path
import os, json, re, subprocess, unicodedata
import numpy as np
from PIL import Image, ImageChops
from pypdf import PdfReader
from pypdf.generic import ContentStream
import pymupdf
import zxingcpp
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'output/verification/companies'
SOURCES={
 'gti':(Path(os.environ.get('GULBAHAR_REFERENCE_PDF',ROOT.parent/'Sample B Cards/Mr Liwaa Sahib Bussiness Card.pdf')),[0,1],(70,6,88,23)),
 'doubleLeaf':(Path(os.environ.get('DOUBLE_LEAF_REFERENCE_PDF',ROOT/'.tools/references/double-leaf/B Card Assets - Double Leaf/Double Leaf Business Card Template.pdf')),[1,0],(6,29,24,47)),
}
report={'dpi':600,'companies':{}}
for company,(source,order,qr_box) in SOURCES.items():
 ref=pymupdf.open(source)
 decoded=zxingcpp.read_barcodes(ref[order[0]].get_pixmap(dpi=600).pil_image())
 assert len(decoded)==1,'Source QR did not decode'
 # Original reference employee is used only transiently for geometry comparison.
 text=re.sub(r'\r?\n[ \t]','',decoded[0].text)
 def value(key):
  for line in text.splitlines():
   head,sep,content=line.partition(':')
   if sep and head.split(';')[0]==key:
    return ''.join(c for c in content if unicodedata.category(c)!='Cf').strip()
  return ''
 name=value('N').split(';');phone=value('TEL')
 if company=='gti':phone=re.sub(r'^(\+\d{3})(?=\d)',r'\1 ',phone)
 employee={'firstName':name[1].strip(),'lastName':name[0].strip(),'designation':value('TITLE'),'email':value('EMAIL'),'mobile':phone}
 subprocess.run(['node','--import','tsx','scripts/render-reference.ts'],input=json.dumps({'companyId':company,'employee':employee}),text=True,check=True,cwd=ROOT,capture_output=True)
 generated=OUT/f'{company}-reference.pdf';gen=pymupdf.open(generated);reader=PdfReader(generated)
 assert len(reader.pages)==2
 entries=[]
 for i,page in enumerate(reader.pages):
  ops=ContentStream(page.get_contents(),reader).operations
  assert not any(op in [b'BT',b'Tf',b'Tj',b'TJ'] for _,op in ops),'Live text found'
  for key in ['/Font','/XObject']:assert key not in page['/Resources'] or len(page['/Resources'][key])==0,key
  width,height=float(page.mediabox.width),float(page.mediabox.height)
  assert abs(width*25.4/72-92)<1e-6 and abs(height*25.4/72-57)<1e-6
  assert page.trimbox==page.mediabox and page.bleedbox==page.mediabox
  r=ref[order[i]].get_pixmap(dpi=600).pil_image().convert('RGB');g=gen[i].get_pixmap(dpi=600).pil_image().convert('RGB')
  assert r.size==g.size
  r.save(OUT/f'{company}-approved-{i+1}.png');g.save(OUT/f'{company}-reference-{i+1}.png')
  Image.blend(r,g,.5).save(OUT/f'{company}-overlay-{i+1}.png');ImageChops.difference(r,g).save(OUT/f'{company}-difference-{i+1}.png')
  a=np.asarray(r).astype(float);b=np.asarray(g).astype(float);mask=np.ones(a.shape[:2],dtype=bool)
  if i==0:
   x,y,right,bottom=qr_box;s=600/25.4;mask[round(y*s):round(bottom*s),round(x*s):round(right*s)]=False
   assert len(zxingcpp.read_barcodes(g))==1,'Reference-match PDF QR failed decoding'
  delta=np.abs(a-b)
  entry={'page':i+1,'sourcePage':order[i]+1,'sizeMm':[width*25.4/72,height*25.4/72],'vectorOnly':True,'maeExcludingQr':float(delta[mask].mean()),'fractionPixelsChangedOver10':float((np.max(delta,axis=2)[mask]>10).mean())}
  assert entry['maeExcludingQr']<.1,entry
  assert entry['fractionPixelsChangedOver10']<.002,entry
  entries.append(entry)
 # Independently validate fictional demos and exact QR payloads from production exporters.
 expected=(OUT/f'{company}-vcard.vcf').read_bytes().decode('utf-8')
 for dpi in [300,600]:
  decoded=zxingcpp.read_barcodes(Image.open(OUT/f'{company}-{dpi}.png'))
  assert len(decoded)==1 and decoded[0].text==expected,'Fictional demo PNG QR payload mismatch'
 prefix='GTI_Alex_Morgan' if company=='gti' else 'DoubleLeaf_Jordan_Taylor'
 for kind in ['Print','Digital']:
  doc=pymupdf.open(OUT/f'{prefix}_Business_Card_{kind}.pdf')
  assert len(doc)==2
  for i,p in enumerate(doc):p.get_pixmap(dpi=300).save(OUT/f'{company}-demo-{kind.lower()}-{i+1}.png')
  assert zxingcpp.read_barcodes(doc[0].get_pixmap(dpi=600).pil_image())[0].text==expected
 report['companies'][company]={'pages':entries,'qrPngDecodedAtDpi':[300,600],'fictionalPrintAndDigitalQrMatch':True}
(OUT/'comparison-report.json').write_text(json.dumps(report,indent=2))
print(json.dumps(report,indent=2))
