import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {chromium} from 'playwright';
import {contrastReview} from './phase-a-manual-review.mjs';
const origin=process.env.PHASE_A_CANONICAL_URL;
assert.match(origin,/^http:\/\/127\.0\.0\.1:\d+$/);
const sourceSha=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const sourceWorktreeDirty=Boolean(execFileSync('git',['status','--porcelain'],{encoding:'utf8'}).trim());
const buildManifestSha256=crypto.createHash('sha256').update(fs.readFileSync('public/build/manifest.json')).digest('hex');
const output=`storage/app/qa/phase-a-qualification/${sourceSha.slice(0,12)}-${new Date().toISOString().replace(/[:.]/g,'-')}`;
fs.mkdirSync(output,{recursive:true});console.log('Qualification evidence: '+path.resolve(output));
const axeSource=fs.readFileSync('storage/app/qa/a11y-tools/node_modules/axe-core/axe.min.js','utf8');
const observations=[],interactions=[],failures=[],interactionCaptures=[];let completed=false,activePage=null,sourceChangedDuringRun=false,workRequestRoute=null;
const fixtures=JSON.parse(process.env.PHASE_A_FIXTURES || '{}');
function totp(secret){let bits='';for(const char of secret)bits+='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'.indexOf(char).toString(2).padStart(5,'0');const bytes=[];for(let i=0;i+8<=bits.length;i+=8)bytes.push(parseInt(bits.slice(i,i+8),2));const counter=Buffer.alloc(8);counter.writeBigUInt64BE(BigInt(Math.floor(Date.now()/30000)));const digest=crypto.createHmac('sha1',Buffer.from(bytes)).update(counter).digest(),offset=digest.at(-1)&15;return String((digest.readUInt32BE(offset)&0x7fffffff)%1000000).padStart(6,'0');}
function save(){fs.writeFileSync(output+'/results.json',JSON.stringify({completed,passed:completed&&!failures.length,scope:{widths,roles:roleFilter??'all',routeMatrix:!interactionsOnly,focused:process.env.PHASE_A_QUALIFICATION_FOCUS==='1'},sourceSha,sourceWorktreeDirty:sourceWorktreeDirty||sourceChangedDuringRun,buildManifestSha256,observations,interactions,interactionCaptures,failures},null,2));}
async function captureInteraction(page,name){const file=`interaction-${name}.png`;await page.screenshot({path:output+'/'+file,fullPage:true});interactionCaptures.push({file,route:new URL(page.url()).pathname});save();}
async function inspectSensitive(page,component,theme){
    await page.evaluate(axeSource);
    const result=await page.evaluate(async()=>window.axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}}));
    const actual=await page.evaluate(()=>history.state?.page?.component||JSON.parse(document.querySelector('script[data-page]')?.textContent||document.querySelector('#app').getAttribute('data-page')).component);
    assert.equal(actual,component);
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
    const sanitized=items=>items.map(({id,nodes})=>({id,targets:nodes.map(node=>node.target)}));
    observations.push({role:'synthetic_enrolling_department_head',route:new URL(page.url()).pathname,status:200,width:320,theme,renderedComponent:actual,overflow,capture:null,captureDisposition:'Sensitive transient enrollment/recovery material intentionally not captured or serialized',violations:sanitized(result.violations),incomplete:sanitized(result.incomplete)});
    if(overflow||result.violations.length)failures.push({route:new URL(page.url()).pathname,overflow,violationIds:result.violations.map(r=>r.id)});
    save();
}
const browser=await chromium.launch();
const widths=process.env.PHASE_A_QUALIFICATION_FOCUS==='1'?[320]:[320,390,768,1440];
const roleFilter=process.env.PHASE_A_QUALIFICATION_ROLES?.split(',');
const interactionsOnly=process.env.PHASE_A_QUALIFICATION_INTERACTIONS_ONLY==='1';
assert.ok(!interactionsOnly||process.env.PHASE_A_QUALIFICATION_FOCUS==='1','Interaction selection is only for explicitly focused checks');
assert.ok(!roleFilter||process.env.PHASE_A_QUALIFICATION_FOCUS==='1','Role selection is only for explicitly focused checks');
assert.ok(!roleFilter||roleFilter.every(role=>['employee','department_head','system_admin','mayor_approver','auth_enrollment'].includes(role)));
async function inspect(page,role,route,width,theme,stage='route'){
    const errors=[];const listener=error=>errors.push(error.message);page.on('pageerror',listener);
    try{
        const response=await page.goto(origin+route);await page.getByRole('main').first().waitFor();await page.evaluate(()=>document.fonts.ready);
        const status=response.status();
        const component=await page.evaluate(()=>{const data=document.querySelector('script[data-page]')?.textContent||document.querySelector('#app')?.getAttribute('data-page');return data?JSON.parse(data).component:null;});
        const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
        await page.evaluate(axeSource);
        const axe=await page.evaluate(async()=>window.axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}}));
        const capture=`${role}-${route.slice(1).replaceAll(/[^a-zA-Z0-9_-]/g,'-')||'home'}${stage==='route'?'':'-'+stage}-${width}-${theme}.png`;
        await page.screenshot({path:output+'/'+capture,fullPage:true});
        const accessibilityTree=await page.locator('body').ariaSnapshot();
        const manualReview=await contrastReview(page,axe);
        const keyboardTrace=[];
        if(width===320&&theme==='light')for(let index=0;index<12;index++){
            await page.keyboard.press('Tab');
            await page.waitForFunction(()=>{const r=document.activeElement.getBoundingClientRect();return r.left>=-1&&r.right<=innerWidth+1&&r.top>=-1&&r.bottom<=innerHeight+1;},null,{timeout:750}).catch(()=>{});
            keyboardTrace.push(await page.evaluate(()=>{const node=document.activeElement,rect=node.getBoundingClientRect(),styles=getComputedStyle(node),hit=document.elementFromPoint(rect.left+rect.width/2,rect.top+rect.height/2);return {tag:node.tagName,name:node.tagName==='BODY'?'Document':node.getAttribute('aria-label')||node.textContent?.trim().slice(0,80),role:node.getAttribute('role'),outline:styles.outline,shadow:styles.boxShadow,inViewport:rect.left>=-1&&rect.right<=innerWidth+1&&rect.top>=-1&&rect.bottom<=innerHeight+1,unobscured:hit===node||node.contains(hit),focusRect:{x:rect.x,y:rect.y,width:rect.width,height:rect.height}};}));
        }
        const observation={role,route,width,theme,stage,status,renderedComponent:component,disposition:status===200?'CANONICAL PAGE RENDERED':status===403?'AUTHORIZATION DENIED: not positive page coverage':status===404?'NOT FOUND: not positive page coverage':'UNEXPECTED RESPONSE',overflow,errors,capture,accessibilityTree,manualReview,keyboardTrace,violations:axe.violations,incomplete:axe.incomplete};
        observations.push(observation);
        if(![200,403,404].includes(status)||!component||overflow||errors.length||axe.violations.length)failures.push({role,route,width,theme,status,overflow,errors,violationIds:axe.violations.map(r=>r.id)});
        save();return observation;
    }catch(error){failures.push({role,route,width,theme,error:String(error)});save();}finally{page.off('pageerror',listener);}
}
const general=['/dashboard','/my-department','/my-tasks','/portal-search?q=Synthetic','/documents','/departments','/employees','/calendar','/operations','/announcements','/meetings','/local-special-bodies','/development-plans','/ppas','/planning-maps','/procurement','/municipal-systems','/correspondence','/records','/travel-orders','/transactions','/transactions/create','/memoranda','/legislation','/legislative-workspace','/hris/attendance','/security/account'];
if(fixtures.employee)general.push(`/employees/${fixtures.employee}`,`/legislation/${fixtures.law}`,`/travel-orders/${fixtures.travel}`,`/memoranda/${fixtures.memo}`,`/correspondence/${fixtures.correspondence}/workspace`);
try{
    if(!roleFilter){
    const publicContext=await browser.newContext();const publicPage=await publicContext.newPage();
    for(const width of widths)for(const theme of ['light','dark']){
        await publicPage.setViewportSize({width,height:900});await publicPage.emulateMedia({colorScheme:theme});
        for(const route of ['/','/login','/activate-account','/not-a-real-phase-a-route'])await inspect(publicPage,'guest',route,width,theme);
    }
    await publicContext.close();
    }
    if(!roleFilter||roleFilter.includes('auth_enrollment')){
    const enrollment=await browser.newContext({viewport:{width:320,height:900},colorScheme:'light'}),enrollPage=await enrollment.newPage();
    await enrollPage.goto(origin+'/login');await enrollPage.getByLabel('Username or email').fill(process.env.PHASE_A_ENROLL_LOGIN);await enrollPage.getByLabel('Password',{exact:true}).fill(process.env.PHASE_A_CANONICAL_PASSWORD);await enrollPage.getByRole('button',{name:'Sign in',exact:true}).click();
    await enrollPage.waitForURL('**/security/mfa/enroll');for(const theme of ['light','dark']){await enrollPage.emulateMedia({colorScheme:theme});await inspectSensitive(enrollPage,'Auth/MfaEnrollment',theme);}
    const enrollmentSecret=await enrollPage.locator('code').innerText();
    await enrollPage.getByLabel('Six-digit verification code').fill(totp(enrollmentSecret));await enrollPage.getByRole('button',{name:'Confirm MFA enrollment',exact:true}).click();
    await enrollPage.waitForURL('**/security/mfa/recovery-codes');for(const theme of ['light','dark']){await enrollPage.emulateMedia({colorScheme:theme});await inspectSensitive(enrollPage,'Auth/MfaRecoveryCodes',theme);}
    assert.ok((await enrollPage.locator('pre').innerText()).trim().split(/\s+/).length>=6);
    await enrollPage.getByRole('link',{name:'Continue to portal',exact:true}).click();await enrollPage.waitForURL('**/dashboard');
    interactions.push({role:'synthetic_enrolling_department_head',label:'real-mfa-enrollment-confirm-recovery-continue',secretMaterialExcluded:true});await enrollment.close();
    }
    const actors=[{role:'employee',login:process.env.PHASE_A_CANONICAL_LOGIN,routes:general},{role:'system_admin',login:process.env.PHASE_A_ADMIN_LOGIN,routes:['/admin','/audit','/reports','/property','/property/lifecycle','/legislation/create','/legislative-workspace','/memoranda/create','/travel-orders/create','/security/mfa','/security/mfa/recovery-codes']},{role:'department_head',login:process.env.PHASE_A_HEAD_LOGIN,routes:['/my-department','/operations','/transactions/create','/memoranda/create','/travel-orders/create','/work-requests/origin-delivery-exceptions','/messages','/hris/payroll']},{role:'mayor_approver',login:process.env.PHASE_A_MAYOR_LOGIN,routes:['/mayor-office','/reports','/memoranda/create','/travel-orders/create']}];
    for(const actor of actors){
        if(roleFilter&&!roleFilter.includes(actor.role))continue;
        const context=await browser.newContext({viewport:{width:1440,height:900},colorScheme:'light'});const page=await context.newPage();activePage=page;
        await page.goto(origin+'/login');await page.getByLabel('Username or email').fill(actor.login);await page.getByLabel('Password',{exact:true}).fill(process.env.PHASE_A_CANONICAL_PASSWORD);await page.getByRole('button',{name:'Sign in',exact:true}).click();
        if(actor.role!=='employee'){await page.waitForURL('**/security/mfa/challenge');await inspect(page,actor.role,'/security/mfa/challenge',1440,'light');await page.getByLabel('Authenticator code',{exact:true}).fill(totp(process.env.PHASE_A_HEAD_MFA_SECRET));await page.getByRole('button',{name:'Verify and continue',exact:true}).click();}
        await page.waitForURL('**/dashboard');
        if(actor.role==='employee'){
            await page.goto(origin+'/transactions/create');
            const title='Synthetic qualification request '+Date.now();
            await page.getByLabel('Subject').fill(title);
            await page.getByLabel('Instructions / Details').fill('Synthetic instructions for canonical presentation validation.');
            await page.locator('#wr-due').fill('2099-12-31');
            const office=page.getByRole('combobox',{name:/Receiving Office/});
            await office.fill('Synthetic MPDO Test Office');await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');
            await page.getByRole('button',{name:'Submit Work Request',exact:true}).click();
            await page.waitForURL(/\/transactions\/\d+$/);
            assert.ok((await page.getByRole('main').innerText()).includes(title));
            const detail=new URL(page.url()).pathname;general.push(detail);workRequestRoute=detail;
            await captureInteraction(page,'work-request-created');
            interactions.push({role:actor.role,label:'real-work-request-create-and-detail',route:detail,keyboardOfficeSelection:true});
        }
        if(actor.role==='department_head'){
            await page.goto(origin+'/development-plans');
            await page.getByRole('button',{name:/^View details for /}).first().click();
            const dossier=page.getByRole('dialog');await dossier.getByRole('tab',{name:'Supporting Docs',exact:true}).click();
            await dossier.getByRole('button',{name:'Attach File',exact:true}).click();
            const documentTitle='Synthetic qualification attachment '+Date.now();
            const bytes=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aZ1kAAAAASUVORK5CYII=','base64');
            await dossier.locator('input[type=file]').setInputFiles({name:'synthetic-qualification.png',mimeType:'image/png',buffer:bytes});
            await dossier.getByLabel('Document title').fill(documentTitle);
            await dossier.getByLabel('Access visibility tier').selectOption('office_restricted');
            await captureInteraction(page,'document-upload-ready');
            await dossier.getByRole('button',{name:'Upload to Private Storage',exact:true}).click();
            const card=dossier.getByRole('listitem').filter({hasText:documentTitle});await card.waitFor();
            const preview=await card.getByRole('link',{name:/Preview/}).getAttribute('href');
            await card.getByRole('button',{name:'Inspect metadata',exact:true}).click();
            await page.getByRole('dialog',{name:documentTitle,exact:true}).getByText('synthetic-qualification.png',{exact:false}).waitFor();
            await captureInteraction(page,'document-metadata');
            const response=await context.request.get(origin+preview);assert.equal(response.status(),200);assert.deepEqual(await response.body(),bytes);
            const anonymous=await browser.newContext();const denied=await anonymous.request.get(origin+preview);assert.ok(denied.url().endsWith('/login'));await anonymous.close();
            interactions.push({role:actor.role,label:'real-supporting-document-upload-private-preview',authenticatedBytesMatch:true,anonymousDenied:true,route:preview});
            await page.keyboard.press('Escape');await page.goto(origin+'/development-plans');
            await page.getByRole('button',{name:/^Staff Scopes/}).click();const staff=page.getByRole('dialog');
            await staff.getByLabel('Active MPDC Employee').selectOption(String(fixtures.delegateEmployee));
            await staff.getByLabel('Development Plans').check();
            await staff.getByRole('button',{name:'Save Staff Designation',exact:true}).click();
            const member=staff.getByRole('listitem').filter({hasText:fixtures.delegateName});await member.waitFor();
            await captureInteraction(page,'staff-designated');
            await member.getByRole('button',{name:'PPAs',exact:true}).click();
            await page.waitForFunction(name=>[...document.querySelectorAll('li')].find(node=>node.textContent.includes(name))?.querySelectorAll('button') && [...[...document.querySelectorAll('li')].find(node=>node.textContent.includes(name)).querySelectorAll('button')].some(button=>button.textContent==='PPAs'&&button.getAttribute('aria-pressed')==='true'),fixtures.delegateName);
            await member.getByRole('button',{name:'Revoke All',exact:true}).click();await member.waitFor({state:'hidden'});
            interactions.push({role:actor.role,label:'real-staff-designate-scope-toggle-revoke',employee:fixtures.delegateEmployee});
            if(workRequestRoute){
                await page.keyboard.press('Escape');await page.setViewportSize({width:320,height:900});
                await inspect(page,actor.role,workRequestRoute,320,'light','before-office-action');
                await page.getByLabel('Assign responsible employee').selectOption(String(fixtures.delegateEmployee));
                const assigned=page.waitForResponse(response=>response.request().method()==='POST'&&response.url()===origin+workRequestRoute+'/transition');
                await page.getByRole('button',{name:'Assign',exact:true}).click();assert.ok([302,303].includes((await assigned).status()));
                const assignment=await context.request.get(origin+workRequestRoute+'/live',{headers:{Accept:'application/json'}});assert.equal(assignment.status(),200);assert.equal((await assignment.json()).transaction.assigned_employee.id,fixtures.delegateEmployee);
                await page.getByRole('button',{name:'Mark for Review',exact:true}).click();
                await page.getByRole('button',{name:'Mark for Review',exact:true}).waitFor({state:'hidden'});
                const response=await context.request.get(origin+workRequestRoute+'/live',{headers:{Accept:'application/json'}});assert.equal(response.status(),200);assert.equal((await response.json()).transaction.status,'for_review');
                await captureInteraction(page,'work-request-marked-for-review');
                actor.routes.push(workRequestRoute);
                interactions.push({role:actor.role,label:'real-work-request-office-assignment-and-review',repeatReviewSuppressed:true,assignedEmployee:fixtures.delegateEmployee});
            }
        }
        if(!interactionsOnly)for(const width of widths)for(const theme of ['light','dark']){
            await page.setViewportSize({width,height:900});await page.emulateMedia({colorScheme:theme});
            for(const route of actor.routes)await inspect(page,actor.role,route,width,theme);
            console.log(`Qualification ${actor.role} ${width}px ${theme} complete`);
        }
        await context.close();
    }
    const captureNames=observations.map(item=>item.capture).filter(Boolean);assert.equal(new Set(captureNames).size,captureNames.length,'Each observed state must retain its own original capture');
    completed=true;
}catch(error){failures.push({stage:'qualification interaction or authentication',error:String(error)});if(activePage&&!/\/(?:login|security|activate-account)/.test(new URL(activePage.url()).pathname))await captureInteraction(activePage,'failure');throw error;}finally{await browser.close();sourceChangedDuringRun=Boolean(execFileSync('git',['status','--porcelain'],{encoding:'utf8'}).trim())||execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim()!==sourceSha;save();}
console.log(JSON.stringify({observations:observations.length,failures},null,2));
assert.equal(failures.length,0,'See preserved qualification failures');
