/** Actual disposable Laravel regression for demonstrated focus, naming and contrast defects. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {chromium} from 'playwright';
import {contrastReview} from './phase-a-manual-review.mjs';
import {gradientCaptionReview} from './phase-a-gradient-caption.mjs';
const origin=process.env.PHASE_A_CANONICAL_URL;assert.match(origin,/^http:\/\/127\.0\.0\.1:\d+$/);
const sourceSha=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
assert.equal(execFileSync('git',['status','--porcelain'],{encoding:'utf8'}).trim(),'','Freeze the source before this regression');
const output=`storage/app/qa/focus-and-semantics/${sourceSha.slice(0,12)}-${Date.now()}`;fs.mkdirSync(output,{recursive:true});
const manifest=fs.readFileSync('public/build/manifest.json');fs.writeFileSync(output+'/build-manifest.json',manifest);
const axe=fs.readFileSync(process.env.PHASE_A_AXE_SOURCE||'storage/app/qa/a11y-tools/node_modules/axe-core/axe.min.js','utf8');
const browser=await chromium.launch(),page=await browser.newPage({viewport:{width:320,height:900}}),observations=[],focus=[];let completed=false;
try{
await page.goto(origin+'/login');await page.getByLabel('Username or email').fill(process.env.PHASE_A_CANONICAL_LOGIN);await page.getByLabel('Password',{exact:true}).fill(process.env.PHASE_A_CANONICAL_PASSWORD);await page.getByRole('button',{name:'Sign in',exact:true}).click();await page.waitForURL('**/dashboard');
for(const theme of ['light','dark'])for(const route of ['/transactions','/departments','/legislation','/municipal-systems']){
await page.emulateMedia({colorScheme:theme});const response=await page.goto(origin+route);assert.equal(response.status(),200);await page.getByRole('main').first().waitFor();await page.evaluate(()=>document.fonts.ready);await page.evaluate(axe);
const audit=await page.evaluate(async()=>window.axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}}));
observations.push({route,theme,status:response.status(),violations:audit.violations,incomplete:audit.incomplete});
assert.equal(audit.violations.length,0,route);assert.equal(audit.incomplete.filter(x=>x.id==='aria-prohibited-attr').length,0,route+' unresolved naming semantics');
if(route==='/municipal-systems'){
await page.getByText('Current rollout, future municipal workspaces and reusable platform foundations.',{exact:true}).evaluate(node=>node.id='qa-rollout-caption');
const contrast=await contrastReview(page,{incomplete:[{id:'color-contrast',nodes:[{target:['#qa-rollout-caption']}]}]});observations.at(-1).captionContrast=contrast;const gradient=await gradientCaptionReview(page);const swatch=`caption-gradient-${theme}.png`;fs.writeFileSync(output+'/'+swatch,Buffer.from(gradient.captureBase64,'base64'));delete gradient.captureBase64;observations.at(-1).captionGradientBound={...gradient,capture:swatch};assert.ok(gradient.minimumContrast>=gradient.requiredContrast);
}
if(route==='/transactions'){
const buttons=page.getByRole('navigation',{name:'Work Request queues',exact:true}).getByRole('button');await buttons.first().focus();
for(let i=0;i<await buttons.count();i++){
await page.waitForFunction(()=>{const n=document.activeElement,r=n.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth;},null,{timeout:1000});
const record=await page.evaluate(()=>{const n=document.activeElement,r=n.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return {name:n.textContent.trim(),x:r.x,right:r.right,unobscured:hit===n||n.contains(hit)};});focus.push({theme,...record});assert.ok(record.unobscured);await page.keyboard.press('Tab');
}
}
await page.screenshot({path:`${output}/${route.slice(1)}-320-${theme}.png`,fullPage:true});
}
assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),sourceSha);assert.equal(execFileSync('git',['status','--porcelain'],{encoding:'utf8'}).trim(),'');completed=true;
}finally{
await browser.close();fs.writeFileSync(output+'/results.json',JSON.stringify({sourceSha,sourceWorktreeDirty:Boolean(execFileSync('git',['status','--porcelain'],{encoding:'utf8'}).trim()),completed,passed:completed,buildManifestSha256:crypto.createHash('sha256').update(manifest).digest('hex'),observations,focus},null,2));console.log(output);
}
