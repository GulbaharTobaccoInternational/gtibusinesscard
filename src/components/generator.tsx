'use client';

import Link from 'next/link';
import { useEffect, useMemo, useReducer, useRef, useState, type CSSProperties } from 'react';
import { Check, ChevronDown, Copy, Download, LoaderCircle, QrCode, RotateCcw, Sparkles, X } from 'lucide-react';
import { EMPTY_EMPLOYEE, type Employee, type Issue } from '@/lib/employee';
import { currentPreview, editorIssues, editorPreviewReducer, initialEditorPreview } from '@/lib/editor-preview';
import { getCompany, type CompanyId } from '@/lib/company';
import type { SessionUser } from '@/lib/access';
import { DEMO_EMPLOYEES, isDemoEmployee } from '@/lib/demo';
import type { PreviewResult } from '@/lib/renderer';
import type { ExportSettings } from '@/lib/export';
import { GtiLogo, MrGhashiBrand } from './brand-art';
import { CompanySwitcher } from './company-switcher';
import { Appreciation } from './appreciation';
import { ExportPanel } from './export-panel';
import { SessionBar } from './session-bar';

type Props={ initials:Partial<Record<CompanyId,PreviewResult>>;user:SessionUser };
type CompanyProps={initial:PreviewResult;companyId:CompanyId;initialEmployee:Employee;saveEmployee:(employee:Employee)=>void;onExportBusyChange:(busy:boolean)=>void};
export default function Generator({initials,user}:Props){
  const drafts = useRef<Partial<Record<CompanyId, Employee>>>({});
  const [selection, setSelection] = useState({ companyId: user.allowed_companies[0], employee: EMPTY_EMPLOYEE });
  const { companyId } = selection;
  const [exportBusy,setExportBusy]=useState(false);
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const saved = localStorage.getItem('business-card-company') as CompanyId | null;
        if (saved && user.allowed_companies.includes(saved)) {
          setSelection({ companyId: saved, employee: drafts.current[saved] ?? EMPTY_EMPLOYEE });
        }
      } catch {}
    }, 0);
    return () => clearTimeout(timer);
  }, [user.allowed_companies]);
  const switchCompany = (id: CompanyId) => {
    if (id === companyId || !user.allowed_companies.includes(id)) return;
    setSelection({ companyId: id, employee: drafts.current[id] ?? EMPTY_EMPLOYEE });
    try { localStorage.setItem('business-card-company', id); } catch {}
  };
  const company=getCompany(companyId);
  return <div className="app-shell" data-company={companyId} style={{'--company-accent':company.accent,'--company-soft':company.accentSoft} as CSSProperties}>
    <a className="skip-link" href="#employee-details">Skip to employee details</a>
    <header className="app-header"><div className="header-inner">
      <Link className="app-brand" href="/" aria-label="Mr Ghashi — Your Biz Card Genius"><MrGhashiBrand/></Link>
      <div className="ownership-group"><GtiLogo className="ownership-logo"/><p className="department-credit"><span>An Internal Web Application </span><span>by GTI Marketing Department</span></p></div>
      <Appreciation companyId={companyId}/>
    </div></header>
    <main className="main-shell">
      <SessionBar user={user}/>
      <div className="workspace-heading"><div className="workspace-actions"><CompanySwitcher companyId={companyId} allowedCompanies={user.allowed_companies} disabled={exportBusy} onChange={switchCompany}/><a className="export-shortcut" href="#export-options"><Download size={16}/>Export card</a></div></div>
      <CompanyGenerator key={companyId} companyId={companyId} initial={initials[companyId]!} initialEmployee={selection.employee} saveEmployee={next=>{drafts.current[companyId]=next;}} onExportBusyChange={setExportBusy}/>
    </main>
  </div>;
}
function CompanyGenerator({initial,companyId,initialEmployee,saveEmployee,onExportBusyChange}:CompanyProps){
  const COMPANY=getCompany(companyId);
  const storageKey=`business-card-sides-${companyId}`;
  const [state, dispatch] = useReducer(editorPreviewReducer, null, () => initialEditorPreview(companyId, initialEmployee, initial));
  const { input, rendered, error: renderError } = state;
  const { employee } = input;
  const preview = rendered.preview;
  const confirmed = currentPreview(state);
  const updating = !confirmed && !renderError;
  const [side,setSide]=useState<'front'|'back'>('front');
  const svg = side === 'front' ? preview.front : preview.back;
  const cardMarkup = useMemo(() => ({ __html: svg }), [svg]);
  const qrSvg = preview.qr?.svg ?? '';
  const qrMarkup = useMemo(() => ({ __html: qrSvg }), [qrSvg]);
  const [sides,setSides]=useState<'front'|'both'>('both');
  const [dpi,setDpi]=useState<300|600>(600);
  const [busy,setBusy]=useState<ExportSettings['format']|null>(null);
  const [downloadError,setDownloadError]=useState('');
  const [notice,setNotice]=useState('');
  const [touched,setTouched]=useState<Set<string>>(new Set());
  const [submitted,setSubmitted]=useState(false);
  const [acknowledge,setAcknowledge]=useState(false);
  const [showPayload,setShowPayload]=useState(false);
  const [showMobile,setShowMobile]=useState(false);
  const currentEmployee = useRef(employee);
  useEffect(()=>{
    const saved=sessionStorage.getItem(storageKey)??(companyId==='gti'?sessionStorage.getItem('gulbahar-export-sides'):null);
    const timer=setTimeout(()=>{if(saved==='front'||saved==='both')setSides(saved);},0);
    return()=>clearTimeout(timer);
  },[storageKey,companyId]);
  useEffect(() => {
    if (confirmed) return;
    const controller = new AbortController();
    async function render() {
      try {
        const response = await fetch('/api/render', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input),
          signal: controller.signal, cache: 'no-store',
        });
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || 'The preview could not be updated.');
        if (!controller.signal.aborted) dispatch({ type: 'success', input, preview: body });
      } catch (error) {
        if (!controller.signal.aborted) dispatch({ type: 'failure', input, message: error instanceof Error ? error.message : 'Could not update the preview.' });
      }
    }
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (input.employee === DEMO_EMPLOYEES[input.companyId]) void render();
    else timer = setTimeout(render, 180);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [input, confirmed]);
  useEffect(()=>{if(!notice)return;const timer=setTimeout(()=>setNotice(''),4500);return()=>clearTimeout(timer);},[notice]);
  const changeEmployee = (next: Employee) => {
    currentEmployee.current = next;
    dispatch({ type: 'change', employee: next });
    saveEmployee(next);
    setAcknowledge(false);
    setDownloadError('');
  };
  const update = <K extends keyof Employee>(key: K, value: Employee[K]) => {
    changeEmployee({ ...currentEmployee.current, [key]: value });
  };
  const touch=(field:string)=>setTouched(old=>old.has(field)?old:new Set(old).add(field));
  const visible=(issue:Issue)=>submitted||touched.has(issue.field)||issue.field==='qr'||issue.field==='assets';
  const formIssues = useMemo(() => editorIssues(employee, companyId, confirmed), [employee, companyId, confirmed]);
  const fieldError=(field:keyof Employee)=>formIssues.find(i=>i.field===field&&i.severity==='error'&&visible(i));
  const errors=formIssues.filter(i=>i.severity==='error');
  const warnings=formIssues.filter(i=>i.severity==='warning');
  const densityWarning=warnings.find(i=>i.code==='qr-density');
  const complete=['firstName','lastName','designation','email','mobile'].filter(key=>String(employee[key as keyof Employee]).trim()).length;
  const ready=!!confirmed && errors.length===0;
  const field=(key:keyof Employee,label:string,placeholder:string,required=false,type='text',hint?:string)=>{
    const error = fieldError(key);
    return (
      <div className={`field ${error?'has-error':''}`}>
        <label htmlFor={key}>{label}{required&&<span className="required">*</span>}</label>
        <input id={key} name={key} value={String(employee[key])} type={type} autoComplete="off" inputMode={type==='tel'?'tel':type==='email'?'email':undefined} maxLength={key==='email'?254:key==='extension'?8:type==='tel'?36:160} required={required} placeholder={placeholder} onChange={event=>update(key,event.target.value as Employee[typeof key])} onBlur={()=>touch(key)} aria-invalid={!!error} aria-describedby={error?`${key}-error`:hint?`${key}-hint`:undefined}/>
        {error?<p className="field-error" id={`${key}-error`}>{error.message}</p>:hint?<p className="field-hint" id={`${key}-hint`}>{hint}</p>:null}
      </div>
    );
  };
  const loadSample=()=>{
    changeEmployee(DEMO_EMPLOYEES[companyId]);setTouched(new Set());setSubmitted(false);setNotice('Fictional demo data loaded. Replace it with your own details.');
  };
  const reset=()=>{
    changeEmployee(EMPTY_EMPLOYEE);setTouched(new Set());setSubmitted(false);setNotice('Employee details cleared.');
  };
  const download=async(format:ExportSettings['format'])=>{
    setSubmitted(true);setDownloadError('');
    if (!confirmed || currentEmployee.current !== employee) return;
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
    }catch(error){if(currentEmployee.current===employee)setDownloadError(error instanceof Error?error.message:'Please try downloading again.');}finally{setBusy(null);onExportBusyChange(false);}
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
        <section className="qr-settings" aria-label="QR Code"><div className="qr-settings-heading"><h3>Digital contact</h3></div>
          <div className="qr-info"><div className="qr-mini" dangerouslySetInnerHTML={qrMarkup}/><div><strong>One scan. All your details.</strong><p>A contact that is ready to save.</p><span className="vcard-label">vCard 3.0</span></div></div>
            <button className="text-button inspect-button" type="button" onClick={()=>setShowPayload(!showPayload)}><QrCode size={15}/>{showPayload?'Hide':'View'} QR / vCard details<ChevronDown size={14} className={showPayload?'rotate-icon':''}/></button>
            {showPayload&&<div className="payload-panel"><pre>{confirmed?.qr?.payload}</pre><button disabled={!confirmed?.qr} type="button" className="text-button" onClick={async()=>{try{await navigator.clipboard.writeText(confirmed?.qr?.payload??'');setNotice('vCard details copied.');}catch{setNotice('Select and copy the contact details above.');}}}><Copy size={13}/> Copy vCard</button></div>}
        </section>
      </form>
    </aside>
    <div className="preview-column">
      <section className="preview-panel" aria-label="Card Preview">
        <div className="preview-toolbar"><h2>Live preview</h2><div className="side-tabs" role="tablist" aria-label="Preview side">{(['front','back'] as const).map(value=><button key={value} type="button" role="tab" id={`preview-${value}-tab`} aria-controls="preview-artwork" aria-selected={side===value} tabIndex={side===value?0:-1} onClick={()=>setSide(value)} onKeyDown={event=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(event.key)){event.preventDefault();const next=event.key==='Home'?'front':event.key==='End'?'back':side==='front'?'back':'front';setSide(next);document.getElementById(`preview-${next}-tab`)?.focus();}}}>{value==='front'?'Front':'Back'}</button>)}</div></div>
        <div className="preview-stage"><div className="card-viewport"><div className="business-card" data-testid="business-card" id="preview-artwork" role="tabpanel" aria-busy={updating} aria-labelledby={`preview-${side}-tab`} dangerouslySetInnerHTML={cardMarkup}/></div>
          <div className="canvas-toolbar"><span>{side==='front'?'Personalized front':'Official reverse'} <span className="canvas-dimension">92 × 57 mm</span></span></div>
        </div>
        <div className="preview-status" aria-live="polite"><span className={ready?'status-ready':renderError?'status-error':'status-neutral'}>{updating?<LoaderCircle size={14} className="spinner"/>:ready?<Check size={14}/>:renderError?<X size={14}/>:null}{updating?'Updating your card…':renderError?'Preview unavailable':ready?'Your card is ready to export':`Add your details · ${complete} of 5 required fields`}</span><button type="button" className="text-button" aria-expanded={showMobile} aria-controls="qr-inspection" onClick={()=>setShowMobile(!showMobile)}><QrCode size={14}/>{showMobile?'Close QR view':'Test your QR'}</button></div>
        {renderError&&<p role="alert" className="inline-error">{renderError}</p>}
        {showMobile&&<div id="qr-inspection" className="scan-panel">{!confirmed ? <p>{updating ? 'Updating your card…' : 'Preview unavailable'}</p> : confirmed.qr?<><div dangerouslySetInnerHTML={qrMarkup}/><p>Scan to check your contact.<span>This enlarged view checks the data. Scan a printed proof at final size before ordering.</span></p></>:<p>QR preview unavailable. Check your contact details.</p>}</div>}
      </section>
      <ExportPanel sides={sides} setSides={value=>{setSides(value);sessionStorage.setItem(storageKey,value);}} dpi={dpi} setDpi={setDpi} busy={busy} updating={updating} renderError={renderError} download={download} densityWarning={densityWarning} acknowledge={acknowledge} setAcknowledge={setAcknowledge} submitted={submitted} errors={errors} downloadError={downloadError}/>
    </div>
    {notice&&<div className="toast" role="status"><span className="toast-icon"><Check size={16}/></span><span>{notice}</span><button type="button" aria-label="Dismiss notification" onClick={()=>setNotice('')}><X size={15}/></button></div>}
  </div>;
}
