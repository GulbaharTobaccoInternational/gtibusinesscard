// Node-only notification delivery. Never imported by client components.
import { z } from 'zod';
import { REACTIONS } from '../lib/feedback-demo';
import { companyIdSchema, getCompany } from '../lib/company';
import { serviceClient } from './supabase';
import type { AuthorizedUser } from '../lib/access';
import { RequestError } from '../lib/http';
import { takeQuota } from './limits';

export const feedbackSchema=z.object({reactionId:z.enum(REACTIONS.map(reaction=>reaction.id)),companyId:companyIdSchema,submissionId:z.uuid()}).strict();
export type FeedbackSubmission=z.infer<typeof feedbackSchema>;
export const FEEDBACK_RECIPIENTS=['slavomir.kluziak@gulbahartobacco.com','vinu@gulbahartobacco.com'];
export const FEEDBACK_FROM='Mr Ghashi <notifications@auth.mrghashi.com>';
export type Delivery={id:string;auth_user_id:string;actor_name:string;actor_email:string;reaction_id:FeedbackSubmission['reactionId'];company_id:FeedbackSubmission['companyId'];occurred_at:string;attempts:number};
export function prepareFeedbackNotification(delivery:Delivery){
  const reaction=REACTIONS.find(item=>item.id===delivery.reaction_id)!;
  return {from:FEEDBACK_FROM,to:FEEDBACK_RECIPIENTS,subject:`Mr Ghashi Appreciation — ${reaction.label}`,text:`Mr Ghashi has received a new appreciation reaction!\n\nEmployee: ${delivery.actor_name}\nEmail: ${delivery.actor_email}\nReaction: ${reaction.label}\nSelected company: ${getCompany(delivery.company_id).shortName}\nDate and time (UTC): ${delivery.occurred_at}\nWebsite: https://www.mrghashi.com\n\nAn Internal Web Application by GTI Marketing Department`};
}
export class DeliveryError extends Error {constructor(public code:string,public retryable:boolean){super('Notification provider rejected the request.');}}
export async function sendNotification(delivery:Delivery,send:typeof fetch=fetch){
  const key=process.env.RESEND_API_KEY;if(!key)throw new DeliveryError('configuration',false);
  let response:Response;
  try{response=await send('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json','Idempotency-Key':`appreciation/${delivery.id}`},body:JSON.stringify(prepareFeedbackNotification(delivery)),signal:AbortSignal.timeout(7000)});}
  catch{throw new DeliveryError('network',true);}
  if(!response.ok)throw new DeliveryError(`provider_${response.status}`,response.status===429||response.status>=500);
  const result=await response.json() as {id?:string};
  if(!result.id)throw new DeliveryError('invalid_response',true);
  return result.id; // Provider acceptance is not proof of inbox delivery.
}
export async function queueFeedback(submission:FeedbackSubmission,user:AuthorizedUser){
  const client=serviceClient();
  const {data:existing,error:lookupError}=await client.from('feedback_deliveries').select('id').eq('id',submission.submissionId).eq('auth_user_id',user.auth_user_id).maybeSingle();
  if(lookupError)throw lookupError;if(existing)return;
  await takeQuota('reaction-user',user.auth_user_id,10,60);
  const {error}=await client.from('feedback_deliveries').insert({id:submission.submissionId,auth_user_id:user.auth_user_id,actor_name:user.full_name,actor_email:user.email,reaction_id:submission.reactionId,company_id:submission.companyId});
  if(error){
    if(error.code==='23505'){
      const {data:owned}=await client.from('feedback_deliveries').select('id').eq('id',submission.submissionId).eq('auth_user_id',user.auth_user_id).maybeSingle();
      if(owned)return;
      throw new RequestError(409,'This reaction identifier is already in use.');
    }
    throw new RequestError(503,'The reaction could not be recorded.');
  }
}
export async function deliverQueuedFeedback(id:string){
  const client=serviceClient();
  for(let attempt=0;attempt<3;attempt++){
    const {data,error}=await client.rpc('claim_feedback',{p_id:id});
    if(error){console.error('Appreciation delivery claim failed.',{event:id});return;}
    const delivery=(data as Delivery[]|null)?.[0];if(!delivery)return;
    try{
      const providerId=await sendNotification(delivery);
      const {error:recordError}=await client.from('feedback_deliveries').update({state:'accepted',provider_id:providerId,error_code:null,lease_until:null,updated_at:new Date().toISOString()}).eq('id',id);
      if(recordError)console.error('Appreciation acceptance record failed.',{event:id});
      return;
    }catch(error){
      const failure=error instanceof DeliveryError?error:new DeliveryError('unexpected',true);
      await client.from('feedback_deliveries').update({state:'failed',error_code:failure.code,lease_until:null,updated_at:new Date().toISOString()}).eq('id',id);
      console.error('Appreciation delivery failed.',{event:id,attempt:delivery.attempts,code:failure.code});
      if(!failure.retryable||delivery.attempts>=3)return;
      await new Promise(resolve=>setTimeout(resolve,attempt===0?300:1000));
    }
  }
}
