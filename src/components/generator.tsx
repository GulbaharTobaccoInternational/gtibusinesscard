'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Check, ChevronDown, CircleHelp, Copy, Download, LoaderCircle, QrCode, RotateCcw, ShieldCheck, Sparkles, X } from 'lucide-react';
import { EMPTY_EMPLOYEE, type Employee, type Issue } from '@/lib/employee';
import { COMPANY_IDS, getCompany, type CompanyId } from '@/lib/company';
import { DEMO_EMPLOYEES, isDemoEmployee } from '@/lib/demo';
import type { PreviewResult } from '@/lib/renderer';
import type { ExportSettings } from '@/lib/export';
import { MrGhashiBrand } from './brand-art';
import { CompanySwitcher } from './company-switcher';
import { Appreciation } from './appreciation';
import { AppDialog } from './dialog';
import { ExportPanel } from './export-panel';

type Props={ initials:Record<CompanyId,PreviewResult>; brandSvgs:Record<CompanyId,string> };
type CompanyProps={initial:PreviewResult;companyId:CompanyId;initialEmployee:Employee;saveEmployee:(employee:Employee)=>void;onExportBusyChange:(busy:boolean)=>void};
export default function Generator({initials,brandSvgs}:Props){
  const [companyId,setCompanyId]=useState<CompanyId>('gti');
  const [exportBusy,setExportBusy]=useState(false);
  const [showHelp,setShowHelp]=useState(false);
  const [employees,setEmployees]=useState<Record<CompanyId,Employee>>(()=>({gti:{...EMPTY_EMPLOYEE},doubleLeaf:{...EMPTY_EMPLOYEE}}));
  useEffect(()=>{
    const timer=setTimeout(()=>{try{const saved=localStorage.getItem('business-card-company');if(COMPANY_IDS.includes(saved as CompanyId))setCompanyId(saved as CompanyId);}catch{}},0);
    return()=>clearTimeout(timer);
  },[]);
  const switchCompany=(id:CompanyId)=>{
    if(!COMPANY_IDS.includes(id))return;
    setCompanyId(id);try{localStorage.setItem('business-card-company',id);}catch{}
  };
  const company=getCompany(companyId);
  return <div className="app-shell" data-company={companyId} style={{'--company-accent':company.accent,'--company-soft':company.accentSoft} as CSSProperties}>
    <a className="skip-link" href="#employee-details">Skip to employee details</a>
    <header className="app-header"><div className="header-inner">
      <Link className="app-brand" href="/" aria-label="Mr Ghashi — Your Biz Card Genius"><MrGhashiBrand/></Link>
      <div className="header-right"><div className="ownership-group"><span className="ownership-logo" role="img" aria-label="Gulbahar Tobacco International" dangerouslySetInnerHTML={{__html:brandSvgs.gti}}/><p className="department-credit">An Internal Web Application by GTI Marketing Department</p></div></div>
    </div></header>
    <Appreciation companyId={companyId}/>
    <main className="main-shell">
      <div className="workspace-heading"><div className="workspace-actions"><CompanySwitcher companyId={companyId} disabled={exportBusy} onChange={switchCompany}/><a className="export-shortcut" href="#export-options"><Download size={16}/>Export card</a></div></div>
      <CompanyGenerator key={companyId} companyId={companyId} initial={initials[companyId]} initialEmployee={employees[companyId]} saveEmployee={next=>setEmployees(previous=>({...previous,[companyId]:next}))} onExportBusyChange={setExportBusy}/>
      <footer className="page-footer"><span>Mr Ghashi <span className="footer-divider">/</span> Your Biz Card Genius</span><span className="footer-note">Made for good introductions.</span><button type="button" className="text-button footer-help" onClick={event=>{event.currentTarget.focus();setShowHelp(true);}}><CircleHelp size={14}/>Help &amp; print guide</button></footer>
    </main>
    {showHelp&&<AppDialog titleId="help-title" className="help-dialog" onClose={()=>setShowHelp(false)}><span className="eyebrow">A QUICK GUIDE</span><h2 id="help-title">A great card, in a few steps.</h2><ol><li><strong>Make it yours.</strong> Select your company and enter your employee details, or try the fictional sample.</li><li><strong>Check your card.</strong> Review both sides and scan the QR to confirm the digital contact.</li><li><strong>Choose your download.</strong> Select Front Only or Front + Back, then export.</li></ol><div className="help-note"><ShieldCheck size={20}/><p>For your printer, choose Print-Ready PDF. Your card is 92 × 57 mm with vector outlines and no extra bleed. Print at 100% scale.</p></div><p>Company details and approved templates are maintained by GTI Marketing. Unsupported characters and text that exceeds the approved layout are flagged before export.</p><button type="button" className="button print-button" onClick={()=>setShowHelp(false)}>Got it</button></AppDialog>}
  </div>;
}
function CompanyGenerator({initial,companyId,initialEmployee,saveEmployee,onExportBusyChange}:CompanyProps){
  const COMPANY=getCompany(companyId);
  const storageKey=`business-card-sides-${companyId}`;
  const [employee,setEmployee]=useState<Employee>({...initialEmployee,primaryMobile:'mobile'});
  const [preview,setPreview]=useState(initial);
  const [side,setSide]=useState<'front'|'back'>('front');
  const [sides,setSides]=useState<'front'|'both'>('both');
  const [dpi,setDpi]=useState<300|600>(600);
  const [busy,setBusy]=useState<ExportSettings['format']|null>(null);
  const [updating,setUpdating]=useState(true);
  const [renderError,setRenderError]=useState('');
  const [downloadError,setDownloadError]=useState('');
  const [notice,setNotice]=useState('');
  const [touched,setTouched]=useState<Set<string>>(new Set());
  const [submitted,setSubmitted]=useState(false);
  const [acknowledge,setAcknowledge]=useState(false);
  const [showPayload,setShowPayload]=useState(false);
  const [showMobile,setShowMobile]=useState(false);
  const requestId=useRef(0);
  const currentEmployee=useRef(employee);
  const controller=useRef<AbortController|null>(null);
  const previewEmployee=useRef('');
  useEffect(()=>{
    const saved=sessionStorage.getItem(storageKey)??(companyId==='gti'?sessionStorage.getItem('gulbahar-export-sides'):null);
    const timer=setTimeout(()=>{if(saved==='front'||saved==='both')setSides(saved);},0);
    return()=>clearTimeout(timer);
  },[storageKey,companyId]);
  useEffect(()=>{
    const id=++requestId.current;
    controller.current?.abort();
    const abort=new AbortController();controller.current=abort;
    const timer=setTimeout(async()=>{
      setUpdating(true);setRenderError('');
      try{
        const response=await fetch('/api/render',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({companyId,employee}),signal:abort.signal,cache:'no-store'});
        const body=await response.json();
        if(!response.ok)throw new Error(body.error||'The preview could not be updated.');
        if(body.companyId!==companyId)throw new Error('The preview company did not match the selected company. Please try again.');
        if(id===requestId.current){setPreview(body);previewEmployee.current=JSON.stringify({companyId,employee});setUpdating(false);}
      }catch(error){if(!abort.signal.aborted&&id===requestId.current){setRenderError(error instanceof Error?error.message:'Could not update the preview.');setUpdating(false);}}
    },180);
    return()=>{clearTimeout(timer);abort.abort();};
  },[employee,companyId]);
  useEffect(()=>{if(!notice)return;const timer=setTimeout(()=>setNotice(''),4500);return()=>clearTimeout(timer);},[notice]);
  const update=<K extends keyof Employee>(key:K,value:Employee[K])=>{
    const next={...currentEmployee.current,[key]:value};currentEmployee.current=next;setEmployee(next);saveEmployee(next);
    setAcknowledge(false);setDownloadError('');setUpdating(true);
  };
  const touch=(field:string)=>setTouched(old=>new Set(old).add(field));
  const visible=(issue:Issue)=>submitted||touched.has(issue.field)||issue.field==='qr'||issue.field==='assets';
  // The form always prints Employee mobile. Keep legacy API phone selection out of the UI.
  const formIssues=preview.issues.filter(issue=>issue.field!=='primaryMobile').map(issue=>issue.code==='overflow-mobile'?{...issue,message:'The printed phone line is too long. Remove unnecessary spaces or punctuation from Employee mobile.'}:issue);
  if(!employee.mobile.trim())formIssues.push({field:'mobile',message:'Employee mobile is required.',severity:'error',code:'required-mobile'});
  const fieldError=(field:keyof Employee)=>formIssues.find(i=>i.field===field&&i.severity==='error'&&visible(i));
  const errors=formIssues.filter(i=>i.severity==='error');
  const warnings=preview.issues.filter(i=>i.severity==='warning');
  const densityWarning=warnings.find(i=>i.code==='qr-density');
  const complete=['firstName','lastName','designation','email','mobile'].filter(key=>String(employee[key as keyof Employee]).trim()).length;
  const ready=errors.length===0&&!updating&&!renderError;
  const field=(key:keyof Employee,label:string,placeholder:string,required=false,type='text',hint?:string)=>(
    <div className={`field ${fieldError(key)?'has-error':''}`}>
      <label htmlFor={key}>{label}{required&&<span className="required">*</span>}</label>
      <input id={key} name={key} value={String(employee[key])} type={type} autoComplete="off" inputMode={type==='tel'?'tel':type==='email'?'email':undefined} maxLength={key==='email'?254:key==='extension'?8:type==='tel'?36:160} required={required} placeholder={placeholder} onChange={event=>update(key,event.target.value as Employee[typeof key])} onBlur={()=>touch(key)} aria-invalid={!!fieldError(key)} aria-describedby={fieldError(key)?`${key}-error`:hint?`${key}-hint`:undefined}/>
      {fieldError(key)?<p className="field-error" id={`${key}-error`}>{fieldError(key)!.message}</p>:hint?<p className="field-hint" id={`${key}-hint`}>{hint}</p>:null}
    </div>
  );
  const loadSample=()=>{
    const next={...DEMO_EMPLOYEES[companyId]};
    currentEmployee.current=next;setEmployee(next);saveEmployee(next);setTouched(new Set());setSubmitted(false);setAcknowledge(false);setUpdating(true);setNotice('Fictional demo data loaded. Replace it with your own details.');
  };
  const reset=()=>{
    const next={...EMPTY_EMPLOYEE};currentEmployee.current=next;setEmployee(next);saveEmployee(next);setTouched(new Set());setSubmitted(false);setAcknowledge(false);setUpdating(true);setDownloadError('');setNotice('Employee details cleared.');
  };
  const download=async(format:ExportSettings['format'])=>{
    setSubmitted(true);setDownloadError('');
    if(updating||renderError||previewEmployee.current!==JSON.stringify({companyId,employee})){setDownloadError('Wait for the latest preview to finish updating.');return;}
    if(errors.length){setDownloadError('Complete the highlighted details before downloading.');document.querySelector<HTMLInputElement>(`[name="${errors[0].field}"]`)?.focus();return;}
    if(warnings.length&&!acknowledge){setDownloadError('Review and acknowledge the QR print guidance below.');return;}
    setBusy(format);onExportBusyChange(true);
    try{
      const response=await fetch('/api/export',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({companyId,employee,settings:{sides,dpi,format,acknowledgeQrWarning:acknowledge}})});
      if(!response.ok){const body=await response.json();throw new Error(body.issues?.[0]?.message||body.error||'The download could not be created.');}
      const blob=await response.blob();const url=URL.createObjectURL(blob);
      const disposition=response.headers.get('Content-Disposition')??'';
      const encoded=disposition.match(/filename\*=UTF-8''([^;]+)/)?.[1];
      const filename=encoded?decodeURIComponent(encoded):(disposition.match(/filename="([^"]+)"/)?.[1]??'Business_Card.pdf');
      const link=document.createElement('a');link.href=url;link.download=filename;document.body.append(link);link.click();link.remove();
      setTimeout(()=>URL.revokeObjectURL(url),60_000);setNotice(`${format==='print'?'Print PDF':format==='digital'?'Digital PDF':sides==='both'?'PNG ZIP':'PNG'} downloaded.`);
    }catch(error){setDownloadError(error instanceof Error?error.message:'Please try downloading again.');}finally{setBusy(null);onExportBusyChange(false);}
  };
  return <div className="studio-grid">
    <aside className="editor-panel" aria-label="Employee details form" id="employee-details">
      <div className="editor-heading"><div><h2>Employee details</h2><p>A few details. One great first impression.</p></div><button type="button" className="icon-button reset-button" onClick={reset} aria-label="Reset employee details" title="Reset details"><RotateCcw size={17}/></button></div>
      <div className="sample-row"><button type="button" className="sample-button" onClick={loadSample}><Sparkles size={15}/> Use sample employee</button>{isDemoEmployee(employee,companyId)&&<span className="demo-tag">Demo data</span>}</div>
      <form onSubmit={event=>{event.preventDefault();void download('print');}} noValidate>
        <section className="form-section identity-section" aria-label="Personal information">
          <div className="field-grid">{field('firstName','First name',companyId==='gti'?'Alex':'Jordan',true)}{field('lastName','Last name',companyId==='gti'?'Morgan':'Taylor',true)}</div>
          {field('designation','Designation / job title',companyId==='gti'?'Marketing Manager':'Operations Coordinator',true)}
          {field('email','Work email',`you@${COMPANY.website.replace(/^www\./,'')}`,true,'email')}
        </section>
        <section className="form-section contact-section"><h3>Contact information</h3>
          {field('mobile','Employee mobile','+971 50 000 0000',true,'tel','Include country code, e.g. +971.')}
        </section>
        <details className="advanced-details"><summary><span>Additional QR / vCard Details<small>Optional information included when someone scans your business card&apos;s QR code.</small></span><ChevronDown size={17}/></summary><div className="advanced-fields">
          <div className="office-fields">{field('workPhone','Work phone / direct office','+971 4 000 0000',false,'tel')}{field('extension','Extension','105')}</div>
          {field('companyMobile','Company-provided mobile','+971 50 000 0000',false,'tel')}{field('privatePhone','Private phone','+971 50 000 0000',false,'tel')}{field('additionalPhone','Additional phone','+971 50 000 0000',false,'tel')}{field('workFax','Work fax (QR only)','+971 4 000 0000',false,'tel')}{field('privateFax','Private fax (QR only)','+971 4 000 0000',false,'tel')}
          <p className="field-hint">These additional numbers are saved in the digital contact.</p>
        </div></details>
        <section className="qr-settings" aria-label="QR Code"><div className="qr-settings-heading"><h3>Digital contact</h3><label className="switch"><input type="checkbox" checked={employee.includeQr} onChange={event=>update('includeQr',event.target.checked)} aria-label="Include QR Code"/><span/></label></div>
          {employee.includeQr?<><div className="qr-info"><div className="qr-mini" dangerouslySetInnerHTML={{__html:preview.qr?.svg??''}}/><div><strong>One scan. All your details.</strong><p>A contact that is ready to save.</p><span className="vcard-label">vCard 3.0</span></div></div>
            {COMPANY.telephone&&<label className="check-label company-qr-check"><input type="checkbox" checked={employee.includeCompanyPhone} onChange={event=>update('includeCompanyPhone',event.target.checked)}/> Include company telephone in QR</label>}
            <button className="text-button inspect-button" type="button" onClick={()=>setShowPayload(!showPayload)}><QrCode size={15}/>{showPayload?'Hide':'View'} QR / vCard details<ChevronDown size={14} className={showPayload?'rotate-icon':''}/></button>
            {showPayload&&<div className="payload-panel"><pre>{preview.qr?.payload}</pre><button type="button" className="text-button" onClick={async()=>{try{await navigator.clipboard.writeText(preview.qr?.payload??'');setNotice('vCard details copied.');}catch{setNotice('Select and copy the contact details above.');}}}><Copy size={13}/> Copy vCard</button></div>}
          </>:<div className="qr-disabled"><QrCode size={22}/><p>QR code is off. Your card keeps its approved layout.</p></div>}
        </section>
      </form>
    </aside>
    <div className="preview-column">
      <section className="preview-panel" aria-label="Card Preview">
        <div className="preview-toolbar"><h2>Live preview</h2><div className="side-tabs" role="tablist" aria-label="Preview side">{(['front','back'] as const).map(value=><button key={value} type="button" role="tab" id={`preview-${value}-tab`} aria-controls="preview-artwork" aria-selected={side===value} tabIndex={side===value?0:-1} onClick={()=>setSide(value)} onKeyDown={event=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(event.key)){event.preventDefault();const next=event.key==='Home'?'front':event.key==='End'?'back':side==='front'?'back':'front';setSide(next);document.getElementById(`preview-${next}-tab`)?.focus();}}}>{value==='front'?'Front':'Back'}</button>)}</div></div>
        <div className="preview-stage"><div className="card-viewport"><div className="business-card" data-testid="business-card" id="preview-artwork" role="tabpanel" aria-labelledby={`preview-${side}-tab`} dangerouslySetInnerHTML={{__html:side==='front'?preview.front:preview.back}}/></div>
          <div className="canvas-toolbar"><span>{side==='front'?'Personalized front':'Official reverse'} <span className="canvas-dimension">92 × 57 mm</span></span></div>
        </div>
        <div className="preview-status" aria-live="polite"><span className={ready?'status-ready':renderError?'status-error':'status-neutral'}>{updating?<LoaderCircle size={14} className="spinner"/>:ready?<Check size={14}/>:renderError?<X size={14}/>:null}{updating?'Updating your card…':renderError?'Preview unavailable':ready?'Your card is ready to export':`Add your details · ${complete} of 5 required fields`}</span><button type="button" className="text-button" onClick={()=>setShowMobile(!showMobile)}><QrCode size={14}/>{showMobile?'Close QR view':'Test your QR'}</button></div>
        {renderError&&<p role="alert" className="inline-error">{renderError}</p>}
        {showMobile&&<div className="scan-panel">{employee.includeQr&&preview.qr?<><div dangerouslySetInnerHTML={{__html:preview.qr.svg}}/><p>Scan to check your contact.<span>This enlarged view checks the data. Scan a printed proof at final size before ordering.</span></p></>:<p>Enable “Include QR Code” to generate a contact QR.</p>}</div>}
      </section>
      <ExportPanel sides={sides} setSides={value=>{setSides(value);sessionStorage.setItem(storageKey,value);}} dpi={dpi} setDpi={setDpi} busy={busy} updating={updating} renderError={renderError} download={download} densityWarning={densityWarning} acknowledge={acknowledge} setAcknowledge={setAcknowledge} submitted={submitted} errors={errors} downloadError={downloadError}/>
    </div>
    {notice&&<div className="toast" role="status"><span className="toast-icon"><Check size={16}/></span><span>{notice}</span><button type="button" aria-label="Dismiss notification" onClick={()=>setNotice('')}><X size={15}/></button></div>}
  </div>;
}
