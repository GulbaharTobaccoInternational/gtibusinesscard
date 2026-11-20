import { passwordLoginSchema, CREDENTIALS_ERROR } from '@/lib/password-auth';
import { ACCESS_MESSAGE } from '@/lib/access';
import { readPrivateJson, PRIVATE_HEADERS, RequestError } from '@/lib/http';
import { findAuthorizedEmail, privateError, requireSameOrigin } from '@/server/access';
import { clearAuthCookies, markPasswordReady } from '@/server/password-auth';
import { requestIp, takeQuota } from '@/server/limits';
import { sessionClient } from '@/server/supabase';
export const runtime='nodejs';
export async function POST(request:Request){
  try{
    requireSameOrigin(request);await takeQuota('password-login-ip',requestIp(request),30,600);
    const parsed=passwordLoginSchema.safeParse(await readPrivateJson(request));if(!parsed.success)throw new RequestError(400,'Enter your work email and password.');
    const {email,password}=parsed.data;
    const [, user] = await Promise.all([
      takeQuota('password-login-email', email, 12, 600),
      findAuthorizedEmail(email),
    ]);
    if(!user||user.status!=='active')throw new RequestError(401,CREDENTIALS_ERROR);
    const client=await sessionClient();const {data,error}=await client.auth.signInWithPassword({email,password});
    if(error||!data.user){if(error&&error.status&&error.status>=500)throw new RequestError(503,'Sign in is temporarily unavailable. Please try again.');throw new RequestError(401,CREDENTIALS_ERROR);}
    const fresh=await findAuthorizedEmail(email);
    if(!fresh||fresh.status!=='active'||fresh.auth_user_id!==data.user.id){await client.auth.signOut({scope:'local'});await clearAuthCookies();throw new RequestError(403,ACCESS_MESSAGE);}
    if(!fresh.password_set_at)await markPasswordReady(fresh.id);
    return Response.json({ok:true},{headers:PRIVATE_HEADERS});
  }catch(error){return privateError(error);}
}
