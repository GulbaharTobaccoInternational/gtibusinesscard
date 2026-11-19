import { z } from 'zod';
import { emailSchema } from './access';

export const PASSWORD_MIN_LENGTH=6; // Existing Supabase policy; Auth enforces its configured policy too.
export const RESET_CONFIRMATION="If your email is registered, you'll receive password reset instructions.";
export const SETUP_CONFIRMATION="If your email is approved, you'll receive secure password setup instructions.";
export const CREDENTIALS_ERROR='The email address or password is incorrect.';
export const passwordLoginSchema=z.object({email:emailSchema,password:z.string().min(1).max(128)}).strict();
export const passwordEmailSchema=z.object({email:emailSchema,intent:z.enum(['setup','reset']).default('reset')}).strict();
export const passwordUpdateSchema=z.object({password:z.string().min(PASSWORD_MIN_LENGTH).max(128),confirmPassword:z.string().max(128)}).strict().refine(value=>value.password===value.confirmPassword,{message:'The passwords do not match.',path:['confirmPassword']});
export const emailLinkSchema=z.object({token_hash:z.string().regex(/^[A-Za-z0-9_-]{32,256}$/),type:z.enum(['invite','recovery']),next:z.enum(['/create-password','/reset-password'])}).strict();
export type EmailLink=z.infer<typeof emailLinkSchema>;
/** Return a fixed local path; never forward an arbitrary URL or query string. */
export function passwordDestination(value:string|null,appUrl:string):EmailLink['next']|null{
  if(!value)return '/reset-password';
  try{const base=new URL(appUrl),url=new URL(value,base);if(url.origin!==base.origin||url.username||url.password)return null;
    return url.pathname==='/create-password'||url.pathname==='/reset-password'?url.pathname:null;
  }catch{return null;}
}
