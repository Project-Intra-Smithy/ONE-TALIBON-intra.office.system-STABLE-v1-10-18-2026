import { Link, router, usePage } from '@inertiajs/react';
import { ArrowRight, Inbox, RotateCcw, Search } from 'lucide-react';
import { type FormEvent, useEffect, useId, useState } from 'react';
import { correspondenceOverviewCount } from '../../compat/uiContracts';
import { EmptyState, KpiCard, PageHeader, StatusBadge, toneForWorkState } from '../../components/ui';
import AppLayout from '../../layouts/AppLayout';
import { formatDatePH, humanizeSlug } from '../../lib/format';
import { withReturnContext } from '../../navigation/returnContext';

type Office = { id: number; code: string; name: string; short_name?: string | null };
type RecordOffice = { id: number; code: string; name: string; shortName?: string | null };
type Assignee = { id: number; employeeNumber: string; name?: string | null; position: string };
type CorrespondenceRow = {
    publicId: string;
    reference: string;
    sender: { name: string; organization?: string | null; source: string; channel?: string | null };
    subject: string;
    classification?: string | null;
    lifecycleState: string;
    currentOffice?: RecordOffice | null;
    assignedEmployee?: Assignee | null;
    workflowReference?: string | null;
    receivedAt?: string | null;
    age: string;
    actionRequired: boolean;
    overdue: boolean;
};
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
    filters: Filters & { view?: string };
    overview: { counts: Record<string, number>; previews: Record<string, CorrespondenceRow[]> };
    filterOptions: { lifecycles: string[]; classifications: string[]; offices: Office[] };
    workspace: { departmentName: string; departmentCode: string };
};

const VIEW_TABS = ['overview', 'all', 'needs_action', 'received', 'assigned_to_me', 'routed', 'archived'] as const;

function enabled(value: boolean | number | string | undefined): boolean {
    return value === true || value === 1 || value === '1' || value === 'true';
}

