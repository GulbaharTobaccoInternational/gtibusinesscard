import { newUserSchema, type AuthorizedUser } from '@/lib/access';
import { readPrivateJson, PRIVATE_HEADERS, RequestError } from '@/lib/http';
import { privateError, requireAdmin, requireSameOrigin } from '@/server/access';
import { serviceClient } from '@/server/supabase';
import { takeQuota } from '@/server/limits';
import { findAuthEmail, sendPasswordEmail, takePasswordEmailQuota } from '@/server/password-auth';
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
    let authUser=await findAuthEmail(email);let created=false;
    if(!authUser){const {data,error}=await client.auth.admin.createUser({email,email_confirm:false,user_metadata:{full_name:fields.full_name}});if(error||!data.user)throw new RequestError(503,'The account could not be created. Please try again.');authUser=data.user;created=true;}
    const result=await client.from('authorized_users').insert({...fields,email,auth_user_id:authUser.id}).select().single();
    if(result.error){if(created)await client.auth.admin.deleteUser(authUser.id);throw result.error;}
    let invitationSent=false;
    if(fields.status==='active')try{await takePasswordEmailQuota(email);await sendPasswordEmail(result.data as AuthorizedUser,'setup');invitationSent=true;}catch{console.error('Approved account created; setup email needs retry.');}
    const refreshed=await client.from('authorized_users').select('*').eq('id',result.data.id).single();
    return Response.json({...refreshed.data??result.data,invitationSent},{status:201,headers:PRIVATE_HEADERS});
  }catch(error){return privateError(error);}
}
