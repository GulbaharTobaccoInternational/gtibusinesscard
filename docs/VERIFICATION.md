# Verification record

Executed on 18 November 2026 in the supplied macOS workspace. All checks below were actually run. At that initial verification, the application ran locally; a hosted deployment was not yet configured. The Vercel build repair below records the subsequent deployment setup.

## Automated checks

| Check | Result |
| --- | --- |
| `npm run check:assets` | Passed; source artwork and both Gotham fonts match SHA-256 manifest |
| `npm run lint` | Passed without lint errors or warnings |
| `npm run typecheck` | Passed with strict TypeScript |
| `npm test` | 19 tests passed |
| `npm run build` | Passed using Next.js 16.4.6 / webpack; home and both API routes built |
| `npm run verify:exports` | Passed; one/two-page print PDFs, digital PDF, SVG previews, vCard and both PNG resolutions generated |
| `scripts/compare-reference.py` | Passed; source comparison, PDF structure and QR decoding |
| `npm run test:api` against production server | Passed; page, API validation, cross-origin rejection, private font protection, exports and response cache headers |
| `npm audit --omit=dev` | Zero production advisories |

The logic suite covers required/optional inputs, international phone syntax, email validation, long names/designations/email overflow, accented and unsupported glyphs, multiple phone roles, selection of printed mobile, omission of missing values, genuine UTF-8 vCard mapping and folding, special-character escaping, QR on/off, reverse invariance, density warning acknowledgment/blocking, safe filenames, export dimensions/counts, PNG ZIP contents/DPI, and bounded private API requests.

## Reference comparison

Original and regenerated GTI reference cards were rendered with the same MuPDF engine at 600 DPI. The QR footprint plus quiet zone is excluded from similarity metrics because the new vCard serialization changes the QR pattern. Every other region is included, including employee text.

| Page | Mean absolute RGB difference, 0–255 scale | Pixels with any channel differing by >10 |
| --- | ---: | ---: |
| Front, excluding QR | 0.007314 | 0.004387% |
| Reverse | 0.000236 | 0% |

The script fails if mean error exceeds 0.5 or more than 0.2% of pixels differ by over 10. These are regression thresholds, not a claim of pixel-perfect identity. The remaining tiny differences are consistent with PDF coordinate precision, page normalization and antialiasing. Fixed artwork is taken directly from the source vectors rather than positioned by eye.

Machine-readable metrics, original/generated renders, overlays and pixel differences are in `output/verification/`. Front and reverse rendered images were visually inspected. All 106 fixed front paths and all 10 reverse paths retain their original coordinates and per-object source colors.

## PDF and QR checks

- Front-only print PDF has exactly one page. Duplex print/digital PDFs have exactly two pages.
- Every generated PDF page is exactly 92 × 57 mm. TrimBox and BleedBox equal the page; no extra bleed or marks.
- Reopened print PDFs contain no text operators, font resources, image XObjects or raster artwork. Personalized typography consists of actual vector glyph paths. QR modules are paths. Original spot separations and CMYK values are preserved in print.
- The full front PNG decodes through jsQR at 300 and 600 DPI, returning the exact serialized vCard.
- Independently, ZXing-C++ decodes the QR from the rendered print PDF and both PNG resolutions, with exact UTF-8 payload equality.
- Accented names with multiple optional phone fields decode correctly.
- The baseline payload is 73 modules at 0.200837 mm/module. Its density warning requires acknowledgment before export. Too-dense payloads block export.
- The PNG ZIP contains distinct front and back files; selected DPI metadata and actual dimensions were checked. At 600 DPI each PNG is 2173 × 1346 pixels.
- Server output traces include both private font binaries and canonical artwork for the page and API routes. HTTP requests for `/private/assets/*.ttf` and `*.otf` return 404.

## Browser checks

The desktop in-app browser on macOS was used to test the live application and the final production server, including:

