import {Link} from '@inertiajs/react';
import {ArrowUpRight,CheckCircle2,Map} from 'lucide-react';
export type PlanChaptersRecord={sectionsComplete:number;sectionsTotal:number;chapterNotes?:string[];documentRef:string};
export type LinkedPlanMap={id:string;code:string;title:string;scale:string;effectivePeriod:string;href:string};
export default function PlanChaptersMaps({plan,linkedMaps,linksUnavailable=false}:{plan:PlanChaptersRecord;linkedMaps:LinkedPlanMap[];linksUnavailable?:boolean}){const pct=Math.min(100,Math.max(0,Math.round(plan.sectionsComplete/Math.max(1,plan.sectionsTotal)*100)));return (
                        <div className="grid gap-4 lg:grid-cols-2">
                            <section className="space-y-3 rounded-xl border border-[var(--border-default)] bg-[var(--surface-recessed)] p-4">
                                <div className="flex items-center justify-between gap-2">
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--brand-ink)]">
                                        Chapter &amp; Section Completion
                                    </h3>
                                    <span className="font-mono text-xs font-bold text-[var(--ink-primary)]">
                                        {plan.sectionsComplete} / {plan.sectionsTotal} ({pct}%)
                                    </span>
                                </div>
                                <div className="h-2.5 w-full overflow-hidden rounded-full bg-[var(--surface-card)]">
                                    <div
                                        className="h-full rounded-full bg-[var(--brand-primary)] transition-[width]"
                                        style={{ width: `${pct}%` }}
                                    />
                                </div>
                                {plan.chapterNotes && plan.chapterNotes.length > 0 ? (
                                    <ul className="space-y-2 pt-1">
                                        {plan.chapterNotes.map((note) => (
                                            <li key={note} className="flex items-start gap-2 text-xs leading-5 text-[var(--ink-primary)]">
                                                <CheckCircle2 size={14} aria-hidden="true" className="mt-0.5 shrink-0 text-[var(--brand-ink)]" />
                                                <span>{note}</span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-xs leading-5 text-[var(--ink-secondary)]">
                                        Chapter narratives are not supplied by this record. Document reference <span className="font-mono">{plan.documentRef}</span>.
                                    </p>
                                )}
                            </section>

                            <section className="space-y-3 rounded-xl border border-[var(--border-default)] bg-[var(--surface-recessed)] p-4">
                                <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--brand-ink)]">
                                    <Map size={14} aria-hidden="true" />
                                    <span>Linked Spatial Planning Maps ({linkedMaps.length})</span>
                                </h3>
                                {linkedMaps.length === 0 ? (
                                    <p className="text-xs text-[var(--ink-secondary)]">
                                        {linksUnavailable ? 'Verified spatial map associations are not supplied by the current server contract.' : 'No spatial map plates are linked yet. Edit this plan to associate Talibon GIS plates.'}
                                    </p>
                                ) : (
                                    <ul className="space-y-2">
                                        {linkedMaps.map((map) => (
                                            <li
                                                key={map.id}
                                                className="flex items-center justify-between gap-3 rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] p-3"
                                            >
                                                <div className="min-w-0">
                                                    <p className="font-mono text-xs font-bold text-[var(--brand-ink)]">{map.code}</p>
                                                    <p className="truncate text-xs font-bold text-[var(--ink-primary)]">{map.title}</p>
                                                    <p className="text-xs text-[var(--ink-secondary)]">{map.scale} · {map.effectivePeriod}</p>
                                                </div>
                                                <Link
                                                    href={map.href}
                                                    className="municipal-secondary-button shrink-0"
                                                >
                                                    <span>Open Map</span>
                                                    <ArrowUpRight size={14} aria-hidden="true" />
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </section>
                        </div>
                    );}
