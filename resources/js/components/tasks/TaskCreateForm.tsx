import { useState, type FormEvent } from 'react';
import { localDateTimeWithOffset, type CreateTaskInput } from './taskWriteApi';

type Props = {
    busy:boolean; blocked:boolean; onCreate:(input:CreateTaskInput)=>void; onCancel:()=>void;
};
export default function TaskCreateForm({busy,blocked,onCreate,onCancel}:Props){
    const [title,setTitle]=useState('');
    const [instructions,setInstructions]=useState('');
    const [dueLocal,setDueLocal]=useState('');
    const [localError,setLocalError]=useState<string|null>(null);
    const submit=(event:FormEvent<HTMLFormElement>)=>{
        event.preventDefault();
        if(busy||blocked)return;
        const clean=title.trim();
        if(!clean||clean.length>255){setLocalError('Title is required and cannot exceed 255 characters.');return;}
        if(instructions.length>10000){setLocalError('Instructions cannot exceed 10,000 characters.');return;}
        const due=dueLocal ? localDateTimeWithOffset(dueLocal) : null;
        if(dueLocal&&!due){setLocalError('Enter a valid local date and time including minutes.');return;}
        setLocalError(null);
        onCreate({title:clean,instructions:instructions.trim()||null,due_at:due});
    };
    return <form aria-label="Create personal Task" onSubmit={submit}
        className="border-b border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/50 sm:p-5">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Create individual Task</h3>
        <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">For your own personal work only. Work Requests belong to a separate workflow.</p>
        <div className="mt-4 grid gap-3">
            <label className="text-xs font-semibold text-slate-800 dark:text-slate-200" htmlFor="f02-title">Title (required)
                <input id="f02-title" type="text" name="title" required maxLength={255}
                    value={title} onChange={e=>setTitle(e.target.value)} disabled={busy||blocked}
                    className="mt-1 block min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"/>
            </label>
            <label className="text-xs font-semibold text-slate-800 dark:text-slate-200" htmlFor="f02-instructions">Instructions (optional)
                <textarea id="f02-instructions" name="instructions" maxLength={10000} rows={3}
                    value={instructions} onChange={e=>setInstructions(e.target.value)} disabled={busy||blocked}
                    className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"/>
            </label>
            <label className="text-xs font-semibold text-slate-800 dark:text-slate-200" htmlFor="f02-due">Due date/time (optional, your device's local timezone)
                <input id="f02-due" type="datetime-local" name="due_at" step={60}
                    value={dueLocal} onChange={e=>setDueLocal(e.target.value)} disabled={busy||blocked}
                    className="mt-1 block min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"/>
            </label>
        </div>
        {localError&&<p role="alert" className="mt-3 text-xs font-semibold text-red-700 dark:text-red-300">{localError}</p>}
        <div className="mt-4 flex flex-wrap gap-2">
            <button type="submit" disabled={busy||blocked||!title.trim()} className="min-h-11 rounded-lg bg-blue-700 px-4 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">
                {busy?'Submitting…':'Create Task'}
            </button>
            <button type="button" disabled={busy} onClick={onCancel}
                className="min-h-11 rounded-lg border border-slate-400 px-4 py-2 text-xs font-semibold dark:border-slate-600">Cancel</button>
        </div>
    </form>;
}
