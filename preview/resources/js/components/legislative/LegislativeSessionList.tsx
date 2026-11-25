import { useEffect, useState } from 'react';
import LegislativePager from './LegislativePager';
import LegislativeSessionCard from './LegislativeSessionCard';

import type { LegislativeSession } from './types';
const SESSIONS_PER_PAGE = 10;

export default function LegislativeSessionList({ sessions, canManage }: { sessions: LegislativeSession[]; canManage: boolean }) {
    const [page, setPage] = useState(1);
    const pageCount = Math.max(1, Math.ceil(sessions.length / SESSIONS_PER_PAGE));
    const visible = sessions.slice((page - 1) * SESSIONS_PER_PAGE, page * SESSIONS_PER_PAGE);
    const start = sessions.length === 0 ? 0 : (page - 1) * SESSIONS_PER_PAGE + 1;
    const end = Math.min(page * SESSIONS_PER_PAGE, sessions.length);

    useEffect(() => { if (page > pageCount) setPage(pageCount); }, [page, pageCount]);

    return (
        <section className="space-y-2" aria-labelledby="legislative-sessions-heading">
            <div className="flex flex-wrap items-end justify-between gap-2"><div><div className="text-xs font-bold uppercase tracking-wide text-[var(--status-info-fg)]">Session register</div><h2 id="legislative-sessions-heading" className="mt-0.5 text-sm font-bold text-[var(--ink-primary)]">Loaded legislative sessions</h2></div><span className="text-xs text-slate-400" aria-live="polite">Showing {start}–{end} of {sessions.length}</span></div>
            <div className="space-y-2">{visible.map((session) => <LegislativeSessionCard key={session.id} session={session} canManage={canManage} />)}{sessions.length === 0 && <div className="rounded-xl bg-slate-100/70 px-4 py-5 text-center text-sm text-slate-500 dark:bg-[var(--surface-card)] dark:text-[var(--ink-secondary)]">No legislative sessions are loaded.</div>}</div>
            {pageCount > 1 && <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-[var(--border-control)] dark:bg-[var(--surface-card)]"><LegislativePager page={page} pageCount={pageCount} onPageChange={setPage} label="Session pages" /></div>}
        </section>
    );
}
