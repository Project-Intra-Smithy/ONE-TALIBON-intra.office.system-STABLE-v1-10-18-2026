import { Link, usePage } from '@inertiajs/react';
import {
    ArrowUpRight,
    BookOpen,
    Compass,
    FileText,
    FolderSearch,
    Inbox,
    ListChecks,
    Map,
    Search,
    Send,
    SlidersHorizontal,
    X,
} from 'lucide-react';
import { useEffect, useId, useMemo, useState } from 'react';
import { EmptyState, PageHeader, StatusBadge } from '../../components/ui';
import { municipalPlans } from '../../data/municipal/plans';
import { ppaRecords } from '../../data/municipal/ppas';
import AppLayout from '../../layouts/AppLayout';
import { formatDatePH } from '../../lib/format';
import { buildPortalNavigation } from '../../navigation/portalNavigation';
import type { SharedProps } from '../../types';

type SearchKind = 'portal' | 'plan' | 'ppa';
type SearchScope = 'all' | SearchKind;

type ArchiveActivityItem = {
    publicId: string;
    name: string;
    documentType: string;
    classification: string;
    uploadedAt?: string | null;
    relatedReference?: string | null;
    relatedTitle?: string | null;
    currentOffice?: { name: string; shortName?: string | null } | null;
};

type ArchiveActivity = {
    sentCount: number;
    receivedCount: number;
    recentSent: ArchiveActivityItem[];
    recentReceived: ArchiveActivityItem[];
};

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

