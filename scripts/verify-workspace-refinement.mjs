import {spawn} from 'node:child_process';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {chromium} from 'playwright';
const root='http://127.0.0.1:4192',out='artifacts/ux-refinement';
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','4192','--strictPort'],{stdio:'pipe',env:{...process.env,LARAVEL_BYPASS_ENV_CHECK:'1'}});
let output='';for(const stream of [server.stdout,server.stderr])stream.on('data',c=>output+=c);
let browser;const results=[];
try{
 for(let i=0;i<80;i++){try{if((await fetch(root+'/visual-preview.html')).ok)break;}catch{}await new Promise(r=>setTimeout(r,250));}
 browser=await chromium.launch({channel:'chrome'});await mkdir(out,{recursive:true});
 for(const width of (process.env.UX_THEME_ONLY ? [] : [320,390,768,1024,1440])){
  for(const screen of ['dashboard','work','correspondence','records','memoranda','calendar']){
   const page=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'});const errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.route('**/notifications/feed',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({notifications:[],unreadMemoCount:0,pendingMemo:null})}));
   await page.route('**/tasks?*',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({data:[],meta:{page:1,last_page:1,per_page:15,total:0}})}));
   await page.route('**/brand/*.svg', async r=>r.fulfill({contentType:'image/svg+xml',body:await readFile('public'+new URL(r.request().url()).pathname)}));
   await page.route('**/images/talibon/*.svg', async r=>r.fulfill({contentType:'image/svg+xml',body:await readFile('public'+new URL(r.request().url()).pathname)}));
   await page.goto(root+'/visual-preview.html?screen='+screen);await page.locator('#portal-content h1').waitFor();
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
   const oversize=await page.locator('#portal-content').evaluate(e=>[...e.querySelectorAll('*')].filter(x=>x.getBoundingClientRect().right>innerWidth+1).slice(0,8).map(x=>({tag:x.tagName,cls:x.className})));
   if(screen==='dashboard'){
    const link=page.getByRole('link',{name:'Personal tasks',exact:true});await link.focus();await page.keyboard.press('Enter');
    if(!await page.locator('#personal-tasks').evaluate(e=>e===document.activeElement))errors.push('Shortcut did not move focus');
    await page.locator('#personal-tasks').evaluate(e=>e.blur());await page.evaluate(()=>scrollTo(0,0));
   }
   if(screen==='records'&&width===320){
    const button=page.getByRole('button',{name:/^Filters/});await button.click();
    const dialog=page.getByRole('dialog',{name:'Records filters'});
    const controls=dialog.locator('button:visible, input:visible, select:visible');
    await controls.last().focus();await page.keyboard.press('Tab');
    if(!await controls.first().evaluate(e=>e===document.activeElement))errors.push('Filter focus escaped');
    await page.keyboard.press('Escape');
    if(!await button.evaluate(e=>e===document.activeElement))errors.push('Filter focus not restored');
   }
   if(screen==='calendar'){
    const date=page.getByLabel('Choose date');const previous=await date.inputValue();await page.getByRole('button',{name:'Next calendar month'}).click();
    if(await date.inputValue()===previous)errors.push('Month did not change');await page.getByRole('button',{name:'Previous calendar month'}).click();await date.fill(previous);
   }
   await page.screenshot({path:`${out}/${screen}-${width}.png`,fullPage:true});results.push({screen,width,overflow,errors,oversize});console.log(JSON.stringify(results.at(-1)));await page.close();
  }
 }
 for(const role of (process.env.UX_THEME_ONLY ? [] : ['department_head','executive_oversight','system_administration'])){
  const page=await browser.newPage({viewport:{width:320,height:900}});await page.goto(root+'/visual-preview.html?screen=dashboard&role='+role);await page.locator('#portal-content h1').waitFor();
  results.push({role,width:320,overflow:await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)});await page.screenshot({path:`${out}/${role}-320.png`,fullPage:true});await page.close();
 }
 const extra=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});
 await extra.goto(root+'/visual-preview.html?screen=dashboard');await extra.locator('#portal-content h1').waitFor();
 await extra.evaluate(()=>{document.documentElement.classList.add('dark');});
 await extra.screenshot({path:out+'/dashboard-dark.png',fullPage:true});
 await extra.evaluate(()=>{document.documentElement.classList.remove('dark');document.body.style.zoom='2';});
 results.push({scenario:'200-percent-CSS-zoom',overflow:await extra.evaluate(()=>document.documentElement.scrollWidth-innerWidth)});
 await extra.screenshot({path:out+'/dashboard-zoom.png',fullPage:true});await extra.close();
 await writeFile(out+(process.env.UX_THEME_ONLY ? '/theme.json' : '/responsive.json'),JSON.stringify(results,null,2));
 if(results.some(r=>r.overflow>1||r.errors?.length))process.exitCode=1;
}finally{await browser?.close();server.kill();}
