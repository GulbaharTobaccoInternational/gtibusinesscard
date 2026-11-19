import fs from 'node:fs';
import path from 'node:path';
import { FONT_KEY_ENV, prepareAssets } from './font-bundle.mjs';

// Node's prebuild scripts run before Next.js loads .env files.
// This administrator-only file is ignored by both Git and Vercel uploads.
const localSecret = path.resolve('.env.fonts.local');
if (!process.env[FONT_KEY_ENV] && fs.existsSync(localSecret)) process.loadEnvFile(localSecret);
const { restored } = prepareAssets(path.resolve('private/assets'), process.env[FONT_KEY_ENV]);
if (restored) console.log(`Restored ${restored} official Gotham fonts from the encrypted build bundle.`);
console.log('Official artwork and both Gotham fonts match the approved asset manifest.');
