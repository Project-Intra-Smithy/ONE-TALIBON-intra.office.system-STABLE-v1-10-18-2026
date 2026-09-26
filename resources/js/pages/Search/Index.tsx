import { Link, usePage } from '@inertiajs/react';
import { ArrowUpRight, FileText, Search, SlidersHorizontal } from 'lucide-react';
import { useEffect, useState } from 'react';
import PageFrame from '../../components/PageFrame';
import PageHeader from '../../components/PageHeader';
import { municipalPlans } from '../../data/municipal/plans';
import { ppaRecords } from '../../data/municipal/ppas';
import AppLayout from '../../layouts/AppLayout';
import { buildPortalNavigation } from '../../navigation/portalNavigation';
import type { SharedProps } from '../../types';

type Result = { id: string; title: string; type: string; office: string; year: string; status: string; href: string; reference: string; date?: string };
const field = 'min-h-11 min-w-0 w-full rounded-lg border border-[var(--municipal-border)] bg-[var(--municipal-surface)] px-3 text-sm';

export default function PortalSearch() {
    const { workspaceExperience, permissions } = usePage<SharedProps>().props;
    const destinations = buildPortalNavigation(workspaceExperience, permissions.navigation).flatMap((group) => group.items);
    const { url } = usePage<SharedProps>();
    const urlQuery = new URLSearchParams(url.split('?')[1] || '').get('q') || '';
    const [query, setQuery] = useState(urlQuery);
    useEffect(() => { setQuery(urlQuery); }, [urlQuery]);
    const [type, setType] = useState('');
    const [office, setOffice] = useState('');
    const [year, setYear] = useState('');
    const [status, setStatus] = useState('');
    const [more, setMore] = useState(false);
    const results: Result[] = [
        ...destinations.filter((item) => item.key !== 'portalSearch').map((item) => ({ id: item.key, title: item.label, type: 'Portal destination', office: '', year: '', status: 'Available', href: item.href, reference: 'ONE TALIBON' })),
        ...(destinations.some((item) => item.key === 'developmentPlans') ? municipalPlans.map((plan) => ({ id: plan.id, title: plan.title, type: 'Plan reference', office: plan.leadOffice, year: String(plan.coverageStart), status: plan.status, href: `/development-plans?search=${encodeURIComponent(plan.code)}`, reference: plan.documentRef, date: plan.lastActionDate })) : []),
        ...(destinations.some((item) => item.key === 'ppas') ? ppaRecords.map((ppa) => ({ id: ppa.id, title: ppa.title, type: 'PPA reference', office: ppa.responsibleOffice, year: String(ppa.year), status: ppa.status, href: `/ppas?search=${encodeURIComponent(ppa.id)}`, reference: ppa.id })) : []),
    ];
    const options = (key: 'type' | 'office' | 'year' | 'status') => [...new Set(results.map((item) => item[key]).filter(Boolean))].sort();
    const visible = results.filter((item) => (!query.trim() || [item.title, item.reference, item.office, item.type].join(' ').toLowerCase().includes(query.trim().toLowerCase())) && (!type || item.type === type) && (!office || item.office === office) && (!year || item.year === year) && (!status || item.status === status));
    return <AppLayout title="Search Portal"><PageFrame className="max-w-[1440px]">
        <PageHeader eyebrow="ONE TALIBON discovery" title="Search Portal" description="Find portal destinations, municipal plans and PPA reference records. Use Records Search for authorized correspondence and workflow documents." icon={Search} />
        <section className="municipal-panel space-y-3 p-3 sm:p-4" aria-label="Portal search filters">
            <label className="relative block"><span className="sr-only">Search portal</span><Search className="absolute left-3 top-3.5 text-[var(--municipal-brand)]" size={18} aria-hidden="true" /><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search plans, PPAs, offices or portal destinations..." className={`${field} pl-10`} /></label>
            <div className="grid min-w-0 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {([['Type', type, setType, 'type'], ['Office', office, setOffice, 'office'], ['Year', year, setYear, 'year'], ['Status', status, setStatus, 'status']] as const).map(([label, value, update, key]) => <label key={key} className="min-w-0 text-xs font-semibold">{label}<select className={`${field} mt-1`} value={value} onChange={(event) => update(event.target.value)}><option value="">All {label.toLowerCase()}s</option>{options(key).map((option) => <option key={option}>{option}</option>)}</select></label>)}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2"><button type="button" onClick={() => setMore(!more)} aria-expanded={more} className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[var(--municipal-brand)]"><SlidersHorizontal size={16} />More filters</button><button type="button" onClick={() => { setQuery(''); setType(''); setOffice(''); setYear(''); setStatus(''); }} className="min-h-11 px-3 text-sm font-semibold">Reset</button></div>
            {more && <div className="grid gap-3 border-t border-[var(--municipal-border)] pt-3 sm:grid-cols-2"><label className="text-xs font-semibold">File type<select disabled className={`${field} mt-1 opacity-60`}><option>Not supplied by these sources</option></select></label><label className="text-xs font-semibold">Barangay<select disabled className={`${field} mt-1 opacity-60`}><option>Not supplied by these sources</option></select></label></div>}
        </section>
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm"><p aria-live="polite">{visible.length} results{query ? ` for ${query}` : ''}</p>{permissions.navigation.records && <Link href={`/records?search=${encodeURIComponent(query)}`} className="inline-flex min-h-11 items-center font-semibold text-[var(--municipal-brand)]">Search authorized records <ArrowUpRight size={16} /></Link>}</div>
        <section className="municipal-panel divide-y divide-[var(--municipal-border)]" aria-label="Search results">
            {visible.map((item) => <article key={item.id} className="flex min-w-0 items-start gap-3 p-4"><div className="rounded-lg bg-[var(--municipal-brand-soft)] p-2.5 text-[var(--municipal-brand)]"><FileText size={20} aria-hidden="true" /></div><div className="min-w-0 flex-1"><Link href={item.href} className="text-sm font-semibold leading-6 text-[var(--municipal-text)] hover:underline">{item.title}</Link><div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[var(--municipal-muted)]"><span className="font-semibold text-[var(--municipal-brand)]">{item.type}</span>{item.office && <span>{item.office}</span>}<span>{item.status}</span>{item.date && <span>{item.date}</span>}</div><p className="mt-1 break-words text-xs text-[var(--municipal-muted)]">{item.reference}</p></div><Link href={item.href} aria-label={`Open ${item.title}`} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-[var(--municipal-brand)] hover:bg-[var(--municipal-brand-soft)]"><ArrowUpRight size={18} /></Link></article>)}
            {!visible.length && <p className="p-8 text-center text-sm text-[var(--municipal-muted)]">No matching results. Change the search or clear your filters.</p>}
        </section>
        <p className="text-xs text-[var(--municipal-muted)]">Plan and PPA results use the portal's current prototype reference data. File downloads remain in their authorized source workspaces.</p>
    </PageFrame></AppLayout>;
}
