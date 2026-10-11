import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createPersonalTask,startPersonalTask,completePersonalTask,
  validateCreateTaskInput,validTaskDueAt,localDateTimeWithOffset
} from '../resources/js/components/tasks/taskWriteApi.ts';
const base={id:15,kind:'individual',title:'Bounded personal Task',instructions:null,state:'open',
  owning_department_id:null,due_at:null,completed_at:null,
  created_at:'2026-10-10T08:00:00+08:00',updated_at:'2026-10-10T08:00:00+08:00'};
const json=(v,status=200,headers={})=>new Response(JSON.stringify(v),
  {status,headers:{'Content-Type':'application/json','X-Request-ID':'f02-test-only',...headers}});
async function mockEnvironment(mock,fn,csrf='meta-token-test'){
  const oldFetch=globalThis.fetch,oldDocument=globalThis.document;
  globalThis.document={cookie:'XSRF-TOKEN=cookie-token-test',
    querySelector:()=>csrf?{content:csrf}:null};
  globalThis.fetch=mock;
  try { return await fn(); }
  finally {globalThis.fetch=oldFetch;globalThis.document=oldDocument;}
}
const signal=()=>new AbortController().signal;
const input={title:'New personal work',instructions:null,due_at:'2026-10-12T09:30:00+08:00'};

