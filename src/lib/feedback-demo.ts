export const REACTIONS = [
  { id:'applause', label:'Applause' },
  { id:'great-job', label:'Great Job' },
  { id:'coffee-treat', label:'Coffee Treat' },
  { id:'hats-off', label:'Hats Off' },
] as const;
export type AppreciationReaction = typeof REACTIONS[number];
export type FeedbackResult = {mode:'demo';sent:false}|{mode:'sent';sent:true};
