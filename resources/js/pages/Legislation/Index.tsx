import { Link, router } from '@inertiajs/react';
import { ArrowRight, Gavel, Plus, Search } from 'lucide-react';
import { type FormEvent, useEffect, useState } from 'react';
import LegislativeCalendarPanel from '../../components/legislative/LegislativeCalendarPanel';
import LegislativePager from '../../components/legislative/LegislativePager';
import LegislativeRecordStatus from '../../components/legislative/LegislativeRecordStatus';
import type { LegislativeRecordItem } from '../../components/legislative/types';
import PageFrame from '../../components/PageFrame';
import AppLayout from '../../layouts/AppLayout';

const RECORDS_PER_PAGE = 25;

const recordFilters = [
    ['', 'All', 'slate'],
    ['ordinance', 'Ordinances', 'green'],
    ['resolution', 'Resolutions', 'blue'],
    ['executive_order', 'Executive Orders', 'amber'],
    ['office_order', 'Office Orders', 'violet'],
    ['administrative_order', 'Administrative Orders', 'cyan'],
    ['circular', 'Circulars', 'coral'],
    ['other', 'Other', 'slate'],
] as const;

const filterToneClasses: Record<string, string> = {
    green: 'border-[#cfe6d5] bg-[#eef8f1] text-[#17633f]',
    blue: 'border-[#cfe0f6] bg-[#eef5ff] text-[#265fa8]',
    amber: 'border-[#f0dfb4] bg-[#fff8e8] text-[#9a6a08]',
    violet: 'border-[#ddd2f3] bg-[#f5f0ff] text-[#7150a8]',
    cyan: 'border-[#cce7e5] bg-[#eef9f8] text-[#247874]',
    coral: 'border-[#f0d1ca] bg-[#fff1ed] text-[#b6534f]',
    slate: 'border-[#d9dfdc] bg-[#f5f7f6] text-[#53635b]',
};

