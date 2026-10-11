/**
 * A01-F02 bounded Task mutations. Laravel session + CSRF, same-origin JSON only.
 * Canonical C1: Project-Intra-Smithy/Talibon-Sales-Prototype@f9291aa6fb224aefa96e771a4c68f671c4db3278.
 * Never claim a mutation succeeded without a correctly shaped 201/200 server receipt.
 */
// Type-only import is erased at runtime; Node's built-in TS strip-types runner and Vite
// both resolve this module without a new dependency or shared tsconfig change.
import type { IndividualTask, TaskState } from './taskReadApi';

export type CreateTaskInput = { title: string; instructions: string | null; due_at: string | null };
export type TaskMutationError = {
    status: number | null; code: string | null; requestId: string | null;
    message: string; nextUrl: string | null; unknownOutcome: boolean;
    invalidFields: string[];
};
export type TaskMutationResult =
    | { ok: true; task: IndividualTask }
    | { ok: false; error: TaskMutationError };

const object = (v: unknown): v is Record<string, unknown> =>
    typeof v === 'object' && v !== null && !Array.isArray(v);
const duePattern = /^(\d{4})-(\d{2})-(\d{2})T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d+)?(?:Z|[+-](?:0\d|1[0-3]):[0-5]\d|[+-]14:00)$/;
export function validTaskDueAt(v: unknown): v is string {
    if (typeof v !== 'string' || !duePattern.test(v) || Number.isNaN(Date.parse(v))) return false;
    const m = duePattern.exec(v);
    if (!m) return false;
    const year = Number(m[1]), month = Number(m[2]), day = Number(m[3]);
    const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    return month >= 1 && month <= 12 && day >= 1 && day <= days[month - 1];
}

// Strict duplicate boundary serializer for mutation receipts. F01 keeps its existing
// read parser; this POST consumer must be independently executable by Node's TS runner.
function isIndividualTask(v: unknown): v is IndividualTask {
    if (!object(v) || !Number.isSafeInteger(v.id) || (v.id as number) <= 0 ||
        v.kind !== 'individual' || typeof v.title !== 'string' ||
        (v.instructions !== null && typeof v.instructions !== 'string') ||
        !['open','in_progress','completed'].includes(String(v.state)) ||
        (v.owning_department_id !== null &&
            (!Number.isSafeInteger(v.owning_department_id) || (v.owning_department_id as number) < 0))) return false;
    return ['due_at','completed_at','created_at','updated_at'].every(key=>
        v[key]===null || validTaskDueAt(v[key]));
}
function safeMfaNextUrl(v: unknown): string | null {
    if (typeof v !== 'string' || !v.startsWith('/security/mfa/') ||
        v.startsWith('//') || v.includes('\\') || /[\u0000-\u001f]/.test(v)) return null;
    try {
        const target=new URL(v,'https://portal.local');
        return target.origin==='https://portal.local' && target.pathname.startsWith('/security/mfa/')
            ? target.pathname+target.search+target.hash : null;
    }catch{return null;}
}
export function validateCreateTaskInput(v: unknown): v is CreateTaskInput {
    if (!object(v) || Object.keys(v).some(k => !['title','instructions','due_at'].includes(k))) return false;
    if (typeof v.title !== 'string' || !v.title.trim() || v.title.length > 255) return false;
    if (v.instructions !== null && (typeof v.instructions !== 'string' || v.instructions.length > 10000)) return false;
    return v.due_at === null || validTaskDueAt(v.due_at);
}

/** Converts the browser's local datetime to an explicit-offset ISO8601 timestamp with seconds. */
export function localDateTimeWithOffset(value: string): string | null {
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?$/.test(value)) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    const local = value.length === 16 ? value + ':00' : value;
    const [year,month,day,hour,minute,second] = local.match(/\d+/g)!.map(Number);
    if (date.getFullYear() !== year || date.getMonth()+1 !== month ||
        date.getDate() !== day || date.getHours() !== hour ||
        date.getMinutes() !== minute || date.getSeconds() !== second) return null;
    const offset = -date.getTimezoneOffset();
    const sign = offset < 0 ? '-' : '+';
    const abs = Math.abs(offset);
    const suffix = sign + String(Math.floor(abs/60)).padStart(2,'0') + ':' + String(abs%60).padStart(2,'0');
    const result = local + suffix;
    return validTaskDueAt(result) ? result : null;
}

