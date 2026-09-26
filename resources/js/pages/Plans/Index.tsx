import { ClipboardList } from 'lucide-react';
import { useMemo, useState } from 'react';
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
                <PlanFilterBar filters={filters} leadOffices={leadOffices} resultCount={filteredPlans.length} onChange={setFilters} />
                <section aria-label="Plans library" className="municipal-panel grid min-w-0 items-start gap-3 p-3 sm:grid-cols-2 xl:grid-cols-3">
                    {filteredPlans.map((plan) => <PlanCard key={plan.id} plan={plan} />)}
                    {filteredPlans.length === 0 && <p role="status" className="py-3 text-sm text-[var(--municipal-muted)] sm:col-span-2 xl:col-span-3">No plans match the current filters.</p>}
                </section>
                <details className="municipal-panel group">
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
