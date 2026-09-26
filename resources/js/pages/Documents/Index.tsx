import { Link, router, usePage } from '@inertiajs/react';
import { FileText, Folder, Search, X } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import PageFrame from '../../components/PageFrame';
import PageHeader from '../../components/PageHeader';
import PortalWorkspaceNav from '../../components/portal/PortalWorkspaceNav';
import AppLayout from '../../layouts/AppLayout';
import type { SharedProps } from '../../types';
import { buildPortalNavigation } from '../../navigation/portalNavigation';
import type { PortalDestinationKey } from '../../navigation/navigationTypes';

type Office = { id?: number; code: string; name: string; shortName?: string | null };
type DocumentRow = { recordType: string; reference?: string | null; title: string; source: string; originOffice?: Office | null; currentOffice?: Office | null; assignedEmployee?: { name: string } | null; state: string; classification?: string | null; recordDate?: string | null; updatedAt?: string | null; detailUrl: string };
type Filters = { search: string; record_type: string; state: string; office_id?: number | null; date_from: string; date_to: string };
type Props = { records: { data: DocumentRow[]; total: number; current_page: number; last_page: number; prev_page_url?: string | null; next_page_url?: string | null }; filters: Filters; filterOptions: { recordTypes: { value: string; label: string }[]; states: { value: string; label: string }[]; offices: Office[] } };
const categories: { label: string; destination?: PortalDestinationKey; type?: string }[] = [
    { label: 'All authorized records', type: 'all' },
    { label: 'Incoming Communications', destination: 'correspondence' },
    { label: 'Outgoing Communications', destination: 'correspondence' },
    { label: 'Memoranda', destination: 'memoranda' },
    { label: 'Executive Orders', destination: 'legislative' },
    { label: 'Office Orders', destination: 'records' },
    { label: 'Special Orders', destination: 'records' },
    { label: 'Resolutions', destination: 'legislative' },
    { label: 'Ordinances', destination: 'legislative' },
    { label: 'Contracts / MOAs / MOUs' }, { label: 'Certifications' }, { label: 'Endorsements', destination: 'correspondence' },
    { label: 'Permits and Clearances' }, { label: 'Reports' }, { label: 'Minutes', destination: 'meetings' },
    { label: 'Project Documents', destination: 'projectMonitoring' }, { label: 'Procurement Documents', destination: 'projectMonitoring' },
    { label: 'Plans', destination: 'developmentPlans' }, { label: 'Technical Documents' }, { label: 'Archived Records' },
];
const field = 'min-h-11 min-w-0 w-full rounded-lg border border-[var(--municipal-border)] bg-[var(--municipal-surface)] px-3 text-sm';
const pretty = (value: string) => value.replaceAll('_', ' ');

