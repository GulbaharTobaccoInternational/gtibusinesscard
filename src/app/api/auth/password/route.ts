import { passwordUpdateSchema } from '@/lib/password-auth';
import { readPrivateJson, PRIVATE_HEADERS, RequestError } from '@/lib/http';
import { privateError, requireSameOrigin, requireUser } from '@/server/access';
import { clearAuthCookies, markPasswordReady } from '@/server/password-auth';
import { takeQuota } from '@/server/limits';
import { sessionClient } from '@/server/supabase';
export async function POST(request:Request){
  try{
    requireSameOrigin(request);const user=await requireUser();await takeQuota('password-update',user.auth_user_id,6,600);
    const parsed=passwordUpdateSchema.safeParse(await readPrivateJson(request));if(!parsed.success)throw new RequestError(400,parsed.error.issues[0]?.message??'Check your new password.');
    const client=await sessionClient();const {error}=await client.auth.updateUser({password:parsed.data.password});
    if(error){const message=error.code==='same_password'?'Choose a password different from your current password.':error.code==='weak_password'?'This password does not meet the account security requirements. Use a longer, stronger password.':'Your password could not be updated. Request a fresh link and try again.';throw new RequestError(400,message);}
    await markPasswordReady(user.id);
    const {error:logoutError}=await client.auth.signOut({scope:'global'});
    if(logoutError)console.error('Post-recovery session revocation request failed.');
    await clearAuthCookies();
    return Response.json({ok:true,redirect:'/sign-in?password=updated'},{headers:PRIVATE_HEADERS});
  }catch(error){return privateError(error);}
}
