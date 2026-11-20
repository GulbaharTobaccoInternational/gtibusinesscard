import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(request:NextRequest){
  let response=NextResponse.next({request});
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if(!url||!key)return response;
  const supabase=createServerClient(url,key,{
    cookieOptions:{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/'},
    cookies:{getAll:()=>request.cookies.getAll(),setAll:items=>{
      for(const {name,value} of items)request.cookies.set(name,value);
      response=NextResponse.next({request});
      for(const {name,value,options} of items)response.cookies.set(name,value,options);
    }},
  });
  // Refresh expiring cookies here. Every protected page and API independently verifies
  // the user with Auth and checks their current authorization. No cookie identity is trusted here.
  await supabase.auth.getSession();
  response.headers.set('Cache-Control','private, no-store, max-age=0');
  return response;
}
export const config={matcher:['/','/login','/sign-in','/create-password','/reset-password','/forgot-password','/auth/:path*','/access-not-authorized','/admin/:path*','/api/:path*']};
