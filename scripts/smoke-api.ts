import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';
import sharp from 'sharp';
import jsQR from 'jsqr';
import { COMPANY_IDS, COMPANIES } from '../src/lib/company';
import { DEMO_EMPLOYEES } from '../src/lib/demo';
import { serializeVCard } from '../src/lib/vcard';
const base=process.env.GULBAHAR_TEST_URL??'http://127.0.0.1:3107';
const cookieFile=process.env.GULBAHAR_TEST_COOKIE_FILE;
if(!cookieFile)throw new Error('Provide GULBAHAR_TEST_COOKIE_FILE containing a private, authenticated QA cookie header.');
const cookie=(await fs.readFile(cookieFile,'utf8')).trim();
const post=(route:string,body:unknown,origin=base)=>fetch(base+route,{method:'POST',headers:{'Content-Type':'application/json',Origin:origin,Cookie:cookie},body:JSON.stringify(body)});
await fs.mkdir('output/verification/companies',{recursive:true});
assert.equal((await fetch(base,{redirect:'manual'})).status,307);
assert.equal((await fetch(base+'/api/render',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'})).status,401);
const page=await fetch(base,{headers:{Cookie:cookie}});assert.equal(page.status,200);const html=await page.text();assert.ok(html.includes('Mr Ghashi'));assert.ok(html.replace(/<[^>]*>/g,'').includes('An Internal Web Application by GTI Marketing Department'));assert.ok(html.includes('Additional QR / vCard Details'));assert.ok(html.includes('Double Leaf'));
assert.ok(html.includes('Love our digital upgrade?'));assert.ok(html.includes('Give GTI Marketing Team some credit!'));assert.ok(html.includes('Gulbahar Tobacco International'));
for(const label of ['Applause','Great Job','Coffee Treat','Hats Off'])assert.ok(html.includes(`aria-label="${label}"`));
for(const removed of ['Your next introduction.','Number printed on card','Your details stay in this session.','Zoom out','Zoom in','Official business card template','Give credit'])assert.ok(!html.includes(removed),`Removed UI text remains: ${removed}`);
assert.match(html,/<link[^>]+href="\/favicon\.ico\?[^" ]+"/);
for(const [path,size] of [['/brand/favicon-16x16.png',16],['/brand/favicon-32x32.png',32],['/brand/apple-touch-icon.png',180]] as const){const icon=await fetch(base+path);assert.equal(icon.status,200);const metadata=await sharp(await icon.arrayBuffer()).metadata();assert.equal(metadata.width,size);assert.equal(metadata.height,size);assert.equal(metadata.hasAlpha,true);}
assert.equal((await fetch(base+'/favicon.ico')).status,200);
for(const name of ['Gotham-Bold.otf','GothamBook.ttf','KULDIPA2.TTF','GeneralSans-Semibold.otf','GeneralSans-Regular.otf'])assert.equal((await fetch(base+'/private/assets/'+name)).status,404);
// Preserve the original raw-employee API contract.
assert.equal((await post('/api/render',DEMO_EMPLOYEES.gti)).status,200);
assert.equal((await post('/api/render',{companyId:'unknown',employee:DEMO_EMPLOYEES.gti})).status,400);
assert.equal((await post('/api/render',DEMO_EMPLOYEES.gti,'https://unrelated.test')).status,403);
for(const companyId of COMPANY_IDS){
 // Smoke checks must not send appreciation email as a side effect.
 const feedback=await post('/api/feedback',{reactionId:'invalid',companyId,submissionId:crypto.randomUUID()});assert.equal(feedback.status,400);
 const employee=DEMO_EMPLOYEES[companyId];
 const preview=await post('/api/render',{companyId,employee});assert.equal(preview.status,200);assert.match(preview.headers.get('Cache-Control')??'',/no-store/);const result=await preview.json();assert.equal(result.companyId,companyId);assert.ok(result.front.includes('<path'));assert.ok(!result.front.includes('<text'));assert.equal(result.qr.payload,serializeVCard(employee,companyId));
 assert.equal((await post('/api/export',{companyId,employee:{...employee,email:'invalid'},settings:{format:'print',sides:'both',dpi:600,acknowledgeQrWarning:true}})).status,422);
 for(const format of ['print','digital'])for(const sides of ['front','both']){
  const response=await post('/api/export',{companyId,employee,settings:{format,sides,dpi:600,acknowledgeQrWarning:true}});assert.equal(response.status,200);assert.equal(response.headers.get('Content-Type'),'application/pdf');assert.ok(response.headers.get('Content-Disposition')!.includes(COMPANIES[companyId].exportPrefix+'_'));
  const bytes=new Uint8Array(await response.arrayBuffer());const doc=await PDFDocument.load(bytes);assert.equal(doc.getPageCount(),sides==='front'?1:2);for(const p of doc.getPages()){assert.ok(Math.abs(p.getWidth()*25.4/72-92)<1e-6);assert.ok(Math.abs(p.getHeight()*25.4/72-57)<1e-6);}
  await fs.writeFile(`output/verification/companies/api-${companyId}-${format}-${sides}.pdf`,bytes);
 }
 for(const dpi of [300,600]){
  const png=await post('/api/export',{companyId,employee,settings:{format:'png',sides:'both',dpi,acknowledgeQrWarning:true}});assert.equal(png.status,200);const zip=await JSZip.loadAsync(await png.arrayBuffer());assert.equal(Object.keys(zip.files).length,2);
  for(const file of Object.values(zip.files)){assert.ok(file.name.startsWith(COMPANIES[companyId].exportPrefix+'_'));const bytes=await file.async('nodebuffer');const metadata=await sharp(bytes).metadata();assert.equal(metadata.width,Math.round(92*dpi/25.4));assert.equal(metadata.height,Math.round(57*dpi/25.4));assert.equal(metadata.density,dpi);
   if(file.name.endsWith('_Front.png')){const {data,info}=await sharp(bytes).ensureAlpha().raw().toBuffer({resolveWithObject:true});assert.equal(jsQR(new Uint8ClampedArray(data),info.width,info.height)?.data,serializeVCard(employee,companyId));}
  }
 }
 console.log(`${companyId}: HTTP preview, company vCard, export validation, print/digital page counts, PNG ZIP at 300/600 DPI and actual QR decoding passed.`);
}
console.log('Private fonts return 404; legacy API, unknown-company rejection, same-origin protection and no-store responses passed.');
