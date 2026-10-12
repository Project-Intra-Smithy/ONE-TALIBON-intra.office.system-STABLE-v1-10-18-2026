import { usePage } from '@inertiajs/react';
import { type FormEvent, useEffect, useRef, useState } from 'react';
import type { SharedProps } from '../../types';
import {
    parseTaskDetail,
    parseTaskPage,
    type IndividualTask,
    type TaskState,
} from './taskReadApi';

const allowedStates = new Set<TaskState>(['open', 'in_progress', 'completed']);
const protectedError = (status: number) => status === 401 || status === 403 || status === 419;

async function jsonBody(response: Response): Promise<unknown> {
    if (!response.headers.get('content-type')?.toLowerCase().includes('application/json')) return null;
    try { return await response.json(); } catch { return null; }
}

function TaskActions() {
    const [tasks, setTasks] = useState<IndividualTask[]>([]);
    const [title, setTitle] = useState('');
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [receipt, setReceipt] = useState<string | null>(null);
    const [unknownOutcome, setUnknownOutcome] = useState(false);
    const request = useRef(false);
    const mounted = useRef(false);

    useEffect(() => {
        mounted.current = true;
        const controller = new AbortController();
        void refresh(controller.signal);
        return () => { mounted.current = false; controller.abort(); };
        // One fetch per authenticated Task panel mount; manual refresh and
        // successful mutations initiate later reads.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function refresh(signal?: AbortSignal, expected?: { id: number; state: TaskState }): Promise<boolean> {
        setLoading(true);
        setTasks([]);
        setError(null);
        setReceipt(null);
        try {
            const response = await fetch('/tasks?per_page=20&page=1', {
                method: 'GET',
                credentials: 'same-origin',
                headers: { Accept: 'application/json' },
                signal,
            });
            const body = await jsonBody(response);
            if (!mounted.current) return false;
            if (!response.ok) {
                setTasks([]);
                setError(protectedError(response.status)
                    ? 'Task access expired or was revoked. Sign in and complete any required MFA again.'
                    : 'Unable to reload your Tasks. No cached Task data is being displayed.');
                return false;
            }

            const page = parseTaskPage(body);
            if (!page) {
                setTasks([]);
                setError('The Task service returned an invalid response.');
                return false;
            }
            setTasks(page.data);
            // An authenticated and validated GET is required before allowing
            // another POST after a transport failure or uncertain outcome.
            setUnknownOutcome(false);

            if (expected) {
                const item = page.data.find((task) => task.id === expected.id);
                if (!item || item.state !== expected.state) {
                    setError('The requested Task state is not confirmed by the server. Reload before continuing.');
                    return false;
                }
                setReceipt('Server confirmed: ' + item.title + ' — ' + item.state.replaceAll('_', ' '));
            }
            return true;
        } catch {
            if (!mounted.current || signal?.aborted) return false;
            setTasks([]);
            setError('The Task read could not be verified. Check your connection and refresh.');
            return false;
        } finally {
            if (mounted.current) setLoading(false);
        }
    }

    async function mutate(url: string, payload: Record<string, string>, expectedState: TaskState) {
        if (request.current || unknownOutcome) return;
        const token = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content;
        if (!token) { setError('Missing CSRF token; reload the application.'); return; }

        request.current = true;
        setBusy(true);
        setError(null);
        setReceipt(null);
        try {
            const response = await fetch(url, {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': token,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify(payload),
            });
            const body = await jsonBody(response);
            if (!mounted.current) return;
            if (!response.ok) {
                if (protectedError(response.status)) setTasks([]);
                setError(protectedError(response.status)
                    ? 'Task access expired or was revoked. Sign in again.'
                    : 'The Task operation was rejected (' + response.status + '). Verify the form and refresh.');
                return;
            }
            const task = parseTaskDetail(body);
            if (!task || !allowedStates.has(task.state) || task.state !== expectedState) {
                setError('The operation response was invalid. Verify the Task from the server before continuing.');
                setUnknownOutcome(true);
                return;
            }

            if (await refresh(undefined, { id: task.id, state: expectedState }) && expectedState === 'open') {
                setTitle('');
            }
        } catch {
            if (mounted.current) {
                setError('The network failed after submission. The outcome is unknown; refresh before another action.');
                setUnknownOutcome(true);
                setTasks([]);
            }
        } finally {
            request.current = false;
            if (mounted.current) setBusy(false);
        }
    }

    const create = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const cleaned = title.trim();
        if (cleaned.length === 0 || cleaned.length > 255) {
            setError('Enter a Task title of 1–255 characters.');
            return;
        }
        void mutate('/tasks', { title: cleaned }, 'open');
    };

    return <section aria-labelledby="task-action-heading" className="municipal-panel p-4 sm:p-5">
        <header className="mb-4">
            <h2 id="task-action-heading" className="text-base font-extrabold text-slate-900 dark:text-white">Personal Task actions</h2>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                Minimal live Laravel integration: create, start and complete your own Tasks. Work Requests remain separate.
            </p>
        </header>
        <form onSubmit={create} className="flex flex-col gap-2 sm:flex-row">
            <label className="flex-1 text-xs font-semibold text-slate-700 dark:text-slate-200">
                Task title
                <input aria-label="New personal Task title" maxLength={255} value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="Enter a personal Task"
                    className="mt-1 block min-h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"/>
            </label>
            <button type="submit" disabled={busy || loading || unknownOutcome}
                className="self-end rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
                Create Task
            </button>
        </form>
        <div role="status" aria-live="polite" className="mt-3 text-sm text-emerald-700 dark:text-emerald-300">{receipt}</div>
        {error && <p role="alert" className="mt-3 text-sm text-red-700 dark:text-red-300">{error}</p>}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-slate-600 dark:text-slate-300">
                {loading ? 'Loading Tasks…' : tasks.length + ' recent Tasks'}
            </p>
            <button type="button" disabled={busy} onClick={() => { void refresh(); }}
                className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold dark:border-slate-700">
                Refresh from server
            </button>
        </div>
        {!loading && <ul aria-label="Personal Task actions list" className="mt-3 space-y-2">
            {tasks.map((task) => <li key={task.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                <div className="min-w-0">
                    <p className="break-words text-sm font-semibold text-slate-900 dark:text-white">{task.title}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-300">{task.state.replaceAll('_', ' ')}</p>
                </div>
                {task.state !== 'completed' && <button type="button"
                    disabled={busy || loading || unknownOutcome}
                    onClick={() => void mutate(
                        '/tasks/' + task.id + (task.state === 'open' ? '/start' : '/complete'),
                        {},
                        task.state === 'open' ? 'in_progress' : 'completed',
                    )}
                    className="rounded-lg border border-blue-500 px-3 py-2 text-xs font-bold text-blue-800 disabled:opacity-50 dark:text-blue-200">
                    {task.state === 'open' ? 'Start' : 'Complete'}
                </button>}
            </li>)}
        </ul>}
    </section>;
}

/** Reset all local Task state whenever the authenticated account changes. */
export default function PersonalTaskMutationPanel() {
    const userId = usePage<SharedProps>().props.auth?.user?.id;

    return typeof userId === 'number' ? <TaskActions key={userId}/> : null;
}
