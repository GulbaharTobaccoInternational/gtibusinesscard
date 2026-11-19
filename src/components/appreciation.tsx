'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Check } from 'lucide-react';
import { ReactionArt } from './brand-art';
import { REACTIONS, type AppreciationReaction, type FeedbackResult } from '@/lib/feedback-demo';
import type { CompanyId } from '@/lib/company';

export function Appreciation({ companyId }: { companyId: CompanyId }) {
  const [selected,setSelected] = useState<AppreciationReaction['id']|null>(null);
  const [pending,setPending] = useState(false);
  const [message,setMessage] = useState('');
  const [burst,setBurst] = useState(0);
  const [celebrating,setCelebrating] = useState(false);
  const requestRef = useRef<AbortController|null>(null);
  const animationTimer = useRef<ReturnType<typeof setTimeout>|null>(null);
  useEffect(()=>()=>{requestRef.current?.abort();if(animationTimer.current)clearTimeout(animationTimer.current);},[]);
  async function react(reaction:AppreciationReaction) {
    if(requestRef.current)return;
    setSelected(reaction.id);setMessage('');setPending(true);
    if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches){
      setBurst(value=>value+1);setCelebrating(true);
      if(animationTimer.current)clearTimeout(animationTimer.current);
      animationTimer.current=setTimeout(()=>setCelebrating(false),1600);
    }
    const controller=new AbortController();requestRef.current=controller;
    const requestTimeout=setTimeout(()=>controller.abort('timeout'),8000);
    try {
      const response=await fetch('/api/feedback',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({reactionId:reaction.id,companyId,submissionId:crypto.randomUUID()}),signal:controller.signal,cache:'no-store'});
      const result=await response.json() as FeedbackResult;
      if(!response.ok)throw new Error(response.status===429?'Please wait a moment before choosing another reaction. No email has been sent.':'Your reaction could not be submitted. Please try again. No email has been sent.');
      if(result.mode==='demo'&&result.sent===false)setMessage(`Thanks for the ${reaction.label}! Demo mode — no email has been sent.`);
      else if(result.mode==='sent'&&result.sent===true)setMessage('Thanks for showing some love! Your appreciation was sent.');
      else throw new Error('Your reaction could not be confirmed. Please try again.');
    } catch(error) {
      if(!controller.signal.aborted||controller.signal.reason==='timeout')setMessage(error instanceof Error&&error.message.includes('No email has been sent.')?error.message:'Your reaction could not be confirmed. Please try again. No email has been sent.');
    } finally {clearTimeout(requestTimeout);requestRef.current=null;setPending(false);}
  }
  return <section className="appreciation-banner" aria-labelledby="appreciation-title">
    <div className="appreciation-inner"><div className="appreciation-copy"><h2 id="appreciation-title">Love our digital upgrade?</h2><p>Give GTI Marketing Team some credit!</p></div>
      <div className="reaction-grid" role="group" aria-label="Choose an appreciation reaction" aria-busy={pending}>
        {REACTIONS.map(reaction=><button type="button" key={reaction.id} className={`reaction-button ${selected===reaction.id?'is-selected':''}`} aria-pressed={selected===reaction.id} aria-label={reaction.label} disabled={pending} onClick={()=>void react(reaction)}><ReactionArt id={reaction.id}/><span>{reaction.label}</span>{selected===reaction.id&&<Check className="reaction-check" size={14}/>}</button>)}
      </div>
      <p className="appreciation-status" role="status" aria-live="polite">{pending?'Celebrating your support…':message}</p>
    </div>
    {celebrating&&<div key={burst} className="confetti-burst" aria-hidden="true">{Array.from({length:32},(_,index)=><i key={index} style={{'--spread':`${((index*73)%560)-280}px`,'--fall':`${95+(index*37)%110}px`,'--spin':`${180+(index*83)%540}deg`,'--delay':`${(index%5)*24}ms`,'--confetti-color':['#df1236','#ffd43b','#fff','#a87a42'][index%4]} as CSSProperties}/>)}</div>}
  </section>;
}
