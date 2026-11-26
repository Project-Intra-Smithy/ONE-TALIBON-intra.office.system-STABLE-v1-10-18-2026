import fs from 'node:fs';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {execFileSync} from 'node:child_process';
const output='storage/app/qa/keyboard-queue-69644';fs.mkdirSync(output,{recursive:true});
const browser=await chromium.launch(),context=await browser.newContext({viewport:{width:320,height:900}}),page=await context.newPage(),traces=[];
try{
await page.goto(process.env.APP_URL+'/login');await page.getByLabel('Username or email').fill(process.env.PHASE_A_CANONICAL_LOGIN);await page.getByLabel('Password',{exact:true}).fill(process.env.PHASE_A_CANONICAL_PASSWORD);await page.getByRole('button',{name:'Sign in',exact:true}).click();await page.waitForURL('**/dashboard');
for(const route of ['/transactions']){
await page.goto(process.env.APP_URL+route);await page.getByRole('main').first().waitFor();
for(let i=0;i<20;i++){
await page.keyboard.press('Tab');
await page.waitForFunction(()=>{const n=document.activeElement,r=(n.getClientRects()[0]??n.getBoundingClientRect()),h=document.elementFromPoint(Math.max(0,Math.min(innerWidth-1,r.left+r.width/2)),Math.max(0,Math.min(innerHeight-1,r.top+Math.min(r.height,44)/2)));return r.y>=0&&r.x>=0&&r.right<=innerWidth&&(h===n||n.contains(h));},null,{timeout:1000}).catch(()=>{});
const record=await page.evaluate(()=>{const n=document.activeElement,r=(n.getClientRects()[0]??n.getBoundingClientRect()),h=document.elementFromPoint(r.left+r.width/2,r.top+Math.min(r.height,44)/2);return {tag:n.tagName,name:n.getAttribute('aria-label')||n.textContent?.trim().slice(0,80),bounds:{x:r.x,y:r.y,width:r.width,height:r.height},inViewport:r.x>=0&&r.right<=innerWidth&&r.y>=0&&r.bottom<=innerHeight,hitTag:h?.tagName,hitClass:h?.className,hitText:h?.textContent?.trim().slice(0,80),unobscured:h===n||n.contains(h)};});traces.push({route,step:i,...record});
if(record.tag!=='BODY'&&(!record.unobscured||!record.inViewport))await page.screenshot({path:`${output}/${route.slice(1)}-step-${i}.png`});
}
}
fs.writeFileSync(output+'/results.json',JSON.stringify({sourceSha:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),sourceWorktreeDirty:Boolean(execFileSync('git',['status','--porcelain'],{encoding:'utf8'}).trim()),completed:true,traces},null,2));
assert.equal(traces.filter(x=>x.tag!=='BODY'&&x.tag!=='DIV'&&!x.unobscured).length,0,'Inspect actual focus obstruction captures');
}finally{await browser.close();}
