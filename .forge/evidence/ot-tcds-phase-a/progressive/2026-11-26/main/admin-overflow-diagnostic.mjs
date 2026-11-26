import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {chromium} from 'playwright';
const origin=process.env.PHASE_A_CANONICAL_URL;
assert.match(origin,/^http:\/\/127\.0\.0\.1:\d+$/);
const sourceSha=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const sourceWorktreeDirty=Boolean(execFileSync('git',['status','--porcelain'],{encoding:'utf8'}).trim());
const buildManifestSha256=crypto.createHash('sha256').update(fs.readFileSync('public/build/manifest.json')).digest('hex');
const output=`storage/app/qa/phase-a-accessibility/${sourceSha.slice(0,12)}-${new Date().toISOString().replace(/[:.]/g,'-')}`;
fs.mkdirSync(output,{recursive:true});console.log('Accessibility evidence: '+path.resolve(output));
const axeSource=fs.readFileSync('storage/app/qa/a11y-tools/node_modules/axe-core/axe.min.js','utf8');
const observations=[];let completed=false;
function totp(secret){let bits='';for(const char of secret)bits+='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'.indexOf(char).toString(2).padStart(5,'0');const bytes=[];for(let i=0;i+8<=bits.length;i+=8)bytes.push(parseInt(bits.slice(i,i+8),2));const counter=Buffer.alloc(8);counter.writeBigUInt64BE(BigInt(Math.floor(Date.now()/30000)));const digest=crypto.createHmac('sha1',Buffer.from(bytes)).update(counter).digest(),offset=digest.at(-1)&15;return String((digest.readUInt32BE(offset)&0x7fffffff)%1000000).padStart(6,'0');}
const browser=await chromium.launch();
async function audit(page,role,route,label,width,theme){
    await page.evaluate(axeSource);
    const result=await page.evaluate(async()=>window.axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}}));
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
    if(overflow)console.log(JSON.stringify(await page.evaluate(()=>Array.from(document.body.querySelectorAll('*')).filter(node=>{const rect=node.getBoundingClientRect();return rect.width&&rect.right>innerWidth+1&&getComputedStyle(node).position!=='fixed';}).map(node=>({tag:node.tagName,classes:node.getAttribute('class'),text:node.textContent?.trim().slice(0,80),width:node.getBoundingClientRect().width,right:node.getBoundingClientRect().right})).sort((a,b)=>b.right-a.right).slice(0,20)),null,2));
    const capture=`${role}-${label}-${width}-${theme}.png`;
    await page.screenshot({path:`${output}/${capture}`,fullPage:false});
    observations.push({role,route,label,width,theme,overflow,capture,engine:result.testEngine,violations:result.violations.map(({id,impact,help,helpUrl,nodes})=>({id,impact,help,helpUrl,nodes:nodes.map(({target,html,failureSummary})=>({target,html,failureSummary}))})),incomplete:result.incomplete.map(({id,nodes})=>({id,targets:nodes.map(node=>node.target)}))});
    fs.writeFileSync(output+'/results.json',JSON.stringify({completed,passed:completed&&observations.every(item=>!item.violations.length&&!item.overflow),sourceSha,sourceWorktreeDirty,buildManifestSha256,observations},null,2));
}
try{
    const actors=[{role:'department_head',login:process.env.PHASE_A_HEAD_LOGIN,paths:['/my-tasks','/transactions/create','/calendar','/development-plans','/ppas','/planning-maps','/my-department']},{role:'system_admin',login:process.env.PHASE_A_ADMIN_LOGIN,paths:['/admin','/audit','/property','/property/lifecycle']},{role:'mayor_approver',login:process.env.PHASE_A_MAYOR_LOGIN,paths:['/mayor-office','/reports']}];
    for(const actor of actors.filter(item=>item.role==='system_admin')){
        const context=await browser.newContext();const page=await context.newPage();const errors=[];
        page.on('pageerror',error=>errors.push(error.message));
        await page.goto(origin+'/login');await page.getByLabel('Username or email').fill(actor.login);await page.getByLabel('Password',{exact:true}).fill(process.env.PHASE_A_CANONICAL_PASSWORD);await page.getByRole('button',{name:'Sign in',exact:true}).click();
        await page.waitForURL('**/security/mfa/challenge');await page.getByLabel('Authenticator code',{exact:true}).fill(totp(process.env.PHASE_A_HEAD_MFA_SECRET));await page.getByRole('button',{name:'Verify and continue',exact:true}).click();await page.waitForURL('**/dashboard');
        for(const width of [320])for(const theme of ['light']){
            await page.setViewportSize({width,height:900});await page.emulateMedia({colorScheme:theme});
            for(const route of ['/admin']){
                const response=await page.goto(origin+route);assert.equal(response.status(),200,actor.role+' '+route);
                await page.getByRole('main').first().waitFor();
                const label=route.slice(1).replaceAll('/','-');await audit(page,actor.role,route,label,width,theme);
                if(route==='/planning-maps'){
                    const cluster=page.getByRole('button',{name:/^Select from \d+ nearby map references$/}).first();
                    assert.ok(await cluster.count(),'Reference samples must exercise grouped map-target selection');
                    if(await cluster.count()){
                        await cluster.click();const choices=page.getByRole('dialog',{name:'Nearby map references',exact:true});
                        await choices.waitFor();
                        const records=choices.getByRole('list',{name:'Nearby reference records'});
                        assert.equal(await choices.evaluate(node=>node.contains(document.activeElement)),true,'Native dialog must contain initial keyboard focus');
                        await audit(page,actor.role,route,label+'-pin-choices',width,theme);
                        await page.keyboard.press('Escape');await choices.waitFor({state:'hidden'});
                        await page.waitForFunction(node=>node===document.activeElement,await cluster.elementHandle());
                        await cluster.click();await records.getByRole('button').first().click();await choices.waitFor({state:'hidden'});
                    }
                }
                const buttonName=route==='/development-plans'?'New Plan Record':route==='/ppas'?'Register PPA Entry':route==='/planning-maps'?'Register Map Plate':null;
                if(buttonName){
                    const trigger=page.getByRole('button',{name:buttonName,exact:true});await trigger.click();const dialog=page.getByRole('dialog');await dialog.waitFor();
                    await audit(page,actor.role,route,label+'-studio',width,theme);
                    await page.keyboard.press('Escape');await dialog.waitFor({state:'hidden'});assert.equal(await trigger.evaluate(node=>node===document.activeElement),true);
                }
            }
            console.log(`Axe canonical ${actor.role} ${width}px ${theme} complete`);
        }
        assert.deepEqual(errors,[]);await context.close();
    }
    completed=true;
}finally{await browser.close();fs.writeFileSync(output+'/results.json',JSON.stringify({completed,passed:completed&&observations.every(item=>!item.violations.length&&!item.overflow),sourceSha,sourceWorktreeDirty,buildManifestSha256,observations},null,2));}
const violations=observations.filter(item=>item.violations.length||item.overflow);
console.log(JSON.stringify(violations.map(({role,route,label,width,theme,overflow,violations})=>({role,route,label,width,theme,overflow,violations:violations.map(item=>({id:item.id,nodes:item.nodes.length}))})),null,2));
assert.equal(violations.length,0,'See precise axe nodes and captures in local accessibility evidence');
