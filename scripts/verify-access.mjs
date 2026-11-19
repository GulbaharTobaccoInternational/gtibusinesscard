import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createClient} from '@supabase/supabase-js';
process.loadEnvFile('.env.local');
fs.mkdirSync('output/verification/secure-access',{recursive:true});
const base=process.env.GULBAHAR_TEST_URL??'http://127.0.0.1:3117';
const service=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SECRET_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const created=[];const run=crypto.randomUUID().slice(0,8);
const results=[];function ok(name){results.push(name);console.log('PASS',name);}
const post=(path,body,cookie='',method='POST')=>fetch(base+path,{method,headers:{Origin:base,'Content-Type':'application/json',Cookie:cookie},body:JSON.stringify(body)});
async function fixture(role,companies){
 const email=`qa-${role}-${run}@example.com`;
 const {data,error}=await service.auth.admin.createUser({email,email_confirm:true});assert.ok(!error,'Fixture account provisioning');created.push(data.user.id);
 const row=await service.from('authorized_users').insert({auth_user_id:data.user.id,email,full_name:`QA ${role}`,role,status:'active',allowed_companies:companies}).select().single();assert.ok(!row.error,'Fixture authorization provisioning');
 const generated=await service.auth.admin.generateLink({type:'magiclink',email});assert.ok(!generated.error,'Fixture OTP generation');const token=generated.data.properties.email_otp;assert.equal(token.length,6,'Supabase produces six-digit email codes');
 const login=await post('/api/auth/verify',{email,token});assert.equal(login.status,200,'Valid OTP through application');
 const cookies=login.headers.getSetCookie();assert.ok(cookies.some(value=>value.includes('HttpOnly')));assert.ok(cookies.some(value=>value.includes('SameSite=lax')));
 const cookie=cookies.map(value=>value.split(';')[0]).join('; ');
 const verified=await createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}}).auth.verifyOtp({email,token,type:'email'});
 assert.ok(verified.error,'Used OTP cannot be replayed');
 // A fresh generated code supplies a direct authenticated client for independent RLS checks.
 const next=await service.auth.admin.generateLink({type:'magiclink',email});
 const authClient=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
 const signed=await authClient.auth.verifyOtp({email,token:next.data.properties.email_otp,type:'email'});assert.ok(!signed.error);
 return {row:row.data,cookie,authClient};
}
try{
 const anon=await fetch(base+'/',{redirect:'manual'});assert.equal(anon.status,307);assert.equal(anon.headers.get('location'),'/login');
 for(const path of ['/api/render','/api/export','/api/feedback'])assert.equal((await post(path,{})).status,401);
 assert.equal((await fetch(base+'/api/admin/users')).status,401);ok('anonymous pages and every protected API are blocked');
 const unauthorized=await post('/api/auth/request',{email:`not-allowed-${run}@example.com`});assert.equal(unauthorized.status,403);assert.match((await unauthorized.json()).error,/does not have permission/);ok('unauthorized email gets the required message');
 const admin=await fixture('admin',['gti','doubleLeaf']);const employee=await fixture('employee',['gti']);ok('valid six-digit OTP, secure cookies and single-use code checks');
 const invalid=await post('/api/auth/verify',{email:employee.row.email,token:'000000'});assert.equal(invalid.status,400);ok('invalid OTP is rejected');
 fs.writeFileSync('output/verification/secure-access/admin-cookie.txt',admin.cookie,{mode:0o600});
 const anonDb=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
 assert.ok((await anonDb.from('authorized_users').select('*')).error);
 const own=await employee.authClient.from('authorized_users').select('*');assert.ok(!own.error);assert.equal(own.data.length,1);assert.equal(own.data[0].id,employee.row.id);
 const write=await employee.authClient.from('authorized_users').update({role:'admin',allowed_companies:['gti','doubleLeaf']}).eq('id',employee.row.id);assert.ok(write.error);
 assert.ok((await employee.authClient.from('feedback_deliveries').select('*')).error);
 assert.ok((await employee.authClient.rpc('take_request_quota',{p_key:'bypass',p_limit:10,p_seconds:60})).error);
 const all=await admin.authClient.from('authorized_users').select('id');assert.ok(!all.error);assert.ok(all.data.length>=9);ok('RLS: own row only, no client writes, private outbox and quota RPC');
 const {DEMO_EMPLOYEES}=await import('../src/lib/demo.ts');
 assert.equal((await post('/api/render',{companyId:'gti',employee:DEMO_EMPLOYEES.gti},employee.cookie)).status,200);
 for(const path of ['/api/render','/api/export','/api/feedback']){
  const body=path.includes('feedback')?{reactionId:'great-job',companyId:'doubleLeaf',submissionId:crypto.randomUUID()}:path.includes('export')?{companyId:'doubleLeaf',employee:DEMO_EMPLOYEES.doubleLeaf,settings:{format:'print',sides:'front',dpi:600,acknowledgeQrWarning:true}}:{companyId:'doubleLeaf',employee:DEMO_EMPLOYEES.doubleLeaf};
  assert.equal((await post(path,body,employee.cookie)).status,403);
 }ok('company permissions enforced on preview, export and feedback APIs');
 assert.equal((await fetch(base+'/api/admin/users',{headers:{Cookie:employee.cookie}})).status,403);
 const fields={full_name:'Escalation',role:'admin',status:'active',allowed_companies:['gti','doubleLeaf']};
 assert.equal((await post('/api/admin/users/'+employee.row.id,fields,employee.cookie,'PATCH')).status,403);
 assert.equal((await post('/api/admin/users',{...fields,email:'escalation@example.com'},employee.cookie)).status,403);ok('employees cannot list, provision or promote users');
 const childEmail=`qa-created-${run}@example.com`;
 const provision=await post('/api/admin/users',{email:childEmail,full_name:'QA Created',role:'employee',status:'active',allowed_companies:['doubleLeaf']},admin.cookie);assert.equal(provision.status,201);const child=await provision.json();created.push(child.auth_user_id);
 assert.equal((await post('/api/admin/users',{email:childEmail.toUpperCase(),full_name:'Duplicate',role:'employee',status:'active',allowed_companies:['gti']},admin.cookie)).status,409);
 assert.equal((await post('/api/admin/users/'+employee.row.id,{full_name:'QA Updated',role:'employee',status:'disabled',allowed_companies:['gti']},admin.cookie,'PATCH')).status,200);
 assert.equal((await fetch(base+'/api/auth/session',{headers:{Cookie:employee.cookie}})).status,401);
 assert.equal((await post('/api/render',{companyId:'gti',employee:DEMO_EMPLOYEES.gti},employee.cookie)).status,401);
 assert.equal((await post('/api/auth/request',{email:employee.row.email})).status,403);
 assert.equal((await post('/api/admin/users/'+employee.row.id,{full_name:'QA Updated',role:'employee',status:'active',allowed_companies:['doubleLeaf']},admin.cookie,'PATCH')).status,200);
 assert.equal((await post('/api/render',{companyId:'gti',employee:DEMO_EMPLOYEES.gti},employee.cookie)).status,403);
 assert.equal((await post('/api/render',{companyId:'doubleLeaf',employee:DEMO_EMPLOYEES.doubleLeaf},employee.cookie)).status,200);ok('admin provisioning, case-insensitive duplicates, disable/reactivate and live permissions');
 const badOrigin=await fetch(base+'/api/auth/logout',{method:'POST',headers:{Origin:'https://evil.example',Cookie:admin.cookie}});assert.equal(badOrigin.status,403);
 const logout=await post('/api/auth/logout',{},employee.cookie);assert.equal(logout.status,200);assert.ok(logout.headers.getSetCookie().some(c=>c.includes('Max-Age=0')));ok('logout clears cookies; cross-origin mutation rejected');
 const q=`qa-rate:${run}`;for(let i=0;i<2;i++)assert.equal((await service.rpc('take_request_quota',{p_key:q,p_limit:2,p_seconds:60})).data,true);assert.equal((await service.rpc('take_request_quota',{p_key:q,p_limit:2,p_seconds:60})).data,false);ok('distributed quota is atomic and rejects excess requests');
 // Run card regression through the authenticated HTTP surface while fixtures exist.
 const {spawnSync}=await import('node:child_process');const smoke=spawnSync(process.execPath,['--import','tsx','scripts/smoke-api.ts'],{cwd:process.cwd(),env:{...process.env,GULBAHAR_TEST_URL:base,GULBAHAR_TEST_COOKIE_FILE:'output/verification/secure-access/admin-cookie.txt'},encoding:'utf8'});console.log(smoke.stdout);if(smoke.status!==0)console.log(smoke.stderr);assert.equal(smoke.status,0);ok('both-company HTTP PDF/PNG/vCard and QR regression');
 if(process.env.MR_GHASHI_QA_KEEP_FIXTURES==='1')fs.writeFileSync('output/verification/secure-access/qa-fixtures.json',JSON.stringify({admin,employee,created},(key,value)=>key==='authClient'?undefined:value),{mode:0o600});
 fs.writeFileSync('output/verification/secure-access/integration-results.json',JSON.stringify(results,null,2));
 console.log('API/security integration checks passed.');
}catch(error){console.error(error);process.exitCode=1;}finally{
 if(process.env.MR_GHASHI_QA_KEEP_FIXTURES!=='1'||process.exitCode){for(const id of created.reverse()){const {error}=await service.auth.admin.deleteUser(id);if(error){console.error('QA fixture cleanup failed.');process.exitCode=1;}}fs.rmSync('output/verification/secure-access/admin-cookie.txt',{force:true});}
}
