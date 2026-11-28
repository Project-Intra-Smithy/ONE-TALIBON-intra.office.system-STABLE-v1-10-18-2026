import { Link, router, usePage } from '@inertiajs/react';
import { ArrowRight, CalendarDays, FileCheck2, MapPin, Plus, RotateCcw, Search, SlidersHorizontal, Users } from 'lucide-react';
import { type FormEvent, useEffect, useId, useState } from 'react';
import { DateInput, PageHeader, StatusBadge, toneForWorkState } from '../../components/ui';
import AppLayout from '../../layouts/AppLayout';
import { formatDatePH, humanizeSlug } from '../../lib/format';
import { withReturnContext } from '../../navigation/returnContext';

type Office = { id?: number; code: string; name: string; shortName?: string | null };
type Option = { value: string; label: string };
type TravelOrderRow = {
    publicId: string;
    referenceNumber: string;
    issuanceDate: string;
    purpose: string;
    destination: string;
    office?: Office | null;
    travelStartDate: string;
    travelEndDate: string;
    status: string;
    issuedToCount: number;
    detailUrl: string;
};
type Paginator = {
    data: TravelOrderRow[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from?: number | null;
    to?: number | null;
    prev_page_url?: string | null;
    next_page_url?: string | null;
};
type Filters = { search: string; status: string; office_id?: number | null; date_from: string; date_to: string };
type Props = {
    travelOrders: Paginator;
    filters: Filters;
    filterOptions: { statuses: Option[]; offices: Office[] };
    canRecordApproved: boolean;
};

const officeLabel = (office?: Office | null) => office?.shortName || office?.name || 'Office not recorded';

function formatTravelSpan(start: string, end: string): string {
    const startLabel = formatDatePH(start);
    const endLabel = formatDatePH(end);
    return start === end ? startLabel : `${startLabel} – ${endLabel}`;
}

export default function Index({ travelOrders, filters, filterOptions, canRecordApproved }: Props) {
    const { url } = usePage();
    const searchId = useId();
    const statusId = useId();
    const officeFieldId = useId();
    const fromId = useId();
    const toId = useId();

    const [search, setSearch] = useState(filters.search);
    const [status, setStatus] = useState(filters.status);
    const [officeId, setOfficeId] = useState(filters.office_id ? String(filters.office_id) : '');
    const [dateFrom, setDateFrom] = useState(filters.date_from);
    const [dateTo, setDateTo] = useState(filters.date_to);
    const [showAdvanced, setShowAdvanced] = useState(Boolean(filters.office_id || filters.date_from || filters.date_to));

    useEffect(() => {
        setSearch(filters.search);
        setStatus(filters.status);
        setOfficeId(filters.office_id ? String(filters.office_id) : '');
        setDateFrom(filters.date_from);
        setDateTo(filters.date_to);
    }, [filters.search, filters.status, filters.office_id, filters.date_from, filters.date_to]);

    const queryData = () =>
        Object.fromEntries(
            Object.entries({
                search,
                status,
                office_id: officeId ? Number(officeId) : null,
                date_from: dateFrom,
                date_to: dateTo,
            }).filter(([, value]) => value !== '' && value !== null),
        );

    const submit = (event: FormEvent) => {
        event.preventDefault();
        router.get('/travel-orders', queryData(), { preserveState: true, preserveScroll: true, replace: true });
    };

    const clear = () => {
        setSearch('');
        setStatus('');
        setOfficeId('');
        setDateFrom('');
        setDateTo('');
        router.get('/travel-orders', {}, { preserveState: true, preserveScroll: true, replace: true });
    };

    const hasFilters = Boolean(search || status || officeId || dateFrom || dateTo);
    const detailHref = (order: TravelOrderRow) => withReturnContext(order.detailUrl, url, '/travel-orders');

    return (
        <AppLayout title="Approved Travel Orders">
            <div className="mx-auto max-w-[1440px] space-y-4 px-4 py-5 sm:px-6">
                <PageHeader
                    eyebrow="Official post-approval registry"
                    title="Approved Travel Orders"
                    subtitle="Locate official approved travel records you are authorized to review."
                    actions={
                        canRecordApproved ? (
                            <Link href="/travel-orders/create" className="municipal-primary-button">
                                <Plus size={15} aria-hidden="true" />
                                <span>Record approved order</span>
                            </Link>
                        ) : undefined
                    }
                />

                <search>
                    <form onSubmit={submit} aria-label="Travel Order filters" className="tcds-card space-y-3 p-3.5 sm:p-4">
                        <div className="flex flex-wrap items-end gap-2.5">
                            <div className="min-w-[14rem] flex-1">
                                <label htmlFor={searchId} className="mb-1 block text-xs font-bold uppercase tracking-wide text-[var(--ink-secondary)]">
                                    Search approved orders
                                </label>
                                <div className="relative">
                                    <Search size={16} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-secondary)]" />
                                    <input
                                        id={searchId}
                                        type="search"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Reference, purpose, destination, office, employee…"
                                        className="tcds-input pl-9"
                                    />
                                </div>
                            </div>

                            <div className="w-full sm:w-44">
                                <label htmlFor={statusId} className="mb-1 block text-xs font-bold uppercase tracking-wide text-[var(--ink-secondary)]">
                                    Status
                                </label>
                                <select id={statusId} value={status} onChange={(e) => setStatus(e.target.value)} className="tcds-input">
                                    <option value="">All statuses</option>
                                    {filterOptions.statuses.map((option) => (
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
                                <button type="submit" className="municipal-primary-button">Apply</button>
                                {hasFilters && (
                                    <button type="button" onClick={clear} className="municipal-secondary-button" aria-label="Clear Travel Order filters">
                                        <RotateCcw size={15} aria-hidden="true" />
                                        <span>Reset</span>
                                    </button>
                                )}
                            </div>
                        </div>

                        {showAdvanced && (
                            <div className="grid gap-3 border-t border-[var(--border-default)] pt-3 sm:grid-cols-3">
                                <div>
                                    <label htmlFor={officeFieldId} className="mb-1 block text-xs font-bold uppercase tracking-wide text-[var(--ink-secondary)]">
                                        Responsible office
                                    </label>
                                    <select id={officeFieldId} value={officeId} onChange={(e) => setOfficeId(e.target.value)} className="tcds-input">
                                        <option value="">All authorized offices</option>
                                        {filterOptions.offices.map((office) => (
                                            <option key={office.id} value={office.id}>{office.shortName || office.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor={fromId} className="mb-1 block text-xs font-bold uppercase tracking-wide text-[var(--ink-secondary)]">
                                        Travel from
                                    </label>
                                    <DateInput id={fromId} value={dateFrom} onChange={setDateFrom} presets="range_start" />
                                </div>
                                <div>
                                    <label htmlFor={toId} className="mb-1 block text-xs font-bold uppercase tracking-wide text-[var(--ink-secondary)]">
                                        Travel to
                                    </label>
                                    <DateInput id={toId} value={dateTo} onChange={setDateTo} min={dateFrom || undefined} />
                                </div>
                            </div>
                        )}
                    </form>
                </search>

                <section aria-label="Approved travel order registry" className="tcds-card overflow-hidden">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-default)] bg-[var(--surface-recessed)] px-4 py-3 sm:px-5">
                        <div className="flex items-center gap-2 text-sm font-bold text-[var(--ink-primary)]">
                            <FileCheck2 size={15} aria-hidden="true" className="text-[var(--brand-ink)]" />
                            <span>Approved-order registry</span>
                        </div>
                        <div className="text-xs font-medium text-[var(--ink-secondary)]">
                            {travelOrders.total === 0 ? 'No matching orders' : `Showing ${travelOrders.from || 1}–${travelOrders.to || travelOrders.data.length} of ${travelOrders.total}`}
                        </div>
                    </div>

                    <div className="divide-y divide-[var(--border-default)]">
                        {travelOrders.data.map((order) => (
                            <article key={order.publicId} className="px-4 py-4 transition-colors hover:bg-[var(--surface-hover)] sm:px-5">
                                <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(420px,1fr)_auto] lg:items-start">
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <Link
                                                href={detailHref(order)}
                                                className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--brand-ink)] hover:underline"
                                            >
                                                {order.referenceNumber}
                                            </Link>
                                            <StatusBadge tone={toneForWorkState(order.status)}>{humanizeSlug(order.status)}</StatusBadge>
                                        </div>
                                        <h2 className="mt-1.5 text-sm font-semibold leading-5 text-[var(--ink-primary)]">{order.purpose}</h2>
                                        <div className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-medium text-[var(--ink-secondary)]">
                                            <MapPin size={13} aria-hidden="true" className="shrink-0" />
                                            <span>{order.destination}</span>
                                        </div>
                                    </div>

                                    <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
                                        <div className="min-w-0">
                                            <dt className="text-xs font-bold uppercase tracking-wide text-[var(--ink-secondary)]">Travel period</dt>
                                            <dd className="mt-1 flex items-start gap-1.5 text-xs font-semibold text-[var(--ink-primary)]">
                                                <CalendarDays size={12} aria-hidden="true" className="mt-0.5 shrink-0 text-[var(--ink-secondary)]" />
                                                <span>{formatTravelSpan(order.travelStartDate, order.travelEndDate)}</span>
                                            </dd>
                                        </div>
                                        <div className="min-w-0">
                                            <dt className="text-xs font-bold uppercase tracking-wide text-[var(--ink-secondary)]">Office</dt>
                                            <dd className="mt-1 text-xs font-semibold text-[var(--ink-primary)]">{officeLabel(order.office)}</dd>
                                        </div>
                                        <div className="min-w-0">
                                            <dt className="text-xs font-bold uppercase tracking-wide text-[var(--ink-secondary)]">Personnel</dt>
                                            <dd className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-[var(--ink-primary)]">
                                                <Users size={12} aria-hidden="true" className="shrink-0 text-[var(--ink-secondary)]" />
                                                <span>{order.issuedToCount} {order.issuedToCount === 1 ? 'person' : 'personnel'}</span>
                                            </dd>
                                        </div>
                                        <div className="min-w-0">
                                            <dt className="text-xs font-bold uppercase tracking-wide text-[var(--ink-secondary)]">Issued</dt>
                                            <dd className="mt-1 text-xs font-semibold text-[var(--ink-primary)]">{formatDatePH(order.issuanceDate)}</dd>
                                        </div>
                                    </dl>

                                    <Link
                                        href={detailHref(order)}
                                        aria-label={`Open travel order ${order.referenceNumber}`}
                                        className="municipal-secondary-button w-fit lg:justify-self-end"
                                    >
                                        <span>Open order</span>
                                        <ArrowRight size={14} aria-hidden="true" />
                                    </Link>
                                </div>
                            </article>
                        ))}

                        {travelOrders.data.length === 0 && (
                            <div className="px-5 py-10 text-center">
                                <div className="text-sm font-semibold text-[var(--ink-primary)]">No authorized approved Travel Orders match this search.</div>
                                <div className="mt-1 text-xs text-[var(--ink-secondary)]">Change the filters or clear the search criteria.</div>
                            </div>
                        )}
                    </div>

                    {travelOrders.last_page > 1 && (
                        <div className="flex items-center justify-between gap-3 border-t border-[var(--border-default)] bg-[var(--surface-recessed)] px-4 py-3 sm:px-5">
                            <Link
                                href={travelOrders.prev_page_url || '#'}
                                preserveScroll
                                className={`municipal-secondary-button min-h-9 px-3 text-xs ${!travelOrders.prev_page_url ? 'pointer-events-none opacity-40' : ''}`}
                            >
                                Previous
                            </Link>
                            <div className="text-xs text-[var(--ink-secondary)]">
                                Page {travelOrders.current_page} of {travelOrders.last_page}
                            </div>
                            <Link
                                href={travelOrders.next_page_url || '#'}
                                preserveScroll
                                className={`municipal-secondary-button min-h-9 px-3 text-xs ${!travelOrders.next_page_url ? 'pointer-events-none opacity-40' : ''}`}
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