function csrfHeader(): { name: string; value: string } | null {
    if (typeof document === 'undefined') return null;
    const meta = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content;
    if (meta) return {name:'X-CSRF-TOKEN',value:meta};
    const item = document.cookie.split(';').map(s=>s.trim()).find(s=>s.startsWith('XSRF-TOKEN='));
    if (!item) return null;
    try {
        const token = decodeURIComponent(item.slice('XSRF-TOKEN='.length));
        return token ? {name:'X-XSRF-TOKEN',value:token} : null;
    } catch { return null; }
}
function err(status:number|null, body:unknown, requestId:string|null, unknownOutcome=false): TaskMutationError {
    const b = object(body) ? body : {};
    const code = typeof b.code === 'string' ? b.code : null;
    const nextUrl = status === 403 && code === 'MFA_REQUIRED' ? safeMfaNextUrl(b.next_url) : null;
    const errorKeys = object(b.errors) ? Object.keys(b.errors) : [];
    const invalidFields = status === 422
        ? ['title','instructions','due_at','state','request'].filter(k => errorKeys.includes(k)) : [];
    let message = 'Task mutation failed. No change has been confirmed.';
    if (unknownOutcome) message = 'The server outcome is unknown. Read the latest Task state before deciding whether to submit another request.';
    else if (status === 401) message = code === 'ACCOUNT_INACTIVE' ? 'Account inactive. Sign in with an active account.' : 'Session ended. Sign in again.';
    else if (status === 403) message = code === 'MFA_REQUIRED' ? 'Complete multi-factor authentication before continuing.' : 'Your account is not permitted to perform this Task action.';
    else if (status === 404) message = 'Task unavailable or inaccessible.';
    else if (status === 419) message = 'Security token or session expired. Sign in again. This action will not be replayed.';
    else if (status === 422) message = 'The Task action was rejected by validation or its current server state.';
    else if (status === 429) message = 'Too many Task requests. Do not retry until the service permits it.';
    else if (status === null) message = 'A valid CSRF token is unavailable. Sign in or refresh the page before trying.';
    return {status,code,requestId,nextUrl,message,unknownOutcome,invalidFields};
}
async function mutate(url:string, body:CreateTaskInput | Record<string, never>, expectedStatus:200|201,
    expectedState:TaskState, signal:AbortSignal, expectedId?:number):Promise<TaskMutationResult> {
    if (signal.aborted) throw new DOMException('Aborted','AbortError');
    const csrf = csrfHeader();
    if (!csrf) return {ok:false,error:err(null,null,null)};
    let response:Response;
    try {
        response = await fetch(url,{
            method:'POST',credentials:'same-origin',signal,
            headers:{Accept:'application/json','Content-Type':'application/json',[csrf.name]:csrf.value},
            body:JSON.stringify(body)
        });
    } catch {
        if (signal.aborted) throw new DOMException('Aborted','AbortError');
        return {ok:false,error:err(null,null,null,true)};
    }
    const requestId=response.headers.get('X-Request-ID');
    const json=response.headers.get('content-type')?.toLowerCase().includes('application/json') ?? false;
    let data:unknown=null;
    if (json) { try { data=await response.json(); } catch { data=null; } }
    if (signal.aborted) throw new DOMException('Aborted','AbortError');
    if (!response.ok) return {ok:false,error:err(response.status,data,requestId,response.status>=500)};
    const task = object(data) ? data.data : null;
    if (response.status!==expectedStatus || !json || !isIndividualTask(task) ||
        task.state!==expectedState || (expectedId!==undefined && task.id!==expectedId)) {
        return {ok:false,error:err(null,null,requestId,true)};
    }
    return {ok:true,task};
}
export function createPersonalTask(input:CreateTaskInput,signal:AbortSignal):Promise<TaskMutationResult> {
    if (!validateCreateTaskInput(input))
        return Promise.resolve({ok:false,error:{...err(422,null,null),invalidFields:['request']}});
    return mutate('/tasks',{title:input.title.trim(),instructions:input.instructions,due_at:input.due_at},201,'open',signal);
}
export function startPersonalTask(id:number,signal:AbortSignal):Promise<TaskMutationResult> {
    if (!Number.isSafeInteger(id)||id<=0) throw new Error('Invalid numeric Task ID');
    return mutate('/tasks/'+id+'/start',{},200,'in_progress',signal,id);
}
export function completePersonalTask(id:number,signal:AbortSignal):Promise<TaskMutationResult> {
    if (!Number.isSafeInteger(id)||id<=0) throw new Error('Invalid numeric Task ID');
    return mutate('/tasks/'+id+'/complete',{},200,'completed',signal,id);
}
