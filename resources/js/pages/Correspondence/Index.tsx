import { Link, router, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowRight,
    Building2,
    ChevronLeft,
    Clock3,
    Inbox,
    Mail,
    Search,
    UserRound,
    X,
} from 'lucide-react';
import { type FormEvent, useEffect, useState } from 'react';
import CorrespondenceOverview, {
    type CorrespondenceOverviewData,
    type CorrespondencePreview,
} from '../../components/correspondence/CorrespondenceOverview';
import PageFrame from '../../components/PageFrame';
import PageHeader from '../../components/PageHeader';
import AppLayout from '../../layouts/AppLayout';
import { withReturnContext } from '../../navigation/returnContext';

type Office = { id: number; code: string; name: string; short_name?: string | null };
type CorrespondenceRow = CorrespondencePreview;
type Paginator<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from?: number | null;
    to?: number | null;
    prev_page_url?: string | null;
    next_page_url?: string | null;
};
type Filters = {
    view?: string;
    search?: string;
    lifecycle?: string;
    classification?: string;
    office_id?: number | string;
    assigned_to_me?: boolean | number | string;
    action_required?: boolean | number | string;
    aging?: string;
};
type Props = {
    records: Paginator<CorrespondenceRow>;
    overview: CorrespondenceOverviewData;
    filters: Filters;
    filterOptions: { lifecycles: string[]; classifications: string[]; offices: Office[] };
    workspace: { departmentName: string; departmentCode: string };
};

const queueOptions = [
    { key: 'all', label: 'All Correspondence' },
    { key: 'received', label: 'New Intake' },
    { key: 'needs_action', label: 'Needs Action' },
    { key: 'assigned_to_me', label: 'Assigned to Me' },
    { key: 'routed', label: 'Routed' },
    { key: 'archived', label: 'Completed / Filed' },
    { key: 'overdue', label: 'Overdue' },
];

