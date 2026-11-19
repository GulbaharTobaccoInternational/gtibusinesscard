import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { PDFDocument } from 'pdf-lib';
import { SAMPLE_EMPLOYEE } from '../tests/fixtures/liwaa';
import { exportCard } from '../src/lib/export';
import { previewCard } from '../src/lib/renderer';
const directory=path.join(process.cwd(),'output/verification');
await fs.mkdir(directory,{recursive:true});
for(const sides of ['front','both'] as const){
  const result=await exportCard(SAMPLE_EMPLOYEE,{sides,format:'print',dpi:600,acknowledgeQrWarning:true});
  await fs.writeFile(path.join(directory,result.filename),result.bytes);
  const document=await PDFDocument.load(result.bytes);
  assert.equal(document.getPageCount(),sides==='front'?1:2);
  for(const page of document.getPages()){assert.ok(Math.abs(page.getWidth()*25.4/72-92)<1e-6);assert.ok(Math.abs(page.getHeight()*25.4/72-57)<1e-6);}
}
const preview=previewCard(SAMPLE_EMPLOYEE);
assert.equal(preview.issues.filter(i=>i.severity==='error').length,0,JSON.stringify(preview.issues));
await fs.writeFile(path.join(directory,'sample-front.svg'),preview.front);
await fs.writeFile(path.join(directory,'sample-back.svg'),preview.back);
await fs.writeFile(path.join(directory,'sample-vcard.vcf'),preview.qr!.payload);
for(const dpi of [300,600] as const){
  const png=await exportCard(SAMPLE_EMPLOYEE,{sides:'front',format:'png',dpi,acknowledgeQrWarning:true});
  await fs.writeFile(path.join(directory,`sample-${dpi}.png`),png.bytes);
}
const digital=await exportCard(SAMPLE_EMPLOYEE,{sides:'both',format:'digital',dpi:600,acknowledgeQrWarning:true});
await fs.writeFile(path.join(directory,digital.filename),digital.bytes);
console.log('Verified one/two-page PDF dimensions and generated print, digital and 300/600 DPI PNG fixtures.');
console.log('QR:',{modules:preview.qr!.modules,moduleMm:preview.qr!.moduleMm,issues:preview.issues});
