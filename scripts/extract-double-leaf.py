"""Extract only approved Double Leaf vectors; private reference assets stay outside Git."""
from pathlib import Path
import copy, json, hashlib, shutil, math
from pypdf import PdfReader
from pypdf.generic import ContentStream
import pymupdf
ROOT=Path(__file__).resolve().parents[1]
REF=ROOT/'.tools/references/double-leaf/B Card Assets - Double Leaf'
SOURCE=REF/'Double Leaf Business Card Template.pdf'
MM=25.4/72
reader=PdfReader(SOURCE)

def extract(index):
 page=reader.pages[index]
 state={'matrix':[1,0,0,1,0,0],'fill':[0,0,0],'stroke':[0,0,0],'width':1,'cap':0,'join':0}
 stack=[]; result=[]; commands=[]; points=[]; current=None; start=None
 def point(x,y):
  a,b,c,d,e,f=state['matrix']
  return [(a*float(x)+c*float(y)+e)*MM,(float(page.mediabox.height)-(b*float(x)+d*float(y)+f))*MM]
 def add(op,ps):
  nonlocal current,start
  commands.append(op+' '.join(f'{v:.6f}' for p in ps for v in p));points.extend(ps)
  if ps:current=ps[-1]
  if op=='M':start=current
 def color(v):return {'kind':'rgb','values':v.copy(),'rgb':v.copy()}
 for args,operator in ContentStream(page.get_contents(),reader).operations:
  op=operator.decode()
  if op=='q':stack.append(copy.deepcopy(state))
  elif op=='Q':state=stack.pop()
  elif op=='cm':
   a,b,c,d,e,f=state['matrix'];g,h,i,j,k,l=map(float,args)
   state['matrix']=[a*g+c*h,b*g+d*h,a*i+c*j,b*i+d*j,a*k+c*l+e,b*k+d*l+f]
  elif op in ['rg','RG']:state['fill' if op=='rg' else 'stroke']=list(map(float,args))
  elif op in ['g','G']:state['fill' if op=='g' else 'stroke']=[float(args[0])]*3
  elif op=='w':state['width']=float(args[0])
  elif op=='J':state['cap']=int(args[0])
  elif op=='j':state['join']=int(args[0])
  elif op in ['m','l','c']:add({'m':'M','l':'L','c':'C'}[op],[point(args[j],args[j+1]) for j in range(0,len(args),2)])
  elif op=='v':add('C',[current,point(args[0],args[1]),point(args[2],args[3])])
  elif op=='y':add('C',[point(args[0],args[1]),point(args[2],args[3]),point(args[2],args[3])])
  elif op=='h':commands.append('Z');current=start
  elif op=='re':
   x,y,w,h=map(float,args)
   for j,p in enumerate([(x,y),(x+w,y),(x+w,y+h),(x,y+h)]):add('M' if j==0 else 'L',[point(*p)])
   commands.append('Z');current=start
  elif op in ['f','S']:
   assert commands
   box=[min(p[0] for p in points),min(p[1] for p in points),max(p[0] for p in points),max(p[1] for p in points)]
   v={'d':' '.join(commands),'color':color(state['fill']),'bounds':box,'sourceIndex':len(result)}
   if op=='S':v.update(paint='stroke',strokeColor=color(state['stroke']),strokeWidth=state['width']*MM,lineCap=state['cap'],lineJoin=state['join'])
   result.append(v);commands=[];points=[];current=None;start=None
  elif op=='n':commands=[];points=[];current=None;start=None
  elif op not in ['BDC','EMC','gs','W']:raise ValueError(f'Unhandled PDF operator {op}')
 return result
back=extract(0);front=extract(1)
def group(p):
 x,y,r,b=p['bounds']
 if x<68 and 11<y<16 and b<16:return 'name'
 if x<68 and 16.5<y<19.1 and b<19.1:return 'designation'
 if x>37 and 28<y<31.3 and b<31.3:return 'email'
 if x>37 and 31.3<y<34 and b<34:return 'phone'
 if x<24 and y>30 and b<46:return 'qr'
 return 'fixed'
by={k:[p for p in front if group(p)==k] for k in ['fixed','name','designation','email','phone','qr']}
def bbox(ps):return [min(p['bounds'][0] for p in ps),min(p['bounds'][1] for p in ps),max(p['bounds'][2] for p in ps),max(p['bounds'][3] for p in ps)]
model={'provenance':{'source':'Double Leaf Business Card Template.pdf','sha256':hashlib.sha256(SOURCE.read_bytes()).hexdigest(),'sourceFrontPage':2,'sourceBackPage':1},'front':by['fixed'],'back':back,'referenceBounds':{k:bbox(v) for k,v in by.items()},'referenceColors':{'name':by['name'][0]['color'],'designation':by['designation'][0]['color'],'contact':by['email'][0]['color']}}
(ROOT/'private/assets/source-artwork-double-leaf.json').write_text(json.dumps(model,separators=(',',':')))
for p in (REF/'B Card Fonts').iterdir():
 if p.suffix.lower() in ['.otf','.ttf']:shutil.copy2(p,ROOT/'private/assets'/p.name)
(ROOT/'output/verification/double-leaf/regions.json').write_text(json.dumps({k:{'count':len(v),'boundsMm':bbox(v)} for k,v in by.items()},indent=2))
# Keep source-only paths for a local visual reference check, never in the public bundle.
(ROOT/'.tools/references/double-leaf/source-pages.json').write_text(json.dumps({'front':front,'back':back},separators=(',',':')))
print(json.dumps({k:{'count':len(v),'boundsMm':bbox(v)} for k,v in by.items()},indent=2))
