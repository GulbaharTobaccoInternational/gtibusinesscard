import fs from 'node:fs';
import path from 'node:path';
import { create, type Font } from 'fontkit';
import type { VectorPath, Color } from './design';
import type { CompanyId } from './company';
import { getTemplate } from './templates';
export type Artwork = { front: VectorPath[]; back: VectorPath[]; referenceBounds: Record<string, number[]>; referenceColors: { name: Color; designation?: Color; contact: Color } };
export type Assets = { artwork: Artwork; fonts: Record<'name'|'designation'|'contact', Font> };
const cache = new Map<CompanyId, Assets>();
const fontCache = new Map<string, Font>();
export function getAssets(companyId: CompanyId = 'gti'): Assets {
  const cached = cache.get(companyId); if (cached) return cached;
  const root = path.join(process.cwd(), 'private/assets');
  const template = getTemplate(companyId);
  try {
    const loadFont = (name: string) => {
      let font = fontCache.get(name);
      if (!font) { font = create(fs.readFileSync(path.join(root, name))) as Font; fontCache.set(name, font); }
      return font;
    };
    const result: Assets = {
      artwork: JSON.parse(fs.readFileSync(path.join(root, template.artwork), 'utf8')),
      fonts: { name: loadFont(template.fonts.name), designation: loadFont(template.fonts.designation), contact: loadFont(template.fonts.contact) },
    };
    cache.set(companyId, result); return result;
  } catch { throw new Error(`Required official ${companyId} artwork or fonts are unavailable. Ask your administrator to provision the approved private assets.`); }
}
export function brandSvg(companyId: CompanyId) {
  const paths = getAssets(companyId).artwork.front.filter(p => p.sourceIndex !== undefined && (companyId === 'gti' ? p.sourceIndex >= 3 && p.sourceIndex <= 28 : p.bounds && p.bounds[0] > 73 && p.bounds[1] < 21));
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${getTemplate(companyId).headerViewBox}" aria-hidden="true">${paths.filter(p=>p.paint!=='stroke').map(p=>`<path fill="rgb(${p.color.rgb.map(v=>Math.round(v*255)).join(' ')})" d="${p.d}"/>`).join('')}</svg>`;
}
