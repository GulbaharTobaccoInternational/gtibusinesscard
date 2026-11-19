import { NextResponse } from 'next/server';
import { readPrivateJson, PRIVATE_HEADERS, RequestError } from '@/lib/http';
import { deliverFeedback, feedbackClientKey, feedbackSchema, guardFeedback, prepareFeedbackNotification } from '@/server/feedback';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function POST(request:Request){
  try {
    if(!request.headers.get('origin')||request.headers.get('sec-fetch-site')==='cross-site')throw new RequestError(403,'Please use the reaction buttons in this application.');
    const parsed=feedbackSchema.safeParse(await readPrivateJson(request));
    if(!parsed.success)return NextResponse.json({error:'Choose a supported reaction and company.'},{status:400,headers:PRIVATE_HEADERS});
    const guard=guardFeedback(feedbackClientKey(request),parsed.data.submissionId);
    if(guard==='duplicate')return NextResponse.json({error:'This reaction was already submitted.'},{status:409,headers:PRIVATE_HEADERS});
    if(guard==='limited')return NextResponse.json({error:'Please wait a moment before choosing another reaction.'},{status:429,headers:{...PRIVATE_HEADERS,'Retry-After':'60'}});
    const notification=prepareFeedbackNotification(parsed.data);
    // Intentionally inactive. A future server-only provider adapter must be explicitly connected here.
    return NextResponse.json(await deliverFeedback(notification),{headers:PRIVATE_HEADERS});
  } catch(error) {
    if(!(error instanceof RequestError))console.error('Appreciation endpoint unavailable.');
    return NextResponse.json({error:error instanceof RequestError?error.message:'Your reaction could not be submitted. Please try again.'},{status:error instanceof RequestError?error.status:503,headers:PRIVATE_HEADERS});
  }
}
