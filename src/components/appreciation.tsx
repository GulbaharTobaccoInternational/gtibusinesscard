'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { ReactionArt } from './brand-art';
import { REACTIONS, type AppreciationReaction } from '@/lib/feedback-demo';
import type { CompanyId } from '@/lib/company';

export function Appreciation({companyId}:{companyId:CompanyId}){
  const [burst,setBurst]=useState(0),[celebrating,setCelebrating]=useState(false);
  const animationTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
  useEffect(()=>()=>{if(animationTimer.current)clearTimeout(animationTimer.current);},[]);
  function react(reaction:AppreciationReaction){
    if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches){
      setBurst(value=>value+1);setCelebrating(true);
      if(animationTimer.current)clearTimeout(animationTimer.current);
      animationTimer.current=setTimeout(()=>setCelebrating(false),1600);
    }
    // Only confetti is visible. Delivery is authenticated, deduplicated and retried on the server.
    void fetch('/api/feedback',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({reactionId:reaction.id,companyId,submissionId:crypto.randomUUID()}),cache:'no-store',keepalive:true}).catch(()=>{});
  }
  return <section className="appreciation-banner" aria-labelledby="appreciation-title"><div className="appreciation-inner"><div className="appreciation-copy"><h2 id="appreciation-title">Love our digital upgrade?</h2><p>Give GTI Marketing Team some credit!</p></div><div className="reaction-grid" role="group" aria-label="Choose an appreciation reaction">{REACTIONS.map(reaction=><button type="button" key={reaction.id} className="reaction-button" aria-label={reaction.label} onClick={()=>react(reaction)}><ReactionArt id={reaction.id}/><span>{reaction.label}</span></button>)}</div></div>
    {celebrating&&<div key={burst} className="confetti-burst" aria-hidden="true">{Array.from({length:44},(_,index)=><i key={index} style={{'--spread':`${((index*73)%640)-320}px`,'--fall':`${95+(index*37)%110}px`,'--spin':`${180+(index*83)%540}deg`,'--delay':`${(index%5)*24}ms`,'--confetti-color':['#df1236','#ffd43b','#fff','#a87a42'][index%4]} as CSSProperties}/>)}</div>}
  </section>;
}
