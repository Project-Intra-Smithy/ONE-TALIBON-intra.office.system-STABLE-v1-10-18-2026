import { usePage } from '@inertiajs/react';
import { AlertCircle, ChevronLeft, ChevronRight, ListChecks, RefreshCcw } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { SharedProps } from '../../types';
import { Button, Dialog, StatusBadge } from '../ui';
import {
    getPersonalTask,
    getPersonalTasks,
    isTaskAccessBoundary,
    TASK_STATES,
    type IndividualTask,
    type ReadError,
    type TaskPage,
    type TaskState,
} from './taskReadApi';

const labels: Record<TaskState, string> = {
    open: 'Open',
    in_progress: 'In Progress',
    completed: 'Completed',
};

const badgeTone: Record<TaskState, 'info' | 'warn' | 'ok'> = {
    open: 'info',
    in_progress: 'warn',
    completed: 'ok',
};

function formatDate(value: string | null): string {
    if (!value) return 'Not set';
    const date = new Date(value);
    return Number.isNaN(date.getTime())
        ? 'Unavailable'
        : new Intl.DateTimeFormat('en-PH', {
            dateStyle: 'medium',
            timeStyle: 'short',
            timeZone: 'Asia/Manila',
        }).format(date);
}

function dueLabel(task: IndividualTask): string | null {
    if (!task.due_at || task.state === 'completed') return null;
    const remaining = Date.parse(task.due_at) - Date.now();
    if (!Number.isFinite(remaining)) return null;
    return remaining < 0 ? 'Overdue' : remaining <= 48 * 60 * 60 * 1000 ? 'Due within 48 hours' : null;
}

function Status({ value }: { value: TaskState }) {
    return <StatusBadge tone={badgeTone[value]}>{labels[value]}</StatusBadge>;
}

function ErrorPanel({ error, retry, back }: { error: ReadError; retry: () => void; back?: () => void }) {
    const expired = error.status === 401 || error.status === 419;
    return (
        <div
            role="alert"
            className="rounded-xl border border-[var(--status-warn-border)] bg-[var(--status-warn-bg)] p-4 text-sm text-[var(--status-warn-fg)]"
        >
            <div className="flex items-center gap-2 font-bold">
                <AlertCircle size={17} aria-hidden="true" />
                <span>Personal Tasks unavailable{error.status ? ` (${error.status})` : ''}</span>
            </div>
            <p className="mt-2 leading-6">{error.message}</p>
            {error.requestId && <p className="mt-2 break-all font-mono text-xs">Request ID: {error.requestId}</p>}
            <div className="mt-3 flex flex-wrap gap-2">
                {expired && (
                    <a href="/login" className="municipal-primary-button">
                        Sign in again
                    </a>
                )}
                {error.nextUrl && (
                    <a href={error.nextUrl} className="municipal-primary-button">
                        Complete MFA
                    </a>
                )}
                {back && (
                    <Button variant="secondary" size="sm" onClick={back}>
                        Close
                    </Button>
                )}
                {!expired && error.code !== 'MFA_REQUIRED' && (
                    <Button variant="secondary" size="sm" onClick={retry}>
                        Retry read
                    </Button>
                )}
            </div>
        </div>
    );
}

function Loading({ label }: { label: string }) {
    return (
        <div role="status" className="space-y-3 rounded-xl border border-[var(--border-default)] bg-[var(--surface-recessed)] p-5">
            <span className="sr-only">{label}</span>
            <div aria-hidden="true" className="h-4 w-3/4 animate-pulse rounded bg-[var(--border-default)] motion-reduce:animate-none" />
            <div aria-hidden="true" className="h-3 w-1/2 animate-pulse rounded bg-[var(--border-default)] motion-reduce:animate-none" />
        </div>
    );
}

const TASK_SYNC_EVENT = 'one-talibon:personal-task-confirmed';
type TaskSyncDetail = { userId: number; taskId: number; state: TaskState };

