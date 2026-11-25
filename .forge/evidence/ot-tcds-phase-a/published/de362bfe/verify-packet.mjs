import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=path.dirname(fileURLToPath(import.meta.url));
const read=file=>readFileSync(path.join(root,file));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const sums=read('SHA256SUMS').toString().trim().split('\n');
for(const line of sums){const [digest,file]=line.split('  ');assert.match(digest,/^[0-9a-f]{64}$/);assert.ok(file&&!path.isAbsolute(file)&&!file.split('/').includes('..'));assert.equal(sha(read(file)),digest,file);}
const receipt=JSON.parse(read('canonical-runtime-results.json'));
const inventory=JSON.parse(read('capture-inventory.json'));
assert.equal(receipt.sourceSha,'de362bfeddbb2b1ac3e738d1f99d4f64b536c90c');
assert.equal(receipt.completed,true);assert.equal(receipt.sourceWorktreeDirty,false);
assert.equal(receipt.results.length,84);assert.equal(receipt.interactions.length,66);
assert.equal(inventory.captures.length,144);assert.equal(sums.length,148);
assert.equal(sha(read('build-manifest.json')),receipt.buildManifestSha256);
assert.deepEqual(JSON.parse(read('interaction-results.json')),receipt.interactions);
for(const item of inventory.captures){assert.equal(sha(read(item.file)),item.sha256,item.file);assert.equal(read(item.file).length,item.bytes);}
console.log(JSON.stringify({candidate:receipt.sourceSha,verifiedFiles:sums.length,captures:inventory.captures.length,buildManifestSha256:receipt.buildManifestSha256,result:'PASS'}));
