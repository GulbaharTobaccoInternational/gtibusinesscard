# Employee access operations

The existing `mr-ghashi` Supabase project supplies email OTP. Public signup stays disabled. Login requests first check a case-normalized, active `authorized_users` record, then call `signInWithOtp` with `shouldCreateUser: false`. The existing SMTP sender/template are preserved; OTPs have six digits and expire after 600 seconds. Resend cooldown is 60 seconds, backed by shared database quotas. Verification is rate-limited and uses Supabase's email OTP endpoint; expired, incorrect and replayed codes cannot establish a session.

Sessions use HttpOnly, SameSite=Lax cookies, Secure in production. Next.js Proxy refreshes cookies; it is not the authorization boundary. Pages and every protected API independently call `auth.getUser()` and read the current authorization row. Status, email/account linkage, administrator role and company permission are never trusted from the browser or stale JWT metadata. Disabling a user immediately blocks subsequent protected requests, including existing sessions. The UI refreshes authorization on focus and once a minute. Logout clears the local session cookies.

## Configuration

Copy the names in `.env.example` to an ignored local environment file. Vercel Preview and Production need:

| Name | Treatment |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Public project configuration |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Public project configuration |
| `NEXT_PUBLIC_APP_URL` | Existing application URL |
| `SUPABASE_SECRET_KEY` | Server-only Secret |
| `RESEND_API_KEY` | Server-only send-scoped Secret |
| `GULBAHAR_FONT_KEY` | Preserve the existing build Secret |

Supabase management tokens, Vercel tokens and database passwords are operator-only. Never configure them as application runtime variables. Secrets are read by name so rotation needs no source change. `.env*`, `.vercel/`, QA cookies, browser states and outputs are ignored; never share their contents or commit them.

Apply the SQL files in `supabase/migrations/` in order to the existing project after reviewing schema state. They create only the employee directory, limited operational outbox and shared request quotas. Do not reset the project. Keep migration application records in the deployment change record. RLS permits active employees to read their own row, admins to read the directory, and no browser client to write it. Mail records and quota RPCs are service-only. A database trigger prevents removal/disable/demotion of the last active admin. Admins always have both companies.

For initial provisioning, create a private JSON array of `{ "full_name": "…", "email": "…", "role": "admin" | "employee" }` and run:

```sh
node scripts/provision-users.mjs /private/path/approved-users.json
```

The command creates confirmed Auth accounts without passwords or invitation email and links active authorization records with both companies. Existing records are preserved, not duplicated or reset. After bootstrap, Vinu's admin dashboard manages users. Admin-only endpoints validate role/status/company changes; employees cannot list other users, provision accounts or grant themselves permissions. Provisioning compensates by deleting a newly created Auth account if its authorization row cannot be created.

## Safe release and rotation

Verify real SMTP delivery and an actual administrator login before switching production to the protected build. Use the existing Vercel project discovered through its connected `www.mrghashi.com` domain and the explicitly supplied credential. Stage and verify the build without changing DNS, domains, project settings or deployment protection. Preserve the prior working deployment until critical checks pass.

Before the user's later instruction to postpone rotation, a replacement Supabase server key was created and verified, and the setup-shared Supabase secret was revoked. The application uses that working replacement. Resend, SMTP and Vercel credentials were not rotated. The user subsequently explicitly authorized development and deployment with the current credentials and postponed all further credential rotation until separately requested. Do not initiate further key, token or password rotation as part of this release. Management credentials and the supplied database password are never needed at application runtime.

QA must use isolated temporary accounts and clean them up. Never store OTPs or session tokens in test reports, logs or screenshots. Card rendering/export tests use fictional contact data. The API smoke script requires a private cookie-header file from an authenticated QA context and does not send appreciation emails as a smoke-test side effect.
