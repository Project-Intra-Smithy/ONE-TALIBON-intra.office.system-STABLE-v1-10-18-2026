import '../../../css/document-center.css';
import { Link, router, usePage } from '@inertiajs/react';
import { FileArchive, LibraryBig } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import PageFrame from '../../components/PageFrame';
import PageHeader from '../../components/PageHeader';
import PortalSearchField from '../../components/portal/PortalSearchField';
import DocumentCollectionNav from '../../components/documents/DocumentCollectionNav';
import DocumentRegister from '../../components/documents/DocumentRegister';
import DocumentMetadataPanel from '../../components/documents/DocumentMetadataPanel';
import DocumentArchive, { type ArchiveWorkspace } from '../../components/documents/DocumentArchive';
import { collectionLabels, relatedWorkspaceKeys, type DocumentCenterProps, type DocumentFilters } from '../../components/documents/documentCenterPresentation';
import { recordDateError, recordFiltersQuery, recordPaginationHref } from '../../components/documents/documentCenterNavigation';
import AppLayout from '../../layouts/AppLayout';
import { buildPortalNavigation } from '../../navigation/portalNavigation';
import type { SharedProps } from '../../types';

type Props = DocumentCenterProps & { mode: 'files' | 'records'; archive: ArchiveWorkspace };

const tabClass = (active: boolean): string => [
    'inline-flex min-h-11 items-center gap-2 rounded-md px-4 text-xs font-bold',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--municipal-focus)]',
    active ? 'bg-[var(--municipal-brand)] text-white' : 'text-[var(--municipal-text)] hover:bg-[var(--municipal-hover)]',
].join(' ');

