import { PRIVATE_HEADERS, RequestError } from '@/lib/http';
import { privateError, requireSameOrigin } from '@/server/access';
import { sessionClient } from '@/server/supabase';
export async function POST(request:Request){
  try{
    requireSameOrigin(request);
    const {error}=await (await sessionClient()).auth.signOut({scope:'local'});
    if(error)throw new RequestError(503,'Sign out could not be completed. Please try again.');
    return Response.json({ok:true},{headers:PRIVATE_HEADERS});
  }
  catch(error){return privateError(error);}
}
