import type { Font } from 'fontkit';
import type { VectorPath, Color } from './design';
const round = (value: number) => Number(value.toFixed(6));
export function textOutlines(text: string, font: Font, options: { x?: number; right?: number; baseline: number; size: number; trackingEm: number; color: Color; strokeWidth?: number }) {
  const run = font.layout(text);
  const scale = options.size / font.unitsPerEm;
  const tracking = options.trackingEm * options.size;
  const width = run.positions.reduce((sum, p) => sum + p.xAdvance * scale, 0) + Math.max(0, run.glyphs.length - 1) * tracking;
  // Right-align the actual ink, like the outlined Illustrator reference.
  const last = run.glyphs.at(-1); const lastPosition = run.positions.at(-1);
  const lastTrailing = last && lastPosition ? (lastPosition.xAdvance - last.bbox.maxX - lastPosition.xOffset) * scale : 0;
  let cursor = options.right !== undefined ? options.right - width + lastTrailing : (options.x ?? 0);
  const paths: VectorPath[] = [];
  const missing = [...new Set([...text].filter(char => !font.hasGlyphForCodePoint(char.codePointAt(0)!)))];
  run.glyphs.forEach((glyph, i) => {
    const position = run.positions[i];
    const ox = cursor + position.xOffset * scale;
    const oy = options.baseline - position.yOffset * scale;
    const commands: string[] = [];
    for (const command of glyph.path.commands) {
      const args = command.args.map((v, j) => round(j % 2 === 0 ? ox + v * scale : oy - v * scale));
      const operator = ({moveTo:'M',lineTo:'L',bezierCurveTo:'C',quadraticCurveTo:'Q',closePath:'Z'} as Record<string, string>)[command.command];
      if (!operator) throw new Error('Unsupported font outline command.');
      commands.push(operator + args.join(' '));
    }
    if (commands.length) paths.push({ d: commands.join(' '), color: options.color, ...(options.strokeWidth?{paint:'fillStroke' as const,strokeColor:options.color,strokeWidth:options.strokeWidth}: {}) });
    cursor += position.xAdvance * scale + tracking;
  });
  return { paths, width, missing, left: options.right !== undefined ? options.right-width : options.x ?? 0 };
}
