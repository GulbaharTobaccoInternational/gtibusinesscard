import Generator from '@/components/generator';
import { EMPTY_EMPLOYEE } from '@/lib/employee';
import { previewCard } from '@/lib/renderer';
import { brandSvg } from '@/lib/assets';
export const dynamic='force-dynamic';
export default function Page(){
  const initials={gti:previewCard(EMPTY_EMPLOYEE,'gti'),doubleLeaf:previewCard(EMPTY_EMPLOYEE,'doubleLeaf')};
  const brandSvgs={gti:brandSvg('gti'),doubleLeaf:brandSvg('doubleLeaf')};
  return <Generator initials={initials} brandSvgs={brandSvgs}/>;
}
