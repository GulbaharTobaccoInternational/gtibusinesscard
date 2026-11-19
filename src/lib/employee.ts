import { z } from 'zod';
export const phoneKeys = ['mobile', 'workPhone', 'companyMobile', 'privatePhone', 'additionalPhone', 'workFax', 'privateFax'] as const;
export type PhoneKey = typeof phoneKeys[number];
const shortText = z.string().trim().max(160).refine(v => !/[\u0000-\u001f\u007f]/u.test(v), 'Use a single line without control characters.');
const phone = z.string().trim().max(36);
export const employeeSchema = z.object({
  firstName: shortText, lastName: shortText, designation: shortText, email: z.string().trim().max(254),
  mobile: phone, workPhone: phone, companyMobile: phone, privatePhone: phone,
  additionalPhone: phone, workFax: phone, privateFax: phone,
  extension: z.string().trim().max(8),
  primaryMobile: z.enum(['mobile', 'companyMobile', 'privatePhone', 'additionalPhone', 'none']),
  includeQr: z.boolean(), includeCompanyPhone: z.boolean(),
});
export type Employee = z.infer<typeof employeeSchema>;
export type Issue = { field: keyof Employee | 'qr' | 'assets'; message: string; severity: 'error' | 'warning'; code: string };
export const EMPTY_EMPLOYEE: Employee = {
  firstName: '', lastName: '', designation: '', email: '', mobile: '', workPhone: '', companyMobile: '',
  privatePhone: '', additionalPhone: '', workFax: '', privateFax: '', extension: '',
  primaryMobile: 'mobile', includeQr: true, includeCompanyPhone: true,
};
export function validateEmployee(employee: Employee): Issue[] {
  const issues: Issue[] = [];
  const add = (field: keyof Employee, message: string) => issues.push({ field, message, severity: 'error', code: `invalid-${field}` });
  for (const field of ['firstName', 'lastName', 'designation', 'email'] as const) {
    if (!employee[field].trim()) add(field, `${({firstName:'First name',lastName:'Last name',designation:'Job title',email:'Email'})[field]} is required.`);
  }
  if (employee.email && !z.email().safeParse(employee.email).success) add('email', 'Enter a valid email address.');
  for (const key of phoneKeys) {
    const value = employee[key];
    if (value && (!/^(?:\+|00)[0-9 ()-]+$/.test(value) || !/^[0-9]{7,15}$/.test(value.replace(/^(?:\+|00)/, '').replace(/[^0-9]/g, '')))) {
      add(key, 'Use an international number starting with + or 00, with 7–15 digits.');
    }
  }
  if (employee.extension && !/^\d{1,8}$/.test(employee.extension)) add('extension', 'Use up to 8 digits for the extension.');
  if (employee.extension && !employee.workPhone) add('extension', 'Add a work phone before entering an extension.');
  if (employee.primaryMobile !== 'none' && !employee[employee.primaryMobile] && phoneKeys.some(k => ['mobile','companyMobile','privatePhone','additionalPhone'].includes(k) && employee[k])) {
    add('primaryMobile', 'Select an available number to print, or choose no printed mobile.');
  }
  return issues;
}
export function fullName(employee: Employee) { return [employee.firstName, employee.lastName].filter(Boolean).join(' '); }
export function safeFilename(employee: Employee) {
  const name = fullName(employee).normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^\p{L}\p{N}]+/gu, '_').replace(/^_+|_+$/g, '').slice(0, 80);
  return name || 'Employee';
}
