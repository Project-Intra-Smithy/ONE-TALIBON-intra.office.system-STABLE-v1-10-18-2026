/** Actual canonical reference workspaces; no operational backend capability is enabled. */
import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {chromium} from 'playwright';
import {contrastReview} from './phase-a-manual-review.mjs';

const origin=process.env.PHASE_A_CANONICAL_URL;assert.match(origin,/^http:\/\/127\.0\.0\.1:\d+$/);
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
const sourceSha=git('rev-parse','HEAD');assert.equal(git('status','--porcelain'),'','Freeze the executable source first');
const output=`storage/app/qa/municipal-interactions/${sourceSha.slice(0,12)}-${Date.now()}`;
fs.mkdirSync(output,{recursive:true});const manifest=fs.readFileSync('public/build/manifest.json');fs.writeFileSync(output+'/build-manifest.json',manifest);
const axe=fs.readFileSync('storage/app/qa/a11y-tools/node_modules/axe-core/axe.min.js','utf8');
const observations=[],interactions=[],focus=[],navigationFocus=[],errors=[],writes=[];let completed=false,http=null;
const browser=await chromium.launch(),page=await browser.newPage({viewport:{width:320,height:900}});
page.on('pageerror',error=>errors.push(error.message));
const widths=[320,768,1440];
const failed=()=>errors.length||writes.some(r=>!r.existingPresenceHeartbeat)||observations.some(o=>o.overflow||o.violations.length||o.manualReview.some(p=>!p.disabled&&p.contrastRatio!==null&&p.contrastRatio<p.requiredContrast))||focus.some(f=>!f.insideDialog);
function save(){fs.writeFileSync(output+'/results.json',JSON.stringify({sourceSha,sourceWorktreeDirty:Boolean(git('status','--porcelain'))||git('rev-parse','HEAD')!==sourceSha,completed,passed:completed&&!failed(),scope:{widths,themes:['light','dark'],futureSystems:14,referenceViewTabs:52},buildManifestSha256:crypto.createHash('sha256').update(manifest).digest('hex'),observations,interactions,focus,navigationFocus,errors,writes},null,2));}
async function navigate(route){const response=await page.goto(origin+route);assert.equal(response.status(),200);await page.getByRole('main').first().waitFor();http={url:response.url(),status:response.status()};}
async function focusView(control,context){
    await control.focus();await page.waitForFunction(()=>{const n=document.activeElement,nav=n.closest('nav,[role=tablist]');if(!nav)return false;const r=n.getBoundingClientRect(),b=nav.getBoundingClientRect();return r.left>=Math.max(0,b.left)-1&&r.right<=Math.min(innerWidth,b.right)+1;},null,{timeout:1000});
    navigationFocus.push({...context,...await control.evaluate(node=>{const r=node.getBoundingClientRect();return {name:node.textContent.trim(),x:r.x,right:r.right,width:r.width};})});
}
async function inspect(label,selection=null){
    await page.evaluate(()=>document.fonts.ready);await page.evaluate(axe);
    const audit=await page.evaluate(async()=>window.axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}}));
    const renderedComponent=await page.evaluate(()=>JSON.parse(document.querySelector('script[data-page]')?.textContent||document.querySelector('#app').getAttribute('data-page')).component);
    const width=page.viewportSize().width,capture=`${width}-${label}.png`;
    await page.screenshot({path:output+'/'+capture,fullPage:true});
    observations.push({label,selection,role:'employee',route:new URL(page.url()).pathname,status:http.status,http,width,renderedComponent,headings:await page.getByRole('main').locator('h1').allTextContents(),capture,overflow:await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),violations:audit.violations,incomplete:audit.incomplete,manualReview:await contrastReview(page,audit)});save();
}
try{
    await page.goto(origin+'/login');await page.getByLabel('Username or email').fill(process.env.PHASE_A_CANONICAL_LOGIN);await page.getByLabel('Password',{exact:true}).fill(process.env.PHASE_A_CANONICAL_PASSWORD);await page.getByRole('button',{name:'Sign in',exact:true}).click();await page.waitForURL('**/dashboard');
    page.on('request',request=>{if(!['GET','HEAD','OPTIONS'].includes(request.method()))writes.push({method:request.method(),url:request.url(),existingPresenceHeartbeat:request.method()==='POST'&&request.url()===origin+'/employees/presence'});});
    for(const width of widths){
        await page.setViewportSize({width,height:900});
        for(const theme of ['light','dark']){
            await page.emulateMedia({colorScheme:theme});await navigate('/procurement');
            const views=page.getByRole('tablist',{name:'Procurement views'}).getByRole('tab');assert.equal(await views.count(),4);
            for(let index=0;index<4;index++){await focusView(views.nth(index),{width,theme,system:'PROCUREMENT'});await views.nth(index).click();await inspect(`procurement-view-${index}-${theme}`);if(index===1){const record=page.getByRole('button',{name:/^Inspect purchase request /}).first();await record.focus();await page.keyboard.press('Enter');await page.getByRole('dialog').waitFor();await page.keyboard.press('Escape');await page.getByRole('dialog').waitFor({state:'hidden'});assert.ok(await record.evaluate(node=>node===document.activeElement));interactions.push({label:'municipal-purchase-register-keyboard-inspection',renderedComponent:'MunicipalSystems/Index',width,theme,triggerRestored:true});}}
            await views.first().click();const trigger=page.getByRole('button').filter({hasText:'PR-2026-014'}).first();await trigger.click();await page.getByRole('dialog').waitFor();
            for(const direction of ['Tab','Shift+Tab'])for(let step=0;step<18;step++){
                await page.keyboard.press(direction);
                focus.push({width,theme,direction,step,...await page.evaluate(()=>{const n=document.activeElement,r=n.getClientRects()[0]??n.getBoundingClientRect();return {insideDialog:Boolean(n.closest('dialog:modal')),name:n.tagName==='BODY'?'Document':n.getAttribute('aria-label')||n.textContent?.trim().slice(0,80),outline:getComputedStyle(n).outline,rect:{x:r.x,y:r.y,width:r.width,height:r.height}};})});
            }
            for(const tab of ['Summary','Activity','Documents']){await page.getByRole('dialog').getByRole('tab',{name:new RegExp(tab+'$')}).click();await inspect(`procurement-${tab}-${theme}`);}
            await page.getByRole('dialog').getByRole('button',{name:'Close',exact:true}).hover();await inspect(`procurement-close-hover-${theme}`);await page.keyboard.press('Escape');await page.getByRole('dialog').waitFor({state:'hidden'});assert.ok(await trigger.evaluate(node=>node===document.activeElement));
            interactions.push({label:'municipal-procurement-drawer-keyboard-escape-return',renderedComponent:'MunicipalSystems/Index',width,theme,focusContained:true,triggerRestored:true});
        }
        await navigate('/municipal-systems');const catalog=page.getByRole('button',{name:/^Open preview for /});await catalog.first().waitFor();
        const systems=await catalog.evaluateAll(nodes=>nodes.map(node=>({name:node.getAttribute('aria-label'),id:node.title.split(' · ')[0]})));
        assert.deepEqual(systems.map(s=>s.id),Array.from({length:14},(_,index)=>`FUT-${String(index+2).padStart(2,'0')}`));
        for(const theme of ['light','dark'])for(const system of systems){
            await page.emulateMedia({colorScheme:theme});await navigate('/municipal-systems');await page.getByRole('button',{name:system.name,exact:true}).click();await page.waitForFunction(()=>!document.querySelector('button[aria-label^="Open preview for "]'));
            await inspect(`${system.id}-overview-${theme}`,system);
            let navigation=page.locator('main [role=tablist]').first();if(!await navigation.count())navigation=page.locator('main nav').first();
            const count=await navigation.count()?await navigation.locator('button').count():0;assert.equal(count,system.id==='FUT-03'?0:4,system.name+' view coverage');
            for(let index=0;index<count;index++){const control=navigation.locator('button').nth(index),name=await control.innerText();await focusView(control,{width,theme,system:system.id});await control.click();await inspect(`${system.id}-view-${index}-${theme}`,{...system,view:name});}
            interactions.push({label:'municipal-reference-views',renderedComponent:'MunicipalSystems/Index',width,theme,system:system.id,name:system.name,viewCount:count});
        }
    }
    assert.equal(observations.length,444);assert.equal(focus.length,216);assert.equal(navigationFocus.length,336);assert.equal(interactions.length,96);assert.equal(git('rev-parse','HEAD'),sourceSha);assert.equal(git('status','--porcelain'),'');completed=true;save();assert.equal(Boolean(failed()),false,'Inspect original municipal failures');
}finally{save();await browser.close();console.log(output);}
