import { RotateCcw, Search, SlidersHorizontal } from 'lucide-react';
import { useId } from 'react';
import type { PPAFilters as FilterState } from '../../data/municipal/ppas.types';

type Props = { filters: FilterState; onChange: (next: FilterState) => void; options: {offices:string[];years:Array<string|number>;statuses:string[];sectors:string[];fundingSources:string[]}; planOptions:Array<{value:string;label:string}> };

export default function PPAFilters({ filters, onChange, options:ppaOptions, planOptions }: Props) {
    const searchId = useId();
    const officeId = useId();
    const yearId = useId();
    const statusId = useId();
    const sectorId = useId();
    const planId = useId();
    const fundingId = useId();

    const set = (key: keyof FilterState, value: string) => onChange({ ...filters, [key]: value });
    const reset = () => onChange({ query: '', sector: '', office: '', year: '', plan: '', fundingSource: '', status: '' });
    const hasFilters = Object.values(filters).some(Boolean);
    const advancedCount = [filters.sector, filters.plan, filters.fundingSource].filter(Boolean).length;

    return (
        <search>
            <section className="tcds-card space-y-3 p-4" aria-label="PPA filters">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(280px,1.5fr)_1fr_150px_1fr]">
                    <div className="relative">
                        <label htmlFor={searchId} className="sr-only">Search PPAs</label>
                        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-secondary)]" size={16} aria-hidden="true" />
                        <input
                            id={searchId}
                            type="search"
                            value={filters.query}
                            onChange={(event) => set('query', event.target.value)}
                            placeholder="Search title, office, sector, plan, or funding source…"
                            className="min-h-11 tcds-input pl-9"
                        />
                    </div>
                    <div>
                        <label htmlFor={officeId} className="sr-only">Responsible office</label>
                        <select id={officeId} aria-label="Responsible office" value={filters.office} onChange={(event) => set('office', event.target.value)} className="min-h-11 tcds-input">
                            <option value="">All offices</option>
                            {ppaOptions.offices.map((value) => <option key={value}>{value}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor={yearId} className="sr-only">Year</label>
                        <select id={yearId} aria-label="Year" value={filters.year} onChange={(event) => set('year', event.target.value)} className="min-h-11 tcds-input">
                            <option value="">All years</option>
                            {ppaOptions.years.map((value) => <option key={value}>{value}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor={statusId} className="sr-only">Status</label>
                        <select id={statusId} aria-label="Status" value={filters.status} onChange={(event) => set('status', event.target.value)} className="min-h-11 tcds-input">
                            <option value="">All statuses</option>
                            {ppaOptions.statuses.map((value) => <option key={value}>{value}</option>)}
                        </select>
                    </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border-default)] pt-3">
                    <details className="group flex-1">
                        <summary className="inline-flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-lg border border-[var(--border-control)] bg-[var(--surface-recessed)] px-3 text-xs font-semibold text-[var(--ink-primary)] transition-colors hover:bg-[var(--surface-hover)] marker:hidden">
                            <SlidersHorizontal size={14} aria-hidden="true" />
                            <span>Advanced filters{advancedCount > 0 ? ` (${advancedCount})` : ''}</span>
                        </summary>
                        <div className="mt-3 grid gap-3 md:grid-cols-3">
                            <div>
                                <label htmlFor={sectorId} className="mb-1 block text-xs font-bold uppercase tracking-wide text-[var(--ink-secondary)]">Sector</label>
                                <select id={sectorId} aria-label="Sector" value={filters.sector} onChange={(event) => set('sector', event.target.value)} className="min-h-11 tcds-input">
                                    <option value="">All sectors</option>
                                    {ppaOptions.sectors.map((value) => <option key={value}>{value}</option>)}
                                </select>
                            </div>
                            <div>
                                <label htmlFor={planId} className="mb-1 block text-xs font-bold uppercase tracking-wide text-[var(--ink-secondary)]">Development plan</label>
                                <select id={planId} aria-label="Development plan" value={filters.plan} onChange={(event) => set('plan', event.target.value)} className="min-h-11 tcds-input">
                                    <option value="">All plans</option>
                                    {planOptions.map(option=><option key={option.value} value={option.value}>{option.label}</option>)}
                                </select>
                            </div>
                            <div>
                                <label htmlFor={fundingId} className="mb-1 block text-xs font-bold uppercase tracking-wide text-[var(--ink-secondary)]">Funding source</label>
                                <select id={fundingId} aria-label="Funding source" value={filters.fundingSource} onChange={(event) => set('fundingSource', event.target.value)} className="min-h-11 tcds-input">
                                    <option value="">All funding sources</option>
                                    {ppaOptions.fundingSources.map((value) => <option key={value}>{value}</option>)}
                                </select>
                            </div>
                        </div>
                    </details>

                    {hasFilters && (
                        <button type="button" onClick={reset} className="municipal-secondary-button">
                            <RotateCcw size={14} aria-hidden="true" />
                            <span>Clear filters</span>
                        </button>
                    )}
                </div>
            </section>
        </search>
    );
}
