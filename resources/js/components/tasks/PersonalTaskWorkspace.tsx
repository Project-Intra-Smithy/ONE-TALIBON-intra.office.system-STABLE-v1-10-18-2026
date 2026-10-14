import { usePage } from '@inertiajs/react';
import { AlertCircle, ArrowLeft, ChevronLeft, ChevronRight, ListChecks, RefreshCcw } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { SharedProps } from '../../types';
import { getPersonalTask, getPersonalTasks, isTaskAccessBoundary, TASK_STATES, type IndividualTask, type ReadError, type TaskPage, type TaskState } from './taskReadApi';
import { TaskCreateForm, TaskStateActions } from './TaskMutationControls';

const labels: Record<TaskState,string> = {open:'Open',in_progress:'In Progress',completed:'Completed'};
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
function Status({value}:{value:TaskState}) {
    return <span className={'inline-block rounded-full px-2.5 py-1 text-[11px] font-semibold '+colors[value]}>{labels[value]}</span>;
}
function ErrorPanel({error,retry,back}:{error:ReadError;retry:()=>void;back?:()=>void}) {
    const expired=error.status===401||error.status===419;
    return <div role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm dark:border-amber-800 dark:bg-amber-950/40">
        <div className="flex items-center gap-2 font-bold text-amber-950 dark:text-amber-100">
            <AlertCircle size={17} aria-hidden="true"/> Personal Tasks unavailable{error.status ? ' ('+error.status+')' : ''}
        </div>
        <p className="mt-2 leading-6 text-amber-900 dark:text-amber-200">{error.message}</p>
        {error.requestId&&<p className="mt-2 break-all text-xs text-amber-800 dark:text-amber-200">Request ID: {error.requestId}</p>}
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
function Detail({task,back,onChanged,onDenied}:{task:IndividualTask;back:()=>void;onChanged:()=>void;onDenied:(error:ReadError)=>void}) {
    const dates:[string,string|null][]=[['Due',task.due_at],['Created',task.created_at],['Updated',task.updated_at],['Completed',task.completed_at]];
    return <section aria-label="Personal Task detail" className="min-w-0 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-[#142236]">
        <button type="button" onClick={back} className="mb-4 inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-semibold dark:border-slate-600">
            <ArrowLeft size={15} aria-hidden="true"/> Back to tasks
        </button>
        <div className="flex flex-wrap items-center justify-between gap-2"><span className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">Individual Task #{task.id}</span><Status value={task.state}/></div>
        <h4 className="mt-3 break-words text-xl font-extrabold text-slate-900 dark:text-white">{task.title}</h4>
        <dl className="mt-5 grid grid-cols-1 gap-3 border-y border-slate-100 py-4 text-xs sm:grid-cols-2 dark:border-slate-700">
            {dates.map(([label,value])=><div key={label}><dt className="font-semibold text-slate-500 dark:text-slate-400">{label}</dt>
            <dd className="mt-1 break-words text-slate-800 dark:text-slate-100">{formatDate(value)}</dd></div>)}
        </dl>
        <h5 className="mt-5 text-sm font-bold text-slate-900 dark:text-white">Instructions</h5>
        <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700 dark:text-slate-300">{task.instructions??'No instructions were provided.'}</p>
        <TaskStateActions task={task} onChanged={onChanged} onDenied={onDenied}/>
    </section>;
}
function TaskSession() {
    const [state,setState]=useState<TaskState>('open');
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
            else { setListError(r.error); if(isTaskAccessBoundary(r.error)) setSelected(null); }
        }).catch(()=>{if(active)setListError({status:null,code:null,message:'Unable to retrieve the Task list.',nextUrl:null,requestId:null});})
        .finally(()=>{if(active)setListLoading(false);});
        return ()=>{active=false;control.abort();};
    },[state,page,refresh]);
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
                } else setDetailError(r.error);
            }
            else if(r.data.id!==selected)setDetailError({status:null,code:'INVALID_RESPONSE',message:'The Task service returned an unexpected record.',requestId:null,nextUrl:null});
            else setDetail(r.data);
        }).catch(()=>{if(active)setDetailError({status:null,code:null,message:'Unable to retrieve Task details.',requestId:null,nextUrl:null});})
        .finally(()=>{if(active)setDetailLoading(false);});
        return ()=>{active=false;control.abort();};
    },[selected,detailRefresh]);
    useEffect(()=>{if(detail)focusTitle.current?.focus();},[detail]);
    const onChanged=()=>{setState('open');setPage(1);setSelected(null);setDetail(null);setRefresh(n=>n+1);};
    const onDenied=(error:ReadError)=>{setList(null);setDetail(null);setSelected(null);setListError(error);};
    const chooseState=(value:TaskState)=>{if(value===state)return;setState(value);setPage(1);setSelected(null);};
    const choosePage=(value:number)=>{if(!list||value<1||value>list.meta.last_page||value>10000)return;setPage(value);setSelected(null);};
    return <section className="municipal-panel overflow-hidden" aria-labelledby="personal-task-heading">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-4 dark:border-slate-700 sm:px-5">
            <div><h2 id="personal-task-heading" className="flex items-center gap-2 text-base font-extrabold text-slate-900 dark:text-slate-100"><ListChecks size={19} className="text-blue-700 dark:text-blue-300" aria-hidden="true"/> Personal Tasks</h2>
                <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">Your individual Task records, separate from Work Requests.</p></div>
            <button type="button" onClick={()=>{setRefresh(n=>n+1);if(selected!==null)setDetailRefresh(n=>n+1);}}
                className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 px-3 text-xs font-semibold dark:border-slate-600"><RefreshCcw size={14} aria-hidden="true"/> Refresh</button>
        </header>
        <TaskCreateForm onChanged={onChanged} onDenied={onDenied}/>
        <div role="group" aria-label="Task state filter" className="flex overflow-x-auto border-b border-slate-200 px-2 dark:border-slate-700 sm:px-4">
            {TASK_STATES.map(value=><button type="button" key={value} aria-pressed={state===value} onClick={()=>chooseState(value)}
                className={'min-h-11 shrink-0 border-b-[3px] px-3 py-2 text-xs font-bold sm:px-5 '+(state===value?'border-blue-700 text-blue-800 dark:border-blue-300 dark:text-blue-200':'border-transparent text-slate-500 hover:text-blue-700 dark:text-slate-400')}>{labels[value]}</button>)}
        </div>
        <div className="grid min-w-0 gap-4 p-4 sm:p-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,.9fr)]">
            <div className="min-w-0">
                {listLoading&&<Loading label="Loading personal Tasks"/>}
                {!listLoading&&listError&&<ErrorPanel error={listError} retry={()=>setRefresh(n=>n+1)}/>}
                {!listLoading&&!listError&&list&&(list.data.length===0?
                    <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-600 dark:border-slate-600 dark:text-slate-300">
                        {list.meta.total===0?'No individual Tasks in this state.':'No Tasks returned for this page.'}</div>:
                    <ul aria-label={labels[state]+' personal Tasks'} className="space-y-2">
                        {list.data.map(task=><li key={task.id}><button type="button" aria-pressed={selected===task.id} onClick={()=>setSelected(task.id)}
                            className={'w-full rounded-xl border p-4 text-left motion-reduce:transition-none '+(selected===task.id?'border-blue-500 bg-blue-50 dark:bg-blue-950/40':'border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800/50')}>
                            <span className="flex flex-wrap items-center justify-between gap-2"><Status value={task.state}/><span className="text-[11px] text-slate-500 dark:text-slate-400">#{task.id}</span></span>
                            <span className="mt-2 block break-words text-sm font-bold text-slate-900 dark:text-white">{task.title}</span>
                            <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">Due: {formatDate(task.due_at)}</span>
                            {task.instructions&&<span className="mt-2 line-clamp-2 block break-words text-xs leading-5 text-slate-600 dark:text-slate-300">{task.instructions}</span>}
                        </button></li>)}
                    </ul>)}
                {!listLoading&&list&&<nav aria-label="Server Task pagination" className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs text-slate-600 dark:text-slate-300">Page {list.meta.page} of {list.meta.last_page} · {list.meta.total} Tasks</p>
                    <div className="flex gap-2">
                        <button type="button" aria-label="Previous Task page" disabled={list.meta.page<=1} onClick={()=>choosePage(list.meta.page-1)} className="min-h-10 rounded-lg border border-slate-300 px-3 disabled:opacity-40 dark:border-slate-600"><ChevronLeft size={17}/></button>
                        <button type="button" aria-label="Next Task page" disabled={list.meta.page>=list.meta.last_page||list.meta.page>=10000} onClick={()=>choosePage(list.meta.page+1)} className="min-h-10 rounded-lg border border-slate-300 px-3 disabled:opacity-40 dark:border-slate-600"><ChevronRight size={17}/></button>
                    </div></nav>}
            </div>
            <div className="min-w-0" aria-live="polite">
                {selected===null&&<p className="rounded-xl border border-dashed border-slate-300 p-6 text-sm text-slate-600 dark:border-slate-600 dark:text-slate-300">Choose an individual Task to see its details.</p>}
                {selected!==null&&detailLoading&&<Loading label="Loading Task detail"/>}
                {selected!==null&&!detailLoading&&detailError&&<ErrorPanel error={detailError} retry={()=>setDetailRefresh(n=>n+1)} back={()=>setSelected(null)}/>}
                {selected!==null&&!detailLoading&&detail?.id===selected&&<><h3 className="sr-only" ref={focusTitle} tabIndex={-1}>Selected Task details</h3><Detail task={detail} back={()=>setSelected(null)} onChanged={onChanged} onDenied={onDenied}/></>}
            </div>
        </div>
    </section>;
}
/** Key component state by logged-in user; never show one account's cached Task data to another. */
export default function PersonalTaskWorkspace(){
    const id=usePage<SharedProps>().props.auth?.user?.id;
    return typeof id==='number'?<TaskSession key={id}/>:null;
}
