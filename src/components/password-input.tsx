'use client';
import { useState } from 'react';
import { Eye, EyeOff, LockKeyhole } from 'lucide-react';
export function PasswordInput({id,label,value,onChange,disabled=false,autoComplete='current-password',describedBy}:{id:string;label:string;value:string;onChange:(value:string)=>void;disabled?:boolean;autoComplete?:'current-password'|'new-password';describedBy?:string}){
  const [visible,setVisible]=useState(false);
  return <div className="field"><label htmlFor={id}>{label}</label><div className="login-input password-input"><LockKeyhole size={18}/><input id={id} type={visible?'text':'password'} required maxLength={128} autoComplete={autoComplete} value={value} onChange={event=>onChange(event.target.value)} disabled={disabled} aria-describedby={describedBy}/><button type="button" className="password-visibility" aria-label={`${visible?'Hide':'Show'} ${label.toLowerCase()}`} aria-pressed={visible} onClick={()=>setVisible(!visible)} disabled={disabled}>{visible?<EyeOff size={19}/>:<Eye size={19}/>}</button></div></div>;
}
