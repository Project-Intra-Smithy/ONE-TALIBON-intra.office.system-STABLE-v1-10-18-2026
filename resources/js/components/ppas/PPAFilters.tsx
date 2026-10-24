import { Search, X } from 'lucide-react';
import type { PPAFilters as FilterState } from '../../data/municipal/ppas.types';
import { ppaOptions } from '../../data/municipal/ppas';

const selectClass = 'min-h-11 min-w-0 rounded-[var(--municipal-radius-surface)] border border-[var(--municipal-border)] bg-[var(--municipal-surface)] px-3 text-sm text-[var(--municipal-text)] outline-none focus:border-[var(--municipal-focus)] focus:ring-2 focus:ring-[var(--municipal-focus)]/20';

type Props = { filters: FilterState; onChange: (next: FilterState) => void };

export default function PPAFilters({ filters, onChange }: Props) {
    const set = (key: keyof FilterState, value: string) => onChange({ ...filters, [key]: value });
    const reset = () => onChange({ query: '', sector: '', office: '', year: '', plan: '', fundingSource: '', status: '' });
    const hasFilters = Object.values(filters).some(Boolean);

    return <section className="municipal-panel ot-r6-filter-panel r8-ppas-filters p-3" aria-label="PPA filters">
        <div className="r8-ppas-filter-grid grid gap-2 md:grid-cols-2 xl:grid-cols-[minmax(280px,1.4fr)_1fr_150px_1fr]">
            <label className="relative">
                <span className="sr-only">Search PPAs</span>
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--municipal-muted)]" size={16} aria-hidden="true" />
                <input value={filters.query} onChange={(event) => set('query', event.target.value)} placeholder="Search title, office, sector, plan, or funding source" className={`${selectClass} w-full pl-9`} />
            </label>
            <select aria-label="Responsible office" value={filters.office} onChange={(event) => set('office', event.target.value)} className={selectClass}><option value="">All offices</option>{ppaOptions.offices.map((value) => <option key={value}>{value}</option>)}</select>
            <select aria-label="Year" value={filters.year} onChange={(event) => set('year', event.target.value)} className={selectClass}><option value="">All years</option>{ppaOptions.years.map((value) => <option key={value}>{value}</option>)}</select>
            <select aria-label="Status" value={filters.status} onChange={(event) => set('status', event.target.value)} className={selectClass}><option value="">All statuses</option>{ppaOptions.statuses.map((value) => <option key={value}>{value}</option>)}</select>
        </div>
        <details className="group mt-2 border-t border-[var(--municipal-border)] pt-2">
            <summary className="inline-flex min-h-11 cursor-pointer list-none items-center text-xs font-semibold text-[var(--municipal-brand)] marker:hidden">Advanced filters</summary>
            <div className="grid gap-2 md:grid-cols-3">
                <select aria-label="Sector" value={filters.sector} onChange={(event) => set('sector', event.target.value)} className={selectClass}><option value="">All sectors</option>{ppaOptions.sectors.map((value) => <option key={value}>{value}</option>)}</select>
                <select aria-label="Development plan" value={filters.plan} onChange={(event) => set('plan', event.target.value)} className={selectClass}><option value="">All plans</option>{ppaOptions.plans.map((value) => <option key={value}>{value}</option>)}</select>
                <select aria-label="Funding source" value={filters.fundingSource} onChange={(event) => set('fundingSource', event.target.value)} className={selectClass}><option value="">All funding sources</option>{ppaOptions.fundingSources.map((value) => <option key={value}>{value}</option>)}</select>
            </div>
        </details>
        {hasFilters && <button type="button" onClick={reset} className="mt-2 inline-flex min-h-11 items-center gap-1.5 rounded-md px-2 text-xs font-bold text-[var(--municipal-brand)] hover:bg-[var(--municipal-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--municipal-focus)]/30"><X size={14} aria-hidden="true" /> Clear filters</button>}
    </section>;
}
