import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
const geist=localFont({src:'./fonts/geist-latin.woff2',weight:'100 900',display:'swap',variable:'--font-geist',fallback:['Arial','sans-serif']});
export const metadata:Metadata={title:'Mr Ghashi — Your Biz Card Genius',description:'Your official GTI or Double Leaf business card, made personal. An internal web application by GTI Marketing Department.',robots:{index:false,follow:false}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en" className={geist.variable}><body>{children}</body></html>;}
