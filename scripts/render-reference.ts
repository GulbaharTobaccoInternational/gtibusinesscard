/** Local QA only: read a record extracted from a private reference PDF via stdin. */
import fs from 'node:fs/promises';
import path from 'node:path';
import { companyIdSchema } from '../src/lib/company';
import { EMPTY_EMPLOYEE, employeeSchema } from '../src/lib/employee';
import { exportCard } from '../src/lib/export';
const chunks:Buffer[]=[];
for await(const chunk of process.stdin)chunks.push(Buffer.from(chunk));
const input=JSON.parse(Buffer.concat(chunks).toString('utf8'));
const companyId=companyIdSchema.parse(input.companyId);
const employee=employeeSchema.parse({...EMPTY_EMPLOYEE,...input.employee});
const result=await exportCard(employee,{sides:'both',format:'print',dpi:600,acknowledgeQrWarning:true},companyId);
const directory=path.join(process.cwd(),'output/verification/companies');
await fs.mkdir(directory,{recursive:true});
await fs.writeFile(path.join(directory,`${companyId}-reference.pdf`),result.bytes);
