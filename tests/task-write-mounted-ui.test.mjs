/**
 * A01-F02 real mounted React/Chromium browser with simulated HTTP receipts only.
 * NOT genuine Laravel/PostgreSQL/authentication or production acceptance.
 */
import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {existsSync} from 'node:fs';
import {chromium} from 'playwright';
const origin='http://127.0.0.1:4175';
const pageUrl=origin+'/visual-preview.html?screen=dashboard&role=employee';
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const created=(id,state='open')=>({id,kind:'individual',title:'F02 test-only personal Task',instructions:null,state,
 owning_department_id:null,due_at:null,completed_at:state==='completed'?'2026-10-12T09:00:00+08:00':null,
 created_at:'2026-10-12T08:00:00+08:00',updated_at:'2026-10-12T08:00:00+08:00'});
const response=(value,status=200)=>({status,contentType:'application/json',body:JSON.stringify(value)});
let browser,server,output='';
before(async()=>{
  if(!existsSync(chromium.executablePath())){
    try{browser=await chromium.launch({channel:'chrome',headless:true});}catch{}
  }
  if(!browser&&!existsSync(chromium.executablePath())){
    const installer=spawn(process.execPath,['node_modules/playwright/cli.js','install','chromium'],{stdio:'pipe'});
    let out='';for(const stream of [installer.stdout,installer.stderr])stream.on('data',v=>{out+=String(v);});
    const [status]=await once(installer,'close');
    assert.equal(status,0,'Could not install Chromium: '+out.slice(-1500));
  }
  server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','4175','--strictPort'],
    {stdio:'pipe',env:{...process.env,LARAVEL_BYPASS_ENV_CHECK:'1'}});
  for(const stream of [server.stdout,server.stderr])stream.on('data',v=>{output+=String(v);});
  let ready=false;for(let i=0;i<80;i++){
    if(server.exitCode!==null)throw new Error('Vite exited: '+output.slice(-1000));
    try{if((await fetch(pageUrl)).ok){ready=true;break;}}catch{}
    await sleep(500);
  }
  assert.ok(ready,'Vite failed: '+output.slice(-1600));
  if(!browser)browser=await chromium.launch({headless:true});
});
after(async()=>{
  await browser?.close();
  if(server&&server.exitCode===null){server.kill('SIGTERM');await Promise.race([once(server,'close'),sleep(2500)]);}
});
async function mount(handler,width=390){
  const context=await browser.newContext({viewport:{width,height:820},reducedMotion:'reduce'});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{document.cookie='XSRF-TOKEN=f02-browser-fixture-token; SameSite=Lax';});
  await page.route(/\/tasks(?:\/\d+(?:\/(?:start|complete))?)?(?:\?|$)/,route=>
    handler(new URL(route.request().url()),route));
  await page.goto(pageUrl,{waitUntil:'domcontentloaded',timeout:20000});
  await page.getByRole('heading',{name:'Personal Tasks'}).waitFor();
  return {context,page,errors};
}
test('mounted 390px and desktop: CREATE 201, fresh page, START 200, fresh page, COMPLETE 200, fresh page',async()=>{
  for(const width of [390,1180]){
    let record=null;
    const posts=[],requests=[];
    const {context,page,errors}=await mount(async(u,route)=>{
      const req=route.request();
      requests.push(req.method()+' '+u.pathname+u.search);
      if(req.method()==='POST'){
        posts.push({path:u.pathname,headers:req.headers(),body:req.postDataJSON()});
        if(u.pathname==='/tasks'){
          assert.equal(record,null);record={...created(71),title:req.postDataJSON().title};
          return route.fulfill(response({data:record},201));
        }
        if(u.pathname==='/tasks/71/start'){
          record={...record,state:'in_progress'};
          return route.fulfill(response({data:record},200));
        }
        if(u.pathname==='/tasks/71/complete'){
          record={...record,state:'completed',completed_at:'2026-10-12T09:00:00+08:00'};
          return route.fulfill(response({data:record},200));
        }
        return route.fulfill(response({errors:{request:['unsupported']}},422));
      }
      if(u.pathname==='/tasks'){
        const filtered=record&&u.searchParams.get('state')===record.state?[record]:[];
        return route.fulfill(response({data:filtered,meta:{page:1,per_page:10,total:filtered.length,last_page:1}}));
      }
      if(u.pathname==='/tasks/71')return route.fulfill(record?response({data:record}):response({},404));
      return route.abort();
    },width);
    try{
      await page.getByRole('button',{name:'Create Task'}).first().click();
      const form=page.getByRole('form',{name:'Create personal Task'});
      await form.getByRole('textbox',{name:/Title/}).fill('F02 safe create');
      await form.getByRole('button',{name:'Create Task'}).click();
      await page.getByRole('status').getByText(/created and confirmed by the server/).waitFor();
      // Inertia replaces the preview URL with /dashboard; standalone Vite cannot reload that Laravel route.
      // A fresh navigation to the explicit fixture URL remounts the real component and re-reads HTTP.
      await page.goto(pageUrl,{waitUntil:'domcontentloaded',timeout:20000});
      try {
        await page.getByText('F02 safe create',{exact:true}).first().waitFor({timeout:9000});
      } catch {
        throw new Error('Mounted reload diagnostics: '+JSON.stringify({
          record,requests:requests.slice(-20),body:(await page.locator('body').innerText()).slice(-2600)
        }));
      }
      await page.getByRole('button',{name:/F02 safe create/}).first().click();
      await page.getByRole('button',{name:'Start Task',exact:true}).click();
      await page.getByText(/started and confirmed by the server/).waitFor();
      // Inertia replaces the preview URL with /dashboard; standalone Vite cannot reload that Laravel route.
      // A fresh navigation to the explicit fixture URL remounts the real component and re-reads HTTP.
      await page.goto(pageUrl,{waitUntil:'domcontentloaded',timeout:20000});
      await page.getByRole('button',{name:'In Progress',exact:true}).click();
      await page.getByRole('button',{name:/F02 safe create/}).first().click();
      await page.getByRole('button',{name:'Complete Task',exact:true}).click();
      await page.getByText(/completed and confirmed by the server/).waitFor();
      // Inertia replaces the preview URL with /dashboard; standalone Vite cannot reload that Laravel route.
      // A fresh navigation to the explicit fixture URL remounts the real component and re-reads HTTP.
      await page.goto(pageUrl,{waitUntil:'domcontentloaded',timeout:20000});
      await page.getByRole('button',{name:'Completed',exact:true}).click();
      await page.getByRole('button',{name:/F02 safe create/}).first().click();
      await page.getByText('This Task is completed. No further actions are available.').waitFor();
      assert.deepEqual(posts.map(p=>p.path),['/tasks','/tasks/71/start','/tasks/71/complete']);
      for(const post of posts){
        assert.ok(post.headers['x-xsrf-token']||post.headers['x-csrf-token']);
        assert.equal(post.headers.accept,'application/json');
        assert.equal(post.headers['x-inertia'],undefined);
      }
      assert.deepEqual(posts.slice(1).map(p=>p.body),[{},{}]);
      assert.deepEqual(errors,[]);
    }finally{await context.close();}
  }
});
test('mounted 422 prevents phantom create, 401 on POST clears protected Task data',async()=>{
  let status=422,requests=0;
  const existing={...created(22),title:'F02 restricted fixture row'};
  const {context,page,errors}=await mount(async(u,route)=>{
    if(route.request().method()==='POST'){requests++;return route.fulfill(response(status===422?{errors:{title:['required']}}:{code:'ACCOUNT_INACTIVE'},status));}
    if(u.pathname==='/tasks')return route.fulfill(response({data:[existing],meta:{page:1,per_page:10,total:1,last_page:1}}));
    if(u.pathname==='/tasks/22')return route.fulfill(response({data:existing}));
    return route.abort();
  });
  try{
    await page.getByText(existing.title,{exact:true}).first().waitFor();
    await page.getByRole('button',{name:'Create Task'}).first().click();
    const form=page.getByRole('form',{name:'Create personal Task'});
    await form.getByRole('textbox',{name:/Title/}).fill('Unauthorized input test');
    await form.getByRole('button',{name:'Create Task'}).click();
    await page.getByRole('alert').getByText(/rejected by validation/).waitFor();
    assert.equal(requests,1);
    status=401;
    await page.getByRole('button',{name:/F02 restricted fixture row/}).first().click();
    await page.getByRole('button',{name:'Start Task',exact:true}).click();
    await page.getByRole('alert').getByText(/Personal Tasks unavailable \(401\)/).waitFor();
    await page.getByText(existing.title,{exact:true}).waitFor({state:'hidden'});
    assert.equal(await page.getByRole('form',{name:'Create personal Task'}).count(),0);
    assert.equal(requests,2);
    assert.deepEqual(errors,[]);
  }finally{await context.close();}
});
test('mounted network-unknown POST never reports success or automatically replays',async()=>{
  let posts=0;
  const {context,page,errors}=await mount(async(u,route)=>{
    if(route.request().method()==='POST'){posts++;return route.abort('failed');}
    if(u.pathname==='/tasks')return route.fulfill(response({data:[],meta:{page:1,per_page:10,total:0,last_page:1}}));
    return route.abort();
  });
  try{
    await page.getByRole('button',{name:'Create Task'}).first().click();
    const form=page.getByRole('form',{name:'Create personal Task'});
    await form.getByRole('textbox',{name:/Title/}).fill('Uncertain mutation');
    await form.getByRole('button',{name:'Create Task'}).click();
    await page.getByRole('alert').getByText(/outcome is unknown/i).waitFor();
    assert.equal(await page.getByText(/created and confirmed by the server/).count(),0);
    assert.equal(posts,1);
    assert.equal(await form.getByRole('button',{name:'Create Task'}).isDisabled(),true);
    await page.waitForTimeout(300);
    assert.equal(posts,1);
    assert.deepEqual(errors,[]);
  }finally{await context.close();}
});
