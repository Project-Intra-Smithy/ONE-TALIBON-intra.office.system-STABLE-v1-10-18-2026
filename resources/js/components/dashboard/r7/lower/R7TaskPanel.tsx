import { usePage } from '@inertiajs/react';
import { ChevronDown, ChevronUp, ListChecks, RefreshCcw } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { SharedProps } from '../../../../types';
import PersonalTaskMutationPanel from '../../../tasks/PersonalTaskMutationPanel';
import PersonalTaskWorkspace from '../../../tasks/PersonalTaskWorkspace';
import { getPersonalTasks, type IndividualTask, type ReadError } from '../../../tasks/taskReadApi';

const TASK_SYNC_EVENT = 'one-talibon:personal-task-confirmed';

function formatDue(value: string | null): string {
    if (!value) return 'No due date';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Date unavailable';
    return new Intl.DateTimeFormat('en-PH', {
        dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Manila',
    }).format(date);
}

function TaskSummary({ userId }: { userId: number }) {
    const [tasks, setTasks] = useState<IndividualTask[]>([]);
    const [count, setCount] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<ReadError | null>(null);
    const [generation, setGeneration] = useState(0);
    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
        const controller = new AbortController();
        let active = true;
        setTasks([]);
        setCount(null);
        setError(null);
        setLoading(true);
        void getPersonalTasks('open', 1, controller.signal).then((result) => {
            if (!active || controller.signal.aborted) return;
            if (result.ok) {
                setTasks(result.data.data.slice(0, 3));
                setCount(result.data.meta.total);
            } else {
                setTasks([]);
                setCount(null);
                setError(result.error);
            }
        }).catch(() => {
            if (active && !controller.signal.aborted) {
                setTasks([]);
                setCount(null);
                setError({ status: null, code: null, requestId: null, nextUrl: null,
                    message: 'Unable to load personal Tasks. Try again.' });
            }
        }).finally(() => { if (active) setLoading(false); });
        return () => { active = false; controller.abort(); };
    }, [userId, generation]);

    useEffect(() => {
        const onMutation = (event: Event) => {
            const detail = (event as CustomEvent<{ userId?: number }>).detail;
            if (detail?.userId === userId) setGeneration((value) => value + 1);
        };
        window.addEventListener(TASK_SYNC_EVENT, onMutation);
        return () => window.removeEventListener(TASK_SYNC_EVENT, onMutation);
    }, [userId]);

    return (
        <section className="r7-lower-card r7-lower-tasks" id="personal-tasks" tabIndex={-1} aria-labelledby="r7-task-heading">
            <header className="r7-lower-title r7-task-heading">
                <ListChecks size={17} aria-hidden="true" />
                <h2 id="r7-task-heading">My Tasks</h2>
            </header>
            <div className="r7-task-summary">
                <div className="r7-task-summary-top">
                    <p className="r7-task-description">
                        {count === null ? 'Your personal open Tasks' : `${count} open personal ${count === 1 ? 'Task' : 'Tasks'}`}
                    </p>
                    <button type="button" className="r7-task-refresh" aria-label="Refresh open personal Tasks"
                        disabled={loading} onClick={() => setGeneration((value) => value + 1)}>
                        <RefreshCcw size={15} aria-hidden="true" />
                    </button>
                </div>
                {loading && <p className="r7-task-state" role="status">Loading your Tasks…</p>}
                {!loading && error && <div role="alert" className="r7-task-error">
                    <p>{error.message}</p>
                    {error.requestId && <p className="r7-task-request-id">Request ID: {error.requestId}</p>}
                    {(error.status === 401 || error.status === 419) && <a href="/login">Sign in again</a>}
                    {error.nextUrl && <a href={error.nextUrl}>Complete MFA</a>}
                    {error.status !== 401 && error.status !== 419 && error.code !== 'MFA_REQUIRED' &&
                        <button type="button" onClick={() => setGeneration((value) => value + 1)}>Try again</button>}
                </div>}
                {!loading && !error && count === 0 &&
                    <p className="r7-task-state">No open personal Tasks.</p>}
                {!loading && !error && tasks.length > 0 && <ul className="r7-task-list" aria-label="Open personal Tasks">
                    {tasks.map((task) => <li className="r7-task-item" key={task.id}>
                        <span className="r7-task-item-title">{task.title}</span>
                        <span className="r7-task-item-meta">
                            <span className="r7-task-status">Open</span>
                            <span>{formatDue(task.due_at)}</span>
                        </span>
                    </li>)}
                </ul>}
                {!loading && !error && count !== null && count > tasks.length &&
                    <p className="r7-task-more">Showing {tasks.length} of {count} open Tasks</p>}
                <button type="button" className="r7-task-expand"
                    aria-expanded={expanded} aria-controls="r7-task-manager"
                    onClick={() => setExpanded((value) => !value)}>
                    {expanded ? 'Close task manager' : 'Manage my tasks'}
                    {expanded ? <ChevronUp size={17} aria-hidden="true" /> :
                        <ChevronDown size={17} aria-hidden="true" />}
                </button>
            </div>
            {expanded && <div id="r7-task-manager" className="r7-task-manager">
                <PersonalTaskWorkspace />
                <PersonalTaskMutationPanel />
            </div>}
        </section>
    );
}

/** Key the entire read/manager state by authenticated identity. */
export default function R7TaskPanel() {
    const userId = usePage<SharedProps>().props.auth?.user?.id;
    return typeof userId === 'number' ? <TaskSummary key={userId} userId={userId} /> :
        <section className="r7-lower-card r7-lower-tasks" id="personal-tasks" tabIndex={-1} aria-labelledby="r7-task-heading">
            <header className="r7-lower-title r7-task-heading"><h2 id="r7-task-heading">My Tasks</h2></header>
            <p className="r7-task-state" role="status">Sign in to access personal Tasks.</p>
        </section>;
}
