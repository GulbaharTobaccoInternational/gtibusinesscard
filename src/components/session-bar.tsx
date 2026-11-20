'use client';
import Link from 'next/link';
import { ChangePasswordDialog } from './change-password-dialog';
import { useEffect, useState } from 'react';
import { KeyRound, LogOut, Users } from 'lucide-react';
import type { SessionUser } from '@/lib/access';
export function SessionBar({user}: {user:SessionUser}){
  const [busy,setBusy]=useState(false),[error,setError]=useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  useEffect(()=>{
    async function check(){
      try{const response=await fetch('/api/auth/session',{cache:'no-store'});if(response.status===401){window.location.replace('/login');return;}if(response.ok){const next=await response.json() as SessionUser;if(next.role!==user.role||next.email!==user.email||next.full_name!==user.full_name||JSON.stringify(next.allowed_companies)!==JSON.stringify(user.allowed_companies))window.location.reload();}}catch{}
    }
    const timer=setInterval(()=>void check(),60000);const focus=()=>void check();window.addEventListener('focus',focus);
    return()=>{clearInterval(timer);window.removeEventListener('focus',focus);};
  },[user]);
  async function signOut(){setBusy(true);setError('');try{const response=await fetch('/api/auth/logout',{method:'POST'});if(!response.ok)throw new Error();window.location.replace('/login');}catch{setError('Sign out failed. Please try again.');setBusy(false);}}
  return <><div className="session-bar"><span className="session-name">{user.full_name}</span><div className="session-actions">{user.role==='admin'&&<Link href="/admin"><Users size={14}/>Manage users</Link>}<button type="button" disabled={busy} onClick={() => setChangingPassword(true)}><KeyRound size={14}/>Change password</button><button type="button" disabled={busy} onClick={()=>void signOut()}><LogOut size={14}/>{busy?'Signing out…':'Sign out'}</button></div>{error&&<span role="alert" className="field-error">{error}</span>}</div>
    {changingPassword && <ChangePasswordDialog onClose={() => setChangingPassword(false)} />}
  </>;
}
