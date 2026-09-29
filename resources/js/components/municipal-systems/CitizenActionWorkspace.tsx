import { useEffect, useMemo, useState } from 'react';
import {
    ArrowLeft,
    Building2,
    CheckCircle2,
    ChevronRight,
    CircleDot,
    History,
    Inbox,
    MessageSquareText,
    Search,
} from 'lucide-react';
import type { FutureSystemPrototypeConfig } from '../../data/municipal/futureSystemPrototypeData';
import {
    citizenRequestStatuses,
    citizenRequests,
    citizenResponseActivity,
    type CitizenRequest,
    type CitizenRequestPriority,
    type CitizenRequestStatus,
} from '../../data/municipal/citizenActionData';
import DetailDrawer from './DetailDrawer';

type Props = {
    prototype: FutureSystemPrototypeConfig;
    onBack?: () => void;
};

type WorkspaceTab = 'Overview' | 'Request Queue' | 'Routing Board' | 'Response History';
type ModalStep = 'Request' | 'Routing' | 'History';
type OverviewFilter =
    | { kind: 'all' }
    | { kind: 'high' }
    | { kind: 'status'; value: CitizenRequestStatus }
    | { kind: 'category'; value: string };

const tabs: WorkspaceTab[] = ['Overview', 'Request Queue', 'Routing Board', 'Response History'];
const overviewStatuses: CitizenRequestStatus[] = ['Received', 'Routed', 'In progress', 'Awaiting response'];
const requestCategories = Array.from(new Set(citizenRequests.map((request) => request.category)));

const statusTone: Record<CitizenRequestStatus, string> = {
    Received: 'border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200',
    Routed: 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900/60 dark:bg-blue-950/35 dark:text-blue-200',
    'In progress': 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200',
    'Awaiting response': 'border-violet-200 bg-violet-50 text-violet-800 dark:border-violet-900/60 dark:bg-violet-950/30 dark:text-violet-200',
    Resolved: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200',
};

const priorityTone: Record<CitizenRequestPriority, string> = {
    High: 'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200',
    Normal: 'border-blue-100 bg-blue-50/60 text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/20 dark:text-blue-200',
};

function StatusBadge({ status }: { status: CitizenRequestStatus }) {
    return <span className={'inline-flex rounded-full border px-2 py-1 text-[9px] font-bold ' + statusTone[status]}>{status}</span>;
}

function PriorityBadge({ priority }: { priority: CitizenRequestPriority }) {
    return <span className={'inline-flex rounded-full border px-2 py-1 text-[9px] font-bold ' + priorityTone[priority]}>{priority}</span>;
}

