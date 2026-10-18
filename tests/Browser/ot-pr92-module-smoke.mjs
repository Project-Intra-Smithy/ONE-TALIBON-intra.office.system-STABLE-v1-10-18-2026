// R10 H01-H06: test-only, unpublished executable source. NO MFA enrollment or application writes.
// Offline controls: node tests/Browser/ot-pr92-module-smoke.mjs --offline-self-test
// Evidence validation: node tests/Browser/ot-pr92-module-smoke.mjs --audit-artifacts
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';

const APP='88f3d6bd6258d502f1b5e6bf323bcf22619f5f8d';
const TREE='297a0a064d1e45672cf48609579bf7ba74e2db24';
const BASE=process.env.QA_BASE_URL || 'http://127.0.0.1:8000';
const ROOT='storage/app/qa/ot-pr92-module-smoke';
const FIXTURE_PATH=path.join(process.env.RUNNER_TEMP || '/tmp','ot92-fixtures.json');
const ALLOWED=['preflight.json','database-version.json','runtime-versions.json','results.json','cleanup.json','SHA256SUMS'];
const REFS={correspondence:'TAL-CORR-F4-0001',transaction:'TAL-F5-QA-REPORT-0001',records:'TAL-F5-QA-REPORT-0001'};
const SPECS=[
 {id:'AC01',name:'Correspondence',actor:'department_head',url:'/correspondence?view=all&search=TAL-CORR-F4-0001',component:'Correspondence/Index',title:/Correspondence/i,keys:['records','overview','filters'],nav:'VISIBLE',ceiling:'PARTIAL',missing:['Independent attachment/foreign-office fixture coverage']},
 {id:'AC02',name:'Work Requests',actor:'department_head',url:'/transactions?view=all&search=TAL-F5-QA-REPORT-0001',component:'Transactions/Index',title:/My Work/i,keys:['records','scopeGroups','filterOptions'],nav:'VISIBLE',ceiling:'PARTIAL',missing:['Extended owner/attachment matrix and security G1/G2']},
 {id:'AC03',name:'Memoranda',actor:'department_head',url:'/memoranda',component:'Memoranda/Index',title:/Memoranda/i,keys:['memoranda','authority','view'],nav:'VISIBLE',ceiling:'BLOCKED_SIDE_EFFECT',missing:['First-read GET changes viewed_at; authorized issuer-only read not proven']},
 {id:'AC04',name:'Records',actor:'department_head',url:'/records?view=all&record_type=transaction&search=TAL-F5-QA-REPORT-0001',component:'Records/Index',title:/Records/i,keys:['records','filters','filterOptions'],nav:'VISIBLE',ceiling:'BLOCKED_FIXTURE',missing:['Foreign protected Records pair absent']},
 {id:'AC05',name:'Document Center',actor:'department_head',url:'/documents?mode=files',component:'Documents/Index',title:/Document Center/i,keys:['archive','records','mode'],nav:'STAGED_HIDDEN',ceiling:'BLOCKED_FIXTURE',missing:['Protected document download allow/deny fixture pair absent']},
 {id:'AC06',name:'Employees',actor:'employee',url:'/employees?q=DEMO-0008',component:'Employees/Index',title:/Employee Directory/i,keys:['employees','summary','filters'],nav:'VISIBLE',ceiling:'PARTIAL',missing:['Full private fields and role-permission matrix not certified']},
 {id:'AC07',name:'Departments',actor:'employee',url:'/departments',component:'Departments/Index',title:/Municipal Offices/i,keys:['departments','summary'],nav:'VISIBLE',ceiling:'BLOCKED_POLICY',missing:['Head workflow authority-pending placeholder']},
 {id:'AC08',name:'Calendar',actor:'department_head',url:'/calendar?view=week&date=2026-09-25',component:'Calendar/Index',title:/Events, deadlines|Calendar/i,keys:['events','calendar'],nav:'VISIBLE',ceiling:'BLOCKED_FIXTURE',missing:['Foreign restricted event pair and timezone authorization absent']},
 {id:'AC09',name:'Search Portal',actor:'department_head',url:'/portal-search',component:'Search/Index',title:/Universal Search/i,keys:['archiveActivity'],nav:'STAGED_HIDDEN',ceiling:'BLOCKED_PROVENANCE',missing:['Live archive URL, source and ownership provenance not certified']},
 {id:'AC10',name:'Messaging',actor:'employee',url:'/messages',component:'Messages/Index',title:/Chats/i,keys:[],nav:'STAGED_HIDDEN',ceiling:'BLOCKED_POLICY',missing:['LGU channel membership / authorized audience not defined; GET only']},
 {id:'AC11',name:'Administration',actor:'system_admin',url:'/admin?status=active&search=employee%40talibon.demo',component:'Admin/Index',title:/Accounts & Access/i,keys:['registry','overview','security'],nav:'STAGED_HIDDEN',ceiling:'PARTIAL',missing:['Privileged pre-enrolled synthetic MFA fixture and full registry controls require separate approval']},
];
const EMAIL={department_head:'engineering@talibon.demo',employee:'employee@talibon.demo',system_admin:'admin@talibon.demo'};
const OUT={schema:'ot-pr92-module-smoke/10',appSha:APP,appTree:TREE,qaCommit:null,smokeCoverage:'NOT_RUN',fullAcAcceptance:'NOT_RUN',runtime:{},auth:[],databaseProof:{},ac:SPECS.map(s=>({id:s.id,actor:s.actor,route:s.url,outcome:'NOT_RUN',smoke:'NOT_RUN',ceiling:s.ceiling,missing:s.missing,checks:[],httpStatus:null,component:null,nav:'NOT_RUN'})),responsive:[],navigation:[],failure:'NONE',gates:['G1_G2_NOT_PROVEN','MUNICIPAL_CHANNEL_POLICY_HOLD','MFA_ENROLLMENT_DENIED_BY_DEFAULT']};
const rowFor=id=>OUT.ac.find(x=>x.id===id);
function checked(r,name,value){r.checks.push({name,ok:value===true});return value===true}
function pathOnly(url){try{return new URL(url,BASE).pathname}catch{return 'INVALID_PATH'}}
function sanitizeStatus(status){return Number.isInteger(status)&&status>=100&&status<=599?status:null}
function safeComponent(value){return SPECS.some(x=>x.component===value)||['Correspondence/Show','Transactions/Show','Employees/Show','Departments/Workspace'].includes(value)?value:null}
const SAFE_LOGIN_CODES=new Set(['LOGIN_GET_STATUS','LOGIN_FORM_TIMEOUT','LOGIN_LOCATOR_AMBIGUOUS','LOGIN_FORM_DISABLED','LOGIN_POST_STATUS','LOGIN_REDIRECT_TIMEOUT','LOGIN_UNEXPECTED_EMPLOYEE_MFA','AUTH_SESSION_UNESTABLISHED']);
function safeFailure(error){const m=String(error?.message||'');if(m==='BLOCKED_SYNTHETIC_MFA_ENROLLMENT_NOT_AUTHORIZED'||m==='BLOCKED_EXISTING_MFA_NOT_PROVISIONED')return m;
 if(SAFE_LOGIN_CODES.has(m)||m==='R17_GATE_INCOMPATIBILITY')return m;
 if(m.startsWith('P0_'))return 'P0_PROTECTED_DATA_EXPOSURE';
 if(/LOGIN_|AUTH_|selector|waiting for|Timeout|page.goto|sign in/i.test(m))return 'FAIL_AUTH';
 return 'INFRA_FAIL';}
