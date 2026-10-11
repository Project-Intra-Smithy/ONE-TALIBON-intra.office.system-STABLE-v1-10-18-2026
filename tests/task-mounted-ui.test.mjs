/**
 * MAINT-CC80-001/A01-F01-UISTATE-REG-001.
 * Mounted real Dashboard -> PersonalTaskWorkspace, test-controlled HTTP only.
 * No real Laravel session, access policy, database, or CSRF exercised.
 */
import test, {before, after} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {existsSync} from 'node:fs';
import {once} from 'node:events';
import {chromium} from 'playwright';

const root='http://127.0.0.1:4174';
const url=root+'/visual-preview.html?screen=dashboard&role=employee';
const secret='FORGE CONFIDENTIAL PERSONAL TASK';
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const task=(id,title)=>({id,kind:'individual',title,
  instructions:'Restricted test-only Task instructions',state:'open',
  owning_department_id:null,due_at:null,completed_at:null,
  created_at:'2026-10-10T08:00:00+08:00',updated_at:'2026-10-10T08:00:00+08:00'});
const pageBody=tasks=>({data:tasks,meta:{page:1,per_page:10,total:tasks.length,last_page:1}});
const response=(value,status=200)=>({status,contentType:'application/json',
  body:JSON.stringify(value),headers:{'X-Request-ID':'simulated-task-regression'}});
let browser, server, serverOutput='';

before(async()=>{
  // CI may already provide system Chrome (Chromium engine). Prefer that
  // to downloading another browser before npm test; fall back to Playwright's
  // pinned Chromium binary on environments without a system browser.
  if(!existsSync(chromium.executablePath())){
    try{browser=await chromium.launch({channel:'chrome',headless:true});}
    catch{/* No compatible system Chrome: provision pinned Playwright browser. */}
  }
  if(!browser&&!existsSync(chromium.executablePath())){
    const installer=spawn(process.execPath,
      ['node_modules/playwright/cli.js','install','chromium'],{stdio:'pipe'});
    let output='';
    for(const stream of [installer.stdout,installer.stderr])
      stream.on('data',chunk=>{output+=String(chunk);});
    const [code]=await once(installer,'close');
    assert.equal(code,0,'Playwright Chromium binary unavailable: '+output.slice(-1500));
  }
  server=spawn(process.execPath,
    ['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','4174','--strictPort'],
    {stdio:'pipe',env:{...process.env,LARAVEL_BYPASS_ENV_CHECK:'1'}});
  for(const stream of [server.stdout,server.stderr])
    stream.on('data',chunk=>{serverOutput+=String(chunk);});
  let ready=false;
  for(let i=0;i<80;i++){
    if(server.exitCode!==null)throw new Error('Vite exited: '+serverOutput.slice(-1500));
    try{if((await fetch(url)).ok){ready=true;break;}}catch{}
    await sleep(500);
  }
  assert.ok(ready,'Vite not ready: '+serverOutput.slice(-1500));
  if(!browser)browser=await chromium.launch({headless:true});
});

after(async()=>{
  await browser?.close();
  if(server&&server.exitCode===null){
    server.kill('SIGTERM');
    await Promise.race([once(server,'close'),sleep(2500)]);
  }
});