export default function DocumentCenter({ records, filters, filterOptions, mode, archive }: Props) {
    const { workspaceExperience, permissions } = usePage<SharedProps>().props;
    const available = buildPortalNavigation(workspaceExperience, permissions.navigation).flatMap((group) => group.items);
    const workspaces = [...relatedWorkspaceKeys, 'correspondence' as const].flatMap((key) => {
        const destination = available.find((item) => item.key === key);
        return destination ? [destination] : [];
    });

    const [draft, setDraft] = useState<DocumentFilters>(filters);
    const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const selected = records.data.find((record) => record.detailUrl === selectedUrl) ?? null;

    useEffect(() => {
        setDraft(filters);
        setSelectedUrl(null);
    }, [filters]);

    const navigate = (next: DocumentFilters) => {
        const invalid = recordDateError(next);
        if (invalid) { setError(invalid); return; }
        setDraft(next);
        setError(null);
        setSelectedUrl(null);
        router.get('/documents', recordFiltersQuery(next), {
            preserveState: true,
            preserveScroll: true,
            replace: true,
            onStart: () => setLoading(true),
            onError: () => setError('Records could not be loaded. Your current results have been retained. Retry the search.'),
            onFinish: () => setLoading(false),
        });
    };

    const changePage = (href: string) => {
        setError(null);
        setSelectedUrl(null);
        router.visit(recordPaginationHref(href), {
            preserveState: true,
            preserveScroll: true,
            onStart: () => setLoading(true),
            onError: () => setError('The requested records page could not be loaded.'),
            onFinish: () => setLoading(false),
        });
    };

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!loading) navigate(draft);
    };
    const reset = () => navigate({ search: '', record_type: 'all', state: '', office_id: null, date_from: '', date_to: '' });
    const changeCollection = (record_type: string) => navigate({ ...filters, record_type, state: '' });
    const activeFilters = [
        filters.search ? 'Search: ' + filters.search : '',
        filters.office_id ? 'Office: ' + (filterOptions.offices.find((office) => office.id === filters.office_id)?.shortName || filterOptions.offices.find((office) => office.id === filters.office_id)?.name || 'Selected office') : '',
        filters.state ? 'Status: ' + (filterOptions.states.find((state) => state.value === filters.state)?.label || filters.state) : '',
        filters.date_from ? 'From: ' + filters.date_from : '',
        filters.date_to ? 'To: ' + filters.date_to : '',
    ].filter(Boolean);

    return <AppLayout title="Document Center"><PageFrame width="wide" density="compact">
        <PageHeader
            eyebrow="Municipal records and linked files"
            title="Document Center"
            description="Search records you are permitted to view, inspect their metadata and find files associated with authorized municipal work."
            icon={LibraryBig}
        />

        <nav className="municipal-panel flex w-fit max-w-full flex-wrap items-center gap-1 p-1" aria-label="Document Center views">
            <Link href="/documents?mode=records" aria-current={mode === 'records' ? 'page' : undefined} className={tabClass(mode === 'records')}>
                <LibraryBig size={16} aria-hidden="true" /> Records
            </Link>
            <Link href="/documents?mode=files" aria-current={mode === 'files' ? 'page' : undefined} className={tabClass(mode === 'files')}>
                <FileArchive size={16} aria-hidden="true" /> Files
            </Link>
        </nav>
        <p className="text-xs leading-relaxed text-[var(--municipal-muted)]">
            Records displays registered work and document references. Files displays an access-controlled catalog of linked attachments,
            not certified archival custody or a formal transfer to municipal archives.
        </p>

        {mode === 'files' ? <DocumentArchive archive={archive} /> : <div className="dc-workspace" aria-busy={loading}>
            <DocumentCollectionNav collections={filterOptions.recordTypes} current={filters.record_type} onSelect={changeCollection} workspaces={workspaces} />
            <div className="dc-main">
                <form onSubmit={submit} className="dc-toolbar" aria-label="Record search and filters">
                    <div className="dc-toolbar-row">
                        <PortalSearchField label="Search authorized records" placeholder="Search reference, title, office or person" maxLength={160} value={draft.search} onChange={(event) => setDraft({ ...draft, search: event.target.value })} onClear={draft.search ? () => setDraft({ ...draft, search: '' }) : undefined} />
                        <select aria-label="Office" className="municipal-field" value={draft.office_id ?? ''} onChange={(event) => setDraft({ ...draft, office_id: event.target.value ? Number(event.target.value) : null })}>
                            <option value="">All offices</option>
                            {filterOptions.offices.map((office) => <option key={office.id ?? office.code} value={office.id}>{office.shortName || office.name}</option>)}
                        </select>
                        <select aria-label="Status" className="municipal-field" value={draft.state} onChange={(event) => setDraft({ ...draft, state: event.target.value })}>
                            <option value="">All statuses</option>
                            {filterOptions.states.map((state) => <option key={state.value} value={state.value}>{state.label}</option>)}
                        </select>
                        <button type="submit" disabled={loading} className="municipal-action municipal-action--primary">Search</button>
                        <button type="button" onClick={reset} disabled={loading} className="municipal-action municipal-action--quiet">Reset</button>
                    </div>
                    <details className="dc-filters">
                        <summary>Filters{activeFilters.length ? ' / ' + activeFilters.length + ' applied' : ''}</summary>
                        <div className="dc-date-filters">
                            <label>From date<input type="date" className="municipal-field" value={draft.date_from} onChange={(event) => setDraft({ ...draft, date_from: event.target.value })} /></label>
                            <label>To date<input type="date" className="municipal-field" value={draft.date_to} min={draft.date_from || undefined} onChange={(event) => setDraft({ ...draft, date_to: event.target.value })} /></label>
                            <button type="submit" disabled={loading} className="municipal-action municipal-action--primary">Apply</button>
                        </div>
                        <p className="dc-filter-help">Date range: correspondence received dates; transaction receipt or creation dates; travel-order travel periods. Travel orders display issued dates.</p>
                        {activeFilters.length > 0 && <p className="dc-filter-help">Applied: {activeFilters.join(' / ')}</p>}
                    </details>
                </form>
                <div role="status" aria-live="polite" className="min-h-5 py-1 text-xs text-[var(--municipal-muted)]">
                    {loading ? 'Loading authorized records…' : records.total + ' authorized record' + (records.total === 1 ? '' : 's') + ' found'}
                </div>
                {error && <div role="alert" className="mb-2 rounded-md border border-[var(--municipal-border)] p-3 text-xs text-[var(--municipal-text)]">{error} <button type="button" onClick={() => navigate(draft)} className="ml-2 font-bold text-[var(--municipal-brand)]">Retry</button></div>}
                <div className="dc-context"><span>{collectionLabels[filters.record_type] || 'Authorized records'}</span><span>Newest record dates first</span></div>
                <div className="dc-register-group">
                    <div className="min-w-0 space-y-3">
                        <DocumentRegister records={records.data} total={records.total} selectedUrl={selected?.detailUrl || null} onSelect={(record) => setSelectedUrl(record?.detailUrl || null)} />
                        {records.last_page > 1 && <nav aria-label="Record pages" className="flex flex-wrap items-center justify-between gap-2 text-xs">
                            <span>Page {records.current_page} of {records.last_page}</span>
                            <div className="flex flex-wrap gap-2">
                                {records.prev_page_url && <button type="button" disabled={loading} onClick={() => changePage(records.prev_page_url!)} className="municipal-action municipal-action--secondary">Previous</button>}
                                {records.next_page_url && <button type="button" disabled={loading} onClick={() => changePage(records.next_page_url!)} className="municipal-action municipal-action--secondary">Next</button>}
                            </div>
                        </nav>}
                    </div>
                    {records.data.length > 0 && <div className="dc-below-metadata"><DocumentMetadataPanel record={selected} onClose={() => setSelectedUrl(null)} /></div>}
                </div>
            </div>
        </div>}
    </PageFrame></AppLayout>;
}