function DetailBody({ task }: { task: IndividualTask }) {
    const dates: [string, string | null][] = [
        ['Due', task.due_at],
        ['Created', task.created_at],
        ['Updated', task.updated_at],
        ['Completed', task.completed_at],
    ];
    const deadline = dueLabel(task);

    return (
        <section aria-label="Personal Task detail" className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
                <Status value={task.state} />
                {deadline && (
                    <StatusBadge tone={deadline === 'Overdue' ? 'danger' : 'warn'}>{deadline}</StatusBadge>
                )}
            </div>

            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {dates.map(([label, value]) => (
                    <div
                        key={label}
                        className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-recessed)] p-3.5"
                    >
                        <dt className="text-xs font-bold uppercase tracking-wide text-[var(--ink-secondary)]">
                            {label}
                        </dt>
                        <dd className="mt-1 break-words text-sm font-semibold text-[var(--ink-primary)]">
                            {formatDate(value)}
                        </dd>
                    </div>
                ))}
            </dl>

            <section className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-recessed)] p-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--brand-ink)]">
                    Instructions
                </h4>
                <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-[var(--ink-primary)]">
                    {task.instructions ?? 'No instructions were provided.'}
                </p>
            </section>
        </section>
    );
}

function TaskSession({ userId }: { userId: number }) {
    const [state, setState] = useState<TaskState>('open');
    const [page, setPage] = useState(1);
    const [refresh, setRefresh] = useState(0);
    const [list, setList] = useState<TaskPage | null>(null);
    const [listError, setListError] = useState<ReadError | null>(null);
    const [listLoading, setListLoading] = useState(true);
    const [selected, setSelected] = useState<number | null>(null);
    const [detail, setDetail] = useState<IndividualTask | null>(null);
    const [detailError, setDetailError] = useState<ReadError | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailRefresh, setDetailRefresh] = useState(0);

    useEffect(() => {
        const control = new AbortController();
        let active = true;
        setList(null);
        setListError(null);
        setListLoading(true);
        getPersonalTasks(state, page, control.signal)
            .then((r) => {
                if (!active) return;
                if (r.ok) setList(r.data);
                else {
                    setListError(r.error);
                    if (isTaskAccessBoundary(r.error)) setSelected(null);
                }
            })
            .catch(() => {
                if (active) {
                    setListError({
                        status: null,
                        code: null,
                        message: 'Unable to retrieve the Task list.',
                        nextUrl: null,
                        requestId: null,
                    });
                }
            })
            .finally(() => {
                if (active) setListLoading(false);
            });
        return () => {
            active = false;
            control.abort();
        };
    }, [state, page, refresh]);

    useEffect(() => {
        if (selected === null) {
            setDetail(null);
            setDetailError(null);
            setDetailLoading(false);
            return;
        }
        const control = new AbortController();
        let active = true;
        setDetail(null);
        setDetailError(null);
        setDetailLoading(true);
        getPersonalTask(selected, control.signal)
            .then((r) => {
                if (!active) return;
                if (!r.ok) {
                    if (isTaskAccessBoundary(r.error)) {
                        // The detail read revoked authorization: do not expose previously cached list rows.
                        setList(null);
                        setListError(r.error);
                        setSelected(null);
                    } else setDetailError(r.error);
                } else if (r.data.id !== selected) {
                    setDetailError({
                        status: null,
                        code: 'INVALID_RESPONSE',
                        message: 'The Task service returned an unexpected record.',
                        requestId: null,
                        nextUrl: null,
                    });
                } else setDetail(r.data);
            })
            .catch(() => {
                if (active) {
                    setDetailError({
                        status: null,
                        code: null,
                        message: 'Unable to retrieve Task details.',
                        requestId: null,
                        nextUrl: null,
                    });
                }
            })
            .finally(() => {
                if (active) setDetailLoading(false);
            });
        return () => {
            active = false;
            control.abort();
        };
    }, [selected, detailRefresh]);

    useEffect(() => {
        const synchronize = (event: Event) => {
            const detail = (event as CustomEvent<TaskSyncDetail>).detail;
            if (!detail || detail.userId !== userId || !TASK_STATES.includes(detail.state)) return;
            setSelected(null);
            setDetail(null);
            setDetailError(null);
            setState(detail.state);
            setPage(1);
            setRefresh((value) => value + 1);
        };
        window.addEventListener(TASK_SYNC_EVENT, synchronize);
        return () => window.removeEventListener(TASK_SYNC_EVENT, synchronize);
    }, [userId]);

    const chooseState = (value: TaskState) => {
        if (value === state) return;
        setState(value);
        setPage(1);
        setSelected(null);
    };

    const choosePage = (value: number) => {
        if (!list || value < 1 || value > list.meta.last_page || value > 10000) return;
        setPage(value);
        setSelected(null);
    };

    const closeDetail = () => {
        const previousId = selected;
        setSelected(null);
        if (previousId !== null) {
            requestAnimationFrame(() => document.getElementById(`task-row-${previousId}`)?.focus());
        }
    };

    const selectedSummary = list?.data.find((task) => task.id === selected) ?? null;

    return (
        <section className="tcds-card task-workspace overflow-hidden" aria-labelledby="personal-task-heading">
            <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-default)] px-4 py-4 sm:px-5">
                <div>
                    <h2 id="personal-task-heading" className="flex items-center gap-2 text-lg font-bold text-[var(--ink-primary)]">
                        <ListChecks size={19} className="text-[var(--brand-ink)]" aria-hidden="true" />
                        <span>My Tasks</span>
                    </h2>
                    <p className="mt-0.5 text-sm leading-6 text-[var(--ink-secondary)]">
                        Review your tasks by status, check deadlines, and select a task to inspect full details.
                    </p>
                </div>
                <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                        setRefresh((n) => n + 1);
                        if (selected !== null) setDetailRefresh((n) => n + 1);
                    }}
                >
                    <RefreshCcw size={14} aria-hidden="true" />
                    <span>Refresh</span>
                </Button>
            </header>

            <div role="group" aria-label="Task state filter" className="flex flex-wrap border-b border-[var(--border-default)] px-2 sm:px-4">
                {TASK_STATES.map((value) => (
                    <button
                        type="button"
                        key={value}
                        aria-pressed={state === value}
                        onClick={() => chooseState(value)}
                        className={
                            'min-h-11 shrink-0 border-b-[3px] px-3 py-2 text-sm font-bold transition-colors sm:px-5 ' +
                            (state === value
                                ? 'border-[var(--brand-primary)] text-[var(--brand-ink)]'
                                : 'border-transparent text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]')
                        }
                    >
                        {labels[value]}
                    </button>
                ))}
            </div>

            <div className="min-w-0 p-4 sm:p-5">
                {listLoading && <Loading label="Loading personal Tasks" />}
                {!listLoading && listError && <ErrorPanel error={listError} retry={() => setRefresh((n) => n + 1)} />}
                {!listLoading && !listError && list && (
                    list.data.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-[var(--border-control)] p-8 text-center text-sm text-[var(--ink-secondary)]">
                            {list.meta.total === 0 ? 'No individual Tasks in this state.' : 'No Tasks returned for this page.'}
                        </div>
                    ) : (
                        <ul aria-label={`${labels[state]} personal Tasks`} className="task-rows space-y-2.5">
                            {list.data.map((task) => {
                                const isSelected = selected === task.id;
                                const deadline = dueLabel(task);
                                return (
                                    <li key={task.id}>
                                        <button
                                            type="button"
                                            aria-pressed={isSelected}
                                            id={`task-row-${task.id}`}
                                            onClick={() => setSelected(task.id)}
                                            className={
                                                'task-row flex w-full flex-col gap-2 rounded-xl border p-4 text-left transition-colors sm:flex-row sm:items-center sm:justify-between ' +
                                                (isSelected
                                                    ? 'border-[var(--brand-primary)] bg-[var(--brand-soft)]'
                                                    : 'border-[var(--border-default)] bg-[var(--surface-card)] hover:border-[var(--border-control)] hover:bg-[var(--surface-hover)]')
                                            }
                                        >
                                            <span className="min-w-0 flex-1">
                                                <span className="block break-words text-base font-bold text-[var(--ink-primary)]">
                                                    {task.title}
                                                </span>
                                                <span className="task-row-meta mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                                                    <Status value={task.state} />
                                                    <span className="text-xs font-medium text-[var(--ink-secondary)]">
                                                        Due: {formatDate(task.due_at)}
                                                    </span>
                                                    {deadline && (
                                                        <span className="task-deadline text-xs font-bold text-[var(--status-danger-fg)]">
                                                            {deadline}
                                                        </span>
                                                    )}
                                                    <span className="font-mono text-xs text-[var(--ink-secondary)]">
                                                        #{task.id}
                                                    </span>
                                                </span>
                                            </span>
                                            <span className="task-row-action inline-flex shrink-0 items-center gap-1 self-start rounded-lg border border-[var(--border-control)] bg-[var(--surface-recessed)] px-3 py-1.5 text-xs font-semibold text-[var(--ink-primary)] sm:self-center">
                                                <span>{isSelected ? 'Viewing' : 'View details'}</span>
                                                <ChevronRight size={14} aria-hidden="true" />
                                            </span>
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    )
                )}

                {!listLoading && list && (
                    <nav aria-label="Server Task pagination" className="mt-4 flex flex-wrap items-center justify-between gap-3">
                        <p className="text-xs font-medium text-[var(--ink-secondary)]">
                            Page {list.meta.page} of {list.meta.last_page} · {list.meta.total} Tasks
                        </p>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                aria-label="Previous Task page"
                                disabled={list.meta.page <= 1}
                                onClick={() => choosePage(list.meta.page - 1)}
                                className="inline-flex min-h-10 items-center justify-center rounded-lg border border-[var(--border-control)] px-3 text-[var(--ink-primary)] disabled:opacity-40"
                            >
                                <ChevronLeft size={17} aria-hidden="true" />
                            </button>
                            <button
                                type="button"
                                aria-label="Next Task page"
                                disabled={list.meta.page >= list.meta.last_page || list.meta.page >= 10000}
                                onClick={() => choosePage(list.meta.page + 1)}
                                className="inline-flex min-h-10 items-center justify-center rounded-lg border border-[var(--border-control)] px-3 text-[var(--ink-primary)] disabled:opacity-40"
                            >
                                <ChevronRight size={17} aria-hidden="true" />
                            </button>
                        </div>
                    </nav>
                )}
            </div>

            <Dialog
                open={selected !== null}
                onClose={closeDetail}
                variant="drawer-right"
                title={detail?.title ?? selectedSummary?.title ?? 'Task details'}
                description={selected !== null ? `Individual Task #${selected}` : undefined}
                footer={
                    <Button variant="secondary" size="sm" onClick={closeDetail}>
                        Close
                    </Button>
                }
            >
                <div aria-live="polite">
                    {selected !== null && detailLoading && <Loading label="Loading Task detail" />}
                    {selected !== null && !detailLoading && detailError && (
                        <ErrorPanel
                            error={detailError}
                            retry={() => setDetailRefresh((n) => n + 1)}
                            back={closeDetail}
                        />
                    )}
                    {selected !== null && !detailLoading && detail?.id === selected && <DetailBody task={detail} />}
                </div>
            </Dialog>
        </section>
    );
}

/** Key component state by logged-in user; never show one account's cached Task data to another. */
export default function PersonalTaskWorkspace() {
    const id = usePage<SharedProps>().props.auth?.user?.id;
    return typeof id === 'number' ? <TaskSession key={id} userId={id} /> : null;
}
