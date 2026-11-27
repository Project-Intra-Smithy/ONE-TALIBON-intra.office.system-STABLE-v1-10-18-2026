import { RotateCcw, Search } from 'lucide-react';
import { useId } from 'react';
import type { PlanHorizon, PlanStatus } from '../../data/municipal/plans';
import { planHorizons, planStatuses } from '../../data/municipal/plans';

export type PlanFilters = {
    query: string;
    status: string;
    horizon: 'All' | PlanHorizon;
    leadOffice: string;
};

type Props = {
    filters: PlanFilters;
    leadOffices: string[];
    resultCount: number;
    onChange: (filters: PlanFilters) => void;
    statuses?: string[];
};

export default function PlanFilterBar({ filters, leadOffices, resultCount, onChange, statuses = planStatuses }: Props) {
    const queryId = useId();
    const statusId = useId();
    const horizonId = useId();
    const officeId = useId();
    const hasFilters = filters.query !== '' || filters.status !== 'All' || filters.horizon !== 'All' || filters.leadOffice !== 'All';

    return (
        <search>
            <section aria-label="Plan register filters" className="tcds-card space-y-3 p-4">
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 xl:items-end">
                    <div>
                        <label htmlFor={queryId} className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[var(--ink-secondary)]">
                            Search plans
                        </label>
                        <div className="relative">
                            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-secondary)]" size={16} aria-hidden="true" />
                            <input
                                id={queryId}
                                type="search"
                                value={filters.query}
                                onChange={(event) => onChange({ ...filters, query: event.target.value })}
                                placeholder="Code, plan, office, or reference…"
                                className="min-h-11 tcds-input pl-9"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor={statusId} className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[var(--ink-secondary)]">
                            Status
                        </label>
                        <select
                            id={statusId}
                            value={filters.status}
                            onChange={(event) => onChange({ ...filters, status: event.target.value as PlanFilters['status'] })}
                            className="min-h-11 tcds-input"
                        >
                            {statuses.map((status) => <option key={status}>{status}</option>)}
                        </select>
                    </div>

                    <div>
                        <label htmlFor={horizonId} className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[var(--ink-secondary)]">
                            Planning horizon
                        </label>
                        <select
                            id={horizonId}
                            value={filters.horizon}
                            onChange={(event) => onChange({ ...filters, horizon: event.target.value as PlanFilters['horizon'] })}
                            className="min-h-11 tcds-input"
                        >
                            {planHorizons.map((horizon) => <option key={horizon}>{horizon}</option>)}
                        </select>
                    </div>

                    <div>
                        <label htmlFor={officeId} className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[var(--ink-secondary)]">
                            Lead office
                        </label>
                        <select
                            id={officeId}
                            value={filters.leadOffice}
                            onChange={(event) => onChange({ ...filters, leadOffice: event.target.value })}
                            className="min-h-11 tcds-input"
                        >
                            <option>All</option>
                            {leadOffices.map((office) => <option key={office}>{office}</option>)}
                        </select>
                    </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border-default)] pt-2.5">
                    <span className="text-xs font-semibold text-[var(--ink-secondary)]">
                        {resultCount} {resultCount === 1 ? 'plan record' : 'plan records'}
                    </span>
                    {hasFilters && (
                        <button
                            type="button"
                            onClick={() => onChange({ query: '', status: 'All', horizon: 'All', leadOffice: 'All' })}
                            className="municipal-secondary-button"
                        >
                            <RotateCcw size={14} aria-hidden="true" />
                            <span>Clear filters</span>
                        </button>
                    )}
                </div>
            </section>
        </search>
    );
}
