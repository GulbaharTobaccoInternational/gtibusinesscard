import sharp from 'sharp';
import JSZip from 'jszip';
import { z } from 'zod';
import { employeeSchema, safeFilename, type Employee, type Issue } from './employee';
import { buildCard, sceneToSvg } from './renderer';
import { scenesToPdf } from './pdf';
import type { Scene } from './design';
import { companyIdSchema, getCompany, type CompanyId } from './company';
export const exportSettingsSchema=z.object({
  sides:z.enum(['front','both']).default('both'), format:z.enum(['print','digital','png']),
  dpi:z.union([z.literal(300),z.literal(600)]).default(600), acknowledgeQrWarning:z.boolean().default(false),
});
export const exportRequestSchema=z.object({companyId:companyIdSchema.default('gti'),employee:employeeSchema,settings:exportSettingsSchema});
export type ExportSettings=z.infer<typeof exportSettingsSchema>;
export class ArtworkValidationError extends Error {
  constructor(public issues:Issue[]){super('Review the card details before exporting.');}
}
export async function sceneToPng(scene: Scene, dpi:300|600):Promise<Buffer> {
  const width=Math.round(scene.widthMm/25.4*dpi),height=Math.round(scene.heightMm/25.4*dpi);
  return sharp(Buffer.from(sceneToSvg(scene,{width,height}))).withMetadata({density:dpi}).png().toBuffer();
}
export async function exportCard(employee: Employee, settings: ExportSettings, companyId: CompanyId = 'gti') {
  const company = getCompany(companyId);
  const card=buildCard(employee, companyId);
  const blocking=card.issues.filter(i=>i.severity==='error'||(i.severity==='warning'&&!settings.acknowledgeQrWarning));
  if(blocking.length)throw new ArtworkValidationError(blocking);
  const scenes=settings.sides==='both'?[card.front,card.back]:[card.front];
  const base=`${company.exportPrefix}_${safeFilename(employee)}_Business_Card`;
  if(settings.format!=='png')return {
    bytes:await scenesToPdf(scenes,settings.format,`${company.shortName} Business Card`),mime:'application/pdf',
    filename:`${base}_${settings.sides==='front'?'Front_':''}${settings.format==='print'?'Print':'Digital'}.pdf`,
  };
  if(settings.sides==='front')return {bytes:await sceneToPng(card.front,settings.dpi),mime:'image/png',filename:`${base}_Front.png`};
  const zip=new JSZip();
  zip.file(`${base}_Front.png`,await sceneToPng(card.front,settings.dpi));
  zip.file(`${base}_Back.png`,await sceneToPng(card.back,settings.dpi));
  return {bytes:await zip.generateAsync({type:'nodebuffer',compression:'DEFLATE'}),mime:'application/zip',filename:`${base}_${settings.dpi}DPI.zip`};
}
