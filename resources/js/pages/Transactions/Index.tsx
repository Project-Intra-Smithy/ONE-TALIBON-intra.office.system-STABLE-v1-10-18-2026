import { Link, router, usePage } from '@inertiajs/react';
import { ArrowRight, FileText, Plus, RotateCcw, Search } from 'lucide-react';
import { type FormEvent, useEffect, useId, useState } from 'react';
import StaffWorkloadTable from '../../components/work-queue/StaffWorkloadTable';
import type { Filters, Office, Paginator, ScopeGroup, StaffWorkload } from '../../components/work-queue/types';
import { EmptyState, PageHeader, StatusBadge, toneForWorkState } from '../../components/ui';
import AppLayout from '../../layouts/AppLayout';
import { formatDatePH, humanizeSlug } from '../../lib/format';
import { withReturnContext } from '../../navigation/returnContext';

type Props = {
    records: Paginator;
    filters: Filters;
    scopeGroups: ScopeGroup[];
    filterOptions: { statuses: string[]; priorities: string[]; offices: Office[] };
    experience: {
        profile: string;
        department: { id: number; code: string; name: string; shortName?: string | null };
        hasOfficeScope: boolean;
    };
    staffWorkload: StaffWorkload[];
    originDeliveryQueueAvailable?: boolean;
};

