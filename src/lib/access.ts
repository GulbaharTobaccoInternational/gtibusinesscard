import { z } from 'zod';
import { companyIdSchema, type CompanyId } from './company';

export const ACCESS_MESSAGE="Your email address does not have permission to access Mr Ghashi. Please contact the GTI Marketing Department for assistance.";
export const emailSchema=z.string().trim().toLowerCase().pipe(z.email().max(254));
export const userFieldsSchema=z.object({
  full_name:z.string().trim().min(1).max(160),
  role:z.enum(['admin','employee']),
  status:z.enum(['active','disabled']),
  allowed_companies:z.array(companyIdSchema).min(1).max(2).transform(value=>[...new Set(value)]),
}).strict().transform(value=>({...value,allowed_companies:value.role==='admin'?['gti','doubleLeaf'] as CompanyId[]:value.allowed_companies}));
export const newUserSchema=z.object({email:emailSchema,...userFieldsSchema.in.shape}).strict().transform(value=>({...value,allowed_companies:value.role==='admin'?['gti','doubleLeaf'] as CompanyId[]:[...new Set(value.allowed_companies)]}));
export type AuthorizedUser={id:string;auth_user_id:string;email:string;full_name:string;role:'admin'|'employee';status:'active'|'disabled';allowed_companies:CompanyId[];created_at:string;updated_at:string};
export type SessionUser=Pick<AuthorizedUser,'id'|'email'|'full_name'|'role'|'allowed_companies'|'updated_at'>;
export function sessionUser(user:AuthorizedUser):SessionUser {
  return {id:user.id,email:user.email,full_name:user.full_name,role:user.role,allowed_companies:user.allowed_companies,updated_at:user.updated_at};
}
export function canUseCompany(user:Pick<AuthorizedUser,'status'|'allowed_companies'>,company:CompanyId){return user.status==='active'&&user.allowed_companies.includes(company);}
