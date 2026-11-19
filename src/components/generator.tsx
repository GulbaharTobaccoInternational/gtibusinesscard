'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, type ReactNode, type CSSProperties } from 'react';
import { ArrowDownToLine, ArrowRight, Check, ChevronDown, CircleHelp, Copy, FileImage, FileText, LockKeyhole, LoaderCircle, Minus, Plus, QrCode, RotateCcw, ShieldCheck, Sparkles, X } from 'lucide-react';
import { EMPTY_EMPLOYEE, type Employee, type Issue } from '@/lib/employee';
import { COMPANIES, COMPANY_IDS, getCompany, type CompanyId } from '@/lib/company';
import { DEMO_EMPLOYEES, isDemoEmployee } from '@/lib/demo';
import type { PreviewResult } from '@/lib/renderer';
import type { ExportSettings } from '@/lib/export';

type Props={ initials:Record<CompanyId,PreviewResult>; brandSvgs:Record<CompanyId,string> };
type CompanyProps={initial:PreviewResult;brandSvg:string;companyId:CompanyId;initialEmployee:Employee;saveEmployee:(employee:Employee)=>void;switchCompany:(id:CompanyId)=>void};
function IconLabel({children,number}:{children:ReactNode;number:string}) {return <div className="section-title"><span className="section-number">{number}</span><h2>{children}</h2></div>;}
export default function Generator({initials,brandSvgs}:Props){
  const [companyId,setCompanyId]=useState<CompanyId>('gti');
  const [employees,setEmployees]=useState<Record<CompanyId,Employee>>(()=>({gti:{...EMPTY_EMPLOYEE},doubleLeaf:{...EMPTY_EMPLOYEE}}));
  useEffect(()=>{
    const timer=setTimeout(()=>{try{const saved=localStorage.getItem('business-card-company');if(COMPANY_IDS.includes(saved as CompanyId))setCompanyId(saved as CompanyId);}catch{}},0);
    return()=>clearTimeout(timer);
  },[]);
  const switchCompany=(id:CompanyId)=>{
    if(!COMPANY_IDS.includes(id))return;
    setCompanyId(id);try{localStorage.setItem('business-card-company',id);}catch{}
  };
  return <CompanyGenerator key={companyId} companyId={companyId} initial={initials[companyId]} brandSvg={brandSvgs[companyId]} initialEmployee={employees[companyId]} saveEmployee={next=>setEmployees(previous=>({...previous,[companyId]:next}))} switchCompany={switchCompany}/>;
}
function CompanyGenerator({initial,brandSvg,companyId,initialEmployee,saveEmployee,switchCompany}:CompanyProps){
  const COMPANY=getCompany(companyId);
  const storageKey=`business-card-sides-${companyId}`;
  const [employee,setEmployee]=useState<Employee>({...initialEmployee});
  const [preview,setPreview]=useState(initial);
  const [side,setSide]=useState<'front'|'back'>('front');
  const [zoom,setZoom]=useState(100);
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
  const [showHelp,setShowHelp]=useState(false);
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
  const fieldError=(field:keyof Employee)=>preview.issues.find(i=>i.field===field&&i.severity==='error'&&visible(i));
  const errors=preview.issues.filter(i=>i.severity==='error');
  const warnings=preview.issues.filter(i=>i.severity==='warning');
  const densityWarning=warnings.find(i=>i.code==='qr-density');
  const complete=['firstName','lastName','designation','email'].filter(key=>employee[key as keyof Employee]).length;
  const ready=errors.length===0&&!updating&&!renderError;
  const field=(key:keyof Employee,label:string,placeholder:string,required=false,type='text',hint?:string)=>(
    <div className={`field ${fieldError(key)?'has-error':''}`}>
      <label htmlFor={key}>{label}{required&&<span className="required">*</span>}</label>
      <input id={key} name={key} value={String(employee[key])} type={type} autoComplete="off" inputMode={type==='tel'?'tel':type==='email'?'email':undefined} maxLength={key==='email'?254:key==='extension'?8:type==='tel'?36:160} required={required} placeholder={placeholder} onChange={event=>update(key,event.target.value as Employee[typeof key])} onBlur={()=>touch(key)} aria-invalid={!!fieldError(key)} aria-describedby={fieldError(key)?`${key}-error`:undefined}/>
      {fieldError(key)?<p className="field-error" id={`${key}-error`}>{fieldError(key)!.message}</p>:hint?<p className="field-hint">{hint}</p>:null}
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
    setBusy(format);
    try{
      const response=await fetch('/api/export',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({companyId,employee,settings:{sides,dpi,format,acknowledgeQrWarning:acknowledge}})});
      if(!response.ok){const body=await response.json();throw new Error(body.issues?.[0]?.message||body.error||'The download could not be created.');}
      const blob=await response.blob();const url=URL.createObjectURL(blob);
      const disposition=response.headers.get('Content-Disposition')??'';
      const encoded=disposition.match(/filename\*=UTF-8''([^;]+)/)?.[1];
      const filename=encoded?decodeURIComponent(encoded):(disposition.match(/filename="([^"]+)"/)?.[1]??'Business_Card.pdf');
      const link=document.createElement('a');link.href=url;link.download=filename;document.body.append(link);link.click();link.remove();
      setTimeout(()=>URL.revokeObjectURL(url),60_000);setNotice(`${format==='print'?'Print PDF':format==='digital'?'Digital PDF':sides==='both'?'PNG ZIP':'PNG'} downloaded.`);
    }catch(error){setDownloadError(error instanceof Error?error.message:'Please try downloading again.');}finally{setBusy(null);}
  };
  return <div className="company-surface" data-company={companyId} style={{'--red':COMPANY.accent,'--red-dark':COMPANY.accentDark,'--brand-soft':COMPANY.accentSoft} as CSSProperties}>
    <header className="topbar"><div className="header-inner">
      <Link className="brand" href="/" aria-label={`${COMPANY.shortName} Business Card Generator`}><span className="brand-art" dangerouslySetInnerHTML={{__html:brandSvg}}/><span className="brand-divider"/><span className="brand-tool">Brand studio<span>BUSINESS CARDS</span></span></Link>
      <div className="header-right"><label className="company-switcher"><span>Company</span><select aria-label="Company" value={companyId} disabled={!!busy} onChange={event=>switchCompany(event.target.value as CompanyId)}>{COMPANY_IDS.map(id=><option key={id} value={id}>{COMPANIES[id].label}</option>)}</select></label><span className="internal-label"><LockKeyhole size={13}/> INTERNAL BRAND TOOL</span><button type="button" className="icon-button" aria-label="Help with business cards" onClick={()=>setShowHelp(true)}><CircleHelp size={19}/></button><span className="company-avatar" aria-hidden="true">{companyId==='gti'?'G':'DL'}</span></div>
    </div></header>
    <main className="main-shell">
      <div className="page-heading"><div><div className="eyebrow">{COMPANY.organization.toUpperCase()}</div><h1>Business Card Generator<span className="red-period">.</span></h1><p>Your details. Our official design. Ready for your next introduction.</p></div><div className="demo-tools">{isDemoEmployee(employee,companyId)&&<span className="demo-badge">Demo data</span>}<button className="button button-secondary sample-button" onClick={loadSample}><Sparkles size={15}/> Use sample employee</button></div></div>
      <div className="workspace">
        <aside className="details-panel" aria-label="Employee details form">
          <div className="panel-top"><div><h2>Your information</h2><p>Make it yours. We’ll handle the layout.</p></div><button className="icon-button reset-button" onClick={reset} aria-label="Reset employee details" title="Reset details"><RotateCcw size={17}/></button></div>
          <form onSubmit={event=>{event.preventDefault();void download('print');}} noValidate>
            <section className="form-section"><IconLabel number="01">Employee Details</IconLabel><div className="field-grid">{field('firstName','First name',companyId==='gti'?'e.g. Alex':'e.g. Jordan',true)}{field('lastName','Last name',companyId==='gti'?'e.g. Morgan':'e.g. Taylor',true)}</div>{field('designation','Designation / job title',companyId==='gti'?'e.g. Marketing Manager':'e.g. Operations Coordinator',true)}{field('email','Work email',`you@${COMPANY.website.replace(/^www\./,'')}`,true,'email')}</section>
            <section className="form-section"><IconLabel number="02">Contact Information</IconLabel>{field('mobile','Employee mobile','+971 50 000 0000',false,'tel','Use your country code, including +.')}
              <div className="locked-company"><div><LockKeyhole size={13}/><span>Company telephone</span></div><strong>{COMPANY.telephone||'Not configured — employee number only'}</strong><span className="fixed-label">{COMPANY.telephone?'PRESET':'OPTIONAL'}</span></div>
              <details className="advanced-details"><summary>Additional contact details <ChevronDown size={15}/></summary><div className="advanced-fields">{field('workPhone','Work phone / direct office','+971 4 000 0000',false,'tel')}{field('extension','Work phone extension','e.g. 105')}{field('companyMobile','Company-provided mobile','+971 50 000 0000',false,'tel')}{field('privatePhone','Private phone (QR only)','+971 50 000 0000',false,'tel')}{field('additionalPhone','Additional phone (QR only)','+971 50 000 0000',false,'tel')}{field('workFax','Work fax (QR only)','+971 4 000 0000',false,'tel')}{field('privateFax','Private fax (QR only)','+971 4 000 0000',false,'tel')}
                <div className="field"><label htmlFor="primaryMobile">{companyId==='gti'?'Mobile number printed on card':'Phone number printed on card'}</label><select id="primaryMobile" name="primaryMobile" value={employee.primaryMobile} onChange={event=>update('primaryMobile',event.target.value as Employee['primaryMobile'])}><option value="mobile">Employee mobile</option><option value="companyMobile">Company-provided mobile</option><option value="privatePhone">Private phone</option><option value="additionalPhone">Additional phone</option>{companyId==='doubleLeaf'&&<option value="workPhone">Direct office / work phone</option>}<option value="none">No printed employee number</option></select>{fieldError('primaryMobile')&&<p className="field-error">{fieldError('primaryMobile')!.message}</p>}</div>
                <p className="field-hint">{companyId==='gti'?'Only the selected mobile and company telephone are printed.':'Only the selected employee number is printed.'} Other numbers are saved in the QR contact.</p>
              </div></details>
            </section>
            <section className="form-section qr-section"><div className="qr-section-heading"><IconLabel number="03">QR Code</IconLabel><label className="switch"><input type="checkbox" checked={employee.includeQr} onChange={event=>update('includeQr',event.target.checked)} aria-label="Include QR Code"/><span/></label></div><p className="section-description">Scan. Save. Stay connected.</p>
              {employee.includeQr?<><div className="qr-info"><div className="qr-mini" dangerouslySetInnerHTML={{__html:preview.qr?.svg??''}}/><div><strong>Personalized contact card</strong><p>Your details, saved in one scan.</p><span className="tiny-badge"><span/> vCard 3.0 · Generated automatically</span></div></div>
                {COMPANY.telephone&&<label className="check-label company-qr-check"><input type="checkbox" checked={employee.includeCompanyPhone} onChange={event=>update('includeCompanyPhone',event.target.checked)}/> Include company telephone in QR</label>}
                <button className="text-button" type="button" onClick={()=>setShowPayload(!showPayload)}>{showPayload?'Hide':'View'} QR contact details <ArrowRight size={13}/></button>
                {showPayload&&<div className="payload-panel"><pre>{preview.qr?.payload}</pre><button type="button" className="text-button" onClick={async()=>{try{await navigator.clipboard.writeText(preview.qr?.payload??'');setNotice('vCard details copied.');}catch{setNotice('Select and copy the contact details above.');}}}><Copy size={12}/> Copy vCard</button></div>}
              </>:<div className="qr-disabled"><QrCode size={20}/><p>QR code is off. The approved layout stays in place.</p></div>}
            </section>
          </form>
          <div className="company-footer"><ShieldCheck size={17}/><p>Company information is preset.<br/><span>Every card stays consistent with our brand.</span></p></div>
        </aside>
        <div className="preview-column">
          <section className="preview-panel" aria-label="Card Preview"><div className="preview-toolbar"><div className="preview-heading"><span className="live-dot"/><h2>Card Preview</h2><span className="live-label">LIVE</span></div><div className="side-tabs" role="tablist" aria-label="Preview side"><button role="tab" aria-selected={side==='front'} onClick={()=>setSide('front')}>Front</button><button role="tab" aria-selected={side==='back'} onClick={()=>setSide('back')}>Back</button></div></div>
            <div className="preview-stage"><div className="stage-topline"><span>OFFICIAL COMPANY TEMPLATE</span><span>92 × 57 mm</span></div><div className="card-viewport"><div className="card-scale" style={{width:`${zoom}%`}}><div className="business-card" data-testid="business-card" dangerouslySetInnerHTML={{__html:side==='front'?preview.front:preview.back}}/></div></div><div className="stage-bottomline"><span>{side==='front'?'PERSONALIZED FRONT':'STANDARD REVERSE'}<span className="side-index">{side==='front'?'01':'02'} / 02</span></span><div className="zoom-controls"><button onClick={()=>setZoom(z=>Math.max(70,z-10))} disabled={zoom===70} aria-label="Zoom out"><Minus size={13}/></button><span>{zoom}%</span><button onClick={()=>setZoom(z=>Math.min(150,z+10))} disabled={zoom===150} aria-label="Zoom in"><Plus size={13}/></button></div></div></div>
            <div className="preview-status" aria-live="polite"><span className={ready?'status-ready':renderError?'status-error':'status-neutral'}>{updating?<LoaderCircle size={14} className="spinner"/>:ready?<Check size={14}/>:renderError?<X size={14}/>:<span className="status-dot"/>}{updating?'Updating preview…':renderError?'Preview unavailable':ready?'Your card is ready to export':`Add your details to personalize your card · ${complete}/4 required fields`}</span><button className="text-button" onClick={()=>setShowMobile(!showMobile)}><QrCode size={13}/>{showMobile?'Close QR view':'Test your QR'}</button></div>
            {renderError&&<p role="alert" className="inline-error">{renderError}</p>}
            {showMobile&&<div className="scan-panel">{employee.includeQr&&preview.qr?<><div dangerouslySetInnerHTML={{__html:preview.qr.svg}}/><p>Scan with your phone camera to check the contact details.<span>The enlarged view checks the data. Scan a printed proof at the final size before ordering.</span></p></>:<p>Enable “Include QR Code” to generate a contact QR.</p>}</div>}
          </section>
          <section className="export-panel" aria-label="Export Options"><div className="export-heading"><div><h2>Ready for your next introduction?</h2><p>Choose your sides, then download your card.</p></div><ArrowDownToLine size={21}/></div>
            <fieldset className="side-selection"><legend>Card sides</legend><label className={sides==='front'?'side-option selected':'side-option'}><input type="radio" name="sides" value="front" checked={sides==='front'} onChange={()=>{setSides('front');sessionStorage.setItem(storageKey,'front');}}/><span className="mini-card front-mini"><span/></span><span><strong>Front Only</strong><small>Personalized front · 1 page</small></span><span className="radio-indicator"/></label><label className={sides==='both'?'side-option selected':'side-option'}><input type="radio" name="sides" value="both" checked={sides==='both'} onChange={()=>{setSides('both');sessionStorage.setItem(storageKey,'both');}}/><span className="mini-pair"><span className="mini-card back-mini" aria-hidden="true">{companyId==='gti'?'G':'DL'}</span><span className="mini-card front-mini"><span/></span></span><span><strong>Front + Back <em>STANDARD</em></strong><small>Complete business card · 2 pages</small></span><span className="radio-indicator"/></label></fieldset>
            <button className="button print-button" onClick={()=>void download('print')} disabled={!!busy||updating||!!renderError}>{busy==='print'?<LoaderCircle size={17} className="spinner"/>:<ArrowDownToLine size={17}/>} Download Print-Ready PDF <ArrowRight size={17}/></button><div className="print-specs"><span><Check size={11}/> Outlined text</span><span><Check size={11}/> Vector artwork</span><span><Check size={11}/> 92 × 57 mm</span></div>
            <div className="digital-options"><button className="button button-secondary" onClick={()=>void download('digital')} disabled={!!busy||updating||!!renderError}>{busy==='digital'?<LoaderCircle size={15} className="spinner"/>:<FileText size={15}/>} Download Digital PDF</button><button className="button button-secondary" onClick={()=>void download('png')} disabled={!!busy||updating||!!renderError}>{busy==='png'?<LoaderCircle size={15} className="spinner"/>:<FileImage size={15}/>} Download PNG{sides==='both'?' ZIP':''}</button><label className="dpi-select"><span className="sr-only">PNG resolution</span><select value={dpi} onChange={event=>setDpi(Number(event.target.value) as 300|600)}><option value={300}>300 DPI</option><option value={600}>600 DPI</option></select></label></div>
            {densityWarning&&<div className="qr-warning"><strong>Check your printed QR</strong><p>{densityWarning.message}</p><label className="check-label"><input type="checkbox" checked={acknowledge} onChange={event=>setAcknowledge(event.target.checked)}/> I’ll scan a printed proof at the final card size.</label></div>}
            {submitted&&errors.length>0&&<ul className="export-errors">{errors.map(issue=><li key={issue.code}>{issue.message}</li>)}</ul>}
            {downloadError&&<p className="inline-error" role="alert">{downloadError}</p>}
          </section>
          <div className="privacy-note"><LockKeyhole size={14}/><p>Your details stay in this session. No saved submissions. No external QR services.</p></div>
        </div>
      </div>
      <footer className="page-footer"><span>{COMPANY.shortName.toUpperCase()} <span className="footer-dot">/</span> BRAND STUDIO</span><span>Approved artwork. Consistent standards.</span><span>Official template <span className="footer-dot">·</span> 92 × 57 mm</span></footer>
    </main>
    {notice&&<div className="toast" role="status"><Check size={16}/>{notice}<button aria-label="Dismiss notification" onClick={()=>setNotice('')}><X size={14}/></button></div>}
    {showHelp&&<div className="modal-backdrop" onClick={()=>setShowHelp(false)}><section className="help-modal" role="dialog" aria-modal="true" aria-labelledby="help-title" onClick={event=>event.stopPropagation()}><button className="icon-button modal-close" aria-label="Close help" onClick={()=>setShowHelp(false)}><X size={19}/></button><div className="eyebrow">A QUICK GUIDE</div><h2 id="help-title">Make your introduction official.</h2><ol><li>Enter your employee details and an international mobile number.</li><li>Review the front and back, and scan your QR to check its contact details.</li><li>Choose Front Only or Front + Back, then download your preferred format.</li></ol><p><strong>For your printer:</strong> use Print-Ready PDF. It contains vector outlines at 92 × 57 mm, with no extra bleed. Print at 100% scale.</p><p>Company details and the approved template are maintained by your administrator. The selected template’s supplied fonts support a limited character set; unsupported names are flagged before export.</p><button className="button print-button" onClick={()=>setShowHelp(false)}>Got it <ArrowRight size={16}/></button></section></div>}
  </div>;
}
