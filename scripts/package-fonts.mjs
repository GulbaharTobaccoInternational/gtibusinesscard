import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { FONT_FILES, FONT_KEY_ENV, BUNDLE_FILE, encryptFonts, hashAsset } from './font-bundle.mjs';

const directory = path.resolve('private/assets');
const secretPath = path.resolve('.env.fonts.local');
if (!process.env[FONT_KEY_ENV] && fs.existsSync(secretPath)) process.loadEnvFile(secretPath);
const key = process.env[FONT_KEY_ENV] || crypto.randomBytes(32).toString('hex');
const manifest = JSON.parse(fs.readFileSync(path.join(directory, 'manifest.json'), 'utf8'));
const fonts = Object.fromEntries(FONT_FILES.map(name => {
  const bytes = fs.readFileSync(path.join(directory, name));
  if (hashAsset(bytes) !== manifest[name]) throw new Error(`Cannot package an unapproved font: ${name}`);
  return [name, bytes];
}));
const bundle = encryptFonts(fonts, key);
fs.writeFileSync(path.join(directory, BUNDLE_FILE), JSON.stringify(bundle) + '\n');
if (!fs.existsSync(secretPath) && !process.env[FONT_KEY_ENV]) {
  fs.writeFileSync(secretPath, `${FONT_KEY_ENV}=${key}\n`, { mode: 0o600, flag: 'wx' });
}
console.log(`Packaged both official fonts in private/assets/${BUNDLE_FILE}.`);
console.log('The key is kept in the existing environment or the ignored .env.fonts.local file. It has not been printed.');
