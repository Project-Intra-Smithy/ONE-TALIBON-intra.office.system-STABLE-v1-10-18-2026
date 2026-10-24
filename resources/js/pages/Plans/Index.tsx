import '../../../css/ot-r6-modules.css';
import '../../../css/r8-plans.css';
import { ClipboardList } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import PageFrame from '../../components/PageFrame';
import PageHeader from '../../components/PageHeader';
import PlanCoverageSummary from '../../components/plans/PlanCoverageSummary';
import PlanFilterBar, { type PlanFilters } from '../../components/plans/PlanFilterBar';
import PlanMetricGrid from '../../components/plans/PlanMetricGrid';
import PlanMilestoneQueue from '../../components/plans/PlanMilestoneQueue';
import PlanCard from '../../components/plans/PlanCard';
import { getPlanMetrics, municipalPlans } from '../../data/municipal/plans';
import AppLayout from '../../layouts/AppLayout';

const initialFilters: PlanFilters = {
    query: '',
    status: 'All',
    horizon: 'All',
    leadOffice: 'All',
};

export default function PlansIndex() {
    const [filters, setFilters] = useState<PlanFilters>(() => ({ ...initialFilters, query: typeof window === 'undefined' ? '' : new URLSearchParams(window.location.search).get('search') ?? '' }));
    const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
    const dialogRef = useRef<HTMLDivElement>(null);
    const closeButtonRef = useRef<HTMLButtonElement>(null);

    const leadOffices = useMemo(
        () => [...new Set(municipalPlans.map((plan) => plan.leadOffice))].sort((a, b) => a.localeCompare(b)),
        [],
    );

    const filteredPlans = useMemo(() => {
        const query = filters.query.trim().toLowerCase();
        return municipalPlans.filter((plan) => {
            const searchText = [plan.code, plan.title, plan.leadOffice, plan.documentRef, ...plan.coordinatingOffices].join(' ').toLowerCase();
            return (
                (!query || searchText.includes(query)) &&
                (filters.status === 'All' || plan.status === filters.status) &&
                (filters.horizon === 'All' || plan.horizon === filters.horizon) &&
                (filters.leadOffice === 'All' || plan.leadOffice === filters.leadOffice)
            );
        });
    }, [filters]);

    const selectedPlan = filteredPlans.find((plan) => plan.id === selectedPlanId);
    const metrics = useMemo(() => getPlanMetrics(filteredPlans), [filteredPlans]);

    const closePlanDetails = () => {
        const planId = selectedPlanId;
        setSelectedPlanId(null);
        if (planId && typeof window !== 'undefined') {
            window.requestAnimationFrame(() => document.getElementById(`plan-trigger-${planId}`)?.focus());
        }
    };

    useEffect(() => {
        if (!selectedPlanId || typeof document === 'undefined') return;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        closeButtonRef.current?.focus();

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                const planId = selectedPlanId;
                setSelectedPlanId(null);
                window.requestAnimationFrame(() => document.getElementById(`plan-trigger-${planId}`)?.focus());
                return;
            }
            if (event.key !== 'Tab' || !dialogRef.current) return;
            const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'));
            if (focusable.length === 0) {
                event.preventDefault();
                dialogRef.current.focus();
                return;
            }
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        };

        document.addEventListener('keydown', onKeyDown);
        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [selectedPlanId]);

    return (
        <AppLayout title="LGU Plans Library">
            <PageFrame width="wide" density="compact" className="ot-r6-modules ot-r6-plans r8-plans">
                <PageHeader eyebrow="Municipality of Talibon · Planning references" title="LGU Plans Library" description="Browse planning references by code, coverage, status, and lead office." icon={ClipboardList} />
                <div className="r8-plans-notice" role="note"><strong>Reference library only.</strong> Records shown here are not validated live municipal approvals. Covers are illustrative graphics, not scanned or certified documents.</div>
                <PlanFilterBar filters={filters} leadOffices={leadOffices} resultCount={filteredPlans.length} onChange={(nextFilters) => { setFilters(nextFilters); setSelectedPlanId(null); }} />
                <section aria-label="Plans library" className="ot-r6-plan-grid r8-plans-grid grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {filteredPlans.map((plan) => <PlanCard key={plan.id} plan={plan} selected={selectedPlanId === plan.id} onSelect={() => setSelectedPlanId(plan.id)} />)}
                    {filteredPlans.length === 0 && <div role="status" className="municipal-panel border-dashed p-8 text-center text-sm text-[var(--municipal-muted)] sm:col-span-2 xl:col-span-3"><strong className="block text-[var(--municipal-text)]">No matching plans</strong><span className="mt-1 block">Change the search or clear the filters to see the reference library.</span></div>}
                </section>
                <details className="group municipal-panel min-w-0 rounded-lg text-[var(--municipal-muted)]">
                    <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 text-[13px] font-semibold marker:hidden">
                        <span>Planning context · filtered reference records</span>
                        <span className="text-xs text-[var(--municipal-brand)] group-open:hidden">Show</span>
                        <span className="hidden text-xs text-[var(--municipal-brand)] group-open:inline">Hide</span>
                    </summary>
                    <div className="space-y-3 border-t border-[var(--municipal-border)] p-3">
                        <PlanMetricGrid metrics={metrics} />
                        <PlanCoverageSummary plans={filteredPlans} />
                        <PlanMilestoneQueue plans={filteredPlans} />
                    </div>
                </details>
            </PageFrame>

            {selectedPlan && (
                <div className="r8-plans-dialog-backdrop fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/45 p-3 sm:p-5" onMouseDown={(event) => { if (event.currentTarget === event.target) closePlanDetails(); }}>
                    <div
                        id="selected-plan-details"
                        ref={dialogRef}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="selected-plan-title"
                        aria-describedby="selected-plan-description"
                        tabIndex={-1}
                        className="municipal-panel ot-r6-plan-dialog r8-plans-dialog max-h-[calc(100dvh-1.5rem)] w-full max-w-3xl overflow-y-auto rounded-[var(--municipal-radius-overlay)] border-[var(--municipal-border-strong)] bg-[var(--municipal-surface)] shadow-2xl sm:max-h-[calc(100vh-2.5rem)]"
                    >
                        <header className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-[var(--municipal-border)] bg-[var(--municipal-surface)] px-3 py-2.5 sm:px-4">
                            <div className="min-w-0">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--municipal-brand)]">{selectedPlan.code}</p>
                                <h2 id="selected-plan-title" className="mt-0.5 break-words text-base font-bold leading-6 text-[var(--municipal-text)]">{selectedPlan.title}</h2>
                                <p id="selected-plan-description" className="mt-0.5 text-[11px] text-[var(--municipal-muted)]">Reference data only · Not a validated live municipal approval or certified document.</p>
                            </div>
                            <button ref={closeButtonRef} type="button" onClick={closePlanDetails} className="min-h-11 shrink-0 rounded-md px-3 text-xs font-semibold text-[var(--municipal-brand)] hover:bg-[var(--municipal-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2" aria-label={`Close details for ${selectedPlan.code}`}>Close</button>
                        </header>

                        <dl className="grid gap-x-5 gap-y-2.5 p-3 text-[13px] leading-5 sm:grid-cols-2 sm:p-4">
                            {[
                                ['Planning horizon', selectedPlan.horizon],
                                ['Lead office', selectedPlan.leadOffice],
                                ['Coverage', selectedPlan.coverageStart === selectedPlan.coverageEnd ? String(selectedPlan.coverageStart) : `${selectedPlan.coverageStart} - ${selectedPlan.coverageEnd}`],
                                ['Recorded status', selectedPlan.status],
                                ['Document reference', selectedPlan.documentRef],
                                ['Authority / adoption', selectedPlan.authority],
                                ['Next milestone', `${selectedPlan.nextMilestone} / ${selectedPlan.nextMilestoneDate}`],
                                ['Required action', selectedPlan.requiredAction],
                                ['Coordinating offices', selectedPlan.coordinatingOffices.join('; ')],
                                ['Last action', `${selectedPlan.lastAction} / ${selectedPlan.lastActionDate}`],
                                ['Record completion', `${selectedPlan.sectionsComplete} of ${selectedPlan.sectionsTotal} sections`],
                            ].map(([label, value]) => (
                                <div key={label} className="min-w-0">
                                    <dt className="text-[11px] font-semibold text-[var(--municipal-text)]">{label}</dt>
                                    <dd className="break-words text-[var(--municipal-muted)]">{value}</dd>
                                </div>
                            ))}
                        </dl>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
