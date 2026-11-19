import { NextResponse } from 'next/server';
import { employeeSchema } from '@/lib/employee';
import { previewCard } from '@/lib/renderer';
import { readPrivateJson, PRIVATE_HEADERS, RequestError } from '@/lib/http';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function POST(request:Request){
  try{
    const employee=employeeSchema.safeParse(await readPrivateJson(request));
    if(!employee.success)return NextResponse.json({error:'Check the submitted employee fields.',issues:employee.error.issues},{status:400,headers:PRIVATE_HEADERS});
    return NextResponse.json(previewCard(employee.data),{headers:PRIVATE_HEADERS});
  }catch(error){
    return NextResponse.json({error:error instanceof RequestError?error.message:'Official design assets could not be loaded. Contact your administrator.'},{status:error instanceof RequestError?error.status:503,headers:PRIVATE_HEADERS});
  }
}
