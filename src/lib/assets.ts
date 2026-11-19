import fs from 'node:fs';
import path from 'node:path';
import { create, type Font } from 'fontkit';
import type { VectorPath, Color } from './design';
export type Artwork = { front: VectorPath[]; back: VectorPath[]; referenceBounds: Record<string, number[]>; referenceColors: { name: Color; contact: Color } };
let cache: { artwork: Artwork; bold: Font; book: Font } | undefined;
export function getAssets() {
  if (!cache) {
    const root = path.join(process.cwd(), 'private/assets');
    try {
      cache = {
        artwork: JSON.parse(fs.readFileSync(path.join(root, 'source-artwork.json'), 'utf8')),
        bold: create(fs.readFileSync(path.join(root, 'Gotham-Bold.otf'))) as Font,
        book: create(fs.readFileSync(path.join(root, 'GothamBook.ttf'))) as Font,
      };
    } catch { throw new Error('Required official artwork or Gotham fonts are unavailable. Ask your administrator to install private/assets before generating cards.'); }
  }
  return cache;
}
