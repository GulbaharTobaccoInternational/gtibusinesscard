import { redirect } from 'next/navigation';
import { AuthFrame } from '@/components/auth-frame';
import { PasswordSignIn } from '@/components/password-forms';
import { currentUser } from '@/server/access';
export const dynamic='force-dynamic';
export default async function SignIn({searchParams}:{searchParams:Promise<{password?:string}>}){
  if(await currentUser())redirect('/');
  const query=await searchParams;
  return <AuthFrame><PasswordSignIn updated={query.password==='updated'}/></AuthFrame>;
}
