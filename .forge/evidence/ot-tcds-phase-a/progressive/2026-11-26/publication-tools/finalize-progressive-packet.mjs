import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
const root='C:/dev/TAL/ot-tcds-progressive-custody/.forge/evidence/ot-tcds-phase-a/progressive/2026-11-26';
const inv=JSON.parse(fs.readFileSync(root+'/artifact-inventory.json'));
for(const f of inv.files.filter(f=>f.file.endsWith('.png'))){const fd=fs.openSync(root+'/'+f.file,'r'),header=Buffer.alloc(24);fs.readSync(fd,header,0,24,0);fs.closeSync(fd);if(header.subarray(0,8).toString('hex')!=='89504e470d0a1a0a')throw Error(f.file);f.width=header.readUInt32BE(16);f.height=header.readUInt32BE(20);}
fs.writeFileSync(root+'/artifact-inventory.json',JSON.stringify(inv,null,2));
const files=[];function walk(dir){for(const d of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,d.name);if(d.isDirectory())walk(p);else if(d.name!=='SHA256SUMS')files.push(path.relative(root,p).replaceAll('\\','/'));}}walk(root);
fs.writeFileSync(root+'/SHA256SUMS',files.sort().map(f=>crypto.createHash('sha256').update(fs.readFileSync(root+'/'+f)).digest('hex')+'  '+f).join('\n')+'\n');
console.log(JSON.stringify({files:files.length,captures:inv.files.filter(f=>f.file.endsWith('.png')).length,bytes:inv.files.reduce((n,f)=>n+f.bytes,0)}));
