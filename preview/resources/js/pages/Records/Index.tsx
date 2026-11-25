import { Link, router, usePage } from '@inertiajs/react';
import { ArrowRight, Building2, CalendarDays, FileSearch, RotateCcw, Search, SlidersHorizontal, UserRound } from 'lucide-react';
import { type FormEvent, useEffect, useId, useState } from 'react';
import { DateInput, PageHeader, StatusBadge, toneForWorkState } from '../../components/ui';
import AppLayout from '../../layouts/AppLayout';
import { formatDatePH, humanizeSlug } from '../../lib/format';
import { withReturnContext } from '../../navigation/returnContext';

type Office = { id?: number; code: string; name: string; shortName?: string | null };
type Employee = { name: string; position?: string | null };
type RecordRow = {
    recordType: 'correspondence' | 'transaction' | 'travel_order';
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
type Option = { value: string; label: string };
type Filters = {
    search: string;
    record_type: string;
    state: string;
    office_id?: number | null;
    date_from: string;
    date_to: string;
};
type Props = {
    records: Paginator;
    filters: Filters;
    filterOptions: { recordTypes: Option[]; states: Option[]; offices: Office[] };
};

const recordTypeLabel = (recordType: RecordRow['recordType']) => {
    if (recordType === 'correspondence') return 'Correspondence';
    if (recordType === 'travel_order') return 'Travel Order';
    return 'Work Request';
};

const officeLabel = (office?: Office | null) => office?.shortName || office?.name || 'Not assigned';

export default function Index({ records, filters, filterOptions }: Props) {
    const { url } = usePage();
    const searchId = useId();
    const typeId = useId();
    const stateId = useId();
    const officeIdField = useId();
    const fromId = useId();
    const toId = useId();

    const detailHref = (record: RecordRow) => withReturnContext(record.detailUrl, url, '/records');
    const [search, setSearch] = useState(filters.search);
    const [recordType, setRecordType] = useState(filters.record_type || 'all');
    const [state, setState] = useState(filters.state);
    const [officeId, setOfficeId] = useState(filters.office_id ? String(filters.office_id) : '');
    const [dateFrom, setDateFrom] = useState(filters.date_from);
    const [dateTo, setDateTo] = useState(filters.date_to);
    const [showAdvanced, setShowAdvanced] = useState(Boolean(filters.office_id || filters.date_from || filters.date_to));

    useEffect(() => {
        setSearch(filters.search);
        setRecordType(filters.record_type || 'all');
        setState(filters.state);
        setOfficeId(filters.office_id ? String(filters.office_id) : '');
        setDateFrom(filters.date_from);
        setDateTo(filters.date_to);
    }, [filters.search, filters.record_type, filters.state, filters.office_id, filters.date_from, filters.date_to]);

    const queryData = () =>
        Object.fromEntries(
            Object.entries({
                search,
                record_type: recordType || 'all',
                state,
                office_id: officeId ? Number(officeId) : null,
                date_from: dateFrom,
                date_to: dateTo,
            }).filter(([, value]) => value !== '' && value !== null && value !== undefined),
        );

    const submit = (event: FormEvent) => {
        event.preventDefault();
        router.get('/records', queryData(), { preserveState: true, preserveScroll: true, replace: true });
    };

    const clearFilters = () => {
        setSearch('');
        setRecordType('all');
        setState('');
        setOfficeId('');
        setDateFrom('');
        setDateTo('');
        router.get('/records', {}, { preserveState: true, preserveScroll: true, replace: true });
    };

    const hasFilters = Boolean(search || (recordType && recordType !== 'all') || state || officeId || dateFrom || dateTo);

    return (
        <AppLayout title="Records">
            <div className="mx-auto max-w-[1440px] space-y-4 px-4 py-5 sm:px-6">
                <PageHeader
                    eyebrow="Authorized records registry"
                    title="Records"
                    subtitle="Search authorized correspondence, inter-office transactions, and approved Travel Orders."
                />

                <search>
                    <form onSubmit={submit} aria-label="Records filters" className="tcds-card space-y-3 p-3.5 sm:p-4">
                        <div className="flex flex-wrap items-end gap-2.5">
                            <div className="min-w-[14rem] flex-1">
                                <label htmlFor={searchId} className="mb-1 block text-xs font-bold uppercase tracking-wide text-[var(--ink-secondary)]">
                                    Search records
                                </label>
                                <div className="relative">
                                    <Search size={16} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-secondary)]" />
                                    <input
                                        id={searchId}
                                        type="search"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Reference, title, office, sender, employee…"
                                        className="tcds-input pl-9"
                                    />
                                </div>
                            </div>

                            <div className="w-full sm:w-44">
                                <label htmlFor={typeId} className="mb-1 block text-xs font-bold uppercase tracking-wide text-[var(--ink-secondary)]">
                                    Record type
                                </label>
                                <select
                                    id={typeId}
                                    value={recordType}
                                    onChange={(e) => {
                                        setRecordType(e.target.value);
                                        setState('');
                                    }}
                                    className="tcds-input"
                                >
                                    {filterOptions.recordTypes.map((option) => (
                                        <option key={option.value} value={option.value}>{option.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="w-full sm:w-44">
                                <label htmlFor={stateId} className="mb-1 block text-xs font-bold uppercase tracking-wide text-[var(--ink-secondary)]">
                                    Status
                                </label>
                                <select id={stateId} value={state} onChange={(e) => setState(e.target.value)} className="tcds-input">
                                    <option value="">All states</option>
                                    {filterOptions.states.map((option) => (
                                        <option key={option.value} value={option.value}>{option.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                <button
                                    type="button"
                                    aria-expanded={showAdvanced}
                                    onClick={() => setShowAdvanced((v) => !v)}
                                    className="municipal-secondary-button"
                                >
                                    <SlidersHorizontal size={15} aria-hidden="true" />
                                    <span>Dates &amp; office</span>
                                </button>
                                <button type="submit" className="municipal-primary-button">Search</button>
                                {hasFilters && (
                                    <button type="button" onClick={clearFilters} className="municipal-secondary-button" aria-label="Clear records filters">
                                        <RotateCcw size={15} aria-hidden="true" />
                                        <span>Reset</span>
                                    </button>
                                )}
                            </div>
                        </div>

                        {showAdvanced && (
                            <div className="grid gap-3 border-t border-[var(--border-default)] pt-3 sm:grid-cols-3">
                                <div>
                                    <label htmlFor={officeIdField} className="mb-1 block text-xs font-bold uppercase tracking-wide text-[var(--ink-secondary)]">
                                        Current / Responsible Office
                                    </label>
                                    <select id={officeIdField} value={officeId} onChange={(e) => setOfficeId(e.target.value)} className="tcds-input">
                                        <option value="">All authorized offices</option>
                                        {filterOptions.offices.map((office) => (
                                            <option key={office.id} value={office.id}>{office.shortName || office.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor={fromId} className="mb-1 block text-xs font-bold uppercase tracking-wide text-[var(--ink-secondary)]">
                                        Date from
                                    </label>
                                    <DateInput id={fromId} value={dateFrom} onChange={setDateFrom} presets="range_start" />
                                </div>
                                <div>
                                    <label htmlFor={toId} className="mb-1 block text-xs font-bold uppercase tracking-wide text-[var(--ink-secondary)]">
                                        Date to
                                    </label>
                                    <DateInput id={toId} value={dateTo} onChange={setDateTo} min={dateFrom || undefined} />
                                </div>
                            </div>
                        )}
                    </form>
                </search>

                <section aria-label="Records registry" className="tcds-card overflow-hidden">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-default)] bg-[var(--surface-recessed)] px-4 py-3 sm:px-5">
                        <div className="flex items-center gap-2 text-sm font-bold text-[var(--ink-primary)]">
                            <FileSearch size={15} aria-hidden="true" className="text-[var(--brand-ink)]" />
                            <span>Records Registry</span>
                        </div>
                        <div className="text-xs font-medium text-[var(--ink-secondary)]">
                            {records.total === 0 ? 'No matching records' : `Showing ${records.from || 1}–${records.to || records.data.length} of ${records.total}`}
                        </div>
                    </div>

                    <div className="divide-y divide-[var(--border-default)]">
                        {records.data.map((record) => (
                            <article key={`${record.recordType}:${record.detailUrl}`} className="px-4 py-4 transition-colors hover:bg-[var(--surface-hover)] sm:px-5">
                                <div className="grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(380px,1fr)_auto] lg:items-start">
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-1.5">
                                            <StatusBadge tone="neutral">{recordTypeLabel(record.recordType)}</StatusBadge>
                                            <StatusBadge tone={toneForWorkState(record.state)}>{humanizeSlug(record.state)}</StatusBadge>
                                            {record.classification && (
                                                <StatusBadge tone={record.classification === 'restricted' ? 'danger' : 'neutral'}>
                                                    {humanizeSlug(record.classification)}
                                                </StatusBadge>
                                            )}
                                        </div>
                                        <Link
                                            href={detailHref(record)}
                                            className="mt-2 block w-fit max-w-full font-mono text-xs font-bold uppercase tracking-wider text-[var(--brand-ink)] hover:underline"
                                        >
                                            {record.reference || 'Reference pending'}
                                        </Link>
                                        <h2 className="mt-1 break-words text-sm font-semibold leading-5 text-[var(--ink-primary)]">
                                            {record.title}
                                        </h2>
                                        <p className="mt-1 text-xs text-[var(--ink-secondary)]">
                                            {record.source}
                                            {record.originOffice ? ` · Origin: ${officeLabel(record.originOffice)}` : ''}
                                        </p>
                                    </div>

                                    <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5 sm:grid-cols-3">
                                        <div className="min-w-0">
                                            <dt className="text-xs font-bold uppercase tracking-wide text-[var(--ink-secondary)]">Current office</dt>
                                            <dd className="mt-1 flex items-start gap-1.5 text-xs font-semibold text-[var(--ink-primary)]">
                                                <Building2 size={13} aria-hidden="true" className="mt-0.5 shrink-0 text-[var(--ink-secondary)]" />
                                                <span>{officeLabel(record.currentOffice)}</span>
                                            </dd>
                                        </div>
                                        <div className="min-w-0">
                                            <dt className="text-xs font-bold uppercase tracking-wide text-[var(--ink-secondary)]">Responsible</dt>
                                            <dd className="mt-1 flex items-start gap-1.5 text-xs font-semibold text-[var(--ink-primary)]">
                                                <UserRound size={13} aria-hidden="true" className="mt-0.5 shrink-0 text-[var(--ink-secondary)]" />
                                                <span>{record.recordType === 'travel_order' ? 'Issued personnel on detail' : record.assignedEmployee?.name || 'Unassigned'}</span>
                                            </dd>
                                            {record.assignedEmployee?.position && (
                                                <dd className="mt-0.5 pl-[18px] text-xs text-[var(--ink-secondary)]">{record.assignedEmployee.position}</dd>
                                            )}
                                        </div>
                                        <div className="col-span-2 min-w-0 sm:col-span-1">
                                            <dt className="text-xs font-bold uppercase tracking-wide text-[var(--ink-secondary)]">Record date</dt>
                                            <dd className="mt-1 flex items-start gap-1.5 text-xs font-semibold text-[var(--ink-primary)]">
                                                <CalendarDays size={13} aria-hidden="true" className="mt-0.5 shrink-0 text-[var(--ink-secondary)]" />
                                                <span>{record.recordDate ? formatDatePH(record.recordDate) : 'Not recorded'}</span>
                                            </dd>
                                        </div>
                                    </dl>

                                    <Link
                                        href={detailHref(record)}
                                        aria-label={`Open record ${record.reference || record.title}`}
                                        className="municipal-secondary-button w-fit lg:justify-self-end"
                                    >
                                        <span>Open record</span>
                                        <ArrowRight size={14} aria-hidden="true" />
                                    </Link>
                                </div>
                            </article>
                        ))}

                        {records.data.length === 0 && (
                            <div className="px-5 py-10 text-center">
                                <div className="text-sm font-semibold text-[var(--ink-primary)]">No authorized records match this search.</div>
                                <div className="mt-1 text-xs text-[var(--ink-secondary)]">Change the filters or clear the search criteria.</div>
                            </div>
                        )}
                    </div>

                    {records.last_page > 1 && (
                        <div className="flex items-center justify-between gap-3 border-t border-[var(--border-default)] bg-[var(--surface-recessed)] px-4 py-3 sm:px-5">
                            <Link
                                href={records.prev_page_url || '#'}
                                preserveScroll
                                className={`municipal-secondary-button min-h-9 px-3 text-xs ${!records.prev_page_url ? 'pointer-events-none opacity-40' : ''}`}
                            >
                                Previous
                            </Link>
                            <div className="text-xs text-[var(--ink-secondary)]">
                                Page {records.current_page} of {records.last_page}
                            </div>
                            <Link
                                href={records.next_page_url || '#'}
                                preserveScroll
                                className={`municipal-secondary-button min-h-9 px-3 text-xs ${!records.next_page_url ? 'pointer-events-none opacity-40' : ''}`}
                            >
                                Next
                            </Link>
                        </div>
                    )}
                </section>
            </div>
        </AppLayout>
    );
}
