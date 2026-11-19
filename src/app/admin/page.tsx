import Link from 'next/link';
import { MrGhashiBrand } from '@/components/brand-art';
import { AdminUsers } from '@/components/admin-users';
import { SessionBar } from '@/components/session-bar';
import { sessionUser, type AuthorizedUser } from '@/lib/access';
import { pageUser } from '@/server/access';
import { serviceClient } from '@/server/supabase';
export const dynamic='force-dynamic';
export default async function AdminPage(){
  const user=await pageUser(true);
  const {data,error}=await serviceClient().from('authorized_users').select('*').order('full_name');
  if(error)throw new Error('The user directory is temporarily unavailable.');
  return <div className="admin-page"><header className="admin-header"><Link href="/" aria-label="Return to card generator"><MrGhashiBrand/></Link><Link href="/" className="export-shortcut">Back to card generator</Link></header><main className="admin-main"><SessionBar user={sessionUser(user)}/><div className="admin-title"><span className="eyebrow">ADMINISTRATION</span><h1>Team access</h1><p>Manage who can use Mr Ghashi and which companies they can create cards for.</p></div><AdminUsers initialUsers={data as AuthorizedUser[]}/></main></div>;
}
