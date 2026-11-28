import { useState } from 'react';
import { CalendarDays, ChevronRight, FileText, Landmark, UsersRound } from 'lucide-react';
import { Dialog } from '../ui';
import type { LocalSpecialBody } from '../../data/municipal/localBodies';

export default function LocalBodyDirectory({ bodies }: { bodies: LocalSpecialBody[] }) {
    const [selected, setSelected] = useState<LocalSpecialBody | null>(null);

    return (
        <>
            <div className="divide-y divide-[var(--border-default)]">
                {bodies.map((body) => (
                    <article
                        key={body.id}
                        className="grid min-w-0 gap-3 px-4 py-3.5 transition-colors hover:bg-[var(--surface-hover)] lg:grid-cols-[minmax(0,.9fr)_minmax(0,1.05fr)_auto] lg:items-start lg:gap-4"
                    >
                        <div className="min-w-0">
                            <div className="flex min-w-0 items-start gap-2.5">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--brand-soft)] text-[var(--brand-ink)]">
                                    <Landmark size={15} aria-hidden="true" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex min-w-0 flex-wrap items-baseline gap-2">
                                        <span className="shrink-0 font-mono text-xs font-bold uppercase tracking-wider text-[var(--ink-secondary)]">
                                            {body.id}
                                        </span>
                                        <h3 className="min-w-0 text-sm font-bold leading-5 text-[var(--ink-primary)]">
                                            {body.name}
                                        </h3>
                                    </div>
                                    <div className="mt-0.5 text-xs font-semibold leading-4 text-[var(--brand-ink)]">
                                        Chair: {body.chairRole}
                                    </div>
                                </div>
                            </div>
                            <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-[var(--ink-secondary)]">
                                {body.mandate}
                            </p>
                        </div>

                        <dl className="grid min-w-0 content-start gap-x-4 gap-y-1.5 text-xs leading-5 sm:grid-cols-2">
                            <div className="flex min-w-0 gap-1.5 text-[var(--ink-secondary)]">
                                <UsersRound size={12} className="mt-1 shrink-0 text-[var(--ink-muted)]" aria-hidden="true" />
                                <div className="min-w-0 line-clamp-2">
                                    <dt className="inline font-bold text-[var(--ink-primary)]">Membership: </dt>
                                    <dd className="inline">{body.membershipSummary}</dd>
                                </div>
                            </div>

                            <div className="flex min-w-0 gap-1.5 text-[var(--ink-secondary)]">
                                <CalendarDays size={12} className="mt-1 shrink-0 text-[var(--ink-muted)]" aria-hidden="true" />
                                <div className="min-w-0 line-clamp-2">
                                    <dt className="inline font-bold text-[var(--ink-primary)]">Scheduled: </dt>
                                    <dd className="inline">{body.nextMeeting}</dd>
                                </div>
                            </div>

                            <div className="flex min-w-0 gap-1.5 text-[var(--ink-secondary)]">
                                <FileText size={12} className="mt-1 shrink-0 text-[var(--ink-muted)]" aria-hidden="true" />
                                <div className="min-w-0 truncate">
                                    <dt className="inline font-bold text-[var(--ink-primary)]">Documents: </dt>
                                    <dd className="inline">{body.relatedDocuments.join(' · ')}</dd>
                                </div>
                            </div>

                            <div className="min-w-0 truncate text-[var(--ink-secondary)]">
                                <dt className="inline font-bold text-[var(--ink-primary)]">Recent: </dt>
                                <dd className="inline">{body.recentAction}</dd>
                            </div>
                        </dl>

                        <div className="flex items-center lg:justify-end">
                            <button
                                type="button"
                                onClick={() => setSelected(body)}
                                className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-[var(--border-control)] bg-[var(--surface-card)] px-3 py-1.5 text-xs font-semibold text-[var(--ink-primary)] hover:bg-[var(--surface-recessed)]"
                            >
                                <span>Details</span>
                                <ChevronRight size={14} aria-hidden="true" />
                            </button>
                        </div>
                    </article>
                ))}
            </div>

            <Dialog
                open={Boolean(selected)}
                onClose={() => setSelected(null)}
                size="lg"
                title={selected?.name ?? 'Local special body'}
                description={selected ? `${selected.id} · Chair: ${selected.chairRole}` : undefined}
            >
                {selected && (
                    <div className="space-y-4">
                        <section>
                            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--ink-secondary)]">Mandate</h3>
                            <p className="mt-1.5 text-sm leading-6 text-[var(--ink-primary)]">{selected.mandate}</p>
                        </section>

                        <dl className="grid gap-3 rounded-xl border border-[var(--border-default)] bg-[var(--surface-recessed)] p-4 text-sm sm:grid-cols-2">
                            <div>
                                <dt className="text-xs font-bold uppercase tracking-wider text-[var(--ink-secondary)]">Chair role</dt>
                                <dd className="mt-1 font-semibold text-[var(--ink-primary)]">{selected.chairRole}</dd>
                            </div>
                            <div>
                                <dt className="text-xs font-bold uppercase tracking-wider text-[var(--ink-secondary)]">Next scheduled meeting</dt>
                                <dd className="mt-1 font-semibold text-[var(--ink-primary)]">{selected.nextMeeting}</dd>
                            </div>
                            <div className="sm:col-span-2">
                                <dt className="text-xs font-bold uppercase tracking-wider text-[var(--ink-secondary)]">Membership composition</dt>
                                <dd className="mt-1 text-[var(--ink-primary)]">{selected.membershipSummary}</dd>
                            </div>
                            <div className="sm:col-span-2">
                                <dt className="text-xs font-bold uppercase tracking-wider text-[var(--ink-secondary)]">Recent action</dt>
                                <dd className="mt-1 text-[var(--ink-primary)]">{selected.recentAction}</dd>
                            </div>
                        </dl>

                        <section>
                            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--ink-secondary)]">Related reference documents</h3>
                            <ul className="mt-2 flex flex-wrap gap-2">
                                {selected.relatedDocuments.map((doc) => (
                                    <li
                                        key={doc}
                                        className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-default)] bg-[var(--surface-recessed)] px-3 py-1 text-xs font-semibold text-[var(--ink-primary)]"
                                    >
                                        <FileText size={12} aria-hidden="true" />
                                        <span>{doc}</span>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    </div>
                )}
            </Dialog>
        </>
    );
}
