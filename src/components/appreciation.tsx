'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { ReactionArt } from './brand-art';
import { REACTIONS, type AppreciationReaction } from '@/lib/feedback-demo';
import type { CompanyId } from '@/lib/company';

const particles = Array.from({ length: 44 }, (_, index) => (
  <i key={index} style={{
    '--spread': `${((index * 73) % 640) - 320}px`, '--fall': `${95 + (index * 37) % 110}px`,
    '--spin': `${180 + (index * 83) % 540}deg`, '--delay': `${(index % 5) * 24}ms`,
    '--confetti-color': ['#df1236', '#ffd43b', '#fff', '#a87a42'][index % 4],
  } as CSSProperties} />
));

function ReactionButton({ reaction, companyId }: { reaction: AppreciationReaction; companyId: CompanyId }) {
  const [burst, setBurst] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  function react() {
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setBurst(value => value + 1);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setBurst(0), 1600);
    }
    void fetch('/api/feedback', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reactionId: reaction.id, companyId, submissionId: crypto.randomUUID() }),
      cache: 'no-store', keepalive: true,
    }).catch(() => {});
  }

  return <button type="button" className="reaction-button" aria-label={reaction.label} onClick={react}>
    <span className="reaction-icon"><ReactionArt id={reaction.id} />
      {burst > 0 && <span key={burst} className="confetti-burst" aria-hidden="true">{particles}</span>}
    </span>
    <span>{reaction.label}</span>
  </button>;
}

export function Appreciation({ companyId }: { companyId: CompanyId }) {
  return <section className="appreciation-banner" aria-labelledby="appreciation-title">
    <div className="appreciation-inner">
      <div className="appreciation-copy"><h2 id="appreciation-title">Love our digital upgrade?</h2><p>Give GTI Marketing Team some credit!</p></div>
      <div className="reaction-grid" role="group" aria-label="Choose an appreciation reaction">
        {REACTIONS.map(reaction => <ReactionButton key={reaction.id} reaction={reaction} companyId={companyId} />)}
      </div>
    </div>
  </section>;
}
