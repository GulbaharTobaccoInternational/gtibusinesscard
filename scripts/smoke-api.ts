import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';
import sharp from 'sharp';
import { SAMPLE_EMPLOYEE as employee } from '../tests/fixtures/liwaa';
const base=process.env.GULBAHAR_TEST_URL??'http://127.0.0.1:3107';
const post=(route:string,body:unknown,origin=base)=>fetch(base+route,{method:'POST',headers:{'Content-Type':'application/json',Origin:origin},body:JSON.stringify(body)});
const page=await fetch(base);assert.equal(page.status,200);assert.ok((await page.text()).includes('Business Card Generator'));
for(const privatePath of ['/private/assets/Gotham-Bold.otf','/private/assets/GothamBook.ttf'])assert.equal((await fetch(base+privatePath)).status,404);
const preview=await post('/api/render',employee);assert.equal(preview.status,200);assert.match(preview.headers.get('Cache-Control')??'',/no-store/);const result=await preview.json();assert.ok(result.front.includes('<path'));assert.ok(!result.front.includes('<text'));assert.ok(result.qr.payload.includes('N:Sahib;Liwaa;;;'));
assert.equal((await post('/api/render',employee,'https://unrelated.test')).status,403);
assert.equal((await post('/api/export',{employee:{...employee,email:'invalid'},settings:{format:'print',sides:'both',dpi:600,acknowledgeQrWarning:true}})).status,422);
for(const sides of ['front','both']){
 const response=await post('/api/export',{employee,settings:{format:'print',sides,dpi:600,acknowledgeQrWarning:true}});assert.equal(response.status,200);assert.equal(response.headers.get('Content-Type'),'application/pdf');
 const bytes=new Uint8Array(await response.arrayBuffer());const doc=await PDFDocument.load(bytes);assert.equal(doc.getPageCount(),sides==='front'?1:2);
 await fs.writeFile(`output/verification/api-${sides}.pdf`,bytes);
}
const png=await post('/api/export',{employee,settings:{format:'png',sides:'both',dpi:600,acknowledgeQrWarning:true}});assert.equal(png.status,200);const zip=await JSZip.loadAsync(await png.arrayBuffer());assert.equal(Object.keys(zip.files).length,2);for(const file of Object.values(zip.files)){const metadata=await sharp(await file.async('nodebuffer')).metadata();assert.equal(metadata.width,2173);assert.equal(metadata.height,1346);assert.equal(metadata.density,600);}
console.log('Production HTTP smoke checks passed: page, private-font protection, same-origin preview, no-store responses, invalid-export blocking, one/two-page PDFs and duplex PNG ZIP.');
