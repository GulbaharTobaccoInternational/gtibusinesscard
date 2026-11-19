import Link from 'next/link';
import { AuthFrame } from '@/components/auth-frame';
export default function InvalidLink(){return <AuthFrame><h1>This link has expired.</h1><p className="login-description">The link may have expired, already been used, or be incomplete. Request a new link to continue securely.</p><Link className="button print-button login-submit" href="/forgot-password">Request a new link</Link><Link className="auth-back" href="/login">Back to sign in</Link></AuthFrame>;}