- Sample loading; live changes to employee name, title and email; inspection of updated QR contact details.
- Front/reverse tabs and the fixed reverse artwork.
- QR opt-out; the rest of the approved layout remains in place.
- Reset clears entered employee details.
- Front-only selection survives a page reload; employee data does not persist across a reload.
- A front-only print PDF downloaded through the interface and was independently reopened to confirm one page.
- A two-page digital PDF and a two-file 600 DPI PNG ZIP downloaded through the production interface and were independently inspected.
- Mobile and tablet layouts had no horizontal overflow at measured CSS viewport widths of 355, 433 and 853 pixels. The browser's existing zoom means these differ from requested device override sizes.
- The final production tab reported no browser console warnings or errors.

Desktop, mobile and tablet screenshots are in `output/verification/application-*.jpg`. The final tab is left on the sample employee with Front + Back selected, ready for review.

## Remaining manual acceptance and deployment work

A physical printer/paper/camera combination was not available, so scan an actual proof at 100% scale before a print run. Adobe Illustrator, Safari, Edge, iOS and Android were not interactively tested; no claim of those manual checks is made. Structural vector validation does not certify PDF/X compliance or an ICC production workflow beyond the supplied PDF's color definitions.

The original font license document was not supplied. Fonts remain private and server-only; the company must confirm the required outline-generation rights before deployment. The limited supplied Gotham glyph coverage is reported to the employee rather than substituted. Corporate SSO/access-proxy configuration remains a deployment task, documented in `DEPLOYMENT.md`.

The full development dependency audit contains the upstream picomatch ReDoS advisory in lint tooling. Production dependencies have zero reported advisories. The lint toolchain is pinned to the ESLint version supported by Next's current React/accessibility/import plugins; npm emits an ESLint 9 support deprecation notice during installation. Track compatible upstream updates. No developer-tool glob accepts employee inputs at runtime.

## Vercel build repair — 19 November 2026

The first Git deployment failed at `check:assets` because the public repository excluded the unencrypted fonts and did not provision them at build time. It also selected Node 26 from the previous open-ended engine range.

The build now uses Node 24.x and runs `prepare:assets` before Next.js. A committed AES-256-GCM encrypted font bundle is unlocked with the private `GULBAHAR_FONT_KEY` Vercel Secret; every restored font must match the original integrity manifest. Wrong keys, modified ciphertext and unapproved fonts are rejected. Plain font binaries and the local key file remain excluded from Git.

Executed after the change: lint and strict TypeScript passed; all 25 automated tests passed, including six provisioning/security regression tests. A clean snapshot exported from Git's index, without plaintext fonts or a local secret file, restored both exact Gotham fonts and completed the production build using the environment Secret. Its browser assets were scanned to verify that the key value was not included.

The Vercel source package also retains `tests/` so the fixture imports used by verification scripts resolve during Next.js type checking. A second clean-source production build applied every `.vercelignore` exclusion and passed before pushing this packaging correction.

## Two-company release — 19 November 2026

The update was implemented on `feature/double-leaf` from the approved `3faa2b0` baseline. The application now has separate GTI and Double Leaf configurations, fonts, fixed artwork, front renderers and QR positions, with shared form/export/vCard engines.

Executed checks for this release:

- Lint and strict TypeScript passed; all **40 automated tests** passed.
- Original GTI front/back scenes, SVGs and vCard serialization match pre-update SHA-256 digests byte-for-byte for the same fictional employee. The work-phone-only validation case is also preserved.
- A source snapshot without plaintext fonts or local secrets restored all five exact fonts using the existing build key and completed the production webpack build. Server output traces include the five private fonts; the browser assets contain no decryption key.
- HTTP checks against the production server passed for both companies: selected-company preview/vCard, all print/digital side modes, exact page dimensions, 300/600 DPI PNG ZIPs, decoded full-card QR payloads, invalid export blocking, private font 404 responses, foreign-origin rejection, unknown company rejection and the original raw-employee API contract.
- Actual browser downloads were independently reopened: Double Leaf front-only print PDF has one page; its duplex digital PDF has two; the PNG ZIP has separately named front/back files.
- Browser switching restored Alex for GTI and Jordan for Double Leaf. Editing GTI did not change Double Leaf. Refresh retained the selected company and cleared employee fields. The two exact requested selector options, Demo data badge and correct Double Leaf vCard were checked.
- Desktop and 390-pixel responsive layouts were visually inspected. The company selector and employee fields fit the narrow viewport. The final production console had no log errors; development-only React diagnostics are blocked by the existing strict eval policy. Chrome's Issues history retained that development CSP diagnostic and form-field identifier suggestions.
- `npm audit` reported zero vulnerabilities across the complete installed dependency set at this release verification. This supersedes the older development advisory record above.

