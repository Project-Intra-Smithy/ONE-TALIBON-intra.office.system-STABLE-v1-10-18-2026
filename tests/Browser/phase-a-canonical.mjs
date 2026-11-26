import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { chromium } from 'playwright';
import { planningCrud } from './phase-a-planning-crud.mjs';

const origin=process.env.PHASE_A_CANONICAL_URL,password=process.env.PHASE_A_CANONICAL_PASSWORD;
assert.ok(origin && /^http:\/\/127\.0\.0\.1:\d+$/.test(origin),'Disposable loopback Laravel URL required');
assert.ok(process.env.PHASE_A_CANONICAL_LOGIN&&password,'Disposable synthetic credentials required');
const crudOnly=process.env.PHASE_A_CANONICAL_FOCUS==='planning-crud';
const output=crudOnly?'storage/app/qa/phase-a-canonical-crud':'storage/app/qa/phase-a-canonical';
await mkdir(output,{recursive:true});
await writeFile(output+'/build-manifest.json',await readFile('public/build/manifest.json'));
const results=[],interactions=[];
const sourceSha=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const buildManifestSha256=crypto.createHash('sha256').update(await readFile('public/build/manifest.json')).digest('hex');
let completed=false;
const browser=await chromium.launch();
function totp(secret){
    let bits='';for(const char of secret)bits+='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'.indexOf(char).toString(2).padStart(5,'0');
    const bytes=[];for(let i=0;i+8<=bits.length;i+=8)bytes.push(parseInt(bits.slice(i,i+8),2));
    const counter=Buffer.alloc(8);counter.writeBigUInt64BE(BigInt(Math.floor(Date.now()/30000)));
    const digest=crypto.createHmac('sha1',Buffer.from(bytes)).update(counter).digest(),offset=digest.at(-1)&15;
    return String((digest.readUInt32BE(offset)&0x7fffffff)%1000000).padStart(6,'0');
}
async function dialogCheck(page,dialog,label,role,width,theme){
    await dialog.waitFor();
    const bounds=await dialog.boundingBox();
    assert.ok(bounds&&bounds.x>=0&&bounds.y>=0&&bounds.x+bounds.width<=width+1&&bounds.y+bounds.height<=901,label+' containment');
    const unnamed=await dialog.locator('input,select,textarea,button').evaluateAll(nodes=>nodes.filter(node=>node.getClientRects().length&&node.type!=='hidden'&&!node.labels?.length&&!node.getAttribute('aria-label')&&!node.getAttribute('aria-labelledby')&&!node.textContent?.trim()).map(node=>node.outerHTML.slice(0,120)));
    assert.deepEqual(unnamed,[],label+' accessible control names');
    await page.screenshot({path:`${output}/${role}-${label}-${width}-${theme}.png`,fullPage:true});
    interactions.push({role,width,theme,label,contained:true,namedControls:true});
}
let employeeTaskId;
try{
    const actors=[{role:'employee',login:process.env.PHASE_A_CANONICAL_LOGIN},...(process.env.PHASE_A_HEAD_LOGIN?[{role:'department_head',login:process.env.PHASE_A_HEAD_LOGIN}]:[])];
    for(const actor of actors){
        const context=await browser.newContext();
        const page=await context.newPage();
        const errors=[],external=[];
        page.on('pageerror',error=>errors.push(error.message));
        page.on('request',request=>{if(new URL(request.url()).origin!==origin)external.push(request.url());});
        await page.goto(origin+'/login');
        await page.getByLabel('Username or email').fill(actor.login);
        await page.getByLabel('Password',{exact:true}).fill(password);
        await page.getByRole('button',{name:'Sign in',exact:true}).click();
        if(actor.role==='department_head'){
            await page.waitForURL('**/security/mfa/challenge');
            await page.getByLabel('Authenticator code',{exact:true}).fill(totp(process.env.PHASE_A_HEAD_MFA_SECRET));
            await page.getByRole('button',{name:'Verify and continue',exact:true}).click();
        }
        await page.waitForURL('**/dashboard');
        for(const width of (crudOnly?[]:[1440,768,390]))for(const theme of ['light','dark']){
            await page.setViewportSize({width,height:900});
            await page.emulateMedia({colorScheme:theme});
            const paths=['/my-tasks','/transactions','/transactions/create','/calendar','/documents',...(actor.role==='department_head'?['/my-department','/development-plans','/ppas','/planning-maps']:[])];
            for(const path of paths){
                const response=await page.goto(origin+path);
                assert.equal(response.status(),200,path+' HTTP status');
                await page.getByRole('main').first().waitFor();
                assert.equal(await page.getByRole('region',{name:'Isolated frontend controls'}).count(),0);
                const renderedComponent=await page.evaluate(()=>{
                    const script=document.querySelector('script[data-page]');
                    const serialized=script?.textContent||document.querySelector('#app')?.getAttribute('data-page');
                    return serialized?JSON.parse(serialized).component:null;
                });
                assert.ok(renderedComponent,path+' must identify real Inertia component');
                if(path==='/transactions/create'){
                    const drawer=page.getByRole('dialog',{name:'New Work Request',exact:true});
                    await drawer.getByLabel('Subject').fill('Synthetic canonical form inspection');
                    await drawer.locator('select[name="request_category"] option').first().waitFor({state:'attached'});
                    await dialogCheck(page,drawer,'work-request-form',actor.role,width,theme);
                }
                if(path==='/my-tasks'&&actor.role==='employee'&&width===1440&&theme==='light'){
                    await page.getByLabel('New personal Task title').fill('Synthetic canonical mutation cycle');
                    await page.getByLabel('New personal Task instructions').fill('Synthetic instruction preservation proof');
                    await page.getByLabel('New personal Task target date').fill('2027-03-15');
                    await page.getByRole('button',{name:'Create Task',exact:true}).click();
                    await page.getByText(/Server confirmed: Synthetic canonical mutation cycle — open/).waitFor();
                    const list=await context.request.get(origin+'/tasks?per_page=20&page=1',{headers:{Accept:'application/json'}});
                    const task=(await list.json()).data.find(task=>task.title==='Synthetic canonical mutation cycle');
                    assert.equal(task.instructions,'Synthetic instruction preservation proof');
                    assert.ok(task.due_at?.startsWith('2027-03-15'));
                    employeeTaskId=task.id;
                    const row=page.getByRole('list',{name:'Personal Task actions list'}).getByRole('listitem').filter({hasText:task.title});
                    await row.getByRole('button',{name:'Start',exact:true}).click();
                    await page.getByText(/Server confirmed: Synthetic canonical mutation cycle — in progress/).waitFor();
                    await row.getByRole('button',{name:'Complete',exact:true}).click();
                    await page.getByText(/Server confirmed: Synthetic canonical mutation cycle — completed/).waitFor();
                    interactions.push({role:actor.role,label:'real-task-create-start-complete',instructions:true,dueAt:true});
                }
                if(path==='/development-plans'){
                    await page.getByRole('button',{name:'New Plan Record',exact:true}).click();
                    const form=page.getByRole('dialog',{name:'Add Development Plan',exact:true});
                    await dialogCheck(page,form,'plan-studio',actor.role,width,theme);
                    assert.ok(await form.locator('input:disabled').count()>=4);
                    await page.keyboard.press('Escape');
                    await page.getByRole('button',{name:/^View details for /}).first().click();
                    const dossier=page.getByRole('dialog');
                    await dossier.getByRole('tab',{name:'Chapters & Maps',exact:true}).click();
                    await dialogCheck(page,dossier,'plan-dossier',actor.role,width,theme);
                    await dossier.getByRole('tab',{name:'Supporting Docs',exact:true}).click();
                    await dossier.getByRole('button',{name:'Attach File',exact:true}).click();
                    await dossier.getByLabel('Document title').fill('Synthetic document studio inspection');
                    assert.equal(await dossier.getByLabel('Control / Resolution Ref.').isDisabled(),true);
                    await dialogCheck(page,dossier,'document-upload-studio',actor.role,width,theme);
                    await page.keyboard.press('Escape');
                    await page.getByRole('button',{name:/^Staff Scopes/}).click();
                    await dialogCheck(page,page.getByRole('dialog'),'staff-scopes',actor.role,width,theme);
                    await page.keyboard.press('Escape');
                }
                if(path==='/ppas'){
                    await page.getByRole('button',{name:'Register PPA Entry',exact:true}).click();
                    await dialogCheck(page,page.getByRole('dialog'),'ppa-studio',actor.role,width,theme);
                    await page.keyboard.press('Escape');
                    await page.getByRole('button',{name:/^View(?: details)?$/}).first().click();
                    const dossier=page.getByRole('dialog');
                    await dossier.getByRole('tab',{name:'Plan, Map & Location',exact:true}).click();
                    await dialogCheck(page,dossier,'ppa-dossier',actor.role,width,theme);
                    await page.keyboard.press('Escape');
                }
                if(path==='/planning-maps'){
                    await page.getByRole('button',{name:'Register Map Plate',exact:true}).click();
                    const form=page.getByRole('dialog');
                    await form.getByRole('button',{name:'Pick on Talibon map',exact:true}).click();
                    await form.getByRole('application',{name:'Click to pick map pin coordinates in Talibon'}).waitFor();
                    await dialogCheck(page,form,'map-studio',actor.role,width,theme);
                    await page.keyboard.press('Escape');
                    await page.getByRole('button',{name:/^Inspect full map plate for /}).first().click();
                    const plate=page.getByRole('dialog');
                    await dialogCheck(page,plate,'map-plate',actor.role,width,theme);
                    assert.equal(await plate.getByRole('button',{name:/Download/}).isDisabled(),true);
                    await page.keyboard.press('Escape');
                }
                const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
                assert.equal(overflow,false,path+' overflow at '+width);
                await page.screenshot({path:`${output}/${actor.role}-${path.slice(1).replaceAll('/','-')}-${width}-${theme}.png`,fullPage:true});
                results.push({path,renderedComponent,role:actor.role,width,theme,status:response.status(),overflow,runtime:'authenticated Laravel with disposable PG16; real Inertia entry',errors:[...errors]});
            }
            console.log(`Canonical ${actor.role} ${width}px ${theme}: ${paths.length} routes rendered`);
        }
        if(actor.role==='department_head'&&employeeTaskId){
            const denied=await context.request.get(origin+'/tasks/'+employeeTaskId,{headers:{Accept:'application/json'}});
            assert.equal(denied.status(),404,'Other account Task detail must remain masked');
            interactions.push({role:actor.role,label:'cross-account-task-denial',status:denied.status()});
        }
        if(actor.role==='department_head')await planningCrud(page,context,origin,interactions);
        assert.deepEqual(errors,[]);
        assert.deepEqual(external,[]);
        await context.close();
    }
    completed=true;
}finally{
    await browser.close();
    await writeFile(output+'/results.json',JSON.stringify({completed,coverage:crudOnly?'planning-crud-only':'responsive-route-and-interaction-matrix',sourceSha,buildManifestSha256,sourceWorktreeDirty:Boolean(execFileSync('git',['status','--porcelain'],{encoding:'utf8'}).trim()),results,interactions},null,2));
}
