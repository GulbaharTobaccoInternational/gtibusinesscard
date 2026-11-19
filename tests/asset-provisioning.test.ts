import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { BUNDLE_FILE, encryptFonts, hashAsset, prepareAssets } from '../scripts/font-bundle.mjs';

const approvedFonts = {
  'Gotham-Bold.otf': Buffer.from('approved bold font fixture'),
  'GothamBook.ttf': Buffer.from('approved book font fixture'),
};
function fixture() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'gulbahar-font-build-'));
  const key = crypto.randomBytes(32).toString('hex');
  const artwork = Buffer.from('{"approved":"vector artwork fixture"}');
  fs.writeFileSync(path.join(directory, 'source-artwork.json'), artwork);
  const manifest = { 'source-artwork.json': hashAsset(artwork), ...Object.fromEntries(Object.entries(approvedFonts).map(([name, bytes]) => [name, hashAsset(bytes)])) };
  fs.writeFileSync(path.join(directory, 'manifest.json'), JSON.stringify(manifest));
  const bundle = encryptFonts(approvedFonts, key);
  fs.writeFileSync(path.join(directory, BUNDLE_FILE), JSON.stringify(bundle));
  return { directory, key, bundle, cleanup: () => fs.rmSync(directory, { recursive: true, force: true }) };
}
test('a fresh Git checkout restores both exact fonts using the private build key', () => {
  const f = fixture();
  try {
    assert.deepEqual(prepareAssets(f.directory, f.key), { restored: 2 });
    for (const [name, bytes] of Object.entries(approvedFonts)) assert.deepEqual(fs.readFileSync(path.join(f.directory, name)), bytes);
    assert.deepEqual(prepareAssets(f.directory, undefined), { restored: 0 });
  } finally { f.cleanup(); }
});
test('missing key gives actionable Vercel instructions and installs no fonts', () => {
  const f = fixture();
  try {
    assert.throws(() => prepareAssets(f.directory, undefined), /Vercel, add GULBAHAR_FONT_KEY/);
    assert.ok(!fs.existsSync(path.join(f.directory, 'Gotham-Bold.otf')));
  } finally { f.cleanup(); }
});
test('a wrong key or a tampered encrypted bundle cannot install fonts', () => {
  const f = fixture();
  try {
    assert.throws(() => prepareAssets(f.directory, '00'.repeat(32)), /Cannot unlock/);
    const bytes = Buffer.from(f.bundle.ciphertext, 'base64'); bytes[0] ^= 1;
    fs.writeFileSync(path.join(f.directory, BUNDLE_FILE), JSON.stringify({ ...f.bundle, ciphertext: bytes.toString('base64') }));
    assert.throws(() => prepareAssets(f.directory, f.key), /Cannot unlock/);
    for (const name of Object.keys(approvedFonts)) assert.ok(!fs.existsSync(path.join(f.directory, name)));
  } finally { f.cleanup(); }
});
test('authenticated but unapproved font data is rejected before either file is written', () => {
  const f = fixture();
  try {
    const bad = encryptFonts({ ...approvedFonts, 'GothamBook.ttf': Buffer.from('unapproved replacement font') }, f.key);
    fs.writeFileSync(path.join(f.directory, BUNDLE_FILE), JSON.stringify(bad));
    assert.throws(() => prepareAssets(f.directory, f.key), /checksum mismatch/);
    for (const name of Object.keys(approvedFonts)) assert.ok(!fs.existsSync(path.join(f.directory, name)));
  } finally { f.cleanup(); }
});
test('only missing fonts are restored and corrupt existing artwork is rejected', () => {
  const f = fixture();
  try {
    fs.writeFileSync(path.join(f.directory, 'Gotham-Bold.otf'), approvedFonts['Gotham-Bold.otf']);
    assert.deepEqual(prepareAssets(f.directory, f.key), { restored: 1 });
    fs.writeFileSync(path.join(f.directory, 'source-artwork.json'), 'changed artwork');
    assert.throws(() => prepareAssets(f.directory, f.key), /Official asset differs/);
  } finally { f.cleanup(); }
});
test('the bundle contains no plaintext font data and malformed keys are rejected', () => {
  const f = fixture();
  try {
    const serialized = JSON.stringify(f.bundle);
    for (const bytes of Object.values(approvedFonts)) {
      assert.ok(!serialized.includes(bytes.toString()));
      assert.ok(!serialized.includes(bytes.toString('base64')));
    }
    assert.throws(() => prepareAssets(f.directory, 'not-a-valid-secret'), /64-character hexadecimal/);
  } finally { f.cleanup(); }
});
