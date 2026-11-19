# Employee access operations

The current authentication model is invitation-only email/password login. See [password access, invitations, recovery and verification](PASSWORD_ACCESS.md) for implementation and operator instructions.

The seven original approved Auth account IDs, roles and company permissions are preserved. Vinu remains the administrator. Active authorization is checked on every protected request; company permissions, RLS and the last-active-admin safeguard remain in force. Public signup is disabled. Onboarding metadata contains no passwords or hashes.

Runtime uses only the existing Supabase public project configuration, server-only Supabase/Resend credentials, application URL and preserved font build Secret. Management tokens and database passwords are operator-only and never deployed. The V3 update rotates no credentials and changes no SMTP credentials, domain or project settings. `.env*`, QA cookies, passwords and generated artifacts must stay out of Git.

The earlier OTP implementation remains documented in the dated verification history. Application OTP request/verify endpoints now return HTTP 410 and create no sessions. Existing authorized sessions retain the same server-enforced permissions.