function classifyLogin(error){const code=safeFailure(error);if(code.startsWith('BLOCKED_'))return {outcome:'BLOCKED_MFA',code};
 return {outcome:SAFE_LOGIN_CODES.has(code)||code==='FAIL_AUTH'?'FAIL_AUTH':'INFRA_FAIL',code};}
function pagedRows(props,key='records'){const x=props?.[key];if(!x||!Array.isArray(x.data)||!Number.isInteger(x.total)||x.total<x.data.length)return null;return x.data;}
function exactRow(rows,identity,required){if(!Array.isArray(rows)||!identity||!required||typeof required!=='object')return false;
  return rows.some(r=>r&&typeof r==='object'&&r[identity.key]===identity.value&&Object.entries(required).every(([k,v])=>r[k]===v));}
function inboxMatch(props,fixture){const rows=pagedRows(props);return exactRow(rows,{key:'publicId',value:fixture.correspondence.publicId},{reference:fixture.correspondence.reference,subject:fixture.correspondence.subject,lifecycleState:fixture.correspondence.state})&&rows.some(r=>r.publicId===fixture.correspondence.publicId&&Number(r.currentOffice?.id)===fixture.correspondence.officeId&&r.sender?.source===fixture.correspondence.source);}
function queueMatch(props,fixture){const rows=pagedRows(props);const f=fixture.transaction;return exactRow(rows,{key:'id',value:f.id},{reference:f.reference,title:f.title,status:f.status,transactionType:f.type})&&rows.some(r=>r.id===f.id&&Number(r.currentOffice?.id)===f.officeId&&Number(r.originOffice?.id)===f.originOfficeId&&r.assignedEmployee?.name===f.assigneeName);}
function recordsMatch(props,fixture){const rows=pagedRows(props);const f=fixture.transaction;return exactRow(rows,{key:'reference',value:f.reference},{recordType:'transaction',title:f.title,state:f.status})&&rows.some(r=>r.reference===f.reference&&r.currentOffice?.code===f.officeCode);}
function negativeControl(props,needle){const rows=pagedRows(props);return !!(rows&&props.filters?.search===needle&&rows.length===0&&props.records.total===0)&&!exactRow(rows,{key:'reference',value:needle},{});}
async function probeEchoedFilter(page,row,route){const needle='OT92-NO-AUTHORIZED-ROW-R10';const q=route+(route.includes('?')?'&':'?')+'search='+needle;const r=await openPage(page,q);checked(row,'no_echoed_filter_false_positive',r.status===200&&negativeControl(r.props,needle)&&!exactRow(pagedRows(r.props),{key:'reference',value:needle},{}));}
function correspondenceDetail(props,fixture){const c=props?.correspondence,f=fixture.correspondence;if(!c||!f||!Array.isArray(props.timeline)||!props.evidence||!Array.isArray(props.evidence.record))return false;
  return c.publicId===f.publicId&&c.reference===f.reference&&c.lifecycleState===f.state&&c.classification===f.classification&&c.content?.subject===f.subject&&c.content?.summary===f.summary&&c.source?.source===f.source&&c.source?.channel===f.channel&&c.accountability?.currentOffice?.code===f.officeCode&&c.accountability?.receivingOffice?.code===f.officeCode&&c.accountability?.workflow===null&&['canRegister','canClassify','canRoute','canAct'].every(k=>typeof props.capabilities?.[k]==='boolean'&&props.capabilities[k]===f.capabilities[k])&&Array.isArray(props.routeOptions)&&(!props.capabilities.canRoute?props.routeOptions.length===0:true)&&sameIds(props.evidence.record.map(x=>x.publicId),f.evidenceIds);}
