/** Real Login + Inertia, synthetic intercepted transport; no Laravel session or CSRF acceptance. */
import test, {before, after} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdir} from 'node:fs/promises';
import {chromium} from 'playwright';
const root='http://127.0.0.1:4176';
let server,browser;
before(async()=>{
 server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','4176','--strictPort'],{stdio:'pipe',env:{...process.env,LARAVEL_BYPASS_ENV_CHECK:'1'}});
 let output='';
 for(const stream of [server.stdout,server.stderr])stream.on('data',chunk=>output+=chunk);
 for(let i=0;i<80;i++){
  if(server.exitCode!==null)throw Error(output);
  try{if((await fetch(root+'/visual-preview.html')).ok)break;}catch{}
  await new Promise(r=>setTimeout(r,250));
 }
 try{browser=await chromium.launch({channel:'chrome'});}catch{browser=await chromium.launch();}
 await mkdir('artifacts/visual-fixture/login',{recursive:true});
});
after(async()=>{await browser?.close();server?.kill();});
async function mount(width=390){
 const page=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'});
 await page.goto(root+'/visual-preview.html?screen=login');
 await page.getByRole('heading',{name:'Employee Portal'}).waitFor();
 return page;
}
test('login: required fields, keyboard order, exact Inertia payload, pending and server errors',async()=>{
 const page=await mount();
 let release,requestCount=0;
 const gate=new Promise(r=>release=r);
 let received;
 await page.route('**/login',async route=>{
  requestCount++;
  received=route.request();
  await gate;
  await route.fulfill({status:200,contentType:'application/json',headers:{'X-Inertia':'true'},body:JSON.stringify({component:'Auth/Login',props:{errors:{email:'These credentials do not match our records.',password:'Synthetic password validation error.'}},url:'/login',version:null,clearHistory:false,encryptHistory:false})});
 });
 try{
  const email=page.getByLabel('Email',{exact:true}),password=page.getByLabel('Password',{exact:true});
  assert.equal(await email.getAttribute('autocomplete'),'username');
  assert.equal(await password.getAttribute('type'),'password');
  assert.equal(await password.getAttribute('autocomplete'),'current-password');
  const submit=page.getByRole('button',{name:'Sign in',exact:true});
  await submit.click();
  assert.equal(requestCount,0);
  assert.equal(await email.evaluate(e=>e.validity.valueMissing),true);
  await email.fill('employee@example.invalid');
  await submit.click();
  assert.equal(await password.evaluate(e=>e.validity.valueMissing),true);
  assert.equal(requestCount,0);
  await email.focus();
  await page.keyboard.press('Tab');
  assert.equal(await password.evaluate(e=>e===document.activeElement),true);
  await password.fill('synthetic-test-only');
  await page.keyboard.press('Tab');
  const remember=page.getByRole('checkbox');
  assert.equal(await remember.evaluate(e=>e===document.activeElement),true);
  await page.keyboard.press('Space');
  await page.keyboard.press('Tab');
  assert.equal(await submit.evaluate(e=>e===document.activeElement),true);
  assert.equal(await submit.evaluate(e=>getComputedStyle(e).outlineStyle),'solid');
  await page.keyboard.press('Enter');
  await page.getByRole('button',{name:'Signing in…'}).waitFor();
  assert.equal(await email.isDisabled(),true);
  assert.equal(await password.isDisabled(),true);
  assert.equal(await remember.isDisabled(),true);
  assert.equal(await page.getByRole('button',{name:'Signing in…'}).isDisabled(),true);
  assert.equal(await page.getByRole('status').textContent(),'Signing in. Please wait.');
  assert.equal(received.method(),'POST');
  assert.equal(received.headers()['x-inertia'],'true');
  assert.deepEqual(received.postDataJSON(),{email:'employee@example.invalid',password:'synthetic-test-only',remember:true});
  assert.equal(requestCount,1);
  release();
  await page.getByText('These credentials do not match our records.').waitFor();
  for(const [field,id] of [[email,'login-email-error'],[password,'login-password-error']]){
   assert.equal(await field.getAttribute('aria-invalid'),'true');
   assert.equal(await field.getAttribute('aria-describedby'),id);
   assert.equal(await page.locator('#'+id).getAttribute('role'),'alert');
  }
  assert.equal(await submit.isEnabled(),true);
  assert.equal(await page.getByRole('button',{name:'Continue with Google'}).isDisabled(),true);
  await page.screenshot({path:'artifacts/visual-fixture/login/validation-390.png',fullPage:true});
 }finally{release();await page.close();}
});
for(const width of [320,390,768,1440])test(`login: ${width}px responsive fixture`,async()=>{
 const page=await mount(width);
 try{
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  assert.equal(await page.getByRole('link').filter({hasText:/forgot|register|activate/i}).count(),0);
  await page.screenshot({path:`artifacts/visual-fixture/login/after-${width}.png`,fullPage:true});
 }finally{await page.close();}
});
test('login: 200% content zoom and opaque fallback',async()=>{
 const page=await mount(768);
 try{
  await page.addStyleTag({content:'.employee-login {zoom:2} .employee-login__panel {backdrop-filter:none;background:#fff}'});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.getByRole('button',{name:'Sign in',exact:true}).scrollIntoViewIfNeeded();
  await page.screenshot({path:'artifacts/visual-fixture/login/zoom-200-fallback.png',fullPage:true});
 }finally{await page.close();}
});
