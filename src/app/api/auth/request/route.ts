import { PRIVATE_HEADERS } from '@/lib/http';
/** Friendly retirement response for tabs opened before the password migration. */
export function POST(){return Response.json({error:'Mr Ghashi now uses email and password. Reload the sign-in page, or choose Create your password.'},{status:410,headers:PRIVATE_HEADERS});}
