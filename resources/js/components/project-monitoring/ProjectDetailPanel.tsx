import { AlertTriangle, CalendarDays, FileText, Milestone, X } from 'lucide-react';
import type { MunicipalProject } from '../../data/municipal/projects.types';

export default function ProjectDetailPanel({ project, onClose }: { project: MunicipalProject | null; onClose: () => void }) {
    if (!project) return null;
    const entries = [
        ['Latest milestone', project.latestMilestone, Milestone],
        ['Next milestone', project.nextMilestone, Milestone],
        ['Issue or concern', project.issueOrConcern, AlertTriangle],
        ['Target completion', project.targetCompletion, CalendarDays],
        ['Related PPA', project.relatedPPA, FileText],
        ['Development plan', project.relatedDevelopmentPlan, FileText],
    ] as const;
    return <aside className="municipal-panel p-3" aria-label="Selected project details"><div className="flex items-start justify-between gap-4"><div><div className="text-[11px] font-bold uppercase tracking-wide text-[var(--municipal-brand)]">{project.id} · {project.status}</div><h2 className="mt-0.5 text-base font-bold leading-6">{project.title}</h2><div className="mt-1 text-xs text-[var(--municipal-muted)]">{project.responsibleOffice} · {project.location}</div></div><button type="button" onClick={onClose} className="flex min-h-11 min-w-11 items-center justify-center rounded-md text-[var(--municipal-muted)] hover:bg-[var(--municipal-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--municipal-focus)]/30" aria-label="Close project details"><X size={17} /></button></div><dl className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{entries.map(([label, value, Icon]) => <div key={label} className="rounded-[var(--municipal-radius-surface)] bg-[var(--municipal-surface-subtle)] p-2.5"><dt className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-[var(--municipal-muted)]"><Icon size={13} />{label}</dt><dd className="mt-1 text-xs font-semibold leading-5">{value}</dd></div>)}</dl></aside>;
}
