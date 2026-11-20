import { cookies } from 'next/headers';
import { RequestError } from '@/lib/http';
import type { AuthorizedUser } from '@/lib/access';
import { emailLinkSchema } from '@/lib/password-auth';
import { serviceClient, sessionClient } from './supabase';
import { takeQuota } from './limits';

export const PASSWORD_FORM_COOKIE = 'mr-ghashi-password-form';
export const EMAIL_LINK_COOKIE='mr-ghashi-email-link';
export const emailLinkCookieOptions={httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax' as const,path:'/',maxAge:600};
export function appUrl(){const url=new URL(process.env.NEXT_PUBLIC_APP_URL??'https://www.mrghashi.com');if(url.protocol!=='https:'&&url.hostname!=='127.0.0.1')throw new Error('Invalid application URL');return url.origin;}
export async function pendingEmailLink(){
  const value=(await cookies()).get(EMAIL_LINK_COOKIE)?.value;if(!value||value.length>1500)return null;
  try{const parsed=emailLinkSchema.safeParse(JSON.parse(Buffer.from(value,'base64url').toString('utf8')));return parsed.success?parsed.data:null;}catch{return null;}
}
export async function clearAuthCookies(){
  const jar=await cookies(),ref=new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname.split('.')[0];
  for(const {name} of jar.getAll())if(name.startsWith(`sb-${ref}-auth-token`)||name===EMAIL_LINK_COOKIE||name===PASSWORD_FORM_COOKIE)jar.set(name,'',{...emailLinkCookieOptions,maxAge:0});
}
export async function markPasswordReady(id:string){
  const {error}=await serviceClient().from('authorized_users').update({password_set_at:new Date().toISOString()}).eq('id',id);
  if(error)console.error('Password onboarding status update failed.');
}
export async function findAuthEmail(email:string){
  const client=serviceClient();
  for(let page=1;page<=100;page++){
    const {data,error}=await client.auth.admin.listUsers({page,perPage:100});if(error)throw new RequestError(503,'The account directory is temporarily unavailable.');
    const user=data.users.find(user=>user.email?.toLowerCase()===email);if(user)return user;if(data.users.length<100)return null;
  }
  throw new RequestError(503,'The account directory could not be searched.');
}
export async function sendPasswordEmail(user:AuthorizedUser,intent:'setup'|'reset'){
  if(user.status!=='active')throw new RequestError(403,'Reactivate this user before sending a setup link.');
  const client=serviceClient();
  const {data,error:lookupError}=await client.auth.admin.getUserById(user.auth_user_id);
  if(lookupError||!data.user)throw new RequestError(503,'The account could not be verified.');
  if(data.user.email?.toLowerCase()!==user.email)throw new RequestError(409,'The account email must match its approved email address.');
  const redirectTo=appUrl()+(intent==='setup'?'/create-password':'/reset-password');
  const pendingInvite=!data.user.email_confirmed_at;
  const result=pendingInvite
    ?await client.auth.admin.inviteUserByEmail(user.email,{redirectTo,data:{full_name:user.full_name}})
    :await (await sessionClient()).auth.resetPasswordForEmail(user.email,{redirectTo});
  if(result.error){console.error('Password email request failed.',{code:result.error.code,status:result.error.status});if(result.error.status===429)throw new RequestError(429,'Please wait a minute before requesting another email.');throw new RequestError(503,'The email request could not be completed. Please try again shortly.');}
  const patch={setup_email_sent_at:new Date().toISOString(),...(pendingInvite?{invited_at:new Date().toISOString()}:{} )};
  const {error}=await client.from('authorized_users').update(patch).eq('id',user.id);
  if(error)console.error('Setup email status update failed.');
}
export async function takePasswordEmailQuota(email:string){await takeQuota('password-email-cooldown',email,1,60);await takeQuota('password-email-hour',email,6,3600);}

export function passwordUpdateError(code: string | undefined, fallback: string) {
  if (code === 'same_password') return new RequestError(400, 'Choose a password different from your current password.');
  if (code === 'weak_password') return new RequestError(400, 'Use a longer, stronger password that meets the account requirements.');
  return new RequestError(400, fallback);
}