const resultTone: Record<SearchKind, { icon: typeof Compass; badge: 'ok' | 'info' | 'warn'; iconWrap: string; label: string }> = {
    portal: {
        icon: Compass,
        badge: 'ok',
        iconWrap: 'bg-[var(--status-ok-bg)] text-[var(--status-ok-fg)] border border-[var(--status-ok-border)]',
        label: 'Portal destination',
    },
    plan: {
        icon: BookOpen,
        badge: 'info',
        iconWrap: 'bg-[var(--status-info-bg)] text-[var(--status-info-fg)] border border-[var(--status-info-border)]',
        label: 'Development plan',
    },
    ppa: {
        icon: ListChecks,
        badge: 'warn',
        iconWrap: 'bg-[var(--status-warn-bg)] text-[var(--status-warn-fg)] border border-[var(--status-warn-border)]',
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
    return terms.filter((term) => haystack.includes(term)).length * 100;
}

export default function PortalSearch({ archiveActivity }: { archiveActivity: ArchiveActivity }) {
    const { workspaceExperience, permissions } = usePage<SharedProps>().props;
    const { url } = usePage<SharedProps>();
    const destinations = buildPortalNavigation(workspaceExperience, permissions.navigation).flatMap((group) => group.items);
    const urlQuery = new URLSearchParams(url.split('?')[1] || '').get('q') || '';
    const searchInputId = useId();
    const officeFilterId = useId();
    const yearFilterId = useId();
    const statusFilterId = useId();

    const [query, setQuery] = useState(urlQuery);
    const [scope, setScope] = useState<SearchScope>('all');
    const [office, setOffice] = useState('');
    const [year, setYear] = useState('');
    const [status, setStatus] = useState('');
    const [filtersOpen, setFiltersOpen] = useState(false);
    const documentsAllowed = destinations.some((item) => item.key === 'documentCenter');

    useEffect(() => {
        setQuery(urlQuery);
    }, [urlQuery]);

    useEffect(() => {
        const current = new URL(window.location.href);
        if ((current.searchParams.get('q') || '') === query) return;
        if (query.trim()) current.searchParams.set('q', query);
        else current.searchParams.delete('q');
        window.history.replaceState(window.history.state, '', `${current.pathname}${current.search}${current.hash}`);
    }, [query]);

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

    const options = (key: 'office' | 'year' | 'status') =>
        [...new Set(results.map((item) => item[key]).filter(Boolean))].sort();

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
            return score !== 0 ? score : a.title.localeCompare(b.title);
        }), [results, normalizedQuery, scope, office, year, status]);

    const reset = () => {
        setQuery('');
        setScope('all');
        setOffice('');
        setYear('');
        setStatus('');
        setFiltersOpen(false);
    };

    const quickAccessKeys = ['documentCenter', 'myWork', 'developmentPlans', 'availablePlanningMaps', 'ppas', 'executiveDepartments'];
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
            <div className="mx-auto max-w-[1440px] space-y-5 px-4 py-5 sm:px-6">
                <PageHeader
                    eyebrow="ONE TALIBON discovery"
                    title="Search ONE TALIBON"
                    subtitle="Discover available portal workspaces, planning maps, and local planning references. Official records are searched separately under your permissions."
                />

                <search>
                    <section className="tcds-card space-y-4 p-4 sm:p-5" aria-label="Portal and reference search">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-[var(--brand-ink)]">
                                Portal discovery
                            </p>
                            <h2 className="mt-1 text-lg font-bold text-[var(--ink-primary)]">Find a workspace or reference</h2>
                            <p className="mt-0.5 text-xs text-[var(--ink-secondary)]">
                                Results below cover authorized portal destinations, planning references, and PPA catalogs.
                            </p>
                        </div>

                        <div className="relative">
                            <label htmlFor={searchInputId} className="sr-only">
                                Search portal destinations and planning references
                            </label>
                            <Search
                                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--brand-ink)]"
                                size={18}
                                aria-hidden="true"
                            />
                            <input
                                id={searchInputId}
                                type="text"
                                inputMode="search"
                                value={query}
                                onChange={(event) => setQuery(event.target.value)}
                                placeholder="Search a workspace, plan, planning map, PPA, or office…"
                                className="tcds-input pl-11 pr-11"
                            />
                            {query && (
                                <button
                                    type="button"
                                    onClick={() => setQuery('')}
                                    className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-[var(--ink-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--ink-primary)]"
                                    aria-label="Clear search"
                                >
                                    <X size={16} aria-hidden="true" />
                                </button>
                            )}
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2.5">
                            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by reference type">
                                {scopeOptions.map((option) => {
                                    const active = scope === option.key;
                                    return (
                                        <button
                                            key={option.key}
                                            type="button"
                                            onClick={() => setScope(option.key)}
                                            aria-pressed={active}
                                            className={`inline-flex min-h-11 items-center gap-2 rounded-lg border px-3.5 text-sm font-semibold transition-colors ${
                                                active
                                                    ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)] text-white'
                                                    : 'border-[var(--border-default)] bg-[var(--surface-recessed)] text-[var(--ink-primary)] hover:bg-[var(--surface-hover)]'
                                            }`}
                                        >
                                            <span>{option.label}</span>
                                            <span
                                                className={`rounded-full px-2 py-0.5 text-xs font-bold leading-none ${
                                                    active
                                                        ? 'bg-white/20 text-white'
                                                        : 'bg-[var(--surface-card)] text-[var(--ink-secondary)]'
                                                }`}
                                            >
                                                {option.count}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setFiltersOpen((value) => !value)}
                                    aria-expanded={filtersOpen}
                                    aria-controls="portal-search-filters"
                                    className={`inline-flex min-h-11 items-center gap-2 rounded-lg border px-3.5 text-sm font-semibold transition-colors ${
                                        filtersOpen || hasAdvancedFilters
                                            ? 'border-[var(--brand-primary)] bg-[var(--brand-soft)] text-[var(--ink-primary)]'
                                            : 'border-[var(--border-control)] bg-[var(--surface-card)] text-[var(--ink-primary)] hover:bg-[var(--surface-hover)]'
                                    }`}
                                >
                                    <SlidersHorizontal size={15} aria-hidden="true" />
                                    <span>More filters{hasAdvancedFilters ? ` (${[office, year, status].filter(Boolean).length})` : ''}</span>
                                </button>
                                {(query || scope !== 'all' || hasAdvancedFilters) && (
                                    <button type="button" onClick={reset} className="municipal-secondary-button">
                                        Reset
                                    </button>
                                )}
                            </div>
                        </div>

                        {filtersOpen && (
                            <div id="portal-search-filters" className="grid gap-3 border-t border-[var(--border-default)] pt-4 sm:grid-cols-3">
                                <div>
                                    <label htmlFor={officeFilterId} className="mb-1 block text-xs font-bold uppercase tracking-wide text-[var(--ink-secondary)]">
                                        Office
                                    </label>
                                    <select id={officeFilterId} className="tcds-input" value={office} onChange={(event) => setOffice(event.target.value)}>
                                        <option value="">All offices</option>
                                        {options('office').map((option) => <option key={option}>{option}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor={yearFilterId} className="mb-1 block text-xs font-bold uppercase tracking-wide text-[var(--ink-secondary)]">
                                        Year
                                    </label>
                                    <select id={yearFilterId} className="tcds-input" value={year} onChange={(event) => setYear(event.target.value)}>
                                        <option value="">All years</option>
                                        {options('year').map((option) => <option key={option}>{option}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor={statusFilterId} className="mb-1 block text-xs font-bold uppercase tracking-wide text-[var(--ink-secondary)]">
                                        Status
                                    </label>
                                    <select id={statusFilterId} className="tcds-input" value={status} onChange={(event) => setStatus(event.target.value)}>
                                        <option value="">All statuses</option>
                                        {options('status').map((option) => <option key={option}>{option}</option>)}
                                    </select>
                                </div>
                            </div>
                        )}
                    </section>
                </search>

                {isDiscovery ? (
                    <>
                        <section aria-labelledby="search-scope-summary">
                            <div className="mb-2.5 flex items-center justify-between gap-3">
                                <h2 id="search-scope-summary" className="text-xs font-bold uppercase tracking-wider text-[var(--ink-secondary)]">
                                    Browse searchable categories
                                </h2>
                                <span className="text-xs font-semibold text-[var(--ink-secondary)]">{counts.all} available entries</span>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-3">
                                {([
                                    ['portal', 'Portal Destinations', counts.portal, Compass, 'border-l-[var(--status-ok-bar)]', 'bg-[var(--status-ok-bg)] text-[var(--status-ok-fg)]'],
                                    ['plan', 'Development Plans', counts.plan, BookOpen, 'border-l-[var(--status-info-fg)]', 'bg-[var(--status-info-bg)] text-[var(--status-info-fg)]'],
                                    ['ppa', 'PPAs', counts.ppa, ListChecks, 'border-l-[var(--status-warn-bar)]', 'bg-[var(--status-warn-bg)] text-[var(--status-warn-fg)]'],
                                ] as const).map(([key, label, count, Icon, accentBorder, iconTone]) => (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => setScope(key)}
                                        className={`tcds-card flex min-h-28 flex-col justify-between border-l-4 ${accentBorder} p-4 text-left transition-colors hover:bg-[var(--surface-hover)]`}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${iconTone}`}>
                                                <Icon size={18} aria-hidden="true" />
                                            </span>
                                            <strong className="text-2xl font-extrabold tabular-nums text-[var(--ink-primary)]">{count}</strong>
                                        </div>
                                        <div className="mt-3">
                                            <div className="text-sm font-bold text-[var(--ink-primary)]">{label}</div>
                                            <div className="mt-0.5 text-xs text-[var(--ink-secondary)]">Browse this search family</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </section>

                        <section aria-labelledby="archive-activity-heading">
                            <div className="mb-2.5 flex items-center justify-between gap-3">
                                <h2 id="archive-activity-heading" className="text-xs font-bold uppercase tracking-wider text-[var(--ink-secondary)]">
                                    My archive activity
                                </h2>
                                {documentsAllowed && (
                                    <Link href="/documents" className="text-xs font-semibold text-[var(--brand-ink)] hover:underline">
                                        Open Document Center →
                                    </Link>
                                )}
                            </div>

                            <div className="grid gap-4 lg:grid-cols-2">
                                {([
                                    ['my_sent', 'My Sent Files', archiveActivity.sentCount, archiveActivity.recentSent, Send],
                                    ['my_received', 'My Received Files', archiveActivity.receivedCount, archiveActivity.recentReceived, Inbox],
                                ] as const).map(([scopeKey, label, count, items, Icon]) => (
                                    <div key={scopeKey} className="tcds-card overflow-hidden">
                                        <header className="flex items-center justify-between gap-3 border-b border-[var(--border-default)] px-4 py-3">
                                            <div className="flex min-w-0 items-center gap-2.5">
                                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--brand-soft)] text-[var(--brand-ink)]">
                                                    <Icon size={15} aria-hidden="true" />
                                                </div>
                                                <div>
                                                    <h3 className="text-sm font-bold text-[var(--ink-primary)]">{label}</h3>
                                                    <p className="text-xs text-[var(--ink-secondary)]">
                                                        {count} archived {count === 1 ? 'file' : 'files'}
                                                    </p>
                                                </div>
                                            </div>
                                            {documentsAllowed && (
                                                <Link
                                                    href={`/documents?mode=files&archive_scope=${scopeKey}`}
                                                    className="shrink-0 text-xs font-semibold text-[var(--brand-ink)] hover:underline"
                                                >
                                                    View archive
                                                </Link>
                                            )}
                                        </header>
                                        <div className="divide-y divide-[var(--border-default)]">
                                            {documentsAllowed && items.map((item) => (
                                                <Link
                                                    key={item.publicId}
                                                    href={`/documents?mode=files&archive_scope=${scopeKey}&document=${encodeURIComponent(item.publicId)}`}
                                                    className="flex min-h-11 items-center gap-3 px-4 py-2.5 hover:bg-[var(--surface-hover)]"
                                                >
                                                    <FileText size={15} className="shrink-0 text-[var(--brand-ink)]" aria-hidden="true" />
                                                    <div className="min-w-0 flex-1">
                                                        <div className="truncate text-sm font-semibold text-[var(--ink-primary)]">{item.name}</div>
                                                        <div className="truncate text-xs text-[var(--ink-secondary)]">
                                                            {item.relatedReference || item.relatedTitle || item.documentType}
                                                            {item.currentOffice ? ` · ${item.currentOffice.shortName || item.currentOffice.name}` : ''}
                                                            {item.uploadedAt ? ` · ${formatDatePH(item.uploadedAt)}` : ''}
                                                        </div>
                                                    </div>
                                                    <ArrowUpRight size={14} className="shrink-0 text-[var(--ink-secondary)]" aria-hidden="true" />
                                                </Link>
                                            ))}
                                            {!items.length && (
                                                <p className="px-4 py-4 text-sm text-[var(--ink-secondary)]">
                                                    No {scopeKey === 'my_sent' ? 'sent' : 'received'} files in your authorized archive yet.
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.6fr)]">
                            <div className="tcds-card overflow-hidden">
                                <header className="border-b border-[var(--border-default)] px-4 py-3">
                                    <h2 className="text-sm font-bold text-[var(--ink-primary)]">Quick access</h2>
                                    <p className="text-xs text-[var(--ink-secondary)]">Common portal destinations available to your account</p>
                                </header>
                                <div className="grid sm:grid-cols-2">
                                    {quickAccess.map((item) => {
                                        const Icon = item.icon;
                                        return (
                                            <Link
                                                key={item.key}
                                                href={item.href}
                                                className="flex min-h-12 items-center gap-3 border-b border-[var(--border-default)] px-4 py-3 transition-colors hover:bg-[var(--surface-hover)] sm:odd:border-r"
                                            >
                                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--brand-soft)] text-[var(--brand-ink)]">
                                                    <Icon size={15} aria-hidden="true" />
                                                </div>
                                                <span className="min-w-0 flex-1 truncate text-sm font-semibold text-[var(--ink-primary)]">{item.label}</span>
                                                <ArrowUpRight size={14} className="shrink-0 text-[var(--ink-secondary)]" aria-hidden="true" />
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="tcds-card flex flex-col justify-between p-4">
                                <div>
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--brand-soft)] text-[var(--brand-ink)]">
                                        <FolderSearch size={18} aria-hidden="true" />
                                    </div>
                                    <h2 className="mt-3 text-sm font-bold text-[var(--ink-primary)]">Authorized records</h2>
                                    <p className="mt-1 text-xs leading-5 text-[var(--ink-secondary)]">
                                        Correspondence, workflow transactions, and other authorized municipal records remain searchable in the Records Register.
                                    </p>
                                </div>
                                <div className="mt-4 flex flex-wrap gap-2">
                                    {permissions.navigation.records && (
                                        <Link href="/records" className="municipal-secondary-button w-full justify-between">
                                            <span>Search Records Register</span>
                                            <ArrowUpRight size={15} aria-hidden="true" />
                                        </Link>
                                    )}
                                    <Link href="/planning-maps" className="municipal-secondary-button w-full justify-between">
                                        <span className="inline-flex items-center gap-2"><Map size={15} aria-hidden="true" /> Municipal Planning Maps</span>
                                        <ArrowUpRight size={15} aria-hidden="true" />
                                    </Link>
                                </div>
                            </div>
                        </section>
                    </>
                ) : (
                    <>
                        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                            <p aria-live="polite" className="text-[var(--ink-secondary)]">
                                <strong className="text-[var(--ink-primary)]">{visible.length}</strong> {visible.length === 1 ? 'result' : 'results'}
                                {query ? ` for “${query}”` : ''}
                            </p>
                            {permissions.navigation.records && (
                                <Link
                                    href={`/records?search=${encodeURIComponent(query)}`}
                                    className="inline-flex min-h-10 items-center gap-1 text-xs font-semibold text-[var(--brand-ink)] hover:underline"
                                >
                                    <span>Search authorized records</span>
                                    <ArrowUpRight size={14} aria-hidden="true" />
                                </Link>
                            )}
                        </div>

                        {visible.length === 0 ? (
                            <EmptyState
                                icon={<Search size={24} aria-hidden="true" />}
                                title="No matching results"
                                description="Adjust your search terms, category scope, or filter selection."
                                action={<button type="button" onClick={reset} className="municipal-secondary-button">Clear search</button>}
                            />
                        ) : (
                            <section className="tcds-card divide-y divide-[var(--border-default)] overflow-hidden" aria-label="Portal and reference results">
                                {visible.map((item) => {
                                    const tone = resultTone[item.kind];
                                    const Icon = tone.icon;

                                    return (
                                        <article key={`${item.kind}:${item.id}`} className="flex items-center gap-3.5 px-4 py-3.5 transition-colors hover:bg-[var(--surface-hover)]">
                                            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${tone.iconWrap}`}>
                                                <Icon size={16} aria-hidden="true" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <Link href={item.href} className="text-sm font-bold text-[var(--ink-primary)] hover:text-[var(--brand-primary)] hover:underline hover:text-[var(--brand-ink)]">
                                                        {item.title}
                                                    </Link>
                                                    <StatusBadge tone={tone.badge}>{tone.label}</StatusBadge>
                                                </div>
                                                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[var(--ink-secondary)]">
                                                    <span className="font-mono font-semibold text-[var(--brand-ink)]">{item.reference}</span>
                                                    {item.office && <><span>·</span><span>{item.office}</span></>}
                                                    <span>·</span>
                                                    <span>{item.status}</span>
                                                    {item.year && <><span>·</span><span>{item.year}</span></>}
                                                    {item.date && <><span>·</span><span>Updated {formatDatePH(item.date)}</span></>}
                                                </div>
                                            </div>
                                            <Link
                                                href={item.href}
                                                aria-label={`Open ${item.title}`}
                                                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-[var(--border-control)] bg-[var(--surface-card)] text-[var(--ink-primary)] transition-colors hover:border-[var(--brand-primary)] hover:bg-[var(--brand-soft)]"
                                            >
                                                <ArrowUpRight size={16} aria-hidden="true" />
                                            </Link>
                                        </article>
                                    );
                                })}
                            </section>
                        )}
                    </>
                )}
            </div>
        </AppLayout>
    );
}
