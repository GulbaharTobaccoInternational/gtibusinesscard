"""Run after npm run verify:exports. Requires pypdf, pymupdf, Pillow, numpy, zxing-cpp.
Set GULBAHAR_REFERENCE_PDF to move the source reference outside the asset workspace.
"""
from pathlib import Path
import os, json
import numpy as np
from PIL import Image, ImageChops
from pypdf import PdfReader
from pypdf.generic import ContentStream
import pymupdf
import zxingcpp
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'output/verification'
REF=Path(os.environ.get('GULBAHAR_REFERENCE_PDF',ROOT.parent/'Sample B Cards/Mr Liwaa Sahib Bussiness Card.pdf'))
GEN=OUT/'Liwaa_Sahib_Business_Card_Print.pdf'
ref=pymupdf.open(REF);gen=pymupdf.open(GEN)
reader=PdfReader(GEN)
report={'dpi':600,'pages':[],'source':str(REF),'generated':str(GEN)}
for i,page in enumerate(reader.pages):
 ops=ContentStream(page.get_contents(),reader).operations
 assert not any(op in [b'BT',b'Tf',b'Tj',b'TJ'] for _,op in ops),'Live text found'
 assert '/Font' not in page['/Resources'] or len(page['/Resources']['/Font'])==0,'Font resource found'
 assert '/XObject' not in page['/Resources'] or len(page['/Resources']['/XObject'])==0,'Raster image or external artwork found'
 width,height=map(float,[page.mediabox.width,page.mediabox.height]);assert abs(width*25.4/72-92)<1e-6;assert abs(height*25.4/72-57)<1e-6
 r=ref[i].get_pixmap(dpi=600).pil_image().convert('RGB');g=gen[i].get_pixmap(dpi=600).pil_image().convert('RGB')
 assert r.size==g.size,(r.size,g.size)
 r.save(OUT/f'approved-{i+1}.png');g.save(OUT/f'generated-{i+1}.png')
 Image.blend(r,g,.5).save(OUT/f'overlay-{i+1}.png')
 diff=ImageChops.difference(r,g)
 a=np.asarray(r).astype(float);b=np.asarray(g).astype(float)
 mask=np.ones(a.shape[:2],dtype=bool)
 if i==0:
  # QR content legitimately changes; ignore its footprint plus the functional quiet zone.
  s=600/25.4; mask[round(6*s):round(23*s),round(70*s):round(88*s)]=False
 diff.save(OUT/f'difference-{i+1}.png')
 delta=np.abs(a-b)
 entry={'page':i+1,'sizeMm':[width*25.4/72,height*25.4/72],'vectorOnly':True,'maeExcludingQr':float(delta[mask].mean()),'fractionPixelsChangedOver10':float((np.max(delta,axis=2)[mask]>10).mean())}
 if i==0:
  decoded=zxingcpp.read_barcodes(g);assert len(decoded)==1,'Generated print PDF QR did not decode'
  expected=(OUT/'sample-vcard.vcf').read_bytes().decode('utf-8')
  assert decoded[0].text==expected,'Decoded vCard differs from supplied data'
  entry['qrDecodedMatches']=True
 assert entry['maeExcludingQr'] < .5, 'Visual difference exceeds the approved tolerance'
 assert entry['fractionPixelsChangedOver10'] < .002, 'Too many pixels differ from the approved artwork'
 report['pages'].append(entry)
for dpi in [300,600]:
 image=Image.open(OUT/f'sample-{dpi}.png');decoded=zxingcpp.read_barcodes(image)
 assert len(decoded)==1;assert decoded[0].text==(OUT/'sample-vcard.vcf').read_bytes().decode()
report['qrPngDecodedAtDpi']=[300,600]
(OUT/'comparison-report.json').write_text(json.dumps(report,indent=2))
print(json.dumps(report,indent=2))
