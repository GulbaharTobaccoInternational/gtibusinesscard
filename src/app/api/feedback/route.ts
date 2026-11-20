import { after } from 'next/server';
import { readPrivateJson, PRIVATE_HEADERS, RequestError } from '@/lib/http';
import { deliverQueuedFeedback, feedbackSchema, queueFeedback } from '@/server/feedback';
import { privateError, requireCompany, requireSameOrigin, requireUser } from '@/server/access';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export const maxDuration=30;
export async function POST(request:Request){
  try{
    requireSameOrigin(request);
    const user=await requireUser();
    const parsed=feedbackSchema.safeParse(await readPrivateJson(request));
    if(!parsed.success)throw new RequestError(400,'Choose a supported reaction and company.');
    requireCompany(user,parsed.data.companyId);
    const deliveryId = await queueFeedback(parsed.data, user);
    if (deliveryId) after(() => deliverQueuedFeedback(deliveryId));
    return Response.json({accepted:true},{status:202,headers:PRIVATE_HEADERS});
  }catch(error){return privateError(error);}
}
