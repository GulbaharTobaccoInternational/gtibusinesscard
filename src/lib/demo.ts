import { EMPTY_EMPLOYEE, type Employee } from './employee';
import type { CompanyId } from './company';
/** Fictional examples only. Never use approved PDF contact records as app defaults. */
export const DEMO_EMPLOYEES: Record<CompanyId, Employee> = {
  gti: { ...EMPTY_EMPLOYEE, firstName: 'Alex', lastName: 'Morgan', designation: 'Marketing Manager', email: 'alex.morgan@example.com', mobile: '+971 50 000 0000' },
  doubleLeaf: { ...EMPTY_EMPLOYEE, firstName: 'Jordan', lastName: 'Taylor', designation: 'Operations Coordinator', email: 'jordan.taylor@example.com', mobile: '+971 50 000 0000' },
};
export function isDemoEmployee(employee: Employee, companyId: CompanyId) {
  return (['firstName', 'lastName', 'designation', 'email', 'mobile'] as const).every(key => employee[key] === DEMO_EMPLOYEES[companyId][key]);
}
