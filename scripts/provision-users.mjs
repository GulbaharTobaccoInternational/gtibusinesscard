/** Operator-only, idempotent provisioning. Input JSON is private and must not be committed. */
import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';
if(fs.existsSync('.env.local'))process.loadEnvFile('.env.local');
const input=process.argv[2];if(!input)throw new Error('Usage: node scripts/provision-users.mjs /private/path/users.json');
const users=JSON.parse(fs.readFileSync(input,'utf8'));
const client=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SECRET_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
let count=0;
for(const user of users){
  const email=user.email.trim().toLowerCase();
  const existing=await client.from('authorized_users').select('id').eq('email',email).maybeSingle();if(existing.error)throw new Error('Authorization lookup failed');
  if(existing.data){count++;continue;}
  let authUser;
  for(let page=1;page<100;page++){
    const result=await client.auth.admin.listUsers({page,perPage:100});if(result.error)throw new Error('Auth directory lookup failed');
    authUser=result.data.users.find(item=>item.email?.toLowerCase()===email);if(authUser||result.data.users.length<100)break;
  }
  let created=false;
  if(!authUser){const result=await client.auth.admin.createUser({email,email_confirm:true,user_metadata:{full_name:user.full_name}});if(result.error)throw new Error(`Auth provisioning failed: ${result.error.code}`);authUser=result.data.user;created=true;}
  const result=await client.from('authorized_users').insert({auth_user_id:authUser.id,email,full_name:user.full_name,role:user.role,status:'active',allowed_companies:['gti','doubleLeaf']});
  if(result.error){if(created)await client.auth.admin.deleteUser(authUser.id);throw new Error(`Authorization provisioning failed: ${result.error.code}`);}
  count++;
}
console.log(`Provisioned/confirmed ${count} authorized accounts. No passwords or invitation emails were created.`);
