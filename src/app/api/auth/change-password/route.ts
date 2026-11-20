import { changePasswordSchema } from '@/lib/password-auth';
import { readPrivateJson, PRIVATE_HEADERS, RequestError } from '@/lib/http';
import { privateError, requireSameOrigin, requireUser } from '@/server/access';
import { clearAuthCookies, passwordUpdateError } from '@/server/password-auth';
import { takeQuota } from '@/server/limits';
import { passwordVerificationClient } from '@/server/supabase';

export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    const employee = await requireUser();
    await takeQuota('password-change', employee.auth_user_id, 6, 600);
    const parsed = changePasswordSchema.safeParse(await readPrivateJson(request));
    if (!parsed.success) throw new RequestError(400, parsed.error.issues[0].message);
    const { currentPassword, password } = parsed.data;
    const client = passwordVerificationClient();
    const { data, error } = await client.auth.signInWithPassword({ email: employee.email, password: currentPassword });
    if (error) {
      if (error.code === 'invalid_credentials') throw new RequestError(400, 'Your current password is incorrect.');
      if (error.status === 429) throw new RequestError(429, 'Please wait before trying again.');
      throw new RequestError(503, 'Password verification is temporarily unavailable.');
    }

    let updated = false;
    try {
      if (data.user?.id !== employee.auth_user_id) throw new RequestError(403, 'Unable to verify this account.');
      const result = await client.auth.updateUser({ password, current_password: currentPassword });
      if (result.error) throw passwordUpdateError(result.error.code, 'Your password could not be updated. Please try again.');
      updated = true;
    } finally {
      const { error: revokeError } = await client.auth.signOut({ scope: updated ? 'global' : 'local' });
      if (revokeError) console.error('Password verification session revocation failed.');
      if (updated) await clearAuthCookies();
    }
    return Response.json({ ok: true, redirect: '/login?password=updated' }, { headers: PRIVATE_HEADERS });
  } catch (error) { return privateError(error); }
}
