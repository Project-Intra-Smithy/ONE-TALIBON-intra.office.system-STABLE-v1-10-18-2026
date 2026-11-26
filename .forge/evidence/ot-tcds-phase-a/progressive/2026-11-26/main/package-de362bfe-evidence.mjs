import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';

const source=process.cwd();
const candidate='de362bfeddbb2b1ac3e738d1f99d4f64b536c90c';
const target=path.resolve('C:/dev/TAL/ot-tcds-evidence-de362bfe/.forge/evidence/ot-tcds-phase-a/published/de362bfe');
assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),candidate);
assert.equal(execFileSync('git',['status','--porcelain'],{encoding:'utf8'}).trim(),'');
const receiptPath='storage/app/qa/phase-a-canonical/results.json';
const receipt=JSON.parse(fs.readFileSync(receiptPath));
assert.equal(receipt.completed,true);
assert.equal(receipt.sourceSha,candidate);
assert.equal(receipt.sourceWorktreeDirty,false);
assert.equal(receipt.results.length,84);
assert.equal(receipt.interactions.length,66);
assert.ok(receipt.results.every(result=>result.status===200&&!result.overflow&&!result.errors.length));
const sha256=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
assert.equal(sha256(fs.readFileSync('public/build/manifest.json')),receipt.buildManifestSha256);
const captures=new Set(receipt.results.map(result=>`${result.role}-${result.path.slice(1).replaceAll('/','-')}-${result.width}-${result.theme}.png`));
for(const result of receipt.interactions)if(result.width)captures.add(`${result.role}-${result.label}-${result.width}-${result.theme}.png`);
assert.equal(captures.size,144);
fs.mkdirSync(path.join(target,'captures'),{recursive:true});
const inventory=[];
for(const name of [...captures].sort()){
    assert.match(name,/^[a-z0-9._-]+\.png$/);
    const original=path.join(source,'storage/app/qa/phase-a-canonical',name),bytes=fs.readFileSync(original);
    assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
    fs.writeFileSync(path.join(target,'captures',name),bytes);
    inventory.push({file:`captures/${name}`,bytes:bytes.length,sha256:sha256(bytes),width:bytes.readUInt32BE(16),height:bytes.readUInt32BE(20),observedModifiedAt:fs.statSync(original).mtime.toISOString()});
}
fs.copyFileSync(receiptPath,path.join(target,'canonical-runtime-results.json'));
fs.copyFileSync('public/build/manifest.json',path.join(target,'build-manifest.json'));
fs.writeFileSync(path.join(target,'interaction-results.json'),JSON.stringify(receipt.interactions,null,2)+'\n');
fs.writeFileSync(path.join(target,'capture-inventory.json'),JSON.stringify({candidate,attributionBasis:'The completed clean-worktree runtime receipt and deterministic capture names from its exact candidate test scripts; these files have not been regenerated during publication.',buildManifestSha256:receipt.buildManifestSha256,captures:inventory},null,2)+'\n');
const files=['canonical-runtime-results.json','build-manifest.json','interaction-results.json','capture-inventory.json',...inventory.map(item=>item.file)];
const checksums=files.map(file=>`${sha256(fs.readFileSync(path.join(target,file)))}  ${file}`).join('\n')+'\n';
fs.writeFileSync(path.join(target,'SHA256SUMS'),checksums);
for(const line of checksums.trim().split('\n')){const [digest,file]=line.split('  ');assert.equal(sha256(fs.readFileSync(path.join(target,file))),digest);}
console.log(JSON.stringify({candidate,routes:receipt.results.length,interactions:receipt.interactions.length,captures:inventory.length,captureBytes:inventory.reduce((sum,item)=>sum+item.bytes,0),buildManifestSha256:receipt.buildManifestSha256,inventorySha256:sha256(fs.readFileSync(path.join(target,'capture-inventory.json'))),checksumsSha256:sha256(checksums),target}));
