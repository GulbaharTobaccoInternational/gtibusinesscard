import Generator from '@/components/generator';
import { EMPTY_EMPLOYEE } from '@/lib/employee';
import { previewCard } from '@/lib/renderer';
import { pageUser } from '@/server/access';
import { sessionUser } from '@/lib/access';
import type { CompanyId } from '@/lib/company';
import type { PreviewResult } from '@/lib/renderer';
export const dynamic='force-dynamic';
export default async function Page(){
  const user=await pageUser();
  const initials=Object.fromEntries(user.allowed_companies.map(id=>[id,previewCard(EMPTY_EMPLOYEE,id)])) as Partial<Record<CompanyId,PreviewResult>>;
  return <Generator initials={initials} user={sessionUser(user)}/>;
}
