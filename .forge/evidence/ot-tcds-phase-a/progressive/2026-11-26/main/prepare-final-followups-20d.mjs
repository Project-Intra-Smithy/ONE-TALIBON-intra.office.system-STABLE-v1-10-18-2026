import fs from 'node:fs';
import assert from 'node:assert/strict';
const receipt='storage/app/qa/phase-a-qualification/20d3e523abab-2026-11-26T09-01-01-787Z/results.json';
const reuse=`const frozen=JSON.parse((await import('node:fs')).readFileSync('${receipt}'));assert.equal(frozen.completed,true);assert.equal(frozen.passed,true);assert.equal(frozen.sourceWorktreeDirty,false);assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),frozen.sourceSha);assert.equal(crypto.createHash('sha256').update((await import('node:fs')).readFileSync('public/build/manifest.json')).digest('hex'),frozen.buildManifestSha256);`;
function substitute(source,from,to){assert.ok(source.includes(from),from);return source.replace(from,to);}
let core=fs.readFileSync('tests/Browser/phase-a-canonical-runtime.mjs','utf8');
core=substitute(core,"execFileSync(process.execPath, ['node_modules/vite/bin/vite.js', 'build'], { env, stdio: 'pipe' });",reuse);
core=core.replaceAll('8075','8076');
core=substitute(core,"['tests/Browser/phase-a-canonical.mjs']","['storage/app/qa/canonical-final-20d-browser.mjs']");
core=substitute(core,"['-S',","['-d','max_execution_time=120','-S',");
core=substitute(core,'let ready = false;','let ready = false;const deadline=Date.now()+180000;');
core=substitute(core,'attempt < 40;','attempt < 120 && Date.now()<deadline;');
core=substitute(core,'await fetch(`${env.APP_URL}/login`)','await fetch(`${env.APP_URL}/login`,{signal:AbortSignal.timeout(5000)})');
fs.writeFileSync('storage/app/qa/canonical-final-20d-runtime.mjs',core);
let browser=fs.readFileSync('tests/Browser/phase-a-canonical.mjs','utf8').replaceAll('storage/app/qa/phase-a-canonical','storage/app/qa/phase-a-canonical-20d3e');
browser=substitute(browser,"from './phase-a-planning-crud.mjs'","from '../../../tests/Browser/phase-a-planning-crud.mjs'");
fs.writeFileSync('storage/app/qa/canonical-final-20d-browser.mjs',browser);
let axe=fs.readFileSync('tests/Browser/phase-a-accessibility-runtime.mjs','utf8');
axe=substitute(axe,"execFileSync(process.execPath, ['node_modules/vite/bin/vite.js', 'build'], { env, stdio: 'pipe' });",reuse);
fs.writeFileSync('storage/app/qa/accessibility-final-20d-runtime.mjs',axe);
console.log('Prepared local port/output isolation and exact-build reuse drivers; canonical test assertions retained.');