export default function Index({ records, filters, canManage }: { records: LegislativeRecordItem[]; filters: { q: string; type: string }; canManage: boolean }) {
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
            <PageFrame density="compact">
                <div className="@container min-w-0 space-y-2.5">
                    <header className="flex min-w-0 flex-col gap-2 border-b border-slate-200 pb-2.5 dark:border-slate-700 @min-[680px]:flex-row @min-[680px]:items-end @min-[680px]:justify-between">
                        <div className="min-w-0">
                            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--municipal-brand)]"><Gavel size={13} aria-hidden="true" /> Controlled municipal issuances</div>
                            <h1 className="mt-0.5 text-xl font-bold leading-tight tracking-tight text-slate-950 dark:text-slate-100 @min-[680px]:text-2xl">Ordinances & Issuances</h1>
                            <p className="mt-0.5 max-w-3xl text-xs leading-5 text-slate-500 dark:text-slate-400">Find municipal ordinances, resolutions, executive orders, office and administrative orders, circulars, and related controlled issuances.</p>
                        </div>
                        {canManage && (
                            <Link href="/legislation/create" className="inline-flex min-h-8 w-full items-center justify-center gap-1.5 rounded-md bg-[var(--municipal-action-bg)] px-3 py-1.5 text-xs font-semibold text-[var(--municipal-action-text)] hover:bg-[var(--municipal-action-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--municipal-focus)]/30 @min-[680px]:w-auto">
                                <Plus size={14} aria-hidden="true" /> Add record
                            </Link>
                        )}
                    </header>

                <section aria-labelledby="issuance-overview-heading">
                    <div className="mb-1 flex items-center justify-between gap-3">
                        <h2 id="issuance-overview-heading" className="text-[10px] font-bold uppercase tracking-wide text-[var(--municipal-muted)]">At a glance</h2>
                        <span className="text-[9px] text-[var(--municipal-muted)]">Select a category to filter the register</span>
                    </div>
                    <nav className="grid gap-1.5 sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-8" aria-label="Legislative record type filters">
                        {recordFilters.map(([value, label, tone]) => {
                            const active = filters.type === value || (!filters.type && !value);
                            const count = value ? (byType[value] ?? 0) : records.length;
                            return (
                                <button
                                    key={value}
                                    type="button"
                                    aria-pressed={active}
                                    onClick={() => { setPage(1); router.get('/legislation', { q: q || undefined, type: value || undefined }, { preserveState: true }); }}
                                    className={`min-h-[58px] rounded-lg border p-2 text-left transition hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--municipal-focus)] ${filterToneClasses[tone]} ${active ? 'ring-2 ring-current/35' : ''}`}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <span className="truncate text-[11px] font-bold leading-4">{label}</span>
                                        <strong className="text-lg leading-none tabular-nums">{count}</strong>
                                    </div>
                                    <div className="mt-1 text-[9px] leading-3.5 opacity-75">{active ? 'Current view' : 'Open category'}</div>
                                </button>
                            );
                        })}
                    </nav>
                </section>

                <section className="rounded-lg bg-slate-100/70 p-1.5 dark:bg-slate-900/35" aria-label="Legislative record search">
                    <form onSubmit={search} className="flex min-w-0 flex-col gap-1 rounded-md bg-white px-1.5 py-0.5 @min-[520px]:flex-row @min-[520px]:items-center ring-1 ring-slate-200 focus-within:ring-2 focus-within:ring-[var(--municipal-focus)]/25 dark:bg-[#142236] dark:ring-slate-700">
                        <label htmlFor="legislative-search" className="sr-only">Search legislative records</label>
                        <Search className="ml-1 hidden shrink-0 text-slate-400 @min-[520px]:block" size={17} aria-hidden="true" />
                        <input
                            id="legislative-search"
                            value={q}
                            onChange={(event) => setQ(event.target.value)}
                            className="min-w-0 flex-1 bg-transparent px-1.5 py-1 text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100"
                            placeholder="Search number, title, subject, or keyword"
                        />
                        <button type="submit" className="w-full rounded-md bg-[var(--municipal-action-bg)] px-3 py-1 text-xs font-semibold text-[var(--municipal-action-text)] hover:bg-[var(--municipal-action-hover)] @min-[520px]:w-auto focus:outline-none focus:ring-2 focus:ring-[var(--municipal-focus)]/30">Search</button>
                    </form>
                </section>

                <section className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-[#142236]" aria-labelledby="legislative-register-heading">
                    <div className="flex flex-col gap-1 border-b border-slate-100 px-3 py-2 dark:border-slate-700 @min-[720px]:flex-row @min-[720px]:items-center @min-[720px]:justify-between @min-[720px]:gap-3">
                        <h2 id="legislative-register-heading" className="shrink-0 text-xs font-bold text-slate-900 dark:text-slate-100">Ordinances & issuances register</h2>
                        <div className="text-[10px] leading-4 text-slate-500 dark:text-slate-400" aria-label="Loaded legislative result context" aria-live="polite">
                            Showing <strong className="font-semibold text-slate-700 dark:text-slate-300">{rangeStart}–{rangeEnd}</strong> of <strong className="font-semibold text-slate-700 dark:text-slate-300">{records.length}</strong> loaded
                        </div>
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-slate-700" aria-label="Legislative records">
                        {visibleRecords.map((record) => (
                        <Link
                            key={record.id}
                            href={`/legislation/${record.id}`}
                            aria-label={`${record.record_number}: ${record.title}`}
                            className="group grid min-w-0 gap-1.5 px-3 py-2 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[var(--municipal-focus)]/30 dark:hover:bg-slate-900/30 @min-[620px]:grid-cols-[minmax(0,1fr)_auto] @min-[620px]:items-center @min-[620px]:gap-3"
                        >
                            <div className="min-w-0">
                                <div className="text-sm font-semibold leading-4 text-slate-950 dark:text-slate-100">{record.title}</div>
                                <div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] leading-4 text-slate-500 dark:text-slate-400">
                                    <span className="font-bold text-[var(--municipal-brand)]">{record.record_number}</span>
                                    <span aria-hidden="true">·</span>
                                    <span>{record.record_type.replaceAll('_', ' ')} · {record.year} · {record.issuing_body}</span>
                                </div>
                            </div>
                            <div className="flex shrink-0 items-center gap-2 @min-[620px]:min-w-[8.5rem] @min-[620px]:justify-end">
                                <LegislativeRecordStatus status={record.status} />
                                <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 group-hover:text-[var(--municipal-brand)] dark:text-slate-400">Open <ArrowRight size={14} aria-hidden="true" /></span>
                            </div>
                        </Link>
                    ))}
                        {records.length === 0 && (
                            <div className="px-4 py-10 text-center">
                                <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">No legislative records match this view.</div>
                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Try a different search term or record type.</p>
                            </div>
                        )}
                    </div>
                    <LegislativePager page={page} pageCount={pageCount} onPageChange={setPage} />
                </section>

                    <LegislativeCalendarPanel />
                </div>
            </PageFrame>
        </AppLayout>
    );
}
