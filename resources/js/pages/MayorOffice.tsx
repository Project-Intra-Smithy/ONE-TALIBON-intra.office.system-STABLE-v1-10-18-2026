import { Link } from '@inertiajs/react';
import { AlertTriangle, ArrowRight, Building2, RotateCcw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { KpiCard, PageHeader, StatusBadge, toneForWorkState } from '../components/ui';
import AppLayout from '../layouts/AppLayout';
import { useVisiblePolling } from '../hooks/useVisiblePolling';
import { formatDateTimePH, humanizeSlug } from '../lib/format';

type Office = { name: string; short_name?: string | null };
type Tx = { id: number; reference_no: string; title: string; status: string; priority: string; due_at?: string | null; origin_department?: Office | null; current_department?: Office | null };
type Bottleneck = { current_department_id: number; open_count: number; current_department?: Office | null };
type Props = { queue: Tx[]; overdue: Tx[]; returned: Tx[]; bottlenecks: Bottleneck[]; stats: { forApproval: number; forReview: number; highPriority: number; total: number; municipalityOpen: number; municipalityOverdue: number; returnedOrInfoRequested: number } };

export default function MayorOffice(initial: Props) {
    const [live, setLive] = useState(initial);
    useEffect(() => setLive(initial), [initial.queue, initial.overdue, initial.returned, initial.bottlenecks, initial.stats]);
    useVisiblePolling(async (signal) => {
        const response = await fetch('/mayor-office/live', { credentials: 'same-origin', headers: { Accept: 'application/json' }, signal });
        if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) return;
        setLive(await response.json() as Props);
    }, 8000);

    const { queue, overdue, returned, bottlenecks, stats } = live;

    return (
        <AppLayout title="For Decision">
            <div className="mx-auto max-w-[1440px] space-y-5 px-4 py-5 sm:px-6">
                <PageHeader
                    eyebrow="Executive attention"
                    title="For Decision"
                    subtitle="Review executive decisions, overdue municipal work, and items returned for clarification."
                />

                <section aria-label="Executive workload summary" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    <KpiCard label="Executive queue" value={stats.total} hint="Awaiting executive action" accent="brand" />
                    <KpiCard label="Municipal open work" value={stats.municipalityOpen} hint="Across active LGU offices" accent="neutral" />
                    <KpiCard label="Municipal overdue" value={stats.municipalityOverdue} hint="Past target completion" accent="danger" />
                    <KpiCard label="Returned / info" value={stats.returnedOrInfoRequested} hint="Awaiting office clarification" accent="warn" />
                </section>

                <section className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)]">
                    <div className="tcds-card overflow-hidden">
                        <div className="border-b border-[var(--border-default)] px-5 py-4">
                            <div className="flex items-center gap-2">
                                <Building2 size={18} aria-hidden="true" className="text-[var(--brand-ink)]" />
                                <h2 className="text-base font-bold text-[var(--ink-primary)]">Items requiring executive attention</h2>
                            </div>
                            <p className="mt-1 text-xs text-[var(--ink-secondary)]">Executive queue ordered by urgency and due date.</p>
                        </div>
                        <div className="divide-y divide-[var(--border-default)]">
                            {queue.map((tx) => (
                                <Link
                                    key={tx.id}
                                    href={`/transactions/${tx.id}`}
                                    className="flex min-w-0 items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-[var(--surface-hover)]"
                                >
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="font-mono text-xs font-bold text-[var(--brand-ink)]">{tx.reference_no}</span>
                                            <StatusBadge tone={toneForWorkState(tx.status)}>{humanizeSlug(tx.status)}</StatusBadge>
                                        </div>
                                        <div className="mt-1 break-words text-sm font-semibold text-[var(--ink-primary)]">{tx.title}</div>
                                        <div className="mt-0.5 text-xs text-[var(--ink-secondary)]">
                                            {tx.origin_department?.short_name || tx.origin_department?.name || 'Origin not recorded'}
                                        </div>
                                    </div>
                                    <ArrowRight size={16} aria-hidden="true" className="shrink-0 text-[var(--ink-secondary)]" />
                                </Link>
                            ))}
                            {queue.length === 0 && (
                                <div className="p-8 text-center text-sm text-[var(--ink-secondary)]">No executive queue items.</div>
                            )}
                        </div>
                    </div>

                    <div className="tcds-card p-5">
                        <h2 className="text-base font-bold text-[var(--ink-primary)]">Office bottlenecks</h2>
                        <p className="mt-1 text-xs text-[var(--ink-secondary)]">Departments with highest open work volume.</p>
                        <div className="mt-4 space-y-2.5">
                            {bottlenecks.map((b, i) => (
                                <div key={`${b.current_department_id}-${i}`} className="flex min-w-0 items-center justify-between gap-3 rounded-lg border border-[var(--border-default)] bg-[var(--surface-recessed)] p-3">
                                    <div className="min-w-0 break-words text-sm font-semibold text-[var(--ink-primary)]">
                                        {b.current_department?.short_name || b.current_department?.name || 'Unassigned'}
                                    </div>
                                    <StatusBadge tone="warn">{b.open_count} open</StatusBadge>
                                </div>
                            ))}
                            {bottlenecks.length === 0 && (
                                <div className="text-sm text-[var(--ink-secondary)]">No current bottleneck data.</div>
                            )}
                        </div>
                    </div>
                </section>

                <section className="grid gap-5 xl:grid-cols-2">
                    <div className="tcds-card border-l-4 border-l-[var(--status-danger-bar)] p-5">
                        <div className="flex items-center gap-2">
                            <AlertTriangle size={18} aria-hidden="true" className="text-[var(--status-danger-fg)]" />
                            <h2 className="text-base font-bold text-[var(--ink-primary)]">Overdue across the municipality</h2>
                        </div>
                        <div className="mt-3 space-y-2.5">
                            {overdue.slice(0, 12).map((tx) => (
                                <Link
                                    key={tx.id}
                                    href={`/transactions/${tx.id}`}
                                    className="block min-w-0 rounded-lg border border-[var(--status-danger-border)] bg-[var(--status-danger-bg)] p-3 transition-colors hover:opacity-90"
                                >
                                    <div className="font-mono text-xs font-bold text-[var(--status-danger-fg)]">{tx.reference_no}</div>
                                    <div className="mt-1 break-words text-sm font-semibold text-[var(--ink-primary)]">{tx.title}</div>
                                    <div className="mt-1 text-xs text-[var(--status-danger-fg)]">
                                        {tx.current_department?.short_name || tx.current_department?.name || 'Office not recorded'} · Due {formatDateTimePH(tx.due_at)}
                                    </div>
                                </Link>
                            ))}
                            {overdue.length === 0 && <div className="text-sm text-[var(--ink-secondary)]">No overdue work.</div>}
                        </div>
                    </div>

                    <div className="tcds-card border-l-4 border-l-[var(--status-warn-bar)] p-5">
                        <div className="flex items-center gap-2">
                            <RotateCcw size={18} aria-hidden="true" className="text-[var(--status-warn-fg)]" />
                            <h2 className="text-base font-bold text-[var(--ink-primary)]">Returned / information requested</h2>
                        </div>
                        <div className="mt-3 space-y-2.5">
                            {returned.slice(0, 12).map((tx) => (
                                <Link
                                    key={tx.id}
                                    href={`/transactions/${tx.id}`}
                                    className="block min-w-0 rounded-lg border border-[var(--status-warn-border)] bg-[var(--status-warn-bg)] p-3 transition-colors hover:opacity-90"
                                >
                                    <div className="font-mono text-xs font-bold text-[var(--status-warn-fg)]">{tx.reference_no}</div>
                                    <div className="mt-1 break-words text-sm font-semibold text-[var(--ink-primary)]">{tx.title}</div>
                                    <div className="mt-1 text-xs text-[var(--status-warn-fg)]">
                                        {tx.current_department?.short_name || tx.current_department?.name || 'Office not recorded'} · {humanizeSlug(tx.status)}
                                    </div>
                                </Link>
                            ))}
                            {returned.length === 0 && <div className="text-sm text-[var(--ink-secondary)]">No unresolved returned work.</div>}
                        </div>
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}
