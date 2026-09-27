import { useMemo, useState } from 'react';
import { CalendarDays, Landmark, Search } from 'lucide-react';
import AppLayout from '../../layouts/AppLayout';
import PageFrame from '../../components/PageFrame';
import PageHeader from '../../components/PageHeader';
import LocalBodyDirectory from '../../components/local-bodies/LocalBodyDirectory';
import { localSpecialBodies } from '../../data/municipal/localBodies';

export default function Index() {
    const [query, setQuery] = useState('');
    const bodies = useMemo(() => {
        const value = query.trim().toLowerCase();
        if (!value) return localSpecialBodies;
        return localSpecialBodies.filter((body) => [body.name, body.mandate, body.chairRole, body.membershipSummary, body.recentAction, ...body.relatedDocuments].join(' ').toLowerCase().includes(value));
    }, [query]);

    const septemberMeetings = localSpecialBodies.filter((body) => body.nextMeeting.startsWith('2026-09')).length;

    return (
        <AppLayout title="Councils, Boards & Committees">
            <PageFrame density="compact">
                <PageHeader
                    eyebrow="Municipal organization"
                    title="Councils, Boards & Committees"
                    description="Reference directory for the municipality's formal local special bodies, with mandate, chair role, membership context, scheduled meeting, recent action, and related records."
                    icon={Landmark}
                />

                <section className="grid gap-2 sm:grid-cols-2" aria-label="Local special bodies summary">
                    <div className="flex min-h-[50px] items-center gap-2.5 rounded-lg border border-emerald-100 bg-emerald-50/80 px-3 py-2 text-emerald-950 dark:border-emerald-900/50 dark:bg-emerald-950/35 dark:text-emerald-200">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white/80 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                            <Landmark size={16} aria-hidden="true" />
                        </span>
                        <div>
                            <div className="text-[17px] font-extrabold leading-none tabular-nums">{localSpecialBodies.length}</div>
                            <div className="mt-1 text-[11px] font-semibold leading-none opacity-75">Formal bodies</div>
                        </div>
                    </div>

                    <div className="flex min-h-[50px] items-center gap-2.5 rounded-lg border border-amber-100 bg-amber-50/80 px-3 py-2 text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white/80 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                            <CalendarDays size={16} aria-hidden="true" />
                        </span>
                        <div>
                            <div className="text-[17px] font-extrabold leading-none tabular-nums">{septemberMeetings}</div>
                            <div className="mt-1 text-[11px] font-semibold leading-none opacity-75">September meetings</div>
                        </div>
                    </div>
                </section>

                <label className="relative block">
                    <span className="sr-only">Search councils, boards, and committees</span>
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                    <input
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Search body, mandate, chair role, or document"
                        className="min-h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm outline-none focus:border-[var(--municipal-brand)] focus:ring-2 focus:ring-[var(--municipal-focus)]/20 dark:border-slate-600 dark:bg-[#142236] dark:text-slate-100"
                    />
                </label>

                {bodies.length ? (
                    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-[#142236]" aria-labelledby="local-bodies-register-heading">
                        <div className="flex min-h-9 items-center justify-between gap-3 border-b border-slate-100 px-3 py-2 text-[11px] dark:border-slate-700">
                            <h2 id="local-bodies-register-heading" className="font-bold text-slate-900 dark:text-slate-100">Councils, boards & committees register</h2>
                            <div className="text-slate-500 dark:text-slate-400">
                                <span className="font-semibold text-slate-700 dark:text-slate-200">{bodies.length}</span> {bodies.length === 1 ? 'body' : 'bodies'}
                            </div>
                        </div>
                        <LocalBodyDirectory bodies={bodies} />
                    </section>
                ) : (
                    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-[#142236] dark:text-slate-400">
                        No councils, boards, or committees match the current search.
                    </div>
                )}
            </PageFrame>
        </AppLayout>
    );
}
