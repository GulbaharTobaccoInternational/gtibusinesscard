import { NextResponse } from 'next/server';
import { exportCard, exportRequestSchema, ArtworkValidationError } from '@/lib/export';
import { readPrivateJson, PRIVATE_HEADERS, RequestError } from '@/lib/http';
import { requireUser, requireCompany } from '@/server/access';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export const maxDuration=30;
export async function POST(request:Request){
  try{
    const user=await requireUser();
    const parsed=exportRequestSchema.safeParse(await readPrivateJson(request));
    if(!parsed.success)return NextResponse.json({error:'Check the employee details and export options.'},{status:400,headers:PRIVATE_HEADERS});
    requireCompany(user,parsed.data.companyId);
    const result=await exportCard(parsed.data.employee,parsed.data.settings,parsed.data.companyId);
    const ascii=result.filename.replace(/[^\x20-\x7e]/g,'_');
    return new Response(new Uint8Array(result.bytes),{headers:{...PRIVATE_HEADERS,'Content-Type':result.mime,'Content-Disposition':`attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(result.filename)}`}});
  }catch(error){
    if(error instanceof ArtworkValidationError)return NextResponse.json({error:error.message,issues:error.issues},{status:422,headers:PRIVATE_HEADERS});
    return NextResponse.json({error:error instanceof RequestError?error.message:'The export could not be generated. Check the official assets or contact your administrator.'},{status:error instanceof RequestError?error.status:503,headers:PRIVATE_HEADERS});
  }
}