### Source PDF reproduction

Both private source PDFs were compared to regenerated references at 600 DPI using original employee values only transiently for geometric QA. These values are absent from app demos, fixtures and preview defaults. QR footprints are excluded from similarity metrics because payload serialization changes module patterns. The actual generated QR is independently decoded. All other artwork, including personalized typography, is compared.

| Company / side | Mean absolute RGB difference (0–255) | Pixels differing by >10 in any channel |
| --- | ---: | ---: |
| GTI front, excluding QR | 0.007314 | 0.004387% |
| GTI reverse | 0.000236 | 0% |
| Double Leaf front, excluding QR | 0.031604 | 0.131162% |
| Double Leaf reverse | 0.000022 | 0% |

All passed the tightened thresholds of mean error below 0.1 and changed pixels below 0.2%. Tiny residual differences remain from coordinate precision, glyph metrics and antialiasing; this is not a claim of pixel identity. Fixed artwork comes from source paths. Double Leaf's name preserves brown fill plus 0.25 pt stroke, and the source's website-grey definition takes precedence over the palette image's black label.

Reopened PDFs contain no live text operators, font resources or image XObjects. Every page, TrimBox and BleedBox is exactly 92 × 57 mm. Double Leaf's generated page 1 matches source page 2 (white front), and generated page 2 matches source page 1 (brown reverse). Fictional print/digital PDF QR and 300/600 DPI PNG QR payloads match the serializer through independent ZXing decoding. Resulting pages and source overlays were visually inspected.

Private machine-readable reports, overlays and reference reproductions remain under ignored `output/verification/companies/`. Only fictional demos belong in application screenshots or shared examples. Original PDFs/ZIPs, Illustrator metadata and private QA employee values are not in the Git or Vercel source package.

### Remaining limits

Double Leaf has no verified general office phone, so its configuration remains empty and no main-company number is added to its QR. A selected employee number can print normally. Physical proof scanning and Illustrator PDF open/re-save checks remain unperformed; use a 100%-scale print proof before a bulk run. Supplied fonts remain server-only and glyph coverage is enforced; unsupported scripts block export. This release retains the existing deployment audience and adds no authentication, database or unrelated features.

## UI clarity and readability update — 19 November 2026

Only the shared UI component and stylesheet changed. The company, template, renderer, QR/vCard and export modules are unchanged.

- Renamed the expandable section to **Additional QR / vCard Details** and added the requested explanation. The existing printed-number selector now sits outside the optional section. All twelve employee inputs remain present once; numbers that can also be selected for printing no longer carry misleading QR-only labels. The fax fields retain their accurate QR-only labels.
- Shared UI text roles now use 15 px body/input text, 14 px labels/buttons, 13 px helper/secondary text and 18 px section headings, with compact responsive adjustments. Mobile inputs use 16 px. The large page title and all outlined card typography remain unchanged.
- Replaced the native company dropdown with GTI / Double Leaf radio buttons in one compact rounded segment. Active brand accents animate over 180 ms; reduced-motion preferences disable the animation. Arrow keys, Home/End and Enter/Space use the existing company switch callback. Only the selected radio is in the Tab sequence; focus follows the selected company across the existing keyed form remount.
- Lint, strict TypeScript, all 40 existing tests and the production build passed. HTTP verification against the production-mode local server passed for both companies' previews, print/digital exports, PNG ZIPs and decoded QR payloads at 300/600 DPI.
- Before/after comparisons confirm both companies' front/back preview SVGs, vCard payloads and 600 DPI card PNGs are byte-for-byte unchanged for the same demo records.
- Chrome UI checks covered desktop, 768 px tablet, 390 px mobile and 320 px narrow mobile layouts. Header segments, longer labels, expanded helper copy, printed-number controls and mobile downloads were inspected without clipping or overlap. Text wraps within the available layout where needed.
- Mouse and keyboard company switching restored isolated Alex/Jordan form values. Left/Right and Home/End preserved focus on the newly selected radio; Tab continued to Help rather than the inactive company.
- In the browser, a supplied work phone and extension appeared as `TEL;TYPE=WORK,VOICE` in the Double Leaf vCard. Clearing them removed the optional property. Other blank optional telephone roles were omitted. A two-sided digital PDF was downloaded through the mobile interface.

