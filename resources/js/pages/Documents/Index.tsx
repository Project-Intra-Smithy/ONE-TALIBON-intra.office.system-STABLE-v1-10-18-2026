import '../../../css/tcds-document-register.css';
import { buildPortalNavigation } from '../../navigation/portalNavigation';
import type { SharedProps } from '../../types';
import { relatedWorkspaceKeys } from '../../components/documents/documentCenterPresentation';
import { Link, router, usePage } from '@inertiajs/react';
import { ArrowRight, FileArchive, FileText, Folder, LibraryBig, RotateCcw, Search } from 'lucide-react';
import { type FormEvent, useEffect, useId, useState } from 'react';
import DocumentArchive, { type ArchiveWorkspace } from '../../components/documents/DocumentArchive';
import type { DocumentCenterProps, DocumentFilters } from '../../components/documents/documentCenterPresentation';
import { Dialog, EmptyState, PageHeader, StatusBadge, toneForWorkState } from '../../components/ui';
import AppLayout from '../../layouts/AppLayout';
import { formatDatePH, humanizeSlug } from '../../lib/format';

type Props = DocumentCenterProps & {
    mode: 'files' | 'records';
    archive: ArchiveWorkspace;
};

export default function DocumentCenter({ records, filters, filterOptions, mode, archive }: Props) {
    const [draft, setDraft] = useState(filters);
    const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
    const selectedRecord = records.data.find(record => record.detailUrl === selectedUrl) ?? null;
    const { workspaceExperience, permissions } = usePage<SharedProps>().props;
    const available = buildPortalNavigation(workspaceExperience, permissions.navigation).flatMap(group => group.items);
    const workspaces = [...relatedWorkspaceKeys, 'correspondence' as const].flatMap(key => {
        const destination = available.find(item => item.key === key);
        return destination ? [destination] : [];
    });
    const pageHref = (href: string) => {
        const params = new URL(href, 'http://portal.local').searchParams;
        params.set('mode', 'records');
        return '/documents?' + params.toString();
    };
    const searchId = useId();
    const officeId = useId();
    const statusId = useId();

    useEffect(() => {
        setDraft(filters);
        setSelectedUrl(null);
    }, [filters, mode]);

    const navigate = (next: DocumentFilters) => {
        setDraft(next);
        setSelectedUrl(null);
        router.get('/documents', { mode: 'records', ...next }, { preserveState: true, preserveScroll: true });
    };

    const submit = (event: FormEvent) => {
        event.preventDefault();
        navigate(draft);
    };

    const reset = () =>
        navigate({ search: '', record_type: 'all', state: '', office_id: null, date_from: '', date_to: '' });

    const changeCollection = (record_type: string) => navigate({ ...draft, record_type, state: '' });
    const hasFilters = Boolean(draft.search || draft.state || draft.office_id || draft.date_from || draft.date_to || (draft.record_type && draft.record_type !== 'all'));

    return (
        <AppLayout title="Document Center">
            <div className="mx-auto max-w-[1440px] space-y-4 px-4 py-5 sm:px-6">
                <PageHeader
                    title="Document Center"
                    subtitle="Browse authorized municipal records by category, office, and status."
                    actions={
                        <nav aria-label="Document Center mode" className="inline-flex rounded-lg border border-[var(--border-default)] bg-[var(--surface-recessed)] p-1">
                            <Link
                                href="/documents?mode=records"
                                aria-current={mode === 'records' ? 'page' : undefined}
                                className={`inline-flex min-h-10 items-center gap-1.5 rounded-md px-3 text-sm font-semibold transition-colors ${
                                    mode === 'records'
                                        ? 'bg-[var(--brand-primary)] text-white'
                                        : 'text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]'
                                }`}
                            >
                                <LibraryBig size={15} aria-hidden="true" />
                                <span>Records Register</span>
                            </Link>
                            <Link
                                href="/documents?mode=files"
                                aria-current={mode === 'files' ? 'page' : undefined}
                                className={`inline-flex min-h-10 items-center gap-1.5 rounded-md px-3 text-sm font-semibold transition-colors ${
                                    mode === 'files'
                                        ? 'bg-[var(--brand-primary)] text-white'
                                        : 'text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]'
                                }`}
                            >
                                <FileArchive size={15} aria-hidden="true" />
                                <span>Attached Files</span>
                            </Link>
                        </nav>
                    }
                />

                {mode === 'files' ? (
                    <DocumentArchive archive={archive} />
                ) : (
                    <div className="space-y-4">
                        {/* Compact horizontal category bar — keeps full desktop width for Records Register table */}
                        <nav aria-label="Document categories" className="tcds-card p-2.5">
                            <ul className="flex flex-wrap items-center gap-1.5">
                                {filterOptions.recordTypes.map((type) => {
                                    const active = (filters.record_type || 'all') === type.value;
                                    const label = type.value === 'all' ? 'All Records' : humanizeSlug(type.label || type.value);
                                    return (
                                        <li key={type.value}>
                                            <button
                                                type="button"
                                                aria-pressed={active}
                                                onClick={() => changeCollection(type.value)}
                                                className={`inline-flex min-h-10 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                                                    active
                                                        ? 'border-[var(--brand-primary)] bg-[var(--brand-soft)] text-[var(--brand-ink)]'
                                                        : 'border-transparent text-[var(--ink-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--ink-primary)]'
                                                }`}
                                            >
                                                <Folder size={14} aria-hidden="true" className="shrink-0" />
                                                <span>{label}</span>
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        </nav>

                        {/* Main Document Register */}
                        <div className="min-w-0 space-y-4">
                            <search>
                                <form onSubmit={submit} aria-label="Search documents" className="tcds-card flex flex-wrap items-end gap-2.5 p-3">
                                    <div className="min-w-[14rem] flex-1">
                                        <label htmlFor={searchId} className="sr-only">Search authorized records</label>
                                        <div className="relative">
                                            <Search size={16} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-secondary)]" />
                                            <input
                                                id={searchId}
                                                type="search"
                                                value={draft.search}
                                                onChange={(e) => setDraft({ ...draft, search: e.target.value })}
                                                placeholder="Search reference, title…"
                                                className="tcds-input pl-9"
                                            />
                                        </div>
                                    </div>

                                    {filterOptions.offices.length > 1 && (
                                        <div className="w-full sm:w-44">
                                            <label htmlFor={officeId} className="sr-only">Office</label>
                                            <select
                                                id={officeId}
                                                value={draft.office_id ?? ''}
                                                onChange={(e) => setDraft({ ...draft, office_id: e.target.value ? Number(e.target.value) : null })}
                                                className="tcds-input"
                                            >
                                                <option value="">All offices</option>
                                                {filterOptions.offices.map((office) => (
                                                    <option key={office.id ?? office.code} value={office.id}>
                                                        {office.shortName || office.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    <div className="w-full sm:w-44">
                                        <label htmlFor={statusId} className="sr-only">Status</label>
                                        <select
                                            id={statusId}
                                            value={draft.state}
                                            onChange={(e) => setDraft({ ...draft, state: e.target.value })}
                                            className="tcds-input"
                                        >
                                            <option value="">Status: All</option>
                                            {filterOptions.states.map((state) => (
                                                <option key={state.value} value={state.value}>
                                                    {state.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <label className="text-xs font-semibold text-[var(--ink-secondary)]">From date
                                        <input aria-label="From date" type="date" className="tcds-input" value={draft.date_from} onChange={event => setDraft({ ...draft, date_from: event.target.value })} />
                                    </label>
                                    <label className="text-xs font-semibold text-[var(--ink-secondary)]">To date
                                        <input aria-label="To date" type="date" className="tcds-input" value={draft.date_to} onChange={event => setDraft({ ...draft, date_to: event.target.value })} />
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <button type="submit" className="municipal-primary-button">Search</button>
                                        {hasFilters && (
                                            <button type="button" onClick={reset} className="municipal-secondary-button">
                                                <RotateCcw size={15} aria-hidden="true" />
                                                <span>Reset</span>
                                            </button>
                                        )}
                                    </div>
                                </form>
                            </search>

                            {records.data.length === 0 ? (
                                <EmptyState
                                    icon={<FileText size={24} aria-hidden="true" />}
                                    title="No matching documents"
                                    description="Try adjusting your category selection or search criteria."
                                    action={
                                        <button type="button" onClick={reset} className="municipal-secondary-button">
                                            Show all records
                                        </button>
                                    }
                                />
                            ) : (
                                <section aria-labelledby="doc-register-heading">
                                    <div className="mb-2 flex items-center justify-between px-1 text-xs font-medium text-[var(--ink-secondary)]">
                                        <h2 id="doc-register-heading" className="text-sm font-bold text-[var(--ink-primary)]">
                                            {filters.record_type && filters.record_type !== 'all' ? humanizeSlug(filters.record_type) : 'All Authorized Records'}
                                        </h2>
                                        <span>{records.total} document{records.total === 1 ? '' : 's'}</span>
                                    </div>

                                    <div tabIndex={0} role="region" aria-labelledby="doc-register-heading" className="tcds-table-region document-register">
                                        <table className="tcds-table" data-stack-mobile="true">
                                            <thead>
                                                <tr>
                                                    <th scope="col" className="!px-3">Reference &amp; Title</th>
                                                    <th scope="col" className="!px-3">Category</th>
                                                    <th scope="col" className="!px-3">Office</th>
                                                    <th scope="col" className="!px-3">Status</th>
                                                    <th scope="col" className="!px-3">Updated</th>
                                                    <th scope="col" className="!px-3 text-right">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {records.data.map((doc) => (
                                                    <tr key={doc.reference}>
                                                        <th scope="row" className="max-w-md !px-3 font-normal">
                                                            <div className="font-mono text-xs font-bold text-[var(--brand-ink)]">
                                                                {doc.reference}
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => setSelectedUrl(doc.detailUrl)}
                                                                className="mt-0.5 text-left text-sm font-semibold text-[var(--ink-primary)] hover:text-[var(--brand-ink)] hover:underline"
                                                            >
                                                                {doc.title}
                                                            </button>
                                                        </th>
                                                        <td data-label="Category" className="!px-3">
                                                            <StatusBadge tone="neutral">{humanizeSlug(doc.recordType)}</StatusBadge>
                                                        </td>
                                                        <td data-label="Office" className="!px-3 whitespace-nowrap text-xs font-semibold text-[var(--ink-secondary)]">
                                                            {doc.currentOffice?.shortName || doc.currentOffice?.name || '—'}
                                                        </td>
                                                        <td data-label="Status" className="!px-3">
                                                            <StatusBadge tone={toneForWorkState(doc.state)}>
                                                                {humanizeSlug(doc.state)}
                                                            </StatusBadge>
                                                        </td>
                                                        <td data-label="Updated" className="!px-3 whitespace-nowrap text-xs text-[var(--ink-secondary)]">
                                                            {formatDatePH(doc.updatedAt)}
                                                        </td>
                                                        <td data-label="Action" className="!px-3 text-right">
                                                            <button
                                                                type="button"
                                                                onClick={() => setSelectedUrl(doc.detailUrl)}
                                                                className="inline-flex min-h-10 items-center gap-1 whitespace-nowrap rounded-lg border border-[var(--border-control)] bg-[var(--surface-card)] px-2.5 py-1.5 text-xs font-semibold text-[var(--ink-primary)] hover:border-[var(--brand-primary)] hover:bg-[var(--brand-soft)]"
                                                            >
                                                                <span>Inspect</span>
                                                                <ArrowRight size={14} aria-hidden="true" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <nav aria-label="Document pages" className="mt-3 flex items-center justify-between gap-3 text-sm">
                                        {records.prev_page_url ? <Link href={pageHref(records.prev_page_url)} className="municipal-secondary-button">Previous</Link> : <span />}
                                        <span>Page {records.current_page} of {records.last_page}</span>
                                        {records.next_page_url ? <Link href={pageHref(records.next_page_url)} className="municipal-secondary-button">Next</Link> : <span />}
                                    </nav>
                                </section>
                            )}
                        </div>
                    </div>
                )}

                <nav aria-label="Related authorized workspaces" className="flex flex-wrap gap-2">
                    {workspaces.map(item => <Link key={item.key} href={item.href} className="municipal-secondary-button">{item.label}</Link>)}
                </nav>
                {/* Native slide-over detail drawer for inspecting record metadata */}
                <Dialog
                    open={Boolean(selectedRecord)}
                    onClose={() => setSelectedUrl(null)}
                    title={selectedRecord?.title || 'Document Details'}
                    description={selectedRecord?.reference ?? undefined}
                    variant="drawer-right"
                    footer={
                        selectedRecord?.detailUrl ? (
                            <Link href={selectedRecord.detailUrl} className="municipal-primary-button">
                                <span>Open full record</span>
                                <ArrowRight size={15} aria-hidden="true" />
                            </Link>
                        ) : undefined
                    }
                >
                    {selectedRecord && (
                        <dl className="divide-y divide-[var(--border-default)] text-sm">
                            <div className="flex justify-between gap-4 py-3">
                                <dt className="font-semibold text-[var(--ink-secondary)]">Category</dt>
                                <dd className="font-medium text-[var(--ink-primary)]">{humanizeSlug(selectedRecord.recordType)}</dd>
                            </div>
                            <div className="flex justify-between gap-4 py-3">
                                <dt className="font-semibold text-[var(--ink-secondary)]">Status</dt>
                                <dd>
                                    <StatusBadge tone={toneForWorkState(selectedRecord.state)}>
                                        {humanizeSlug(selectedRecord.state)}
                                    </StatusBadge>
                                </dd>
                            </div>
                            <div className="flex justify-between gap-4 py-3">
                                <dt className="font-semibold text-[var(--ink-secondary)]">Classification</dt>
                                <dd className="font-medium text-[var(--ink-primary)]">{humanizeSlug(selectedRecord.classification)}</dd>
                            </div>
                            <div className="flex justify-between gap-4 py-3">
                                <dt className="font-semibold text-[var(--ink-secondary)]">Origin Office</dt>
                                <dd className="font-medium text-[var(--ink-primary)]">{selectedRecord.originOffice?.name || '—'}</dd>
                            </div>
                            <div className="flex justify-between gap-4 py-3">
                                <dt className="font-semibold text-[var(--ink-secondary)]">Source</dt>
                                <dd className="font-medium text-[var(--ink-primary)]">{selectedRecord.source}</dd>
                            </div>
                            <div className="flex justify-between gap-4 py-3">
                                <dt className="font-semibold text-[var(--ink-secondary)]">Responsible person</dt>
                                <dd className="font-medium text-[var(--ink-primary)]">{selectedRecord.assignedEmployee?.name || '—'}</dd>
                            </div>
                            <div className="flex justify-between gap-4 py-3">
                                <dt className="font-semibold text-[var(--ink-secondary)]">Record Date</dt>
                                <dd className="font-medium text-[var(--ink-primary)]">{formatDatePH(selectedRecord.recordDate)}</dd>
                            </div>
                            <div className="flex justify-between gap-4 py-3">
                                <dt className="font-semibold text-[var(--ink-secondary)]">Last Updated</dt>
                                <dd className="font-medium text-[var(--ink-primary)]">{formatDatePH(selectedRecord.updatedAt)}</dd>
                            </div>
                        </dl>
                    )}
                </Dialog>
            </div>
        </AppLayout>
    );
}
