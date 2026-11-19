'use client';

import { useRef } from 'react';
import { Check, Download, FileImage, FileText, Layers2, LoaderCircle, ShieldCheck } from 'lucide-react';
import type { ExportSettings } from '@/lib/export';
import type { Issue } from '@/lib/employee';

type Props = {
  sides:'front'|'both'; setSides:(sides:'front'|'both')=>void; dpi:300|600; setDpi:(dpi:300|600)=>void;
  busy:ExportSettings['format']|null; updating:boolean; renderError:string; download:(format:ExportSettings['format'])=>Promise<void>;
  densityWarning:Issue|undefined; acknowledge:boolean; setAcknowledge:(value:boolean)=>void; submitted:boolean; errors:Issue[]; downloadError:string;
};
export function ExportPanel({sides,setSides,dpi,setDpi,busy,updating,renderError,download,densityWarning,acknowledge,setAcknowledge,submitted,errors,downloadError}:Props) {
  const resolutionRefs=useRef<Record<number,HTMLButtonElement|null>>({});
  const disabled=!!busy||updating||!!renderError;
  return <section className="export-panel" id="export-options" tabIndex={-1} aria-label="Export Options">
    <div className="export-heading"><div><h2>Export your card</h2><p>Choose your sides and download.</p></div><span className="export-format-tag"><ShieldCheck size={14}/> Print quality</span></div>
    <div className="primary-export-row"><fieldset className="side-selection"><legend className="sr-only">Card sides</legend>
      {(['front','both'] as const).map(value=><label key={value} className={`side-option ${sides===value?'selected':''}`}><input type="radio" name="sides" value={value} checked={sides===value} onChange={()=>setSides(value)}/><span className={`side-art ${value}`} aria-hidden="true"><i/><i/></span><span className="side-option-copy"><strong>{value==='front'?'Front Only':'Front + Back'}</strong><small>{value==='front'?'1 personalized page':'2 pages · complete card'}</small></span>{sides===value&&<Check className="side-check" size={15}/>}</label>)}
    </fieldset>
    <button type="button" className="button print-button" onClick={()=>void download('print')} disabled={disabled}>{busy==='print'?<LoaderCircle size={18} className="spinner"/>:<Download size={18}/>}<span>Download Print-Ready PDF</span></button></div>
    <div className="secondary-exports">
      <button type="button" className="button digital-button" onClick={()=>void download('digital')} disabled={disabled}>{busy==='digital'?<LoaderCircle size={17} className="spinner"/>:<FileText size={17}/>}<span>Download Digital PDF</span></button>
      <div className="png-export"><button type="button" className="button png-button" onClick={()=>void download('png')} disabled={disabled}>{busy==='png'?<LoaderCircle size={17} className="spinner"/>:<FileImage size={17}/>}<span>Download PNG{sides==='both'?' ZIP':''}</span></button>
        <div className="resolution-control" role="radiogroup" aria-label="PNG resolution" onKeyDown={event=>{
          if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(event.key))return;
          event.preventDefault();const next=event.key==='Home'?300:event.key==='End'?600:dpi===300?600:300;
          setDpi(next);resolutionRefs.current[next]?.focus();
        }}>{([300,600] as const).map(value=><button type="button" key={value} ref={element=>{resolutionRefs.current[value]=element;}} role="radio" tabIndex={dpi===value?0:-1} aria-checked={dpi===value} aria-label={`${value} DPI`} onClick={event=>{event.currentTarget.focus();setDpi(value);}}>{value}</button>)}<span>DPI</span></div>
      </div>
    </div>
    <div className="print-specs"><span><Layers2 size={13}/> Outlined vector artwork</span><span>92 × 57 mm</span><span>No extra bleed</span></div>
    {densityWarning&&<div className="qr-warning"><strong>Scan a printed proof</strong><p>{densityWarning.message}</p><label className="check-label"><input type="checkbox" checked={acknowledge} onChange={event=>setAcknowledge(event.target.checked)}/> I’ll scan a printed proof at the final card size.</label></div>}
    {submitted&&errors.length>0&&<ul className="export-errors">{errors.map(issue=><li key={issue.code}>{issue.message}</li>)}</ul>}
    {downloadError&&<p className="inline-error" role="alert">{downloadError}</p>}
  </section>;
}
