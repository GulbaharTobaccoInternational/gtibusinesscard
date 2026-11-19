import { AuthFrame } from '@/components/auth-frame';
import { PasswordEmailForm } from '@/components/password-forms';
export const dynamic='force-dynamic';
export default async function ForgotPassword({searchParams}:{searchParams:Promise<{intent?:string}>}){const query=await searchParams;return <AuthFrame><PasswordEmailForm intent={query.intent==='setup'?'setup':'reset'}/></AuthFrame>;}
