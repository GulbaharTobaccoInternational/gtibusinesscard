import { DESIGN, ptToMm } from './design';
import type { CompanyId } from './company';
export const DOUBLE_LEAF_DESIGN = {
  widthMm: 92, heightMm: 57,
  name: { x: ptToMm(22.3108), baseline: ptToMm(42.4329), size: ptToMm(13), trackingEm: 0, maxRight: 70.8, minScale: .9, strokeWidth: ptToMm(.25) },
  designation: { x: 8.119845, baseline: 18.911605, size: 2.47, trackingEm: .005, maxRight: 70.8 },
  email: { x: 37.657241, baseline: 30.664532, size: 2.47, trackingEm: .005, maxRight: 84.25 },
  telephone: { x: 37.671295, baseline: 33.62854, size: 2.47, trackingEm: .005, maxRight: 84.25 },
  qr: { x: 7.731831, y: 31.035978, size: 14.621228, quietModules: 4, minModuleMm: .16, warnModuleMm: .22, errorCorrection: 'L' as const },
} as const;
export const TEMPLATES = {
  gti: { design: DESIGN, artwork: 'source-artwork.json', fonts: { name: 'Gotham-Bold.otf', designation: 'Gotham-Bold.otf', contact: 'GothamBook.ttf' }, fontLabel: 'Gotham', headerViewBox: '5.7 7 17.2 12' },
  doubleLeaf: { design: DOUBLE_LEAF_DESIGN, artwork: 'source-artwork-double-leaf.json', fonts: { name: 'KULDIPA2.TTF', designation: 'GeneralSans-Semibold.otf', contact: 'GeneralSans-Regular.otf' }, fontLabel: 'KULDIPA2 / General Sans', headerViewBox: '73.25 9.1 11.1 11.1' },
} as const;
export const getTemplate = (id: CompanyId = 'gti') => TEMPLATES[id];
