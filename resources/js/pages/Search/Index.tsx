import { Link, usePage } from '@inertiajs/react';
import { ArrowUpRight, BookOpen, Compass, ListChecks, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import PageFrame from '../../components/PageFrame';
import PageHeader from '../../components/PageHeader';
import { municipalPlans } from '../../data/municipal/plans';
import { ppaRecords } from '../../data/municipal/ppas';
import AppLayout from '../../layouts/AppLayout';
import { buildPortalNavigation } from '../../navigation/portalNavigation';
import type { SharedProps } from '../../types';

type Result = { id: string; title: string; type: string; office: string; year: string; status: string; href: string; reference: string; date?: string };
const field = 'min-h-11 min-w-0 w-full rounded-md border border-[var(--municipal-border)] bg-[var(--municipal-surface)] px-3 text-sm text-[var(--municipal-text)]';

const resultIcon = (type: string) => {
    if (type === 'Plan reference') return BookOpen;
    if (type === 'PPA reference') return ListChecks;
    return Compass;
};

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

    const results: Result[] = [
        ...destinations.filter((item) => item.key !== 'portalSearch').map((item) => ({ id: item.key, title: item.label, type: 'Portal destination', office: '', year: '', status: 'Available', href: item.href, reference: 'ONE TALIBON' })),
        ...(destinations.some((item) => item.key === 'developmentPlans') ? municipalPlans.map((plan) => ({ id: plan.id, title: plan.title, type: 'Plan reference', office: plan.leadOffice, year: String(plan.coverageStart), status: plan.status, href: `/development-plans?search=${encodeURIComponent(plan.code)}`, reference: plan.documentRef, date: plan.lastActionDate })) : []),
        ...(destinations.some((item) => item.key === 'ppas') ? ppaRecords.map((ppa) => ({ id: ppa.id, title: ppa.title, type: 'PPA reference', office: ppa.responsibleOffice, year: String(ppa.year), status: ppa.status, href: `/ppas?search=${encodeURIComponent(ppa.id)}`, reference: ppa.id })) : []),
    ];

    const options = (key: 'type' | 'office' | 'year' | 'status') => [...new Set(results.map((item) => item[key]).filter(Boolean))].sort();
    const normalizedQuery = query.trim().toLowerCase();
    const visible = results.filter((item) => (!normalizedQuery || [item.title, item.reference, item.office, item.type].join(' ').toLowerCase().includes(normalizedQuery)) && (!type || item.type === type) && (!office || item.office === office) && (!year || item.year === year) && (!status || item.status === status));
    const reset = () => { setQuery(''); setType(''); setOffice(''); setYear(''); setStatus(''); };

    return <AppLayout title="Search Portal"><PageFrame className="max-w-[1440px]" density="compact">
        <PageHeader eyebrow="ONE TALIBON discovery" title="Universal Search" description="Search available portal destinations, plan references and PPA references. Authorized records remain in Records Search." icon={Search} />

        <section className="municipal-panel p-3" aria-label="Portal search filters">
            <label className="relative block">
                <span className="sr-only">Search portal</span>
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--municipal-brand)]" size={18} aria-hidden="true" />
                <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search plans, PPAs, offices or portal destinations..." className={`${field} pl-10`} />
            </label>
            <div className="mt-2 grid min-w-0 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {([['Type', type, setType, 'type'], ['Office', office, setOffice, 'office'], ['Year', year, setYear, 'year'], ['Status', status, setStatus, 'status']] as const).map(([label, value, update, key]) => <label key={key} className="min-w-0 text-[11px] font-semibold text-[var(--municipal-muted)]">{label}<select className={`${field} mt-1`} value={value} onChange={(event) => update(event.target.value)}><option value="">All {label.toLowerCase()}s</option>{options(key).map((option) => <option key={option}>{option}</option>)}</select></label>)}
            </div>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--municipal-border)] pt-2">
                <p className="text-[11px] leading-5 text-[var(--municipal-muted)]">Scope: authorized portal destinations plus current plan and PPA reference data. File type and barangay filtering are not supplied by these sources.</p>
                <button type="button" onClick={reset} className="min-h-11 rounded-md px-3 text-xs font-semibold text-[var(--municipal-brand)] hover:bg-[var(--municipal-hover)]">Reset</button>
            </div>
        </section>

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <p aria-live="polite"><strong className="text-[var(--municipal-text)]">{visible.length}</strong> results{query ? ` for “${query}”` : ''}</p>
            {permissions.navigation.records && <Link href={`/records?search=${encodeURIComponent(query)}`} className="inline-flex min-h-11 items-center gap-1 font-semibold text-[var(--municipal-brand)]">Search authorized records <ArrowUpRight size={14} /></Link>}
        </div>

        <section className="municipal-panel divide-y divide-[var(--municipal-border)] overflow-hidden" aria-label="Search results">
            {visible.map((item) => {
                const Icon = resultIcon(item.type);
                return <article key={item.id} className="flex min-w-0 items-center gap-3 px-3 py-2.5 hover:bg-[var(--municipal-hover)]">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[var(--municipal-brand-soft)] text-[var(--municipal-brand)]"><Icon size={17} aria-hidden="true" /></div>
                    <div className="min-w-0 flex-1">
                        <Link href={item.href} className="break-words text-[13px] font-semibold leading-5 text-[var(--municipal-text)] hover:underline">{item.title}</Link>
                        <div className="mt-0.5 flex flex-wrap gap-x-2 gap-y-0.5 text-[11px] text-[var(--municipal-muted)]">
                            <span className="font-semibold text-[var(--municipal-brand)]">{item.type}</span>
                            {item.office && <span>{item.office}</span>}
                            <span>{item.status}</span>
                            {item.year && <span>Year {item.year}</span>}
                            {item.date && <span>Last action {item.date}</span>}
                        </div>
                        <p className="mt-0.5 break-all text-[11px] text-[var(--municipal-muted)]">{item.reference}</p>
                    </div>
                    <Link href={item.href} aria-label={`Open ${item.title}`} className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-md text-[var(--municipal-brand)] hover:bg-[var(--municipal-brand-soft)]"><ArrowUpRight size={17} /></Link>
                </article>;
            })}
            {!visible.length && <p className="p-6 text-center text-sm text-[var(--municipal-muted)]">No matching results. Change the search or clear your filters.</p>}
        </section>

        <p className="text-[11px] text-[var(--municipal-muted)]">Plan and PPA results use the portal's current prototype reference data. Downloads remain in their authorized source workspaces.</p>
    </PageFrame></AppLayout>;
}
