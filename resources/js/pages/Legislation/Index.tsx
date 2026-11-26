import { Link, router } from '@inertiajs/react';
import { ArrowRight, Gavel, Plus, Search } from 'lucide-react';
import { type FormEvent, useEffect, useId, useState } from 'react';
import LegislativeCalendarPanel from '../../components/legislative/LegislativeCalendarPanel';
import LegislativePager from '../../components/legislative/LegislativePager';
import LegislativeRecordStatus from '../../components/legislative/LegislativeRecordStatus';
import type { LegislativeRecordItem } from '../../components/legislative/types';
import { PageHeader } from '../../components/ui';
import AppLayout from '../../layouts/AppLayout';
import { humanizeSlug } from '../../lib/format';

const RECORDS_PER_PAGE = 25;

const recordFilters = [
    { value: '', label: 'All Issuances', dot: '#0e4d36' },
    { value: 'ordinance', label: 'Ordinances', dot: '#15803d' },
    { value: 'resolution', label: 'Resolutions', dot: '#0f766e' },
    { value: 'executive_order', label: 'Executive Orders', dot: '#b45309' },
    { value: 'office_order', label: 'Office Orders', dot: '#6d28d9' },
    { value: 'administrative_order', label: 'Administrative Orders', dot: '#0369a1' },
    { value: 'circular', label: 'Circulars', dot: '#b91c1c' },
    { value: 'other', label: 'Other', dot: '#64748b' },
] as const;