function transactionDetail(props,fixture){const t=props?.transaction,f=fixture.transaction,p=props?.transactionPermissions;
  return t&&Number(t.id)===f.id&&t.reference_no===f.reference&&t.title===f.title&&t.status===f.status&&t.transaction_type===f.type&&Number(t.current_department_id)===f.officeId&&Number(t.origin_department_id)===f.originOfficeId&&Number(t.assigned_employee_id)===f.assigneeEmployeeId&&Number(t.assigned_to_user_id)===f.assigneeUserId&&t.assigned_employee?.full_name===f.assigneeName&&['canTransition','canMayorDecision','canAssign'].every(k=>typeof p?.[k]==='boolean'&&p[k]===f.permissions[k])&&props.accountability&&Array.isArray(props.evidence?.record)&&sameIds(props.evidence.record.map(x=>x.publicId),f.evidenceIds);}
function sameIds(actual,expected){return Array.isArray(actual)&&Array.isArray(expected)&&actual.every(x=>typeof x==='string')&&JSON.stringify([...actual].sort())===JSON.stringify([...expected].sort())}
function conclude(ac){if(ac.some(x=>x.outcome==='FAIL'||x.outcome==='FAIL_AUTH'||x.outcome==='INFRA_FAIL'))return 'FAIL';if(ac.some(x=>x.outcome==='NOT_RUN'))return 'NOT_RUN';return 'PARTIAL';}
function allAcAccepted(ac){return ac.length===11&&ac.every(x=>x.outcome==='FULL_AC_PASS'&&x.missing.length===0)}
function noLeaks(text){return !(/APP_KEY|QA_DEMO_PASSWORD|PROTOTYPE_DEMO_PASSWORD|BEGIN PRIVATE KEY|session_cookie|laravel_session|recovery.code|<html|<body|Bearer\s|[A-Za-z0-9_]{40,}@/i.test(text));}
async function auditArtifacts(dir=ROOT){const children=await fs.readdir(dir,{withFileTypes:true});const names=children.map(x=>x.name).sort();assert.deepEqual(names,[...ALLOWED].sort());assert(children.every(x=>x.isFile()&&!x.isSymbolicLink()));
 const contents={};for(const name of ALLOWED){const bytes=await fs.readFile(path.join(dir,name));assert(bytes.length<300000);const str=bytes.toString('utf8');assert(Buffer.from(str,'utf8').equals(bytes));assert(noLeaks(str));if(name!=='SHA256SUMS')assert(!/\b[a-f0-9]{64}\b/i.test(str));contents[name]=str;}
 const cleanup=JSON.parse(contents['cleanup.json']);assert.equal(cleanup.state,'PASS');assert.equal(cleanup.credentialsAbsent,true);assert.equal(cleanup.fixtureAbsent,true);assert.equal(cleanup.sessionsAbsent,true);assert.equal(cleanup.envAbsent,true);
 const pre=JSON.parse(contents['preflight.json']);assert.equal(pre.state,'PASS');for(const name of ['results.json','database-version.json','runtime-versions.json'])JSON.parse(contents[name]);
 const results=JSON.parse(contents['results.json']);assert.deepEqual(Object.keys(results).sort(),Object.keys(OUT).sort());assert(Array.isArray(results.ac)&&results.ac.length===11);assert(results.ac.every(x=>x.checks.every(y=>Object.keys(y).sort().join(',')==='name,ok')));
 assert(ALLOWED.every(n=>!/\.png$|\.trace$|\.log$|\.html$/.test(n)));
 const sums=contents.SHA256SUMS.trim().split('\n');assert.equal(sums.length,ALLOWED.length-1);const expected=[];for(const name of ALLOWED.filter(x=>x!=='SHA256SUMS').sort())expected.push(`${crypto.createHash('sha256').update(contents[name]).digest('hex')}  ${name}`);assert.deepEqual(sums,expected);
 return true;}
