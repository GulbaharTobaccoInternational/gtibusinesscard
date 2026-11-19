'use client';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowLeft, ArrowRight, LoaderCircle, Mail, ShieldCheck } from 'lucide-react';
import { ACCESS_MESSAGE } from '@/lib/access';

export function LoginForm(){
  const [email,setEmail]=useState(''),[code,setCode]=useState(''),[phase,setPhase]=useState<'email'|'code'>('email');
  const [busy,setBusy]=useState(false),[error,setError]=useState(''),[cooldown,setCooldown]=useState(0);
  const codeRef=useRef<HTMLInputElement>(null),emailRef=useRef<HTMLInputElement>(null);
  useEffect(()=>{if(cooldown<=0)return;const timer=setTimeout(()=>setCooldown(value=>Math.max(0,value-1)),1000);return()=>clearTimeout(timer);},[cooldown]);
  useEffect(()=>{if(phase==='code')codeRef.current?.focus();},[phase]);
  async function requestCode(){
    if(busy||cooldown>0)return;
    setBusy(true);setError('');
    try{
      const response=await fetch('/api/auth/request',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email}),cache:'no-store'});
      const result=await response.json();if(!response.ok)throw new Error(result.error||'Please try again shortly.');
      setCooldown(result.resendAfter??60);setPhase('code');setCode('');codeRef.current?.focus();
    }catch(error){setError(error instanceof Error?error.message:'Please try again shortly.');}finally{setBusy(false);}
  }
  async function submit(event:FormEvent){
    event.preventDefault();if(busy)return;if(phase==='email'){await requestCode();return;}
    setBusy(true);setError('');
    try{
      const response=await fetch('/api/auth/verify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,token:code}),cache:'no-store'});
      const result=await response.json();if(!response.ok)throw new Error(result.error||'Please try again.');
      window.location.replace('/');
    }catch(error){setError(error instanceof Error?error.message:'Please try again.');codeRef.current?.focus();}finally{setBusy(false);}
  }
  return <div className="login-card"><span className="login-shield"><ShieldCheck size={22}/></span><span className="eyebrow">YOUR NEXT GREAT INTRODUCTION</span>
    <h1>{phase==='email'?'Welcome to Mr Ghashi.':'Check your inbox.'}</h1>
    <p className="login-description">{phase==='email'?'Your business card, beautifully made. Sign in with your authorized work email to get started.':<>We sent a six-digit login code to <strong>{email}</strong>. It expires in 10 minutes.</>}</p>
    <form onSubmit={event=>void submit(event)} aria-busy={busy}>
      {phase==='email'?<div className="field"><label htmlFor="login-email">Work email address</label><div className="login-input"><Mail size={18}/><input ref={emailRef} id="login-email" type="email" autoComplete="email" required maxLength={254} placeholder="you@gulbahartobacco.com" value={email} onChange={event=>{setEmail(event.target.value);setError('');}} disabled={busy} autoFocus/></div></div>:<div className="field"><label htmlFor="login-code">Six-digit login code</label><input ref={codeRef} id="login-code" className="otp-input" type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required value={code} onChange={event=>{setCode(event.target.value.replace(/\D/g,''));setError('');}} disabled={busy} aria-describedby="code-help"/><p id="code-help" className="field-hint">Use the code from your most recent email.</p></div>}
      {error&&<div className="login-error" role="alert">{error===ACCESS_MESSAGE&&<strong>Access not authorized</strong>}<p>{error}</p></div>}
      <button className="button print-button login-submit" type="submit" disabled={busy||(phase==='code'&&code.length!==6)}>{busy?<LoaderCircle className="spinner" size={18}/>:null}{busy?(phase==='email'?'Sending your code…':'Verifying…'):phase==='email'?'Email me a login code':'Sign in securely'}{!busy&&<ArrowRight size={18}/>}</button>
    </form>
    {phase==='code'?<div className="login-secondary"><button type="button" className="text-button" disabled={busy||cooldown>0} onClick={()=>void requestCode()}>{cooldown>0?`Resend code in ${cooldown}s`:'Resend code'}</button><button type="button" className="text-button" disabled={busy} onClick={()=>{setPhase('email');setError('');setCode('');setCooldown(0);setTimeout(()=>emailRef.current?.focus(),0);}}><ArrowLeft size={14}/>Change email</button></div>:<p className="login-security"><ShieldCheck size={14}/>Secure, password-free access for approved team members.</p>}
  </div>;
}
