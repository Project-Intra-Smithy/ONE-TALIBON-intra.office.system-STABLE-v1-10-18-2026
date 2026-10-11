// MAINT-CC80-001/A01-F01-RT02: genuine Laravel + PostgreSQL + Chromium.
// Never save cookies, passwords, CSRF values, TOTP, raw HTTP bodies or request traces.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {chromium} from 'playwright';
const base='http://127.0.0.1:8000';
const report=process.env.RTCI_REPORT_DIR;
const password=process.env.QA_DEMO_PASSWORD;
if(process.env.RUNNER_ENVIRONMENT!=='github-hosted'||process.env.APP_ENV!=='local'||process.env.RTCI_BASE_URL!==base||!report||!password)throw Error('RT02 nonproduction prerequisites absent');
fs.mkdirSync(report,{recursive:true,mode:0o700});
const names=[
'TWO_ACTIVE_HTTP_LOGINS','A_OWNER_ONLY_INDIVIDUAL','B_OWNER_ONLY_INDIVIDUAL',
'FILTERS_PAGES_DETAILS','MASKED_CROSS_OWNER_404','LOGOUT_REVOKES_ACCESS',
'INACTIVE_AND_MFA_PENDING','HTTP_401_403_419_422_429',
'LIVE_UI_REVOKED_CLEARS_ROWS','AUTHENTICATED_TASK_1440_AND_390',
'POSTGRESQL_HTTP_SOURCE_OWNERSHIP','COMPLETE_CASE_MATRIX'];
const rows=new Map(names.map(name=>[name,{name,status:'NOT_RUN',reason:'upstream prerequisite not reached'}]));
function set(name,status,reason,diagnostic){
 const row={name,status,...(reason?{reason}:{}),...(diagnostic?{diagnostic}:{} )};
 rows.set(name,row);
 // Fixed, bounded phase names and numeric statuses only. Never log assertion messages or HTTP bodies.
 console.log('RT02 '+name+' '+status+(diagnostic?' phase='+diagnostic.phase+' http='+diagnostic.statuses.map(x=>x.status).join(','):''));
}
async function test(name,fn){
 const diagnostic={phase:'start',statuses:[]};
 const mark=(phase,response)=>{
  assert.match(phase,/^[a-z][a-z0-9-]{0,63}$/);
  diagnostic.phase=phase;
  if(response!==undefined){
   const statusCode=typeof response==='number'?response:response.status();
   assert.ok(Number.isInteger(statusCode)&&statusCode>=100&&statusCode<=599);
   assert.ok(diagnostic.statuses.length<12);
   diagnostic.statuses.push({phase,status:statusCode});
  }
 };
 try{await fn(mark);set(name,'PASS',undefined,diagnostic);return true}
 catch(e){set(name,'FAIL','assertion-failed (private error withheld)',diagnostic);return false}
}
const fix=(op,...args)=>execFileSync('php',['tests/integration/f01/fixture.php',op,...args],{cwd:process.cwd(),encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
const userB='rt02-technical-b@example.test';
let browser,A,B,pageA,pageB,desktop,mobile,visibleTask;
const idsA=[],idsB=[];
const codeStatus={};
const throttleEvidence={status:'NOT_RUN',httpStatus:null,attempts:0};
let httpPrechecksPassed=false;
const status=async(r,n)=>assert.equal(r.status(),n);
function viewport(){return {width:1440,height:900}}
// Task labels are test-generated, but escape them before building a role-name regexp.
const escapeRegex=value=>value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
function taskButton(page,task){
 return page.getByRole('list',{name:'Open personal Tasks'})
  .getByRole('button',{name:new RegExp(escapeRegex(task.title))});
}
async function context(){return browser.newContext({viewport:viewport(),baseURL:base,serviceWorkers:'block',acceptDownloads:false})}
async function login(email){
 const ctx=await context(),page=await ctx.newPage();
 const loginPage=await page.goto(base+'/login',{waitUntil:'domcontentloaded'});
 await status(loginPage,200);
 await page.getByLabel('Email').fill(email);
 await page.getByLabel('Password').fill(password);
 await page.getByRole('button',{name:'Sign In'}).click();
 await page.waitForURL(u=>u.pathname==='/dashboard',{timeout:20000});
 await status(await ctx.request.get(base+'/dashboard',{maxRedirects:0}),200);
 return {ctx,page};
}
async function xsrf(ctx){
 const c=(await ctx.cookies(base)).find(c=>c.name==='XSRF-TOKEN');
 assert.ok(c?.value);
 return {'X-XSRF-TOKEN':decodeURIComponent(c.value),Accept:'application/json'};
}
async function post(ctx,url,data={}){
 return ctx.request.post(base+url,{headers:await xsrf(ctx),data,maxRedirects:0});
}
async function get(ctx,url){
 return ctx.request.get(base+url,{headers:{Accept:'application/json'},maxRedirects:0});
}
async function create(ctx,label,ids,n){
 for(let i=0;i<n;i++){
  const r=await post(ctx,'/tasks',{title:'RT02 '+label+' synthetic Task '+String(i+1).padStart(2,'0'),instructions:'Nonproduction synthetic ownership proof'});
  await status(r,201);
  const body=await r.json();
  assert.equal(body.data.kind,'individual');
  assert.equal(body.data.state,'open');
  ids.push(body.data.id);
 }
}
try{
 browser=await chromium.launch({headless:true});
 await test('TWO_ACTIVE_HTTP_LOGINS',async()=>{
  A=await login('employee@talibon.demo');
  B=await login(userB);
  assert.notEqual((await get(A.ctx,'/tasks')).status(),401);
  assert.notEqual((await get(B.ctx,'/tasks')).status(),401);
 });
 if(A)await test('A_OWNER_ONLY_INDIVIDUAL',async()=>{
  await create(A.ctx,'A',idsA,14);
  const r=await get(A.ctx,'/tasks?state=open&per_page=50');
  await status(r,200);
  const body=await r.json();
  for(const id of idsA)assert.ok(body.data.some(x=>x.id===id&&x.kind==='individual'));
 });
 if(A&&B&&idsA.length>=14)await test('B_OWNER_ONLY_INDIVIDUAL',async()=>{
  await create(B.ctx,'B',idsB,2);
  const r=await get(B.ctx,'/tasks?state=open&per_page=50');
  await status(r,200);
  const body=await r.json();
  assert.ok(idsB.every(id=>body.data.some(x=>x.id===id)));
  assert.ok(idsA.every(id=>!body.data.some(x=>x.id===id)));
  // Re-query A only after B has created its Tasks: prove isolation in both directions.
  const aR=await get(A.ctx,'/tasks?state=open&per_page=50');
  await status(aR,200);
  const aAfterB=(await aR.json()).data;
  assert.ok(idsA.every(id=>aAfterB.some(x=>x.id===id&&x.kind==='individual')));
  assert.ok(idsB.every(id=>!aAfterB.some(x=>x.id===id)));
 });
 if(A&&idsA.length>=14)await test('FILTERS_PAGES_DETAILS',async()=>{
  await status(await post(A.ctx,'/tasks/'+idsA[0]+'/start'),200);
  await status(await post(A.ctx,'/tasks/'+idsA[1]+'/start'),200);
  await status(await post(A.ctx,'/tasks/'+idsA[1]+'/complete'),200);
  const p1=await get(A.ctx,'/tasks?state=open&page=1&per_page=10');
  await status(p1,200);const d1=await p1.json();
  assert.equal(d1.data.length,10);
  assert.ok(d1.meta.total>=12&&d1.meta.last_page>=2);
  const p2=await get(A.ctx,'/tasks?state=open&page=2&per_page=10');
  await status(p2,200);assert.ok((await p2.json()).data.length>=2);
  for(const s of ['open','in_progress','completed']){
   const r=await get(A.ctx,'/tasks?state='+s);await status(r,200);
   assert.ok((await r.json()).data.every(x=>x.state===s));
  }
  const detail=await get(A.ctx,'/tasks/'+idsA[0]);
  await status(detail,200);assert.equal((await detail.json()).data.id,idsA[0]);
 });
 if(A&&B&&idsA.length&&idsB.length)await test('MASKED_CROSS_OWNER_404',async()=>{
  const own=await get(B.ctx,'/tasks/'+idsA[0]);await status(own,404);
  const foreign=await get(A.ctx,'/tasks/'+idsB[0]);await status(foreign,404);
  assert.ok(!(await own.text()).includes('RT02 A synthetic Task'));
 });
 if(A&&B){
  try {
  const guest=await context();
  try{const g=await get(guest,'/tasks');await status(g,401);codeStatus[401]=true}finally{await guest.close()}
  const r422=await get(A.ctx,'/tasks?state=invalid');await status(r422,422);codeStatus[422]=true;
  const r419=await A.ctx.request.post(base+'/tasks',{data:{title:'must reject invalid csrf'},headers:{'X-CSRF-TOKEN':'invalid',Accept:'application/json'},maxRedirects:0});
  await status(r419,419);codeStatus[419]=true;
  const admin=await context(),p=await admin.newPage();
  try{
   await p.goto(base+'/login');await p.getByLabel('Email').fill('admin@talibon.demo');await p.getByLabel('Password').fill(password);
   await p.getByRole('button',{name:'Sign In'}).click();
   await p.waitForURL(u=>u.pathname.startsWith('/security/mfa/'),{timeout:15000});
   const denial=await get(admin,'/tasks');await status(denial,403);
   const d=await denial.json();assert.equal(d.code,'MFA_REQUIRED');
   assert.ok(d.next_url.startsWith('/security/mfa/'));codeStatus[403]=true;
  }finally{await admin.close()}
  // Do not mark the HTTP case PASS before observing a real 429.
  httpPrechecksPassed=true;
  } catch(e) { set('HTTP_401_403_419_422_429','FAIL','HTTP prerequisite assertion failed (private error withheld)'); }
 }
 if(B)await test('INACTIVE_AND_MFA_PENDING',async()=>{
  fix('deactivate');
  try{const r=await get(B.ctx,'/tasks');await status(r,401);assert.equal((await r.json()).code,'ACCOUNT_INACTIVE');}
  finally{fix('restore')}
  assert.equal(codeStatus[403],true);
 });
 if(A&&idsA.length&&B&&idsB.length)await test('POSTGRESQL_HTTP_SOURCE_OWNERSHIP',async()=>{
  const receipt=JSON.parse(fix('audit',idsA.join(','),idsB.join(',')));
  assert.equal(receipt.valid,true);assert.equal(receipt.allTaskKindIndividual,true);
  fs.writeFileSync(path.join(report,'db-receipt.json'),JSON.stringify(receipt,null,2)+'\n',{mode:0o600});
 });
 if(A&&idsA.length)await test('AUTHENTICATED_TASK_1440_AND_390',async(mark)=>{
  mark('ui-first-page-api');
  const first=await get(A.ctx,'/tasks?state=open&page=1&per_page=10');
  mark('ui-first-page-api',first);await status(first,200);
  const list=(await first.json()).data;
  assert.ok(Array.isArray(list)&&list.length>0);
  const selected=list.find(task=>idsA.includes(task.id)&&task.kind==='individual'&&task.state==='open'&&/^RT02 A synthetic Task [0-9]{2}$/.test(task.title));
  assert.ok(selected,'first-page owned Task required');
  visibleTask={id:selected.id,title:selected.title};
  desktop=A.page;
  mark('ui-desktop-heading');
  await desktop.goto(base+'/dashboard',{waitUntil:'domcontentloaded'});
  await desktop.getByRole('heading',{name:'Personal Tasks'}).waitFor({timeout:15000});
  mark('ui-desktop-visible-task');
  await taskButton(desktop,visibleTask).waitFor({state:'visible',timeout:15000});
  assert.equal(await taskButton(desktop,visibleTask).count(),1);
  mark('ui-desktop-screenshot');
  await desktop.screenshot({path:path.join(report,'task-desktop.png'),animations:'disabled',fullPage:true});
  mobile=await browser.newContext({viewport:{width:390,height:844},baseURL:base,storageState:await A.ctx.storageState(),serviceWorkers:'block'});
  const p=await mobile.newPage();
  mark('ui-mobile-heading');
  await p.goto(base+'/dashboard',{waitUntil:'domcontentloaded'});
  await p.getByRole('heading',{name:'Personal Tasks'}).waitFor({timeout:15000});
  mark('ui-mobile-visible-task');
  await taskButton(p,visibleTask).waitFor({state:'visible',timeout:15000});
  assert.equal(await taskButton(p,visibleTask).count(),1);
  mark('ui-mobile-screenshot');
  await p.screenshot({path:path.join(report,'task-mobile.png'),animations:'disabled',fullPage:true});
 });
 if(A&&desktop&&visibleTask)await test('LIVE_UI_REVOKED_CLEARS_ROWS',async(mark)=>{
  const l=taskButton(desktop,visibleTask);
  mark('revoked-visible-list');
  await l.waitFor({state:'visible',timeout:15000});
  assert.equal(await desktop.getByRole('list',{name:'Open personal Tasks'}).count(),1);
  mark('revoked-prelogout-detail-http');
  const authorized=await get(A.ctx,'/tasks/'+visibleTask.id);
  mark('revoked-prelogout-detail-http',authorized);await status(authorized,200);
  mark('revoked-prelogout-detail-visible');
  await l.click();
  await desktop.getByRole('region',{name:'Personal Task detail'}).getByRole('heading',{name:visibleTask.title,exact:true}).waitFor({timeout:15000});
  // Keep both list rows and selected detail visible until the real logout occurs.
  assert.equal(await desktop.getByRole('list',{name:'Open personal Tasks'}).count(),1);
  mark('revoked-logout-post');
  const loggedOut=await post(A.ctx,'/logout');
  mark('revoked-logout-post',loggedOut);await status(loggedOut,302);
  // Return to the still-mounted list without reloading the page or restoring credentials.
  mark('revoked-stale-list-present');
  assert.equal(await desktop.getByRole('region',{name:'Personal Task detail'}).count(),1);
  await desktop.getByRole('button',{name:'Back to tasks'}).click();
  await l.waitFor({state:'visible',timeout:15000});
  mark('revoked-stale-detail-request');
  const [denied]=await Promise.all([
   desktop.waitForResponse(r=>r.request().method()==='GET'&&new URL(r.url()).pathname==='/tasks/'+visibleTask.id,{timeout:15000}),
   l.click()
  ]);
  mark('revoked-stale-detail-response',denied);await status(denied,401);
  mark('revoked-clear-alert');
  await desktop.getByRole('alert').getByText('Personal Tasks unavailable (401)').waitFor({timeout:15000});
  mark('revoked-protected-dom-absent');
  assert.equal(await desktop.getByRole('list',{name:'Open personal Tasks'}).count(),0);
  assert.equal(await desktop.getByText(visibleTask.title,{exact:true}).count(),0);
  assert.equal(await desktop.getByRole('region',{name:'Personal Task detail'}).count(),0);
 });
 if(B)await test('LOGOUT_REVOKES_ACCESS',async(mark)=>{
  // The inactive-account middleware invalidated B's original browser session.
  let fresh;
  try{
   mark('b-reauth-after-inactive');
   fresh=await login(userB);
   mark('b-prelogout-http');
   const before=await get(fresh.ctx,'/tasks');
   mark('b-prelogout-http',before);await status(before,200);
   mark('b-logout-post');
   const loggedOut=await post(fresh.ctx,'/logout');
   mark('b-logout-post',loggedOut);await status(loggedOut,302);
   mark('b-postlogout-http');
   const denied=await get(fresh.ctx,'/tasks');
   mark('b-postlogout-http',denied);await status(denied,401);
  } finally { await fresh?.ctx?.close().catch(()=>{}); }
 });
 if(httpPrechecksPassed&&B) {
  // Use a new session after logout. The real response, never a deferred placeholder, is evidence.
  let throttleCtx;
  try {
   ({ctx:throttleCtx}=await login(userB));
   for(let i=0;i<75;i++){
    const r=await get(throttleCtx,'/tasks');
    throttleEvidence.attempts++;
    throttleEvidence.httpStatus=r.status();
    if(r.status()===429){throttleEvidence.status='PASS';break}
   }
   if(throttleEvidence.status!=='PASS')throttleEvidence.status='FAIL';
   codeStatus[429]=throttleEvidence.status==='PASS';
   if(throttleEvidence.status==='PASS'&&['401','403','419','422'].every(k=>codeStatus[k]===true))
    set('HTTP_401_403_419_422_429','PASS');
   else set('HTTP_401_403_419_422_429','FAIL','real 429 or prior HTTP status not proven');
  } catch(e) {
   throttleEvidence.status='FAIL';codeStatus[429]=false;
   set('HTTP_401_403_419_422_429','FAIL','throttle attempt failed (private error withheld)');
  } finally { await throttleCtx?.close().catch(()=>{}); }
 }
 // A complete matrix is proof of every preceding PASS, not merely 12 constructed rows.
 const preceding=names.filter(n=>n!=='COMPLETE_CASE_MATRIX');
 if(preceding.every(n=>rows.get(n).status!=='NOT_RUN')) {
  await test('COMPLETE_CASE_MATRIX',async()=>{
   assert.equal(rows.size,names.length);
   for(const name of preceding)assert.equal(rows.get(name).status,'PASS',name);
   assert.equal(throttleEvidence.status,'PASS');
   assert.equal(throttleEvidence.httpStatus,429);
  });
 }
}catch(e){
 console.log('RT02 prerequisite failed; error content suppressed');
}finally{
 await mobile?.close().catch(()=>{});
 await A?.ctx?.close().catch(()=>{});
 await B?.ctx?.close().catch(()=>{});
 await browser?.close().catch(()=>{});
 const result={mission:'A01-F01-CANONICAL-INTEGRATION-001',kind:'real-laravel-postgresql-chromium',backend:'3b429c5fe95467a223542a832677060c947e9384',frontend:'e6f5947ab330802f4b860b28baddc910ca32e13e',frontendTree:'a7cced7c276e7a62292f08c04606f4376450aac1',cases:names.map(n=>rows.get(n)),statusCodes:codeStatus,throttleEvidence};
 fs.writeFileSync(path.join(report,'browser-cases.json'),JSON.stringify(result,null,2)+'\n',{mode:0o600});
 const failed=result.cases.filter(x=>x.status!=='PASS').length;
 console.log('RT02 cases '+(12-failed)+' PASS / '+failed+' not PASS');
 if(failed)process.exitCode=1;
}
