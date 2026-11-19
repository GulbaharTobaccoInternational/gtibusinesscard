/** Operator-only recovery. Run from the project root; never expose as a public endpoint. */
import fs from 'node:fs';
if(fs.existsSync('.env.local'))process.loadEnvFile('.env.local');
const {serviceClient}=await import('../src/server/supabase');
const {deliverQueuedFeedback}=await import('../src/server/feedback');
const client=serviceClient();
const {data,error}=await client.from('feedback_deliveries').select('id').neq('state','accepted').lt('attempts',3).gt('occurred_at',new Date(Date.now()-23*60*60*1000).toISOString()).order('occurred_at').limit(20);
if(error)throw new Error('Could not read the private notification queue.');
for(const item of data)await deliverQueuedFeedback(item.id);
console.log(`Reviewed ${data.length} eligible notification records. Check private provider/outbox state for acceptance; this does not establish inbox delivery.`);
