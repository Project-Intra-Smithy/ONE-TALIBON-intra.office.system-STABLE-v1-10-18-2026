import { usePage } from '@inertiajs/react';
import { AlertCircle, ArrowLeft, ChevronLeft, ChevronRight, ListChecks, RefreshCcw } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import PersonalTaskMutationPanel from './PersonalTaskMutationPanel';
import '../../../css/personal-task-board.css';
import type { SharedProps } from '../../types';
import { getPersonalTask, getPersonalTasks, isTaskAccessBoundary, TASK_STATES, type IndividualTask, type ReadError, type TaskPage, type TaskState } from './taskReadApi';

const labels: Record<TaskState,string> = {open:'Open',in_progress:'In Progress',completed:'Completed'};
const columnLabels: Record<TaskState,string> = {open:'To do',in_progress:'In progress',completed:'Done'};
const colors: Record<TaskState,string> = {
    open:'bg-sky-50 text-sky-800 dark:bg-sky-950 dark:text-sky-200',
    in_progress:'bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-200',
    completed:'bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
};
function formatDate(value:string|null):string {
    if (!value) return 'Not set';
    const date=new Date(value);
    return Number.isNaN(date.getTime()) ? 'Unavailable'
      : new Intl.DateTimeFormat('en-PH',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Manila'}).format(date);
}
function dueLabel(task: IndividualTask): string | null {
    if (!task.due_at || task.state === 'completed') return null;
    const remaining = Date.parse(task.due_at) - Date.now();
    if (!Number.isFinite(remaining)) return null;
    return remaining < 0 ? 'Overdue' : remaining <= 48 * 60 * 60 * 1000 ? 'Due within 48 hours' : null;
}
function Status({value}:{value:TaskState}) {
    return <span className={'inline-block rounded-full px-2.5 py-1 text-sm font-semibold '+colors[value]}>{labels[value]}</span>;
}
function ErrorPanel({error,retry,back}:{error:ReadError;retry:()=>void;back?:()=>void}) {
    const expired=error.status===401||error.status===419;
    return <div role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-base dark:border-amber-800 dark:bg-amber-950/40">
        <div className="flex items-center gap-2 font-bold text-amber-950 dark:text-amber-100">
            <AlertCircle size={17} aria-hidden="true"/> Personal Tasks unavailable{error.status ? ' ('+error.status+')' : ''}
        </div>
        <p className="mt-2 leading-6 text-amber-900 dark:text-amber-200">{error.message}</p>
        {error.requestId&&<p className="mt-2 break-all text-sm text-amber-800 dark:text-amber-200">Request ID: {error.requestId}</p>}
        <div className="mt-3 flex flex-wrap gap-2">
            {expired&&<a href="/login" className="rounded-lg bg-[#1769aa] px-3 py-2 font-semibold text-white">Sign in again</a>}
            {error.nextUrl&&<a href={error.nextUrl} className="rounded-lg bg-[#1769aa] px-3 py-2 font-semibold text-white">Complete MFA</a>}
            {back&&<button type="button" onClick={back} className="rounded-lg border border-amber-500 px-3 py-2 font-semibold text-amber-950 dark:text-amber-100">Back to Task list</button>}
            {!expired&&error.code!=='MFA_REQUIRED'&&<button type="button" onClick={retry} className="rounded-lg border border-amber-500 px-3 py-2 font-semibold text-amber-950 dark:text-amber-100">Retry read</button>}
        </div>
    </div>;
}
function Loading({label}:{label:string}) {
    return <div role="status" className="space-y-3 rounded-xl border border-slate-200 p-5 dark:border-slate-700">
        <span className="sr-only">{label}</span>
        <div aria-hidden="true" className="h-4 w-3/4 animate-pulse rounded bg-slate-200 motion-reduce:animate-none dark:bg-slate-700"/>
        <div aria-hidden="true" className="h-3 w-1/2 animate-pulse rounded bg-slate-200 motion-reduce:animate-none dark:bg-slate-700"/>
    </div>;
}
const TASK_SYNC_EVENT='one-talibon:personal-task-confirmed';
type TaskSyncDetail={userId:number;taskId:number;state:TaskState};
function Detail({task,back}:{task:IndividualTask;back:()=>void}) {
    const dates:[string,string|null][]=[['Due',task.due_at],['Created',task.created_at],['Updated',task.updated_at],['Completed',task.completed_at]];
    return <section aria-label="Personal Task detail" className="min-w-0 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-[#142236]">
        <button type="button" onClick={back} className="mb-4 inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-semibold dark:border-slate-600">
            <ArrowLeft size={15} aria-hidden="true"/> Back to tasks
        </button>
        <div className="flex flex-wrap items-center justify-between gap-2"><span className="text-sm font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">Individual Task #{task.id}</span><Status value={task.state}/></div>
        <h4 className="mt-3 break-words text-xl font-extrabold text-slate-900 dark:text-white">{task.title}</h4>
        <dl className="mt-5 grid grid-cols-1 gap-3 border-y border-slate-100 py-4 text-sm sm:grid-cols-2 dark:border-slate-700">
            {dates.map(([label,value])=><div key={label}><dt className="font-semibold text-slate-500 dark:text-slate-400">{label}</dt>
            <dd className="mt-1 break-words text-slate-800 dark:text-slate-100">{formatDate(value)}</dd></div>)}
        </dl>
        <h5 className="mt-5 text-base font-bold text-slate-900 dark:text-white">Instructions</h5>
        <p className="mt-2 whitespace-pre-wrap break-words text-base leading-6 text-slate-700 dark:text-slate-300">{task.instructions??'No instructions were provided.'}</p>
        <p className="mt-6 border-t border-slate-100 pt-4 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
            Use the Personal Task actions panel below to create or update your own Tasks.
        </p>
    </section>;
}
function TaskSession({userId, state, onAccessBoundary}:{userId:number;state:TaskState;onAccessBoundary:(error:ReadError)=>void}) {
    const [page,setPage]=useState(1);
    const [refresh,setRefresh]=useState(0);
    const [list,setList]=useState<TaskPage|null>(null);
    const [listError,setListError]=useState<ReadError|null>(null);
    const [listLoading,setListLoading]=useState(true);
    const [selected,setSelected]=useState<number|null>(null);
    const [detail,setDetail]=useState<IndividualTask|null>(null);
    const [detailError,setDetailError]=useState<ReadError|null>(null);
    const [detailLoading,setDetailLoading]=useState(false);
    const [detailRefresh,setDetailRefresh]=useState(0);
    const focusTitle=useRef<HTMLHeadingElement>(null);
    useEffect(()=>{
        const control=new AbortController(); let active=true;
        setList(null);setListError(null);setListLoading(true);
        getPersonalTasks(state,page,control.signal).then(r=>{
            if (!active) return;
            if(r.ok) setList(r.data);
            else { setListError(r.error); if(isTaskAccessBoundary(r.error)) {setSelected(null);onAccessBoundary(r.error);} }
        }).catch(()=>{if(active)setListError({status:null,code:null,message:'Unable to retrieve the Task list.',nextUrl:null,requestId:null});})
        .finally(()=>{if(active)setListLoading(false);});
        return ()=>{active=false;control.abort();};
    },[state,page,refresh,onAccessBoundary]);
    useEffect(()=>{
        if(selected===null){setDetail(null);setDetailError(null);setDetailLoading(false);return;}
        const control=new AbortController();let active=true;
        setDetail(null);setDetailError(null);setDetailLoading(true);
        getPersonalTask(selected,control.signal).then(r=>{
            if(!active)return;
            if(!r.ok) {
                if(isTaskAccessBoundary(r.error)) {
                    // The detail read revoked authorization: do not expose previously cached list rows.
                    setList(null);
                    setListError(r.error);
                    setSelected(null);
                    onAccessBoundary(r.error);
                } else setDetailError(r.error);
            }
            else if(r.data.id!==selected)setDetailError({status:null,code:'INVALID_RESPONSE',message:'The Task service returned an unexpected record.',requestId:null,nextUrl:null});
            else setDetail(r.data);
        }).catch(()=>{if(active)setDetailError({status:null,code:null,message:'Unable to retrieve Task details.',requestId:null,nextUrl:null});})
        .finally(()=>{if(active)setDetailLoading(false);});
        return ()=>{active=false;control.abort();};
    },[selected,detailRefresh,onAccessBoundary]);
    useEffect(()=>{if(detail)focusTitle.current?.focus();},[detail]);
    useEffect(()=>{
        const synchronize=(event:Event)=>{
            const detail=(event as CustomEvent<TaskSyncDetail>).detail;
            if(!detail||detail.userId!==userId||!TASK_STATES.includes(detail.state))return;
            setSelected(null);
            setDetail(null);
            setDetailError(null);
            setPage(1);
            setRefresh(value=>value+1);
        };
        window.addEventListener(TASK_SYNC_EVENT,synchronize);
        return()=>window.removeEventListener(TASK_SYNC_EVENT,synchronize);
    },[userId]);
    const choosePage=(value:number)=>{if(!list||value<1||value>list.meta.last_page||value>10000)return;setPage(value);setSelected(null);};
    return <section className="municipal-panel task-workspace task-board-column overflow-hidden" aria-labelledby={'personal-task-heading-'+state}>
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-4 dark:border-slate-700 sm:px-5">
            <h3 id={'personal-task-heading-'+state} className="task-board-column-title">{columnLabels[state]} <span aria-label={list&&!listLoading?`${list.meta.total} Tasks`:'Count unavailable'}>{!listLoading&&list?list.meta.total:'—'}</span></h3>
            <button type="button" onClick={()=>{setRefresh(n=>n+1);if(selected!==null)setDetailRefresh(n=>n+1);}}
                aria-label={'Refresh '+columnLabels[state]+' Tasks'} title="Refresh"
                className="task-board-refresh inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 px-3 text-sm font-semibold dark:border-slate-600"><RefreshCcw size={14} aria-hidden="true"/></button>
        </header>
        <div className={'task-workspace-body grid min-w-0 gap-4 p-4 sm:p-5 '+(selected!==null?'task-workspace-selected':'')}>
            <div className="min-w-0">
                {listLoading&&<Loading label="Loading personal Tasks"/>}
                {!listLoading&&listError&&<ErrorPanel error={listError} retry={()=>setRefresh(n=>n+1)}/>}
                {!listLoading&&!listError&&list&&(list.data.length===0?
                    <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-base text-slate-600 dark:border-slate-600 dark:text-slate-300">
                        {list.meta.total===0?'No individual Tasks in this state.':'No Tasks returned for this page.'}</div>:
                    <ul aria-label={labels[state]+' personal Tasks'} className="task-rows space-y-2">
                        {list.data.map(task=><li key={task.id}><button type="button" aria-pressed={selected===task.id} id={"task-row-"+task.id} onClick={()=>setSelected(task.id)}
                            className={'task-row w-full rounded-lg border p-4 text-left motion-reduce:transition-none '+(selected===task.id?'border-blue-500 bg-blue-50 dark:bg-blue-950/40':'border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800/50')}>
                            <span className="block break-words text-lg font-bold text-slate-900 dark:text-white">{task.title}</span>
                            <span className="task-row-meta mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">
                                <Status value={task.state}/>
                                <span className="text-sm text-slate-600 dark:text-slate-300">Due: {formatDate(task.due_at)}</span>
                                {dueLabel(task)&&<span className="task-deadline text-sm font-bold">{dueLabel(task)}</span>}
                                <span className="text-sm text-slate-500 dark:text-slate-400">#{task.id}</span>
                            </span>
                            <span className="task-row-action mt-2 block text-sm font-semibold">{selected===task.id?'Viewing task':'View details'}</span>
                        </button></li>)}
                    </ul>)}
                {!listLoading&&list&&<nav aria-label={columnLabels[state]+' server Task pagination'} className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm text-slate-600 dark:text-slate-300">Page {list.meta.page} of {list.meta.last_page} · {list.meta.total} Tasks</p>
                    <div className="flex gap-2">
                        <button type="button" aria-label={'Previous '+columnLabels[state]+' Task page'} disabled={list.meta.page<=1} onClick={()=>choosePage(list.meta.page-1)} className="min-h-10 rounded-lg border border-slate-300 px-3 disabled:opacity-40 dark:border-slate-600"><ChevronLeft size={17}/></button>
                        <button type="button" aria-label={'Next '+columnLabels[state]+' Task page'} disabled={list.meta.page>=list.meta.last_page||list.meta.page>=10000} onClick={()=>choosePage(list.meta.page+1)} className="min-h-10 rounded-lg border border-slate-300 px-3 disabled:opacity-40 dark:border-slate-600"><ChevronRight size={17}/></button>
                    </div></nav>}
            </div>
            <div className={selected===null?'sr-only':'min-w-0'} aria-live="polite">
                {selected===null&&<p className="rounded-xl border border-dashed border-slate-300 p-6 text-base text-slate-600 dark:border-slate-600 dark:text-slate-300">Choose an individual Task to see its details.</p>}
                {selected!==null&&detailLoading&&<Loading label="Loading Task detail"/>}
                {selected!==null&&!detailLoading&&detailError&&<ErrorPanel error={detailError} retry={()=>setDetailRefresh(n=>n+1)} back={()=>setSelected(null)}/>}
                {selected!==null&&!detailLoading&&detail?.id===selected&&<><h3 className="sr-only" ref={focusTitle} tabIndex={-1}>Selected Task details</h3><Detail task={detail} back={()=>{setSelected(null);requestAnimationFrame(()=>document.getElementById('task-row-'+selected)?.focus());}}/></>}
            </div>
        </div>
    </section>;
}
/** Key component state by logged-in user; never show one account's cached Task data to another. */
function TaskBoard({userId}:{userId:number}) {
    const [boundary,setBoundary]=useState<ReadError|null>(null);
    const [generation,setGeneration]=useState(0);
    const revoke=useCallback((error:ReadError)=>setBoundary(error),[]);
    return <section className="personal-task-board" aria-label="My Tasks board">
        <header className="personal-task-board-heading">
            <div><p className="task-board-eyebrow">Your office, connected</p>
                <h2><ListChecks size={22} aria-hidden="true"/> My Tasks</h2>
                <p>Organize responsibilities, deadlines and next actions.</p></div>
            {!boundary&&<a href="#task-action-heading" className="task-board-add" onClick={()=>requestAnimationFrame(()=>document.getElementById('task-action-heading')?.focus())}>+ Add task</a>}
        </header>
        {boundary?<ErrorPanel error={boundary} retry={()=>{setBoundary(null);setGeneration(n=>n+1);}}/>:<>
            <div className="personal-task-board-columns">
                {TASK_STATES.map(state=><TaskSession key={state+'-'+generation} userId={userId} state={state} onAccessBoundary={revoke}/>)}
            </div>
            <PersonalTaskMutationPanel />
        </>}
    </section>;
}
export default function PersonalTaskWorkspace(){
    const id=usePage<SharedProps>().props.auth?.user?.id;
    return typeof id==='number'?<TaskBoard key={id} userId={id}/>:null;
}
