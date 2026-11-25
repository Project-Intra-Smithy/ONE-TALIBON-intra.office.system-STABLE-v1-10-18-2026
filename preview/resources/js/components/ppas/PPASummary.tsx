import type { PPARecord } from '../../data/municipal/ppas.types';

export default function PPASummary({ records }: { records: PPARecord[] }) {
    const ongoing = records.filter((item) => item.status === 'Ongoing').length;
    const completed = records.filter((item) => item.status === 'Completed').length;
    const procurement = records.filter((item) => item.status === 'For Procurement').length;
    const projects = records.reduce((sum, item) => sum + item.relatedProjectCount, 0);
    const items = [
        ['Registered PPAs', records.length],
        ['Ongoing', ongoing],
        ['Completed', completed],
        ['For procurement', procurement],
        ['Related projects', projects],
    ] as const;

    return <section className="flex flex-wrap gap-x-5 gap-y-2 text-xs" aria-label="PPA summary">
        {items.map(([label, value]) => <span key={label} className="text-[var(--municipal-muted)]"><strong className="mr-1 text-[var(--municipal-text)]">{value}</strong>{label}</span>)}
    </section>;
}
