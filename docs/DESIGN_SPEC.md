# Canonical design specification

Source authority: `Sample B Cards/Mr Liwaa Sahib Bussiness Card.pdf`. Asset inventory and original SHA-256 are in `source-analysis/inventory.json` and `private/assets/source-artwork.json`. The original PDFs, PNGs, SVGs and font files are not edited.

## Page and geometry

The PDF MediaBox is 260.787 × 161.575 pt, effectively 92 × 57 mm. The generated MediaBox is exactly 92 × 57 mm (260.787401575 × 161.574803150 pt). This sub-micrometer normalization explains a few antialiasing differences. Origin is top-left; canonical geometry is in mm. No rotation, bleed, printer marks, A4 sheet or assumed 90 × 55 mm trim is introduced.

Measured ink bounds in the approved front:

| Element | Left mm | Top mm | Right mm | Bottom mm |
| --- | ---: | ---: | ---: | ---: |
| Sample name | 5.897527 | 26.295526 | 25.729281 | 28.310944 |
| Sample designation | 5.773773 | 29.335731 | 44.690347 | 30.855850 |
| Sample email | 53.814243 | 38.012511 | 86.233846 | 39.885795 |
| Sample phone line | 42.828951 | 40.607155 | 86.273820 | 42.358628 |
| Active QR modules | 71.568731 | 7.162445 | 86.229825 | 21.823539 |

These are visible glyph/module bounds, not text-frame anchors. Exact dynamic anchors, baselines, tracking and font sizes are in `src/lib/design.ts`. The name's original 7.937 pt em produces roughly 1.973 mm capitals; the 5.9528 pt em is used for designation and contact text. The diagram's “1.5 mm” contact measurement describes visible glyph height and must not be used as the font's em size.

The fixed front comprises 106 filled paths extracted directly from the PDF: the official logo, lower-left G block, approved address, website and their original geometry. The reverse is exactly 10 source paths, including the full background and original outlined wordmark. Brand lettering is never retyped.

## Resolving conflicting references

- The dimension diagram says the QR right offset is 1.281 mm; the PDF's actual active QR right offset is 5.770175 mm. The PDF wins.
- The diagram calls out a 14.668 mm QR; the approved PDF active area measures 14.661094 mm. The PDF wins. A four-module white quiet zone is reserved in the existing surrounding white area; the active code is not enlarged or moved.
- The supplied SVG G rectangle uses `#EA0029`. The PDF uses PANTONE 185 C for this object. The PDF's original spot color is retained for print.
- The reverse uses DeviceCMYK 0/1/.95/0, not the front G's spot red or the SVG's RGB red. These deliberately remain distinct.
- Ink bounds and font frames differ. The approved PDF's outline coordinates and the editable template's text matrix/spacing establish the typography, rather than estimates from screenshots.

## Color behavior

Print keeps the original DeviceCMYK values per object and PANTONE Separation spaces with D50 Lab alternate definitions:

| Spot | Lab alternate | Used in |
| --- | --- | --- |
| PANTONE 185 C | 49.8039, 77, 49 | Front G block |
| PANTONE 483 C | 27.451, 25, 19 | Brown logo |
| PANTONE 371 C | 39.2157, -13, 33 | Green logo |

Lab white point: 0.964203, 1, 0.824905. Function type 2 with original tint endpoints is retained. Dynamic name/contact colors are read from the corresponding original PDF objects. QR modules are process black K=100; the backing is white. Screen RGB values for extracted paths come from MuPDF's source color conversion. Digital PDF and PNG use those display colors. Print is vector PDF, not a PDF/X certification or a new color-management/ICC conversion.

## Dynamic rules

- Name is combined first/last name in uppercase Gotham Bold. Left alignment is fixed. A uniform font-size adjustment down to 90% is allowed when needed; there is no horizontal distortion. Greater overflow blocks export.
- Designation stays uppercase on one line at its original size. No second line, ellipsis or silent clipping is allowed. Overflow blocks export.
- Email and phone line are right-aligned by actual ink edge, with original Gotham Book size/tracking and original baselines.
- Only the selected primary employee mobile plus the fixed company phone are printed. If no mobile is selected/provided, its label and separator disappear. Additional contact values are QR-only.
- Static addresses and website remain the approved outlines with original line breaks and spelling.
- Missing glyphs, bad inputs, layout overflow, missing assets and encoding failures block export on the server. Warnings are visible and must be acknowledged before export.

## QR and company data

Both supplied QR SVGs and the PDF QR were decoded. Liwaa's reference establishes state `إمارة دبيّ`; the second sample uses a different address/state spelling. The centrally configured Liwaa state is the chosen authority. The new contact uses proper CRLF vCard 3.0 lines, UTF-8-safe 75-octet folding and escaped values, rather than copying inconsistent old serialization.

QR error correction is L, with square black modules and a four-module quiet zone. The baseline sample generates 73 active modules, 0.200837 mm per module at the approved size. Below 0.22 mm a printed-proof warning is required; below 0.16 mm export with QR is blocked. These are conservative application heuristics, not a claim of universal camera or printer certification. No external QR service is contacted.

Company address is structured as P.O. Box / extended address / street / locality / region / postal code / country. The actual P.O. Box is stored in the first ADR component; it is not misrepresented as a street ZIP code. All original company details are centralized; printed fixed outlines and vCard formatting intentionally differ.

## Unverified matters

No QRCode Monkey configuration screenshot or font license document exists in the supplied folder. Their absence does not prevent extraction or generation. Server-side outline licensing must be confirmed by the asset owner. Printed scripts outside the supplied Gotham glyph coverage need an approved font extension. Physical print proof and Illustrator interactive checks remain manual acceptance steps.
