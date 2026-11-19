'use client';

import { useRef } from 'react';
import { COMPANIES, COMPANY_IDS, type CompanyId } from '@/lib/company';
export function CompanySwitcher({ companyId, disabled, onChange,allowedCompanies=COMPANY_IDS }: { companyId:CompanyId; disabled:boolean; onChange:(id:CompanyId)=>void;allowedCompanies:readonly CompanyId[] }) {
  const buttonRefs = useRef<Partial<Record<CompanyId,HTMLButtonElement|null>>>({});
  return <div className="company-control"><span id="company-label">Create a card for</span><div className="company-segments" role="radiogroup" aria-labelledby="company-label" aria-disabled={disabled} onKeyDown={event=>{
    const index=allowedCompanies.indexOf(companyId);
    const next=event.key==='Home'?allowedCompanies[0]:event.key==='End'?allowedCompanies[allowedCompanies.length-1]:['ArrowRight','ArrowDown'].includes(event.key)?allowedCompanies[(index+1)%allowedCompanies.length]:['ArrowLeft','ArrowUp'].includes(event.key)?allowedCompanies[(index-1+allowedCompanies.length)%allowedCompanies.length]:undefined;
    if(next){event.preventDefault();if(!disabled){onChange(next);buttonRefs.current[next]?.focus();}}
  }}>{allowedCompanies.map(id=><button key={id} ref={element=>{buttonRefs.current[id]=element;}} type="button" role="radio" aria-checked={companyId===id} tabIndex={companyId===id?0:-1} disabled={disabled} title={COMPANIES[id].label} onClick={event=>{event.currentTarget.focus();onChange(id);}}>{COMPANIES[id].shortName}</button>)}</div></div>;
}
