import fs from 'node:fs';
import {spawn,execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
const sha='69644e2069ad5b8f4df51b959cf3e11c8451f577',root='storage/app/qa/phase-a-qualification';
assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),sha);
const deadline=Date.now()+600000;let folder;
while(!folder){folder=fs.readdirSync(root).filter(x=>x.startsWith(sha.slice(0,12)+'-')).sort().at(-1);if(Date.now()>deadline)throw Error('Qualification startup did not produce receipt directory');if(!folder)await new Promise(r=>setTimeout(r,2000));}
const receipt=root+'/'+folder+'/results.json',old='storage/app/qa/phase-a-qualification/2b096d74cabe-2026-11-26T07-40-00-670Z/results.json';
let prep=fs.readFileSync('storage/app/qa/prepare-final-followups.mjs','utf8').replaceAll(old,receipt).replaceAll('final-2b','final-696').replaceAll('canonical-2b096','canonical-69644');fs.writeFileSync('storage/app/qa/prepare-final-followups-696.mjs',prep);
execFileSync(process.execPath,['storage/app/qa/prepare-final-followups-696.mjs'],{stdio:'inherit'});
let follow=fs.readFileSync('storage/app/qa/run-final-followups.mjs','utf8').replaceAll(old,receipt).replaceAll('2b096d74cabe3c0da6fc171dc052917f9e72210f',sha).replaceAll('final-2b','final-696').replaceAll('followups-2b096','followups-69644').replace('Date.now()+3600000','Date.now()+7200000');fs.writeFileSync('storage/app/qa/run-final-followups-696.mjs',follow);
await new Promise((resolve,reject)=>{const child=spawn(process.execPath,['storage/app/qa/run-final-followups-696.mjs'],{stdio:'inherit',windowsHide:true});child.on('error',reject);child.on('exit',code=>code===0?resolve():reject(Error('Follow-up checks failed '+code)));});
