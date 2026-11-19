import fs from 'node:fs';
import path from 'node:path';
import { FONT_FILES, hashAsset } from './font-bundle.mjs';
const roots=(process.argv.length>2?process.argv.slice(2):['..','.tools/references/double-leaf/B Card Assets - Double Leaf']).map(p=>path.resolve(p));
const destination=path.resolve('private/assets');
const manifest=JSON.parse(fs.readFileSync(path.join(destination,'manifest.json'),'utf8'));
fs.mkdirSync(destination,{recursive:true});
for(const name of FONT_FILES){
  const candidate=roots.flatMap(root=>[path.join(root,'B Card Fonts',name),path.join(root,'Fonts',name),path.join(root,name)]).find(file=>fs.existsSync(file));
  if(candidate){if(hashAsset(fs.readFileSync(candidate))!==manifest[name])throw new Error(`Unapproved font checksum: ${name}`);fs.copyFileSync(candidate,path.join(destination,name));}
  else if(!fs.existsSync(path.join(destination,name)))throw new Error(`Cannot find ${name}. Pass both companies' original asset directories, or use the private encrypted build bundle.`);
}
await import('./check-assets.mjs');
