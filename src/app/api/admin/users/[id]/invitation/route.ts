import { z } from 'zod';
import type { AuthorizedUser } from '@/lib/access';
import { PRIVATE_HEADERS, RequestError } from '@/lib/http';
import { privateError, requireAdmin, requireSameOrigin } from '@/server/access';
import { serviceClient } from '@/server/supabase';
import { sendPasswordEmail, takePasswordEmailQuota } from '@/server/password-auth';
import { takeQuota } from '@/server/limits';
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){
  try{
    requireSameOrigin(request);const actor=await requireAdmin();await takeQuota('admin-invitations',actor.auth_user_id,20,3600);
    const {id}=await params;if(!z.uuid().safeParse(id).success)throw new RequestError(400,'Choose a registered user.');
    const client=serviceClient();const {data,error}=await client.from('authorized_users').select('*').eq('id',id).maybeSingle();
    if(error)throw error;if(!data)throw new RequestError(404,'This user could not be found.');
    if(data.status!=='active')throw new RequestError(403,'Reactivate this user before sending an invitation.');
    await takePasswordEmailQuota(data.email);await sendPasswordEmail(data as AuthorizedUser,data.password_set_at?'reset':'setup');
    const refreshed=await client.from('authorized_users').select('*').eq('id',id).single();
    if(refreshed.error)throw refreshed.error;
    return Response.json({user:refreshed.data,accepted:true},{headers:PRIVATE_HEADERS});
  }catch(error){return privateError(error);}
}