export default function Index({ records, filters, scopeGroups, filterOptions, experience, staffWorkload, originDeliveryQueueAvailable = false }: Props) {
    const page = usePage();
    const currentView = filters.view || 'all';
    const [search, setSearch] = useState(filters.search);
    const [status, setStatus] = useState(filters.status);
    const [priority, setPriority] = useState(filters.priority);
    const [officeId, setOfficeId] = useState(filters.office_id ? String(filters.office_id) : '');

    const searchId = useId();
    const statusId = useId();
    const priorityId = useId();
    const officeSelectId = useId();

    const allQueues = scopeGroups.flatMap((group) => group.views);
    const currentQueue = allQueues.find((view) => view.key === currentView);
    const currentTitle = currentQueue?.label || 'Work Requests';
    const hasActiveFilters = Boolean(search || status || priority || officeId);

    useEffect(() => {
        setSearch(filters.search);
        setStatus(filters.status);
        setPriority(filters.priority);
        setOfficeId(filters.office_id ? String(filters.office_id) : '');
    }, [filters.search, filters.status, filters.priority, filters.office_id]);

    const queryData = (overrides: Partial<Filters> = {}) => {
        const next = {
            view: overrides.view ?? currentView,
            search: overrides.search ?? search,
            status: overrides.status ?? status,
            priority: overrides.priority ?? priority,
            office_id: overrides.office_id ?? (officeId ? Number(officeId) : null),
        };
        return Object.fromEntries(
            Object.entries(next).filter(([, value]) => value !== '' && value !== null && value !== undefined),
        );
    };

    const applyFilters = (event: FormEvent) => {
        event.preventDefault();
        router.get('/transactions', queryData(), { preserveState: true, preserveScroll: true, replace: true });
    };

    const selectView = (view: string) => {
        router.get('/transactions', queryData({ view }), { preserveState: true, preserveScroll: true, replace: true });
    };

    const clearFilters = () => {
        setSearch('');
        setStatus('');
        setPriority('');
        setOfficeId('');
        router.get('/transactions', { view: currentView }, { preserveState: true, preserveScroll: true, replace: true });
    };

    return (
        <AppLayout title="Work Requests">
            <div className="mx-auto max-w-[1440px] space-y-4 px-4 py-5 sm:px-6">
                {/* Compact single-row PageHeader */}
                <PageHeader
                    title="Work Requests"
                    subtitle={`${experience.department.shortName || experience.department.name} · ${experience.hasOfficeScope ? 'Office & personal queues' : 'Personal queues'}`}
                    actions={
                        <div className="flex flex-wrap items-center gap-2">
                            <Link href="/transactions/create" className="municipal-primary-button">
                                <Plus size={16} aria-hidden="true" />
                                <span>New Work Request</span>
                            </Link>
                            {originDeliveryQueueAvailable && (
                                <Link href="/work-requests/origin-delivery-exceptions" className="municipal-secondary-button">
                                    Origin notice exceptions
                                </Link>
                            )}
                        </div>
                    }
                />

                {/* Horizontal scrollable tabs on phone; single-row wrap on sm+ */}
                <nav
                    aria-label="Work Request queues"
                    className="flex flex-nowrap items-center gap-1.5 overflow-x-auto border-b border-[var(--border-default)] pb-2.5 sm:flex-wrap sm:overflow-visible"
                >
                    {allQueues.map((view) => {
                        const active = currentView === view.key;
                        const pillTone = view.key === 'overdue'
                            ? 'bg-[var(--status-danger-bg)] text-[var(--status-danger-fg)]'
                            : view.key === 'needs_action'
                                ? 'bg-[var(--status-warn-bg)] text-[var(--status-warn-fg)]'
                                : active
                                    ? 'bg-[var(--brand-primary)] text-white'
                                    : 'bg-[var(--surface-recessed)] text-[var(--ink-secondary)]';
                        return (
                            <button
                                key={view.key}
                                type="button"
                                aria-pressed={active}
                                onFocus={(event) => event.currentTarget.scrollIntoView({ block: 'nearest', inline: 'nearest' })}
                                onClick={() => selectView(view.key)}
                                className={`inline-flex min-h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
                                    active
                                        ? 'border-[var(--brand-primary)] bg-[var(--brand-soft)] text-[var(--ink-primary)]'
                                        : 'border-transparent bg-transparent text-[var(--ink-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--ink-primary)]'
                                }`}
                            >
                                <span>{view.label}</span>
                                <span className={`rounded-full px-2 py-0.5 text-xs font-bold [font-variant-numeric:tabular-nums] ${pillTone}`}>
                                    {view.count}
                                </span>
                            </button>
                        );
                    })}
                </nav>

                {/* Compact single-row filter bar */}
                <search>
                    <form
                        onSubmit={applyFilters}
                        aria-label="Filter Work Requests"
                        className="tcds-card flex flex-wrap items-end gap-2.5 p-3"
                    >
                        <div className="min-w-[14rem] flex-1">
                            <label htmlFor={searchId} className="sr-only">
                                Filter by reference, subject, office, or assignee
                            </label>
                            <div className="relative">
                                <Search
                                    size={16}
                                    aria-hidden="true"
                                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-secondary)]"
                                />
                                <input
                                    id={searchId}
                                    type="search"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Filter by ID, subject, assignee…"
                                    className="tcds-input pl-9"
                                />
                            </div>
                        </div>

                        <div className="w-full sm:w-44">
                            <label htmlFor={statusId} className="sr-only">Status</label>
                            <select
                                id={statusId}
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className="tcds-input"
                            >
                                <option value="">Status: All</option>
                                {filterOptions.statuses.map((val) => (
                                    <option key={val} value={val}>{humanizeSlug(val)}</option>
                                ))}
                            </select>
                        </div>

                        <div className="w-full sm:w-40">
                            <label htmlFor={priorityId} className="sr-only">Priority</label>
                            <select
                                id={priorityId}
                                value={priority}
                                onChange={(e) => setPriority(e.target.value)}
                                className="tcds-input"
                            >
                                <option value="">Priority: All</option>
                                {filterOptions.priorities.map((val) => (
                                    <option key={val} value={val}>{humanizeSlug(val)}</option>
                                ))}
                            </select>
                        </div>

                        {filterOptions.offices.length > 1 && (
                            <div className="w-full sm:w-44">
                                <label htmlFor={officeSelectId} className="sr-only">Office</label>
                                <select
                                    id={officeSelectId}
                                    value={officeId}
                                    onChange={(e) => setOfficeId(e.target.value)}
                                    className="tcds-input"
                                >
                                    <option value="">Office: All</option>
                                    {filterOptions.offices.map((office) => (
                                        <option key={office.id} value={office.id}>{office.shortName || office.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="flex items-center gap-2">
                            <button type="submit" className="municipal-primary-button">
                                Apply
                            </button>
                            {hasActiveFilters && (
                                <button type="button" onClick={clearFilters} className="municipal-secondary-button">
                                    <RotateCcw size={15} aria-hidden="true" />
                                    <span>Reset</span>
                                </button>
                            )}
                        </div>
                    </form>
                </search>

                {/* Live operational register visible above the fold */}
                {currentView === 'staff_workload' ? (
                    <StaffWorkloadTable rows={staffWorkload} />
                ) : records.data.length === 0 ? (
                    <EmptyState
                        icon={<FileText size={24} aria-hidden="true" />}
                        title={`No items in ${currentTitle}`}
                        description={
                            hasActiveFilters
                                ? 'No work requests match your current search or filter settings.'
                                : 'There are currently no work requests queued in this view.'
                        }
                        action={
                            hasActiveFilters ? (
                                <button type="button" onClick={clearFilters} className="municipal-secondary-button">
                                    Clear filters
                                </button>
                            ) : undefined
                        }
                    />
                ) : (
                    <section aria-labelledby="work-queue-caption">
                        <div className="mb-2 flex flex-wrap items-center justify-between gap-2 px-1 text-xs font-medium text-[var(--ink-secondary)]">
                            <h2 id="work-queue-caption" className="text-sm font-bold text-[var(--ink-primary)]">
                                {currentTitle}
                            </h2>
                            <span>
                                Showing {records.from ?? 1}–{records.to ?? records.data.length} of {records.total}
                            </span>
                        </div>

                        <div tabIndex={0} role="region" aria-labelledby="work-queue-caption" className="tcds-table-region">
                            <table className="tcds-table" data-stack-mobile="true">
                                <thead>
                                    <tr>
                                        <th scope="col">Reference &amp; Subject</th>
                                        <th scope="col">Office / Assignee</th>
                                        <th scope="col">Priority</th>
                                        <th scope="col">Due</th>
                                        <th scope="col">Status</th>
                                        <th scope="col" className="text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {records.data.map((item) => {
                                        const href = withReturnContext(`/transactions/${item.id}`, page.url, '/transactions');
                                        const isOverdue = item.dueState === 'overdue';
                                        return (
                                            <tr key={item.reference}>
                                                <th scope="row" className="max-w-xs font-normal xl:max-w-md">
                                                    <div className="font-mono text-xs font-bold text-[var(--brand-ink)]">
                                                        {item.reference}
                                                    </div>
                                                    <Link
                                                        href={href}
                                                        className="mt-0.5 block text-sm font-semibold leading-snug text-[var(--ink-primary)] hover:text-[var(--brand-primary)] hover:underline"
                                                    >
                                                        {item.title}
                                                    </Link>
                                                </th>
                                                <td data-label="Assignee" className="whitespace-nowrap">
                                                    <div className="min-w-0">
                                                        <div className="text-sm font-medium text-[var(--ink-primary)]">
                                                            {item.assignedEmployee?.name || 'Unassigned'}
                                                        </div>
                                                        <div className="text-xs text-[var(--ink-secondary)]">
                                                            {item.currentOffice?.shortName || item.currentOffice?.name || '—'}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td data-label="Priority" className="whitespace-nowrap">
                                                    <StatusBadge tone={toneForWorkState(item.priority)}>
                                                        {humanizeSlug(item.priority)}
                                                    </StatusBadge>
                                                </td>
                                                <td data-label="Due" className={`whitespace-nowrap text-xs font-medium xl:text-sm ${isOverdue ? 'font-bold text-[var(--status-danger-fg)]' : 'text-[var(--ink-secondary)]'}`}>
                                                    {isOverdue ? `Overdue · ${formatDatePH(item.dueAt, { month: 'short', day: 'numeric' })}` : formatDatePH(item.dueAt, { month: 'short', day: 'numeric' })}
                                                </td>
                                                <td data-label="Status" className="whitespace-nowrap">
                                                    <StatusBadge tone={toneForWorkState(item.status)}>
                                                        {humanizeSlug(item.status)}
                                                    </StatusBadge>
                                                </td>
                                                <td data-label="Action" className="whitespace-nowrap text-right">
                                                    <Link
                                                        href={href}
                                                        className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-[var(--border-control)] bg-[var(--surface-card)] px-2.5 py-1.5 text-xs font-semibold text-[var(--ink-primary)] transition-colors hover:border-[var(--brand-primary)] hover:bg-[var(--brand-soft)] xl:min-h-11 xl:px-3 xl:text-sm"
                                                    >
                                                        <span>{item.assignedEmployee ? 'Open' : 'Assign'}</span>
                                                        <ArrowRight size={14} aria-hidden="true" />
                                                    </Link>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </section>
                )}

            </div>
        </AppLayout>
    );
}
