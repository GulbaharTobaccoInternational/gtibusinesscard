import type { Assets } from './assets';
import type { Color, Scene } from './design';
import type { CompanyId } from './company';
import { type Employee, type Issue } from './employee';
import { textOutlines } from './outlines';
import { getTemplate } from './templates';
export type TextLayout = { x?:number;right?:number;baseline:number;size:number;trackingEm:number;strokeWidth?:number };
export function createTextWriter(front: Scene, issues: Issue[], assets: Assets, companyId: CompanyId) {
  return (text: string, field: keyof Employee, font: keyof Assets['fonts'], layout: TextLayout, color: Color, minLeft?: number, maxRight?: number) => {
    const result = textOutlines(text, assets.fonts[font], { ...layout, color });
    if (result.missing.length) issues.push({field,severity:'error',code:`glyph-${field}`,message:`The supplied ${getTemplate(companyId).fontLabel} font has no glyph for ${result.missing.map(c=>`“${c}”`).join(', ')}. Use an approved spelling or ask your administrator for a licensed font covering these characters.`});
    if ((maxRight !== undefined && (layout.x??0)+result.width>maxRight) || (minLeft !== undefined && result.left<minLeft)) issues.push({field,severity:'error',code:`overflow-${field}`,message:`${field==='firstName'?'Employee name':field==='designation'?'Job title':field==='email'?'Email address':'Printed phone line'} exceeds the approved single-line area. Shorten it${field==='mobile'?' or select a shorter printed number':''}.`});
    front.paths.push(...result.paths); return result.width;
  };
}
export type FrontContext = { employee: Employee; assets: Assets; front: Scene; issues: Issue[]; text: ReturnType<typeof createTextWriter> };
