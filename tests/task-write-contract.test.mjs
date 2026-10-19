import test from 'node:test';
import assert from 'node:assert/strict';
import {createPersonalTask, transitionPersonalTask} from '../resources/js/components/tasks/taskReadApi.ts';

const TASK={id:11,kind:'individual',title:'Integration task',instructions:null,state:'open',
  owning_department_id:null,due_at:null,completed_at:null,
  created_at:'2026-10-15T03:30:00+08:00',updated_at:'2026-10-15T03:30:00+08:00'};
function json(value,status=200) {return new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json','X-Request-ID':'test-request'}});}
async function useMock(fn,task) {const old=globalThis.fetch;globalThis.fetch=fn;try{return await task();}finally{globalThis.fetch=old;}}
test('Task create uses only server-authorized body and same-origin JSON POST',async()=>{
 const calls=[];
 await useMock(async(url,opts)=>{calls.push([url,opts]);return json({data:TASK},201);},async()=>{
  const r=await createPersonalTask(' Integration task ','  Instructions ');
  assert.equal(r.ok,true);
 });
 assert.equal(calls[0][0],'/tasks');
 assert.equal(calls[0][1].method,'POST');
 assert.equal(calls[0][1].credentials,'same-origin');
 assert.deepEqual(JSON.parse(calls[0][1].body),{title:'Integration task',instructions:'Instructions'});
 assert.equal(calls[0][1].headers['X-Inertia'],undefined);
});
test('start and complete send no actor, state or department inputs',async()=>{
 const calls=[];
 await useMock(async(url,opts)=>{calls.push([url,opts]);return json({data:TASK});},async()=>{
  assert.equal((await transitionPersonalTask(11,'start')).ok,true);
  assert.equal((await transitionPersonalTask(11,'complete')).ok,true);
 });
 assert.deepEqual(calls.map(x=>x[0]),['/tasks/11/start','/tasks/11/complete']);
 assert.deepEqual(calls.map(x=>JSON.parse(x[1].body)),[{},{}]);
});
test('authorization errors, invalid success and network failures never claim writes',async()=>{
 for(const status of [401,403,404,419,422,429]){
  await useMock(async()=>json({code:'MFA_REQUIRED',next_url:'/security/mfa/challenge'},status),async()=>{
   const r=await transitionPersonalTask(11,'start');
   assert.equal(r.ok,false); if(!r.ok)assert.equal(r.error.status,status);
  });
 }
 await useMock(async()=>json({data:{id:11}}),async()=>assert.equal((await createPersonalTask('x',null)).ok,false));
 await useMock(async()=>{throw Error('offline');},async()=>assert.equal((await createPersonalTask('x',null)).ok,false));
 assert.throws(()=>transitionPersonalTask(0,'start'),/Invalid Task/);
 assert.throws(()=>createPersonalTask('',null),/Invalid Task/);
});
