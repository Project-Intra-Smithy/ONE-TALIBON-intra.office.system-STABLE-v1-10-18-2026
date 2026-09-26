import { Link, router, usePage } from '@inertiajs/react';
import { FileText } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import PageFrame from '../../components/PageFrame';
import PageHeader from '../../components/PageHeader';
import ProgressiveFilterBar from '../../components/filters/ProgressiveFilterBar';
import PortalSearchField from '../../components/portal/PortalSearchField';
import DocumentCollectionNav from '../../components/documents/DocumentCollectionNav';
import DocumentRegister from '../../components/documents/DocumentRegister';
import DocumentMetadataPanel from '../../components/documents/DocumentMetadataPanel';
import { collectionLabels, relatedWorkspaceKeys, type DocumentCenterProps, type DocumentFilters } from '../../components/documents/documentCenterPresentation';
import AppLayout from '../../layouts/AppLayout';
import { buildPortalNavigation } from '../../navigation/portalNavigation';
import type { SharedProps } from '../../types';

export default function DocumentCenter({ records, filters, filterOptions }: DocumentCenterProps) {
    const { workspaceExperience, permissions } = usePage<SharedProps>().props;
    const available = buildPortalNavigation(workspaceExperience, permissions.navigation).flatMap((group) => group.items);
    const workspaces = relatedWorkspaceKeys.flatMap((key) => {
        const destination = available.find((item) => item.key === key);
        return destination ? [destination] : [];
    });
    const [draft, setDraft] = useState(filters);
    const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
    const selected = records.data.find((record) => record.detailUrl === selectedUrl) || null;
    useEffect(() => { setDraft(filters); setSelectedUrl(null); }, [filters]);
    const navigate = (next: DocumentFilters) => {
        setDraft(next);
        setSelectedUrl(null);
        router.get('/documents', { ...next }, { preserveState: true, preserveScroll: true });
    };
    const submit = (event: FormEvent) => { event.preventDefault(); navigate(draft); };
    const reset = () => navigate({ search: '', record_type: 'all', state: '', office_id: null, date_from: '', date_to: '' });
    const changeCollection = (record_type: string) => navigate({ ...draft, record_type, state: '' });
    const pageHref = (href: string) => '/documents' + new URL(href, 'http://portal.local').search;
    const activeFilters = [
        filters.search ? 'Search: ' + filters.search : '',
        filters.office_id ? 'Office: ' + (filterOptions.offices.find((office) => office.id === filters.office_id)?.shortName || filterOptions.offices.find((office) => office.id === filters.office_id)?.name || 'Selected office') : '',
        filters.state ? 'Status: ' + (filterOptions.states.find((state) => state.value === filters.state)?.label || filters.state) : '',
        filters.date_from ? 'From: ' + filters.date_from : '',
        filters.date_to ? 'To: ' + filters.date_to : '',
    ].filter(Boolean);

    return <AppLayout title="Document Center"><PageFrame width="wide" density="compact">
        <PageHeader eyebrow="ONE TALIBON / Records" title="Document Center" description="Find authorized records and open their source workspaces." icon={FileText} />
        <div className="grid min-w-0 items-start gap-3 lg:grid-cols-[184px_minmax(0,1fr)]">
            <DocumentCollectionNav collections={filterOptions.recordTypes} current={filters.record_type} onSelect={changeCollection} workspaces={workspaces} />
            <div className="min-w-0 space-y-3">
                <form onSubmit={submit} aria-label="Document search and filters">
                    <ProgressiveFilterBar title="Date range" activeFilters={activeFilters}
                        primary={<PortalSearchField label="Search authorized records" placeholder="Search reference, title, office or person" maxLength={160} value={draft.search} onChange={(event) => setDraft({ ...draft, search: event.target.value })} onClear={draft.search ? () => setDraft({ ...draft, search: '' }) : undefined} />}
                        common={<><label className="min-w-0 text-xs font-medium text-[var(--municipal-muted)]">Office<select className="municipal-field mt-1 block w-full lg:w-36" value={draft.office_id ?? ''} onChange={(event) => setDraft({ ...draft, office_id: event.target.value ? Number(event.target.value) : null })}><option value="">All authorized offices</option>{filterOptions.offices.map((office) => <option key={office.id ?? office.code} value={office.id}>{office.shortName || office.name}</option>)}</select></label><label className="min-w-0 text-xs font-medium text-[var(--municipal-muted)]">Status<select className="municipal-field mt-1 block w-full lg:w-32" value={draft.state} onChange={(event) => setDraft({ ...draft, state: event.target.value })}><option value="">All statuses</option>{filterOptions.states.map((state) => <option key={state.value} value={state.value}>{state.label}</option>)}</select></label></>}
                        actions={<><button type="submit" className="municipal-action municipal-action--primary">Search</button><button type="button" onClick={reset} className="municipal-action municipal-action--quiet">Reset</button></>}
                        advanced={<><label className="min-w-0 text-xs font-medium">From date<input type="date" className="municipal-field mt-1 block w-full" value={draft.date_from} onChange={(event) => setDraft({ ...draft, date_from: event.target.value })} /></label><label className="min-w-0 text-xs font-medium">To date<input type="date" className="municipal-field mt-1 block w-full" value={draft.date_to} onChange={(event) => setDraft({ ...draft, date_to: event.target.value })} /></label><p className="text-xs leading-5 text-[var(--municipal-muted)] sm:col-span-2">Correspondence uses received dates; transactions use received or creation dates. Travel orders match overlapping travel periods, while the register displays their issued dates.</p><button type="submit" className="municipal-action municipal-action--primary md:hidden">Apply date range</button></>}
                    />
                </form>
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--municipal-muted)]"><span>{collectionLabels[filters.record_type] || 'Authorized records'}</span><span>Newest record dates first</span></div>
                <div className="grid min-w-0 items-start gap-3 xl:grid-cols-[minmax(0,1fr)_280px]">
                    <div className="min-w-0 space-y-3">
                        <DocumentRegister records={records.data} total={records.total} selectedUrl={selected?.detailUrl || null} onSelect={(record) => setSelectedUrl(record?.detailUrl || null)} />
                        {records.last_page > 1 && <nav aria-label="Document pages" className="flex flex-wrap items-center justify-between gap-2 text-xs"><span>Page {records.current_page} of {records.last_page}</span><div className="flex flex-wrap gap-2">{records.prev_page_url && <Link href={pageHref(records.prev_page_url)} onClick={() => setSelectedUrl(null)} className="municipal-action municipal-action--secondary">Previous</Link>}{records.next_page_url && <Link href={pageHref(records.next_page_url)} onClick={() => setSelectedUrl(null)} className="municipal-action municipal-action--secondary">Next</Link>}</div></nav>}
                    </div>
                    <div className="hidden min-w-0 xl:block"><DocumentMetadataPanel record={selected} onClose={() => setSelectedUrl(null)} /></div>
                </div>
            </div>
        </div>
    </PageFrame></AppLayout>;
}