No new fields, business-card styling, dimensions, font outlines, artwork, QR placement, data mapping or export behavior were introduced.

## Mr Ghashi product redesign — 19 November 2026

Implemented from the approved `fe3c366` baseline on `feature/mr-ghashi-redesign`. The existing Next.js stack, company registry, employee schemas, five private card fonts, fixed artwork, render/QR/vCard engines and export API routes are unchanged.

The UI now has the Mr Ghashi mascot/wordmark, the exact department attribution, self-hosted Geist UI typography, a shared token system, a quieter form without numbered badges or repeated separators, a prominent neutral preview canvas and a cohesive export workspace. The printed-number selector and optional QR/vCard section remain distinct. PNG resolution sits directly beside PNG download. A workspace export shortcut keeps the download area easy to reach. On tablet/mobile, the preview precedes the editor and export actions. See `MR_GHASHI_BRAND_ASSETS.md` for the reference-derived raster assets, exact image preparation prompts and the retained Geist license.

The appreciation feature is a separate UI component using `feedback-demo.ts` to construct an in-memory payload with reaction ID/label, intended recipient, company ID, timestamp, `mode: demo` and `sent: false`. It contains no network transport, mailto link, email service, storage or database. No employee contact record is included in its payload. The UI explicitly says no email has been sent. All four reactions were clicked and each displayed the correct selected state and confirmation. Keyboard Space/Enter selection, forward/reverse Tab trapping, Escape, close control, outside click and return of focus to the trigger were checked. The popup and confirmation were also inspected at mobile width.

Executed checks:

- Lint and strict TypeScript passed without warnings/errors; all 40 existing tests passed; production webpack builds passed after the UI refactor.
- Before/after comparisons show byte-for-byte identical GTI and Double Leaf front/back SVGs, vCard payloads and 600 DPI card PNGs for the established fictional demos.
- HTTP checks in production mode passed for both companies: preview data, all print/digital side modes, exact 92 × 57 mm PDF pages, 300/600 DPI PNG ZIPs, full-card QR decoding, invalid-export blocking, private font protection, origin checks and the original API contract.
- Actual Chrome layouts were inspected at 1440 × 900, 1280 × 800, 1024 × 768, 768 × 1024, 390 × 844 and 375 × 812. Branding, department credit, selector, form labels, optional fields, preview sides and export layout were reviewed. Narrow layouts use one column and readable wrapping rather than squeezed desktop columns. Inspector fitting scales screenshot display only; the listed viewport dimensions were applied through the device toolbar.
- GTI → Double Leaf starts with the isolated company form. Both fictional samples remain Alex/Jordan with `example.com` emails. A work phone and extension entered through the redesigned form appeared as `TEL;TYPE=WORK,VOICE` in the vCard; clearing those fields omitted the property. Blank optional roles remained absent.
- Invalid email displayed an inline error, blocked the download and focused the email field. Reset cleared employee values; Use sample employee restored the active company's fictional example. Front/back preview navigation and the brown Double Leaf reverse were checked.
- Downloads through the redesigned export controls were independently reopened: Double Leaf front-only print PDF has one 92 × 57 mm page, its digital PDF has two, and its 600 DPI ZIP contains distinct 2173 × 1346 front/back PNGs with 600 DPI metadata. Arrow-key resolution changes preserve the selected radio and focus. Keyboard company switching restored isolated Alex/Jordan values and kept focus on the selected company.

UI assets are source-derived transparent raster preparations from the supplied inline concepts, not claimed to be original vector logos or pixel-identical original cutouts. The original referenced image paths were unavailable in this workspace. These UI assets never enter the printable card scenes. No authentication, archive, backend feedback delivery or new external service was added.