async function offlineSelfTest(){let n=0;const mustReject=(name,fn)=>{assert.equal(fn(),false,name);n++;};const fake={records:{data:[],total:0},filters:{search:REFS.transaction}};
 mustReject('H01 echoed query cannot match row',()=>recordsMatch(fake,{transaction:{reference:REFS.transaction}}));
 assert.equal(negativeControl(fake,REFS.transaction),true);n++;
 mustReject('H01 non-paged list cannot match',()=>inboxMatch({records:[],filters:{search:REFS.correspondence}},{correspondence:{publicId:'x'}}));
 const f={correspondence:{publicId:'f4000000-0000-4000-8000-000000000001',reference:REFS.correspondence,state:'classified',classification:'internal',subject:'X',summary:'Y',source:'official_email',channel:'email',officeCode:'ENG',capabilities:{canRegister:false,canClassify:false,canRoute:true,canAct:false},evidenceIds:[]}};
 const dp={correspondence:{publicId:'WRONG',reference:REFS.correspondence,lifecycleState:'classified',classification:'internal',content:{subject:'X',summary:'Y'},source:{source:'official_email',channel:'email'},accountability:{currentOffice:{code:'ENG'},receivingOffice:{code:'ENG'},workflow:null}},capabilities:f.correspondence.capabilities,evidence:{record:[]},timeline:[],routeOptions:[]};
 mustReject('H02 wrong correspondence identity',()=>correspondenceDetail(dp,f));
 const t={transaction:{id:42,reference:REFS.transaction,title:'X',status:'for_review',type:'document_review',officeId:2,originOfficeId:2,assigneeEmployeeId:7,assigneeUserId:5,assigneeName:'Example',permissions:{canTransition:false,canMayorDecision:false,canAssign:false},evidenceIds:[]}};
 mustReject('H02 wrong transaction id',()=>transactionDetail({transaction:{id:43},transactionPermissions:t.transaction.permissions,evidence:{record:[]}},t));
 assert.equal(classifyLogin(new Error('LOGIN_GET_STATUS')).outcome,'FAIL_AUTH');n++;
  assert.equal(classifyLogin(new Error('LOGIN_FORM_TIMEOUT')).code,'LOGIN_FORM_TIMEOUT');n++;
  assert.equal(classifyLogin(new Error('LOGIN_UNEXPECTED_EMPLOYEE_MFA')).outcome,'FAIL_AUTH');n++;
  const seen=[];const mock={locator(s){seen.push(s);return {waitFor:async o=>{assert.equal(o.state,'visible');assert.equal(o.timeout,10000);},count:async()=>1,isEnabled:async()=>true};}};
  const controls=await exactLoginControls(mock);assert.equal(controls.emailCount+controls.passwordCount,2);assert.deepEqual(seen,['input#login-email','input#login-password']);n++;
  const double={locator(){return {waitFor:async()=>{},count:async()=>2,isEnabled:async()=>true};}};
  await assert.rejects(()=>exactLoginControls(double),/LOGIN_LOCATOR_AMBIGUOUS/);n++;
  const delayed={locator(){return {waitFor:async()=>{await Promise.resolve();},count:async()=>1,isEnabled:async()=>true};}};
  await exactLoginControls(delayed);n++;
 assert.equal(classifyLogin(new Error('Timeout 18000 exceeded')).outcome,'FAIL_AUTH');n++;
 assert.equal(classifyLogin(new Error('BLOCKED_SYNTHETIC_MFA_ENROLLMENT_NOT_AUTHORIZED')).outcome,'BLOCKED_MFA');n++;
 assert.equal(allAcAccepted([{outcome:'PARTIAL',missing:['hold']}]),false);n++;
 assert.equal(conclude([{outcome:'PARTIAL'},{outcome:'NOT_RUN'}]),'NOT_RUN');n++;
 const tmp=await fs.mkdtemp(path.join(os.tmpdir(),'ot92-r10-selftest-'));try{
  const safe={'preflight.json':{state:'PASS'},'database-version.json':{postgres_server_version_num:160000},'runtime-versions.json':{runner:'ubuntu-24.04'},'results.json':OUT,'cleanup.json':{state:'PASS',credentialsAbsent:true,fixtureAbsent:true,sessionsAbsent:true,envAbsent:true}};
  const install=async()=>{for(const [name,obj] of Object.entries(safe))await fs.writeFile(path.join(tmp,name),JSON.stringify(obj)+'\n');const hashes=Object.keys(safe).sort().map(name=>`${crypto.createHash('sha256').update(JSON.stringify(safe[name])+'\n').digest('hex')}  ${name}`).join('\n')+'\n';await fs.writeFile(path.join(tmp,'SHA256SUMS'),hashes)};
  await install();assert.equal(await auditArtifacts(tmp),true);n++;
  await fs.writeFile(path.join(tmp,'screenshot.png'),'X');await assert.rejects(()=>auditArtifacts(tmp));n++;await fs.rm(path.join(tmp,'screenshot.png'));
  await fs.writeFile(path.join(tmp,'results.json'),'APP_KEY=unsafesecret');await assert.rejects(()=>auditArtifacts(tmp));n++;await install();
  await fs.writeFile(path.join(tmp,'cleanup.json'),'{"state":"FAIL"}');await assert.rejects(()=>auditArtifacts(tmp));n++;await install();
  await fs.writeFile(path.join(tmp,'SHA256SUMS'),'sha mismatch');await assert.rejects(()=>auditArtifacts(tmp));n++;
 }finally{await fs.rm(tmp,{recursive:true,force:true})}
 console.log(`OFFLINE_SELF_TEST_PASS cases=${n} H01-H06`);}
