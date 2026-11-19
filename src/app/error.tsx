'use client';
export default function ErrorPage({reset}:{reset:()=>void}){return <main style={{padding:48,maxWidth:640,margin:'auto',fontFamily:'system-ui'}}><h1>The official template is unavailable.</h1><p>Ask your administrator to check the private artwork and Gotham font installation, then try again.</p><button onClick={()=>reset()}>Try again</button></main>;}
