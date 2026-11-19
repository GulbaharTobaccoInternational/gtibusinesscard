import QRCode from 'qrcode';
import { BLACK, WHITE, DESIGN, rectangle, type VectorPath } from './design';
import { type Employee, type Issue } from './employee';
import { serializeVCard } from './vcard';
export function createQr(employee: Employee) {
  const payload = serializeVCard(employee);
  const code = QRCode.create([{ data: Buffer.from(payload, 'utf8'), mode: 'byte' }], { errorCorrectionLevel: DESIGN.qr.errorCorrection });
  const modules = code.modules.size;
  const moduleMm = DESIGN.qr.size / modules;
  const q = DESIGN.qr.quietModules * moduleMm;
  const { x, y, size } = DESIGN.qr;
  const paths: VectorPath[] = [rectangle(x-q, y-q, size+2*q, size+2*q, WHITE)];
  // Join contiguous modules by row, retaining square geometry and exact positions.
  for (let row=0;row<modules;row++) {
    let column=0;
    while (column<modules) {
      if (!code.modules.get(row,column)) { column++; continue; }
      const start=column;
      while (column<modules && code.modules.get(row,column)) column++;
      paths.push(rectangle(x+start*moduleMm,y+row*moduleMm,(column-start)*moduleMm,moduleMm,BLACK));
    }
  }
  const issues: Issue[] = [];
  if (moduleMm < DESIGN.qr.minModuleMm) issues.push({field:'qr',severity:'error',code:'qr-too-dense',message:'These contact details make the QR too dense for the approved size. Remove optional QR numbers or disable the QR code.'});
  else if (moduleMm < DESIGN.qr.warnModuleMm) issues.push({field:'qr',severity:'warning',code:'qr-density',message:`This QR has ${modules} modules (${moduleMm.toFixed(3)} mm each). Use 600 DPI and scan a printed proof before ordering. You can reduce density by removing optional QR details.`});
  return { paths, payload, modules, moduleMm, version: code.version, issues };
}