export default function Index({
    records,
    filters,
    canManage,
}: {
    records: LegislativeRecordItem[];
    filters: { q: string; type: string };
    canManage: boolean;
}) {
    const searchId = useId();
    const [q, setQ] = useState(filters.q || '');
    const [page, setPage] = useState(1);
    const pageCount = Math.max(1, Math.ceil(records.length / RECORDS_PER_PAGE));
    const visibleRecords = records.slice((page - 1) * RECORDS_PER_PAGE, page * RECORDS_PER_PAGE);
    const rangeStart = records.length === 0 ? 0 : (page - 1) * RECORDS_PER_PAGE + 1;
    const rangeEnd = Math.min(page * RECORDS_PER_PAGE, records.length);

    useEffect(() => {
        setPage(1);
    }, [filters.q, filters.type]);

    useEffect(() => {
        if (page > pageCount) setPage(pageCount);
    }, [page, pageCount]);

    const search = (event?: FormEvent) => {
        event?.preventDefault();
        setPage(1);
        router.get('/legislation', { q: q || undefined, type: filters.type || undefined }, { preserveState: true, replace: true });
    };

    const byType = records.reduce<Record<string, number>>(
        (counts, item) => ({ ...counts, [item.record_type]: (counts[item.record_type] ?? 0) + 1 }),
        {},
    );

    return (
        <AppLayout title="Ordinances & Issuances">
            <div className="mx-auto max-w-[1440px] space-y-4 px-4 py-5 sm:px-6">
                <PageHeader
                    eyebrow="Controlled municipal issuances"
                    title="Ordinances & Issuances"
                    subtitle="Find municipal ordinances, resolutions, executive orders, office and administrative orders, circulars, and related controlled issuances."
                    actions={
                        canManage ? (
                            <Link href="/legislation/create" className="municipal-primary-button">
                                <Plus size={15} aria-hidden="true" />
                                <span>Add record</span>
                            </Link>
                        ) : undefined
                    }
                />

                {/* Dark-mode-aware TCDS category filter chips + search bar */}
                <div className="tcds-card space-y-3 p-3.5">
                    <nav className="flex flex-wrap gap-1.5" aria-label="Legislative record type filters">
                        {recordFilters.map((item) => {
                            const active = filters.type === item.value || (!filters.type && !item.value);
                            const count = item.value ? (byType[item.value] ?? 0) : records.length;
                            return (
                                <button
                                    key={item.value || 'all'}
                                    type="button"
                                    aria-pressed={active}
                                    onClick={() => {
                                        setPage(1);
                                        router.get('/legislation', { q: q || undefined, type: item.value || undefined }, { preserveState: true });
                                    }}
                                    className={`inline-flex min-h-10 items-center gap-2 rounded-lg border px-3 text-xs font-semibold transition-colors ${
                                        active
                                            ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)] text-white'
                                            : 'border-[var(--border-default)] bg-[var(--surface-recessed)] text-[var(--ink-primary)] hover:border-[var(--brand-primary)] hover:bg-[var(--surface-hover)]'
                                    }`}
                                >
                                    <span
                                        className="h-2 w-2 rounded-full"
                                        style={{ backgroundColor: active ? '#e2b959' : item.dot }}
                                        aria-hidden="true"
                                    />
                                    <span>{item.label}</span>
                                    <span
                                        className={`rounded-full px-1.5 py-0.5 text-xs font-bold leading-none tabular-nums ${
                                            active
                                                ? 'bg-black/20 text-white'
                                                : 'bg-[var(--surface-card)] text-[var(--ink-secondary)]'
                                        }`}
                                    >
                                        {count}
                                    </span>
                                </button>
                            );
                        })}
                    </nav>

                    <search>
                        <form onSubmit={search} className="flex flex-wrap items-center gap-2">
                            <label htmlFor={searchId} className="sr-only">Search legislative records</label>
                            <div className="relative min-w-[14rem] flex-1">
                                <Search
                                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-secondary)]"
                                    size={16}
                                    aria-hidden="true"
                                />
                                <input
                                    id={searchId}
                                    type="search"
                                    value={q}
                                    onChange={(event) => setQ(event.target.value)}
                                    className="tcds-input pl-9"
                                    placeholder="Search ordinance number, title, subject, or keyword…"
                                />
                            </div>
                            <button type="submit" className="municipal-primary-button">
                                Search
                            </button>
                        </form>
                    </search>
                </div>

                <section className="tcds-card overflow-hidden" aria-labelledby="legislative-register-heading">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-default)] bg-[var(--surface-recessed)] px-4 py-3">
                        <div className="flex items-center gap-2">
                            <Gavel size={15} aria-hidden="true" className="text-[var(--brand-ink)]" />
                            <h2 id="legislative-register-heading" className="text-sm font-bold text-[var(--ink-primary)]">
                                Ordinances &amp; issuances register
                            </h2>
                        </div>
                        <div className="text-xs text-[var(--ink-secondary)]" aria-label="Loaded legislative result context" aria-live="polite">
                            Showing <strong className="font-semibold text-[var(--ink-primary)]">{rangeStart}–{rangeEnd}</strong> of{' '}
                            <strong className="font-semibold text-[var(--ink-primary)]">{records.length}</strong> loaded
                        </div>
                    </div>

                    <div className="divide-y divide-[var(--border-default)]" aria-label="Legislative records">
                        {visibleRecords.map((record) => (
                            <Link
                                key={record.id}
                                href={`/legislation/${record.id}`}
                                aria-label={`${record.record_number}: ${record.title}`}
                                className="group flex flex-col gap-2 px-4 py-3.5 transition-colors hover:bg-[var(--surface-hover)] sm:flex-row sm:items-center sm:justify-between"
                            >
                                <div className="min-w-0">
                                    <div className="text-sm font-semibold leading-snug text-[var(--ink-primary)] group-hover:text-[var(--brand-ink)]">
                                        {record.title}
                                    </div>
                                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-[var(--ink-secondary)]">
                                        <span className="font-mono font-bold text-[var(--brand-ink)]">
                                            {record.record_number}
                                        </span>
                                        <span aria-hidden="true">·</span>
                                        <span>{[humanizeSlug(record.record_type), record.year, record.issuing_body].filter(Boolean).join(' · ')}</span>
                                    </div>
                                </div>
                                <div className="flex shrink-0 items-center gap-2.5">
                                    <LegislativeRecordStatus status={record.status} />
                                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--ink-secondary)] group-hover:text-[var(--brand-ink)]">
                                        Open <ArrowRight size={14} aria-hidden="true" />
                                    </span>
                                </div>
                            </Link>
                        ))}
                        {records.length === 0 && (
                            <div className="px-4 py-10 text-center">
                                <div className="text-sm font-semibold text-[var(--ink-primary)]">No legislative records match this view.</div>
                                <p className="mt-1 text-xs text-[var(--ink-secondary)]">Try a different search term or record type.</p>
                            </div>
                        )}
                    </div>
                    <LegislativePager page={page} pageCount={pageCount} onPageChange={setPage} />
                </section>

                <LegislativeCalendarPanel />
            </div>
        </AppLayout>
    );
}
