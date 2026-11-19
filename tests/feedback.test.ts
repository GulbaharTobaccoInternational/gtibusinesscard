import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { feedbackSchema, feedbackRecipients, prepareFeedbackNotification, deliverFeedback, createFeedbackGuard, feedbackClientKey } from '../src/server/feedback';
import { POST } from '../src/app/api/feedback/route';
const submission=()=>({reactionId:'great-job' as const,companyId:'gti' as const,submissionId:randomUUID()});
const request=(body:unknown,origin='https://cards.example',ip='192.0.2.10')=>new Request('https://cards.example/api/feedback',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json','x-vercel-forwarded-for':ip},body:JSON.stringify(body)});

test('feedback accepts only approved reactions, company IDs and UUIDs; employee/recipient overrides are rejected',()=>{
  for(const reactionId of ['applause','great-job','coffee-treat','hats-off'])for(const companyId of ['gti','doubleLeaf'])assert.ok(feedbackSchema.safeParse({...submission(),reactionId,companyId}).success);
  for(const body of [{...submission(),reactionId:'other'},{...submission(),companyId:'other'},{...submission(),submissionId:'bad'},{...submission(),visitor:'Invented'},{...submission(),recipients:['other@example.com']}])assert.ok(!feedbackSchema.safeParse(body).success);
});
test('notification uses the two intended recipients, trusted company and server event time, with anonymous identity',()=>{
  const date=new Date('2026-11-19T12:00:00Z');
  const notification=prepareFeedbackNotification(submission(),feedbackRecipients('slavomir.kluziak@gulbahartobacco.com,vinu@gulbahartobacco.com'),date);
  assert.deepEqual(notification.recipients,['slavomir.kluziak@gulbahartobacco.com','vinu@gulbahartobacco.com']);
  assert.equal(notification.occurredAt,date.toISOString());assert.equal(notification.visitor,'Anonymous');
  assert.equal(notification.subject,'Mr Ghashi Appreciation — Great Job');assert.match(notification.text,/Selected company: GTI/);assert.match(notification.text,/Anonymous \(not authenticated\)/);
});
test('server recipient configuration deduplicates addresses and rejects invalid/header-injection values',()=>{
  assert.deepEqual(feedbackRecipients('a@example.com, a@example.com'),['a@example.com']);
  assert.throws(()=>feedbackRecipients('a@example.com\r\nBcc: b@example.com'));
});
test('unconfigured delivery is explicitly inactive, and future transport failures cannot become delivery success',async()=>{
  const notification=prepareFeedbackNotification(submission());assert.deepEqual(await deliverFeedback(notification),{mode:'demo',sent:false});
  await assert.rejects(deliverFeedback(notification,{send:async()=>{throw new Error('provider unavailable');}}),/provider unavailable/);
  let key='';assert.deepEqual(await deliverFeedback(notification,{send:async(_,options)=>{key=options.idempotencyKey;}}),{mode:'sent',sent:true});assert.equal(key,notification.id);
});
test('feedback guard rejects repeats, limits requests, expires windows and bounds memory without evicting active clients',()=>{
  const guard=createFeedbackGuard({limit:2,windowMs:100,maxClients:1});
  assert.equal(guard('a','one',0),'allowed');assert.equal(guard('a','one',1),'duplicate');assert.equal(guard('a','two',2),'allowed');assert.equal(guard('a','three',3),'limited');assert.equal(guard('b','one',3),'limited');assert.equal(guard('b','one',101),'allowed');
});
test('rate-limit key is an opaque process-salted digest, separate from visitor identity',()=>{
  const key=feedbackClientKey(request(submission()));assert.equal(key.length,64);assert.ok(!key.includes('192.0.2'));assert.equal(key,feedbackClientKey(request(submission())));assert.notEqual(key,feedbackClientKey(request(submission(),'https://cards.example','192.0.2.11')));
});
test('feedback endpoint rejects cross-origin and invalid requests; valid requests return demo/no-store and repeats are rejected',async()=>{
  assert.equal((await POST(request(submission(),'https://unrelated.example'))).status,403);
  assert.equal((await POST(request({...submission(),reactionId:'other'}))).status,400);
  const event=submission();const response=await POST(request(event));assert.equal(response.status,200);assert.deepEqual(await response.json(),{mode:'demo',sent:false});assert.match(response.headers.get('Cache-Control')!,/no-store/);
  assert.equal((await POST(request(event))).status,409);
});
test('feedback endpoint enforces a submission limit with retry guidance',async()=>{
  for(let i=0;i<10;i++)assert.equal((await POST(request(submission(),'https://cards.example','192.0.2.99'))).status,200);
  const limited=await POST(request(submission(),'https://cards.example','192.0.2.99'));assert.equal(limited.status,429);assert.equal(limited.headers.get('Retry-After'),'60');
});
