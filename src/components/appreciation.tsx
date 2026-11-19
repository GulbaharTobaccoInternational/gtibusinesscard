'use client';

import { useState } from 'react';
import { Check, Heart, Gift } from 'lucide-react';
import { AppDialog } from './dialog';
import { ReactionArt } from './brand-art';
import { REACTIONS, APPRECIATION_RECIPIENT, createFeedbackDemo, type FeedbackDemo } from '@/lib/feedback-demo';
import type { CompanyId } from '@/lib/company';

export function Appreciation({ companyId }: { companyId: CompanyId }) {
  const [open,setOpen] = useState(false);
  const [feedback,setFeedback] = useState<FeedbackDemo|null>(null);
  return <>
    <button type="button" className="appreciation-trigger" onClick={event=>{event.currentTarget.focus();setOpen(true);}}><Gift size={17}/><span>Give credit</span></button>
    {open&&<AppDialog titleId="appreciation-title" className="appreciation-dialog" onClose={()=>setOpen(false)}>
      <div className="appreciation-eyebrow"><Heart size={15}/> A little appreciation goes a long way</div>
      <h2 id="appreciation-title">Love our digital upgrade?</h2>
      <p className="appreciation-intro">Give GTI Marketing Team some credit!</p>
      <div className="reaction-grid" role="group" aria-label="Choose an appreciation reaction">
        {REACTIONS.map(reaction=><button type="button" key={reaction.id} className={`reaction-button ${feedback?.reactionId===reaction.id?'is-selected':''}`} aria-pressed={feedback?.reactionId===reaction.id} onClick={event=>{event.currentTarget.focus();setFeedback(createFeedbackDemo(reaction,companyId));}}>
          <ReactionArt id={reaction.id}/><span>{reaction.label}</span>{feedback?.reactionId===reaction.id&&<Check className="reaction-check" size={17}/>}</button>)}
      </div>
      {feedback?<div className="feedback-confirmation" role="status" aria-live="polite">
        <span className="confirmation-icon"><Check size={20}/></span><div><h3>Thanks for showing some love!</h3><p>Reaction: <strong>{feedback.reactionLabel}</strong></p><p className="feedback-recipient">Recipient: <span>{feedback.recipient}</span></p><p className="demo-notice">Demo mode — no email has been sent.</p></div>
      </div>:<div className="feedback-disclosure"><span className="demo-tag">Demo mode</span><p>Choose a reaction to preview your appreciation.<br/><span>Intended recipient: {APPRECIATION_RECIPIENT}</span></p><strong>No email will be sent.</strong></div>}
    </AppDialog>}
  </>;
}
