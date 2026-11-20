import Link from 'next/link';
import Image from 'next/image';
import type { ReactNode } from 'react';
import { GtiLogo } from './brand-art';

const steps = [
  { title: 'Enter details', detail: 'Name, job title, email, mobile' },
  { title: 'Preview live', detail: 'See the front and back instantly' },
  { title: 'Download', detail: 'Print-ready file, correct resolution' },
];

export function AuthFrame({ children }: { children: ReactNode }) {
  return (
    <main className="login-page">
      <div className="auth-composition">
        <div className="auth-story">
          <Link className="auth-wordmark" href="/login">
            <Image priority src="/brand/mr-ghashi-v3-wordmark.webp" alt="Mr Ghashi — Your Biz Card Genius" width={1000} height={319} sizes="(max-width: 680px) 170px, 245px" />
          </Link>
          <div className="auth-headline">
            <h2>New business card?<br /><span>Mr Ghashi’s on it.<svg viewBox="0 0 150 15" preserveAspectRatio="none" aria-hidden="true"><path d="M3 12Q75-4 147 9" /></svg></span></h2>
            <p>Create official business cards for GTI, Double Leaf and other group companies. Enter the details — get a print-ready card in the approved company design.</p>
          </div>
          <ol className="auth-steps" aria-label="How to create your card">
            {steps.map(({ title, detail }, index) => (
              <li key={title}>
                <span className="step-number" aria-hidden="true">{index + 1}</span>
                <div><strong>{title}</strong><p>{detail}</p></div>
              </li>
            ))}
          </ol>
          <div className="auth-mascot">
            <Image priority src="/brand/mr-ghashi-v3-mascot.webp" alt="Mr Ghashi holding a business card" width={1100} height={971} sizes="(max-width: 840px) 100px, (max-width: 1200px) 340px, 455px" />
          </div>
        </div>
        <section className="login-card">
          <GtiLogo className="auth-gti-logo" />
          {children}
        </section>
      </div>
      <footer className="login-footer">Mr Ghashi · Internal business card generator by GTI Marketing Department</footer>
    </main>
  );
}
