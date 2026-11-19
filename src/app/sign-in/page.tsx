import { redirect } from 'next/navigation';
export default async function SignInAlias({searchParams}:{searchParams:Promise<{password?:string}>}){
  const query=await searchParams;redirect(query.password==='updated'?'/login?password=updated':'/login');
}