function RequestModal({ request, onClose }: { request: CitizenRequest; onClose: () => void }) {
    const [step, setStep] = useState<ModalStep>('Request');

    useEffect(() => {
        setStep('Request');
    }, [request.reference]);

    return (
        <DetailDrawer
            open
            onClose={onClose}
            title={`${request.reference} · ${request.concern}`}
            eyebrow="Citizen request details"
            size="standard"
            footer={<div className="text-[9px] font-semibold text-slate-400">Reference data only · Actions disabled</div>}
        >
            <div className="space-y-4">
                <div className="flex flex-col gap-2 border-b border-slate-100 pb-4 dark:border-slate-700 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[10px] font-extrabold uppercase tracking-[0.08em] text-[var(--municipal-brand)]">{request.reference}</span>
                            <PriorityBadge priority={request.priority} />
                            <StatusBadge status={request.status} />
                        </div>
                        <p className="mt-1 text-[10px] font-semibold text-[var(--municipal-muted)]">Presentation request reference · no citizen identifying data</p>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-1.5" role="tablist" aria-label="Request detail steps">
                    {(['Request', 'Routing', 'History'] as ModalStep[]).map((item, index) => (
                        <button
                            key={item}
                            type="button"
                            role="tab"
                            aria-selected={step === item}
                            onClick={() => setStep(item)}
                            className={'min-h-9 rounded-lg border px-2 text-[10px] font-bold transition ' + (step === item
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/25 dark:text-emerald-100'
                                : 'border-transparent text-[var(--municipal-muted)] hover:bg-[var(--municipal-hover)]')}
                        >
                            <span className="mr-1 text-[9px] opacity-60">{index + 1}</span>{item}
                        </button>
                    ))}
                </div>

                {step === 'Request' && (
                    <dl className="grid gap-2 sm:grid-cols-2">
                        {[
                            ['Reference', request.reference],
                            ['Concern', request.concern],
                            ['Category', request.category],
                            ['Priority', request.priority],
                            ['Current status', request.status],
                        ].map(([label, value]) => (
                            <div key={label} className="rounded-lg border border-[var(--municipal-border)] bg-[var(--municipal-surface-subtle)] px-3 py-2.5">
                                <dt className="text-[9px] font-bold uppercase tracking-wide text-[var(--municipal-muted)]">{label}</dt>
                                <dd className="mt-1 text-[11px] font-semibold text-[var(--municipal-text)]">{value}</dd>
                            </div>
                        ))}
                    </dl>
                )}

                {step === 'Routing' && (
                    <div className="space-y-2">
                        <div className="grid gap-2 sm:grid-cols-2">
                            <div className="rounded-lg border border-[var(--municipal-border)] bg-[var(--municipal-surface-subtle)] px-3 py-2.5">
                                <div className="text-[9px] font-bold uppercase tracking-wide text-[var(--municipal-muted)]">Assigned office / reference</div>
                                <div className="mt-1 text-[11px] font-semibold text-[var(--municipal-text)]">{request.assignedReference}</div>
                            </div>
                            <div className="rounded-lg border border-[var(--municipal-border)] bg-[var(--municipal-surface-subtle)] px-3 py-2.5">
                                <div className="text-[9px] font-bold uppercase tracking-wide text-[var(--municipal-muted)]">Current routing stage</div>
                                <div className="mt-1 text-[11px] font-semibold text-[var(--municipal-text)]">{request.routingStage}</div>
                            </div>
                        </div>
                        <div className="rounded-lg border border-[var(--municipal-border)] px-3 py-3">
                            <div className="text-[9px] font-bold uppercase tracking-wide text-[var(--municipal-muted)]">Next response context</div>
                            <p className="mt-1 text-[11px] leading-5 text-[var(--municipal-text)]">{request.nextResponseContext}</p>
                        </div>
                    </div>
                )}

                {step === 'History' && (
                    <ol className="space-y-2">
                        {request.history.map((event, index) => (
                            <li key={event.label} className="grid grid-cols-[24px_minmax(0,1fr)] gap-2">
                                <div className="flex flex-col items-center">
                                    <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300"><CircleDot size={10} aria-hidden="true" /></span>
                                    {index < request.history.length - 1 && <span className="mt-1 h-full w-px bg-[var(--municipal-border)]" />}
                                </div>
                                <div className="pb-3">
                                    <div className="text-[11px] font-bold text-[var(--municipal-text)]">{event.label}</div>
                                    <p className="mt-0.5 text-[10px] leading-4 text-[var(--municipal-muted)]">{event.detail}</p>
                                </div>
                            </li>
                        ))}
                    </ol>
                )}
            </div>
        </DetailDrawer>
    );
}

function filterMatches(request: CitizenRequest, filter: OverviewFilter): boolean {
    if (filter.kind === 'all') return true;
    if (filter.kind === 'high') return request.priority === 'High';
    if (filter.kind === 'status') return request.status === filter.value;
    return request.category === filter.value;
}

function filterLabel(filter: OverviewFilter): string {
    if (filter.kind === 'all') return 'All requests';
    if (filter.kind === 'high') return 'High priority';
    return filter.value;
}

function filterIsActive(active: OverviewFilter, candidate: OverviewFilter): boolean {
    return active.kind === candidate.kind
        && ('value' in active ? active.value : undefined) === ('value' in candidate ? candidate.value : undefined);
}

