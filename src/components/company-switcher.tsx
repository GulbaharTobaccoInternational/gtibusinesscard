'use client';

import { useRef } from 'react';
import { COMPANIES, COMPANY_IDS, type CompanyId } from '@/lib/company';
export function CompanySwitcher({ companyId, disabled, onChange }: { companyId:CompanyId; disabled:boolean; onChange:(id:CompanyId)=>void }) {
  const buttonRefs = useRef<Partial<Record<CompanyId,HTMLButtonElement|null>>>({});
  return <div className="company-control"><span id="company-label">Create a card for</span><div className="company-segments" role="radiogroup" aria-labelledby="company-label" aria-disabled={disabled} onKeyDown={event=>{
    const index=COMPANY_IDS.indexOf(companyId);
    const next=event.key==='Home'?COMPANY_IDS[0]:event.key==='End'?COMPANY_IDS[COMPANY_IDS.length-1]:['ArrowRight','ArrowDown'].includes(event.key)?COMPANY_IDS[(index+1)%COMPANY_IDS.length]:['ArrowLeft','ArrowUp'].includes(event.key)?COMPANY_IDS[(index-1+COMPANY_IDS.length)%COMPANY_IDS.length]:undefined;
    if(next){event.preventDefault();if(!disabled){onChange(next);buttonRefs.current[next]?.focus();}}
  }}>{COMPANY_IDS.map(id=><button key={id} ref={element=>{buttonRefs.current[id]=element;}} type="button" role="radio" aria-checked={companyId===id} tabIndex={companyId===id?0:-1} disabled={disabled} title={COMPANIES[id].label} onClick={event=>{event.currentTarget.focus();onChange(id);}}>{COMPANIES[id].shortName}</button>)}</div></div>;
}
