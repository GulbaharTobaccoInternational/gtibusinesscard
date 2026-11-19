import Generator from '@/components/generator';
import { EMPTY_EMPLOYEE } from '@/lib/employee';
import { previewCard } from '@/lib/renderer';
import { getAssets } from '@/lib/assets';
export const dynamic='force-dynamic';
export default function Page(){
  const initial=previewCard(EMPTY_EMPLOYEE);
  const brand=getAssets().artwork.front.filter(p=>p.sourceIndex!==undefined&&p.sourceIndex>=3&&p.sourceIndex<=28);
  const brandSvg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="5.7 7 17.2 12" aria-hidden="true">${brand.map(p=>`<path fill="rgb(${p.color.rgb.map(v=>Math.round(v*255)).join(' ')})" d="${p.d}"/>`).join('')}</svg>`;
  return <Generator initial={initial} brandSvg={brandSvg}/>;
}
