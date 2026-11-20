import { createHmac, timingSafeEqual } from 'node:crypto';

// Bind a short-lived form grant to the specific session created by verifyOtp.
function signature(sessionId: string, expires: string, key: string) {
  return createHmac('sha256', key).update(`password-link-form:${sessionId}:${expires}`).digest('base64url');
}

export function issuePasswordLinkGrant(sessionId: string, key: string, now = Date.now()) {
  const expires = String(now + 10 * 60_000);
  return `${expires}.${signature(sessionId, expires, key)}`;
}

export function validPasswordLinkGrant(value: string, sessionId: string, key: string, now = Date.now()) {
  const match = /^(\d{13})\.([\w-]{43})$/.exec(value);
  if (!match || !sessionId || Number(match[1]) <= now) return false;
  return timingSafeEqual(Buffer.from(match[2]), Buffer.from(signature(sessionId, match[1], key)));
}
