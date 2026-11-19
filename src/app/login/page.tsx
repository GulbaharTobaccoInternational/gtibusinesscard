import { redirect } from 'next/navigation';
import { MrGhashiBrand } from '@/components/brand-art';
import { LoginForm } from '@/components/login-form';
import { currentUser } from '@/server/access';
import { brandSvg } from '@/lib/assets';
export const dynamic='force-dynamic';
export default async function LoginPage(){
  if(await currentUser())redirect('/');
  return <main className="login-page"><header className="login-header"><MrGhashiBrand/><div className="ownership-group"><span className="ownership-logo" role="img" aria-label="Gulbahar Tobacco International" dangerouslySetInnerHTML={{__html:brandSvg('gti')}}/><p className="department-credit">An Internal Web Application by GTI Marketing Department</p></div></header><div className="login-content"><div className="login-welcome"><span className="eyebrow">MEET YOUR BIZ CARD GENIUS</span><h2>Good introductions<br/>start here.</h2><p>One familiar workspace.<br/>Every detail, ready to share.</p><div className="login-brand-scene"><MrGhashiBrand/></div><span className="login-brands">GTI <span>·</span> Double Leaf</span></div><LoginForm/></div><footer className="login-footer">Mr Ghashi · Made for good introductions.</footer></main>;
}
