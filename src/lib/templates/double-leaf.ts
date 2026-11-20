import { DOUBLE_LEAF_DESIGN as D } from '../templates';
import { fullName } from '../employee';
import { textWidth } from '../outlines';
import type { FrontContext } from '../render-context';
/** Independent approved Double Leaf layout: left-aligned contact block and stroked name. */
export function renderDoubleLeafFront({ employee, assets, front, text }: FrontContext) {
  const colors = assets.artwork.referenceColors;
  const name = fullName(employee).toUpperCase();
  const nameWidth = textWidth(name, assets.fonts.name, D.name.size, D.name.trackingEm);
  const available = D.name.maxRight - D.name.x;
  const size = D.name.size * (nameWidth > available ? Math.max(D.name.minScale, available / nameWidth) : 1);
  text(name, 'firstName', 'name', { ...D.name, size }, colors.name, undefined, D.name.maxRight);
  text(employee.designation.toUpperCase(), 'designation', 'designation', D.designation, colors.designation!, undefined, D.designation.maxRight);
  if (employee.email) text(employee.email, 'email', 'contact', D.email, colors.contact, undefined, D.email.maxRight);
  let number = employee.primaryMobile === 'none' ? '' : employee[employee.primaryMobile];
  if (number && number === employee.workPhone && employee.extension) number += ` x${employee.extension}`;
  if (number) text(number, 'mobile', 'contact', D.telephone, colors.contact, undefined, D.telephone.maxRight);
  else front.paths = front.paths.filter(p => !(p.bounds && p.bounds[0] > 34 && p.bounds[2] < 37 && p.bounds[1] > 31.5 && p.bounds[3] < 34));
  return size / D.name.size;
}
