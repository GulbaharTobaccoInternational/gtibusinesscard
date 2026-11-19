import { createHmac } from 'node:crypto';
import { RequestError } from '@/lib/http';
import { serviceClient } from './supabase';

export function quotaKey(scope:string,value:string){
  const secret=process.env.SUPABASE_SECRET_KEY;if(!secret)throw new Error('Missing rate-limit configuration');
  return `${scope}:${createHmac('sha256',secret).update(value).digest('hex')}`;
}
export function requestIp(request:Request){return (request.headers.get('x-vercel-forwarded-for')??request.headers.get('x-forwarded-for')??'local').split(',')[0].trim().slice(0,200);}
export async function takeQuota(scope:string,value:string,limit:number,seconds:number){
  const {data,error}=await serviceClient().rpc('take_request_quota',{p_key:quotaKey(scope,value),p_limit:limit,p_seconds:seconds});
  if(error)throw new RequestError(503,'Please try again in a moment.');
  if(data!==true)throw new RequestError(429,'Please wait a moment before trying again.');
}