## Final UI cleanup — 19 November 2026

Removed the company telephone box, printed-number selector and its helper, introductory headline, manual preview zoom and technical privacy paragraph. The compact company identity now says **Official business card template**. The department attribution is right-aligned within its header grid, beside the appreciation/help actions, with a separate responsive row on mobile. The existing canvas automatically fits the unchanged 92 × 57 mm artwork.

The employee form always initializes the existing printed-number setting to `mobile`; employees cannot select a different source. Employee mobile is required in this UI and uses the existing field-error/export-blocking presentation. An empty mobile remains an error even when optional QR numbers exist. Optional numbers remain in the vCard only. Company configurations, template engines, vCard mapping, exports and legacy API contracts are unchanged. GTI retains its configured +971 4 881 4800 landline; Double Leaf still has no invented company line.

The favicon is a direct crop of the existing mascot face, with transparent 16/32 pixel PNGs, a 16/32/48 ICO and a 180 pixel Apple touch icon. The face is visible in Chrome's tab. Next.js emits the versioned favicon and explicit PNG/Apple metadata references; HTTP checks confirm successful delivery and the expected dimensions/alpha channel. Asset extraction details are recorded in `MR_GHASHI_BRAND_ASSETS.md`.

Executed checks: lint and strict TypeScript passed, all **40 existing tests** passed and the production build passed. Production-mode HTTP checks passed for both companies' preview/vCard data, every print/digital side mode, 300/600 DPI PNG ZIPs and full-card QR decoding. Existing vector-resource checks and 92 × 57 mm page assertions passed. Front-only and two-sided Double Leaf print PDFs downloaded through the cleaned interface and were independently reopened to verify one/two pages of the original dimensions.

Chrome layouts were inspected at 1440 × 900, 1280 × 800, 1024 × 768, 768 × 1024, 390 × 844 and 375 × 812. The right-aligned attribution, company controls, longer template label, automatic preview fit and reduced form spacing fit without overlap. In the browser, a blank GTI mobile with a populated QR work number blocked export and focused Employee mobile; supplying the mobile restored readiness. Its vCard retained mobile, optional work number and configured GTI landline. Double Leaf switching restored its isolated form and correct organization, with no GTI landline in its vCard. The removed controls/text are absent from the rendered interface.

## Permanent appreciation and ownership header — 19 November 2026

Built from the clean `905bd28` checkpoint on `feature/permanent-appreciation`. The primary header uses the new logo artwork cropped directly from the supplied mockup, with original GTI ownership vectors and left-aligned department attribution. Ownership always uses GTI regardless of the selected card company. The former Give credit trigger/popup and company identity/template block are removed. The existing selector, export shortcut and Help guide remain available.

The four existing reaction illustrations are permanent buttons below the header. A 32-piece CSS confetti burst lasts under 1.6 seconds, ignores pointer events, cleans itself up and is disabled for reduced motion. No animation library or new package was added. The validated feedback endpoint returns explicit demo/no-email results. Server-only notification preparation targets the two newly requested recipients, creates server event times and uses anonymous visitor identity. See `FEEDBACK.md` for the inactive transport, process-local abuse controls and the shared protections required before future email activation.

Automated verification completed: lint, strict TypeScript, **48 tests** and the production build passed. Eight new tests cover allowed input, rejected recipient/visitor overrides, correct notification recipients/identity/time, inactive delivery, provider failure propagation, bounded expiry/rate/duplicate protection, opaque client keys and endpoint origin/validation/no-store behavior. Both-company HTTP checks passed for feedback demo results, previews, print/digital side modes, PDF dimensions, 300/600 DPI PNG ZIPs and actual QR decoding. Both companies' front/back SVGs, vCards and 600 DPI front PNG hashes match the approved baseline exactly. Recipient addresses/configuration are absent from browser JavaScript chunks.

The company/template/QR/vCard/export modules, five private fonts, favicon, package/lock files, Next/Vercel configuration, environment files and deployment/domain settings are unchanged.

