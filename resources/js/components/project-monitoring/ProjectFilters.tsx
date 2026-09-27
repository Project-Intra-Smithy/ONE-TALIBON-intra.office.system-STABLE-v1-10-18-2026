import { Search, X } from 'lucide-react';
import { projectOptions } from '../../data/municipal/projects';
import type { ProjectFilters as Filters } from '../../data/municipal/projects.types';

const field = 'min-h-11 min-w-0 rounded-[var(--municipal-radius-surface)] border border-[var(--municipal-border)] bg-[var(--municipal-surface)] px-3 text-sm text-[var(--municipal-text)] outline-none focus:border-[var(--municipal-focus)] focus:ring-2 focus:ring-[var(--municipal-focus)]/20';

export default function ProjectFilters({ filters, onChange }: { filters: Filters; onChange: (value: Filters) => void }) {
    const set = (key: keyof Filters, value: string) => onChange({ ...filters, [key]: value });
    const reset = () => onChange({ query: '', office: '', funding: '', status: '', location: '' });
    return <section className="municipal-panel p-3" aria-label="Project filters">
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-[minmax(260px,1.35fr)_1fr_1fr_1fr_1fr]">
            <label className="relative"><span className="sr-only">Search projects</span><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--municipal-muted)]" /><input className={`${field} w-full pl-9`} value={filters.query} onChange={(event) => set('query', event.target.value)} placeholder="Search projects" /></label>
            <select className={field} value={filters.office} onChange={(event) => set('office', event.target.value)} aria-label="Office"><option value="">All offices</option>{projectOptions.offices.map((value) => <option key={value}>{value}</option>)}</select>
            <select className={field} value={filters.status} onChange={(event) => set('status', event.target.value)} aria-label="Status"><option value="">All statuses</option>{projectOptions.statuses.map((value) => <option key={value}>{value}</option>)}</select>
            <select className={field} value={filters.funding} onChange={(event) => set('funding', event.target.value)} aria-label="Funding source"><option value="">All funding</option>{projectOptions.funding.map((value) => <option key={value}>{value}</option>)}</select>
            <select className={field} value={filters.location} onChange={(event) => set('location', event.target.value)} aria-label="Location"><option value="">All locations</option>{projectOptions.locations.map((value) => <option key={value}>{value}</option>)}</select>
        </div>
        {Object.values(filters).some(Boolean) && <button type="button" onClick={reset} className="mt-2 inline-flex min-h-11 items-center gap-1.5 rounded-md px-2 text-xs font-bold text-[var(--municipal-brand)] hover:bg-[var(--municipal-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--municipal-focus)]/30"><X size={14} /> Clear filters</button>}
    </section>;
}
