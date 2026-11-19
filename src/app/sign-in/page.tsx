import { AuthFrame } from '@/components/auth-frame';
import { PasswordSignIn } from '@/components/password-forms';
export const dynamic='force-dynamic';
export default async function SignIn({searchParams}:{searchParams:Promise<{password?:string}>}){
  const query=await searchParams;
  return <AuthFrame><PasswordSignIn updated={query.password==='updated'}/></AuthFrame>;
}
