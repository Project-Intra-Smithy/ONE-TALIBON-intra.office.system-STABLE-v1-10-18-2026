import { CalendarDays, FileText, Landmark, UsersRound } from 'lucide-react';
import type { LocalSpecialBody } from '../../data/municipal/localBodies';

export default function LocalBodyDirectory({ bodies }: { bodies: LocalSpecialBody[] }) {
    return (
        <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {bodies.map((body) => (
                <article
                    key={body.id}
                    className="grid min-w-0 gap-2 px-3 py-2.5 transition-colors hover:bg-emerald-50/30 dark:hover:bg-slate-900/30 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,.9fr)] lg:gap-4"
                >
                    <div className="min-w-0">
                        <div className="flex min-w-0 items-start gap-2.5">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[var(--municipal-brand-soft)] text-[var(--municipal-brand)]">
                                <Landmark size={15} aria-hidden="true" />
                            </div>
                            <div className="min-w-0">
                                <div className="text-[9px] font-bold uppercase tracking-[0.06em] text-slate-400">{body.id}</div>
                                <h3 className="mt-0.5 text-sm font-bold leading-5 text-slate-950 dark:text-slate-100">{body.name}</h3>
                                <div className="mt-0.5 text-[11px] font-semibold text-[var(--municipal-brand)]">Chair: {body.chairRole}</div>
                            </div>
                        </div>
                        <p className="mt-1.5 text-xs leading-4.5 text-slate-600 dark:text-slate-300">{body.mandate}</p>
                    </div>

                    <dl className="grid min-w-0 content-start gap-x-3 gap-y-1.5 text-[11px] leading-4 sm:grid-cols-2">
                        <div className="flex min-w-0 gap-1.5 text-slate-600 dark:text-slate-300">
                            <UsersRound size={12} className="mt-0.5 shrink-0 text-slate-400" aria-hidden="true" />
                            <div className="min-w-0">
                                <dt className="inline font-bold text-slate-700 dark:text-slate-200">Membership: </dt>
                                <dd className="inline">{body.membershipSummary}</dd>
                            </div>
                        </div>

                        <div className="flex min-w-0 gap-1.5 text-slate-600 dark:text-slate-300">
                            <CalendarDays size={12} className="mt-0.5 shrink-0 text-slate-400" aria-hidden="true" />
                            <div className="min-w-0">
                                <dt className="inline font-bold text-slate-700 dark:text-slate-200">Scheduled: </dt>
                                <dd className="inline">{body.nextMeeting}</dd>
                            </div>
                        </div>

                        <div className="flex min-w-0 gap-1.5 text-slate-600 dark:text-slate-300 sm:col-span-2">
                            <FileText size={12} className="mt-0.5 shrink-0 text-slate-400" aria-hidden="true" />
                            <div className="min-w-0">
                                <dt className="inline font-bold text-slate-700 dark:text-slate-200">Documents: </dt>
                                <dd className="inline">{body.relatedDocuments.join(' · ')}</dd>
                            </div>
                        </div>

                        <div className="min-w-0 border-t border-slate-100 pt-1.5 text-slate-600 dark:border-slate-700 dark:text-slate-300 sm:col-span-2">
                            <dt className="inline font-bold text-slate-700 dark:text-slate-200">Recent action: </dt>
                            <dd className="inline">{body.recentAction}</dd>
                        </div>
                    </dl>
                </article>
            ))}
        </div>
    );
}