function QueueNav({ active, onChange }: { active: OverviewFilter; onChange: (filter: OverviewFilter) => void }) {
    const queueItems: Array<{ label: string; filter: OverviewFilter; count: number }> = [
        { label: 'All requests', filter: { kind: 'all' }, count: citizenRequests.length },
        { label: 'High priority', filter: { kind: 'high' }, count: citizenRequests.filter((request) => request.priority === 'High').length },
        ...overviewStatuses.map((status) => ({ label: status, filter: { kind: 'status', value: status } as OverviewFilter, count: citizenRequests.filter((request) => request.status === status).length })),
    ];

    const rowClass = (selected: boolean) => 'flex min-h-8 w-full items-center justify-between rounded-lg px-2.5 text-left text-[10px] font-semibold transition '
        + (selected ? 'bg-emerald-50 text-emerald-900 dark:bg-emerald-950/25 dark:text-emerald-100' : 'text-[var(--municipal-muted)] hover:bg-[var(--municipal-hover)]');

    return (
        <aside className="rounded-xl border border-[var(--municipal-border)] bg-[var(--municipal-surface)] p-2.5" aria-label="Service desk queue navigation">
            <div className="text-[9px] font-extrabold uppercase tracking-[0.08em] text-[var(--municipal-muted)]">Queue</div>
            <div className="mt-1.5 space-y-0.5">
                {queueItems.map((item) => (
                    <button key={item.label} type="button" onClick={() => onChange(item.filter)} className={rowClass(filterIsActive(active, item.filter))}>
                        <span>{item.label}</span><span className="rounded-full bg-[var(--municipal-surface-subtle)] px-1.5 py-0.5 text-[9px] tabular-nums">{item.count}</span>
                    </button>
                ))}
            </div>
            <div className="mt-3 border-t border-[var(--municipal-border)] pt-2.5">
                <div className="text-[9px] font-extrabold uppercase tracking-[0.08em] text-[var(--municipal-muted)]">Category</div>
                <div className="mt-1.5 space-y-0.5">
                    {requestCategories.map((category) => {
                        const filter: OverviewFilter = { kind: 'category', value: category };
                        return (
                            <button key={category} type="button" onClick={() => onChange(filter)} className={rowClass(filterIsActive(active, filter))}>
                                <span className="truncate">{category}</span><span className="rounded-full bg-[var(--municipal-surface-subtle)] px-1.5 py-0.5 text-[9px] tabular-nums">{citizenRequests.filter((request) => request.category === category).length}</span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </aside>
    );
}

function PriorityInbox({ requests, label, onSelect }: { requests: CitizenRequest[]; label: string; onSelect: (request: CitizenRequest) => void }) {
    const ordered = [...requests].sort((a, b) => Number(b.priority === 'High') - Number(a.priority === 'High'));

    return (
        <section className="overflow-hidden rounded-xl border border-[var(--municipal-border)] bg-[var(--municipal-surface)]" aria-label="Priority inbox">
            <header className="flex items-center justify-between gap-3 border-b border-[var(--municipal-border)] px-3 py-2.5">
                <div>
                    <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.08em] text-[var(--municipal-muted)]"><Inbox size={14} className="text-[var(--municipal-brand)]" aria-hidden="true" /> Priority Inbox</div>
                    <div className="mt-0.5 text-[9px] text-[var(--municipal-muted)]">{label} · {ordered.length} visible</div>
                </div>
            </header>
            <div className="divide-y divide-[var(--municipal-border)]">
                {ordered.map((request) => (
                    <button
                        key={request.reference}
                        type="button"
                        onClick={() => onSelect(request)}
                        className={'grid w-full border-l-2 gap-2 px-3 py-3 text-left transition hover:bg-[var(--municipal-hover)] sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center '
                            + (request.priority === 'High' ? 'border-l-amber-400 bg-amber-50/30 dark:bg-amber-950/10' : 'border-l-slate-200 dark:border-l-slate-700')}
                    >
                        <div className="min-w-0">
                            <div className="text-[9px] font-extrabold uppercase tracking-[0.06em] text-[var(--municipal-brand)]">{request.reference}</div>
                            <div className="mt-0.5 text-[12px] font-bold text-[var(--municipal-text)]">{request.concern}</div>
                            <div className="mt-1 text-[9px] text-[var(--municipal-muted)]">{request.category} · {request.assignedReference}</div>
                        </div>
                        <div className="flex items-center gap-1.5 sm:justify-end">
                            <PriorityBadge priority={request.priority} />
                            <StatusBadge status={request.status} />
                            <ChevronRight size={13} className="ml-0.5 shrink-0 text-[var(--municipal-muted)]" aria-hidden="true" />
                        </div>
                    </button>
                ))}
                {ordered.length === 0 && <div className="px-4 py-8 text-center text-[10px] text-[var(--municipal-muted)]">No request references match this queue view.</div>}
            </div>
        </section>
    );
}

function DeskSnapshot() {
    const assigned = Object.entries(citizenRequests.reduce<Record<string, number>>((summary, request) => {
        summary[request.assignedReference] = (summary[request.assignedReference] ?? 0) + 1;
        return summary;
    }, {}));
    const mix = [
        ['High priority', citizenRequests.filter((request) => request.priority === 'High').length],
        ['Normal', citizenRequests.filter((request) => request.priority === 'Normal').length],
    ] as const;

    return (
        <aside className="rounded-xl border border-[var(--municipal-border)] bg-[var(--municipal-surface)] p-3" aria-label="Desk snapshot">
            <div className="text-[10px] font-extrabold uppercase tracking-[0.08em] text-[var(--municipal-muted)]">Desk Snapshot</div>
            <div className="mt-2 text-[9px] font-bold uppercase tracking-[0.06em] text-slate-400">Assigned references</div>
            <div className="mt-1 divide-y divide-[var(--municipal-border)]">
                {assigned.map(([label, count]) => (
                    <div key={label} className="flex items-center justify-between gap-2 py-2 text-[10px]">
                        <span className="min-w-0 truncate font-semibold text-[var(--municipal-text)]">{label}</span>
                        <span className="rounded-full bg-[var(--municipal-surface-subtle)] px-2 py-0.5 font-extrabold tabular-nums text-[var(--municipal-muted)]">{count}</span>
                    </div>
                ))}
            </div>
            <div className="mt-3 border-t border-[var(--municipal-border)] pt-2.5">
                <div className="text-[9px] font-bold uppercase tracking-[0.06em] text-slate-400">Current mix</div>
                <div className="mt-1 space-y-1">
                    {mix.map(([label, count]) => (
                        <div key={label} className="flex items-center justify-between gap-2 rounded-lg bg-[var(--municipal-surface-subtle)] px-2.5 py-2 text-[10px]">
                            <span className="font-semibold text-[var(--municipal-text)]">{label}</span>
                            <span className="font-extrabold tabular-nums text-[var(--municipal-muted)]">{count}</span>
                        </div>
                    ))}
                </div>
            </div>
        </aside>
    );
}

function Overview({ onSelect }: { onSelect: (request: CitizenRequest) => void }) {
    const [filter, setFilter] = useState<OverviewFilter>({ kind: 'all' });
    const visible = citizenRequests.filter((request) => filterMatches(request, filter));

    return (
        <div className="space-y-2.5">
            <div className="grid gap-2.5 lg:grid-cols-[210px_minmax(0,1fr)_240px]">
                <QueueNav active={filter} onChange={setFilter} />
                <PriorityInbox requests={visible} label={filterLabel(filter)} onSelect={onSelect} />
                <DeskSnapshot />
            </div>
            <ResponseActivity compact onSelect={onSelect} />
        </div>
    );
}

function RequestQueue({ onSelect }: { onSelect: (request: CitizenRequest) => void }) {
    const [query, setQuery] = useState('');
    const [category, setCategory] = useState('All categories');
    const [priority, setPriority] = useState('All priorities');
    const [status, setStatus] = useState('All statuses');
    const categories = useMemo(() => ['All categories', ...requestCategories], []);
    const visible = citizenRequests.filter((request) => {
        const search = query.trim().toLowerCase();
        const matchesSearch = !search || [request.reference, request.concern, request.category, request.assignedReference, request.status].some((value) => value.toLowerCase().includes(search));
        return matchesSearch
            && (category === 'All categories' || request.category === category)
            && (priority === 'All priorities' || request.priority === priority)
            && (status === 'All statuses' || request.status === status);
    });

    return (
        <section className="overflow-hidden rounded-xl border border-[var(--municipal-border)] bg-[var(--municipal-surface)]">
            <div className="border-b border-[var(--municipal-border)] p-3">
                <div className="grid gap-2 lg:grid-cols-[minmax(220px,1fr)_repeat(3,minmax(140px,0.45fr))]">
                    <label className="relative"><span className="sr-only">Search requests</span><Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--municipal-muted)]" aria-hidden="true" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search reference or concern" className="min-h-9 w-full rounded-lg border border-[var(--municipal-border)] bg-[var(--municipal-surface)] pl-8 pr-2 text-[10px] text-[var(--municipal-text)] outline-none focus:border-[var(--municipal-brand)] focus:ring-2 focus:ring-[var(--municipal-focus)]/20" /></label>
                    <select aria-label="Category filter" value={category} onChange={(event) => setCategory(event.target.value)} className="min-h-9 rounded-lg border border-[var(--municipal-border)] bg-[var(--municipal-surface)] px-2 text-[10px] font-semibold text-[var(--municipal-text)]">{categories.map((item) => <option key={item}>{item}</option>)}</select>
                    <select aria-label="Priority filter" value={priority} onChange={(event) => setPriority(event.target.value)} className="min-h-9 rounded-lg border border-[var(--municipal-border)] bg-[var(--municipal-surface)] px-2 text-[10px] font-semibold text-[var(--municipal-text)]"><option>All priorities</option><option>High</option><option>Normal</option></select>
                    <select aria-label="Status filter" value={status} onChange={(event) => setStatus(event.target.value)} className="min-h-9 rounded-lg border border-[var(--municipal-border)] bg-[var(--municipal-surface)] px-2 text-[10px] font-semibold text-[var(--municipal-text)]"><option>All statuses</option>{citizenRequestStatuses.map((item) => <option key={item}>{item}</option>)}</select>
                </div>
            </div>

            <div className="hidden md:block">
                <table className="w-full table-fixed text-left">
                    <thead className="bg-[var(--municipal-surface-subtle)] text-[9px] font-bold uppercase tracking-[0.06em] text-[var(--municipal-muted)]"><tr><th className="w-[15%] px-3 py-2.5">Reference</th><th className="w-[26%] px-3 py-2.5">Concern</th><th className="w-[13%] px-3 py-2.5">Category</th><th className="w-[10%] px-3 py-2.5">Priority</th><th className="w-[14%] px-3 py-2.5">Status</th><th className="w-[22%] px-3 py-2.5">Assigned reference</th></tr></thead>
                    <tbody className="divide-y divide-[var(--municipal-border)]">
                        {visible.map((request) => (
                            <tr key={request.reference} onClick={() => onSelect(request)} className={'cursor-pointer transition hover:bg-[var(--municipal-hover)] ' + (request.priority === 'High' ? 'bg-amber-50/25 dark:bg-amber-950/10' : '')}>
                                <td className={'border-l-2 px-3 py-3 text-[10px] font-extrabold text-[var(--municipal-brand)] ' + (request.priority === 'High' ? 'border-l-amber-400' : 'border-l-slate-200 dark:border-l-slate-700')}>{request.reference}</td><td className="px-3 py-3 text-[11px] font-bold text-[var(--municipal-text)]">{request.concern}</td><td className="px-3 py-3 text-[10px] text-[var(--municipal-muted)]">{request.category}</td><td className="px-3 py-3"><PriorityBadge priority={request.priority} /></td><td className="px-3 py-3"><StatusBadge status={request.status} /></td><td className="px-3 py-3 text-[10px] font-semibold text-[var(--municipal-text)]">{request.assignedReference}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="divide-y divide-[var(--municipal-border)] md:hidden">
                {visible.map((request) => (
                    <button key={request.reference} type="button" onClick={() => onSelect(request)} className={'w-full border-l-2 p-3 text-left hover:bg-[var(--municipal-hover)] ' + (request.priority === 'High' ? 'border-l-amber-400 bg-amber-50/25 dark:bg-amber-950/10' : 'border-l-slate-200 dark:border-l-slate-700')}><div className="flex items-start justify-between gap-2"><div><div className="text-[10px] font-extrabold text-[var(--municipal-brand)]">{request.reference}</div><div className="mt-1 text-[11px] font-bold text-[var(--municipal-text)]">{request.concern}</div></div><ChevronRight size={14} className="mt-1 shrink-0 text-[var(--municipal-muted)]" /></div><div className="mt-2 flex flex-wrap gap-1.5"><PriorityBadge priority={request.priority} /><StatusBadge status={request.status} /></div><div className="mt-2 text-[9px] text-[var(--municipal-muted)]">{request.category} · {request.assignedReference}</div></button>
                ))}
            </div>
            {visible.length === 0 && <div className="p-8 text-center text-[11px] text-[var(--municipal-muted)]">No request references match the current filters.</div>}
        </section>
    );
}

function RoutingBoard({ onSelect }: { onSelect: (request: CitizenRequest) => void }) {
    return (
        <section aria-label="Citizen request routing board">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {citizenRequestStatuses.map((status) => {
                    const requests = citizenRequests.filter((request) => request.status === status);
                    return (
                        <div key={status} className="min-w-0 rounded-xl border border-[var(--municipal-border)] bg-[var(--municipal-surface)] p-2.5">
                            <div className="flex items-center justify-between gap-2 border-b border-[var(--municipal-border)] pb-2"><StatusBadge status={status} /><span className="rounded-full bg-[var(--municipal-surface-subtle)] px-2 py-0.5 text-[9px] font-extrabold tabular-nums text-[var(--municipal-muted)]">{requests.length}</span></div>
                            <div className="mt-2 space-y-2">
                                {requests.map((request) => (
                                    <button key={request.reference} type="button" onClick={() => onSelect(request)} className={'w-full rounded-lg border border-[var(--municipal-border)] border-l-2 bg-[var(--municipal-surface-subtle)] p-2.5 text-left transition hover:border-emerald-200 dark:hover:border-emerald-900/70 ' + (request.priority === 'High' ? 'border-l-amber-400' : 'border-l-slate-300 dark:border-l-slate-600')}>
                                        <div className="flex items-start justify-between gap-2"><span className="text-[9px] font-extrabold text-[var(--municipal-brand)]">{request.reference}</span><PriorityBadge priority={request.priority} /></div>
                                        <div className="mt-1.5 text-[10px] font-bold leading-4 text-[var(--municipal-text)]">{request.concern}</div>
                                        <div className="mt-2 flex items-start gap-1.5 text-[9px] leading-4 text-[var(--municipal-muted)]"><Building2 size={11} className="mt-0.5 shrink-0" aria-hidden="true" /><span>{request.assignedReference}</span></div>
                                    </button>
                                ))}
                                {requests.length === 0 && <div className="px-2 py-3 text-center text-[9px] text-[var(--municipal-muted)]">No presentation requests</div>}
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}

function ResponseActivity({ compact = false, onSelect }: { compact?: boolean; onSelect: (request: CitizenRequest) => void }) {
    if (compact) {
        return (
            <section className="rounded-xl border border-[var(--municipal-border)] bg-[var(--municipal-surface)] p-3" aria-label="Recent response activity">
                <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.08em] text-[var(--municipal-muted)]"><History size={14} className="text-[var(--municipal-brand)]" aria-hidden="true" /> Recent Response Activity</div>
                <div className="mt-2 grid divide-y divide-[var(--municipal-border)] lg:grid-cols-3 lg:divide-x lg:divide-y-0">
                    {citizenResponseActivity.slice(0, 3).map((activity) => {
                        const request = citizenRequests.find((item) => item.reference === activity.reference);
                        if (!request) return null;
                        return (
                            <button key={activity.reference + activity.label} type="button" onClick={() => onSelect(request)} className="flex min-w-0 items-start gap-2 px-2 py-2.5 text-left transition first:pl-0 last:pr-0 hover:bg-[var(--municipal-hover)]">
                                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-[var(--municipal-brand)] dark:bg-emerald-950/20"><MessageSquareText size={11} aria-hidden="true" /></span>
                                <span className="min-w-0"><span className="block text-[9px] font-extrabold text-[var(--municipal-brand)]">{activity.reference}</span><span className="mt-0.5 block text-[10px] font-bold text-[var(--municipal-text)]">{activity.label}</span><span className="mt-0.5 block text-[9px] leading-4 text-[var(--municipal-muted)]">{activity.detail}</span></span>
                            </button>
                        );
                    })}
                </div>
            </section>
        );
    }

    return (
        <section className="rounded-xl border border-[var(--municipal-border)] bg-[var(--municipal-surface)] p-3" aria-label="Response history">
            <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.08em] text-[var(--municipal-muted)]"><History size={14} className="text-[var(--municipal-brand)]" aria-hidden="true" /> Response History</div>
            <div className="relative mt-3 ml-2 border-l border-[var(--municipal-border)] pl-5">
                {citizenResponseActivity.map((activity) => {
                    const request = citizenRequests.find((item) => item.reference === activity.reference);
                    if (!request) return null;
                    return (
                        <button key={activity.reference + activity.label} type="button" onClick={() => onSelect(request)} className="relative block w-full pb-4 text-left last:pb-0">
                            <span className="absolute -left-[25px] top-1 h-2 w-2 rounded-full border-2 border-[var(--municipal-surface)] bg-[var(--municipal-brand)] ring-1 ring-emerald-200 dark:ring-emerald-900" />
                            <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5"><span className="text-[9px] font-extrabold text-[var(--municipal-brand)]">{activity.reference}</span><span className="text-[11px] font-bold text-[var(--municipal-text)]">{activity.label}</span></span>
                            <span className="mt-0.5 block max-w-3xl text-[10px] leading-4 text-[var(--municipal-muted)]">{activity.detail}</span>
                        </button>
                    );
                })}
            </div>
            <div className="mt-3 rounded-lg border border-dashed border-[var(--municipal-border)] bg-[var(--municipal-surface-subtle)] px-3 py-2 text-[9px] text-[var(--municipal-muted)]">Communication history is presentation-only and contains no resident contact details or staff identities.</div>
        </section>
    );
}

export default function CitizenActionWorkspace({ onBack }: Props) {
    const [activeTab, setActiveTab] = useState<WorkspaceTab>('Overview');
    const [selectedRequest, setSelectedRequest] = useState<CitizenRequest | null>(null);
    const headerSummary = [
        {
            label: 'Open Requests',
            value: citizenRequests.filter((request) => request.status !== 'Resolved').length,
            tone: 'border-emerald-200 bg-emerald-50/70 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/20 dark:text-emerald-100',
        },
        {
            label: 'High Priority',
            value: citizenRequests.filter((request) => request.priority === 'High').length,
            tone: 'border-amber-200 bg-amber-50/70 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-100',
        },
        {
            label: 'In Progress',
            value: citizenRequests.filter((request) => request.status === 'In progress').length,
            tone: 'border-amber-200 bg-amber-50/45 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/15 dark:text-amber-200',
        },
        {
            label: 'Awaiting',
            value: citizenRequests.filter((request) => request.status === 'Awaiting response').length,
            tone: 'border-violet-200 bg-violet-50/65 text-violet-900 dark:border-violet-900/60 dark:bg-violet-950/20 dark:text-violet-100',
        },
    ];

    return (
        <section className="space-y-2.5" aria-label="Citizen Request / Action Center workspace">
            <header className="rounded-xl border border-[var(--municipal-border)] bg-[var(--municipal-surface)] px-4 py-3">
                <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(420px,520px)] lg:items-center">
                    <div className="min-w-0">
                        {onBack && <button type="button" onClick={onBack} className="mb-1 inline-flex min-h-7 items-center gap-1.5 text-[9px] font-bold text-[var(--municipal-muted)] transition hover:text-[var(--municipal-brand)] focus:outline-none focus:ring-2 focus:ring-[var(--municipal-focus)]/30"><ArrowLeft size={12} aria-hidden="true" /> Future Integrations</button>}
                        <div className="text-[9px] font-extrabold uppercase tracking-[0.1em] text-[var(--municipal-brand)]">Public Service Desk</div>
                        <h1 className="mt-0.5 text-[21px] font-extrabold tracking-tight text-[var(--municipal-text)]">Citizen Request / Action Center</h1>
                        <p className="mt-0.5 text-[10px] font-semibold text-[var(--municipal-muted)]">Citizen concern intake, routing and response coordination</p>
                    </div>
                    <div className="min-w-0">
                        <div className="text-left lg:text-right">
                            <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[8px] font-extrabold uppercase tracking-[0.08em] text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-200">Presentation Environment</span>
                            <div className="mt-1 text-[9px] font-semibold text-[var(--municipal-muted)]">Reference data only · Actions disabled</div>
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-1.5 xl:grid-cols-4" aria-label="Citizen desk operational summary">
                            {headerSummary.map((counter) => (
                                <div key={counter.label} className={'flex min-h-10 items-center justify-between gap-2 rounded-lg border px-2.5 py-1.5 xl:block ' + counter.tone}>
                                    <div className="text-[8px] font-extrabold uppercase tracking-[0.06em] opacity-75">{counter.label}</div>
                                    <div className="text-[15px] font-extrabold leading-none tabular-nums xl:mt-1">{counter.value}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </header>

            <nav className="flex gap-1 overflow-x-auto rounded-xl border border-[var(--municipal-border)] bg-[var(--municipal-surface)] p-1" role="tablist" aria-label="Citizen action views">
                {tabs.map((tab) => (
                    <button key={tab} type="button" role="tab" aria-selected={activeTab === tab} onClick={() => setActiveTab(tab)} className={'min-h-9 shrink-0 rounded-lg px-3 text-[10px] font-bold transition ' + (activeTab === tab ? 'bg-emerald-50 text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100' : 'text-[var(--municipal-muted)] hover:bg-[var(--municipal-hover)]')}>{tab}</button>
                ))}
            </nav>

            {activeTab === 'Overview' && <Overview onSelect={setSelectedRequest} />}
            {activeTab === 'Request Queue' && <RequestQueue onSelect={setSelectedRequest} />}
            {activeTab === 'Routing Board' && <RoutingBoard onSelect={setSelectedRequest} />}
            {activeTab === 'Response History' && <ResponseActivity onSelect={setSelectedRequest} />}

            <div className="flex items-center gap-2 rounded-lg border border-[var(--municipal-border)] bg-[var(--municipal-surface-subtle)] px-3 py-2 text-[9px] font-semibold text-[var(--municipal-muted)]"><CheckCircle2 size={12} className="shrink-0 text-[var(--municipal-brand)]" aria-hidden="true" /> Privacy-safe presentation references only. No citizen PII, staff identities or operational actions are exposed.</div>

            {selectedRequest && <RequestModal request={selectedRequest} onClose={() => setSelectedRequest(null)} />}
        </section>
    );
}
