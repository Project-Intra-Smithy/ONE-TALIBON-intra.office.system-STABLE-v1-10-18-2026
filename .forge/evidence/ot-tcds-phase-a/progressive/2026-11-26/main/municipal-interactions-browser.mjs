import fs from 'node:fs';import assert from 'node:assert/strict';import {chromium} from 'playwright';import {execFileSync} from 'node:child_process';
const output='storage/app/qa/municipal-interactions-69644';fs.mkdirSync(output,{recursive:true});const observations=[],focus=[],errors=[];
const browser=await chromium.launch(),page=await browser.newPage({viewport:{width:320,height:900}});page.on('pageerror',e=>errors.push(e.message));const axe=fs.readFileSync('storage/app/qa/a11y-tools/node_modules/axe-core/axe.min.js','utf8');let completed=false;
async function inspect(label){await page.evaluate(axe);const audit=await page.evaluate(async()=>window.axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}}));const capture=label+'.png';await page.screenshot({path:output+'/'+capture,fullPage:true});observations.push({label,route:new URL(page.url()).pathname,capture,overflow:await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),violations:audit.violations,incomplete:audit.incomplete});save();}
function save(){fs.writeFileSync(output+'/results.json',JSON.stringify({sourceSha:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),sourceWorktreeDirty:Boolean(execFileSync('git',['status','--porcelain'],{encoding:'utf8'}).trim()),completed,observations,focus,errors},null,2));}
try{
await page.goto(process.env.APP_URL+'/login');await page.getByLabel('Username or email').fill(process.env.PHASE_A_CANONICAL_LOGIN);await page.getByLabel('Password',{exact:true}).fill(process.env.PHASE_A_CANONICAL_PASSWORD);await page.getByRole('button',{name:'Sign in',exact:true}).click();await page.waitForURL('**/dashboard');
for(const theme of ['light','dark']){
await page.emulateMedia({colorScheme:theme});await page.goto(process.env.APP_URL+'/procurement');await page.getByRole('button').filter({hasText:'PR-2026-014'}).first().click();await page.getByRole('dialog').waitFor();
for(let i=0;i<18;i++){await page.keyboard.press('Tab');focus.push({theme,step:i,...await page.evaluate(()=>({insideDialog:Boolean(document.activeElement.closest('[role=dialog],dialog')),name:document.activeElement.getAttribute('aria-label')||document.activeElement.textContent?.trim().slice(0,80)}))});}
for(const tab of ['Summary','Activity','Documents']){await page.getByRole('dialog').getByRole('tab',{name:tab,exact:true}).click();await inspect('procurement-'+tab+'-'+theme);}
await page.getByRole('dialog').getByRole('button',{name:'Close',exact:true}).hover();await inspect('procurement-close-hover-'+theme);await page.keyboard.press('Escape');await page.getByRole('dialog').waitFor({state:'hidden'});
}
await page.emulateMedia({colorScheme:'dark'});await page.goto(process.env.APP_URL+'/municipal-systems');
const systems=await page.getByRole('button',{name:/^Open preview for /}).evaluateAll(nodes=>nodes.map(n=>n.getAttribute('aria-label')));
for(const [index,name]of systems.entries()){await page.goto(process.env.APP_URL+'/municipal-systems');await page.getByRole('button',{name,exact:true}).click();await inspect('future-'+index+'-dark');}
completed=true;
}finally{save();await browser.close();}
