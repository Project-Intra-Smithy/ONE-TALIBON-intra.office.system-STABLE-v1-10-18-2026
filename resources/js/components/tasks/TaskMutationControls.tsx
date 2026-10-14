import { useState, type FormEvent } from 'react';
import { createPersonalTask, isTaskAccessBoundary, transitionPersonalTask,
    type IndividualTask, type ReadError } from './taskReadApi';

type Callbacks = { onChanged: () => void; onDenied: (error: ReadError) => void };
const actionClass = 'inline-flex min-h-11 items-center justify-center rounded-lg bg-[#12613f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0b442d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#19754b] disabled:cursor-not-allowed disabled:opacity-50';

function ActionFeedback({ error }: { error: ReadError | null }) {
    if (!error) return null;
    return <div role="alert" className="mt-3 rounded-lg border border-rose-300 bg-rose-50 p-3 text-sm text-rose-900 dark:border-rose-700 dark:bg-rose-950 dark:text-rose-100">
        <p>{error.message}{error.status ? ` (HTTP ${error.status})` : ''}</p>
        {error.requestId && <p className="mt-1 break-all text-xs">Request ID: {error.requestId}</p>}
        {(error.status === 401 || error.status === 419) && <a className="mt-2 inline-block underline" href="/login">Sign in again</a>}
        {error.nextUrl && <a className="mt-2 inline-block underline" href={error.nextUrl}>Complete MFA</a>}
    </div>;
}

export function TaskCreateForm({ onChanged, onDenied }: Callbacks) {
    const [title, setTitle] = useState('');
    const [instructions, setInstructions] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<ReadError | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const submit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (busy || !title.trim()) return;
        setBusy(true); setError(null); setSuccess(null);
        try {
            const result = await createPersonalTask(title, instructions || null);
            if (!result.ok) {
                setError(result.error);
                if (isTaskAccessBoundary(result.error)) onDenied(result.error);
                return;
            }
            setTitle(''); setInstructions('');
            setSuccess(`Task #${result.data.id} created.`);
            onChanged();
        } catch {
            setError({ status: null, code: 'INVALID_INPUT', message: 'Check the Task form fields.',
                nextUrl: null, requestId: null });
        } finally { setBusy(false); }
    };
    return <form onSubmit={submit} aria-label="Create individual Task" className="space-y-3 border-b border-slate-200 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-900/30 sm:p-5">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Create individual Task</h3>
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_auto] sm:items-end">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">Title
                <input required maxLength={255} value={title} onChange={(e) => setTitle(e.target.value)}
                    className="mt-1 block min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                    placeholder="Task title" />
            </label>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">Instructions (optional)
                <input maxLength={10000} value={instructions} onChange={(e) => setInstructions(e.target.value)}
                    className="mt-1 block min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                    placeholder="Work details" />
            </label>
            <button disabled={busy || !title.trim()} type="submit" className={actionClass}>{busy ? 'Creating…' : 'Create Task'}</button>
        </div>
        {success && <p role="status" className="text-sm text-emerald-800 dark:text-emerald-300">{success}</p>}
        <ActionFeedback error={error}/>
    </form>;
}

export function TaskStateActions({ task, onChanged, onDenied }: Callbacks & { task: IndividualTask }) {
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<ReadError | null>(null);
    const action = task.state === 'open' ? 'start' : task.state === 'in_progress' ? 'complete' : null;
    const submit = async () => {
        if (busy || !action) return;
        setBusy(true); setError(null);
        try {
            const result = await transitionPersonalTask(task.id, action);
            if (!result.ok) {
                setError(result.error);
                if (isTaskAccessBoundary(result.error)) onDenied(result.error);
                return;
            }
            onChanged();
        } catch {
            setError({ status: null, code: 'REQUEST_ERROR', message: 'The Task action could not be completed.',
                nextUrl: null, requestId: null });
        } finally { setBusy(false); }
    };
    return <div className="mt-5 border-t border-slate-200 pt-4 dark:border-slate-700">
        {action ? <button type="button" disabled={busy} onClick={submit} className={actionClass}>
            {busy ? 'Saving…' : action === 'start' ? 'Start Task' : 'Complete Task'}
        </button> : <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">Completed</p>}
        <ActionFeedback error={error}/>
    </div>;
}
