import { NextResponse } from 'next/server';
import { z } from 'zod';
import { companyIdSchema } from '@/lib/company';
import { employeeSchema } from '@/lib/employee';
import { previewCard } from '@/lib/renderer';
import { readPrivateJson, PRIVATE_HEADERS, RequestError } from '@/lib/http';
import { requireUser, requireCompany } from '@/server/access';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function POST(request:Request){
  try{
    const user=await requireUser();
    const raw=await readPrivateJson(request);
    const record=raw&&typeof raw==='object'?raw as Record<string,unknown>:{};
    const employee=z.object({companyId:companyIdSchema.default('gti'),employee:employeeSchema}).safeParse({companyId:record.companyId,employee:'employee' in record?record.employee:raw});
    if(!employee.success)return NextResponse.json({error:'Check the submitted employee fields.',issues:employee.error.issues},{status:400,headers:PRIVATE_HEADERS});
    requireCompany(user,employee.data.companyId);
    return NextResponse.json(previewCard(employee.data.employee,employee.data.companyId),{headers:PRIVATE_HEADERS});
  }catch(error){
    return NextResponse.json({error:error instanceof RequestError?error.message:'Official design assets could not be loaded. Contact your administrator.'},{status:error instanceof RequestError?error.status:503,headers:PRIVATE_HEADERS});
  }
}
