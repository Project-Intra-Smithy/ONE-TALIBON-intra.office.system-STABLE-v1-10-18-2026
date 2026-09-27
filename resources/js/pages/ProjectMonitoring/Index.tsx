import { FolderKanban } from 'lucide-react';
import { useMemo, useState } from 'react';
import PageFrame from '../../components/PageFrame';
import PageHeader from '../../components/PageHeader';
import OperationalRegister, { type OperationalItem, type OperationalSummary } from '../../components/project-monitoring/OperationalRegister';
import ProjectDetailPanel from '../../components/project-monitoring/ProjectDetailPanel';
import ProjectFilters from '../../components/project-monitoring/ProjectFilters';
import ProjectRegister from '../../components/project-monitoring/ProjectRegister';
import ProjectSummary from '../../components/project-monitoring/ProjectSummary';
import { municipalProjects } from '../../data/municipal/projects';
import type { MunicipalProject, ProjectFilters as Filters } from '../../data/municipal/projects.types';
import AppLayout from '../../layouts/AppLayout';

const initial: Filters = { query: '', office: '', funding: '', status: '', location: '' };

type Props = {
    items?: OperationalItem[];
    filter?: string | null;
    summary?: OperationalSummary;
};

export default function Index({ items = [], filter = null, summary }: Props) {
    const [filters, setFilters] = useState(initial);
    const [selected, setSelected] = useState<MunicipalProject | null>(null);
    const projects = useMemo(() => {
        const query = filters.query.trim().toLowerCase();
        return municipalProjects.filter((project) => {
            const searchable = [project.id, project.title, project.responsibleOffice, project.location, project.fundingSource, project.relatedPPA, project.relatedDevelopmentPlan].join(' ').toLowerCase();
            return (!query || searchable.includes(query))
                && (!filters.office || project.responsibleOffice === filters.office)
                && (!filters.funding || project.fundingSource === filters.funding)
                && (!filters.status || project.status === filters.status)
                && (!filters.location || project.location === filters.location);
        });
    }, [filters]);

    return <AppLayout title="Project Monitoring">
        <PageFrame className="max-w-[1480px]" density="compact">
            <PageHeader
                eyebrow="Planning and implementation"
                title="Projects & PPAs"
                description="Reference project monitoring with physical and financial progress. Values shown here are prototype reference data, not live implementation measurements."
                icon={FolderKanban}
                aside={<div className="text-right text-xs text-[var(--municipal-muted)]"><strong className="text-[var(--municipal-text)]">{projects.length}</strong> of {municipalProjects.length} projects</div>}
            />
            <ProjectFilters filters={filters} onChange={(value) => { setFilters(value); setSelected(null); }} />
            <ProjectRegister projects={projects} selectedId={selected?.id} onSelect={setSelected} />
            {selected ? <ProjectDetailPanel project={selected} onClose={() => setSelected(null)} /> : null}
            <details className="group municipal-panel">
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 text-xs font-semibold marker:hidden">
                    <span>Project summary</span>
                    <span className="text-[var(--municipal-brand)] group-open:hidden">Show</span>
                    <span className="hidden text-[var(--municipal-brand)] group-open:inline">Hide</span>
                </summary>
                <div className="border-t border-[var(--municipal-border)] p-3"><ProjectSummary projects={projects} /></div>
            </details>
            {summary ? <details className="group municipal-panel"><summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 marker:hidden"><div><div className="text-xs font-bold">Operational monitoring register</div><div className="mt-0.5 text-[10px] text-[var(--municipal-muted)]">Backend operational records · separate source and access scope</div></div><span className="text-xs font-semibold text-[var(--municipal-brand)] group-open:hidden">Show</span><span className="hidden text-xs font-semibold text-[var(--municipal-brand)] group-open:inline">Hide</span></summary><div className="border-t border-[var(--municipal-border)] p-3"><OperationalRegister items={items} filter={filter} summary={summary} /></div></details> : null}
        </PageFrame>
    </AppLayout>;
}
