import { redirect } from 'next/navigation';
import { ACCESS_MESSAGE, canUseCompany, type AuthorizedUser } from '@/lib/access';
import type { CompanyId } from '@/lib/company';
import { RequestError, PRIVATE_HEADERS } from '@/lib/http';
import { serviceClient, sessionClient } from './supabase';

export async function findAuthorizedEmail(email:string){
  const {data,error}=await serviceClient().from('authorized_users').select('*').eq('email',email).maybeSingle();
  if(error)throw new RequestError(503,'Access verification is temporarily unavailable. Please try again.');
  return data as AuthorizedUser|null;
}
export async function currentUser():Promise<AuthorizedUser|null>{
  const auth=await sessionClient();
  const {data:{user},error}=await auth.auth.getUser();
  if(error||!user)return null;
  const {data,error:lookupError}=await serviceClient().from('authorized_users').select('*').eq('auth_user_id',user.id).maybeSingle();
  if(lookupError)throw new RequestError(503,'Access verification is temporarily unavailable. Please try again.');
  if(!data||data.status!=='active'||data.email!==user.email?.toLowerCase())return null;
  return data as AuthorizedUser;
}
export async function requireUser(){
  const user=await currentUser();if(!user)throw new RequestError(401,ACCESS_MESSAGE);return user;
}
export async function requireAdmin(){const user=await requireUser();if(user.role!=='admin')throw new RequestError(403,'Administrator access is required.');return user;}
export function requireCompany(user:AuthorizedUser,company:CompanyId){if(!canUseCompany(user,company))throw new RequestError(403,'You do not have access to this company.');}
export async function pageUser(admin=false){
  const user=await currentUser();if(!user)redirect('/login');if(admin&&user.role!=='admin')redirect('/');return user;
}
export function privateError(error:unknown){
  if(!(error instanceof RequestError))console.error('Protected request failed.');
  return Response.json({error:error instanceof RequestError?error.message:'The request could not be completed. Please try again.'},{status:error instanceof RequestError?error.status:503,headers:{...PRIVATE_HEADERS,...(error instanceof RequestError&&error.status===429?{'Retry-After':'60'}:{})}});
}
export function requireSameOrigin(request:Request){
  const origin=request.headers.get('origin');
  const target=new URL(request.url);
  let matches=false;
  try{const source=new URL(origin??'');matches=source.host===(request.headers.get('host')??target.host)&&source.protocol===target.protocol;}catch{}
  if(!matches||request.headers.get('sec-fetch-site')==='cross-site')throw new RequestError(403,'Please use this application to continue.');
}
