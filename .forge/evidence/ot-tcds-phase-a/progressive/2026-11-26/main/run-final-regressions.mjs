import fs from 'node:fs';
import {spawnSync,execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
const sourceSha=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
assert.equal(sourceSha,'f955ef0d0636fdca4e74b06f1a9f6e19c74fb96b');
assert.equal(execFileSync('git',['status','--porcelain'],{encoding:'utf8'}).trim(),'');
const output='storage/app/qa/regressions-f955';fs.mkdirSync(output,{recursive:true});
const results=[];
for(const [label,args] of [['canonical-types',['node_modules/typescript/bin/tsc','--noEmit']],['preview-types',['node_modules/typescript/bin/tsc','--noEmit','-p','preview/tsconfig.json']],['frontend-contracts',['--experimental-strip-types','--test',...fs.readdirSync('tests/Frontend').filter(f=>f.endsWith('.test.mjs')).map(f=>'tests/Frontend/'+f)]],['modern-color-review-unit',['--test','tests/Browser/manual-contrast.test.mjs']]]){
    const run=spawnSync(process.execPath,args,{encoding:'utf8',windowsHide:true,maxBuffer:20*1024*1024});fs.writeFileSync(`${output}/${label}.log`,(run.stdout??'')+(run.stderr??''));results.push({label,command:[process.execPath,...args],exitCode:run.status,error:run.error?.message});fs.writeFileSync(output+'/results.json',JSON.stringify({sourceSha,completed:results.length===4,passed:results.every(r=>r.exitCode===0),results},null,2));assert.equal(run.status,0,label);console.log(label+' PASS');
}
