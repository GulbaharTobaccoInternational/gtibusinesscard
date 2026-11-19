import { COMPANY } from './company';
import { type Employee, fullName } from './employee';
export function escapeVCard(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/\r\n|\r|\n/g, '\\n').replace(/;/g, '\\;').replace(/,/g, '\\,');
}
/** Fold at 75 UTF-8 octets, without splitting a Unicode code point. */
export function foldLine(line: string): string {
  const encoder = new TextEncoder(); let result = ''; let length = 0;
  for (const char of line) {
    const bytes = encoder.encode(char).length;
    if (length + bytes > 75) { result += '\r\n '; length = 1; }
    result += char; length += bytes;
  }
  return result;
}
export function serializeVCard(employee: Employee): string {
  const esc = escapeVCard;
  const lines = [
    'BEGIN:VCARD', 'VERSION:3.0',
    `N:${esc(employee.lastName)};${esc(employee.firstName)};;;`,
    `FN:${esc(fullName(employee))}`, `ORG:${esc(COMPANY.organization)}`,
    `TITLE:${esc(employee.designation)}`, `URL:https://${COMPANY.website}`,
    `EMAIL;TYPE=INTERNET,WORK:${esc(employee.email)}`,
  ];
  const tel = (value: string, type: string) => { if (value) lines.push(`TEL;TYPE=${type}:${esc(value)}`); };
  tel(employee.mobile, 'CELL,VOICE');
  tel(employee.workPhone + (employee.workPhone && employee.extension ? ` x${employee.extension}` : ''), 'WORK,VOICE');
  tel(employee.companyMobile, 'WORK,CELL'); tel(employee.privatePhone, 'HOME,VOICE');
  tel(employee.additionalPhone, 'VOICE'); tel(employee.workFax, 'WORK,FAX'); tel(employee.privateFax, 'HOME,FAX');
  if (employee.includeCompanyPhone && employee.workPhone !== COMPANY.telephone) tel(COMPANY.telephone, 'WORK,VOICE');
  lines.push(`ADR;TYPE=WORK:${esc(COMPANY.poBox)};;${esc(COMPANY.street)};${esc(COMPANY.city)};${esc(COMPANY.state)};;${esc(COMPANY.country)}`);
  lines.push('END:VCARD');
  return lines.map(foldLine).join('\r\n') + '\r\n';
}
