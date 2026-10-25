import { createServer } from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';
const { fixturePage } = await import(pathToFileURL(resolve('tests/Browser/ux-fixtures.ts')));
await mkdir('storage/app/ui-preview',{recursive:true});
const manifest = JSON.parse(await readFile('public/build/manifest.json', 'utf8'));
const entry = manifest['resources/js/app.tsx'];
const server = createServer(async (req,res) => {
 try {
 const path = new URL(req.url, 'http://localhost').pathname;
 if (/^\/(build|images|brand|logos)\//.test(path) && !path.includes('..')) {
 const mime = {'.js':'text/javascript','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.woff2':'font/woff2'};
 res.setHeader('Content-Type',mime[extname(path)] || 'application/octet-stream');
 res.end(await readFile(`public${path}`)); return;
 }
 if (path !== '/login' && path !== '/dashboard' && path !== '/transactions') {
 res.setHeader('Content-Type','application/json');
 res.end(JSON.stringify(path === '/tasks' ? {data:[],meta:{page:1,per_page:10,last_page:1,total:0}} : {notifications:[],unreadMemoCount:0,pendingMemo:null,data:[]})); return;
 }
  const fixture = fixturePage(path === '/login' ? 'login' : path === '/transactions' ? 'work' : 'dashboard');
 if(path==='/transactions') Object.assign(fixture.props,{experience:{profile:'employee',department:{id:1,code:'SAMPLE',name:'Sample Office'},hasOfficeScope:false},scopeGroups:[],staffWorkload:[],filters:{view:'all',search:'',status:'',priority:'',office_id:null},filterOptions:{statuses:[],priorities:[],offices:[]}});
 const data = {...fixture, version:null, clearHistory:false, encryptHistory:false, rescuedProps:[],flash:{},rememberedState:{},props:{...fixture.props,errors:{},flash:{}}};
 const css = new Set([manifest['resources/css/app.css'].file,...(entry.css || [])]);
 res.setHeader('Content-Type','text/html; charset=utf-8');
 res.end(`<!doctype html><html lang="en"><head><meta name="csrf-token" content="fixture-token"><meta name="viewport" content="width=device-width,initial-scale=1">${[...css].map(f=>`<link rel="stylesheet" href="/build/${f}">`).join('')}</head><body><script data-page="app" type="application/json">${JSON.stringify(data).replaceAll('<','\\u003c')}</script><div id="app"></div><script type="module" src="/build/${entry.file}"></script></body></html>`);
 } catch(e) {res.writeHead(500);res.end(String(e));}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
let browser;
try {
 try {browser=await chromium.launch({channel:'chrome',headless:true});} catch {browser=await chromium.launch({headless:true});}
 const task=(id,title,state)=>({id,kind:'individual',title,instructions:'Preview task instructions',state,owning_department_id:null,due_at:'2026-10-30T09:00:00+08:00',completed_at:state==='completed'?'2026-10-26T09:00:00+08:00':null,created_at:'2026-10-26T08:00:00+08:00',updated_at:'2026-10-26T08:00:00+08:00'});
 const seed=()=>[task(1,'Review sample planning inputs','open'),task(2,'Prepare sample budget summary','open'),task(3,'Review sample project profile','in_progress'),task(4,'Check sample meeting readiness','completed')];
 async function mock(page) {
 const state={tasks:seed(),denied:false};
 await page.route(url=>url.pathname==='/tasks'||url.pathname.startsWith('/tasks/'),async route=>{
 const req=route.request(),u=new URL(req.url());
 const send=(data,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(data)});
 if(state.denied)return send({code:'FORBIDDEN'},403);
 const match=u.pathname.match(/^\/tasks\/(\d+)(?:\/(start|complete))?$/);
 if(req.method()==='POST') {
 if(req.headers()['x-csrf-token']!=='fixture-token')return send({code:'CSRF'},419);
 let item;
 if(match){item=state.tasks.find(t=>t.id===Number(match[1]));item.state=match[2]==='start'?'in_progress':'completed';}
 else {item=task(100,JSON.parse(req.postData()).title,'open');state.tasks.unshift(item);}
 return send({data:item});
 }
 if(match)return send({data:state.tasks.find(t=>t.id===Number(match[1]))});
 const filter=u.searchParams.get('state'),pageNumber=Number(u.searchParams.get('page')||1),perPage=Number(u.searchParams.get('per_page')||10);
 const rows=state.tasks.filter(t=>!filter||t.state===filter);
 return send({data:rows.slice((pageNumber-1)*perPage,pageNumber*perPage),meta:{page:pageNumber,per_page:perPage,total:rows.length,last_page:Math.max(1,Math.ceil(rows.length/perPage))}});
 });return state;
 }
 const results=[];
 for(const width of [320,390,768,1440])for(const mode of ['light','dark']){
 const page=await browser.newPage({viewport:{width,height:1000},colorScheme:mode,reducedMotion:'reduce'});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(m=>localStorage.setItem('talibon.appearance',m),mode);
 await mock(page);
 await page.goto(`http://127.0.0.1:${server.address().port}/transactions`,{waitUntil:'networkidle'});
 // The Work Requests page deliberately keeps Personal Tasks collapsed by default.
 await page.getByText('Personal Tasks — separate from Work Requests (expand to manage)',{exact:true}).click();
 await page.locator('.personal-task-board .task-row').first().waitFor();
 const board=page.locator('.personal-task-board');
 const row={width,mode,columns:await board.locator('.task-board-column').count(),cards:await board.locator('.task-row').count(),overflow:await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),errors};
 await page.evaluate(()=>window.scrollTo(0,0));
 await page.screenshot({path:`storage/app/ui-preview/tasks-${width}-${mode}.png`,fullPage:true,animations:'disabled'});
 results.push(row);console.log(JSON.stringify(row));await page.close();
 }
 const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
 const state=await mock(page);
 await page.goto(`http://127.0.0.1:${server.address().port}/dashboard`,{waitUntil:'networkidle'});
 await page.locator('.r7-task-expand').click();
 await page.locator('.personal-task-board .task-row').first().waitFor();
 const board=page.locator('.personal-task-board');
 await board.locator('.task-row').first().click();
 await board.getByRole('region',{name:'Personal Task detail',exact:true}).waitFor();
 await board.getByRole('button',{name:'Back to tasks',exact:true}).click();
 await board.locator('.task-row[aria-pressed="true"]').waitFor({state:'hidden'});
 await board.getByRole('link',{name:'+ Add task',exact:true}).click();
 await board.getByRole('textbox',{name:'New personal Task title',exact:true}).fill('Created from board preview');
 await board.getByRole('button',{name:'Create Task',exact:true}).click();
 await board.locator('.task-row').filter({hasText:'Created from board preview'}).waitFor();
 const action=board.locator('[aria-label="Personal Task actions list"] > li').filter({hasText:'Created from board preview'});
 await action.getByRole('button',{name:'Start',exact:true}).click();
 await board.locator('.task-board-column').nth(1).locator('.task-row').filter({hasText:'Created from board preview'}).waitFor();
 await action.getByRole('button',{name:'Complete',exact:true}).click();
 await board.locator('.task-board-column').nth(2).locator('.task-row').filter({hasText:'Created from board preview'}).waitFor();
 state.tasks.push(...Array.from({length:10},(_,i)=>task(20+i,'Pagination fixture '+i,'open')));
 const todo=board.locator('.task-board-column').first();
 await todo.getByRole('button',{name:'Refresh To do Tasks',exact:true}).click();
 await todo.getByRole('button',{name:'Next To do Task page',exact:true}).click();
 await page.waitForFunction(()=>document.querySelector('.task-board-column nav')?.textContent?.includes('Page 2'));
 state.denied=true;
 await board.locator('.task-board-column').nth(1).getByRole('button',{name:'Refresh In progress Tasks',exact:true}).click();
 await board.getByRole('alert').waitFor();
 if(await board.locator('.task-row').count()!==0)throw new Error('Revoked board retained cached rows');
 console.log('PASS: dashboard mount, detail/back, create/start/complete confirmation, independent pagination, whole-board revocation.');
 await writeFile('storage/app/ui-preview/task-board-checks.json',JSON.stringify({scope:'Synthetic API/browser fixtures; not real backend QA',results,interactions:'PASS'},null,2));
 if(results.some(r=>r.columns!==3||r.cards!==4||r.overflow||r.errors.length))process.exitCode=1;
 await page.close();
} finally {await browser?.close();await new Promise(r=>server.close(r));}
