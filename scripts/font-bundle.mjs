import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { gzipSync, gunzipSync } from 'node:zlib';

export const FONT_FILES = Object.freeze(['Gotham-Bold.otf', 'GothamBook.ttf', 'KULDIPA2.TTF', 'GeneralSans-Semibold.otf', 'GeneralSans-Regular.otf']);
export const FONT_KEY_ENV = 'GULBAHAR_FONT_KEY';
export const BUNDLE_FILE = 'gotham-fonts.enc.json';
const AAD = Buffer.from('gulbahar-business-card-fonts:v1');
const MAX_BUNDLE_BYTES = 512 * 1024;

function parseKey(value) {
  if (typeof value !== 'string' || !/^[a-f0-9]{64}$/i.test(value.trim())) {
    throw new Error(`${FONT_KEY_ENV} must be a 64-character hexadecimal secret. Never use a NEXT_PUBLIC_ variable for this key.`);
  }
  return Buffer.from(value.trim(), 'hex');
}

export function hashAsset(bytes) {
  return crypto.createHash('sha256').update(bytes).digest('hex');
}

export function encryptFonts(fonts, keyValue) {
  const payload = Object.fromEntries(FONT_FILES.map(name => {
    if (!Buffer.isBuffer(fonts[name])) throw new Error(`Missing official font: ${name}`);
    return [name, fonts[name].toString('base64')];
  }));
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', parseKey(keyValue), iv);
  cipher.setAAD(AAD);
  const ciphertext = Buffer.concat([cipher.update(gzipSync(JSON.stringify(payload))), cipher.final()]);
  return {
    format: 'gulbahar-font-bundle', version: 1, algorithm: 'aes-256-gcm',
    iv: iv.toString('base64'), tag: cipher.getAuthTag().toString('base64'),
    ciphertext: ciphertext.toString('base64'),
  };
}

export function decryptFonts(bundle, keyValue, manifest) {
  const key = parseKey(keyValue);
  let fonts;
  try {
    if (bundle?.format !== 'gulbahar-font-bundle' || bundle.version !== 1 || bundle.algorithm !== 'aes-256-gcm') {
      throw new Error('Unsupported font bundle.');
    }
    const iv = Buffer.from(bundle.iv, 'base64');
    const tag = Buffer.from(bundle.tag, 'base64');
    const ciphertext = Buffer.from(bundle.ciphertext, 'base64');
    if (iv.length !== 12 || tag.length !== 16 || ciphertext.length > MAX_BUNDLE_BYTES) throw new Error('Invalid font bundle.');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAAD(AAD);
    decipher.setAuthTag(tag);
    const bytes = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    fonts = JSON.parse(gunzipSync(bytes, { maxOutputLength: MAX_BUNDLE_BYTES }).toString('utf8'));
  } catch {
    throw new Error(`Cannot unlock the official font bundle. Check the ${FONT_KEY_ENV} secret and use the matching approved bundle.`);
  }
  const verified = {};
  for (const name of FONT_FILES) {
    if (typeof fonts[name] !== 'string') throw new Error(`The approved font bundle is missing ${name}.`);
    const bytes = Buffer.from(fonts[name], 'base64');
    if (!manifest[name] || hashAsset(bytes) !== manifest[name]) {
      throw new Error(`Official font checksum mismatch: ${name}. No font files have been installed.`);
    }
    verified[name] = bytes;
  }
  return verified;
}

/** Restore missing fonts only after authenticating and verifying the complete bundle. */
export function prepareAssets(directory, keyValue) {
  const manifest = JSON.parse(fs.readFileSync(path.join(directory, 'manifest.json'), 'utf8'));
  const missing = [];
  for (const [name, expected] of Object.entries(manifest)) {
    const file = path.join(directory, name);
    if (!fs.existsSync(file)) {
      if (!FONT_FILES.includes(name)) throw new Error(`Missing official artwork: ${name}. Restore it from the approved repository.`);
      missing.push(name);
    } else if (hashAsset(fs.readFileSync(file)) !== expected) {
      throw new Error(`Official asset differs from the approved source: ${name}. Review it before replacing its integrity manifest.`);
    }
  }
  if (!missing.length) return { restored: 0 };
  if (!keyValue) {
    throw new Error(`Missing official company fonts. In Vercel, add ${FONT_KEY_ENV} as a Secret for the deployment environment, then redeploy. For local use, run npm run install:assets -- /path/to/B-Card-Assets. See docs/DEPLOYMENT.md.`);
  }
  const bundlePath = path.join(directory, BUNDLE_FILE);
  if (!fs.existsSync(bundlePath)) throw new Error('The encrypted official font bundle is missing. Restore it from the approved repository.');
  if (fs.statSync(bundlePath).size > MAX_BUNDLE_BYTES) throw new Error('The encrypted font bundle exceeds its size limit.');
  const fonts = decryptFonts(JSON.parse(fs.readFileSync(bundlePath, 'utf8')), keyValue, manifest);
  for (const name of missing) fs.writeFileSync(path.join(directory, name), fonts[name], { mode: 0o600 });
  return { restored: missing.length };
}
