import { redirect } from 'next/navigation';
import { AuthFrame } from '@/components/auth-frame';
import { ConfirmPasswordLink } from '@/components/password-forms';
import { pendingEmailLink } from '@/server/password-auth';
export const dynamic='force-dynamic';
export default async function ContinueLink(){const link=await pendingEmailLink();if(!link)redirect('/auth/invalid');return <AuthFrame><ConfirmPasswordLink setup={link.next==='/create-password'}/></AuthFrame>;}