Initial native Chrome verification was interrupted by window/profile changes. The user then explicitly authorized isolated headless Playwright checks. Playwright 1.65.1 was installed only in a temporary QA directory; the application's package and lock files remain unchanged. An isolated headless Chrome process used a fresh temporary profile, leaving open Chrome windows out of the checks.

All six layouts (1440 × 900, 1280 × 800, 1024 × 768, 768 × 1024, 390 × 844 and 375 × 812) passed measured page/element overflow checks, separated header-group bounds, visibility of all four reactions and the original card aspect ratio. Desktop/mobile and confetti screenshots were visually inspected. Every reaction produced the selected state, a running 32-piece pointer-transparent animation and an honest demo/no-email confirmation. Animation cleanup, reduced-motion suppression, keyboard Space selection and a simulated 503 response with nonintrusive error handling passed. There were no uncaught page errors.

Headless browser downloads passed: GTI front-only print PDF has one page; Double Leaf print/digital PDFs each have two pages; all pages are 92 × 57 mm. Switching restored isolated Alex/Jordan form values, front/back preview controls worked, and the GTI header ownership vectors remained identical across company switches. Machine-readable results, screenshots and downloaded PDFs remain under ignored `output/verification/permanent-appreciation/`.

The standalone high-resolution new-logo path was unavailable; the exact supplied mockup crop and its native resolution are documented in the asset notes. All required local verification completed before production publishing.

## Secure employee access — 19 November 2026

Implemented from `e1f3295` on `feature/secure-employee-access`, with local checkpoint tag `checkpoint/pre-secure-access-20261119`. Supabase email OTP, an active authorization directory, administrator management and company permissions now protect the generator and all related APIs. The existing SMTP/template were preserved; email codes are six digits with a ten-minute expiry and signup remains disabled. All seven requested staff accounts were created as active, with both companies; Vinu is the initial administrator.

Lint, strict TypeScript, all **47 tests** and the production build pass. Independent HTTP/Supabase integration checks verify anonymous denial, real OTP validation/replay rejection, server-only identity, RLS ownership and denied client writes, administrator-only operations, normalized duplicate handling, immediate disable/reactivate and changed company permissions, shared quotas, logout cookies and cross-origin denial. A deliberately expired OTP was rejected. The last-active-admin database safeguard was tested inside a rollback-safe SQL block. Temporary QA users were removed after verification. The user confirmed real SMTP delivery, successful sign-in and access to the generator/admin page.

Isolated headless Chrome checked the login, both company generators and administration at desktop/tablet/mobile sizes down to 320px, including the editing dialog, keyboard/focus behavior, cooldown/invalid-code states, logout and protected navigation. All four reactions produce only temporary 44-piece confetti, respect reduced motion and retain no checkmark/selection/status message. The appreciation copy centers against the complete icon/label group. Browser PDF/PNG ZIP downloads passed for both companies with no runtime errors. The mobile admin table scrolls within its own container.

Both companies' front/back SVGs and vCard payloads exactly match the prior approved baseline, and both 600-DPI front PNG hashes match. Authenticated HTTP checks also passed print/digital one/two-page PDFs, exact dimensions, 300/600-DPI PNG ZIPs and decoded QR content. Card-rendering, vCard, export engines, approved assets/fonts, Next/Vercel configuration and domain settings remain unchanged.

Real Great Job notifications for each company were accepted by Resend, addressed to both requested recipients, with the verified QA identity, company and server time. Duplicate submission IDs resulted in one provider acceptance/attempt per event. This establishes provider acceptance, not inbox delivery; the send-only key cannot read delivery logs. The UI makes no email-delivery claim. Unit checks verify provider failures cannot become success and distinguish retryable failures.

Source/browser-chunk scans found no private runtime or management credential values. Before the user's later instruction, the Supabase runtime key was replaced/verified and the setup-shared key revoked. The user then postponed all further credential rotation and explicitly authorized release with current credentials; Resend/SMTP/Vercel credentials are unchanged. Management tokens and the database password are excluded from application runtime.

Local evidence and private QA artifacts remain under ignored `output/verification/secure-access/`; sensitive cookies and temporary fixture records are removed after use. Deployment evidence is recorded separately after preview verification.
