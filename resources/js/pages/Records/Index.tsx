import { Link, router, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    Building2,
    CalendarDays,
    ChevronLeft,
    FileSearch,
    Inbox,
    Landmark,
    Search,
    SlidersHorizontal,
    UserRound,
    X,
} from 'lucide-react';
import { type FormEvent, useEffect, useState } from 'react';
import PageFrame from '../../components/PageFrame';
import PageHeader from '../../components/PageHeader';
import AppLayout from '../../layouts/AppLayout';
import { withReturnContext } from '../../navigation/returnContext';

type Office = {
    id?: number;
    code: string;
    name: string;
    shortName?: string | null;
};

type Employee = {
    name: string;
    position?: string | null;
};

type RecordType = 'correspondence' | 'transaction' | 'travel_order';

type RecordRow = {
    recordType: RecordType;
    reference?: string | null;
    title: string;
    source: string;
    originOffice?: Office | null;
    currentOffice?: Office | null;
    assignedEmployee?: Employee | null;
    state: string;
    classification?: string | null;
    recordDate?: string | null;
    updatedAt?: string | null;
    detailUrl: string;
};

type Paginator = {
    data: RecordRow[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from?: number | null;
    to?: number | null;
    prev_page_url?: string | null;
    next_page_url?: string | null;
};

type Option = {
    value: string;
    label: string;
};

type Filters = {
    view: 'overview' | 'register';
    search: string;
    record_type: string;
    state: string;
    office_id?: number | null;
    date_from: string;
    date_to: string;
};

type Overview = {
    counts: {
        all: number;
        correspondence: number;
        transaction: number;
        travel_order: number;
    };
    recent: RecordRow[];
};

type Props = {
    records: Paginator;
    overview: Overview;
    filters: Filters;
    filterOptions: {
        recordTypes: Option[];
        states: Option[];
        offices: Office[];
    };
};

const humanize = (value: string) => value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

const formatDate = (value?: string | null) => {
    if (!value) return 'Not recorded';

    const date = new Date(value);
    return Number.isNaN(date.getTime())
        ? 'Not recorded'
        : date.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
};

const recordTypeLabel = (recordType: RecordType) => {
    if (recordType === 'correspondence') return 'Correspondence';
    if (recordType === 'travel_order') return 'Travel Order';
    return 'Transaction';
};

const officeLabel = (office?: Office | null) => office?.shortName || office?.name || 'Not assigned';

const typeTone: Record<RecordType, string> = {
    correspondence: 'bg-[#f5f0ff] text-[#7150a8]',
    transaction: 'bg-[#eef5ff] text-[#265fa8]',
    travel_order: 'bg-[#eef8f1] text-[#17633f]',
};

const cards = [
    {
        key: 'all',
        label: 'All Records',
        detail: 'Authorized municipal records',
        icon: Landmark,
        tone: 'border-[#cae2d8] bg-[#edf7f3] text-[#1f6b50]',
    },
    {
        key: 'transaction',
        label: 'Transactions',
        detail: 'Inter-office workflow records',
        icon: FileSearch,
        tone: 'border-[#cfe0f6] bg-[#eef5ff] text-[#265fa8]',
    },
    {
        key: 'correspondence',
        label: 'Correspondence',
        detail: 'Official communication records',
        icon: Inbox,
        tone: 'border-[#ddd2f3] bg-[#f5f0ff] text-[#7150a8]',
    },
    {
        key: 'travel_order',
        label: 'Travel Orders',
        detail: 'Approved travel records',
        icon: CalendarDays,
        tone: 'border-[#cfe6d5] bg-[#eef8f1] text-[#17633f]',
    },
] as const;

function RecordList({ rows, detailHref }: {
    rows: RecordRow[];
    detailHref: (record: RecordRow) => string;
}) {
    return (
        <div className="divide-y divide-[var(--municipal-border)]">
            {rows.map((record) => (
                <article key={`${record.recordType}:${record.detailUrl}`} className="px-3 py-2.5 hover:bg-[var(--municipal-hover)]">
                    <div className="grid min-w-0 gap-2.5 xl:grid-cols-[minmax(260px,1.6fr)_140px_minmax(190px,1fr)_115px_64px] xl:items-center">
                        <div className="min-w-0">
                            <Link href={detailHref(record)} className="block truncate text-[10px] font-bold text-[var(--municipal-brand)] hover:underline">
                                {record.reference || 'Reference pending'}
                            </Link>
                            <h3 className="mt-0.5 line-clamp-2 text-[11px] font-semibold leading-4 text-[var(--municipal-text)]">{record.title}</h3>
                            <div className="mt-0.5 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5 text-[9px] leading-4 text-[var(--municipal-muted)]">
                                <span className="truncate">{record.source}</span>
                                {record.originOffice ? <span className="shrink-0">Origin: {officeLabel(record.originOffice)}</span> : null}
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5 xl:block">
                            <span className={`inline-flex rounded-full px-2 py-1 text-[9px] font-bold uppercase tracking-wide ${typeTone[record.recordType]}`}>
                                {recordTypeLabel(record.recordType)}
                            </span>
                            <div className="inline-flex rounded-full border border-[var(--municipal-border)] bg-[var(--municipal-surface)] px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-[var(--municipal-text)] xl:mt-1.5 xl:flex xl:w-fit">
                                {humanize(record.state)}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 xl:grid-cols-1 xl:gap-1">
                            <div className="min-w-0">
                                <div className="text-[9px] font-bold uppercase tracking-wide text-[var(--municipal-muted)] xl:hidden">Current office</div>
                                <div className="mt-0.5 flex min-w-0 items-start gap-1.5 text-[10px] font-semibold text-[var(--municipal-text)]">
                                    <Building2 size={11} className="mt-0.5 shrink-0 text-[var(--municipal-muted)]" aria-hidden="true" />
                                    <span className="truncate">{officeLabel(record.currentOffice)}</span>
                                </div>
                            </div>
                            <div className="min-w-0">
                                <div className="text-[9px] font-bold uppercase tracking-wide text-[var(--municipal-muted)] xl:hidden">Responsible</div>
                                <div className="mt-0.5 flex min-w-0 items-start gap-1.5 text-[10px] text-[var(--municipal-muted)]">
                                    <UserRound size={11} className="mt-0.5 shrink-0" aria-hidden="true" />
                                    <span className="truncate">{record.recordType === 'travel_order' ? 'Issued personnel on detail' : (record.assignedEmployee?.name || 'Unassigned')}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-1.5 text-[10px] text-[var(--municipal-text)]">
                            <CalendarDays size={11} className="shrink-0 text-[var(--municipal-muted)]" aria-hidden="true" />
                            {formatDate(record.recordDate)}
                        </div>

                        <Link
                            href={detailHref(record)}
                            aria-label={`Open record ${record.reference || record.title}`}
                            className="inline-flex min-h-9 items-center justify-center gap-1 text-[10px] font-bold text-[var(--municipal-brand)] hover:underline xl:justify-self-end"
                        >
                            Open <ArrowRight size={12} aria-hidden="true" />
                        </Link>
                    </div>
                </article>
            ))}
        </div>
    );
}

export default function Index({ records, overview, filters, filterOptions }: Props) {
    const { url } = usePage();
    const currentView = filters.view || 'overview';
    const [search, setSearch] = useState(filters.search);
    const [recordType, setRecordType] = useState(filters.record_type || 'all');
    const [state, setState] = useState(filters.state);
    const [officeId, setOfficeId] = useState(filters.office_id ? String(filters.office_id) : '');
    const [dateFrom, setDateFrom] = useState(filters.date_from);
    const [dateTo, setDateTo] = useState(filters.date_to);
    const [moreFilters, setMoreFilters] = useState(Boolean(filters.date_from || filters.date_to));

    useEffect(() => {
        setSearch(filters.search);
        setRecordType(filters.record_type || 'all');
        setState(filters.state);
        setOfficeId(filters.office_id ? String(filters.office_id) : '');
        setDateFrom(filters.date_from);
        setDateTo(filters.date_to);
        setMoreFilters(Boolean(filters.date_from || filters.date_to));
    }, [filters.search, filters.record_type, filters.state, filters.office_id, filters.date_from, filters.date_to]);

    const detailHref = (record: RecordRow) => withReturnContext(record.detailUrl, url, '/records');

    const queryData = (overrides: Record<string, unknown> = {}) => Object.fromEntries(
        Object.entries({
            view: 'register',
            search: search || undefined,
            record_type: recordType || 'all',
            state: state || undefined,
            office_id: officeId ? Number(officeId) : undefined,
            date_from: dateFrom || undefined,
            date_to: dateTo || undefined,
            ...overrides,
        }).filter(([, value]) => value !== '' && value !== null && value !== undefined),
    );

    const openRegister = (type = 'all') => {
        router.get('/records', { view: 'register', record_type: type }, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const submit = (event: FormEvent) => {
        event.preventDefault();
        router.get('/records', queryData(), {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const submitOverviewSearch = (event: FormEvent) => {
        event.preventDefault();
        router.get('/records', {
            view: 'register',
            record_type: 'all',
            search: search || undefined,
        }, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const clearFilters = () => {
        setSearch('');
        setRecordType('all');
        setState('');
        setOfficeId('');
        setDateFrom('');
        setDateTo('');
        setMoreFilters(false);
        router.get('/records', { view: 'register' }, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const activeFilterCount = [
        search,
        recordType && recordType !== 'all' ? recordType : '',
        state,
        officeId,
        dateFrom,
        dateTo,
    ].filter(Boolean).length;

    return (
        <AppLayout title="Municipal Records">
            <PageFrame width="standard" density="compact">
                <PageHeader
                    eyebrow="Authorized municipal records"
                    title="Municipal Records"
                    description="Find authoritative records across correspondence, inter-office workflows and approved travel orders."
                    icon={FileSearch}
                />

                {currentView === 'overview' ? (
                    <div className="space-y-2.5">
                        <section aria-labelledby="records-glance">
                            <div className="mb-1 flex items-center justify-between gap-3">
                                <h2 id="records-glance" className="text-[10px] font-bold uppercase tracking-wide text-[var(--municipal-muted)]">At a glance</h2>
                                <span className="text-[9px] text-[var(--municipal-muted)]">{overview.counts.all} authorized record{overview.counts.all === 1 ? '' : 's'}</span>
                            </div>

                            <div className="grid gap-1.5 sm:grid-cols-2 xl:grid-cols-4">
                                {cards.map((card) => {
                                    const Icon = card.icon;
                                    const count = overview.counts[card.key];

                                    return (
                                        <button
                                            key={card.key}
                                            type="button"
                                            onClick={() => openRegister(card.key)}
                                            className={`min-h-[76px] rounded-lg border p-2.5 text-left transition hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--municipal-focus)] ${card.tone}`}
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <Icon size={16} aria-hidden="true" />
                                                <strong className="text-lg leading-none">{count}</strong>
                                            </div>
                                            <div className="mt-1.5 text-[11px] font-bold leading-4">{card.label}</div>
                                            <div className="text-[9px] leading-3.5 opacity-80">{card.detail}</div>
                                        </button>
                                    );
                                })}
                            </div>
                        </section>

                        <section className="municipal-panel overflow-hidden" aria-label="Recent municipal records">
                            <header className="flex min-h-10 items-center justify-between gap-3 border-b border-[var(--municipal-border)] bg-[var(--municipal-surface-subtle)] px-3 py-2">
                                <div>
                                    <h2 className="text-xs font-bold text-[var(--municipal-text)]">Recent Records</h2>
                                    <p className="text-[9px] text-[var(--municipal-muted)]">Newest authoritative records visible to your account</p>
                                </div>
                                <button type="button" onClick={() => openRegister('all')} className="text-[10px] font-bold text-[var(--municipal-brand)]">Browse all</button>
                            </header>

                            <div className="hidden grid-cols-[minmax(260px,1.6fr)_140px_minmax(190px,1fr)_115px_64px] gap-3 border-b border-[var(--municipal-border)] px-3 py-2 text-[9px] font-bold uppercase tracking-wide text-[var(--municipal-muted)] xl:grid">
                                <div>Record</div><div>Type / State</div><div>Responsibility</div><div>Date</div><div />
                            </div>

                            <RecordList rows={overview.recent} detailHref={detailHref} />

                            {!overview.recent.length ? (
                                <div className="px-5 py-8 text-center">
                                    <FileSearch className="mx-auto text-[var(--municipal-muted)]" size={24} aria-hidden="true" />
                                    <div className="mt-2 text-xs font-bold text-[var(--municipal-text)]">No authorized records are available yet.</div>
                                </div>
                            ) : null}
                        </section>

                        <form onSubmit={submitOverviewSearch} className="municipal-panel p-2.5">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                <div className="relative min-w-0 flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--municipal-muted)]" size={14} aria-hidden="true" />
                                    <input
                                        value={search}
                                        onChange={(event) => setSearch(event.target.value)}
                                        placeholder="Search reference, title, sender, office or employee..."
                                        className="min-h-10 w-full rounded-md border border-[var(--municipal-border)] bg-[var(--municipal-surface)] pl-9 pr-3 text-xs text-[var(--municipal-text)] outline-none focus:border-[var(--municipal-focus)] focus:ring-2 focus:ring-[var(--municipal-focus)]/20"
                                    />
                                </div>
                                <button className="min-h-10 rounded-md bg-[var(--municipal-brand-deep)] px-4 text-xs font-bold text-white">Search Municipal Records</button>
                            </div>
                        </form>
                    </div>
                ) : (
                    <>
                        <nav className="municipal-panel flex min-w-0 flex-wrap items-center gap-2 px-2.5 py-1.5" aria-label="Municipal records navigation">
                            <button
                                type="button"
                                onClick={() => router.get('/records', { view: 'overview' }, { preserveState: true, preserveScroll: true, replace: true })}
                                className="inline-flex min-h-9 items-center gap-1 rounded-md px-2 text-[11px] font-bold text-[var(--municipal-brand)] hover:bg-[var(--municipal-hover)]"
                            >
                                <ChevronLeft size={13} aria-hidden="true" /> Overview
                            </button>
                            <span className="text-[10px] text-[var(--municipal-border-strong)]" aria-hidden="true">/</span>
                            <span className="text-[10px] font-bold uppercase tracking-wide text-[var(--municipal-muted)]">Municipal Records</span>
                            <span className="text-[10px] text-[var(--municipal-border-strong)]" aria-hidden="true">/</span>
                            <span className="text-[11px] font-semibold text-[var(--municipal-text)]">
                                {filterOptions.recordTypes.find((option) => option.value === recordType)?.label || 'All Records'}
                            </span>
                            <span className="ml-auto text-[10px] text-[var(--municipal-muted)]"><strong className="text-[var(--municipal-text)]">{records.total}</strong> record{records.total === 1 ? '' : 's'}</span>
                        </nav>

                        <form onSubmit={submit} className="municipal-panel p-2.5">
                            <div className="grid gap-2 lg:grid-cols-[minmax(260px,1.6fr)_150px_170px_190px_auto] lg:items-end">
                                <label className="block min-w-0">
                                    <span className="mb-1 block text-[9px] font-bold uppercase tracking-wide text-[var(--municipal-muted)]">Search records</span>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--municipal-muted)]" size={14} aria-hidden="true" />
                                        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Reference, title, sender, office..." className="min-h-10 w-full rounded-md border border-[var(--municipal-border)] bg-[var(--municipal-surface)] pl-9 pr-3 text-xs text-[var(--municipal-text)] outline-none focus:border-[var(--municipal-focus)] focus:ring-2 focus:ring-[var(--municipal-focus)]/20" />
                                    </div>
                                </label>

                                <label className="block min-w-0">
                                    <span className="mb-1 block text-[9px] font-bold uppercase tracking-wide text-[var(--municipal-muted)]">Type</span>
                                    <select value={recordType} onChange={(event) => { setRecordType(event.target.value); setState(''); }} className="min-h-10 w-full rounded-md border border-[var(--municipal-border)] bg-[var(--municipal-surface)] px-2 text-xs">
                                        {filterOptions.recordTypes.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                                    </select>
                                </label>

                                <label className="block min-w-0">
                                    <span className="mb-1 block text-[9px] font-bold uppercase tracking-wide text-[var(--municipal-muted)]">Status / lifecycle</span>
                                    <select value={state} onChange={(event) => setState(event.target.value)} className="min-h-10 w-full rounded-md border border-[var(--municipal-border)] bg-[var(--municipal-surface)] px-2 text-xs">
                                        <option value="">All states</option>
                                        {filterOptions.states.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                                    </select>
                                </label>

                                <label className="block min-w-0">
                                    <span className="mb-1 block text-[9px] font-bold uppercase tracking-wide text-[var(--municipal-muted)]">Current office</span>
                                    <select value={officeId} onChange={(event) => setOfficeId(event.target.value)} className="min-h-10 w-full rounded-md border border-[var(--municipal-border)] bg-[var(--municipal-surface)] px-2 text-xs">
                                        <option value="">All authorized offices</option>
                                        {filterOptions.offices.map((office) => <option key={office.id} value={office.id}>{office.shortName || office.name}</option>)}
                                    </select>
                                </label>

                                <div className="flex items-end gap-1.5">
                                    <button className="min-h-10 rounded-md bg-[var(--municipal-brand-deep)] px-3 text-xs font-bold text-white">Search{activeFilterCount ? ` · ${activeFilterCount}` : ''}</button>
                                    <button type="button" onClick={() => setMoreFilters((value) => !value)} className={`min-h-10 rounded-md border px-2.5 text-[10px] font-semibold ${moreFilters ? 'border-[var(--municipal-selected-border)] bg-[var(--municipal-selected-bg)] text-[var(--municipal-brand)]' : 'border-[var(--municipal-border)] text-[var(--municipal-text)]'}`}>
                                        <SlidersHorizontal size={13} className="inline" /> Dates
                                    </button>
                                    <button type="button" onClick={clearFilters} aria-label="Clear records filters" className="flex min-h-10 min-w-10 items-center justify-center rounded-md border border-[var(--municipal-border)] text-[var(--municipal-muted)] hover:bg-[var(--municipal-hover)]"><X size={14} /></button>
                                </div>
                            </div>

                            {moreFilters ? (
                                <div className="mt-2 grid gap-2 border-t border-[var(--municipal-border)] pt-2 sm:max-w-xl sm:grid-cols-2">
                                    <label className="block">
                                        <span className="mb-1 block text-[9px] font-bold uppercase tracking-wide text-[var(--municipal-muted)]">From</span>
                                        <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} className="min-h-10 w-full rounded-md border border-[var(--municipal-border)] bg-[var(--municipal-surface)] px-2 text-xs" />
                                    </label>
                                    <label className="block">
                                        <span className="mb-1 block text-[9px] font-bold uppercase tracking-wide text-[var(--municipal-muted)]">To</span>
                                        <input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} className="min-h-10 w-full rounded-md border border-[var(--municipal-border)] bg-[var(--municipal-surface)] px-2 text-xs" />
                                    </label>
                                </div>
                            ) : null}
                        </form>

                        <section className="municipal-panel overflow-hidden" aria-label="Municipal records register">
                            <header className="flex min-h-10 items-center justify-between gap-3 border-b border-[var(--municipal-border)] bg-[var(--municipal-surface-subtle)] px-3 py-2">
                                <div>
                                    <h2 className="text-xs font-bold text-[var(--municipal-text)]">Records</h2>
                                    <p className="text-[9px] text-[var(--municipal-muted)]">Authoritative records matching the current register view</p>
                                </div>
                                <span className="text-[10px] text-[var(--municipal-muted)]">{records.total === 0 ? 'No matching records' : `Showing ${records.from || 1}–${records.to || records.data.length} of ${records.total}`}</span>
                            </header>

                            <div className="hidden grid-cols-[minmax(260px,1.6fr)_140px_minmax(190px,1fr)_115px_64px] gap-3 border-b border-[var(--municipal-border)] px-3 py-2 text-[9px] font-bold uppercase tracking-wide text-[var(--municipal-muted)] xl:grid">
                                <div>Record</div><div>Type / State</div><div>Responsibility</div><div>Date</div><div />
                            </div>

                            <RecordList rows={records.data} detailHref={detailHref} />

                            {!records.data.length ? (
                                <div className="px-5 py-8 text-center">
                                    <FileSearch className="mx-auto text-[var(--municipal-muted)]" size={24} aria-hidden="true" />
                                    <div className="mt-2 text-xs font-bold text-[var(--municipal-text)]">No authorized records match this search.</div>
                                    <div className="mt-1 text-[10px] text-[var(--municipal-muted)]">Change the filters or return to the overview.</div>
                                </div>
                            ) : null}

                            {records.last_page > 1 ? (
                                <nav className="flex items-center justify-between gap-3 border-t border-[var(--municipal-border)] px-3 py-2 text-[10px]" aria-label="Municipal records pagination">
                                    <Link href={records.prev_page_url || '#'} preserveScroll className={`min-h-9 px-2 font-semibold text-[var(--municipal-brand)] ${records.prev_page_url ? '' : 'pointer-events-none opacity-40'}`}>Previous</Link>
                                    <span className="text-[var(--municipal-muted)]">Page {records.current_page} of {records.last_page}</span>
                                    <Link href={records.next_page_url || '#'} preserveScroll className={`min-h-9 px-2 font-semibold text-[var(--municipal-brand)] ${records.next_page_url ? '' : 'pointer-events-none opacity-40'}`}>Next</Link>
                                </nav>
                            ) : null}
                        </section>
                    </>
                )}
            </PageFrame>
        </AppLayout>
    );
}
