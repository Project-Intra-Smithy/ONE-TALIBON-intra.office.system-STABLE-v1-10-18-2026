import { CalendarDays, FileText, Landmark, UsersRound } from 'lucide-react';
import type { LocalSpecialBody } from '../../data/municipal/localBodies';

export default function LocalBodyDirectory({ bodies }: { bodies: LocalSpecialBody[] }) {
    return <div className="space-y-2">{bodies.map((body) => (
        <article key={body.id} className="grid min-w-0 gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3 dark:border-slate-700 dark:bg-[#142236] lg:grid-cols-[minmax(0,1.1fr)_minmax(18rem,.9fr)] lg:items-start">
            <div className="min-w-0">
                <div className="flex min-w-0 items-start gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-200"><Landmark size={15} aria-hidden="true" /></div>
                    <div className="min-w-0">
                        <div className="text-[9px] font-bold uppercase tracking-wide text-slate-400">{body.id}</div>
                        <h2 className="mt-0.5 text-sm font-bold leading-5 text-slate-950 dark:text-slate-100">{body.name}</h2>
                        <div className="mt-0.5 text-[11px] font-semibold text-indigo-800 dark:text-indigo-300">Chair: {body.chairRole}</div>
                    </div>
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-600 dark:text-slate-300">{body.mandate}</p>
            </div>
            <div className="grid min-w-0 gap-1.5 text-xs sm:grid-cols-2">
                <div className="flex min-w-0 gap-2 rounded-lg bg-slate-50 px-2.5 py-2 text-slate-600 dark:bg-slate-900/40 dark:text-slate-300"><UsersRound size={13} className="mt-0.5 shrink-0 text-slate-400" aria-hidden="true" /><span>{body.membershipSummary}</span></div>
                <div className="flex min-w-0 gap-2 rounded-lg bg-slate-50 px-2.5 py-2 text-slate-600 dark:bg-slate-900/40 dark:text-slate-300"><CalendarDays size={13} className="mt-0.5 shrink-0 text-slate-400" aria-hidden="true" /><span><span className="font-semibold text-slate-700 dark:text-slate-200">Next meeting:</span> {body.nextMeeting}</span></div>
                <div className="flex min-w-0 gap-2 rounded-lg bg-slate-50 px-2.5 py-2 text-slate-600 dark:bg-slate-900/40 dark:text-slate-300 sm:col-span-2"><FileText size={13} className="mt-0.5 shrink-0 text-slate-400" aria-hidden="true" /><span className="min-w-0">{body.relatedDocuments.join(' · ')}</span></div>
                <div className="rounded-lg border border-slate-100 px-2.5 py-2 text-slate-600 dark:border-slate-700 dark:text-slate-300 sm:col-span-2"><span className="font-bold text-slate-700 dark:text-slate-200">Recent action: </span>{body.recentAction}</div>
            </div>
        </article>
    ))}</div>;
}
