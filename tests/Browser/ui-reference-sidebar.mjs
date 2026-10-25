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
 if (path !== '/login' && path !== '/dashboard') {
 res.setHeader('Content-Type','application/json');
 res.end(JSON.stringify(path === '/tasks' ? {data:[],meta:{page:1,per_page:10,last_page:1,total:0}} : {notifications:[],unreadMemoCount:0,pendingMemo:null,data:[]})); return;
 }
 const fixture = fixturePage(path === '/login' ? 'login' : 'dashboard');
 const data = {...fixture, version:null, clearHistory:false, encryptHistory:false, rescuedProps:[],flash:{},rememberedState:{},props:{...fixture.props,errors:{},flash:{}}};
 const css = new Set([manifest['resources/css/app.css'].file,...(entry.css || [])]);
 res.setHeader('Content-Type','text/html; charset=utf-8');
 res.end(`<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1">${[...css].map(f=>`<link rel="stylesheet" href="/build/${f}">`).join('')}</head><body><script data-page="app" type="application/json">${JSON.stringify(data).replaceAll('<','\\u003c')}</script><div id="app"></div><script type="module" src="/build/${entry.file}"></script></body></html>`);
 } catch(e) {res.writeHead(500);res.end(String(e));}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
let browser;
try {
 try {browser=await chromium.launch({channel:'chrome',headless:true});} catch {browser=await chromium.launch({headless:true});}
 const results=[];
 for(const width of [320,390,1024,1440]) for(const mode of ['light','dark']) {
 const page=await browser.newPage({viewport:{width,height:1000},colorScheme:mode,reducedMotion:'reduce'});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(m=>{localStorage.setItem('talibon.appearance',m);localStorage.removeItem('talibon.sidebar.collapsed');},mode);
 await page.goto(`http://127.0.0.1:${server.address().port}/dashboard`,{waitUntil:'networkidle'});
 if(width<1024) await page.getByRole('button',{name:'Open navigation',exact:true}).click();
 const sidebar=page.locator(width<1024?'.portal-sidebar--mobile':'aside > .portal-sidebar');
 await sidebar.waitFor();
 const links=await sidebar.locator('nav a').evaluateAll(els=>els.map(el=>el.getAttribute('href')));
 const colors=await sidebar.evaluate(el=>({background:getComputedStyle(el).backgroundColor,overflow:el.scrollWidth>el.clientWidth+1}));
 const active=sidebar.locator('a[aria-current="page"]');
 const activeColors=await active.first().evaluate(el=>({background:getComputedStyle(el).backgroundColor,indicator:getComputedStyle(el,'::before').backgroundColor}));
 await page.keyboard.press('Tab'); await active.first().focus();
 const focus=await active.first().evaluate(el=>getComputedStyle(el).outlineStyle!=='none');
 await active.first().blur(); await sidebar.locator('nav').evaluate(el=>el.scrollTop=0);
 await page.evaluate(()=>window.scrollTo(0,0));
 await (width<1024?page.locator('#portal-mobile-navigation'):sidebar).screenshot({path:`storage/app/ui-preview/sidebar-${width}-${mode}.png`,animations:'disabled'});
 let compact=true,tooltip=true,mobileClose=true;
 if(width>=1024) {
 await page.getByRole('button',{name:'Collapse navigation',exact:true}).click();
 await page.locator('.portal-sidebar--compact').waitFor();
 const compactSidebar=page.locator('.portal-sidebar--compact');
 compact=JSON.stringify(links)===JSON.stringify(await compactSidebar.locator('nav a').evaluateAll(els=>els.map(el=>el.getAttribute('href'))));
 await compactSidebar.locator('nav a').first().focus();
 tooltip=await page.getByRole('tooltip').isVisible();
 await compactSidebar.screenshot({path:`storage/app/ui-preview/sidebar-compact-${width}-${mode}.png`});
 await page.getByRole('button',{name:'Expand navigation',exact:true}).click();
 await page.evaluate(()=>window.scrollTo(0,0));
 await page.screenshot({path:`storage/app/ui-preview/dashboard-sidebar-${width}-${mode}.png`,fullPage:true,animations:'disabled'});
 } else {
 await page.keyboard.press('Escape');
 mobileClose=await page.locator('#portal-mobile-navigation').count()===0;
 }
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);
 const row={width,mode,...colors,activeColors,focus,compact,tooltip,mobileClose,overflow,links:links.length,errors};
 results.push(row);console.log(JSON.stringify(row));await page.close();
 }
 await writeFile('storage/app/ui-preview/sidebar-checks.json',JSON.stringify({scope:'Synthetic Inertia preview, not backend QA',results},null,2));
 if(results.some(r=>r.overflow||!r.focus||!r.compact||!r.tooltip||!r.mobileClose||r.errors.length))process.exitCode=1;
} finally {await browser?.close();await new Promise(r=>server.close(r));}
