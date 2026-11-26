import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const inventory=JSON.parse(fs.readFileSync('artifact-inventory.json'));
for(const row of inventory.files){const bytes=fs.readFileSync(row.file);assert.equal(bytes.length,row.bytes,row.file);assert.equal(hash(bytes),row.sha256,row.file);if(row.file.endsWith('.png')){assert.equal(bytes.readUInt32BE(16),row.width);assert.equal(bytes.readUInt32BE(20),row.height);}}
for(const line of fs.readFileSync('SHA256SUMS','utf8').trim().split('\n')){const [digest,file]=line.split('  ');assert.equal(hash(fs.readFileSync(file)),digest,file);}
console.log(JSON.stringify({verifiedArtifacts:inventory.files.length,captures:inventory.files.filter(f=>f.file.endsWith('.png')).length,bytes:inventory.files.reduce((sum,f)=>sum+f.bytes,0),note:'Integrity verification only; incomplete or failed runs remain incomplete or failed.'}));
