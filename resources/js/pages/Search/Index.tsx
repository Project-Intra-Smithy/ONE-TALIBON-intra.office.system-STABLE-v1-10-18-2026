import { Link, usePage } from '@inertiajs/react';
import {
    ArrowUpRight,
    BookOpen,
    Compass,
    FolderSearch,
    ListChecks,
    Search,
    SlidersHorizontal,
    X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import PageFrame from '../../components/PageFrame';
import PageHeader from '../../components/PageHeader';
import { municipalPlans } from '../../data/municipal/plans';
import { ppaRecords } from '../../data/municipal/ppas';
import AppLayout from '../../layouts/AppLayout';
import { buildPortalNavigation } from '../../navigation/portalNavigation';
import type { SharedProps } from '../../types';

type SearchKind = 'portal' | 'plan' | 'ppa';
type SearchScope = 'all' | SearchKind;

type Result = {
    id: string;
    kind: SearchKind;
    title: string;
    type: string;
    office: string;
    year: string;
    status: string;
    href: string;
    reference: string;
    date?: string;
};

const field = 'min-h-10 min-w-0 w-full rounded-md border border-[var(--municipal-border)] bg-[var(--municipal-surface)] px-3 text-sm text-[var(--municipal-text)] outline-none focus:border-[var(--municipal-focus)] focus:ring-2 focus:ring-[var(--municipal-focus)]/20';

const resultTone: Record<SearchKind, { icon: typeof Compass; shell: string; label: string }> = {
    portal: {
        icon: Compass,
        shell: 'bg-[#eef8f1] text-[#17633f]',
        label: 'Portal destination',
    },
    plan: {
        icon: BookOpen,
        shell: 'bg-[#eef5ff] text-[#265fa8]',
        label: 'Development plan',
    },
    ppa: {
        icon: ListChecks,
        shell: 'bg-[#fff8e8] text-[#9a6a08]',
        label: 'PPA reference',
    },
};

function relevanceScore(item: Result, query: string) {
    if (!query) return 0;

    const title = item.title.toLowerCase();
    const reference = item.reference.toLowerCase();
    const office = item.office.toLowerCase();
    const type = item.type.toLowerCase();

    if (title === query || reference === query) return 1000;
    if (title.startsWith(query) || reference.startsWith(query)) return 800;
    if (title.includes(query)) return 600;
    if (reference.includes(query)) return 500;
    if (office.includes(query)) return 300;
    if (type.includes(query)) return 200;

    const terms = query.split(/\s+/).filter(Boolean);
    const haystack = [title, reference, office, type].join(' ');
    const matches = terms.filter((term) => haystack.includes(term)).length;

    return matches * 100;
}

export default function PortalSearch() {
    const { workspaceExperience, permissions } = usePage<SharedProps>().props;
    const { url } = usePage<SharedProps>();
    const destinations = buildPortalNavigation(workspaceExperience, permissions.navigation).flatMap((group) => group.items);
    const urlQuery = new URLSearchParams(url.split('?')[1] || '').get('q') || '';

    const [query, setQuery] = useState(urlQuery);
    const [scope, setScope] = useState<SearchScope>('all');
    const [office, setOffice] = useState('');
    const [year, setYear] = useState('');
    const [status, setStatus] = useState('');
    const [filtersOpen, setFiltersOpen] = useState(false);

    useEffect(() => { setQuery(urlQuery); }, [urlQuery]);

    const results = useMemo<Result[]>(() => [
        ...destinations
            .filter((item) => item.key !== 'portalSearch')
            .map((item) => ({
                id: item.key,
                kind: 'portal' as const,
                title: item.label,
                type: 'Portal destination',
                office: '',
                year: '',
                status: 'Available',
                href: item.href,
                reference: 'ONE TALIBON',
            })),
        ...(destinations.some((item) => item.key === 'developmentPlans')
            ? municipalPlans.map((plan) => ({
                id: plan.id,
                kind: 'plan' as const,
                title: plan.title,
                type: 'Development plan',
                office: plan.leadOffice,
                year: String(plan.coverageStart),
                status: plan.status,
                href: `/development-plans?search=${encodeURIComponent(plan.code)}`,
                reference: plan.documentRef,
                date: plan.lastActionDate,
            }))
            : []),
        ...(destinations.some((item) => item.key === 'ppas')
            ? ppaRecords.map((ppa) => ({
                id: ppa.id,
                kind: 'ppa' as const,
                title: ppa.title,
                type: 'PPA reference',
                office: ppa.responsibleOffice,
                year: String(ppa.year),
                status: ppa.status,
                href: `/ppas?search=${encodeURIComponent(ppa.id)}`,
                reference: ppa.id,
            }))
            : []),
    ], [destinations]);

    const counts = useMemo(() => ({
        all: results.length,
        portal: results.filter((item) => item.kind === 'portal').length,
        plan: results.filter((item) => item.kind === 'plan').length,
        ppa: results.filter((item) => item.kind === 'ppa').length,
    }), [results]);

    const options = (key: 'office' | 'year' | 'status') => [...new Set(results.map((item) => item[key]).filter(Boolean))].sort();

    const normalizedQuery = query.trim().toLowerCase();
    const hasAdvancedFilters = Boolean(office || year || status);
    const isDiscovery = !normalizedQuery && scope === 'all' && !hasAdvancedFilters;

    const visible = useMemo(() => results
        .filter((item) => {
            const searchable = [item.title, item.reference, item.office, item.type].join(' ').toLowerCase();
            return (!normalizedQuery || searchable.includes(normalizedQuery))
                && (scope === 'all' || item.kind === scope)
                && (!office || item.office === office)
                && (!year || item.year === year)
                && (!status || item.status === status);
        })
        .sort((a, b) => {
            const score = relevanceScore(b, normalizedQuery) - relevanceScore(a, normalizedQuery);
            if (score !== 0) return score;
            return a.title.localeCompare(b.title);
        }), [results, normalizedQuery, scope, office, year, status]);

    const reset = () => {
        setQuery('');
        setScope('all');
        setOffice('');
        setYear('');
        setStatus('');
        setFiltersOpen(false);
    };

    const quickAccessKeys = ['documentCenter', 'myWork', 'developmentPlans', 'ppas', 'executiveDepartments', 'calendar'];
    const quickAccess = quickAccessKeys
        .map((key) => destinations.find((item) => item.key === key))
        .filter((item): item is NonNullable<typeof item> => Boolean(item));

    const scopeOptions: { key: SearchScope; label: string; count: number }[] = [
        { key: 'all', label: 'All', count: counts.all },
        { key: 'portal', label: 'Portal', count: counts.portal },
        { key: 'plan', label: 'Plans', count: counts.plan },
        { key: 'ppa', label: 'PPAs', count: counts.ppa },
    ];

    return (
        <AppLayout title="Search Portal">
            <PageFrame className="max-w-[1440px]" density="compact">
                <PageHeader
                    eyebrow="ONE TALIBON discovery"
                    title="Universal Search"
                    description="Search portal destinations, development plans and PPA references. Authorized records remain in Records Search."
                    icon={Search}
                />

                <section className="municipal-panel p-3" aria-label="Universal search">
                    <label className="relative block">
                        <span className="sr-only">Search portal</span>
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--municipal-brand)]" size={19} aria-hidden="true" />
                        <input
                            type="search"
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="Search plans, PPAs, offices or portal destinations..."
                            className="min-h-12 w-full rounded-md border border-[var(--municipal-border)] bg-[var(--municipal-surface)] pl-10 pr-10 text-[15px] text-[var(--municipal-text)] outline-none focus:border-[var(--municipal-focus)] focus:ring-2 focus:ring-[var(--municipal-focus)]/20"
                        />
                        {query ? (
                            <button
                                type="button"
                                onClick={() => setQuery('')}
                                className="absolute right-2 top-1/2 flex min-h-9 min-w-9 -translate-y-1/2 items-center justify-center rounded-md text-[var(--municipal-muted)] hover:bg-[var(--municipal-hover)]"
                                aria-label="Clear search"
                            >
                                <X size={16} aria-hidden="true" />
                            </button>
                        ) : null}
                    </label>

                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap gap-1.5" aria-label="Search result type">
                            {scopeOptions.map((option) => (
                                <button
                                    key={option.key}
                                    type="button"
                                    onClick={() => setScope(option.key)}
                                    aria-pressed={scope === option.key}
                                    className={`inline-flex min-h-9 items-center gap-1.5 rounded-md px-3 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--municipal-focus)] ${scope === option.key ? 'bg-[var(--municipal-brand)] text-white' : 'bg-[var(--municipal-surface-subtle)] text-[var(--municipal-text)] hover:bg-[var(--municipal-hover)]'}`}
                                >
                                    {option.label}
                                    <span className={`rounded-full px-1.5 py-0.5 text-[9px] leading-none ${scope === option.key ? 'bg-white/20 text-white' : 'bg-white text-[var(--municipal-muted)]'}`}>{option.count}</span>
                                </button>
                            ))}
                        </div>

                        <button
                            type="button"
                            onClick={() => setFiltersOpen((value) => !value)}
                            aria-expanded={filtersOpen}
                            className={`inline-flex min-h-9 items-center gap-1.5 rounded-md border px-3 text-xs font-semibold ${filtersOpen || hasAdvancedFilters ? 'border-[var(--municipal-selected-border)] bg-[var(--municipal-selected-bg)] text-[var(--municipal-brand)]' : 'border-[var(--municipal-border)] bg-[var(--municipal-surface)] text-[var(--municipal-text)] hover:bg-[var(--municipal-hover)]'}`}
                        >
                            <SlidersHorizontal size={14} aria-hidden="true" />
                            Filters{hasAdvancedFilters ? ` · ${[office, year, status].filter(Boolean).length}` : ''}
                        </button>
                    </div>

                    {filtersOpen ? (
                        <div className="mt-2 grid gap-2 border-t border-[var(--municipal-border)] pt-2 sm:grid-cols-3">
                            <label className="min-w-0 text-[10px] font-bold uppercase tracking-wide text-[var(--municipal-muted)]">
                                Office
                                <select className={`${field} mt-1`} value={office} onChange={(event) => setOffice(event.target.value)}>
                                    <option value="">All offices</option>
                                    {options('office').map((option) => <option key={option}>{option}</option>)}
                                </select>
                            </label>
                            <label className="min-w-0 text-[10px] font-bold uppercase tracking-wide text-[var(--municipal-muted)]">
                                Year
                                <select className={`${field} mt-1`} value={year} onChange={(event) => setYear(event.target.value)}>
                                    <option value="">All years</option>
                                    {options('year').map((option) => <option key={option}>{option}</option>)}
                                </select>
                            </label>
                            <label className="min-w-0 text-[10px] font-bold uppercase tracking-wide text-[var(--municipal-muted)]">
                                Status
                                <select className={`${field} mt-1`} value={status} onChange={(event) => setStatus(event.target.value)}>
                                    <option value="">All statuses</option>
                                    {options('status').map((option) => <option key={option}>{option}</option>)}
                                </select>
                            </label>
                        </div>
                    ) : null}

                    {(query || scope !== 'all' || hasAdvancedFilters) ? (
                        <div className="mt-2 flex items-center justify-between gap-2 border-t border-[var(--municipal-border)] pt-2">
                            <p className="text-[10px] text-[var(--municipal-muted)]">Searching authorized portal destinations plus current Plan and PPA reference data.</p>
                            <button type="button" onClick={reset} className="min-h-9 shrink-0 rounded-md px-2.5 text-[11px] font-semibold text-[var(--municipal-brand)] hover:bg-[var(--municipal-hover)]">Reset</button>
                        </div>
                    ) : null}
                </section>

                {isDiscovery ? (
                    <>
                        <section aria-labelledby="search-scope-summary">
                            <div className="mb-1.5 flex items-center justify-between gap-3">
                                <h2 id="search-scope-summary" className="text-[10px] font-bold uppercase tracking-wide text-[var(--municipal-muted)]">Search across ONE TALIBON</h2>
                                <span className="text-[9px] text-[var(--municipal-muted)]">{counts.all} searchable references</span>
                            </div>

                            <div className="grid gap-2 sm:grid-cols-3">
                                {([
                                    ['portal', 'Portal Destinations', counts.portal, Compass, 'bg-[#eef8f1] text-[#17633f]'],
                                    ['plan', 'Development Plans', counts.plan, BookOpen, 'bg-[#eef5ff] text-[#265fa8]'],
                                    ['ppa', 'PPAs', counts.ppa, ListChecks, 'bg-[#fff8e8] text-[#9a6a08]'],
                                ] as const).map(([key, label, count, Icon, tone]) => (
                                    <button key={key} type="button" onClick={() => setScope(key)} className={`min-h-[88px] rounded-lg border border-[var(--municipal-border)] p-3 text-left transition hover:-translate-y-px ${tone}`}>
                                        <div className="flex items-start justify-between gap-3">
                                            <Icon size={19} aria-hidden="true" />
                                            <strong className="text-2xl leading-none">{count}</strong>
                                        </div>
                                        <div className="mt-2 text-xs font-bold">{label}</div>
                                        <div className="mt-0.5 text-[10px] opacity-75">Browse this search family</div>
                                    </button>
                                ))}
                            </div>
                        </section>

                        <section className="grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,.6fr)]">
                            <div className="municipal-panel overflow-hidden">
                                <header className="flex min-h-10 items-center justify-between gap-3 border-b border-[var(--municipal-border)] px-3 py-2">
                                    <div>
                                        <h2 className="text-[13px] font-bold">Quick access</h2>
                                        <p className="text-[10px] text-[var(--municipal-muted)]">Common portal destinations available to your account</p>
                                    </div>
                                </header>
                                <div className="grid sm:grid-cols-2">
                                    {quickAccess.map((item) => {
                                        const Icon = item.icon;
                                        return (
                                            <Link key={item.key} href={item.href} className="flex min-h-12 items-center gap-2.5 border-b border-[var(--municipal-border)] px-3 py-2 hover:bg-[var(--municipal-hover)] sm:[&:nth-child(odd)]:border-r">
                                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[var(--municipal-brand-soft)] text-[var(--municipal-brand)]"><Icon size={15} aria-hidden="true" /></div>
                                                <span className="min-w-0 flex-1 truncate text-xs font-semibold">{item.label}</span>
                                                <ArrowUpRight size={13} className="shrink-0 text-[var(--municipal-muted)]" aria-hidden="true" />
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="municipal-panel flex min-h-[150px] flex-col justify-between p-3">
                                <div>
                                    <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[var(--municipal-brand-soft)] text-[var(--municipal-brand)]"><FolderSearch size={17} aria-hidden="true" /></div>
                                    <h2 className="mt-2 text-[13px] font-bold">Authorized records</h2>
                                    <p className="mt-1 text-[11px] leading-5 text-[var(--municipal-muted)]">Correspondence, workflow transactions and other authorized records remain in the Records Register.</p>
                                </div>
                                {permissions.navigation.records ? (
                                    <Link href="/records" className="mt-3 inline-flex min-h-10 items-center justify-between rounded-md border border-[var(--municipal-border)] px-3 text-xs font-semibold text-[var(--municipal-brand)] hover:bg-[var(--municipal-hover)]">
                                        Search Records Register <ArrowUpRight size={14} aria-hidden="true" />
                                    </Link>
                                ) : null}
                            </div>
                        </section>
                    </>
                ) : (
                    <>
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                            <p aria-live="polite">
                                <strong className="text-[var(--municipal-text)]">{visible.length}</strong> result{visible.length === 1 ? '' : 's'}
                                {query ? ` for “${query}”` : ''}
                            </p>
                            {permissions.navigation.records ? (
                                <Link href={`/records?search=${encodeURIComponent(query)}`} className="inline-flex min-h-9 items-center gap-1 text-[11px] font-semibold text-[var(--municipal-brand)]">
                                    Search authorized records <ArrowUpRight size={13} />
                                </Link>
                            ) : null}
                        </div>

                        <section className="municipal-panel divide-y divide-[var(--municipal-border)] overflow-hidden" aria-label="Search results">
                            {visible.map((item) => {
                                const tone = resultTone[item.kind];
                                const Icon = tone.icon;

                                return (
                                    <article key={`${item.kind}:${item.id}`} className="flex min-w-0 items-center gap-2.5 px-3 py-2 hover:bg-[var(--municipal-hover)]">
                                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${tone.shell}`}><Icon size={15} aria-hidden="true" /></div>
                                        <div className="min-w-0 flex-1">
                                            <Link href={item.href} className="block truncate text-xs font-semibold leading-4 text-[var(--municipal-text)] hover:underline">{item.title}</Link>
                                            <div className="mt-0.5 flex flex-wrap gap-x-2 gap-y-0.5 text-[10px] leading-4 text-[var(--municipal-muted)]">
                                                <span className="font-semibold text-[var(--municipal-brand)]">{tone.label}</span>
                                                {item.office ? <span>{item.office}</span> : null}
                                                <span>{item.status}</span>
                                                {item.year ? <span>{item.year}</span> : null}
                                                {item.date ? <span>Updated {item.date}</span> : null}
                                            </div>
                                            <div className="truncate text-[9px] leading-3.5 text-[var(--municipal-muted)]">{item.reference}</div>
                                        </div>
                                        <Link href={item.href} aria-label={`Open ${item.title}`} className="inline-flex min-h-10 min-w-10 shrink-0 items-center justify-center rounded-md text-[var(--municipal-brand)] hover:bg-[var(--municipal-brand-soft)]"><ArrowUpRight size={15} /></Link>
                                    </article>
                                );
                            })}

                            {!visible.length ? (
                                <div className="p-6 text-center">
                                    <Search className="mx-auto text-[var(--municipal-muted)]" size={22} aria-hidden="true" />
                                    <h2 className="mt-2 text-sm font-bold">No matching results</h2>
                                    <p className="mt-1 text-xs text-[var(--municipal-muted)]">Change the search terms, category or filters.</p>
                                    <button type="button" onClick={reset} className="mt-3 min-h-10 rounded-md px-3 text-xs font-semibold text-[var(--municipal-brand)] hover:bg-[var(--municipal-hover)]">Clear search</button>
                                </div>
                            ) : null}
                        </section>

                        <p className="text-[10px] text-[var(--municipal-muted)]">Plan and PPA results use current prototype reference data. Downloads and authoritative record actions remain in their source workspaces.</p>
                    </>
                )}
            </PageFrame>
        </AppLayout>
    );
}
