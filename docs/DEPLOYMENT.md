# Deployment preparation

The application is locally functional. Its source repository is [GulbaharTobaccoInternational/gtibusinesscard](https://github.com/GulbaharTobaccoInternational/gtibusinesscard). Vercel project `gtibc` builds the `main` branch and uses its existing deployment protection. Its production alias is https://gtibc-gulbahar-tobacco-internationals-projects.vercel.app.

## Vercel

1. Use Node.js 24.x, matching `package.json` and the project runtime. Select Next.js and use the repository root (`.`) as the deployment root. If deploying the original local asset workspace instead, select its `gulbahar-card-generator` subdirectory.
2. In the project’s Environment Variables, configure `GULBAHAR_FONT_KEY` as a Secret for Production and Preview. Use the matching 64-character hexadecimal key from the administrator’s ignored `.env.fonts.local` file or secret manager. Never put its value in Git, screenshots, logs, or a `NEXT_PUBLIC_` variable. The encrypted bundle `private/assets/gotham-fonts.enc.json` is included in Git; prebuild decrypts it into server-only font files and checks their original SHA-256 hashes. Unencrypted fonts remain Git-ignored.
3. Install with `npm ci`, build with `npm run build`. `vercel.json` sets these commands. Prebuild runs `prepare:assets` before Next.js. It restores missing fonts using the Secret and verifies every approved asset. It fails with an actionable message if the key is missing, wrong, or the artwork is altered; it never substitutes a font.
4. `next.config.ts` explicitly includes `private/assets/*` in server output tracing. Verify both fonts and artwork are present in the final server bundle.
5. Configure staff-only access before opening production to employees. Protect the UI and **both API routes** using the organization's identity provider and a trusted access proxy, or a properly authorized SSO integration. For Vercel, use a deployment protection configuration that actually restricts the intended staff audience; a shared public URL is insufficient.
6. Serve over HTTPS. Apply request/rate limits at the authenticated edge. No app password or frontend secret should be added.
7. Run the sample flow, export all formats, inspect the two PDF page sizes, decode the QR and obtain the printing supplier's physical proof approval.

The application needs a Node.js server for private font processing. A static export, a public file host or an Edge-only runtime cannot replace the route handlers. See [Next.js route handlers](https://nextjs.org/docs/app/getting-started/route-handlers) and [server output tracing](https://nextjs.org/docs/app/api-reference/config/next-config-js/output).

## Other Node hosting

Run `npm ci`, provision private fonts, `npm run build`, then `npm start` behind the organization's authenticated HTTPS reverse proxy. The start command binds loopback by default. Change the binding through a reviewed deployment command if the container platform requires it. Use a process supervisor and platform-managed updates; no persistent volume or database is needed for employee submissions.

## Privacy and environment

- `GULBAHAR_FONT_KEY` is used only by the build to restore the official fonts. It is not needed by the card renderer after provisioning. `.env.example` documents the variable without its value. Any future SSO credentials belong in the hosting secret store, never `NEXT_PUBLIC_*` variables.
- Employee values go only to this application's server to generate outlines, QR and downloads; they are not sent to QRCode Monkey, analytics or other external APIs.
- API responses are `private, no-store`. Request bodies are not logged, and there is no database, localStorage contact retention or server-side contact cache. Fonts and static official artwork are the only cached objects.
- Request bodies are capped at 16 KiB; phone/text lengths are bounded; cross-origin JSON submissions are rejected; corporate settings are never accepted from employee requests.
- The host or reverse proxy must also avoid body logging and caching these POST endpoints. Keep infrastructure access logs free of contact payloads and enforce reasonable retention.
- Browser downloads are user-created files and remain until the employee removes them. The application's reset button clears form state; it cannot remove downloaded files.

## Dependency status

Production dependencies were checked with `npm audit --omit=dev`: zero advisories at verification time. The full development set reports a picomatch ReDoS advisory (GHSA-fc5q-39xc-vjpf), propagated through lint tooling. npm's current registry supplies 4.0.7 as latest, and the advisory covers that version. Do not downgrade Next.js to npm audit's suggested old major. This dependency does not process employee inputs at runtime. Update lint dependencies when a patched upstream release becomes available. The audit JSON is recorded under `docs/`.

## Print configuration

Default artwork, page and trim are all 92 × 57 mm. Additional bleed is zero and disabled. Preserve the supplier's existing workflow. A future bleed template must extend backgrounds and keep separate artwork/trim/bleed/page dimensions; no white-margin shortcut is implemented.

## Diagnosing the initial Git build failure

The initial Git-based Vercel build could not find `Gotham-Bold.otf` because licensed fonts were correctly excluded from the public repository, but the build had no provisioning step. The encrypted bundle plus `GULBAHAR_FONT_KEY` now supplies both exact fonts before Next.js builds. The previous open-ended Node range also selected Node 26; the project now pins Node 24.x. The npm `cache-dir`, lint deprecation and optional install-script notices were not the cause of that failed build.

For a new deployment target, set the same build Secret and redeploy. For a local source archive with no fonts, run `npm run prepare:assets` with that environment variable set, or install the licensed fonts with `npm run install:assets`. Keep `.env.fonts.local` private; it is excluded from both Git and Vercel source uploads.

Keep `tests/` available in the Vercel build source: the verification scripts import its sample fixture and Next.js type-checks those scripts. These files are not public web routes or browser assets. Ignoring the fixture folder makes production type checking fail even when the fonts are correctly installed.