function watch(page){const n={pageError:0,consoleError:0,server5xx:0,assetError:0,networkError:0};page.on('pageerror',()=>n.pageError++);page.on('requestfailed',r=>{if(r.failure()?.errorText!=='net::ERR_ABORTED')n.networkError++});page.on('console',m=>{if(m.type()==='error')n.consoleError++});page.on('response',r=>{if(r.status()>=500)n.server5xx++;if(r.status()>=400&&['script','stylesheet'].includes(r.request().resourceType()))n.assetError++});return n;}
function snapshot(o){return {...o}}function delta(a,b){return Object.fromEntries(Object.keys(a).map(k=>[k,a[k]-b[k]]))}function clean(o){return Object.values(o).every(x=>x===0)}
async function inertia(page){return page.evaluate(()=>{const s=document.getElementById('app')?.getAttribute('data-page');try{const v=JSON.parse(s);return {component:v.component,props:v.props??{}}}catch{return null}})}
async function heading(page,pattern){return page.getByRole('heading',{name:pattern}).first().isVisible().catch(()=>false)}
async function navigation(page,url){return await page.locator('.portal-desktop-navigation nav[aria-label="Primary navigation"] a[href]').evaluateAll((nodes,target)=>nodes.some(a=>{try{return new URL(a.href).pathname===target&&a.getClientRects().length>0}catch{return false}}),pathOnly(url))?'VISIBLE':'NOT_VISIBLE'}
const AUTH_SAFE_PATHS=new Set(['/login','/dashboard','/security/mfa/enroll','/security/mfa/challenge']);
function sanitizedLoginPath(page){const p=pathOnly(page.url());return AUTH_SAFE_PATHS.has(p)?p:'OTHER_PATH';}
async function exactLoginControls(page){
 const email=page.locator('input#login-email');
 const passwordInput=page.locator('input#login-password');
 try{await email.waitFor({state:'visible',timeout:10000});await passwordInput.waitFor({state:'visible',timeout:10000});}
 catch{throw Error('LOGIN_FORM_TIMEOUT');}
 const emailCount=await email.count(),passwordCount=await passwordInput.count();
 if(emailCount!==1||passwordCount!==1)throw Error('LOGIN_LOCATOR_AMBIGUOUS');
 if(!(await email.isEnabled())||!(await passwordInput.isEnabled()))throw Error('LOGIN_FORM_DISABLED');
 return {email,passwordInput,emailCount,passwordCount};
}
async function login(page,actor,password){
 page.qaLoginStartedAt=Date.now();page.qaLoginStage='LOGIN_GET_STATUS';
 const r=await page.goto(`${BASE}/login`,{waitUntil:'domcontentloaded',timeout:20000});
 page.qaLoginHttpStatus=sanitizeStatus(r?.status());
 if(r?.status()!==200)throw Error('LOGIN_GET_STATUS');
 page.qaLoginStage='LOGIN_FORM_TIMEOUT';
 const controls=await exactLoginControls(page);
 page.qaLoginCounts={email:controls.emailCount,password:controls.passwordCount};
 page.qaLoginStage='LOGIN_FORM_READY';
 await controls.email.fill(EMAIL[actor]);await controls.passwordInput.fill(password);
 page.qaLoginStage='LOGIN_SUBMIT';
 const redirect=page.waitForURL(u=>['/dashboard','/security/mfa/enroll','/security/mfa/challenge'].includes(u.pathname),{timeout:18000}).catch(()=>{throw Error('LOGIN_REDIRECT_TIMEOUT');});
 const posted=page.waitForResponse(x=>x.request().method()==='POST'&&pathOnly(x.url())==='/login',{timeout:18000}).catch(()=>{throw Error('LOGIN_POST_STATUS');});
 const [,response]=await Promise.all([redirect,posted,page.getByRole('button',{name:/sign in/i}).click()]);
 page.qaLoginHttpStatus=sanitizeStatus(response.status());
 if(![302,303].includes(response.status()))throw Error('LOGIN_POST_STATUS');
 const landed=pathOnly(page.url());page.qaLoginStage='LOGIN_REDIRECT';
 if(actor==='employee'&&landed!=='/dashboard')throw Error('LOGIN_UNEXPECTED_EMPLOYEE_MFA');
 if(landed==='/security/mfa/enroll')throw Error('BLOCKED_SYNTHETIC_MFA_ENROLLMENT_NOT_AUTHORIZED');
 if(landed==='/security/mfa/challenge')throw Error('BLOCKED_EXISTING_MFA_NOT_PROVISIONED');
 if(landed!=='/dashboard')throw Error('AUTH_SESSION_UNESTABLISHED');
 page.qaLoginStage='LOGIN_SESSION_VERIFY';
 const chk=await page.goto(`${BASE}/dashboard`,{waitUntil:'domcontentloaded',timeout:12000});
 page.qaLoginHttpStatus=sanitizeStatus(chk?.status());
 if(chk?.status()!==200||pathOnly(page.url())!=='/dashboard')throw Error('AUTH_SESSION_UNESTABLISHED');
 page.qaLoginStage='LOGIN_SESSION_CONFIRMED';
}
async function openPage(page,url){const response=await page.goto(`${BASE}${url}`,{waitUntil:'domcontentloaded',timeout:18000});const status=sanitizeStatus(response?.status());const body=await inertia(page);return {status,component:safeComponent(body?.component),props:body?.props??{},response};}
async function smokeIndex(page,spec,row){const before=snapshot(page.qaErrors),r=await openPage(page,spec.url);row.httpStatus=r.status;row.component=r.component;row.nav=await navigation(page,spec.url);
 checked(row,'http_200',r.status===200);checked(row,'component',r.component===spec.component);checked(row,'props_keys',spec.keys.every(k=>Object.hasOwn(r.props,k)));
 checked(row,'heading',await heading(page,spec.title));checked(row,'path',pathOnly(page.url())===pathOnly(spec.url));checked(row,'navigation',row.nav===spec.nav);
 checked(row,'errors',clean(delta(page.qaErrors,before)));return r.props;}
