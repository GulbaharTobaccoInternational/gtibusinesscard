import { NextResponse } from 'next/server';
import { PRIVATE_HEADERS } from '@/lib/http';
import { emailLinkSchema, passwordDestination } from '@/lib/password-auth';
import { appUrl, EMAIL_LINK_COOKIE, emailLinkCookieOptions } from '@/server/password-auth';
export function GET(request:Request){
  const url=new URL(request.url),type=url.searchParams.get('type');
  const next=type==='invite'?'/create-password':passwordDestination(url.searchParams.get('next'),appUrl());
  const parsed=emailLinkSchema.safeParse({token_hash:url.searchParams.get('token_hash'),type,next});
  const response=new NextResponse(null,{status:303,headers:{Location:parsed.success?'/auth/continue':'/auth/invalid'}});
  for(const [name,value] of Object.entries(PRIVATE_HEADERS))response.headers.set(name,value);
  response.headers.set('Referrer-Policy','no-referrer');
  // Carry only the Supabase-issued proof in an HttpOnly cookie. GET does not consume it.
  response.cookies.set(EMAIL_LINK_COOKIE,parsed.success?Buffer.from(JSON.stringify(parsed.data)).toString('base64url'):'',{...emailLinkCookieOptions,...(!parsed.success?{maxAge:0}:{})});
  return response;
}
