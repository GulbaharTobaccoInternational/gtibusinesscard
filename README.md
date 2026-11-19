# Gulbahar Business Card Generator

A working Next.js application for Gulbahar Tobacco International FZE. It reproduces the supplied approved card using vector paths extracted from the original PDF. Employee text is converted to Gotham glyph outlines on the server. Preview, PDF and PNG use the same scene in millimeters.

## Run locally

Node.js 24.x is required (matching the pinned Vercel runtime). The licensed Gotham font files are installed separately and are not included in this public repository.

```sh
git clone https://github.com/GulbaharTobaccoInternational/gtibusinesscard.git
cd gtibusinesscard
npm ci
npm run install:assets -- "/absolute/path/to/B Card Assets"
npm run check:assets
npm run dev
```

Open http://127.0.0.1:3107. The form starts empty; **Use sample employee** loads the approved Liwaa Sahib fixture. The application does not save employee submissions. Only the export-side preference is stored in sessionStorage.

```sh
npm run lint
npm run typecheck
npm test
npm run build
npm run start -- --port 3107
```

The production build uses Next.js's supported webpack compiler. Turbopack's production CSS compiler could not bind its internal port under this desktop environment's restrictions. The development server can still use Turbopack.

## What works

- Identity and contact form with required-field, email, international-phone, glyph-coverage and layout validation.
- Extra work, company mobile, home, additional and fax numbers; one selected mobile prints, the others go into the QR contact.
- Central, employee-read-only corporate defaults in `src/lib/company.ts`.
- Debounced live front/reverse previews, zoom, QR inspection, reset and sample mode.
- Locally encoded vCard 3.0 with UTF-8-safe folding, escaped values, structured names/address, typed phones and the original Dubai state value.
- **Front Only** exports exactly one page; **Front + Back** exactly two.
- Print PDF: 92 × 57 mm, real glyph paths, vector QR, original CMYK and Pantone Separation colors, no fonts or raster images, no added bleed.
- Digital PDF: the same outlined geometry in RGB. PNG: 300/600 DPI, a single front PNG or two separate PNGs in a ZIP.
- Export validation runs again on the server. Dense QR codes require a proof-scan acknowledgment; excessively dense codes are blocked.

## Source accuracy

Read [the design specification](docs/DESIGN_SPEC.md). The approved PDF is the authority where diagrams or SVGs disagree. Reference files remain untouched in the parent asset folder. `docs/source-analysis/inventory.json` records every supplied asset and its SHA-256.

The static vector model is `private/assets/source-artwork.json`; layout anchors are in `src/lib/design.ts`. The SVG and PDF writers both consume the canonical scene. No browser CSS positions printed content, no system fonts are used in cards, and print export never goes through a bitmap.

## Licensed assets

Git builds include an authenticated encrypted font bundle, which prebuild restores using the server-side `GULBAHAR_FONT_KEY` secret. The unencrypted fonts remain excluded from Git.

The official branding is present. Two original Gotham fonts are used: `Gotham-Bold.otf` and `GothamBook.ttf`. They remain outside `public/` and are ignored by Git; the browser receives glyph paths only. No font license document was supplied, and the embedding flags in font metadata do not establish commercial usage rights. Confirm the company's license covers server-side outline generation before distributing or deploying the app.

For a fresh checkout, install the supplied private fonts:

```sh
npm run install:assets -- "/absolute/path/to/B Card Assets"
```

The installer checks them against `private/assets/manifest.json`. Keep licensed binaries and the bundle decryption key in an authorized private build environment. Do not commit either to a public repository. The encrypted bundle can be committed; its key is stored separately in Vercel’s Secret settings. The font files contain a limited Latin character set: supported accents work, but unsupported scripts are reported and blocked for printed text. QR serialization itself supports UTF-8. A licensed Gotham version with broader glyph coverage is needed for additional printed scripts; no substitute is used.

For administrators replacing approved fonts, `npm run package:fonts` rebuilds the encrypted bundle using the existing key, or creates a new key in the ignored `.env.fonts.local` file when none exists. Set the matching key in Vercel before deploying the bundle. The key is never printed by the packaging script.

To regenerate the static model after an approved artwork update, run `scripts/extract-artwork.py` with pypdf and PyMuPDF installed. It copies the source fonts and extracts vector paths without changing the original PDF. Review changes, visually verify them and deliberately update the integrity manifest. Do not merely accept an unexpected checksum.

## Verification

```sh
npm run verify:exports
python3 -m venv .tools/qa-venv
.tools/qa-venv/bin/pip install -r requirements-qa.txt
.tools/qa-venv/bin/python scripts/compare-reference.py
```

The comparison expects the original PDF in its supplied relative location. Set `GULBAHAR_REFERENCE_PDF` to use another location. It renders both PDFs at 600 DPI, saves overlays/differences, decodes the final print PDF QR, verifies no text/font/image resources, checks exact dimensions and decodes both PNG resolutions. QR patterns are excluded from visual similarity metrics because the new standards-compliant payload differs from the old sample. Run these commands only with the non-sensitive sample fixture; outputs contain its contact details and are ignored by Git.

See [the verification record](docs/VERIFICATION.md) for executed results, thresholds, browser coverage and practical limits. Print at 100% scale, then scan a physical proof before a bulk order. Software decoding cannot certify a particular printer, paper stock or smartphone camera. Adobe Illustrator was not available for an interactive open/re-save check; the structural checks establish that the export contains paths rather than embedded fonts or images.

## Deploy

The source is maintained in [GulbaharTobaccoInternational/gtibusinesscard](https://github.com/GulbaharTobaccoInternational/gtibusinesscard). The app is prepared for Vercel and conventional Node hosting; a live deployment has not been published. See [deployment instructions](docs/DEPLOYMENT.md).

A Git/Vercel build needs the `GULBAHAR_FONT_KEY` Secret to restore the encrypted fonts; no database is required. Local use with fonts already installed does not require this secret. Protect **all routes**, including `/api/render` and `/api/export`, with corporate SSO or a staff-restricted access proxy before making it available online. The UI's internal-tool label is not authentication. No identity provider or credentials were supplied, so no login system or passwords have been invented.

Additional bleed is disabled at 0 mm. Print artwork, final trim and page dimensions are separately recorded in `PRINT_CONFIG` for future printer-specific work. Enabling bleed requires extending backgrounds and verifying output; changing a number alone is intentionally not implemented.
