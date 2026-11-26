import fs from 'node:fs';
const base=fs.readFileSync('tests/Browser/phase-a-accessibility-runtime.mjs','utf8');
const hash="const frozen=JSON.parse((await import('node:fs')).readFileSync('storage/app/qa/phase-a-qualification/20d3e523abab-2026-11-26T09-01-01-787Z/results.json'));assert.equal(frozen.sourceSha,execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim());assert.equal(crypto.createHash('sha256').update((await import('node:fs')).readFileSync('public/build/manifest.json')).digest('hex'),frozen.buildManifestSha256);";
let runtime=base.replace("execFileSync(process.execPath, ['node_modules/vite/bin/vite.js', 'build'], { env, stdio: 'pipe' });",hash).replaceAll('8075','8077').replace("process.env.PHASE_A_QUALIFICATION === '1' ? 'tests/Browser/phase-a-qualification.mjs' : 'tests/Browser/phase-a-accessibility.mjs'","'storage/app/qa/keyboard-20d-browser.mjs'");
fs.writeFileSync('storage/app/qa/keyboard-20d-runtime.mjs',runtime);