const humanize = (value: string) => value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
const enabled = (value: Filters['assigned_to_me']) => value === true || value === 1 || value === '1';
export default function CorrespondenceIndex({ records, overview, filters, filterOptions, workspace }: Props) {
    const { url } = usePage();
    const currentView = filters.view || 'overview';
    const [search, setSearch] = useState(filters.search ?? '');
    const [lifecycle, setLifecycle] = useState(filters.lifecycle ?? '');
    const [classification, setClassification] = useState(filters.classification ?? '');
    const [officeId, setOfficeId] = useState(filters.office_id ? String(filters.office_id) : '');
    const [assignedToMe, setAssignedToMe] = useState(enabled(filters.assigned_to_me));
    const [actionRequired, setActionRequired] = useState(enabled(filters.action_required));
    const [aging, setAging] = useState(filters.aging ?? '');
    const [moreFilters, setMoreFilters] = useState(Boolean(filters.classification || filters.aging || filters.assigned_to_me || filters.action_required));

    useEffect(() => {
        setSearch(filters.search ?? '');
        setLifecycle(filters.lifecycle ?? '');
        setClassification(filters.classification ?? '');
        setOfficeId(filters.office_id ? String(filters.office_id) : '');
        setAssignedToMe(enabled(filters.assigned_to_me));
        setActionRequired(enabled(filters.action_required));
        setAging(filters.aging ?? '');
    }, [filters]);

    const requestData = (view = currentView) => ({
        view,
        search: search || undefined,
        lifecycle: lifecycle || undefined,
        classification: classification || undefined,
        office_id: officeId || undefined,
        assigned_to_me: assignedToMe ? 1 : undefined,
        action_required: actionRequired ? 1 : undefined,
        aging: aging || undefined,
    });

    const selectView = (view: string) => {
        if (view === 'overview') {
            router.get('/correspondence', { view: 'overview' }, { preserveState: true, preserveScroll: true, replace: true });
            return;
        }

        router.get('/correspondence', { view }, { preserveState: true, preserveScroll: true, replace: true });
    };

    const apply = (event: FormEvent) => {
        event.preventDefault();
        router.get('/correspondence', requestData(), { preserveState: true, preserveScroll: true, replace: true });
    };

    const clear = () => {
        setSearch('');
        setLifecycle('');
        setClassification('');
        setOfficeId('');
        setAssignedToMe(false);
        setActionRequired(false);
        setAging('');
        setMoreFilters(false);
        router.get('/correspondence', { view: currentView }, { preserveState: true, preserveScroll: true, replace: true });
    };

    const currentLabel = queueOptions.find((option) => option.key === currentView)?.label || 'Correspondence';
    const activeFilterCount = [search, lifecycle, classification, officeId, assignedToMe, actionRequired, aging].filter(Boolean).length;

    return (
        <AppLayout title="Correspondence">
            <PageFrame width="standard" density="compact">
                <PageHeader
                    eyebrow="Daily correspondence"
                    title="Correspondence"
                    description={currentView === 'overview'
                        ? `Receive, register, route, assign and track official municipal communications · ${workspace.departmentName}`
                        : `${workspace.departmentName} · ${currentLabel} · ${records.total} record${records.total === 1 ? '' : 's'}`}
                    icon={Mail}
                />

                {currentView === 'overview' ? (
                    <CorrespondenceOverview overview={overview} onSelect={selectView} />
                ) : (
                    <>
                        <nav className="municipal-panel flex min-w-0 flex-wrap items-center gap-2 px-2.5 py-1.5" aria-label="Correspondence workspace navigation">
                            <button
                                type="button"
                                onClick={() => selectView('overview')}
                                className="inline-flex min-h-9 items-center gap-1 rounded-md px-2 text-[11px] font-bold text-[var(--municipal-brand)] hover:bg-[var(--municipal-hover)]"
                            >
                                <ChevronLeft size={13} aria-hidden="true" /> Overview
                            </button>
                            <span className="text-[10px] text-[var(--municipal-border-strong)]" aria-hidden="true">/</span>
                            <span className="text-[10px] font-bold uppercase tracking-wide text-[var(--municipal-muted)]">Correspondence</span>
                            <span className="text-[10px] text-[var(--municipal-border-strong)]" aria-hidden="true">/</span>
                            <label className="min-w-[190px] flex-1 sm:max-w-[320px]">
                                <span className="sr-only">Switch correspondence view</span>
                                <select
                                    value={currentView}
                                    onChange={(event) => selectView(event.target.value)}
                                    className="min-h-9 w-full rounded-md border border-[var(--municipal-border)] bg-[var(--municipal-surface)] px-2.5 text-[11px] font-semibold text-[var(--municipal-text)] outline-none focus:border-[var(--municipal-focus)] focus:ring-2 focus:ring-[var(--municipal-focus)]/20"
                                >
                                    {queueOptions.map((option) => <option key={option.key} value={option.key}>{option.label}</option>)}
                                </select>
                            </label>
                            <span className="ml-auto text-[10px] text-[var(--municipal-muted)]"><strong className="text-[var(--municipal-text)]">{records.total}</strong> record{records.total === 1 ? '' : 's'}</span>
                        </nav>

                        <form onSubmit={apply} className="municipal-panel p-2.5">
                            <div className="grid gap-2 lg:grid-cols-[minmax(260px,2fr)_minmax(150px,.7fr)_minmax(170px,.9fr)_auto] lg:items-end">
                                <label className="block min-w-0">
                                    <span className="mb-1 block text-[9px] font-bold uppercase tracking-wide text-[var(--municipal-muted)]">Search correspondence</span>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--municipal-muted)]" size={14} aria-hidden="true" />
                                        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Reference, sender, subject..." className="min-h-10 w-full rounded-md border border-[var(--municipal-border)] bg-[var(--municipal-surface)] pl-9 pr-3 text-xs text-[var(--municipal-text)] outline-none focus:border-[var(--municipal-focus)] focus:ring-2 focus:ring-[var(--municipal-focus)]/20" />
                                    </div>
                                </label>
                                <label className="block min-w-0">
                                    <span className="mb-1 block text-[9px] font-bold uppercase tracking-wide text-[var(--municipal-muted)]">Lifecycle</span>
                                    <select value={lifecycle} onChange={(event) => setLifecycle(event.target.value)} className="min-h-10 w-full rounded-md border border-[var(--municipal-border)] bg-[var(--municipal-surface)] px-2 text-xs">
                                        <option value="">All states</option>
                                        {filterOptions.lifecycles.map((state) => <option key={state} value={state}>{humanize(state)}</option>)}
                                    </select>
                                </label>
                                <label className="block min-w-0">
                                    <span className="mb-1 block text-[9px] font-bold uppercase tracking-wide text-[var(--municipal-muted)]">Current office</span>
                                    <select value={officeId} onChange={(event) => setOfficeId(event.target.value)} className="min-h-10 w-full rounded-md border border-[var(--municipal-border)] bg-[var(--municipal-surface)] px-2 text-xs">
                                        <option value="">All visible offices</option>
                                        {filterOptions.offices.map((office) => <option key={office.id} value={office.id}>{office.short_name || office.name}</option>)}
                                    </select>
                                </label>
                                <div className="flex items-end gap-1.5">
                                    <button className="min-h-10 rounded-md bg-[var(--municipal-brand-deep)] px-3 text-xs font-bold text-white">Apply{activeFilterCount ? ` · ${activeFilterCount}` : ''}</button>
                                    <button type="button" onClick={() => setMoreFilters((value) => !value)} className={`min-h-10 rounded-md border px-2.5 text-[10px] font-semibold ${moreFilters ? 'border-[var(--municipal-selected-border)] bg-[var(--municipal-selected-bg)] text-[var(--municipal-brand)]' : 'border-[var(--municipal-border)] text-[var(--municipal-text)]'}`}>Filters</button>
                                    <button type="button" onClick={clear} aria-label="Clear correspondence filters" className="flex min-h-10 min-w-10 items-center justify-center rounded-md border border-[var(--municipal-border)] text-[var(--municipal-muted)] hover:bg-[var(--municipal-hover)]"><X size={14} /></button>
                                </div>
                            </div>

                            {moreFilters ? (
                                <div className="mt-2 grid gap-2 border-t border-[var(--municipal-border)] pt-2 sm:grid-cols-2 lg:grid-cols-[minmax(160px,1fr)_minmax(150px,.7fr)_auto_auto] lg:items-end">
                                    <label className="block min-w-0">
                                        <span className="mb-1 block text-[9px] font-bold uppercase tracking-wide text-[var(--municipal-muted)]">Classification</span>
                                        <select value={classification} onChange={(event) => setClassification(event.target.value)} className="min-h-10 w-full rounded-md border border-[var(--municipal-border)] bg-[var(--municipal-surface)] px-2 text-xs">
                                            <option value="">All authorized classes</option>
                                            {filterOptions.classifications.map((value) => <option key={value} value={value}>{humanize(value)}</option>)}
                                        </select>
                                    </label>
                                    <label className="block min-w-0">
                                        <span className="mb-1 block text-[9px] font-bold uppercase tracking-wide text-[var(--municipal-muted)]">Aging</span>
                                        <select value={aging} onChange={(event) => setAging(event.target.value)} className="min-h-10 w-full rounded-md border border-[var(--municipal-border)] bg-[var(--municipal-surface)] px-2 text-xs">
                                            <option value="">All</option><option value="overdue">Overdue workflow only</option>
                                        </select>
                                    </label>
                                    <label className={`flex min-h-10 items-center gap-2 rounded-md border px-3 text-[10px] font-semibold ${assignedToMe ? 'border-[#cfe0f6] bg-[#eef5ff] text-[#265fa8]' : 'border-[var(--municipal-border)]'}`}>
                                        <input type="checkbox" checked={assignedToMe} onChange={(event) => setAssignedToMe(event.target.checked)} /> Assigned to me
                                    </label>
                                    <label className={`flex min-h-10 items-center gap-2 rounded-md border px-3 text-[10px] font-semibold ${actionRequired ? 'border-[#f0dfb4] bg-[#fff8e8] text-[#9a6a08]' : 'border-[var(--municipal-border)]'}`}>
                                        <input type="checkbox" checked={actionRequired} onChange={(event) => setActionRequired(event.target.checked)} /> Action required
                                    </label>
                                </div>
                            ) : null}
                        </form>

                        <section className="municipal-panel overflow-hidden" aria-label="Correspondence register">
                            <header className="flex min-h-10 items-center justify-between gap-3 border-b border-[var(--municipal-border)] bg-[var(--municipal-surface-subtle)] px-3 py-2">
                                <div>
                                    <h2 className="text-xs font-bold text-[var(--municipal-text)]">{currentLabel}</h2>
                                    <p className="text-[9px] text-[var(--municipal-muted)]">Authorized correspondence for this workspace</p>
                                </div>
                                <span className="text-[10px] text-[var(--municipal-muted)]">{records.total === 0 ? 'No matching records' : `Showing ${records.from || 1}–${records.to || records.data.length} of ${records.total}`}</span>
                            </header>

                            <div className="hidden grid-cols-[minmax(0,1.6fr)_minmax(140px,.9fr)_minmax(0,1fr)_120px_64px] gap-3 border-b border-[var(--municipal-border)] px-3 py-2 text-[9px] font-bold uppercase tracking-wide text-[var(--municipal-muted)] xl:grid">
                                <div>Subject / reference</div><div>Sender / receipt</div><div>Responsibility</div><div>State</div><div />
                            </div>

                            <div className="divide-y divide-[var(--municipal-border)]">
                                {records.data.map((record) => (
                                    <article key={record.publicId} className="px-3 py-2.5 hover:bg-[var(--municipal-hover)]" aria-label={`${record.reference} correspondence`}>
                                        <div className="grid min-w-0 gap-2.5 xl:grid-cols-[minmax(0,1.6fr)_minmax(140px,.9fr)_minmax(0,1fr)_120px_64px] xl:items-center">
                                            <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[9px]">
                                                    <span className="font-bold text-[var(--municipal-brand)]">{record.reference}</span>
                                                    {record.workflowReference ? <span className="text-[var(--municipal-muted)]">Route {record.workflowReference}</span> : null}
                                                </div>
                                                <h3 className="mt-0.5 line-clamp-2 text-[11px] font-semibold leading-4 text-[var(--municipal-text)]">{record.subject}</h3>
                                                {record.classification ? <div className="mt-0.5 text-[9px] uppercase tracking-wide text-[var(--municipal-muted)]">{humanize(record.classification)}</div> : null}
                                            </div>

                                            <div className="min-w-0">
                                                <div className="truncate text-[10px] font-semibold text-[var(--municipal-text)]">{record.sender.name}</div>
                                                <div className="truncate text-[9px] text-[var(--municipal-muted)]">{record.sender.organization || humanize(record.sender.source)}</div>
                                                <div className="mt-0.5 flex items-center gap-1 text-[9px] text-[var(--municipal-muted)]"><Clock3 size={10} aria-hidden="true" /> {record.age} ago</div>
                                            </div>

                                            <div className="min-w-0 border-l-2 border-[var(--municipal-border)] pl-2.5">
                                                <div className="flex items-start gap-1.5 text-[10px] font-semibold text-[var(--municipal-text)]"><Building2 size={11} className="mt-0.5 shrink-0" aria-hidden="true" /><span className="line-clamp-2">{record.currentOffice?.shortName || record.currentOffice?.name || 'Unregistered intake'}</span></div>
                                                <div className="mt-0.5 flex items-start gap-1.5 text-[9px] text-[var(--municipal-muted)]"><UserRound size={10} className="mt-0.5 shrink-0" aria-hidden="true" /><span className="truncate">{record.assignedEmployee?.name || 'Unassigned'}</span></div>
                                            </div>

                                            <div className="flex flex-wrap gap-1">
                                                <span className="rounded-full bg-[var(--municipal-surface-subtle)] px-2 py-1 text-[9px] font-bold uppercase text-[var(--municipal-text)]">{humanize(record.lifecycleState)}</span>
                                                {record.actionRequired ? <span className="rounded-full bg-[#fff8e8] px-2 py-1 text-[9px] font-bold uppercase text-[#9a6a08]">Action</span> : null}
                                                {record.overdue ? <span className="inline-flex items-center gap-1 rounded-full bg-[#fff0f1] px-2 py-1 text-[9px] font-bold uppercase text-[#b23b45]"><AlertTriangle size={9} /> Overdue</span> : null}
                                            </div>

                                            <Link href={withReturnContext(`/correspondence/${record.publicId}/workspace`, url, '/correspondence')} className="inline-flex min-h-9 items-center justify-center gap-1 text-[10px] font-bold text-[var(--municipal-brand)] hover:underline">Open <ArrowRight size={12} /></Link>
                                        </div>
                                    </article>
                                ))}

                                {!records.data.length ? (
                                    <div className="px-5 py-8 text-center">
                                        <Inbox className="mx-auto text-[var(--municipal-muted)]" size={24} aria-hidden="true" />
                                        <div className="mt-2 text-xs font-bold text-[var(--municipal-text)]">No correspondence matches this view.</div>
                                        <div className="mt-1 text-[10px] text-[var(--municipal-muted)]">Change the queue or clear one of the active filters.</div>
                                    </div>
                                ) : null}
                            </div>
                        </section>

                        {records.last_page > 1 ? (
                            <nav className="municipal-panel flex items-center justify-between gap-3 px-3 py-2 text-[10px]" aria-label="Correspondence pagination">
                                <button type="button" disabled={!records.prev_page_url} onClick={() => records.prev_page_url && router.visit(records.prev_page_url, { preserveScroll: true })} className="min-h-9 px-2 font-semibold text-[var(--municipal-brand)] disabled:opacity-40">Previous</button>
                                <span className="text-[var(--municipal-muted)]">Page {records.current_page} of {records.last_page}</span>
                                <button type="button" disabled={!records.next_page_url} onClick={() => records.next_page_url && router.visit(records.next_page_url, { preserveScroll: true })} className="min-h-9 px-2 font-semibold text-[var(--municipal-brand)] disabled:opacity-40">Next</button>
                            </nav>
                        ) : null}
                    </>
                )}
            </PageFrame>
        </AppLayout>
    );
}
