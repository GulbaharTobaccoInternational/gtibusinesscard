export const MM_TO_PT = 72 / 25.4;
export const ptToMm = (pt: number) => pt / MM_TO_PT;
/** Coordinates are taken from the approved PDF, with the origin at top left. */
export const DESIGN = Object.freeze({
  widthMm: 92, heightMm: 57,
  name: { x: ptToMm(16.0508), baseline: ptToMm(80.1727), size: ptToMm(7.937), trackingEm: .013, maxRight: 86.3, minScale: .9 },
  designation: { x: ptToMm(16.0508), baseline: ptToMm(87.3943), size: ptToMm(5.9528), trackingEm: .002, maxRight: 86.3 },
  email: { right: ptToMm(244.4424), baseline: ptToMm(112.0984), size: ptToMm(5.9528), trackingEm: .004, minLeft: 12 },
  telephone: { right: ptToMm(244.5557), baseline: ptToMm(119.3430), size: ptToMm(5.9528), trackingEm: .004, minLeft: 12 },
  qr: { x: 71.568731, y: 7.162445, size: 14.661094, quietModules: 4, minModuleMm: .16, warnModuleMm: .22, errorCorrection: 'L' as const },
});
export type Color = { kind: 'cmyk' | 'rgb' | 'spot'; values?: number[]; rgb: number[]; name?: string; lab?: number[]; tint?: number };
export type VectorPath = { d: string; color: Color; bounds?: number[]; sourceIndex?: number };
export type Scene = { widthMm: number; heightMm: number; paths: VectorPath[] };
export const BLACK: Color = { kind: 'cmyk', values: [0,0,0,1], rgb: [0,0,0] };
export const WHITE: Color = { kind: 'cmyk', values: [0,0,0,0], rgb: [1,1,1] };
export function rectangle(x: number, y: number, width: number, height: number, color: Color): VectorPath {
  return { d: `M${x} ${y}L${x+width} ${y}L${x+width} ${y+height}L${x} ${y+height}Z`, color };
}
