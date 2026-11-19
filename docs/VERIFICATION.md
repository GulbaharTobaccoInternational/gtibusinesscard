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
