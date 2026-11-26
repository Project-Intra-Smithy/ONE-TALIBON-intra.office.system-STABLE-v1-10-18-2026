import fs from 'node:fs';
import {spawn,execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
const receiptPath='storage/app/qa/phase-a-qualification/20d3e523abab-2026-11-26T09-01-01-787Z/results.json';
const wait=ms=>new Promise(r=>setTimeout(r,ms));const deadline=Date.now()+3600000;
let receipt;
while(true){if(fs.existsSync(receiptPath)){receipt=JSON.parse(fs.readFileSync(receiptPath));if(receipt.failures.length)throw new Error('Expanded canonical qualification has failures; inspect its raw receipt');if(receipt.completed)break;}if(Date.now()>deadline)throw new Error('Expanded qualification not complete');await wait(2000);}
assert.equal(receipt.passed,true);assert.equal(receipt.sourceWorktreeDirty,false);assert.equal(receipt.sourceSha,'20d3e523ababfef8888356c968ad8392660ad02d');await wait(1000);
const common={...process.env,PHASE_A_DISPOSABLE:'1',DB_HOST:'127.0.0.1',DB_DATABASE:'talibon_portal_test',DB_USERNAME:'postgres',DB_PASSWORD:''};
for(const key of ['PHASE_A_QUALIFICATION','PHASE_A_QUALIFICATION_FOCUS','PHASE_A_QUALIFICATION_ROLES','PHASE_A_QUALIFICATION_INTERACTIONS_ONLY'])delete common[key];
const output='storage/app/qa/followups-20d3e';fs.mkdirSync(output,{recursive:true});const results=[];
function run(label,args,env=common){return new Promise((resolve,reject)=>{const out=fs.openSync(`${output}/${label}.out.log`,'w'),err=fs.openSync(`${output}/${label}.err.log`,'w');const child=spawn(process.execPath,args,{env,stdio:['ignore',out,err],windowsHide:true});child.on('error',reject);child.on('exit',code=>{fs.closeSync(out);fs.closeSync(err);results.push({label,args,exitCode:code});fs.writeFileSync(output+'/results.json',JSON.stringify({sourceSha:receipt.sourceSha,completed:false,results},null,2));code===0?resolve():reject(new Error(label+' failed '+code));});});}
const cluster=JSON.parse(fs.readFileSync('storage/app/qa/core-runtime-cluster.json'));
await Promise.all([run('canonical-core',['storage/app/qa/canonical-final-20d-runtime.mjs'],{...common,DB_PORT:String(cluster.port),PHASE_A_DISPOSABLE_PGDATA:cluster.data}),run('accessibility',['storage/app/qa/accessibility-final-20d-runtime.mjs'],{...common,DB_PORT:'55474',PHASE_A_DISPOSABLE_PGDATA:'C:/Users/arane/AppData/Local/Temp/ot-phase-a-pg16-774e84f5f59a48298231de03299f61a1/data'}),run('homepage-auth',['--test','tests/Browser/aj-home-auth.test.mjs'],{...common,QA_OUTPUT:output+'/homepage-auth'})]);
await run('ux',['--experimental-strip-types','--test','tests/Browser/ux-refinement.test.mjs']);
assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),receipt.sourceSha);assert.equal(execFileSync('git',['status','--porcelain'],{encoding:'utf8'}).trim(),'');
const hash=(await import('node:crypto')).createHash('sha256').update(fs.readFileSync('public/build/manifest.json')).digest('hex');assert.equal(hash,receipt.buildManifestSha256);
fs.writeFileSync(output+'/results.json',JSON.stringify({sourceSha:receipt.sourceSha,completed:true,passed:results.every(r=>r.exitCode===0),buildManifestSha256:hash,results},null,2));console.log('Final core, accessibility, homepage/auth and UX checks PASS');

