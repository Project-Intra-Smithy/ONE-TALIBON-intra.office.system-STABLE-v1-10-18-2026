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
    const detailRegion = useRef<HTMLElement>(null);

    useEffect(() => {
        if (selectedPlanId) detailRegion.current?.focus();
    }, [selectedPlanId]);

    const leadOffices = useMemo(
        () => [...new Set(municipalPlans.map((plan) => plan.leadOffice))].sort((a, b) => a.localeCompare(b)),
        [],
    );

    const filteredPlans = useMemo(() => {
        const query = filters.query.trim().toLowerCase();
        return municipalPlans.filter((plan) => {
            const searchText = [
                plan.code,
                plan.title,
                plan.leadOffice,
                plan.documentRef,
                ...plan.coordinatingOffices,
            ].join(' ').toLowerCase();

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

    return (
        <AppLayout title="LGU Plans Library">
            <PageFrame width="standard" density="compact">
                <PageHeader
                    eyebrow="Municipality of Talibon"
                    title="LGU Plans Library"
                    description="Municipal development plans · Prototype reference data"
                    icon={ClipboardList}
                />
                <PlanFilterBar filters={filters} leadOffices={leadOffices} resultCount={filteredPlans.length} onChange={(nextFilters) => { setFilters(nextFilters); setSelectedPlanId(null); }} />
                <section aria-label="Plans library" className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {filteredPlans.map((plan) => <PlanCard key={plan.id} plan={plan} selected={selectedPlanId === plan.id} onSelect={() => setSelectedPlanId(selectedPlanId === plan.id ? null : plan.id)} />)}
                    {filteredPlans.length === 0 && <p role="status" className="py-3 text-sm text-[var(--municipal-muted)] sm:col-span-2 xl:col-span-3">No plans match the current filters.</p>}
                </section>
                {selectedPlan && (
                    <section id="selected-plan-details" key={selectedPlan.id} ref={detailRegion} tabIndex={-1} aria-labelledby="selected-plan-title" className="municipal-panel min-w-0 p-3 focus:outline focus:outline-2 focus:outline-[var(--municipal-brand)]">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0">
                                <h2 id="selected-plan-title" className="break-words text-sm font-bold">{selectedPlan.code} / {selectedPlan.title}</h2>
                                <p className="mt-1 text-xs text-[var(--municipal-muted)]">Plan reference details</p>
                            </div>
                            <button type="button" className="min-h-11 px-3 text-xs font-semibold text-[var(--municipal-brand)]" onClick={() => {
                                document.getElementById(`plan-trigger-${selectedPlan.id}`)?.focus();
                                setSelectedPlanId(null);
                            }}>Close details</button>
                        </div>
                        <dl className="mt-3 grid gap-3 text-sm leading-6 sm:grid-cols-2">
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
                            ].map(([label, value]) => <div key={label} className="min-w-0"><dt className="text-xs font-semibold">{label}</dt><dd className="break-words text-[var(--municipal-muted)]">{value}</dd></div>)}
                        </dl>
                    </section>
                )}
                <details className="group min-w-0 border-t border-[var(--municipal-border)] text-[var(--municipal-muted)]">
                    <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 text-[13px] font-semibold marker:hidden">
                        <span>Planning context</span>
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
        </AppLayout>
    );
}
