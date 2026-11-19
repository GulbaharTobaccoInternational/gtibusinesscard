import { z } from 'zod';
import { userFieldsSchema } from '@/lib/access';
import { readPrivateJson, PRIVATE_HEADERS, RequestError } from '@/lib/http';
import { privateError, requireAdmin, requireSameOrigin } from '@/server/access';
import { serviceClient } from '@/server/supabase';
export async function PATCH(request:Request,{params}:{params:Promise<{id:string}>}){
  try{
    requireSameOrigin(request);await requireAdmin();const {id}=await params;
    if(!z.uuid().safeParse(id).success)throw new RequestError(400,'Choose a registered user.');
    const parsed=userFieldsSchema.safeParse(await readPrivateJson(request));if(!parsed.success)throw new RequestError(400,'Check the name, role and company permissions.');
    const {data,error}=await serviceClient().from('authorized_users').update(parsed.data).eq('id',id).select().maybeSingle();
    if(error){if(error.code==='23514')throw new RequestError(409,'Keep at least one active administrator with access to both companies.');throw error;}
    if(!data)throw new RequestError(404,'This user could not be found.');
    return Response.json(data,{headers:PRIVATE_HEADERS});
  }catch(error){return privateError(error);}
}
