import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'Gulbahar | Business Card Generator',description:'Create your official Gulbahar Tobacco International FZE business card.',robots:{index:false,follow:false}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>;}
