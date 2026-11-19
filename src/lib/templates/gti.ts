import { DESIGN } from '../design';
import { COMPANY } from '../company';
import { fullName } from '../employee';
import { textOutlines } from '../outlines';
import type { FrontContext } from '../render-context';
/** Approved GTI personalization geometry; preserved from the original renderer. */
export function renderGtiFront({ employee, assets, text }: FrontContext) {
  const colors = assets.artwork.referenceColors;
  let nameSize = DESIGN.name.size;
  const name = fullName(employee).toUpperCase();
  const normal = textOutlines(name, assets.fonts.name, { ...DESIGN.name, color: colors.name });
  const available = DESIGN.name.maxRight - DESIGN.name.x;
  if (normal.width > available) nameSize *= Math.max(DESIGN.name.minScale, available / normal.width);
  text(name, 'firstName', 'name', { ...DESIGN.name, size: nameSize }, colors.name, undefined, DESIGN.name.maxRight);
  text(employee.designation.toUpperCase(), 'designation', 'designation', DESIGN.designation, colors.contact, undefined, DESIGN.designation.maxRight);
  if (employee.email) text(`E: ${employee.email}`, 'email', 'contact', DESIGN.email, colors.contact, DESIGN.email.minLeft);
  const mobile = employee.primaryMobile === 'none' ? '' : employee[employee.primaryMobile];
  const telephone = [mobile ? `M: ${mobile}` : '', `T: ${COMPANY.telephone}`].filter(Boolean).join(', ');
  text(telephone, 'mobile', 'contact', DESIGN.telephone, colors.contact, DESIGN.telephone.minLeft);
  return nameSize / DESIGN.name.size;
}
