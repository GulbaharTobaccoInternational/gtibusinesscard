import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { PDFDocument, PDFName, PDFDict } from 'pdf-lib';
import sharp from 'sharp';
import jsQR from 'jsqr';
import JSZip from 'jszip';
import { COMPANY_IDS, COMPANIES, companyIdSchema } from '../src/lib/company';
import { DEMO_EMPLOYEES, isDemoEmployee } from '../src/lib/demo';
import { buildCard, sceneToSvg, previewCard } from '../src/lib/renderer';
import { exportCard, exportRequestSchema } from '../src/lib/export';
import { serializeVCard } from '../src/lib/vcard';
import { DOUBLE_LEAF_DESIGN } from '../src/lib/templates';
import baseline from './fixtures/gti-approved-digests.json';
const hash=(data:unknown)=>crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');

test('approved GTI scenes, SVGs and QR serialization remain byte-for-byte unchanged',()=>{
  const card=buildCard(DEMO_EMPLOYEES.gti,'gti');
  assert.equal(hash(card.front),baseline.front);assert.equal(hash(card.back),baseline.back);
  assert.equal(hash(sceneToSvg(card.front)),baseline.frontSvg);assert.equal(hash(sceneToSvg(card.back)),baseline.backSvg);
  assert.equal(crypto.createHash('sha256').update(card.qr!.payload).digest('hex'),baseline.vcard);
});
test('the registry permits exactly the two supported companies and rejects unknown IDs',()=>{
  assert.deepEqual(COMPANY_IDS,['gti','doubleLeaf']);assert.ok(!companyIdSchema.safeParse('unknown').success);
  assert.ok(!exportRequestSchema.safeParse({companyId:'unknown',employee:DEMO_EMPLOYEES.gti,settings:{format:'print'}}).success);
});
test('demo records are fictional, company-specific, and recognized only while their identity data matches',()=>{
  assert.equal(DEMO_EMPLOYEES.gti.firstName,'Alex');assert.equal(DEMO_EMPLOYEES.gti.lastName,'Morgan');
  assert.equal(DEMO_EMPLOYEES.doubleLeaf.firstName,'Jordan');assert.equal(DEMO_EMPLOYEES.doubleLeaf.lastName,'Taylor');
  for(const id of COMPANY_IDS){const employee=DEMO_EMPLOYEES[id];assert.ok(employee.email.endsWith('@example.com'));assert.equal(employee.mobile,'+971 50 000 0000');assert.ok(isDemoEmployee(employee,id));assert.ok(!isDemoEmployee({...employee,firstName:'Changed'},id));}
});
test('Double Leaf vCard contains only Double Leaf corporate information and never a guessed office number',()=>{
  const text=serializeVCard(DEMO_EMPLOYEES.doubleLeaf,'doubleLeaf').replace(/\r\n /g,'');
  for(const value of ['N:Taylor;Jordan;;;','FN:Jordan Taylor','ORG:DOUBLE LEAF FZE','TITLE:Operations Coordinator','jordan.taylor@example.com','URL:https://www.doubleleaf.ae','Plot No. B054R03\\, JAFZA North\\, Jebel Ali Free Zone','Dubai','United Arab Emirates'])assert.ok(text.includes(value),value);
  assert.equal(COMPANIES.doubleLeaf.telephone,'');assert.ok(!text.includes(COMPANIES.gti.telephone));assert.ok(!text.includes('gulbahar'));assert.ok(!text.includes('TEL;TYPE=WORK,VOICE:'));
  assert.ok(serializeVCard({...DEMO_EMPLOYEES.doubleLeaf,workPhone:'+971 4 000 0000'},'doubleLeaf').includes('TEL;TYPE=WORK,VOICE:+971 4 000 0000'));
});
test('the same employee never mixes brand artwork or QR corporate data between companies',()=>{
  const employee=DEMO_EMPLOYEES.gti;
  const gti=buildCard(employee,'gti'),dl=buildCard(employee,'doubleLeaf');
  assert.notDeepEqual(gti.front,dl.front);assert.notDeepEqual(gti.back,dl.back);
  assert.ok(gti.qr!.payload.includes('Gulbahar Tobacco International FZE'));assert.ok(!gti.qr!.payload.includes('DOUBLE LEAF'));
  assert.ok(dl.qr!.payload.includes('DOUBLE LEAF FZE'));assert.ok(!dl.qr!.payload.includes('Gulbahar'));
  assert.equal(previewCard(employee,'doubleLeaf').companyId,'doubleLeaf');
});
test('Double Leaf uses original stroked KULDIPA2 glyph paths and its separate lower-left QR',()=>{
  const dl=buildCard(DEMO_EMPLOYEES.doubleLeaf,'doubleLeaf');
  assert.ok(dl.front.paths.some(p=>p.paint==='fillStroke'&&p.strokeWidth===DOUBLE_LEAF_DESIGN.name.strokeWidth));
  assert.ok(dl.qr);assert.ok(DOUBLE_LEAF_DESIGN.qr.x<10&&DOUBLE_LEAF_DESIGN.qr.y>30);
  const quiet=dl.qr.paths[0].d;assert.ok(quiet.startsWith('M7.')||quiet.startsWith('M6.'));
  assert.deepEqual(dl.back,buildCard({...DEMO_EMPLOYEES.doubleLeaf,firstName:'Different'},'doubleLeaf').back);
});
test('Double Leaf name, designation and contact overflow block export without clipping or substitution',()=>{
  for(const [field,value]of [['firstName','Longfirstname '.repeat(14)],['designation','Long designation '.repeat(12)],['email','a'.repeat(100)+'@example.com']] as const){assert.ok(buildCard({...DEMO_EMPLOYEES.doubleLeaf,[field]:value},'doubleLeaf').issues.some(i=>i.severity==='error'&&i.code.startsWith('overflow-')));}
  assert.ok(buildCard({...DEMO_EMPLOYEES.doubleLeaf,firstName:'محمد'},'doubleLeaf').issues.some(i=>i.code==='glyph-firstName'));
});
test('GTI retains its approved work-phone-only validation behavior',()=>{
  const employee={...DEMO_EMPLOYEES.gti,mobile:'',workPhone:'+971 4 000 0000'};
  assert.ok(!buildCard(employee,'gti').issues.some(i=>i.code==='invalid-primaryMobile'));
  assert.ok(buildCard(employee,'doubleLeaf').issues.some(i=>i.code==='invalid-primaryMobile'));
});
test('Double Leaf direct work phone can be printed without inventing a main company line',()=>{
  const e={...DEMO_EMPLOYEES.doubleLeaf,mobile:'',workPhone:'+971 4 000 0000',primaryMobile:'workPhone' as const};
  assert.equal(buildCard(e,'doubleLeaf').issues.filter(i=>i.severity==='error').length,0);
  assert.notEqual(sceneToSvg(buildCard(e,'doubleLeaf').front),sceneToSvg(buildCard({...e,primaryMobile:'none'},'doubleLeaf').front));
});
for(const companyId of COMPANY_IDS){
  test(`${companyId}: both PDF modes have exact page counts, vector resources and company filenames`,async()=>{
    for(const sides of ['front','both'] as const){
      const file=await exportCard(DEMO_EMPLOYEES[companyId],{sides,format:'print',dpi:600,acknowledgeQrWarning:true},companyId);
      assert.ok(file.filename.startsWith(COMPANIES[companyId].exportPrefix+'_'));
      const pdf=await PDFDocument.load(file.bytes);assert.equal(pdf.getPageCount(),sides==='front'?1:2);
      for(const page of pdf.getPages()){assert.ok(Math.abs(page.getWidth()*25.4/72-92)<1e-6);assert.ok(Math.abs(page.getHeight()*25.4/72-57)<1e-6);const fonts=page.node.Resources()?.get(PDFName.of('Font'));assert.ok(!fonts||(fonts instanceof PDFDict&&fonts.keys().length===0),'No live font resources');const images=page.node.Resources()?.get(PDFName.of('XObject'));assert.ok(!images||(images instanceof PDFDict&&images.keys().length===0),'No raster image resources');}
    }
  });
  test(`${companyId}: actual full-card QR decodes at 300 and 600 DPI`,async()=>{
    for(const dpi of [300,600] as const){
      const file=await exportCard(DEMO_EMPLOYEES[companyId],{sides:'front',format:'png',dpi,acknowledgeQrWarning:true},companyId);
      const {data,info}=await sharp(file.bytes).ensureAlpha().raw().toBuffer({resolveWithObject:true});
      assert.equal(jsQR(new Uint8ClampedArray(data),info.width,info.height)?.data,serializeVCard(DEMO_EMPLOYEES[companyId],companyId));
    }
  });
  test(`${companyId}: digital PDF and PNG ZIP retain both separate sides`,async()=>{
    const pdf=await exportCard(DEMO_EMPLOYEES[companyId],{sides:'both',format:'digital',dpi:600,acknowledgeQrWarning:true},companyId);assert.equal((await PDFDocument.load(pdf.bytes)).getPageCount(),2);
    const file=await exportCard(DEMO_EMPLOYEES[companyId],{sides:'both',format:'png',dpi:300,acknowledgeQrWarning:true},companyId);const zip=await JSZip.loadAsync(file.bytes);const names=Object.keys(zip.files);assert.equal(names.length,2);assert.ok(names.every(n=>n.startsWith(COMPANIES[companyId].exportPrefix+'_')));assert.ok(names.some(n=>n.endsWith('_Front.png'))&&names.some(n=>n.endsWith('_Back.png')));
  });
}
