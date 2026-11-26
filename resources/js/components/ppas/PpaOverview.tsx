import { Building2, CalendarRange, Landmark } from 'lucide-react';
import { formatPHP } from '../../lib/format';
export type PpaOverviewRecord = {expectedOutputs?:string;implementationContext:string;fundingSource:string;budgetPs?:number;budgetMooe?:number;budgetCo?:number;budgetTotal?:number;ccaAmount?:number;ccmAmount?:number;responsibleOffice:string;scheduleStart?:string;scheduleEnd?:string};
const formatPhpCurrency=(value:number|undefined)=>value===undefined?'Not supplied':formatPHP(value);
export default function PpaOverview({record}:{record:PpaOverviewRecord}){return (
                        <div className="space-y-4">
                            <section className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-recessed)] p-4">
                                <p className="text-xs font-bold uppercase tracking-wider text-[var(--brand-ink)]">
                                    Expected outputs (Deliverables)
                                </p>
                                <p className="mt-1.5 text-sm font-medium leading-6 text-[var(--ink-primary)]">
                                    {record.expectedOutputs || 'Not supplied by the current server record'}
                                </p>
                                <p className="mt-2 border-t border-[var(--border-default)] pt-2 text-xs leading-5 text-[var(--ink-secondary)]">
                                    {record.implementationContext}
                                </p>
                            </section>

                            <section className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-recessed)] p-4">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--brand-ink)]">
                                        <Landmark size={13} aria-hidden="true" />
                                        <span>Indicative AIP Budget Breakdown</span>
                                    </p>
                                    <span className="text-xs font-semibold text-[var(--ink-secondary)]">
                                        {record.fundingSource}
                                    </span>
                                </div>

                                <dl className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                                    {[
                                        ['PS', formatPhpCurrency(record.budgetPs)],
                                        ['MOOE', formatPhpCurrency(record.budgetMooe)],
                                        ['CO', formatPhpCurrency(record.budgetCo)],
                                        ['Total', formatPhpCurrency(record.budgetTotal)],
                                    ].map(([label, amount]) => (
                                        <div
                                            key={label}
                                            className={`rounded-lg border p-2.5 ${
                                                label === 'Total'
                                                    ? 'border-[var(--brand-soft-border)] bg-[var(--brand-soft)]'
                                                    : 'border-[var(--border-default)] bg-[var(--surface-card)]'
                                            }`}
                                        >
                                            <dt className="text-xs font-bold uppercase tracking-wide text-[var(--ink-secondary)]">
                                                {label}
                                            </dt>
                                            <dd
                                                className={`mt-1 font-mono text-xs font-extrabold tabular-nums ${
                                                    label === 'Total' ? 'text-[var(--brand-ink)]' : 'text-[var(--ink-primary)]'
                                                }`}
                                            >
                                                {amount}
                                            </dd>
                                        </div>
                                    ))}
                                </dl>

                                {(record.ccaAmount || record.ccmAmount) && (
                                    <div className="mt-3 flex flex-wrap gap-2 border-t border-[var(--border-default)] pt-2.5 text-xs text-[var(--ink-secondary)]">
                                        {record.ccaAmount ? (
                                            <span>
                                                Climate Adaptation (CCA): <strong className="font-mono text-[var(--ink-primary)]">{formatPhpCurrency(record.ccaAmount)}</strong>
                                            </span>
                                        ) : null}
                                        {record.ccmAmount ? (
                                            <span>
                                                Climate Mitigation (CCM): <strong className="font-mono text-[var(--ink-primary)]">{formatPhpCurrency(record.ccmAmount)}</strong>
                                            </span>
                                        ) : null}
                                    </div>
                                )}
                            </section>

                            <dl className="grid gap-3 sm:grid-cols-2">
                                <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-recessed)] p-3.5">
                                    <dt className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[var(--ink-secondary)]">
                                        <Building2 size={13} aria-hidden="true" className="text-[var(--brand-ink)]" />
                                        <span>Implementing Office</span>
                                    </dt>
                                    <dd className="mt-1.5 text-sm font-semibold text-[var(--ink-primary)]">
                                        {record.responsibleOffice}
                                    </dd>
                                </div>
                                <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-recessed)] p-3.5">
                                    <dt className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[var(--ink-secondary)]">
                                        <CalendarRange size={13} aria-hidden="true" className="text-[var(--brand-ink)]" />
                                        <span>Implementation Schedule</span>
                                    </dt>
                                    <dd className="mt-1.5 text-sm font-semibold text-[var(--ink-primary)]">
                                        {record.scheduleStart ?? 'Start date unavailable'} – {record.scheduleEnd ?? 'End date unavailable'}
                                    </dd>
                                </div>
                            </dl>

                            <p className="rounded-lg border border-dashed border-[var(--border-default)] px-3.5 py-2.5 text-xs leading-5 text-[var(--ink-secondary)]">
                                Indicative AIP planning allocation — not a live accounting obligation or disbursement record. No completion percentage is recorded for PPAs; reference records do not represent verified live project progress.
                            </p>
                        </div>
                    );}
