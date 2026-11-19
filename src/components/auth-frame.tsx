import Link from 'next/link';
import Image from 'next/image';
import { ShieldCheck } from 'lucide-react';
import type { ReactNode } from 'react';

export function AuthFrame({children}:{children:ReactNode}){
  return <main className="login-page"><div className="auth-composition"><div className="auth-story"><Link className="auth-wordmark" href="/login" aria-label="Mr Ghashi — Your Biz Card Genius"><Image priority src="/brand/mr-ghashi-v3-wordmark.webp" alt="Mr Ghashi — Your Biz Card Genius" width={1000} height={319} sizes="240px"/></Link><div className="auth-headline"><h2>Good introductions<br/>start <span>here.<svg viewBox="0 0 150 15" aria-hidden="true"><path d="M3 12Q75-4 147 9"/></svg></span></h2><p>One familiar workspace.<br/>Every detail, ready to share.</p></div><div className="auth-mascot"><Image priority src="/brand/mr-ghashi-v3-mascot.webp" alt="Mr Ghashi holding a business card" width={1100} height={971} sizes="(max-width:680px) 150px, (max-width:1100px) 380px, 480px"/></div></div><section className="login-card"><span className="login-shield"><ShieldCheck size={25}/></span>{children}</section></div><footer className="login-footer">An Internal Web Application by GTI Marketing Department</footer></main>;
}
