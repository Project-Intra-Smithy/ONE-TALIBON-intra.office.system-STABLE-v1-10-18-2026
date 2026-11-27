import {formatDatePH} from '../../lib/format';
export type PlanProfileRecord={documentRef:string;sbResolutionNo?:string;sbAdoptedDate?:string;mdcResolutionNo?:string;higherReviewRef?:string;authority:string;leadOffice:string;coordinatingOffices:string[];lastAction:string;lastActionDate:string;nextMilestone:string;nextMilestoneDate:string;requiredAction:string};
export default function PlanProfile({plan}:{plan:PlanProfileRecord}){return (
                        <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
                            {[
                                ['Document Control Ref.', plan.documentRef],
                                ['SB Adoption Resolution', plan.sbResolutionNo ? `${plan.sbResolutionNo}${plan.sbAdoptedDate ? ` (${formatDatePH(plan.sbAdoptedDate)})` : ''}` : 'Not supplied by the current record'],
                                ['MDC Endorsement', plan.mdcResolutionNo || 'Not supplied by the current record'],
                                ['Higher-LGU Concurrence', plan.higherReviewRef || 'Not supplied by the current record'],
                                ['Authority reference', plan.authority],
                                ['Lead Office', plan.leadOffice],
                                ['Coordinating Offices', plan.coordinatingOffices.join('; ') || '—'],
                                ['Last Action', `${plan.lastAction} (${formatDatePH(plan.lastActionDate)})`],
                                ['Next Milestone', `${plan.nextMilestone} (${formatDatePH(plan.nextMilestoneDate)})`],
                                ['Required Next Action', plan.requiredAction],
                            ].map(([label, value]) => (
                                <div
                                    key={label}
                                    className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-recessed)] p-3.5"
                                >
                                    <dt className="text-xs font-bold uppercase tracking-wide text-[var(--ink-secondary)]">
                                        {label}
                                    </dt>
                                    <dd className="mt-1.5 text-xs font-semibold leading-5 text-[var(--ink-primary)]">
                                        {value}
                                    </dd>
                                </div>
                            ))}
                        </dl>
                    );}
