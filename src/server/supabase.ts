// Server-only clients. This module must never be imported by a client component.
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

function required(name:string){const value=process.env[name];if(!value)throw new Error(`Missing server configuration: ${name}`);return value;}
export function serviceClient(){
  return createClient(required('NEXT_PUBLIC_SUPABASE_URL'),required('SUPABASE_SECRET_KEY'),{
    auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},
    global:{fetch:(input,init)=>fetch(input,{...init,cache:'no-store'})},
  });
}
export async function sessionClient(){
  const jar=await cookies();
  return createServerClient(required('NEXT_PUBLIC_SUPABASE_URL'),required('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'),{
    cookieOptions:{httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',path:'/'},
    cookies:{getAll:()=>jar.getAll(),setAll:items=>{
      // Server Components cannot write cookies; Proxy refreshes them before rendering.
      try{for(const {name,value,options} of items)jar.set(name,value,options);}catch{}
    }},
    global:{fetch:(input,init)=>fetch(input,{...init,cache:'no-store'})},
  });
}

// Keep password verification separate from the session cookies of the current browser.
export function passwordVerificationClient() {
  return createClient(required('NEXT_PUBLIC_SUPABASE_URL'), required('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: (input, init) => fetch(input, { ...init, cache: 'no-store' }) },
  });
}