async function denial(page,row,url,markers){const response=await page.goto(`${BASE}${url}`,{waitUntil:'domcontentloaded',timeout:18000});const status=response?.status()??null;const content=await response.text();const safe=(status===403||status===404)&&markers.every(s=>!content.includes(s));checked(row,'foreign_denied_and_no_protected_metadata',safe);
 if(!safe&&status===200)throw Error('P0_PROTECTED_DATA_EXPOSURE');return safe;}
async function runAC(page,spec,fixture){const row=rowFor(spec.id);try{const props=await smokeIndex(page,spec,row);
 if(spec.id==='AC01'){checked(row,'typed_exact_correspondence_row',inboxMatch(props,fixture));await probeEchoedFilter(page,row,'/correspondence?view=all');const d=await openPage(page,`/correspondence/${fixture.correspondence.publicId}/workspace`);checked(row,'exact_correspondence_detail_state_caps_evidence',d.status===200&&d.component==='Correspondence/Show'&&correspondenceDetail(d.props,fixture));}
 if(spec.id==='AC02'){checked(row,'typed_exact_workflow_row',queueMatch(props,fixture));await probeEchoedFilter(page,row,'/transactions?view=all');const d=await openPage(page,`/transactions/${fixture.transaction.id}`);checked(row,'exact_transaction_detail_state_assignment_permissions_evidence',d.status===200&&d.component==='Transactions/Show'&&transactionDetail(d.props,fixture));}
 if(spec.id==='AC04'){checked(row,'typed_exact_registry_transaction',recordsMatch(props,fixture));await probeEchoedFilter(page,row,'/records?view=all&record_type=transaction');}
 if(spec.id==='AC05')checked(row,'archive_collections_typed',Array.isArray(props.archive?.records?.data)||Array.isArray(props.archive?.records));
 if(spec.id==='AC06'){checked(row,'employee_directory_collection_typed',Array.isArray(props.employees?.data));const own=await openPage(page,`/employees/${fixture.employeeSelfId}`);checked(row,'self_employee_exact_id',own.status===200&&own.component==='Employees/Show'&&Number(own.props.employee?.id)===fixture.employeeSelfId&&own.props.privateProfile!==null);const other=await openPage(page,`/employees/${fixture.employeeForeignId}`);const hidden=other.status===200&&other.component==='Employees/Show'&&other.props.privateProfile===null&&other.props.employmentProfile===null;checked(row,'other_employee_private_profiles_absent',hidden);if(other.status===200&&!hidden)throw Error('P0_PROTECTED_DATA_EXPOSURE');}
 if(spec.id==='AC07')checked(row,'department_collection_typed',Array.isArray(props.departments));
 if(spec.id==='AC08')checked(row,'calendar_events_typed',Array.isArray(props.events));
 if(spec.id==='AC09')checked(row,'archive_activity_typed',Array.isArray(props.archiveActivity));
 if(spec.id==='AC10'){const x=await page.request.get(`${BASE}/messages/feed?channel=General`,{timeout:12000});const body=x.status()===200?await x.json().catch(()=>null):null;checked(row,'real_general_feed_GET_structured',x.status()===200&&body!==null&&typeof body==='object');}
 if(spec.id==='AC11')checked(row,'admin_registry_collection_typed',Array.isArray(props.registry?.data));
 row.smoke=row.checks.every(x=>x.ok)?'PASS_SMOKE':'FAIL_SMOKE';row.outcome=row.smoke==='PASS_SMOKE'?spec.ceiling:'FAIL';if(row.outcome==='FAIL'&&row.checks.some(x=>x.name==='foreign_denied_and_no_protected_metadata'&&!x.ok))throw Error('P0_PROTECTED_DATA_EXPOSURE');
 }catch(e){row.outcome='FAIL';row.smoke='FAIL_SMOKE';row.failure=safeFailure(e);if(String(e.message).startsWith('P0_'))throw e;}
 console.log(`AC ${spec.id} ${row.outcome} smoke=${row.smoke}`);}
