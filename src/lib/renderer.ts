import { getAssets } from './assets';
import { WHITE, rectangle, type Scene } from './design';
import { EMPTY_EMPLOYEE, type Employee, validateEmployee } from './employee';
import { createQr, qrPreviewSvg } from './qr';
import type { CompanyId } from './company';
import { getTemplate } from './templates';
import { createTextWriter } from './render-context';
import { renderGtiFront } from './templates/gti';
import { renderDoubleLeafFront } from './templates/double-leaf';
const FRONT_RENDERERS = { gti: renderGtiFront, doubleLeaf: renderDoubleLeafFront };
export function templateBack(companyId: CompanyId): Scene {
  const { widthMm, heightMm } = getTemplate(companyId).design;
  return { widthMm, heightMm, paths: getAssets(companyId).artwork.back };
}
function composeCard(employee: Employee, companyId: CompanyId) {
  const assets = getAssets(companyId);
  const design = getTemplate(companyId).design;
  const issues = validateEmployee(employee, companyId);
  const front: Scene = { widthMm: design.widthMm, heightMm: design.heightMm, paths: [rectangle(0,0,92,57,WHITE), ...assets.artwork.front] };
  const back = templateBack(companyId);
  const text = createTextWriter(front, issues, assets, companyId);
  const nameScale = FRONT_RENDERERS[companyId]({ employee, assets, front, issues, text });
  let qr: ReturnType<typeof createQr> | undefined;
  try { qr = createQr(employee, companyId); issues.push(...qr.issues); }
  catch { issues.push({field:'qr',severity:'error',code:'qr-encoding',message:'Could not encode these QR details. Remove optional fields and try again.'}); }
  return { companyId, front, back, issues, qr, nameScale };
}
export function buildCard(employee: Employee, companyId: CompanyId = 'gti') {
  const card = composeCard(employee, companyId);
  if (card.qr) card.front.paths.push(...card.qr.paths);
  return card;
}
export function sceneToSvg(scene: Scene, pixels?: { width:number; height:number }, overlay = ''): string {
  const rgb = (values: number[]) => `rgb(${values.map(v=>Math.round(v*255)).join(' ')})`;
  const paths = scene.paths.map(p => {
    const stroke = p.paint === 'stroke' || p.paint === 'fillStroke';
    const attributes = stroke ? ` stroke="${rgb((p.strokeColor??p.color).rgb)}" stroke-width="${p.strokeWidth}" stroke-linecap="${['butt','round','square'][p.lineCap??0]}" stroke-linejoin="${['miter','round','bevel'][p.lineJoin??0]}"` : '';
    return `<path fill="${p.paint==='stroke'?'none':rgb(p.color.rgb)}"${attributes} d="${p.d}"/>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${pixels?pixels.width:scene.widthMm+'mm'}" height="${pixels?pixels.height:scene.heightMm+'mm'}" viewBox="0 0 ${scene.widthMm} ${scene.heightMm}" role="img" aria-label="Business card">${paths}${overlay}</svg>`;
}
export function previewCard(employee: Employee, companyId: CompanyId = 'gti') {
  const card = composeCard(employee, companyId);
  const q = getTemplate(companyId).design.qr;
  const overlay = card.qr ? qrPreviewSvg(card.qr.matrix, q.quietModules, card.qr.moduleMm, q) : '';
  return { companyId, front:sceneToSvg(card.front, undefined, overlay), back:sceneToSvg(card.back), issues:card.issues, nameScale:card.nameScale,
    qr:card.qr?{ svg:qrPreviewSvg(card.qr.matrix,q.quietModules,card.qr.moduleMm),payload:card.qr.payload,modules:card.qr.modules,moduleMm:card.qr.moduleMm}:null };
}
export type PreviewResult = ReturnType<typeof previewCard>;

// Only the two fixed, empty templates are reusable. Personalized cards stay request-local.
const blankPreviews = new Map<CompanyId, PreviewResult>();
export function blankPreview(companyId: CompanyId) {
  let preview = blankPreviews.get(companyId);
  if (!preview) {
    preview = previewCard(EMPTY_EMPLOYEE, companyId);
    blankPreviews.set(companyId, preview);
  }
  return preview;
}
