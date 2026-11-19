import { newUserSchema } from '@/lib/access';
import { readPrivateJson, PRIVATE_HEADERS, RequestError } from '@/lib/http';
import { privateError, requireAdmin, requireSameOrigin } from '@/server/access';
import { serviceClient } from '@/server/supabase';
import { takeQuota } from '@/server/limits';
export const dynamic='force-dynamic';
export async function GET(){
  try{await requireAdmin();const {data,error}=await serviceClient().from('authorized_users').select('*').order('full_name');if(error)throw error;return Response.json(data,{headers:PRIVATE_HEADERS});}catch(error){return privateError(error);}
}
export async function POST(request:Request){
  try{
    requireSameOrigin(request);const actor=await requireAdmin();await takeQuota('admin-create',actor.auth_user_id,20,3600);
    const parsed=newUserSchema.safeParse(await readPrivateJson(request));if(!parsed.success)throw new RequestError(400,'Check the name, email, role and company permissions.');
    const {email,...fields}=parsed.data,client=serviceClient();
    const {data:existing,error:lookupError}=await client.from('authorized_users').select('id').eq('email',email).maybeSingle();
    if(lookupError)throw lookupError;if(existing)throw new RequestError(409,'This email address is already registered. Edit the existing user.');
    const {data,error}=await client.auth.admin.createUser({email,email_confirm:true,user_metadata:{full_name:fields.full_name}});
    if(error||!data.user)throw new RequestError(error?.code==='email_exists'?409:503,'The account could not be created. Check whether this email is already registered.');
    const result=await client.from('authorized_users').insert({...fields,email,auth_user_id:data.user.id}).select().single();
    if(result.error){await client.auth.admin.deleteUser(data.user.id);throw result.error;}
    return Response.json(result.data,{status:201,headers:PRIVATE_HEADERS});
  }catch(error){return privateError(error);}
}
