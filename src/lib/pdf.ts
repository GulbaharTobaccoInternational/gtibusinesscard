import { PDFDocument, PDFDict, PDFOperatorNames, PDFName, PDFNumber, PDFOperator, pushGraphicsState, popGraphicsState, concatTransformationMatrix, moveTo, lineTo, appendBezierCurve, closePath, fill, setFillingColor, cmyk, rgb, type PDFPage } from 'pdf-lib';
import { MM_TO_PT, type Color, type Scene } from './design';
function pdfColor(page: PDFPage, color: Color): PDFOperator[] {
  if (color.kind==='spot') {
    const name = `Spot${color.name!.replace(/[^a-zA-Z0-9]/g,'')}`;
    const context=page.doc.context;
    const resources=page.node.Resources()!;
    let spaces=resources.lookupMaybe(PDFName.of('ColorSpace'), PDFDict);
    if (!spaces) { spaces=context.obj({}); resources.set(PDFName.of('ColorSpace'),spaces); }
    if (!spaces.has(PDFName.of(name))) {
      spaces.set(PDFName.of(name), context.obj([
        'Separation', color.name!, ['Lab', { BlackPoint:[0,0,0], Range:[-128,127,-128,127], WhitePoint:[.964203,1,.824905] }],
        { FunctionType:2, Domain:[0,1], Range:[0,100,-128,127,-128,127], C0:[100,0,0], C1:color.lab!, N:1 },
      ]));
    }
    return [PDFOperator.of(PDFOperatorNames.NonStrokingColorspace,[PDFName.of(name)]),PDFOperator.of(PDFOperatorNames.NonStrokingColorN,[PDFNumber.of(color.tint??1)])];
  }
  const v=color.values??color.rgb;
  return [setFillingColor(color.kind==='cmyk'?cmyk(v[0],v[1],v[2],v[3]):rgb(v[0],v[1],v[2]))];
}
/** The scene contains only M/L/C/Q/Z, all in millimeters with a top-left origin. */
export function vectorOperators(d: string): PDFOperator[] {
  const tokens=d.match(/[MLCQZ]|[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:e[-+]?\d+)?/gi)??[];
  const operations: PDFOperator[]=[];
  let cursor=0, x=0,y=0;
  const num=()=>Number(tokens[cursor++]);
  while(cursor<tokens.length) {
    const op=tokens[cursor++];
    if(op==='M'){x=num();y=num();operations.push(moveTo(x,y));}
    else if(op==='L'){x=num();y=num();operations.push(lineTo(x,y));}
    else if(op==='C'){const a=num(),b=num(),c=num(),d=num();x=num();y=num();operations.push(appendBezierCurve(a,b,c,d,x,y));}
    else if(op==='Q'){const a=num(),b=num(),nx=num(),ny=num();operations.push(appendBezierCurve(x+2/3*(a-x),y+2/3*(b-y),nx+2/3*(a-nx),ny+2/3*(b-ny),nx,ny));x=nx;y=ny;}
    else if(op==='Z')operations.push(closePath());
    else throw new Error('Unexpected vector path command.');
  }
  return operations;
}
export async function scenesToPdf(scenes: Scene[], kind: 'print'|'digital'='print'): Promise<Uint8Array> {
  const doc=await PDFDocument.create();
  doc.setTitle('Gulbahar Business Card');doc.setCreator('Gulbahar Business Card Generator');doc.setProducer('Gulbahar vector engine');
  for(const scene of scenes){
    const page=doc.addPage([scene.widthMm*MM_TO_PT,scene.heightMm*MM_TO_PT]);
    page.setTrimBox(0,0,page.getWidth(),page.getHeight());page.setBleedBox(0,0,page.getWidth(),page.getHeight());
    page.pushOperators(pushGraphicsState(),concatTransformationMatrix(MM_TO_PT,0,0,-MM_TO_PT,0,page.getHeight()));
    for(const path of scene.paths){
      const color=kind==='digital'?{...path.color,kind:'rgb' as const,values:path.color.rgb}:path.color;
      page.pushOperators(...pdfColor(page,color),...vectorOperators(path.d),fill());
    }
    page.pushOperators(popGraphicsState());
  }
  return doc.save();
}
