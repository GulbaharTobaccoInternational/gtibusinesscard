import { z } from 'zod';
import { emailSchema, ACCESS_MESSAGE } from '@/lib/access';
import { readPrivateJson, PRIVATE_HEADERS, RequestError } from '@/lib/http';
import { findAuthorizedEmail, privateError, requireSameOrigin } from '@/server/access';
import { requestIp, takeQuota } from '@/server/limits';
import { sessionClient } from '@/server/supabase';
export const runtime='nodejs';
export async function POST(request:Request){
  try{
    requireSameOrigin(request);
    await takeQuota('verify-ip',requestIp(request),30,600);
    const parsed=z.object({email:emailSchema,token:z.string().regex(/^\d{6}$/)}).strict().safeParse(await readPrivateJson(request));
    if(!parsed.success)throw new RequestError(400,'Enter the six-digit code from your email.');
    const {email,token}=parsed.data;
    await takeQuota('verify-email',email,10,600);
    const user=await findAuthorizedEmail(email);
    if(!user||user.status!=='active')throw new RequestError(403,ACCESS_MESSAGE);
    const client=await sessionClient();
    const {data,error}=await client.auth.verifyOtp({email,token,type:'email'});
    if(error||!data.user)throw new RequestError(400,'This code is invalid or has expired. Check your latest email or request a new code.');
    const fresh=await findAuthorizedEmail(email);
    if(!fresh||fresh.status!=='active'||fresh.auth_user_id!==data.user.id){await client.auth.signOut();throw new RequestError(403,ACCESS_MESSAGE);}
    return Response.json({ok:true},{headers:PRIVATE_HEADERS});
  }catch(error){return privateError(error);}
}