async function responsive(page,route,width){const row={route,width,actor:'department_head',outcome:'NOT_RUN',status:null,geometry:null,controls:{},errors:{}};OUT.responsive.push(row);try{const before=snapshot(page.qaErrors);await page.setViewportSize({width,height:900});const r=await openPage(page,route);row.status=r.status;
 const pattern=route==='/transactions'?/My Work/i:route==='/documents'?/Document Center/i:route==='/correspondence'?/Correspondence/i:/Records/i;
 const h=await heading(page,pattern);row.geometry=await page.evaluate(()=>({clientWidth:document.documentElement.clientWidth,scrollWidth:document.documentElement.scrollWidth,bodyWidth:document.body.scrollWidth}));
 const overflow=row.geometry.scrollWidth>row.geometry.clientWidth+1||row.geometry.bodyWidth>row.geometry.clientWidth+1;
 const name=width===320?'Open navigation':'Search municipal records';const trigger=page.getByRole('button',{name});if(!await trigger.isVisible())throw Error('RESPONSIVE_CONTROL_MISSING');await trigger.click();const dialog=page.getByRole('dialog',{name:width===320?'Workspace navigation':'Search municipal records'});const opened=await dialog.isVisible();await page.keyboard.press('Escape');row.controls={opened,closed:!(await dialog.isVisible()),focused:await trigger.evaluate(x=>document.activeElement===x)};row.errors=delta(page.qaErrors,before);
 row.outcome=r.status===200&&h&&!overflow&&Object.values(row.controls).every(Boolean)&&clean(row.errors)?'PASS_SMOKE':'FAIL';
 }catch(e){row.outcome='FAIL';row.failure=safeFailure(e);}console.log(`RESPONSIVE ${route} ${width} ${row.outcome}`);}
async function realNavigation(page){const r={actor:'department_head',from:'/records',to:'/transactions',status:null,component:null,outcome:'NOT_RUN'};OUT.navigation.push(r);try{await page.setViewportSize({width:1440,height:900});await openPage(page,r.from);const link=page.locator('.portal-desktop-navigation nav[aria-label="Primary navigation"] a[href="/transactions"]').first();if(!await link.isVisible())throw Error('NAV_CONTROL_MISSING');
 const p=page.waitForResponse(x=>x.request().method()==='GET'&&pathOnly(x.url())==='/transactions',{timeout:15000});await link.click();const res=await p;await page.waitForURL(u=>u.pathname==='/transactions',{timeout:15000});let body=await res.json().catch(()=>null);r.status=res.status();r.component=safeComponent(body?.component||(await inertia(page))?.component);r.outcome=r.status===200&&r.component==='Transactions/Index'?'PASS_SMOKE':'FAIL';
 }catch(e){r.outcome='FAIL';r.failure=safeFailure(e);}}