test('C1 input only permits title, nullable instructions and offset datetime',()=>{
  assert.equal(validateCreateTaskInput(input),true);
  for(const extra of [{creator_id:1},{assignee_id:2},{state:'completed'},
    {department_id:4},{source_domain:'transactions'},{status:'completed'}, {source_id:10}])
    assert.equal(validateCreateTaskInput({...input,...extra}),false);
  assert.equal(validateCreateTaskInput({...input,title:' '}),false);
  assert.equal(validateCreateTaskInput({...input,title:'x'.repeat(256)}),false);
  assert.equal(validateCreateTaskInput({...input,instructions:'x'.repeat(10001)}),false);
  for(const date of ['2026-02-30T12:00:00+08:00','2026-10-12T09:30:00',
    '2026-10-12T09:30+08:00','2026-10-12','2026-10-12T25:30:00+08:00'])
    assert.equal(validTaskDueAt(date),false,date);
  assert.equal(localDateTimeWithOffset('2026-02-30T12:00'),null);
  assert.match(localDateTimeWithOffset('2026-10-12T09:30'),/^2026-10-12T09:30:00(?:Z|[+-]\d{2}:\d{2})$/);
});
test('a valid 201 create receipt is the ONLY confirmed create, with CSRF and no Inertia',async()=>{
  let captured;
  await mockEnvironment(async(url,opts)=>{
    captured={url,opts};return json({data:base},201);
  },async()=>{
    const result=await createPersonalTask(input,signal());
    assert.equal(result.ok,true);
    if(result.ok)assert.deepEqual(result.task,base);
  });
  assert.equal(captured.url,'/tasks');
  assert.equal(captured.opts.method,'POST');
  assert.equal(captured.opts.credentials,'same-origin');
  assert.equal(captured.opts.headers.Accept,'application/json');
  assert.equal(captured.opts.headers['Content-Type'],'application/json');
  assert.equal(captured.opts.headers['X-CSRF-TOKEN'],'meta-token-test');
  assert.equal(captured.opts.headers['X-Inertia'],undefined);
  assert.deepEqual(JSON.parse(captured.opts.body),input);
});
test('CSRF fallback uses cookie and absent tokens stop BEFORE sending POST',async()=>{
  const original=globalThis.document;const oldFetch=globalThis.fetch;
  try{
    let seen;
    globalThis.document={querySelector:()=>null,cookie:'XSRF-TOKEN=safe%20encoded'};
    globalThis.fetch=async(_url,opts)=>{seen=opts;return json({data:base},201);};
    const yes=await createPersonalTask(input,signal());
    assert.equal(yes.ok,true);assert.equal(seen.headers['X-XSRF-TOKEN'],'safe encoded');
    seen=null;globalThis.document={querySelector:()=>null,cookie:''};
    const no=await createPersonalTask(input,signal());
    assert.equal(no.ok,false);assert.equal(no.error.unknownOutcome,false);
    assert.equal(seen,null);
  }finally{globalThis.document=original;globalThis.fetch=oldFetch;}
});
test('start and complete use ONLY bounded paths, empty payload, precise 200 and server state',async()=>{
  const calls=[];
  await mockEnvironment(async(url,opts)=>{
    calls.push({url,opts});
    return json({data:{...base,state:calls.length===1?'in_progress':'completed'}},200);
  },async()=>{
    assert.equal((await startPersonalTask(15,signal())).ok,true);
    assert.equal((await completePersonalTask(15,signal())).ok,true);
  });
  assert.deepEqual(calls.map(x=>x.url),['/tasks/15/start','/tasks/15/complete']);
  for(const call of calls){assert.equal(call.opts.method,'POST');assert.deepEqual(JSON.parse(call.opts.body),{});}
  assert.throws(()=>startPersonalTask(0,signal()),/numeric Task ID/);
  assert.throws(()=>completePersonalTask(-1,signal()),/numeric Task ID/);
});
test('422 validation and terminal transitions produce NO optimistic result',async()=>{
  await mockEnvironment(async()=>json({errors:{title:['required'],request:['Unknown fields']}},422),async()=>{
    const res=await createPersonalTask(input,signal());
    assert.equal(res.ok,false);
    if(!res.ok){assert.equal(res.error.status,422);assert.deepEqual(res.error.invalidFields,['title','request']);assert.equal(res.error.unknownOutcome,false);}
  });
  await mockEnvironment(async()=>json({errors:{state:['Transition not allowed']}},422),async()=>{
    const res=await completePersonalTask(15,signal());
    assert.equal(res.ok,false);if(!res.ok)assert.deepEqual(res.error.invalidFields,['state']);
  });
});
test('masked 404, 401, 403 safe MFA, 419, 429 are explicit error receipts and never retried',async()=>{
  for(const status of [401,403,404,419,429]){
    let calls=0;
    await mockEnvironment(async()=>{
      calls++;
      return json(status===403?{code:'MFA_REQUIRED',next_url:'https://evil.test/security/mfa/challenge'}:{code:'REJECTED'},status);
    },async()=>{
      const res=await startPersonalTask(15,signal());
      assert.equal(res.ok,false);
      if(!res.ok){assert.equal(res.error.status,status);assert.equal(res.error.unknownOutcome,false);assert.equal(res.error.nextUrl,null);}
    });assert.equal(calls,1);
  }
  await mockEnvironment(async()=>json({code:'MFA_REQUIRED',next_url:'/security/mfa/challenge'},403),async()=>{
    const res=await createPersonalTask(input,signal());
    assert.equal(res.ok,false);if(!res.ok)assert.equal(res.error.nextUrl,'/security/mfa/challenge');
  });
});
test('unexpected HTTP 200 for create, missing/malformed JSON, wrong id/state all UNKNOWN',async()=>{
  const invalid=[
    json({data:base},200),json({data:{...base,state:'completed'}},201),
    new Response('<html>ok</html>',{status:201,headers:{'Content-Type':'text/html'}}),
    new Response('garbage',{status:201,headers:{'Content-Type':'application/json'}})
  ];
  for(const response of invalid)await mockEnvironment(async()=>response,async()=>{
    const res=await createPersonalTask(input,signal());
    assert.equal(res.ok,false);if(!res.ok)assert.equal(res.error.unknownOutcome,true);
  });
  await mockEnvironment(async()=>json({data:{...base,id:17,state:'in_progress'}},200),async()=>{
    const res=await startPersonalTask(15,signal());assert.equal(res.ok,false);
    if(!res.ok)assert.equal(res.error.unknownOutcome,true);
  });
});
test('network failure, 500/503 produce UNKNOWN without replay; aborted stale writes never report success',async()=>{
  let count=0;
  await mockEnvironment(async()=>{count++;throw new Error('connection lost after send');},async()=>{
    const res=await createPersonalTask(input,signal());
    assert.equal(res.ok,false);if(!res.ok)assert.equal(res.error.unknownOutcome,true);
  });
  assert.equal(count,1);
  for(const code of [500,503])await mockEnvironment(async()=>json({message:'internal secret'},code),async()=>{
    const res=await completePersonalTask(15,signal());
    assert.equal(res.ok,false);if(!res.ok){
      assert.equal(res.error.unknownOutcome,true);assert.doesNotMatch(res.error.message,/internal secret/);
    }
  });
  await mockEnvironment(async(_url,opts)=>{opts.signal.throwIfAborted();throw new Error('aborted');},async()=>{
    const controller=new AbortController();controller.abort();
    await assert.rejects(createPersonalTask(input,controller.signal),{name:'AbortError'});
  });
});
