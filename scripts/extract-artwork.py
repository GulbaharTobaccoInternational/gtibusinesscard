"""Extract the approved PDF's filled paths without rasterizing or editing it.
Run with pypdf and pymupdf available. All canonical coordinates are millimeters.
"""
from pathlib import Path
import json, hashlib, copy, shutil
from pypdf import PdfReader
from pypdf.generic import ContentStream
import pymupdf

ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT.parent/'Sample B Cards/Mr Liwaa Sahib Bussiness Card.pdf'
MM=25.4/72
reader=PdfReader(SOURCE)
view=pymupdf.open(SOURCE)

def extract(page_index):
 page=reader.pages[page_index]
 drawings=view[page_index].get_drawings()
 state={'matrix':[1,0,0,1,0,0],'color':{'kind':'cmyk','values':[0,0,0,1]},'cs':'/DeviceCMYK'}
 stack=[]; paths=[]; commands=[]; points=[]
 def point(x,y):
  a,b,c,d,e,f=state['matrix']
  return [(a*float(x)+c*float(y)+e)*MM,(float(page.mediabox.height)-(b*float(x)+d*float(y)+f))*MM]
 def cmd(op,*coords):
  ps=[point(coords[i],coords[i+1]) for i in range(0,len(coords),2)]
  points.extend(ps)
  commands.append(op+' '.join(f'{v:.6f}' for p in ps for v in p))
 for args,op in ContentStream(page.get_contents(),reader).operations:
  op=op.decode()
  if op=='q':stack.append(copy.deepcopy(state))
  elif op=='Q':state=stack.pop()
  elif op=='cm':
   a,b,c,d,e,f=state['matrix'];g,h,i,j,k,l=map(float,args)
   state['matrix']=[a*g+c*h,b*g+d*h,a*i+c*j,b*i+d*j,a*k+c*l+e,b*k+d*l+f]
  elif op=='k':state['color']={'kind':'cmyk','values':list(map(float,args))}
  elif op=='rg':state['color']={'kind':'rgb','values':list(map(float,args))}
  elif op=='g':state['color']={'kind':'rgb','values':[float(args[0])]*3}
  elif op=='cs':state['cs']=str(args[0])
  elif op=='scn':
   cs=page['/Resources']['/ColorSpace'][state['cs']].get_object()
   assert str(cs[0])=='/Separation'
   state['color']={'kind':'spot','name':str(cs[1])[1:],'lab':list(map(float,cs[3]['/C1'])),'tint':float(args[0])}
  elif op=='m':cmd('M',*args)
  elif op=='l':cmd('L',*args)
  elif op=='c':cmd('C',*args)
  elif op=='h':commands.append('Z')
  elif op=='re':
   x,y,w,h=map(float,args)
   cmd('M',x,y);cmd('L',x+w,y);cmd('L',x+w,y+h);cmd('L',x,y+h);commands.append('Z')
  elif op in ['f','f*']:
   assert op=='f', 'Even-odd fill requires explicit handling'
   index=len(paths); drawing=drawings[index]
   box=[float(x)*MM for x in drawing['rect']]
   color=copy.deepcopy(state['color'])
   color['rgb']=[round(float(x),7) for x in drawing['fill']]
   paths.append({'d':' '.join(commands),'color':color,'bounds':box,'sourceIndex':index})
   commands=[];points=[]
  elif op=='n':commands=[];points=[]
  elif op not in ['BDC','EMC','gs','W']:raise ValueError(f'Unhandled operator: {op}')
 assert len(paths)==len(drawings)
 return paths

front=extract(0); back=extract(1)
# Names, designation, email, telephone and QR are the only variable regions.
def group(p):
 x,y,r,b=p['bounds']
 if 26<y<29 and b<29:return 'name'
 if 29<y<31.1 and b<31.1:return 'designation'
 if 37<y<40.3 and b<40.3:return 'email'
 if 40.3<y<42.5 and b<42.5:return 'telephone'
 if x>71 and y<22.1 and b<22.1:return 'qr'
 return 'fixed'
by={k:[p for p in front if group(p)==k] for k in ['fixed','name','designation','email','telephone','qr']}
def bbox(items):return [min(p['bounds'][0] for p in items),min(p['bounds'][1] for p in items),max(p['bounds'][2] for p in items),max(p['bounds'][3] for p in items)]
model={'provenance':{'source':str(SOURCE.relative_to(ROOT.parent)),'sha256':hashlib.sha256(SOURCE.read_bytes()).hexdigest(),'sourcePagePoints':[260.787,161.575]},'widthMm':92,'heightMm':57,'front':by['fixed'],'back':back,'referenceBounds':{k:bbox(v) for k,v in by.items() if v},'referenceColors':{'name':by['name'][0]['color'],'contact':by['email'][0]['color']}}
(ROOT/'private/assets/source-artwork.json').write_text(json.dumps(model,separators=(',',':')))
(ROOT/'docs/source-analysis/reference-regions.json').write_text(json.dumps({k:{'count':len(v),'boundsMm':bbox(v)} for k,v in by.items()},indent=2))
(ROOT/'docs/source-analysis/original-qr-paths.json').write_text(json.dumps(by['qr'],separators=(',',':')))
for fn in ['Gotham-Bold.otf','GothamBook.ttf']:
 shutil.copy2(ROOT.parent/'B Card Fonts'/fn,ROOT/'private/assets'/fn)
print(json.dumps({k:{'count':len(v),'boundsMm':bbox(v)} for k,v in by.items()},indent=2))
print('Back paths',len(back),'All paths',len(front))
