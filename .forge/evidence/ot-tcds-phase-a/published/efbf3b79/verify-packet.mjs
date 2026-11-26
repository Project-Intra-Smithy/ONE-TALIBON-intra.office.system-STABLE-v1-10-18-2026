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
const core=JSON.parse(read('canonical-runtime-results.json')),audit=JSON.parse(read('accessibility-results.json')),inventory=JSON.parse(read('capture-inventory.json'));
for(const receipt of [core,audit]){assert.equal(receipt.sourceSha,'efbf3b795cf2a49908adbb8781b72610c3ecf6bc');assert.equal(receipt.completed,true);assert.equal(receipt.sourceWorktreeDirty,false);assert.equal(receipt.buildManifestSha256,sha(read('build-manifest.json')));}
assert.equal(core.results.length,84);assert.equal(core.interactions.length,66);assert.equal(audit.observations.length,102);assert.equal(audit.passed,true);
assert.ok(core.results.every(r=>r.status===200&&!r.overflow&&!r.errors.length));assert.ok(audit.observations.every(r=>!r.overflow&&!r.violations.length));
assert.equal(inventory.captures.length,246);assert.equal(sums.length,259);
assert.deepEqual(JSON.parse(read('interaction-results.json')),core.interactions);
for(const item of inventory.captures){const bytes=read(item.file);assert.equal(sha(bytes),item.sha256);assert.equal(bytes.length,item.bytes);assert.equal(bytes.readUInt32BE(16),item.width);assert.equal(bytes.readUInt32BE(20),item.height);}
console.log(JSON.stringify({candidate:core.sourceSha,verifiedFiles:sums.length,captures:inventory.captures.length,buildManifestSha256:core.buildManifestSha256,result:'PASS'}));
