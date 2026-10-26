import '../../../css/aj-document-workspace.css';
import '../../../css/document-center.css';
import '../../../css/r8-documents.css';
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
import AppLayout from '../../layouts/AppLayout';
import { buildPortalNavigation } from '../../navigation/portalNavigation';
import type { SharedProps } from '../../types';

type Props = DocumentCenterProps & {
    mode: 'files' | 'records';
    archive: ArchiveWorkspace;
};

export default function DocumentCenter({ records, filters, filterOptions, mode, archive }: Props) {
    const { workspaceExperience, permissions } = usePage<SharedProps>().props;
    const available = buildPortalNavigation(workspaceExperience, permissions.navigation).flatMap((group) => group.items);
    const workspaces = [...relatedWorkspaceKeys, 'correspondence' as const].flatMap((key) => {
        const destination = available.find((item) => item.key === key);
        return destination ? [destination] : [];
    });
    const [draft, setDraft] = useState(filters);
    const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
    const selected = records.data.find((record) => record.detailUrl === selectedUrl) || null;
    useEffect(() => { setDraft(filters); setSelectedUrl(null); }, [filters, mode]);
    const navigate = (next: DocumentFilters) => {
        setDraft(next);
        setSelectedUrl(null);
        router.get('/documents', { mode: 'records', ...next }, { preserveState: true, preserveScroll: true });
    };
    const submit = (event: FormEvent) => { event.preventDefault(); navigate(draft); };
    const reset = () => navigate({ search: '', record_type: 'all', state: '', office_id: null, date_from: '', date_to: '' });
    const changeCollection = (record_type: string) => navigate({ ...draft, record_type, state: '' });
    const pageHref = (href: string) => {
        const params = new URL(href, 'http://portal.local').searchParams;
        params.set('mode', 'records');
        return '/documents?' + params.toString();
    };
    const activeFilters = [
        filters.search ? 'Search: ' + filters.search : '',
        filters.office_id ? 'Office: ' + (filterOptions.offices.find((office) => office.id === filters.office_id)?.shortName || filterOptions.offices.find((office) => office.id === filters.office_id)?.name || 'Selected office') : '',
        filters.state ? 'Status: ' + (filterOptions.states.find((state) => state.value === filters.state)?.label || filters.state) : '',
        filters.date_from ? 'From: ' + filters.date_from : '',
        filters.date_to ? 'To: ' + filters.date_to : '',
    ].filter(Boolean);

    return <AppLayout title="Document Center"><PageFrame width="wide" density="comfortable" className="aj-documents">
        <PageHeader
            eyebrow="Organized municipal records"
            title="Document Center"
            description="Browse authorized municipal records by category, office, status and date. Attached files remain available as a secondary archive."
            icon={LibraryBig}
        />

        <nav className="r8-documents-modes municipal-panel flex w-fit items-center gap-1 p-1" aria-label="Document Center mode">
            <Link
                href="/documents?mode=records"
                aria-current={mode === 'records' ? 'page' : undefined}
                className={`inline-flex min-h-9 items-center gap-1.5 rounded-md px-3 text-xs font-bold ${mode === 'records' ? 'bg-[var(--municipal-brand)] text-white' : 'text-[var(--municipal-text)] hover:bg-[var(--municipal-hover)]'}`}
            >
                <LibraryBig size={14} aria-hidden="true" /> Archive Overview
            </Link>
            <Link
                href="/documents?mode=files"
                aria-current={mode === 'files' ? 'page' : undefined}
                className={`inline-flex min-h-9 items-center gap-1.5 rounded-md px-3 text-xs font-bold ${mode === 'files' ? 'bg-[var(--municipal-brand)] text-white' : 'text-[var(--municipal-text)] hover:bg-[var(--municipal-hover)]'}`}
            >
                <FileArchive size={14} aria-hidden="true" /> Attached Files
            </Link>
        </nav>

        {mode === 'files' ? <DocumentArchive archive={archive} /> : <div className="r8-documents dc-workspace">
            <DocumentCollectionNav collections={filterOptions.recordTypes} current={filters.record_type} onSelect={changeCollection} workspaces={workspaces} />
            <div className="dc-main">
                <form onSubmit={submit} className="dc-toolbar" aria-label="Document search and filters">
                    <div className="dc-toolbar-row"><PortalSearchField label="Search authorized records" placeholder="Search reference, title, office or person" maxLength={160} value={draft.search} onChange={(event) => setDraft({ ...draft, search: event.target.value })} onClear={draft.search ? () => setDraft({ ...draft, search: '' }) : undefined} />
                        <select aria-label="Office" className="municipal-field" value={draft.office_id ?? ''} onChange={(event) => setDraft({ ...draft, office_id: event.target.value ? Number(event.target.value) : null })}><option value="">All offices</option>{filterOptions.offices.map((office) => <option key={office.id ?? office.code} value={office.id}>{office.shortName || office.name}</option>)}</select>
                        <select aria-label="Status" className="municipal-field" value={draft.state} onChange={(event) => setDraft({ ...draft, state: event.target.value })}><option value="">All statuses</option>{filterOptions.states.map((state) => <option key={state.value} value={state.value}>{state.label}</option>)}</select>
                        <button type="submit" className="municipal-action municipal-action--primary">Search</button><button type="button" onClick={reset} className="municipal-action municipal-action--quiet">Reset</button>
                    </div>
                    <details className="dc-filters"><summary>Filters{activeFilters.length > 0 ? ' / ' + activeFilters.length + ' applied' : ''}</summary><div className="dc-date-filters"><label>From date<input type="date" className="municipal-field" value={draft.date_from} onChange={(event) => setDraft({ ...draft, date_from: event.target.value })} /></label><label>To date<input type="date" className="municipal-field" value={draft.date_to} onChange={(event) => setDraft({ ...draft, date_to: event.target.value })} /></label><button type="submit" className="municipal-action municipal-action--primary">Apply</button></div><p className="dc-filter-help">Date range: correspondence received dates; transaction received or creation dates; travel-order travel periods. Travel orders display issued dates.</p>{activeFilters.length > 0 && <p className="dc-filter-help">{activeFilters.join(' / ')}</p>}</details>
                </form>
                <div className="dc-context"><span>{collectionLabels[filters.record_type] || 'Authorized records'}</span><span>Newest record dates first</span></div>
                <div className="dc-register-group">
                    <div className="min-w-0 space-y-3">
                        <DocumentRegister records={records.data} total={records.total} selectedUrl={selected?.detailUrl || null} onSelect={(record) => setSelectedUrl(record?.detailUrl || null)} />
                        {records.last_page > 1 && <nav aria-label="Document pages" className="flex flex-wrap items-center justify-between gap-2 text-xs"><span>Page {records.current_page} of {records.last_page}</span><div className="flex flex-wrap gap-2">{records.prev_page_url && <Link href={pageHref(records.prev_page_url)} onClick={() => setSelectedUrl(null)} className="municipal-action municipal-action--secondary">Previous</Link>}{records.next_page_url && <Link href={pageHref(records.next_page_url)} onClick={() => setSelectedUrl(null)} className="municipal-action municipal-action--secondary">Next</Link>}</div></nav>}
                    </div>
                </div>
            </div>
            <div className="r8-documents-details" aria-live="polite"><DocumentMetadataPanel record={selected} onClose={() => setSelectedUrl(null)} /></div>
        </div>}
    </PageFrame></AppLayout>;
}
