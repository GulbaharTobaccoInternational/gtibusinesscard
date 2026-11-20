import { cookies } from 'next/headers';
import { validPasswordLinkGrant } from '@/server/password-link-grant';
import { passwordUpdateSchema } from '@/lib/password-auth';
import { readPrivateJson, PRIVATE_HEADERS, RequestError } from '@/lib/http';
import { privateError, requireSameOrigin, requireUser } from '@/server/access';
import { clearAuthCookies, markPasswordReady, passwordUpdateError, PASSWORD_FORM_COOKIE } from '@/server/password-auth';
import { takeQuota } from '@/server/limits';
import { sessionClient } from '@/server/supabase';
export async function POST(request:Request){
  try{
    requireSameOrigin(request);const user=await requireUser();await takeQuota('password-update',user.auth_user_id,6,600);
    const parsed=passwordUpdateSchema.safeParse(await readPrivateJson(request));if(!parsed.success)throw new RequestError(400,parsed.error.issues[0]?.message??'Check your new password.');
    const client=await sessionClient();
    const { data: verified } = await client.auth.getClaims();
    const grant = (await cookies()).get(PASSWORD_FORM_COOKIE)?.value;
    if (!grant || !verified || !validPasswordLinkGrant(grant, verified.claims.session_id, process.env.SUPABASE_SECRET_KEY!)) {
      throw new RequestError(403, 'Please open a fresh password setup or reset link.');
    }
    const {error}=await client.auth.updateUser({password:parsed.data.password});
    if(error) throw passwordUpdateError(error.code, 'Your password could not be updated. Request a fresh link and try again.');
    await markPasswordReady(user.id);
    const {error:logoutError}=await client.auth.signOut({scope:'global'});
    if(logoutError)console.error('Post-recovery session revocation request failed.');
    await clearAuthCookies();
    return Response.json({ok:true,redirect:'/login?password=updated'},{headers:PRIVATE_HEADERS});
  }catch(error){return privateError(error);}
}
