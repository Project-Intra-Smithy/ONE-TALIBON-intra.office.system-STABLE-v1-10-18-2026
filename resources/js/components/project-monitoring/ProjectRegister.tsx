import { ChevronRight, FolderKanban } from 'lucide-react';
import type { MunicipalProject } from '../../data/municipal/projects.types';

const peso = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 });
const statusClass: Record<MunicipalProject['status'], string> = {
    Planned: 'bg-[var(--municipal-status-slate-bg)] text-[var(--municipal-status-slate-text)]',
    'For Procurement': 'bg-[var(--municipal-status-amber-bg)] text-[var(--municipal-status-amber-text)]',
    Ongoing: 'bg-[var(--municipal-status-blue-bg)] text-[var(--municipal-status-blue-text)]',
    Completed: 'bg-[var(--municipal-status-green-bg)] text-[var(--municipal-status-green-text)]',
    Delayed: 'bg-[var(--municipal-status-rose-bg)] text-[var(--municipal-status-rose-text)]',
};

const Progress = ({ value, label }: { value: number; label: string }) => <div className="min-w-[120px]"><div className="flex justify-between text-[10px] font-semibold text-[var(--municipal-muted)]"><span>{label}</span><span>{value}%</span></div><div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[var(--municipal-progress-track)]"><div className="h-full rounded-full bg-[var(--municipal-brand)]" style={{ width: `${value}%` }} /></div></div>;

type Props = {
    projects: MunicipalProject[];
    selectedId?: string;
    onSelect: (project: MunicipalProject | null) => void;
};

export default function ProjectRegister({ projects, selectedId, onSelect }: Props) {
    if (!projects.length) return <div className="municipal-panel border-dashed p-8 text-center"><FolderKanban className="mx-auto text-[var(--municipal-muted)]" /><h2 className="mt-3 font-bold">No monitored projects match</h2><p className="mt-1 text-sm text-[var(--municipal-muted)]">Adjust the current filters to return project records.</p></div>;

    return <>
        <div className="space-y-2 xl:hidden" aria-label="Municipal project register">
            {projects.map((project) => {
                const active = selectedId === project.id;
                return <article key={project.id} className={`municipal-panel p-3 ${active ? 'border-[var(--municipal-selected-border)] bg-[var(--municipal-selected-bg)]' : ''}`}>
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0"><div className="text-[11px] font-bold uppercase tracking-wide text-[var(--municipal-brand)]">{project.id} · Updated {project.lastUpdate}</div><h2 className="mt-0.5 text-sm font-semibold leading-5">{project.title}</h2><p className="mt-1 text-xs text-[var(--municipal-muted)]">{project.responsibleOffice} · {project.location}</p></div>
                        <span className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-bold ${statusClass[project.status]}`}>{project.status}</span>
                    </div>
                    <div className="mt-2 grid gap-2 sm:grid-cols-2"><Progress value={project.physicalProgress} label="Physical" /><Progress value={project.financialProgress} label="Financial" /></div>
                    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[var(--municipal-muted)]"><span>{peso.format(project.budget)}</span><span>Target {project.targetCompletion}</span></div>
                    <button type="button" onClick={() => onSelect(active ? null : project)} className="mt-2 inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-md border border-[var(--municipal-border)] px-3 text-xs font-bold text-[var(--municipal-brand)] hover:bg-[var(--municipal-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--municipal-focus)]" aria-expanded={active}>
                        {active ? 'Close details' : 'View details'} <ChevronRight size={14} aria-hidden="true" className={active ? 'rotate-90' : ''} />
                    </button>
                </article>;
            })}
        </div>

        <div className="municipal-panel hidden overflow-hidden xl:block">
            <div className="overflow-x-auto">
                <table className="w-full min-w-[980px] text-left text-sm">
                    <thead className="bg-[var(--municipal-surface-subtle)] text-[11px] uppercase tracking-wide text-[var(--municipal-muted)]"><tr><th className="px-3 py-2">Project</th><th className="px-3 py-2">Office</th><th className="px-3 py-2">Physical progress</th><th className="px-3 py-2">Financial</th><th className="px-3 py-2">Status</th><th className="px-3 py-2"><span className="sr-only">Details</span></th></tr></thead>
                    <tbody className="divide-y divide-[var(--municipal-border)]">{projects.map((project) => <tr key={project.id} className={selectedId === project.id ? 'bg-[var(--municipal-selected-bg)]' : 'hover:bg-[var(--municipal-hover)]'}>
                        <td className="max-w-[340px] px-3 py-2 align-top"><div className="font-semibold leading-5">{project.title}</div><div className="mt-0.5 text-[11px] text-[var(--municipal-muted)]">{project.id} · {project.location} · updated {project.lastUpdate}</div></td>
                        <td className="max-w-[220px] px-3 py-2 align-top text-xs leading-5 text-[var(--municipal-muted)]">{project.responsibleOffice}</td>
                        <td className="px-3 py-2 align-top"><Progress value={project.physicalProgress} label="Physical" /></td>
                        <td className="px-3 py-2 align-top"><Progress value={project.financialProgress} label="Financial" /></td>
                        <td className="px-3 py-2 align-top"><span className={`inline-flex rounded-full px-2 py-1 text-[11px] font-bold ${statusClass[project.status]}`}>{project.status}</span></td>
                        <td className="px-2 py-1 text-right align-top"><button type="button" onClick={() => onSelect(project)} className="inline-flex min-h-11 items-center gap-1 rounded-md px-2 text-xs font-bold text-[var(--municipal-brand)] hover:bg-[var(--municipal-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--municipal-focus)]/30">View <ChevronRight size={14} aria-hidden="true" /></button></td>
                    </tr>)}</tbody>
                </table>
            </div>
        </div>
    </>;
}
