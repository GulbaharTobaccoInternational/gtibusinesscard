import { passwordEmailSchema, PASSWORD_EMAIL_CONFIRMATION } from '@/lib/password-auth';
import { readPrivateJson, PRIVATE_HEADERS, RequestError } from '@/lib/http';
import { findAuthorizedEmail, privateError, requireSameOrigin } from '@/server/access';
import { sendPasswordEmail, takePasswordEmailQuota } from '@/server/password-auth';
import { requestIp, takeQuota } from '@/server/limits';
export const runtime='nodejs';
export async function POST(request:Request){
  try{
    requireSameOrigin(request);await takeQuota('password-mail-ip',requestIp(request),12,600);
    const parsed=passwordEmailSchema.safeParse(await readPrivateJson(request));if(!parsed.success)throw new RequestError(400,'Enter a valid work email address.');
    const {email,intent}=parsed.data;
    // Apply identical quotas and responses to registered, unknown and disabled emails.
    await takePasswordEmailQuota(email);
    const user=await findAuthorizedEmail(email);
    if(user?.status==='active')await sendPasswordEmail(user,intent);
    return Response.json({ok:true,message:PASSWORD_EMAIL_CONFIRMATION,resendAfter:60},{headers:PRIVATE_HEADERS});
  }catch(error){return privateError(error);}
}