export default function CorrespondenceIndex({ records, filters, filterOptions, workspace, overview }: Props) {
    const { url } = usePage();
    const detailHref = (publicId: string) => withReturnContext(`/correspondence/${publicId}/workspace`, url, '/correspondence');
    const activeView = filters.view || 'overview';
    const isOverview = activeView === 'overview';
    const [search, setSearch] = useState(filters.search ?? '');
    const [lifecycle, setLifecycle] = useState(filters.lifecycle ?? '');
    const [classification, setClassification] = useState(filters.classification ?? '');
    const [officeId, setOfficeId] = useState(filters.office_id ? String(filters.office_id) : '');
    const [assignedToMe, setAssignedToMe] = useState(enabled(filters.assigned_to_me));
    const [actionRequired, setActionRequired] = useState(enabled(filters.action_required));
    const [aging, setAging] = useState(filters.aging ?? '');
    const searchId = useId();
    const lifecycleId = useId();
    const classificationId = useId();
    const officeFieldId = useId();
    const agingFieldId = useId();

    useEffect(() => {
        setSearch(filters.search ?? '');
        setLifecycle(filters.lifecycle ?? '');
        setClassification(filters.classification ?? '');
        setOfficeId(filters.office_id ? String(filters.office_id) : '');
        setAssignedToMe(enabled(filters.assigned_to_me));
        setActionRequired(enabled(filters.action_required));
        setAging(filters.aging ?? '');
    }, [
        filters.search,
        filters.lifecycle,
        filters.classification,
        filters.office_id,
        filters.assigned_to_me,
        filters.action_required,
        filters.aging,
    ]);

    const apply = (event: FormEvent) => {
        event.preventDefault();
        router.get(
            '/correspondence',
            {
                view: 'all',
                search: search || undefined,
                lifecycle: lifecycle || undefined,
                classification: classification || undefined,
                office_id: officeId || undefined,
                assigned_to_me: assignedToMe ? '1' : undefined,
                action_required: actionRequired ? '1' : undefined,
                aging: aging || undefined,
            },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    const clear = () => {
        setSearch('');
        setLifecycle('');
        setClassification('');
        setOfficeId('');
        setAssignedToMe(false);
        setActionRequired(false);
        setAging('');
        router.get('/correspondence', { view: 'all' }, { replace: true });
    };

    const hasActiveFilters = Boolean(search || lifecycle || classification || officeId || assignedToMe || actionRequired || aging);

    return (
        <AppLayout title="Correspondence">
            <div className="mx-auto max-w-[1440px] space-y-4 px-4 py-5 sm:px-6">
                <PageHeader
                    title="Correspondence"
                    subtitle={`Incoming correspondence and office routing for ${workspace.departmentName}`}
                />

                <nav aria-label="Correspondence views" className="flex flex-wrap gap-1.5 border-b border-[var(--border-default)] pb-2.5">
                    {VIEW_TABS.map((option) => {
                        const active = activeView === option;
                        return (
                            <Link
                                key={option}
                                href={`/correspondence?view=${option}`}
                                aria-current={active ? 'page' : undefined}
                                className={`inline-flex min-h-11 items-center rounded-lg border px-3.5 text-sm font-semibold transition-colors ${
                                    active
                                        ? 'border-[var(--brand-primary)] bg-[var(--brand-soft)] text-[var(--ink-primary)]'
                                        : 'border-transparent text-[var(--ink-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--ink-primary)]'
                                }`}
                            >
                                {humanizeSlug(option)}
                            </Link>
                        );
                    })}
                </nav>

                {isOverview ? (
                    <div className="space-y-5">
                        <section aria-label="Correspondence summary" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                            <KpiCard label="Needs Action" value={correspondenceOverviewCount(overview, 'needs_action')} accent="warn" href="/correspondence?view=needs_action" />
                            <KpiCard label="Overdue" value={correspondenceOverviewCount(overview, 'overdue')} accent="danger" href="/correspondence?view=overdue" />
                            <KpiCard label="Received" value={correspondenceOverviewCount(overview, 'received')} accent="brand" href="/correspondence?view=received" />
                            <KpiCard label="All Visible" value={correspondenceOverviewCount(overview, 'all')} accent="neutral" href="/correspondence?view=all" />
                        </section>

                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                            {(['needs_action', 'received', 'routed'] as const).map((key) => {
                                const list = overview?.previews?.[key] ?? [];
                                return (
                                    <section key={key} className="tcds-card overflow-hidden">
                                        <div className="flex items-center justify-between border-b border-[var(--border-default)] px-4 py-3">
                                            <h2 className="text-base font-bold text-[var(--ink-primary)]">{humanizeSlug(key)}</h2>
                                            <Link href={`/correspondence?view=${key}`} className="text-sm font-semibold text-[var(--brand-ink)] hover:underline">
                                                View queue
                                            </Link>
                                        </div>
                                        {list.length === 0 ? (
                                            <p className="px-4 py-6 text-sm text-[var(--ink-secondary)]">No items queued here.</p>
                                        ) : (
                                            <ul className="divide-y divide-[var(--border-default)]">
                                                {list.map((row) => (
                                                    <li key={row.publicId}>
                                                        <Link href={detailHref(row.publicId)} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-[var(--surface-hover)]">
                                                            <div className="min-w-0">
                                                                <div className="font-mono text-xs font-bold text-[var(--brand-ink)]">{row.reference}</div>
                                                                <div className="truncate text-sm font-semibold text-[var(--ink-primary)]">{row.subject}</div>
                                                            </div>
                                                            <StatusBadge tone={toneForWorkState(row.lifecycleState)}>{humanizeSlug(row.lifecycleState)}</StatusBadge>
                                                        </Link>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </section>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    <>
                        <search>
                            <form onSubmit={apply} aria-label="Filter correspondence" className="tcds-card flex flex-wrap items-end gap-2.5 p-3">
                                <div className="min-w-[14rem] flex-1">
                                    <label htmlFor={searchId} className="sr-only">Search correspondence</label>
                                    <div className="relative">
                                        <Search size={16} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-secondary)]" />
                                        <input
                                            id={searchId}
                                            type="search"
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            placeholder="Search reference, sender, or subject…"
                                            className="tcds-input pl-9"
                                        />
                                    </div>
                                </div>
                                <div className="w-full sm:w-44">
                                    <label htmlFor={lifecycleId} className="sr-only">Lifecycle state</label>
                                    <select id={lifecycleId} value={lifecycle} onChange={(e) => setLifecycle(e.target.value)} className="tcds-input">
                                        <option value="">All states</option>
                                        {filterOptions.lifecycles.map((state) => (
                                            <option key={state} value={state}>{humanizeSlug(state)}</option>
                                        ))}
                                    </select>
                                </div>
                                {filterOptions.classifications.length > 0 && (
                                    <div className="w-full sm:w-44">
                                        <label htmlFor={classificationId} className="sr-only">Classification</label>
                                        <select id={classificationId} value={classification} onChange={(e) => setClassification(e.target.value)} className="tcds-input">
                                            <option value="">All classifications</option>
                                            {filterOptions.classifications.map((val) => (
                                                <option key={val} value={val}>{humanizeSlug(val)}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                                {filterOptions.offices.length > 0 && (
                                    <div className="w-full sm:w-44">
                                        <label htmlFor={officeFieldId} className="sr-only">Office</label>
                                        <select id={officeFieldId} value={officeId} onChange={(e) => setOfficeId(e.target.value)} className="tcds-input">
                                            <option value="">All offices</option>
                                            {filterOptions.offices.map((office) => (
                                                <option key={office.id} value={String(office.id)}>
                                                    {office.short_name || office.code} — {office.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                                <div className="w-full sm:w-36">
                                    <label htmlFor={agingFieldId} className="sr-only">Aging</label>
                                    <select id={agingFieldId} value={aging} onChange={(e) => setAging(e.target.value)} className="tcds-input">
                                        <option value="">Any age</option>
                                        <option value="recent">Recent</option>
                                        <option value="aging">Aging</option>
                                        <option value="overdue">Overdue</option>
                                    </select>
                                </div>
                                <div className="flex flex-wrap items-center gap-3 px-1">
                                    <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 text-sm text-[var(--ink-primary)]">
                                        <input
                                            type="checkbox"
                                            checked={assignedToMe}
                                            onChange={(e) => setAssignedToMe(e.target.checked)}
                                            className="h-4 w-4 accent-[var(--brand-primary)]"
                                        />
                                        <span>Assigned to me</span>
                                    </label>
                                    <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 text-sm text-[var(--ink-primary)]">
                                        <input
                                            type="checkbox"
                                            checked={actionRequired}
                                            onChange={(e) => setActionRequired(e.target.checked)}
                                            className="h-4 w-4 accent-[var(--brand-primary)]"
                                        />
                                        <span>Action required</span>
                                    </label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button type="submit" className="municipal-primary-button">Apply</button>
                                    {hasActiveFilters && (
                                        <button type="button" onClick={clear} className="municipal-secondary-button">
                                            <RotateCcw size={15} aria-hidden="true" />
                                            <span>Reset</span>
                                        </button>
                                    )}
                                </div>
                            </form>
                        </search>

                        {records.data.length === 0 ? (
                            <EmptyState
                                icon={<Inbox size={24} aria-hidden="true" />}
                                title="No matching correspondence"
                                description="Adjust your queue selection or search filter to view other records."
                                action={<button type="button" onClick={clear} className="municipal-secondary-button">Clear filters</button>}
                            />
                        ) : (
                            <div tabIndex={0} role="region" aria-label="Correspondence register" className="tcds-table-region">
                                <table className="tcds-table" data-stack-mobile="true">
                                    <thead>
                                        <tr>
                                            <th scope="col">Reference &amp; Subject</th>
                                            <th scope="col">Sender</th>
                                            <th scope="col">Received</th>
                                            <th scope="col">State</th>
                                            <th scope="col" className="text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {records.data.map((record) => (
                                            <tr key={record.publicId}>
                                                <th scope="row" className="max-w-md font-normal">
                                                    <div className="font-mono text-xs font-bold text-[var(--brand-ink)]">
                                                        {record.reference}
                                                    </div>
                                                    <Link href={detailHref(record.publicId)} className="mt-0.5 block text-sm font-semibold text-[var(--ink-primary)] hover:underline">
                                                        {record.subject}
                                                    </Link>
                                                </th>
                                                <td data-label="Sender" className="text-sm text-[var(--ink-primary)]">{record.sender.name}</td>
                                                <td data-label="Received" className="whitespace-nowrap text-sm text-[var(--ink-secondary)]">
                                                    {formatDatePH(record.receivedAt)}
                                                </td>
                                                <td data-label="State">
                                                    <div className="flex flex-wrap gap-1.5">
                                                        <StatusBadge tone={toneForWorkState(record.lifecycleState)}>{humanizeSlug(record.lifecycleState)}</StatusBadge>
                                                        {record.overdue && <StatusBadge tone="danger">Overdue</StatusBadge>}
                                                    </div>
                                                </td>
                                                <td data-label="Action" className="text-right">
                                                    <Link
                                                        href={detailHref(record.publicId)}
                                                        aria-label={`Open correspondence ${record.reference}`}
                                                        className="inline-flex min-h-11 items-center gap-1 rounded-lg border border-[var(--border-control)] bg-[var(--surface-card)] px-3 py-1.5 text-sm font-semibold text-[var(--ink-primary)] hover:border-[var(--brand-primary)] hover:bg-[var(--brand-soft)]"
                                                    >
                                                        <span>Open</span>
                                                        <ArrowRight size={14} aria-hidden="true" />
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}
            </div>
        </AppLayout>
    );
}
