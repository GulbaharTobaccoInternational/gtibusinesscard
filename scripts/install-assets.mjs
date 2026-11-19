import fs from 'node:fs';
import path from 'node:path';
const source=path.resolve(process.argv[2]??'..');
const destination=path.resolve('private/assets');
fs.mkdirSync(destination,{recursive:true});
for(const name of ['Gotham-Bold.otf','GothamBook.ttf']){
  const candidate=[path.join(source,'B Card Fonts',name),path.join(source,'Fonts',name),path.join(source,name)].find(file=>fs.existsSync(file));
  if(!candidate)throw new Error(`Cannot find ${name} in ${source}. See README asset installation instructions.`);
  fs.copyFileSync(candidate,path.join(destination,name));
}
await import('./check-assets.mjs');
