import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { PDFDocument } from 'pdf-lib';
import { COMPANY_IDS } from '../src/lib/company';
import { DEMO_EMPLOYEES } from '../src/lib/demo';
import { exportCard } from '../src/lib/export';
import { previewCard } from '../src/lib/renderer';
const directory=path.join(process.cwd(),'output/verification/companies');
await fs.mkdir(directory,{recursive:true});
for(const companyId of COMPANY_IDS){
  const employee=DEMO_EMPLOYEES[companyId];
  for(const sides of ['front','both'] as const){
    const result=await exportCard(employee,{sides,format:'print',dpi:600,acknowledgeQrWarning:true},companyId);
    await fs.writeFile(path.join(directory,result.filename),result.bytes);
    const document=await PDFDocument.load(result.bytes);
    assert.equal(document.getPageCount(),sides==='front'?1:2);
    for(const page of document.getPages()){assert.ok(Math.abs(page.getWidth()*25.4/72-92)<1e-6);assert.ok(Math.abs(page.getHeight()*25.4/72-57)<1e-6);}
  }
  const preview=previewCard(employee,companyId);
  assert.equal(preview.issues.filter(i=>i.severity==='error').length,0,JSON.stringify(preview.issues));
  await fs.writeFile(path.join(directory,`${companyId}-front.svg`),preview.front);
  await fs.writeFile(path.join(directory,`${companyId}-back.svg`),preview.back);
  await fs.writeFile(path.join(directory,`${companyId}-vcard.vcf`),preview.qr!.payload);
  for(const dpi of [300,600] as const){
    const png=await exportCard(employee,{sides:'front',format:'png',dpi,acknowledgeQrWarning:true},companyId);
    await fs.writeFile(path.join(directory,`${companyId}-${dpi}.png`),png.bytes);
  }
  const digital=await exportCard(employee,{sides:'both',format:'digital',dpi:600,acknowledgeQrWarning:true},companyId);
  await fs.writeFile(path.join(directory,digital.filename),digital.bytes);
  console.log(`${companyId}: print/digital PDF dimensions and pages verified; SVG, fictional vCard and 300/600 DPI PNGs generated.`);
}