export default function DocumentCenter({ records, filters, filterOptions }: Props) {
    const { workspaceExperience, permissions } = usePage<SharedProps>().props;
    const available = buildPortalNavigation(workspaceExperience, permissions.navigation).flatMap((group) => group.items);
    const [category, setCategory] = useState(categories[0]);
    const [selected, setSelected] = useState<DocumentRow | null>(null);
    const [draft, setDraft] = useState(filters);
    useEffect(() => { setDraft(filters); setSelected(null); }, [filters]);
    const destination = available.find((item) => item.key === category.destination);
    const submit = (event: FormEvent) => { event.preventDefault(); router.get('/documents', { ...draft }, { preserveState: true, preserveScroll: true }); };
    const pageHref = (href: string) => '/documents' + new URL(href, 'http://portal.local').search;
    return <AppLayout title="Document Center"><PageFrame className="max-w-[1560px]">
        <PageHeader eyebrow="ONE TALIBON records and references" title="Document Center" description="Browse authorized records and open document collections in their source workspaces." icon={FileText} />
        <PortalWorkspaceNav current="documentCenter" destinations={['documentCenter', 'records', 'correspondence', 'memoranda', 'legislative']} />
        <div className="grid min-w-0 gap-3 lg:grid-cols-[220px_minmax(0,1fr)]">
            <aside className="municipal-panel min-w-0 p-3">
                <h2 className="mb-2 text-sm font-bold">Document categories</h2>
                <label className="block lg:hidden"><span className="sr-only">Document category</span><select className={field} value={category.label} onChange={(event) => { setCategory(categories.find((item) => item.label === event.target.value) ?? categories[0]); setSelected(null); }}>{categories.map((item) => <option key={item.label}>{item.label}</option>)}</select></label>
                <div className="hidden space-y-0.5 lg:block">{categories.map((item) => <button key={item.label} type="button" onClick={() => { setCategory(item); setSelected(null); }} aria-pressed={category.label === item.label} className={`flex min-h-11 w-full items-start gap-2 rounded-lg px-2 py-3 text-left text-sm ${category.label === item.label ? 'bg-[var(--municipal-brand-soft)] font-semibold text-[var(--municipal-brand)]' : 'text-[var(--municipal-muted)] hover:bg-[var(--municipal-hover)]'}`}><Folder size={15} className="mt-0.5 shrink-0 text-amber-600" aria-hidden="true" />{item.label}</button>)}</div>
            </aside>
            <div className="min-w-0 space-y-3">
                {category.type !== 'all' ? <section className="municipal-panel space-y-3 p-5"><div className="text-xs font-semibold text-[var(--municipal-brand)]">Document Center / {category.label}</div><h2 className="text-lg font-bold">{category.label}</h2><p className="max-w-2xl text-sm leading-6 text-[var(--municipal-muted)]">{destination ? `This collection is accessed through ${destination.label}. Open that workspace to use its available categories, records and authorized actions.` : 'A dedicated collection for this category is planned. You can search the authorized records register below for matching references.'}</p>{destination ? <Link href={destination.href} className="inline-flex min-h-11 items-center rounded-lg bg-[var(--municipal-brand-deep)] px-4 text-sm font-semibold text-white">Open {destination.label}</Link> : <button type="button" onClick={() => { setCategory(categories[0]); setDraft({ ...draft, search: category.label }); }} className="inline-flex min-h-11 items-center rounded-lg border border-[var(--municipal-border)] px-4 text-sm font-semibold text-[var(--municipal-brand)]">Search records</button>}<button type="button" onClick={() => setCategory(categories[0])} className="ml-2 min-h-11 px-3 text-sm font-semibold">All authorized records</button></section> : <>
                    <form onSubmit={submit} className="municipal-panel space-y-3 p-3">
                        <label className="relative block"><span className="sr-only">Search documents</span><Search size={17} className="absolute left-3 top-3.5 text-[var(--municipal-muted)]" /><input className={`${field} pl-9`} placeholder="Search title, reference, office or assignee" value={draft.search} onChange={(event) => setDraft({ ...draft, search: event.target.value })} /></label>
                        <div className="grid min-w-0 gap-2 sm:grid-cols-2 xl:grid-cols-4"><select aria-label="Record type" className={field} value={draft.record_type} onChange={(event) => setDraft({ ...draft, record_type: event.target.value })}>{filterOptions.recordTypes.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select><select aria-label="Office" className={field} value={draft.office_id ?? ''} onChange={(event) => setDraft({ ...draft, office_id: event.target.value ? Number(event.target.value) : null })}><option value="">All authorized offices</option>{filterOptions.offices.map((item) => <option key={item.id ?? item.code} value={item.id}>{item.shortName || item.name}</option>)}</select><select aria-label="Status" className={field} value={draft.state} onChange={(event) => setDraft({ ...draft, state: event.target.value })}><option value="">All statuses</option>{filterOptions.states.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select><button className="min-h-11 rounded-lg bg-[var(--municipal-brand-deep)] px-4 text-sm font-semibold text-white">Search records</button></div>
                    </form>
                    <div className="grid min-w-0 gap-3 2xl:grid-cols-[minmax(0,1fr)_300px]">
                        <section className="municipal-panel min-w-0 overflow-hidden" aria-label="Document register"><header className="flex flex-wrap justify-between gap-2 border-b border-[var(--municipal-border)] p-3"><h2 className="text-sm font-bold">Authorized document references</h2><span className="text-xs text-[var(--municipal-muted)]">{records.total} records</span></header><div className="divide-y divide-[var(--municipal-border)]">{records.data.map((record) => <article key={record.detailUrl} className="min-w-0 p-3"><div className="flex items-start gap-3"><FileText size={20} className="mt-1 shrink-0 text-[var(--municipal-brand)]" aria-hidden="true" /><div className="min-w-0 flex-1"><button type="button" onClick={() => setSelected(record)} aria-pressed={selected?.detailUrl === record.detailUrl} className="min-h-11 text-left text-sm font-semibold leading-5 hover:underline">{record.title}</button><p className="break-words text-xs text-[var(--municipal-muted)]">{record.reference} · {record.currentOffice?.shortName || record.currentOffice?.name || record.source}</p><div className="mt-2 flex flex-wrap gap-2 text-xs"><span className="rounded bg-[var(--municipal-brand-soft)] px-2 py-1 font-semibold text-[var(--municipal-brand)]">{pretty(record.recordType)}</span><span className="py-1 capitalize text-[var(--municipal-muted)]">{pretty(record.state)}</span>{record.recordDate && <span className="py-1 text-[var(--municipal-muted)]">{record.recordDate.slice(0, 10)}</span>}</div></div><Link href={record.detailUrl} className="inline-flex min-h-11 items-center px-2 text-sm font-semibold text-[var(--municipal-brand)]">Open</Link></div>{selected?.detailUrl === record.detailUrl && <div className="mt-3 2xl:hidden"><DocumentMetadata record={record} onClose={() => setSelected(null)} /></div>}</article>)}{!records.data.length && <p className="p-6 text-sm text-[var(--municipal-muted)]">No authorized records match these filters.</p>}</div>
                            {records.last_page > 1 && <nav aria-label="Document pages" className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--municipal-border)] p-3">{records.prev_page_url ? <Link href={pageHref(records.prev_page_url)} className="min-h-11 py-3 text-sm">Previous</Link> : <span />}<span className="text-xs">Page {records.current_page} of {records.last_page}</span>{records.next_page_url && <Link href={pageHref(records.next_page_url)} className="min-h-11 py-3 text-sm">Next</Link>}</nav>}
                        </section>
                        <div className="hidden min-w-0 2xl:block">{selected ? <DocumentMetadata record={selected} onClose={() => setSelected(null)} /> : <aside className="municipal-panel p-4 text-sm text-[var(--municipal-muted)]"><h2 className="mb-2 font-bold text-[var(--municipal-text)]">Document metadata</h2>Select a document title to see its recorded details.</aside>}</div>
                    </div>
                </>}
            </div>
        </div>
    </PageFrame></AppLayout>;
}

function DocumentMetadata({ record, onClose }: { record: DocumentRow; onClose: () => void }) {
    const fields = [['Reference', record.reference], ['Category', pretty(record.recordType)], ['Source', record.source], ['Origin office', record.originOffice?.name], ['Current office', record.currentOffice?.name], ['Responsible person', record.assignedEmployee?.name], ['Status', pretty(record.state)], ['Classification', record.classification], ['Record date', record.recordDate], ['Last updated', record.updatedAt]];
    return <aside className="municipal-panel min-w-0 p-4" aria-label="Document metadata"><div className="flex items-start justify-between gap-2"><h2 className="text-sm font-bold">Document metadata</h2><button type="button" onClick={onClose} aria-label="Close document metadata" className="inline-flex min-h-11 min-w-11 items-center justify-center"><X size={17} /></button></div><h3 className="mb-4 break-words text-sm font-semibold">{record.title}</h3><dl className="space-y-3 text-sm">{fields.filter(([, value]) => value).map(([label, value]) => <div key={label}><dt className="text-xs font-semibold text-[var(--municipal-muted)]">{label}</dt><dd className="mt-1 break-words">{value}</dd></div>)}</dl><Link href={record.detailUrl} className="mt-4 inline-flex min-h-11 items-center font-semibold text-[var(--municipal-brand)]">Open source record</Link><p className="mt-2 text-xs leading-5 text-[var(--municipal-muted)]">Attachments and downloads are available in the source record when authorized.</p></aside>;
}
