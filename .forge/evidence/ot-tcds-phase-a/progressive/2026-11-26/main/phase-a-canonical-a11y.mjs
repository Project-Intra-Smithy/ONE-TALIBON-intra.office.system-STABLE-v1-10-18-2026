import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {chromium} from 'playwright';
const origin=process.env.PHASE_A_CANONICAL_URL;
assert.match(origin,/^http:\/\/127\.0\.0\.1:\d+$/);
const output='storage/app/qa/phase-a-a11y-after';fs.mkdirSync(output,{recursive:true});
const sourceSha=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const axeSource=fs.readFileSync('storage/app/qa/a11y-tools/node_modules/axe-core/axe.min.js','utf8');
const observations=[];let completed=false;
function totp(secret){let bits='';for(const char of secret)bits+='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'.indexOf(char).toString(2).padStart(5,'0');const bytes=[];for(let i=0;i+8<=bits.length;i+=8)bytes.push(parseInt(bits.slice(i,i+8),2));const counter=Buffer.alloc(8);counter.writeBigUInt64BE(BigInt(Math.floor(Date.now()/30000)));const digest=crypto.createHmac('sha1',Buffer.from(bytes)).update(counter).digest(),offset=digest.at(-1)&15;return String((digest.readUInt32BE(offset)&0x7fffffff)%1000000).padStart(6,'0');}
const browser=await chromium.launch();
async function audit(page,role,route,label,width,theme){
    await page.evaluate(axeSource);
    const result=await page.evaluate(async()=>window.axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}}));
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
    const capture=`${role}-${label}-${width}-${theme}.png`;
    await page.screenshot({path:`${output}/${capture}`,fullPage:false});
    observations.push({role,route,label,width,theme,overflow,capture,engine:result.testEngine,violations:result.violations.map(({id,impact,help,helpUrl,nodes})=>({id,impact,help,helpUrl,nodes:nodes.map(({target,html,failureSummary})=>({target,html,failureSummary}))})),incomplete:result.incomplete.map(({id,nodes})=>({id,targets:nodes.map(node=>node.target)}))});
    fs.writeFileSync(output+'/results.json',JSON.stringify({completed,sourceSha,observations},null,2));
}
try{
    const actors=[{role:'department_head',login:process.env.PHASE_A_HEAD_LOGIN,paths:['/my-tasks','/transactions/create','/calendar','/development-plans','/ppas','/planning-maps','/my-department']},{role:'system_admin',login:process.env.PHASE_A_ADMIN_LOGIN,paths:['/admin','/audit','/property','/property/lifecycle']},{role:'mayor_approver',login:process.env.PHASE_A_MAYOR_LOGIN,paths:['/mayor-office','/reports']}];
    for(const actor of actors){
        const context=await browser.newContext();const page=await context.newPage();const errors=[];
        page.on('pageerror',error=>errors.push(error.message));
        await page.goto(origin+'/login');await page.getByLabel('Username or email').fill(actor.login);await page.getByLabel('Password',{exact:true}).fill(process.env.PHASE_A_CANONICAL_PASSWORD);await page.getByRole('button',{name:'Sign in',exact:true}).click();
        await page.waitForURL('**/security/mfa/challenge');await page.getByLabel('Authenticator code',{exact:true}).fill(totp(process.env.PHASE_A_HEAD_MFA_SECRET));await page.getByRole('button',{name:'Verify and continue',exact:true}).click();await page.waitForURL('**/dashboard');
        for(const width of [320,1024,1440])for(const theme of ['light','dark']){
            await page.setViewportSize({width,height:900});await page.emulateMedia({colorScheme:theme});
            for(const route of actor.paths){
                const response=await page.goto(origin+route);assert.equal(response.status(),200,actor.role+' '+route);
                await page.getByRole('main').first().waitFor();
                const label=route.slice(1).replaceAll('/','-');await audit(page,actor.role,route,label,width,theme);
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
}finally{await browser.close();fs.writeFileSync(output+'/results.json',JSON.stringify({completed,sourceSha,observations},null,2));}
const violations=observations.filter(item=>item.violations.length||item.overflow);
console.log(JSON.stringify(violations.map(({role,route,label,width,theme,overflow,violations})=>({role,route,label,width,theme,overflow,violations:violations.map(item=>({id:item.id,nodes:item.nodes.length}))})),null,2));
assert.equal(violations.length,0,'See precise axe nodes and captures in local accessibility evidence');

