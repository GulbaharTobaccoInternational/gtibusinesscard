# Mr Ghashi — Your Biz Card Genius

An internal web application by GTI Marketing Department. One Next.js application supports two independent approved templates: **GTI — Gulbahar Tobacco International** and **Double Leaf — Double Leaf FZE**. The shared employee form, vCard engine, previews and downloads use a company registry; each company retains its own artwork, fonts, layout and QR position.

## Run locally

Use Node.js 24.x and the supplied private asset folders:

```sh
npm ci
npm run install:assets -- "/absolute/path/to/B Card Assets" "/absolute/path/to/B Card Assets - Double Leaf"
npm run check:assets
npm run dev
```

Open http://127.0.0.1:3107. Both forms start empty. **Use sample employee** loads fictional Alex Morgan for GTI or Jordan Taylor for Double Leaf, with `example.com` emails and the demonstration number `+971 50 000 0000`. A UI-only **Demo data** badge identifies these examples; it never enters the card artwork.

The header selector offers exactly the two supported companies. Form values are isolated by company and retained in memory while switching. Refreshing clears all employee values; localStorage stores only the selected company ID. SessionStorage stores each company's export-side preference. No employee submissions are saved or sent to an external QR service.

## Mr Ghashi interface

The workspace uses self-hosted Geist typography, the supplied mascot identity, a prominent preview canvas and a shared export workspace. On smaller screens the preview appears before the form, followed by export controls. Both company forms retain their existing session isolation.

Four illustrated appreciation reactions are permanently visible beneath the header. Each click starts a short, nonblocking confetti burst (disabled for reduced motion) and submits only a reaction/company/UUID to the validated feedback endpoint. Email delivery remains inactive and the confirmation explicitly says no email has been sent. The future server-only transport targets `slavomir.kluziak@gulbahartobacco.com` and `vinu@gulbahartobacco.com`. See [feedback integration readiness](docs/FEEDBACK.md) and [UI asset provenance](docs/MR_GHASHI_BRAND_ASSETS.md).

## Cards and downloads

- Both templates use 92 × 57 mm pages, no automatic bleed or resizing.
- Front Only produces the personalized white front; Front + Back produces white front then approved colored reverse (GTI red, Double Leaf brown).
- Print PDF uses genuine glyph outlines, vector logos/icons/QR, and original source color definitions. GTI's original CMYK/Pantone artwork remains unchanged. Double Leaf's supplied RGB definitions are preserved.
- Digital PDF uses outlined RGB artwork. PNG supports 300/600 DPI, either one front image or a ZIP containing separate front/back images.
- Filenames include the selected company and safely sanitized employee name.
- Shared validation blocks missing required data, unsupported glyphs, text overflow and excessive QR density. QR print warnings require acknowledgment before export.
- Extra phone roles are available in the QR. Double Leaf can print a selected employee mobile/direct office number. Its general company telephone is intentionally empty until a verified number is supplied.

## Architecture and source accuracy

`src/lib/company.ts` defines corporate information and application accents. `src/lib/templates.ts` defines the artwork/font/layout registry. Independent front renderers live under `src/lib/templates/`; the shared canonical scene drives SVG, PDF and PNG. Company IDs are validated at both API routes. Original GTI requests without a company ID remain supported.

Fixed vectors are in `private/assets/source-artwork.json` and `source-artwork-double-leaf.json`. The approved PDFs take precedence when diagrams or palette images disagree. See [GTI design specification](docs/DESIGN_SPEC.md), [Double Leaf design specification](docs/DOUBLE_LEAF_DESIGN_SPEC.md) and [verification record](docs/VERIFICATION.md).

Original PDFs, SVG metadata, reference ZIPs and private reference employee records are excluded from the deployment. The Double Leaf source has its brown back on page 1; the exporter deliberately reverses that source order.

## Private fonts

The five supplied fonts are server-only: Gotham Bold/Book for GTI, KULDIPA2 Regular and General Sans Semibold/Regular for Double Leaf. Plain font files are Git-ignored and never served from `public/`; browsers receive glyph paths. Their SHA-256 hashes are checked against the integrity manifest.

Git builds restore all five fonts from the authenticated AES-256-GCM bundle using the existing server-side `GULBAHAR_FONT_KEY` environment Secret. Its historical filename `gotham-fonts.enc.json` is retained for deployment compatibility. The key and plaintext fonts must remain outside Git. Font coverage is validated before export; no substitute font is used. The supplied font license documents were not included, so rights to server-side outline generation remain the company's responsibility.

Administrators can run `npm run package:fonts` after an approved font update. It uses the existing key or creates one in ignored `.env.fonts.local`, without printing it. Keep the matching Secret configured for Production and Preview. Local rendering with all fonts installed does not require a key.

## Verification

```sh
npm run lint
npm run typecheck
npm test
npm run verify:exports
npm run build
GULBAHAR_TEST_URL=http://127.0.0.1:3107 npm run test:api
```

For private source comparisons, install `requirements-qa.txt` in an isolated Python environment and run `scripts/compare-reference.py` after `verify:exports`. Set `GULBAHAR_REFERENCE_PDF` and `DOUBLE_LEAF_REFERENCE_PDF` if the original PDFs are stored elsewhere. The script transiently extracts original reference contact data solely to reproduce the reference typography; records are not hardcoded in application demos or tests. All comparison outputs stay in Git-ignored `output/` and must remain private. Fictional demo exports and QR payloads are also checked independently.

Tests cover both templates, original GTI scene/SVG/vCard digests, one/two-page print/digital PDFs, vector resources, safe filenames, PNG ZIP contents, exact QR decoding at both resolutions, company information, unsupported text/overflow and authenticated font provisioning. Reference comparisons render at 600 DPI and save overlays/differences with structural PDF checks.

## Deployment

Source: [GulbaharTobaccoInternational/gtibusinesscard](https://github.com/GulbaharTobaccoInternational/gtibusinesscard). Existing Vercel project `gtibc` deploys `main`; [open the application](https://gtibc-kappa.vercel.app). This update preserves the project's existing access settings and uses the same font Secret. See [deployment instructions](docs/DEPLOYMENT.md).

No database or new authentication system is needed for this update. Employee API responses remain private and non-cacheable. A physical print proof and scan at 100% scale are still needed before bulk printing; software decoding cannot certify a particular printer, stock or camera.
