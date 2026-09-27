import type { MunicipalProject } from '../../data/municipal/projects.types';

export default function ProjectSummary({ projects }: { projects: MunicipalProject[] }) {
    const items = [
        ['Total projects', projects.length],
        ['Ongoing', projects.filter((item) => item.status === 'Ongoing').length],
        ['Completed', projects.filter((item) => item.status === 'Completed').length],
        ['Delayed', projects.filter((item) => item.status === 'Delayed').length],
        ['Offices', new Set(projects.map((item) => item.responsibleOffice)).size],
        ['Locations', new Set(projects.map((item) => item.location)).size],
    ] as const;
    return <section className="flex flex-wrap gap-x-5 gap-y-2 text-xs" aria-label="Project monitoring summary">
        {items.map(([label, value]) => <span key={label} className="text-[var(--municipal-muted)]"><strong className="mr-1 text-[var(--municipal-text)]">{value}</strong>{label}</span>)}
    </section>;
}
