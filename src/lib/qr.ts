import QRCode from 'qrcode';
import { BLACK, WHITE, rectangle, type VectorPath } from './design';
import { type Employee, type Issue } from './employee';
import { serializeVCard } from './vcard';
import { getTemplate } from './templates';
import type { CompanyId } from './company';
type Matrix = ReturnType<typeof QRCode.create>['modules'];
function forEachDarkRun(matrix: Matrix, visit: (row: number, start: number, length: number) => void) {
  for (let row = 0; row < matrix.size; row++) {
    let column = 0;
    while (column < matrix.size) {
      if (!matrix.get(row, column)) { column++; continue; }
      const start = column;
      while (column < matrix.size && matrix.get(row, column)) column++;
      visit(row, start, column - start);
    }
  }
}

// The on-screen QR uses the same encoded runs and quiet zone as the print artwork.
// Integer module coordinates avoid sending a second set of millimetre paths to the browser.
export function qrPreviewSvg(matrix: Matrix, quiet: number, moduleMm: number) {
  const runs: string[] = [];
  forEachDarkRun(matrix, (row, start, length) => runs.push(`M${start} ${row}h${length}v1H${start}z`));
  const size = matrix.size + 2 * quiet;
  const mm = size * moduleMm;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${mm}mm" height="${mm}mm" viewBox="${-quiet} ${-quiet} ${size} ${size}" role="img" aria-label="Business card"><rect x="${-quiet}" y="${-quiet}" width="${size}" height="${size}" fill="white"/><path fill="black" d="${runs.join('')}"/></svg>`;
}
export function createQr(employee: Employee, companyId: CompanyId = 'gti') {
  const DESIGN = getTemplate(companyId).design;
  const payload = serializeVCard(employee, companyId);
  const code = QRCode.create([{ data: Buffer.from(payload, 'utf8'), mode: 'byte' }], { errorCorrectionLevel: DESIGN.qr.errorCorrection });
  const modules = code.modules.size;
  const moduleMm = DESIGN.qr.size / modules;
  const q = DESIGN.qr.quietModules * moduleMm;
  const { x, y, size } = DESIGN.qr;
  const paths: VectorPath[] = [rectangle(x-q, y-q, size+2*q, size+2*q, WHITE)];
  forEachDarkRun(code.modules, (row, start, length) => {
    paths.push(rectangle(x+start*moduleMm,y+row*moduleMm,length*moduleMm,moduleMm,BLACK));
  });
  const issues: Issue[] = [];
  if (moduleMm < DESIGN.qr.minModuleMm) issues.push({field:'qr',severity:'error',code:'qr-too-dense',message:'These contact details make the QR too dense for the approved size. Remove optional QR numbers or disable the QR code.'});
  else if (moduleMm < DESIGN.qr.warnModuleMm) issues.push({field:'qr',severity:'warning',code:'qr-density',message:`This QR has ${modules} modules (${moduleMm.toFixed(3)} mm each). Use 600 DPI and scan a printed proof before ordering. You can reduce density by removing optional QR details.`});
  return { paths, payload, modules, moduleMm, matrix: code.modules, version: code.version, issues };
}
