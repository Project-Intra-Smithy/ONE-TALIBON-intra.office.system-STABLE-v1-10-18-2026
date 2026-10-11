import test from 'node:test';
import assert from 'node:assert/strict';
import {
  TASK_STATES, getPersonalTasks, getPersonalTask, isIndividualTask,
  parseTaskPage, parseTaskDetail, isTaskAccessBoundary, safeMfaNextUrl
} from '../resources/js/components/tasks/taskReadApi.ts';

const TASK={id:15,kind:'individual',title:'Test task',instructions:null,state:'open',
  owning_department_id:null,due_at:null,completed_at:null,created_at:'2026-10-10T08:00:00+08:00',updated_at:'2026-10-10T08:00:00+08:00'};
const PAGE={data:[TASK],meta:{page:1,per_page:10,total:1,last_page:1}};
function json(value,status=200,headers={}) {
  return new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json',...headers}});
}
async function withFetch(mock,call){
  const original=globalThis.fetch;globalThis.fetch=mock;
  try{return await call();}finally{globalThis.fetch=original;}
}
test('contract Task serializer does not grant authority from owning department snapshot',()=>{
  assert.deepEqual(TASK_STATES,['open','in_progress','completed']);
  assert.equal(isIndividualTask(TASK),true);
  assert.equal(isIndividualTask({...TASK,kind:'official'}),false);
  assert.equal(isIndividualTask({...TASK,state:'delegated'}),false);
  assert.equal(isIndividualTask({...TASK,due_at:'invalid'}),false);
  assert.equal(isIndividualTask({...TASK,title:1}),false);
  assert.deepEqual(parseTaskDetail({data:TASK}),TASK);
  assert.equal(parseTaskDetail({data:{...TASK,id:'15'}}),null);
});
test('list uses authoritative server meta and rejects malformed result',()=>{
  assert.equal(parseTaskPage(PAGE).meta.total,1);
  assert.equal(parseTaskPage({...PAGE,meta:{...PAGE.meta,total:400,last_page:40}}).meta.last_page,40);
  assert.equal(parseTaskPage({...PAGE,meta:{...PAGE.meta,per_page:51}}),null);
  assert.equal(parseTaskPage({...PAGE,data:[{...TASK,kind:'workflow'}]}),null);
  assert.equal(parseTaskPage({data:[],meta:{page:1,per_page:10,total:0,last_page:1}}).data.length,0);
});
test('only released Task GETs: same-origin credentials, no Inertia header or invented filters',async()=>{
  const paths=[];
  await withFetch(async(url,options)=>{
    paths.push({url:String(url),options});return json(paths.length===1?PAGE:{data:TASK});
  },async()=>{
    const signal=new AbortController().signal;
    assert.equal((await getPersonalTasks('in_progress',2,signal)).ok,true);
    assert.equal((await getPersonalTask(15,signal)).ok,true);
  });
  assert.deepEqual(paths.map(x=>x.url),['/tasks?page=2&per_page=10&state=in_progress','/tasks/15']);
  for(const {options} of paths){
    assert.equal(options.method,'GET');
    assert.equal(options.credentials,'same-origin');
    assert.equal(options.headers.Accept,'application/json');
    assert.equal(options.headers['X-Inertia'],undefined);
  }
  assert.throws(()=>getPersonalTasks('invalid',1,new AbortController().signal),/Invalid C1/);
  assert.throws(()=>getPersonalTasks('open',10001,new AbortController().signal),/Invalid C1/);
  assert.throws(()=>getPersonalTask(0,new AbortController().signal),/numeric Task ID/);
});
test('401 inactive session and 419 expiration require fresh authentication',async()=>{
  await withFetch(async()=>json({code:'ACCOUNT_INACTIVE'},401),async()=>{
    const r=await getPersonalTasks('open',1,new AbortController().signal);
    assert.equal(r.ok,false);if(!r.ok){assert.equal(r.error.status,401);assert.equal(r.error.code,'ACCOUNT_INACTIVE');assert.match(r.error.message,/inactive/);}
  });
  await withFetch(async()=>json({message:'CSRF'},419),async()=>{
    const r=await getPersonalTask(15,new AbortController().signal);
    assert.equal(r.ok,false);if(!r.ok)assert.equal(r.error.status,419);
  });
});
test('403 MFA uses validated server next_url, never arbitrary redirect',async()=>{
  assert.equal(safeMfaNextUrl('https://evil.test/security/mfa/verify'),null);
  assert.equal(safeMfaNextUrl('//evil.test/security/mfa/verify'),null);
  assert.equal(safeMfaNextUrl('/security/mfa/challenge'),'/security/mfa/challenge');
  await withFetch(async()=>json({code:'MFA_REQUIRED',next_url:'/security/mfa/challenge'},403),async()=>{
    const r=await getPersonalTasks('open',1,new AbortController().signal);
    assert.equal(r.ok,false);if(!r.ok)assert.equal(r.error.nextUrl,'/security/mfa/challenge');
  });
  await withFetch(async()=>json({code:'MFA_REQUIRED',next_url:'https://evil.test'},403),async()=>{
    const r=await getPersonalTasks('open',1,new AbortController().signal);
    assert.equal(r.ok,false);if(!r.ok)assert.equal(r.error.nextUrl,null);
  });
});
test('authorization-boundary classifier distinguishes session loss from ordinary read failures',()=>{
  const err=(status)=>({status,code:null,message:'Access changed',requestId:null,nextUrl:null});
  for(const status of [401,403,419]) assert.equal(isTaskAccessBoundary(err(status)),true);
  for(const status of [null,404,422,429,500,503]) assert.equal(isTaskAccessBoundary(err(status)),false);
});
test('masked 404, validation 422, throttle 429 and 503 keep correct read error semantics',async()=>{
  for(const code of [404,422,429,500,503]){
    await withFetch(async()=>json({message:'Details withheld'},code,{'X-Request-ID':'req-123'}),async()=>{
      const r=await getPersonalTask(1234,new AbortController().signal);
      assert.equal(r.ok,false);if(!r.ok){
        assert.equal(r.error.status,code);assert.equal(r.error.requestId,'req-123');
        assert.equal(r.error.nextUrl,null);assert.doesNotMatch(r.error.message,/Details withheld/);
      }
    });
  }
});
test('invalid 200 payload and HTML never render as authorized Tasks',async()=>{
  await withFetch(async()=>json({data:{id:1}},200),async()=>{
    const r=await getPersonalTask(1,new AbortController().signal);
    assert.equal(r.ok,false);if(!r.ok)assert.equal(r.error.code,'INVALID_RESPONSE');
  });
  await withFetch(async()=>new Response('<html>login</html>',{status:200,headers:{'Content-Type':'text/html'}}),async()=>{
    const r=await getPersonalTasks('open',1,new AbortController().signal);
    assert.equal(r.ok,false);if(!r.ok)assert.equal(r.error.code,'INVALID_RESPONSE');
  });
});
test('aborted stale fetch is not turned into another account error response',async()=>{
  const controller=new AbortController();
  await withFetch(async()=>{controller.abort();throw new DOMException('aborted','AbortError');},async()=>{
    await assert.rejects(getPersonalTasks('open',1,controller.signal),{name:'AbortError'});
  });
});
