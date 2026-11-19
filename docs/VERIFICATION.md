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

Original and regenerated Liwaa cards were rendered with the same MuPDF engine at 600 DPI. The QR footprint plus quiet zone is excluded from similarity metrics because the new vCard serialization changes the QR pattern. Every other region is included, including employee text.

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
