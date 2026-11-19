import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { feedbackSchema, FEEDBACK_RECIPIENTS, FEEDBACK_FROM, prepareFeedbackNotification, sendNotification, DeliveryError, type Delivery } from '../src/server/feedback';
const submission=()=>({reactionId:'great-job' as const,companyId:'gti' as const,submissionId:randomUUID()});
const delivery=():Delivery=>({id:randomUUID(),auth_user_id:randomUUID(),actor_name:'Test Employee',actor_email:'employee@example.com',reaction_id:'great-job',company_id:'gti',occurred_at:'2026-11-19T12:00:00Z',attempts:1});

test('feedback accepts approved reactions and rejects client identity, recipient or timestamp overrides',()=>{
  for(const reactionId of ['applause','great-job','coffee-treat','hats-off'])for(const companyId of ['gti','doubleLeaf'])assert.ok(feedbackSchema.safeParse({...submission(),reactionId,companyId}).success);
  for(const body of [{...submission(),reactionId:'other'},{...submission(),companyId:'other'},{...submission(),submissionId:'bad'},{...submission(),actor_email:'invented@example.com'},{...submission(),recipients:['other@example.com']},{...submission(),occurred_at:'invented'}])assert.ok(!feedbackSchema.safeParse(body).success);
});
test('notification uses verified identity, server time, fixed sender and both intended recipients',()=>{
  const event=delivery(),notification=prepareFeedbackNotification(event);
  assert.equal(notification.from,FEEDBACK_FROM);assert.deepEqual(notification.to,FEEDBACK_RECIPIENTS);
  assert.deepEqual(notification.to,['slavomir.kluziak@gulbahartobacco.com','vinu@gulbahartobacco.com']);
  for(const value of [event.actor_name,event.actor_email,event.occurred_at,'Great Job','GTI','https://www.mrghashi.com'])assert.ok(notification.text.includes(value));
  assert.ok(!notification.text.includes('Anonymous'));
});
test('provider requests carry stable idempotency and return acceptance only on a valid successful response',async()=>{
  const old=process.env.RESEND_API_KEY;process.env.RESEND_API_KEY='test-key';
  try{
    const event=delivery();let calls=0;
    const mock:typeof fetch=async(url,options)=>{calls++;assert.equal(url,'https://api.resend.com/emails');assert.equal(new Headers(options?.headers).get('Idempotency-Key'),`appreciation/${event.id}`);const body=JSON.parse(String(options?.body));assert.deepEqual(body.to,FEEDBACK_RECIPIENTS);assert.equal(body.from,FEEDBACK_FROM);return Response.json({id:'provider-id'});};
    assert.equal(await sendNotification(event,mock),'provider-id');assert.equal(calls,1);
    await assert.rejects(sendNotification(event,async()=>Response.json({error:'unavailable'},{status:503})),(error:unknown)=>error instanceof DeliveryError&&error.retryable&&error.code==='provider_503');
    await assert.rejects(sendNotification(event,async()=>Response.json({error:'invalid sender'},{status:403})),(error:unknown)=>error instanceof DeliveryError&&!error.retryable);
    await assert.rejects(sendNotification(event,async()=>Response.json({})),(error:unknown)=>error instanceof DeliveryError&&error.code==='invalid_response');
    await assert.rejects(sendNotification(event,async()=>{throw new Error('network');}),(error:unknown)=>error instanceof DeliveryError&&error.retryable);
  }finally{if(old===undefined)delete process.env.RESEND_API_KEY;else process.env.RESEND_API_KEY=old;}
});
