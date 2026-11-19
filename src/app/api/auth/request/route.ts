import { emailSchema, ACCESS_MESSAGE } from '@/lib/access';
import { readPrivateJson, PRIVATE_HEADERS, RequestError } from '@/lib/http';
import { findAuthorizedEmail, privateError, requireSameOrigin } from '@/server/access';
import { requestIp, takeQuota } from '@/server/limits';
import { sessionClient } from '@/server/supabase';
import { z } from 'zod';
export const runtime='nodejs';
export async function POST(request:Request){
  try{
    requireSameOrigin(request);
    await takeQuota('otp-ip',requestIp(request),12,600);
    const parsed=z.object({email:emailSchema}).strict().safeParse(await readPrivateJson(request));
    if(!parsed.success)throw new RequestError(400,'Enter a valid work email address.');
    const {email}=parsed.data;
    const user=await findAuthorizedEmail(email);
    if(!user||user.status!=='active')throw new RequestError(403,ACCESS_MESSAGE);
    await takeQuota('otp-resend',email,1,60);
    await takeQuota('otp-email',email,6,3600);
    const {error}=await (await sessionClient()).auth.signInWithOtp({email,options:{shouldCreateUser:false}});
    if(error){console.error('OTP request failed.',{status:error.status,code:error.code});throw new RequestError(error.status===429?429:503,'The login code could not be sent. Please try again shortly.');}
    return Response.json({ok:true,resendAfter:60,expiresIn:600},{headers:PRIVATE_HEADERS});
  }catch(error){return privateError(error);}
}
