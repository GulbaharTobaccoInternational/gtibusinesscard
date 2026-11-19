// Server-only module: Node crypto and recipient configuration must never enter the client graph.
import { createHmac, randomBytes } from 'node:crypto';
import { z } from 'zod';
import { REACTIONS, type FeedbackResult } from '../lib/feedback-demo';
import { companyIdSchema, getCompany } from '../lib/company';

export const feedbackSchema=z.object({reactionId:z.enum(REACTIONS.map(reaction=>reaction.id)),companyId:companyIdSchema,submissionId:z.uuid()}).strict();
export type FeedbackSubmission=z.infer<typeof feedbackSchema>;
const DEFAULT_RECIPIENTS=['slavomir.kluziak@gulbahartobacco.com','vinu@gulbahartobacco.com'];
export function feedbackRecipients(value=process.env.MR_GHASHI_FEEDBACK_RECIPIENTS){
  return z.array(z.email()).min(1).max(5).parse(value?[...new Set(value.split(',').map(email=>email.trim()))]:DEFAULT_RECIPIENTS);
}
export function prepareFeedbackNotification(submission:FeedbackSubmission,recipients=feedbackRecipients(),now=new Date()){
  const reaction=REACTIONS.find(item=>item.id===submission.reactionId)!;
  const company=getCompany(submission.companyId).shortName;
  return {id:submission.submissionId,recipients,reactionId:reaction.id,reactionLabel:reaction.label,companyId:submission.companyId,occurredAt:now.toISOString(),visitor:'Anonymous',subject:`Mr Ghashi Appreciation — ${reaction.label}`,text:`Mr Ghashi has received a new appreciation reaction!\n\nReaction: ${reaction.label}\nSelected company: ${company}\nDate and time: ${now.toISOString()}\nVisitor: Anonymous (not authenticated)\nApplication: Mr Ghashi`};
}
export type FeedbackNotification=ReturnType<typeof prepareFeedbackNotification>;
export type FeedbackTransport={send:(notification:FeedbackNotification,options:{idempotencyKey:string})=>Promise<void>};
/** No provider is wired into the route. Credentials alone cannot activate email delivery. */
export async function deliverFeedback(notification:FeedbackNotification,transport:FeedbackTransport|null=null):Promise<FeedbackResult>{
  if(!transport)return {mode:'demo',sent:false};
  await transport.send(notification,{idempotencyKey:notification.id});
  return {mode:'sent',sent:true};
}

/** Bounded, expiring process-local protection for demo mode; not a deployment-wide email quota. */
export function createFeedbackGuard({limit=10,windowMs=60_000,maxClients=2048}={}){
  const clients=new Map<string,{expires:number;ids:Set<string>}>();
  return (key:string,id:string,now=Date.now()):'allowed'|'duplicate'|'limited'=>{
    let client=clients.get(key);
    if(client&&client.expires<=now){clients.delete(key);client=undefined;}
    if(client?.ids.has(id))return 'duplicate';
    if(client&&client.ids.size>=limit)return 'limited';
    if(!client){
      if(clients.size>=maxClients)for(const [oldKey,value] of clients)if(value.expires<=now)clients.delete(oldKey);
      if(clients.size>=maxClients)return 'limited';
      client={expires:now+windowMs,ids:new Set()};clients.set(key,client);
    }
    client.ids.add(id);return 'allowed';
  };
}
const salt=randomBytes(32);
export const guardFeedback=createFeedbackGuard();
export function feedbackClientKey(request:Request){
  const ip=(request.headers.get('x-vercel-forwarded-for')??request.headers.get('x-forwarded-for')??'local').slice(0,200).split(',')[0].trim();
  return createHmac('sha256',salt).update(ip).digest('hex');
}
