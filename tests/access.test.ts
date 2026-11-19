import {test} from 'node:test';
import assert from 'node:assert/strict';
import { emailSchema, userFieldsSchema, newUserSchema, canUseCompany } from '../src/lib/access';
import { requireSameOrigin } from '../src/server/access';

test('emails normalize case and whitespace and reject injection',()=>{
  assert.equal(emailSchema.parse(' Fadl@GulbaharTobacco.com '),'fadl@gulbahartobacco.com');
  assert.equal(emailSchema.safeParse('a@example.com\r\nBcc: bad@example.com').success,false);
});
test('access schemas reject privilege-shaped extra fields and require company access; admins always have both',()=>{
  const fields={full_name:' Test User ',role:'employee',status:'active',allowed_companies:['gti']};
  assert.equal(userFieldsSchema.parse(fields).full_name,'Test User');
  assert.deepEqual(userFieldsSchema.parse({...fields,role:'admin'}).allowed_companies,['gti','doubleLeaf']);
  for(const value of [{...fields,role:'owner'},{...fields,status:'pending'},{...fields,allowed_companies:[]},{...fields,allowed_companies:['other']},{...fields,auth_user_id:'override'},{...fields,email:'override@example.com'}])assert.equal(userFieldsSchema.safeParse(value).success,false);
  assert.equal(newUserSchema.safeParse({...fields,email:'a@example.com'}).success,true);
});
test('disabled users never have company access',()=>{
  assert.ok(canUseCompany({status:'active',allowed_companies:['gti']},'gti'));
  assert.ok(!canUseCompany({status:'active',allowed_companies:['gti']},'doubleLeaf'));
  assert.ok(!canUseCompany({status:'disabled',allowed_companies:['gti','doubleLeaf']},'gti'));
});
test('cookie-authenticated mutations require the exact same origin',()=>{
  const req=(origin?:string)=>new Request('https://www.mrghashi.com/api/auth/logout',{method:'POST',headers:origin?{origin}:{}});
  assert.doesNotThrow(()=>requireSameOrigin(req('https://www.mrghashi.com')));
  for(const origin of [undefined,'https://evil.example','http://www.mrghashi.com'])assert.throws(()=>requireSameOrigin(req(origin)));
});
