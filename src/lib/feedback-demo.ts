import type { CompanyId } from './company';
export const APPRECIATION_RECIPIENT = 'MrGhashi@gulbahartobacco.com';
export const REACTIONS = [
  { id:'applause', label:'Applause' },
  { id:'great-job', label:'Great Job' },
  { id:'coffee-treat', label:'Coffee Treat' },
  { id:'hats-off', label:'Hats Off' },
] as const;
export type AppreciationReaction = typeof REACTIONS[number];
export type FeedbackDemo = {
  mode:'demo'; sent:false; reactionId:AppreciationReaction['id']; reactionLabel:string;
  recipient:string; companyId:CompanyId; timestamp:string;
};
/** Local demonstration payload. A future transport belongs behind a separate explicit integration. */
export function createFeedbackDemo(reaction: AppreciationReaction, companyId: CompanyId): FeedbackDemo {
  return { mode:'demo', sent:false, reactionId:reaction.id, reactionLabel:reaction.label,
    recipient:APPRECIATION_RECIPIENT, companyId, timestamp:new Date().toISOString() };
}
