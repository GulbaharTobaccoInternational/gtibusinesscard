import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const root=path.resolve('private/assets');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.json'),'utf8'));
for(const [name,expected] of Object.entries(manifest)){
  const file=path.join(root,name);
  if(!fs.existsSync(file))throw new Error(`Missing licensed asset: ${name}. Run npm run install:assets -- /path/to/B-Card-Assets`);
  const actual=crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
  if(actual!==expected)throw new Error(`Official asset differs from the approved source: ${name}. Review and regenerate the design specification before updating its manifest.`);
}
console.log('Official artwork and both Gotham fonts match the approved asset manifest.');
