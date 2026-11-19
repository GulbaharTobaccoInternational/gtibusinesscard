import { getAssets } from './assets';
import { DESIGN, WHITE, rectangle, type Scene } from './design';
import { type Employee, fullName, validateEmployee } from './employee';
import { textOutlines } from './outlines';
import { createQr } from './qr';
import { COMPANY } from './company';
export function buildCard(employee: Employee) {
  const { artwork, bold, book } = getAssets();
  const issues = validateEmployee(employee);
  const front: Scene = { widthMm: DESIGN.widthMm, heightMm: DESIGN.heightMm, paths: [rectangle(0,0,92,57,WHITE), ...artwork.front] };
  const back: Scene = { widthMm: DESIGN.widthMm, heightMm: DESIGN.heightMm, paths: artwork.back };
  const addText = (text: string, field: keyof Employee, weight: 'bold'|'book', layout: {x?:number;right?:number;baseline:number;size:number;trackingEm:number}, minLeft?: number, maxRight?: number) => {
    const result = textOutlines(text, weight==='bold'?bold:book, { ...layout, color: field==='firstName' ? artwork.referenceColors.name : artwork.referenceColors.contact });
    if (result.missing.length) issues.push({field,severity:'error',code:`glyph-${field}`,message:`The supplied Gotham font has no glyph for ${result.missing.map(c=>`“${c}”`).join(', ')}. Use an approved spelling or ask your administrator for a licensed Gotham font covering these characters.`});
    if ((maxRight !== undefined && (layout.x??0)+result.width>maxRight) || (minLeft !== undefined && result.left<minLeft)) issues.push({field,severity:'error',code:`overflow-${field}`,message:`${field==='firstName'?'Employee name':field==='designation'?'Job title':field==='email'?'Email address':'Printed phone line'} exceeds the approved single-line area. Shorten it${field==='mobile'?' or select fewer printed numbers':''}.`});
    front.paths.push(...result.paths);
    return result.width;
  };
  let nameSize = DESIGN.name.size;
  const name = fullName(employee).toUpperCase();
  const normal = textOutlines(name,bold,{...DESIGN.name,color:artwork.referenceColors.name});
  const available = DESIGN.name.maxRight - DESIGN.name.x;
  if (normal.width>available) nameSize *= Math.max(DESIGN.name.minScale,available/normal.width);
  addText(name,'firstName','bold',{...DESIGN.name,size:nameSize},undefined,DESIGN.name.maxRight);
  addText(employee.designation.toUpperCase(),'designation','bold',DESIGN.designation,undefined,DESIGN.designation.maxRight);
  if (employee.email) addText(`E: ${employee.email}`,'email','book',DESIGN.email,DESIGN.email.minLeft);
  const mobile = employee.primaryMobile === 'none' ? '' : employee[employee.primaryMobile];
  const telephone = [mobile ? `M: ${mobile}` : '', `T: ${COMPANY.telephone}`].filter(Boolean).join(', ');
  addText(telephone,'mobile','book',DESIGN.telephone,DESIGN.telephone.minLeft);
  let qr: ReturnType<typeof createQr> | undefined;
  if (employee.includeQr) {
    try { qr=createQr(employee);front.paths.push(...qr.paths);issues.push(...qr.issues); }
    catch { issues.push({field:'qr',severity:'error',code:'qr-encoding',message:'Could not encode these QR details. Remove optional fields and try again.'}); }
  }
  return { front, back, issues, qr, nameScale: nameSize/DESIGN.name.size };
}
export function sceneToSvg(scene: Scene, pixels?: { width:number; height:number }): string {
  const paths=scene.paths.map(p=>`<path fill="rgb(${p.color.rgb.map(v=>Math.round(v*255)).join(' ')})" d="${p.d}"/>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${pixels?pixels.width:scene.widthMm+'mm'}" height="${pixels?pixels.height:scene.heightMm+'mm'}" viewBox="0 0 ${scene.widthMm} ${scene.heightMm}" role="img" aria-label="Business card">${paths}</svg>`;
}
export function previewCard(employee: Employee) {
  const card=buildCard(employee);
  return { front: sceneToSvg(card.front),back:sceneToSvg(card.back),issues:card.issues,nameScale:card.nameScale,
    qr: card.qr ? {svg:sceneToSvg({widthMm:DESIGN.qr.size+8*card.qr.moduleMm,heightMm:DESIGN.qr.size+8*card.qr.moduleMm,paths:card.qr.paths.map(p=>({...p,d:p.d.replace(/([ML])(-?[\d.]+) (-?[\d.]+)/g,(_,op,x,y)=>`${op}${Number(x)-DESIGN.qr.x+4*card.qr!.moduleMm} ${Number(y)-DESIGN.qr.y+4*card.qr!.moduleMm}`)}))}),payload:card.qr.payload,modules:card.qr.modules,moduleMm:card.qr.moduleMm} : null };
}
export type PreviewResult = ReturnType<typeof previewCard>;
