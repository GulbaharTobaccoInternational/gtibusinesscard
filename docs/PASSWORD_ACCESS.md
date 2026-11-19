# Invitation-only password access

V3 uses the existing Supabase email/password provider and SSR cookies. Public signup remains disabled. Login checks the active directory before attempting `signInWithPassword`, then rechecks the linked Auth ID and status. Administrator and company enforcement, RLS, the last-admin safeguard, and authenticated reaction identity remain in place. No password is sent to administrators, stored in the application database, or logged.

Existing approved Auth users are preserved. A nonempty provider password hash is not treated as proof that a person knows their password. Existing users may sign in with a password they already know or request **Create your password**, which uses Supabase's supported recovery flow. New users are created unconfirmed, linked to their approved directory record, and invited through `inviteUserByEmail`. Existing unlinked Auth accounts are reused instead of recreated. Disabled accounts receive no setup email. Email failures leave the approved account available for an administrator to retry, with no false invitation-success notice.

The migration adds only current onboarding metadata: `password_set_at`, `setup_email_sent_at`, and `invited_at`. The first field records an observed successful password setup/sign-in in this application, not a password or hash. It is initially null for existing users rather than guessing their readiness. There is no archive/history feature. Onboarding-only updates do not refresh an employee's unsaved generator form.

## Links and recovery

Source email templates are under `supabase/templates/`. The existing SMTP sender, service credentials, Site URL, redirect allowlist, and password policy are preserved. Invite/recovery templates use Supabase's `TokenHash` and a verified callback at `/auth/confirm`. GET transfers that Supabase-issued proof to a short-lived HttpOnly cookie and redirects to a clean confirmation page, without consuming it. An explicit same-origin POST calls `verifyOtp` for `invite` or `recovery`, validates the active linked employee, and establishes the official Supabase session. This works across recipient browsers and avoids dependence on the requesting browser's PKCE verifier. No custom authentication token is issued.

The callback accepts only fixed local password-setup/reset destinations and rejects external redirects. Auth link routes use no-referrer/no-store headers. Invalid, expired and reused proofs cannot establish a new session. Password changes require a verified active user and matching confirmation, use `updateUser`, and are followed by supported session revocation and browser cookie clearing. The employee then signs in with the new password. Supabase remains responsible for hashing and password policy enforcement (the existing minimum is six characters).

Public setup/recovery requests have the same confirmation and shared quotas for unknown and disabled addresses, and send no email to those accounts. Administrators can resend invitation/setup/reset instructions, with a shared recipient cooldown and hourly quota. Provider acceptance is not a claim of inbox receipt. Existing reaction email processing and its recipients are unchanged.

## Safe rollout

First publish the setup/recovery routes and password sign-in at `/sign-in` alongside the current production OTP login. Verify the administrator can set a password and sign in before replacing the ordinary `/login` screen. After administrator verification, make password sign-in the normal login and retire application OTP request/verify routes. Existing authorized sessions retain their existing roles and company access.

No credentials are rotated. Runtime continues using only the already configured application credentials; Supabase/Vercel management tokens and database passwords remain operator-only.

## Verification

Run lint, TypeScript, unit tests and the production build. For end-to-end operator checks, load the ignored local runtime/management environment and run:

```sh
node --import tsx scripts/verify-password-access.mjs
QA_BROWSER=1 node --import tsx scripts/verify-password-access.mjs
```

The optional browser mode uses the separately installed QA Playwright runtime (`QA_PLAYWRIGHT_MODULE` can select it), without adding a production dependency. `QA_URL` selects the deployment under test; a protected Vercel preview uses a temporary same-project OIDC session with origin-scoped headers. The script exercises temporary existing-user setup, new invitations, resets, old-password rejection, expired/reused links, disabled accounts, RLS/company/admin restrictions, and both-company exports. Real SMTP tests use Resend's documented delivered test mailbox. Temporary passwords stay in process memory; accounts and cookie files are removed in `finally`. Actual inbox receipt and initial-administrator access require recipient confirmation.
