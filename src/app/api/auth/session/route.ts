import { sessionUser } from '@/lib/access';
import { PRIVATE_HEADERS } from '@/lib/http';
import { privateError, requireUser } from '@/server/access';
export const dynamic='force-dynamic';
export async function GET(){try{return Response.json(sessionUser(await requireUser()),{headers:PRIVATE_HEADERS});}catch(error){return privateError(error);}}
