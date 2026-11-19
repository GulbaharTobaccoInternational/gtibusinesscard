import { redirect } from 'next/navigation';
import { AuthFrame } from '@/components/auth-frame';
import { NewPasswordForm } from '@/components/password-forms';
import { currentUser } from '@/server/access';
export const dynamic='force-dynamic';
export default async function CreatePassword(){if(!await currentUser())redirect('/auth/invalid');return <AuthFrame><NewPasswordForm intent="setup"/></AuthFrame>;}
