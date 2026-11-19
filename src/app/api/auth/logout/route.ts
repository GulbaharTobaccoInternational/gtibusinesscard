import { PRIVATE_HEADERS } from '@/lib/http';
import { privateError, requireSameOrigin } from '@/server/access';
import { sessionClient } from '@/server/supabase';
export async function POST(request:Request){
  try{requireSameOrigin(request);await (await sessionClient()).auth.signOut({scope:'local'});return Response.json({ok:true},{headers:PRIVATE_HEADERS});}
  catch(error){return privateError(error);}
}
