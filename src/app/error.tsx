'use client';
export default function ErrorPage({reset}:{reset:()=>void}){return <main className="error-page"><span className="eyebrow">MR GHASHI</span><h1>The official template is unavailable.</h1><p>Ask your administrator to check the approved artwork and private font installation, then try again.</p><button className="button print-button" onClick={()=>reset()}>Try again</button></main>;}
