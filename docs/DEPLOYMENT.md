# Deployment preparation

The application is locally functional. Its source repository is [GulbaharTobaccoInternational/gtibusinesscard](https://github.com/GulbaharTobaccoInternational/gtibusinesscard). A live hosted deployment has not been published.

## Vercel

1. Use Node.js 22 or 24. Select Next.js and use the repository root (`.`) as the deployment root. If deploying the original local asset workspace instead, select its `gulbahar-card-generator` subdirectory.
2. Provide the licensed Gotham files through an authorized private build environment, then run `npm run check:assets`. They are intentionally Git-ignored. With a locally prepared checkout, the Vercel CLI can upload the project including these private files; `.vercelignore` does not exclude them. With a Git-driven build, arrange a controlled asset provisioning step before `npm run build`. Do not store fonts in `public/` or public Git.
3. Install with `npm ci`, build with `npm run build`. `vercel.json` sets these commands. The prebuild asset check fails clearly when assets are absent or altered.
4. `next.config.ts` explicitly includes `private/assets/*` in server output tracing. Verify both fonts and artwork are present in the final server bundle.
5. Configure staff-only access before opening production to employees. Protect the UI and **both API routes** using the organization's identity provider and a trusted access proxy, or a properly authorized SSO integration. For Vercel, use a deployment protection configuration that actually restricts the intended staff audience; a shared public URL is insufficient.
6. Serve over HTTPS. Apply request/rate limits at the authenticated edge. No app password or frontend secret should be added.
7. Run the sample flow, export all formats, inspect the two PDF page sizes, decode the QR and obtain the printing supplier's physical proof approval.

The application needs a Node.js server for private font processing. A static export, a public file host or an Edge-only runtime cannot replace the route handlers. See [Next.js route handlers](https://nextjs.org/docs/app/getting-started/route-handlers) and [server output tracing](https://nextjs.org/docs/app/api-reference/config/next-config-js/output).

## Other Node hosting

Run `npm ci`, provision private fonts, `npm run build`, then `npm start` behind the organization's authenticated HTTPS reverse proxy. The start command binds loopback by default. Change the binding through a reviewed deployment command if the container platform requires it. Use a process supervisor and platform-managed updates; no persistent volume or database is needed for employee submissions.

## Privacy and environment

- No application environment variables or credentials are needed for card generation. `.env.example` documents this. Any future SSO credentials belong in the hosting secret store, never `NEXT_PUBLIC_*` variables.
- Employee values go only to this application's server to generate outlines, QR and downloads; they are not sent to QRCode Monkey, analytics or other external APIs.
- API responses are `private, no-store`. Request bodies are not logged, and there is no database, localStorage contact retention or server-side contact cache. Fonts and static official artwork are the only cached objects.
- Request bodies are capped at 16 KiB; phone/text lengths are bounded; cross-origin JSON submissions are rejected; corporate settings are never accepted from employee requests.
- The host or reverse proxy must also avoid body logging and caching these POST endpoints. Keep infrastructure access logs free of contact payloads and enforce reasonable retention.
- Browser downloads are user-created files and remain until the employee removes them. The application's reset button clears form state; it cannot remove downloaded files.

## Dependency status

Production dependencies were checked with `npm audit --omit=dev`: zero advisories at verification time. The full development set reports a picomatch ReDoS advisory (GHSA-fc5q-39xc-vjpf), propagated through lint tooling. npm's current registry supplies 4.0.7 as latest, and the advisory covers that version. Do not downgrade Next.js to npm audit's suggested old major. This dependency does not process employee inputs at runtime. Update lint dependencies when a patched upstream release becomes available. The audit JSON is recorded under `docs/`.

## Print configuration

Default artwork, page and trim are all 92 × 57 mm. Additional bleed is zero and disabled. Preserve the supplier's existing workflow. A future bleed template must extend backgrounds and keep separate artwork/trim/bleed/page dimensions; no white-margin shortcut is implemented.
