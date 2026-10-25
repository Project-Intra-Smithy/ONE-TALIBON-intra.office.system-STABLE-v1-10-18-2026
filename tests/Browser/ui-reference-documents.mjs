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
 if (path !== '/login' && path !== '/dashboard' && path !== '/documents') {
 res.setHeader('Content-Type','application/json');
 res.end(JSON.stringify(path === '/tasks' ? {data:[],meta:{page:1,per_page:10,last_page:1,total:0}} : {notifications:[],unreadMemoCount:0,pendingMemo:null,data:[]})); return;
 }
  const fixture = fixturePage(path==='/documents'?'records':path==='/login'?'login':'dashboard');
 if(path==='/documents') {
 const params = new URL(req.url,'http://localhost').searchParams;
 fixture.component='Documents/Index';fixture.url=req.url;
 const rows=['Office coordination brief','Project monitoring update','Meeting action record'].map((title,i)=>({...fixture.props.records.data[0],title,reference:'DEMO-DOC-00'+(i+1),detailUrl:'/transactions/'+(i+1)}));
 fixture.props.records.data=rows.filter(r=>r.title.toLowerCase().includes((params.get('search')||'').toLowerCase()));fixture.props.records.total=fixture.props.records.data.length;
 fixture.props.mode=params.get('mode')==='files'?'files':'records';
 Object.assign(fixture.props.filters,{search:params.get('search')||'',record_type:params.get('record_type')||'all',state:params.get('state')||'',office_id:null,date_from:'',date_to:''});
 const file={publicId:'fixture-file',name:'Sample-office-brief.txt',title:'Sample office brief',documentType:'Office document',documentTypeValue:'office_document',classification:'Internal',classificationValue:'internal',sizeBytes:512,uploadedBy:'Preview Employee',uploadedByMe:true,uploadedAt:'2026-10-26T08:00:00+08:00',relationship:'Attached to sample record',direction:'upload',downloadUrl:'/documents/fixture-file/download'};
 fixture.props.archive={records:{data:[file],total:1,current_page:1,last_page:1,per_page:20},selected:params.get('document')?file:null,counts:{all:1,my_sent:0,my_received:0,my_uploads:1},filters:{archive_scope:'all',archive_search:'',document_type:'',classification:'',archive_office_id:null,archive_year:'',document:params.get('document')},filterOptions:{documentTypes:[],classifications:[],years:[],offices:[]}};
 }
 const data = {...fixture, version:null, clearHistory:false, encryptHistory:false, rescuedProps:[],flash:{},rememberedState:{},props:{...fixture.props,errors:{},flash:{}}};
 if(req.headers['x-inertia']) {res.writeHead(200,{'Content-Type':'application/json','X-Inertia':'true',Vary:'X-Inertia'});res.end(JSON.stringify(data));return;} const css = new Set([manifest['resources/css/app.css'].file,...(entry.css || [])]);
 res.setHeader('Content-Type','text/html; charset=utf-8');
 res.end(`<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1">${[...css].map(f=>`<link rel="stylesheet" href="/build/${f}">`).join('')}</head><body><script data-page="app" type="application/json">${JSON.stringify(data).replaceAll('<','\\u003c')}</script><div id="app"></div><script type="module" src="/build/${entry.file}"></script></body></html>`);
 } catch(e) {res.writeHead(500);res.end(String(e));}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
let browser;
try {
 try {browser=await chromium.launch({channel:'chrome',headless:true});} catch {browser=await chromium.launch({headless:true});}
 const results=[];
 for(const width of [320,390,768,1440])for(const mode of ['light','dark']){
 const page=await browser.newPage({viewport:{width,height:1000},colorScheme:mode,reducedMotion:'reduce'});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(m=>localStorage.setItem('talibon.appearance',m),mode);
 await page.goto(`http://127.0.0.1:${server.address().port}/documents`,{waitUntil:'networkidle'});
 await page.locator('.dc-record').first().waitFor();
 const root=page.locator('.document-center-refinement');
 const row={width,mode,records:await root.locator('.dc-record').count(),overflow:await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),errors};
 await page.screenshot({path:`storage/app/ui-preview/documents-${width}-${mode}.png`,fullPage:true,animations:'disabled'});
 await root.locator('.dc-mobile-preview').first().click();
 await root.locator('.dc-inline-metadata [aria-label="Selected document metadata"]').waitFor();
 if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1))throw new Error('Preview overflows');
 await root.locator('.dc-inline-metadata').getByRole('button',{name:'Close document metadata',exact:true}).click();
 await root.getByRole('searchbox',{name:'Search authorized records',exact:true}).fill('Office');
 await root.getByRole('button',{name:'Search',exact:true}).click();
 await page.waitForFunction(()=>document.querySelectorAll('.dc-record').length===1);
 await root.getByRole('button',{name:'Reset',exact:true}).click();
 await page.waitForFunction(()=>document.querySelectorAll('.dc-record').length===3);
 await page.goto(`http://127.0.0.1:${server.address().port}/documents?mode=files`,{waitUntil:'networkidle'});
 await page.locator('.document-center-file-list article').waitFor();
 const download=await page.locator('.document-center-file-list article .document-center-download').getAttribute('href');
 if(download!=='/documents/fixture-file/download')throw new Error('Download destination changed');
 const fileOverflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);
 await page.locator('.document-center-file-list article').getByRole('button',{name:'Details',exact:true}).click();
 await page.getByRole('link',{name:'Download',exact:true}).last().waitFor();
 await page.evaluate(()=>window.scrollTo(0,0));
 await page.screenshot({path:`storage/app/ui-preview/document-files-${width}-${mode}.png`,fullPage:true,animations:'disabled'});
 results.push({...row,fileOverflow,searchAndReset:true,preview:true,download});console.log(JSON.stringify(results.at(-1)));await page.close();
 }
 await writeFile('storage/app/ui-preview/documents-checks.json',JSON.stringify({scope:'Synthetic Inertia fixture data, no live backend verification',results},null,2));
 if(results.some(r=>r.overflow||r.fileOverflow||r.errors.length||r.records!==3))process.exitCode=1;
} finally {await browser?.close();await new Promise(r=>server.close(r));}
