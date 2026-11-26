import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const repo='Project-Intra-Smithy/ONE-TALIBON-intra.office.system-STABLE-v1-10-18-2026',commit='1c590bd328c3cb7aabc2a3e5697bfab17acefb7b';
const api=p=>JSON.parse(execFileSync('gh',['api',`repos/${repo}/${p}`],{encoding:'utf8',maxBuffer:20*1024*1024}));
const tree=api(`git/trees/${commit}?recursive=1`);assert.equal(tree.truncated,false);
const prefix='.forge/evidence/ot-tcds-phase-a/published/efbf3b79/';
const images=tree.tree.filter(e=>e.path.startsWith(prefix)&&e.path.endsWith('.png'));assert.equal(images.length,246);
const digest=b=>crypto.createHash('sha256').update(b).digest('hex');
for(const file of ['build-manifest.json','SHA256SUMS','canonical-runtime-results.json','accessibility-results.json']){const entry=tree.tree.find(e=>e.path===prefix+file);assert.ok(entry);const blob=api('git/blobs/'+entry.sha);assert.equal(blob.encoding,'base64');assert.equal(digest(Buffer.from(blob.content,'base64')),digest(fs.readFileSync('C:/dev/TAL/ot-tcds-evidence-efbf3b79/'+prefix+file)));}
const branch=api('git/ref/heads/evidence/ot-tcds-phase-a-efbf3b79-local-validation');assert.equal(branch.object.sha,commit);
const custody=api('git/ref/heads/custody/ot-tcds-phase-a-accessibility-r1');assert.equal(custody.object.sha,'efbf3b795cf2a49908adbb8781b72610c3ecf6bc');
const runs=api('actions/runs?branch=evidence%2Fot-tcds-phase-a-efbf3b79-local-validation&per_page=5');assert.equal(runs.total_count,0);
console.log(JSON.stringify({publication:commit,custody:custody.object.sha,remoteCaptures:images.length,remoteMetadataHashes:'PASS',evidenceBranchWorkflowRuns:runs.total_count}));