async function mount(handler){
  const context=await browser.newContext({
    viewport:{width:1100,height:850},reducedMotion:'reduce'});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',err=>errors.push(err.message));
  await page.route('**/tasks**',async route=>
    handler(new URL(route.request().url()),route));
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:20000});
  await page.getByRole('heading',{name:'Personal Tasks'}).waitFor();
  return {context,page,errors};
}
async function assertGone(page,titles){
  for(const title of titles){
    await page.getByText(title,{exact:true}).waitFor({state:'hidden'});
    assert.equal(await page.getByText(title,{exact:true}).count(),0);
  }
  assert.equal(await page.getByRole('list',{name:'Open personal Tasks'}).count(),0);
  assert.equal(await page.getByRole('region',{name:'Personal Task detail'}).count(),0);
  assert.equal(await page.getByRole('button',{name:/FORGE CONFIDENTIAL PERSONAL TASK/}).count(),0);
}
for(const status of [401,403,419]){
  test('mounted React: list 200 then detail '+status+' clears confidential rows',async()=>{
    const title=secret+' '+status,record=task(15,title);
    let detailReads=0;
    const {page,context,errors}=await mount(async(u,route)=>{
      if(u.pathname==='/tasks')return route.fulfill(response(pageBody([record])));
      if(u.pathname==='/tasks/15'){
        detailReads++;
        return route.fulfill(response(status===403
          ? {code:'MFA_REQUIRED',next_url:'/security/mfa/challenge'}
          : status===401 ? {code:'ACCOUNT_INACTIVE'}:{code:'EXPIRED'},status));
      }
      return route.abort();
    });
    try{
      const row=page.getByRole('button',{name:new RegExp(title)});
      await row.waitFor();
      assert.equal(await page.getByText(title,{exact:true}).count(),1);
      await row.click();
      await page.getByRole('alert').getByText('Personal Tasks unavailable ('+status+')').waitFor();
      assert.equal(detailReads,1);
      await assertGone(page,[title]);
      if(status===401){
        await page.getByText(/Your account is inactive/).waitFor();
        assert.equal(await page.getByRole('link',{name:'Sign in again'}).count(),1);
      }else if(status===403){
        await page.getByText(/Multi-factor verification is required/).waitFor();
        assert.equal(await page.getByRole('link',{name:'Complete MFA'}).getAttribute('href'),
          '/security/mfa/challenge');
      }else{
        await page.getByText(/Your session or security token expired/).waitFor();
        assert.equal(await page.getByRole('link',{name:'Sign in again'}).count(),1);
      }
      assert.deepEqual(errors,[]);
    }finally{await context.close();}
  });
}

test('mounted React: delayed aborted detail cannot restore revoked data',async()=>{
  const first=task(15,secret+' STALE FIRST'),second=task(16,secret+' STALE SECOND');
  let releaseLate,signalStart;
  const gate=new Promise(resolve=>{releaseLate=resolve;});
  const started=new Promise(resolve=>{signalStart=resolve;});
  const {page,context,errors}=await mount(async(u,route)=>{
    if(u.pathname==='/tasks')return route.fulfill(response(pageBody([first,second])));
    if(u.pathname==='/tasks/15'){
      signalStart();
      await gate;
      try{await route.fulfill(response({data:first}));}catch{/* aborted request */}
      return;
    }
    if(u.pathname==='/tasks/16')
      return route.fulfill(response({code:'ACCOUNT_INACTIVE'},401));
    return route.abort();
  });
  try{
    await page.getByText(first.title,{exact:true}).waitFor();
    await page.getByRole('button',{name:new RegExp(first.title)}).click();
    await started;
    await page.getByRole('button',{name:new RegExp(second.title)}).click();
    await page.getByRole('alert').getByText('Personal Tasks unavailable (401)').waitFor();
    await assertGone(page,[first.title,second.title]);
    releaseLate();
    await sleep(350);
    await assertGone(page,[first.title,second.title]);
    assert.deepEqual(errors,[]);
  }finally{releaseLate();await context.close();}
});

test('mounted Inertia identity switch clears old viewer and loads only new rows',async()=>{
  const a=task(15,secret+' USER ONE'),b=task(22,secret+' USER TWO');
  let actor=1,releaseNew;
  const gate=new Promise(resolve=>{releaseNew=resolve;});
  const {page,context,errors}=await mount(async(u,route)=>{
    if(u.pathname!=='/tasks')return route.abort();
    if(actor===1)return route.fulfill(response(pageBody([a])));
    await gate;
    try{await route.fulfill(response(pageBody([b])));}catch{/* canceled */}
  });
  try{
    await page.getByText(a.title,{exact:true}).waitFor();
    actor=2;
    await page.evaluate(async()=>{
      const {setFixtureIdentity}=await import(
        '/resources/js/components/tasks/__tests__/task-mounted-inertia-bridge.ts');
      setFixtureIdentity(2);
    });
    await page.getByText(a.title,{exact:true}).waitFor({state:'hidden'});
    await assertGone(page,[a.title]);
    releaseNew();
    await page.getByText(b.title,{exact:true}).waitFor();
    assert.equal(await page.getByText(a.title,{exact:true}).count(),0);
    assert.deepEqual(errors,[]);
  }finally{releaseNew();await context.close();}
});