async function write(){await fs.mkdir(ROOT,{recursive:true});await fs.writeFile(path.join(ROOT,'results.json'),JSON.stringify(OUT,null,2)+'\n',{mode:0o600});}
async function main(){if(process.env.QA_UAT_MODE==='R17_RESTRICTED')throw Error('R17_GATE_INCOMPATIBILITY');const password=process.env.QA_DEMO_PASSWORD;if(!password)throw Error('SYNTHETIC_PASSWORD_UNAVAILABLE');if(process.env.QA_ALLOW_SYNTHETIC_MFA_ENROLLMENT==='true')throw Error('SYNTHETIC_MFA_ENROLLMENT_NOT_AUTHORIZED_R10');
 const head=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),parent=execFileSync('git',['rev-parse','HEAD^'],{encoding:'utf8'}).trim(),tree=execFileSync('git',['rev-parse',`${APP}^{tree}`],{encoding:'utf8'}).trim();
 if(parent!==APP||tree!==TREE||process.env.QA_FROZEN_APP_SHA!==APP||process.env.QA_FROZEN_TREE_SHA!==TREE)throw Error('FROZEN_SOURCE_ATTESTATION_FAILED');OUT.qaCommit=head;
 const f=JSON.parse(await fs.readFile(FIXTURE_PATH,'utf8'));if(f.correspondence?.reference!==REFS.correspondence||f.transaction?.reference!==REFS.transaction)throw Error('SQL_FIXTURE_IDENTITY_FAILED');OUT.databaseProof={sqlFixtureCrosscheck:true,correspondence:true,transaction:true};
 const {chromium}=await import('playwright');const browser=await chromium.launch({headless:true});OUT.runtime.browserMajor=Number(browser.version().split('.')[0]);
 try{const sessions={};for(const actor of Object.keys(EMAIL)){const ctx=await browser.newContext({viewport:{width:1440,height:900}});const page=await ctx.newPage();page.qaErrors=watch(page);try{await login(page,actor,password);sessions[actor]={page,ctx};OUT.auth.push({actor,outcome:'PASS',stage:page.qaLoginStage,path:sanitizedLoginPath(page),httpStatus:page.qaLoginHttpStatus,elapsedMs:Date.now()-page.qaLoginStartedAt,locatorCounts:page.qaLoginCounts});}catch(e){await ctx.close();const cls=classifyLogin(e);OUT.auth.push({actor,...cls,stage:page.qaLoginStage||'LOGIN_INIT',path:sanitizedLoginPath(page),httpStatus:page.qaLoginHttpStatus??null,elapsedMs:Date.now()-(page.qaLoginStartedAt||Date.now()),locatorCounts:page.qaLoginCounts??null});if(cls.outcome==='FAIL_AUTH'||cls.outcome==='INFRA_FAIL')OUT.failure=cls.outcome;for(const r of OUT.ac.filter(x=>x.actor===actor)){r.outcome=cls.outcome==='BLOCKED_MFA'?'BLOCKED_MFA':'NOT_RUN';r.smoke='NOT_RUN';}}}
 try{for(const s of SPECS){const actor=sessions[s.actor];if(actor)await runAC(actor.page,s,f);}
 const employee=sessions.employee;if(employee){await denial(employee.page,rowFor('AC01'),`/correspondence/${f.correspondence.publicId}/workspace`,[f.correspondence.reference,f.correspondence.subject,...f.correspondence.evidenceIds]);await denial(employee.page,rowFor('AC02'),`/transactions/${f.transaction.id}`,[f.transaction.reference,f.transaction.title,...f.transaction.evidenceIds]);await denial(employee.page,rowFor('AC11'),'/admin',['employee@talibon.demo']);}
 if(sessions.department_head){const page=sessions.department_head.page;const x=await openPage(page,'/departments');checked(rowFor('AC07'),'head_placeholder_not_workflow',x.status===200&&x.component==='Departments/Workspace');for(const route of ['/records','/documents','/correspondence','/transactions'])for(const width of [320,1440])await responsive(page,route,width);await realNavigation(page);}
 for(const row of OUT.ac){if(row.checks.some(x=>!x.ok)){row.outcome='FAIL';row.smoke='FAIL_SMOKE';}}
 }finally{for(const s of Object.values(sessions))await s.ctx.close();}
 OUT.smokeCoverage=OUT.failure!=='NONE'?'FAIL':OUT.ac.some(x=>x.outcome==='FAIL')?'FAIL':OUT.ac.some(x=>x.outcome==='NOT_RUN'||x.outcome==='BLOCKED_MFA')?'PARTIAL':'PASS_SMOKE_COVERAGE';
 OUT.fullAcAcceptance=allAcAccepted(OUT.ac)?'PASS':'PARTIAL_OR_BLOCKED';if(OUT.failure!=='NONE'||OUT.ac.some(x=>x.outcome==='FAIL'))process.exitCode=1;
 }finally{await browser.close();await write();}}
if(process.argv.includes('--offline-self-test'))await offlineSelfTest();
else if(process.argv.includes('--audit-artifacts')){await auditArtifacts();console.log('ARTIFACT_ALLOWLIST_AND_SANITIZATION_PASS');}
else await main().catch(async e=>{OUT.failure=safeFailure(e);OUT.smokeCoverage='FAIL';OUT.fullAcAcceptance='NOT_RUN';await write();console.error(`HARNESS_STOP ${OUT.failure}`);process.exitCode=1;});
