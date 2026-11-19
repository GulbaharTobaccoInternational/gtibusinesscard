import { cookies } from 'next/headers';
import { PRIVATE_HEADERS, RequestError } from '@/lib/http';
import { findAuthorizedEmail, privateError, requireSameOrigin } from '@/server/access';
import { EMAIL_LINK_COOKIE, emailLinkCookieOptions, pendingEmailLink, clearAuthCookies } from '@/server/password-auth';
import { requestIp, takeQuota } from '@/server/limits';
import { sessionClient } from '@/server/supabase';
export async function POST(request:Request){
  try{
    requireSameOrigin(request);await takeQuota('password-link-ip',requestIp(request),30,600);
    const link=await pendingEmailLink();
    (await cookies()).set(EMAIL_LINK_COOKIE,'',{...emailLinkCookieOptions,maxAge:0});
    if(!link)throw new RequestError(400,'This link is invalid or has expired. Please request a new one.');
    const client=await sessionClient();const {data,error}=await client.auth.verifyOtp({token_hash:link.token_hash,type:link.type});
    if(error||!data.user)throw new RequestError(400,'This link is invalid or has expired. Please request a new one.');
    const user=await findAuthorizedEmail(data.user.email?.toLowerCase()??'');
    if(!user||user.status!=='active'||user.auth_user_id!==data.user.id){await client.auth.signOut({scope:'local'});await clearAuthCookies();return Response.json({redirect:'/access-not-authorized'},{status:403,headers:PRIVATE_HEADERS});}
    return Response.json({ok:true,redirect:link.next},{headers:PRIVATE_HEADERS});
  }catch(error){return privateError(error);}
}
