# Mr Ghashi UI asset provenance

These assets are for the application interface only. They never enter the GTI or Double Leaf card scenes, PDFs or PNG card exports.

The supplied concepts were visible as inline reference images; the referenced `/Users/marketing/Documents/` paths were not present in this workspace. The built-in image editing tool was used to prepare reference-derived transparent UI assets. They preserve the supplied visual identity but are not claimed to be pixel-identical crops or original vector artwork. Separate transparent source cutouts/vector wordmarks were not supplied.

## Saved assets

- `public/brand/mr-ghashi-logo.png`: transparent horizontal mascot-head/wordmark/tagline composition, 2172 × 724 pixels. The header loads an optimized responsive version through Next.js Image.
- `public/brand/appreciation-reactions.png`: transparent 1280 × 1280 sheet with Applause, Great Job, Coffee Treat and Hats Off in a 2 × 2 grid. Each reaction is framed through an SVG viewport so the source file is reused without duplicated assets.

Both assets were produced with the built-in image tool, not a CLI/API fallback. The original generated files remain unchanged in the local generated-images folder. No complete promotional poster is displayed in the workspace.

## Favicon extraction — final UI cleanup

The favicon is a direct pixel crop of the existing header asset, with no regeneration or character redesign. The source rectangle is x=78, y=0, width=670, height=724. Its transparent bounds are trimmed, fitted within 480 × 480 pixels and padded to a 512 × 512 master at `public/brand/mr-ghashi-face.png`. The source's transparency is retained.

Deterministic resampling produces `public/brand/favicon-16x16.png`, `public/brand/favicon-32x32.png`, and `public/brand/apple-touch-icon.png` (180 × 180). `src/app/favicon.ico` contains 16, 32 and 48 pixel PNG entries. Next.js's favicon file convention supplies the versioned ICO reference; root metadata supplies the size-specific PNG and Apple references. These derivatives inherit the header asset's reference-derived raster provenance described above.

## Logo preparation prompt

Use case: background-extraction. Edit target: the user's attached 'Mr Ghashi Biz Card Genius Branding' concept sheet, with the yellow 3D mascot, brown round glasses, red utility belt, exact wordmark Mr Ghashi and tagline Your Biz Card Genius. Ignore the unrelated photograph of browser permission settings. Extract the existing compact horizontal logo composition near the bottom of the branding sheet: yellow mascot head on the left, dark brown 'Mr Ghashi' wordmark to its right, and 'Your Biz Card Genius' directly underneath. This is an asset-preparation task, NOT a creative redesign. Preserve the supplied character, facial expression, brown glasses, colors, wording and proportions closely. Output this single compact horizontal logo on a genuinely transparent background, cropped snugly with a little safe padding, approximately a 3:1 horizontal composition. Do not include the larger hero mascot, other scenes, white poster background, red app-icon tile, extra objects, decorative text or unrelated imagery. Do not invent new branding.

## Reaction sheet preparation prompt

Use case: background-extraction. Edit target: the user's uploaded 'Give Credit to GTI Marketing' poster. Ignore the unrelated photograph of browser permission settings. Prepare ONE reusable reaction-art sprite sheet from the four existing illustrated choices in the lower row of that poster. Preserve their recognizable original 3D shapes, lighting and colors, without creative reinvention: (1) yellow clapping hands with red cuffs, (2) yellow thumbs-up hand with a red cuff, (3) cream coffee cup and saucer with a red square containing a white G and brown steam, (4) yellow hand with red cuff tipping a dark brown top hat with a red band. Arrange the four original isolated illustrations on a single square transparent sheet in an exactly aligned 2-by-2 grid: top-left clapping hands, top-right thumbs up, bottom-left coffee, bottom-right hat. Each icon centered in its own equal square cell, generous transparent gutters, no illustration crossing cell boundaries. Same visual scale and coherent style across all four. Remove original rounded tile frames, poster typography, hero character, shadows belonging to tile frames, and all white background. Keep the subtle original object shadows if possible. Do not add labels, new characters, emojis, extra symbols, or new branding. This is faithful source-derived UI asset preparation, not a new illustration concept.

## UI font

Geist Sans is self-hosted from the font already bundled with the installed Next.js distribution. It is used exclusively for the interface. Its [SIL Open Font License](https://github.com/vercel/geist-font/blob/main/LICENSE.txt) is retained at `public/fonts/Geist-OFL.txt`. The five approved private card fonts and encrypted bundle are unchanged.

## Approved header update — permanent reactions

`public/brand/mr-ghashi-approved-logo.webp` replaces the earlier header wordmark. It is a direct pixel crop of the new logo in the supplied Illustrator mockup screenshot (`Screenshot 2026-11-19 at 4.57.07 PM.png`, 2220 × 230). The source rectangle is x=108, y=64, width=309, height=120; surrounding white pixels are trimmed and the result is encoded as lossless WebP, 304 × 107. No character generation, redraw or typography reconstruction was used. The separate `/Users/marketing/Downloads/Mr Ghashi Business Card Genius.png` path was unavailable on this host, so the mockup provides the available native raster resolution. The original aspect ratio and artwork are retained.

The header ownership logo is the original GTI vector returned by `brandSvg('gti')`, independent of the active card company. The four existing reaction illustrations and mascot-face favicon are unchanged. The former header asset remains as an unreferenced source for the existing favicon; it is not displayed as the active wordmark.
