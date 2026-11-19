import { PRIVATE_HEADERS } from '@/lib/http';
/** OTP sign-in no longer creates application sessions. */
export function POST(){return Response.json({error:'OTP sign-in has been retired. Reload the page to sign in with your email and password.'},{status:410,headers:PRIVATE_HEADERS});}
