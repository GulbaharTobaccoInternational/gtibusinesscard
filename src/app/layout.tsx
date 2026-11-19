import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'GTI & Double Leaf | Business Card Generator',description:'Create your official GTI or Double Leaf business card.',robots:{index:false,follow:false}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>;}
