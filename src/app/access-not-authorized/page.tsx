import Link from 'next/link';
import { AuthFrame } from '@/components/auth-frame';
import { ACCESS_MESSAGE } from '@/lib/access';
export default function Unauthorized(){return <AuthFrame><h1>Access not authorized</h1><p className="login-description">{ACCESS_MESSAGE}</p><Link className="auth-back" href="/login">Back to sign in</Link></AuthFrame>;}
