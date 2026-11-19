import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PDFDocument } from 'pdf-lib';
import sharp from 'sharp';
import jsQR from 'jsqr';
import JSZip from 'jszip';
import { EMPTY_EMPLOYEE, employeeSchema, safeFilename, validateEmployee } from '../src/lib/employee';
import { COMPANY } from '../src/lib/company';
import { escapeVCard, foldLine, serializeVCard } from '../src/lib/vcard';
import { buildCard, previewCard, sceneToSvg } from '../src/lib/renderer';
import { exportCard, ArtworkValidationError } from '../src/lib/export';
import { SAMPLE_EMPLOYEE } from './fixtures/demo';
import { readPrivateJson, RequestError } from '../src/lib/http';
const sample=SAMPLE_EMPLOYEE;

test('required fields are enforced; optional phones are not required',()=>{
 assert.equal(validateEmployee(sample).length,0);
 assert.deepEqual(validateEmployee(EMPTY_EMPLOYEE).map(i=>i.field),['firstName','lastName','designation','email']);
});
test('valid international telephone formats and email',()=>{
 for(const mobile of ['+971 50 123 4567','00971 50 000 0000','+1 (212) 555-1234'])assert.equal(validateEmployee({...sample,mobile}).length,0,mobile);
 for(const mobile of ['5551234','+1ABC','+123','+1234567890123456'])assert.ok(validateEmployee({...sample,mobile}).some(i=>i.field==='mobile'),mobile);
 assert.ok(validateEmployee({...sample,email:'invalid@'}).some(i=>i.field==='email'));
});
test('vCard 3.0 has correct first/last structure, defaults, field types and CRLF',()=>{
 const employee={...sample,workPhone:'+971 4 123 4567',extension:'105',companyMobile:'+971 50 111 2222',privatePhone:'+971 50 222 3333',additionalPhone:'+971 50 333 4444',workFax:'+971 4 555 6666',privateFax:'+971 4 666 7777'};
 const card=serializeVCard(employee).replace(/\r\n /g,'');
 for(const expected of ['BEGIN:VCARD\r\nVERSION:3.0','N:Morgan;Alex;;;','FN:Alex Morgan',`ORG:${COMPANY.organization}`,'TITLE:Marketing Manager','EMAIL;TYPE=INTERNET,WORK:alex.morgan@example.com','TEL;TYPE=CELL,VOICE:+971 50 000 0000','TEL;TYPE=WORK,VOICE:+971 4 123 4567 x105','TEL;TYPE=WORK,CELL:+971 50 111 2222','TEL;TYPE=HOME,VOICE:+971 50 222 3333','TEL;TYPE=VOICE:+971 50 333 4444','TEL;TYPE=WORK,FAX:+971 4 555 6666','TEL;TYPE=HOME,FAX:+971 4 666 7777',`URL:https://${COMPANY.website}`,`ADR;TYPE=WORK:61401;;MO 0448\\, R/A No. 13\\, Jebel Ali Free Zone;Dubai;إمارة دبيّ;;United Arab Emirates`,'END:VCARD\r\n'])assert.ok(card.includes(expected),expected);
 assert.ok(!/(?<!\r)\n/.test(serializeVCard(employee)));
});
test('escaping and UTF-8 folding preserve values without splitting characters',()=>{
 assert.equal(escapeVCard('a\\b;c,d\r\ne'), 'a\\\\b\\;c\\,d\\ne');
 const line='FN:'+ 'éع😀'.repeat(60);const folded=foldLine(line);
 for(const piece of folded.split('\r\n'))assert.ok(Buffer.byteLength(piece,'utf8')<=75);
 assert.equal(folded.replace(/\r\n /g,''),line);
 const unicode=serializeVCard({...sample,firstName:'José',lastName:'Müller'});
 assert.ok(unicode.includes('N:Müller;José;;;'));
});
test('unused optional properties are omitted and company telephone is selectable',()=>{
 const text=serializeVCard({...sample,includeCompanyPhone:false});
 assert.ok(!text.includes(COMPANY.telephone));assert.ok(!text.includes('HOME'));assert.ok(!text.includes('FAX'));
 assert.ok(!text.includes('undefined'));assert.ok(!text.includes('null'));
});
test('names, designation and contact overflow are detected without truncation',()=>{
 const longName=buildCard({...sample,firstName:'Alexanderson '.repeat(12)});
 assert.ok(longName.issues.some(i=>i.code==='overflow-firstName'));
 assert.ok(longName.nameScale>=.9);
 const longTitle=buildCard({...sample,designation:'Regional Sales & Distribution Director '.repeat(4)});
 assert.ok(longTitle.issues.some(i=>i.code==='overflow-designation'));
 const longEmail=buildCard({...sample,email:'a'.repeat(100)+'@gulbahartobacco.com'});
 assert.ok(longEmail.issues.some(i=>i.code==='overflow-email'));
 for(const designation of ['Marketing Manager','Marketing Manager','Senior Business Development Manager','Regional Sales & Distribution Director'])assert.ok(!buildCard({...sample,designation}).issues.some(i=>i.code==='overflow-designation'));
});
test('supported accents render; unsupported characters are reported without font substitution',()=>{
 assert.ok(!buildCard({...sample,firstName:'José',lastName:'Müller'}).issues.some(i=>i.code.startsWith('glyph-')));
 assert.ok(buildCard({...sample,firstName:'محمد'}).issues.some(i=>i.code==='glyph-firstName'));
});
test('missing optional mobile omits its label and separator',()=>{
 const none={...sample,mobile:'',includeQr:false};assert.equal(validateEmployee(none).length,0);
 assert.equal(buildCard(none).issues.filter(i=>i.severity==='error').length,0);
 assert.ok(serializeVCard(none).includes(`TEL;TYPE=WORK,VOICE:${COMPANY.telephone}`));
});
test('changing primary mobile changes printed artwork; all numbers stay in QR',()=>{
 const employee={...sample,companyMobile:'+971 50 111 2222'};
 assert.notEqual(sceneToSvg(buildCard(employee).front),sceneToSvg(buildCard({...employee,primaryMobile:'companyMobile'}).front));
 assert.ok(serializeVCard(employee).includes(employee.companyMobile));
 assert.ok(validateEmployee({...employee,primaryMobile:'privatePhone'}).some(i=>i.field==='primaryMobile'));
});
test('QR toggle changes only front QR paths; reverse stays fixed',()=>{
 const a=buildCard(sample),b=buildCard({...sample,includeQr:false});
 assert.ok(a.front.paths.length>b.front.paths.length);assert.deepEqual(a.back,b.back);
 assert.deepEqual(a.back,buildCard({...sample,firstName:'Jane',lastName:'Doe'}).back);
});
test('QR decodes from actual full-card PNG at 300 and 600 DPI',async()=>{
 for(const dpi of [300,600] as const){
  const exported=await exportCard(sample,{sides:'front',format:'png',dpi,acknowledgeQrWarning:true});
  const {data,info}=await sharp(exported.bytes).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  assert.equal(info.width,Math.round(92/25.4*dpi));assert.equal(info.height,Math.round(57/25.4*dpi));
  const decoded=jsQR(new Uint8ClampedArray(data),info.width,info.height);
  assert.ok(decoded,`QR should decode at ${dpi} DPI`);assert.equal(decoded.data,serializeVCard(sample));
 }
});
test('international names and optional contacts decode without corrupting UTF-8',async()=>{
 const employee={...sample,firstName:'José',lastName:'Müller',designation:'Senior Business Development Manager',workPhone:'+971 4 123 4567',companyMobile:'+971 50 111 2222',includeCompanyPhone:false};
 const preview=previewCard(employee);assert.ok(preview.qr);
 const {data,info}=await sharp(Buffer.from(preview.qr.svg.replace(/width="[^"]+" height="[^"]+"/, 'width="500" height="500"'))).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 assert.equal(jsQR(new Uint8ClampedArray(data),info.width,info.height)?.data,serializeVCard(employee));
});
test('QR density warnings require acknowledgment; excessive density blocks export',async()=>{
 await assert.rejects(exportCard(sample,{format:'print',sides:'front',dpi:600,acknowledgeQrWarning:false}),ArtworkValidationError);
 const employee={...sample,designation:'A'.repeat(150),email:'a'.repeat(200)+'@test.com',firstName:'A'.repeat(100),lastName:'B'.repeat(100),privatePhone:'+971 50 111 2222',additionalPhone:'+971 50 222 3333',workFax:'+971 4 111 2222',privateFax:'+971 4 333 4444'};
 assert.ok(buildCard(employee).issues.some(i=>i.code==='qr-too-dense'));
});
test('front-only and duplex PDFs have exact page count and dimensions',async()=>{
 for(const sides of ['front','both'] as const){
  const output=await exportCard(sample,{format:'print',sides,dpi:600,acknowledgeQrWarning:true});
  const pdf=await PDFDocument.load(output.bytes);assert.equal(pdf.getPageCount(),sides==='front'?1:2);
  for(const page of pdf.getPages()){assert.ok(Math.abs(page.getWidth()*25.4/72-92)<1e-6);assert.ok(Math.abs(page.getHeight()*25.4/72-57)<1e-6);}
 }
});
test('duplex PNG contains two separate files, with DPI metadata',async()=>{
 const output=await exportCard(sample,{format:'png',sides:'both',dpi:300,acknowledgeQrWarning:true});assert.equal(output.mime,'application/zip');
 const zip=await JSZip.loadAsync(output.bytes);const names=Object.keys(zip.files);assert.equal(names.length,2);
 assert.ok(names.some(n=>n.endsWith('_Front.png')));assert.ok(names.some(n=>n.endsWith('_Back.png')));
 for(const file of Object.values(zip.files)){const metadata=await sharp(await file.async('nodebuffer')).metadata();assert.equal(metadata.density,300);}
});
test('invalid details cannot be exported',async()=>{
 await assert.rejects(exportCard({...sample,email:'invalid'},{format:'print',sides:'both',dpi:600,acknowledgeQrWarning:true}),ArtworkValidationError);
});
test('filename sanitization cannot escape the download directory',()=>{
 const name=safeFilename({...sample,firstName:'../../José',lastName:'A\\B:"<>|?*'});
 assert.equal(name,'Jose_A_B');assert.ok(!name.includes('/'));assert.ok(!name.includes('\\'));
});
test('schema limits input and does not permit company configuration overrides',()=>{
 assert.ok(!employeeSchema.safeParse({...sample,firstName:'a'.repeat(161)}).success);
 assert.ok(!employeeSchema.safeParse({...sample,firstName:'a\nb'}).success);
 const parsed=employeeSchema.parse({...sample,company:{telephone:'fake'}});assert.ok(!('company' in parsed));
});
test('API rejects foreign origins and oversized requests',async()=>{
 const request=new Request('http://localhost:3000/api/render',{method:'POST',headers:{origin:'https://external.test','content-type':'application/json'},body:'{}'});
 await assert.rejects(readPrivateJson(request),(e:unknown)=>e instanceof RequestError&&e.status===403);
 const large=new Request('http://localhost:3000/api/render',{method:'POST',headers:{'content-type':'application/json'},body:'a'.repeat(17_000)});
 await assert.rejects(readPrivateJson(large),(e:unknown)=>e instanceof RequestError&&e.status===413);
});
