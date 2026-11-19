import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
const geist=localFont({src:'./fonts/geist-latin.woff2',weight:'100 900',display:'swap',variable:'--font-geist',fallback:['Arial','sans-serif']});
export const metadata:Metadata={title:'Mr Ghashi — Your Biz Card Genius',description:'Your official GTI or Double Leaf business card, made personal. An internal web application by GTI Marketing Department.',robots:{index:false,follow:false},icons:{icon:[{url:'/brand/favicon-16x16.png',sizes:'16x16',type:'image/png'},{url:'/brand/favicon-32x32.png',sizes:'32x32',type:'image/png'}],apple:[{url:'/brand/apple-touch-icon.png',sizes:'180x180',type:'image/png'}]}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en" className={geist.variable}><body>{children}</body></html>;}
