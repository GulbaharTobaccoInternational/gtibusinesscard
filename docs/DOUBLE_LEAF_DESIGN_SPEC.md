# Double Leaf approved template

Source authority: supplied `Double Leaf Business Card Template.pdf`, two pages at 92 × 57 mm. The original is retained privately under `.tools/references/`, never deployed. Its source page 2 is the white personalized front; source page 1 is the fixed brown reverse. Exports use front then back, without extra bleed.

## Geometry and vectors

The model contains 97 fixed front paths and 19 reverse paths, extracted directly from the PDF. It excludes original employee name, designation, email, telephone and QR paths. Logos, wordmark lettering, icons, divider, printed address and website retain source coordinates and source colors. The reverse is invariant across employee changes. No logo lettering is rebuilt using a substitute font.

Coordinates use millimeters with a top-left origin; text anchors are font origins, while the diagram's offsets measure visible bounds.

| Element | Source geometry |
| --- | --- |
| Name | Font origin x 7.870754 mm; baseline 14.96994 mm; 13 pt em; visible uppercase height approximately 3.175 mm |
| Name stroke | Brown fill and brown 0.25 pt stroke (0.088194 mm), preserved in SVG and PDF |
| Designation | Origin x 8.119845 mm; baseline 18.911605 mm; General Sans Semibold, uppercase |
| Email | Origin x 37.657241 mm; baseline 30.664532 mm; General Sans Regular |
| Employee phone | Origin x 37.671295 mm; baseline 33.628540 mm; General Sans Regular |
| General Sans sizing | 2.47 mm em, 0.005 em tracking; actual glyph outlines reproduce the reference visible heights |
| Upper-right circular logo | Approximately x 73.307 mm, top 9.182 mm, width 10.938 mm |
| QR active modules | x 7.731831 mm, top 31.035978 mm, square 14.621228 mm; four-module quiet zone outside active modules |
| Reverse wordmark | Original centered vector paths, approximately 63.604 × 10.938 mm |

The diagram labels the QR left offset 8.107 mm and bottom offset 11.293 mm. The actual PDF active-module rectangle differs slightly (left 7.731831 mm, bottom 11.342794 mm), so the PDF geometry is retained. Diagram offsets do not replace measured vector coordinates.

## Fonts and overflow

KULDIPA2 Regular is used exclusively for the employee name, uppercase with original spacing and stroke. General Sans Semibold is used for designation; General Sans Regular for employee contacts. All dynamic text becomes real glyph paths on the server. Static company address and website are already source outlines.

Name width may shrink uniformly to 90% of the original em size, then blocks export if it still exceeds the approved available area. Designation and contacts block overflow instead of clipping, wrapping or uncontrolled scaling. Unsupported glyphs are reported; fonts are never substituted.

## Source colors

Palette references are brown `#65391B`, gold `#B68F54`, designation grey `#808184`, contact grey `#606161`, website reference black `#000000`. The PDF stores slightly rounded RGB components; the renderer retains those per-object values instead of replacing them with rounded hex values. In particular, the PDF website is contact grey rather than the color sheet's black, so the source PDF definition is preserved. GTI red is absent from Double Leaf artwork.

## Corporate information

Organization: `DOUBLE LEAF FZE`. Website: `www.doubleleaf.ae`. Printed source lines:

```text
DOUBLE LEAF FZE,
Plot No. B054R03, JAFZA North,
Jebel Ali Free Zone, Dubai, UAE
```

The company phone is configurable and intentionally empty. The sample PDF's personal phone/email are never corporate defaults or demo data. Employee email and selected mobile/direct work phone are dynamic. Other employee contacts use the shared vCard serializer. QR organization/address/website come only from the selected company's configuration.

## Reproduction and QA

`scripts/extract-double-leaf.py` regenerates fixed vectors from a private local source. Any artwork/font change must be reviewed before updating the integrity manifest. `scripts/compare-reference.py` verifies both templates against source PDFs at 600 DPI, including the reversed Double Leaf source order, and retains private overlays under ignored `output/verification/companies/`. QR footprints are masked in image similarity because standards-compliant payloads create different module patterns. The full generated QR is independently decoded.
