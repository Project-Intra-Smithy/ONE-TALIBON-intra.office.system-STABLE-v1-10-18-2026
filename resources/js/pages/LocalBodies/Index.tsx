import { useMemo, useState } from 'react';
import { Landmark, Search } from 'lucide-react';
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
    const upcoming = localSpecialBodies.filter((body) => body.nextMeeting.startsWith('2026-09')).length;

    return <AppLayout title="Councils, Boards & Committees"><PageFrame>
        <PageHeader
            eyebrow="Municipal organization"
            title="Councils, Boards & Committees"
            description="Reference directory for the municipality's formal local special bodies, with mandate, chair role, membership context, next meeting, recent action, and related records."
            icon={Landmark}
            aside={<div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-[#142236]"><span className="text-sm font-bold tabular-nums text-slate-950 dark:text-slate-100">{localSpecialBodies.length}</span><span className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Bodies</span><span className="text-slate-300 dark:text-slate-600" aria-hidden="true">•</span><span className="text-sm font-bold tabular-nums text-slate-950 dark:text-slate-100">{upcoming}</span><span className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Sept. meetings</span></div>}
        />
        <label className="relative block">
            <span className="sr-only">Search councils, boards, and committees</span>
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search body, mandate, chair role, or document" className="min-h-10 w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 text-sm outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-700/20 dark:border-slate-600 dark:bg-[#142236] dark:text-slate-100" />
        </label>
        {bodies.length ? <LocalBodyDirectory bodies={bodies} /> : <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-[#142236] dark:text-slate-400">No councils, boards, or committees match the current search.</div>}
    </PageFrame></AppLayout>;
}
