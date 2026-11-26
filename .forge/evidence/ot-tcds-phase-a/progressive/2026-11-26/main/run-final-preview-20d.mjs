import {setTimeout as delay} from 'node:timers/promises';
const previous='storage/app/qa/preview-f955/results.json';
const deadline=Date.now()+1800000;
while(true){const report=JSON.parse((await import('node:fs')).readFileSync(previous));if(report.results.some(item=>item.exitCode!==0))throw new Error('Prior preview suite failed; inspect its raw receipt');if(report.completed)break;if(Date.now()>deadline)throw new Error('Prior preview suite did not finish');await delay(2000);}
await delay(1000);
import fs from 'node:fs';
import {spawn,spawnSync,execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
const sourceSha=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();assert.equal(sourceSha,'20d3e523ababfef8888356c968ad8392660ad02d');
const output='storage/app/qa/preview-20d3e';fs.mkdirSync(output,{recursive:true});
const env={...process.env,PHASE_A_EVIDENCE_ROOT:output};const results=[];
function run(label,args){const child=spawnSync(process.execPath,args,{env,encoding:'utf8',windowsHide:true,maxBuffer:20*1024*1024});fs.writeFileSync(`${output}/${label}.log`,(child.stdout??'')+(child.stderr??''));results.push({label,args,exitCode:child.status,error:child.error?.message});save(false);assert.equal(child.status,0,label);console.log(label+' PASS');}
function save(completed){fs.writeFileSync(output+'/results.json',JSON.stringify({sourceSha,sourceWorktreeDirty:Boolean(execFileSync('git',['status','--porcelain'],{encoding:'utf8'}).trim()),completed,passed:completed&&results.every(r=>r.exitCode===0),results},null,2));}
run('preview-build',['node_modules/vite/bin/vite.js','build','--config','preview/vite.config.ts']);
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--config','preview/vite.config.ts'],{env,stdio:'ignore',windowsHide:true});
try{let ready=false;for(let i=0;i<60;i++){try{const response=await fetch('http://127.0.0.1:4174/',{signal:AbortSignal.timeout(3000)});if(response.ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,250));}assert.ok(ready);
for(const suite of ['preview','interactions','studios','tasks','blocked-writes'])run(suite,[`tests/Browser/phase-a-${suite}.mjs`]);
run('catalog-matrix',['tests/Browser/phase-a-catalog.mjs','--matrix']);
const assets=fs.readdirSync('preview-dist/assets').filter(f=>/\.(?:css|js)$/.test(f)).sort().map(file=>({file,sha256:crypto.createHash('sha256').update(fs.readFileSync('preview-dist/assets/'+file)).digest('hex')}));fs.writeFileSync(output+'/build-assets.json',JSON.stringify({sourceSha,assets},null,2));save(true);
}finally{server.kill();}

