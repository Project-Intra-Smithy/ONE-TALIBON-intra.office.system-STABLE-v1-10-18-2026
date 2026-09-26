import { ChartNoAxesCombined } from 'lucide-react';
import DashboardWidget from './DashboardWidget';
import type { DashboardProject } from './types';
const statuses = [{ key: 'on_track', label: 'On track', color: '#169447' }, { key: 'attention', label: 'Needs follow-up', color: '#D49A22' }, { key: 'delayed', label: 'Delayed', color: '#DC544A' }] as const;
export default function ProjectStatusSnapshot({ projects, href }: { projects: DashboardProject[]; href?: string }) {
    const segments = statuses.map((status) => ({ ...status, count: projects.filter((project) => project.status === status.key).length }));
    return <DashboardWidget title="Project Status Snapshot" icon={ChartNoAxesCombined} href={href} className="dashboard-project-snapshot">
        <div className="dashboard-snapshot-body"><div className="dashboard-snapshot-chart"><div><span>Projects in this view</span><strong>{projects.length}</strong></div><div className="dashboard-status-bar" role="img" aria-label={segments.map((item) => `${item.label}: ${item.count}`).join(', ')}>{segments.filter((item) => item.count > 0).map((item) => <span key={item.key} style={{ width: `${item.count / projects.length * 100}%`, backgroundColor: item.color }} />)}</div></div><div className="dashboard-status-legend">{segments.map((item) => <div key={item.key}><i style={{ backgroundColor: item.color }} /><div><strong>{item.count}</strong><span>{item.label}</span></div></div>)}</div>{!projects.length && <p className="dashboard-empty">No projects in this view.</p>}</div>
    </DashboardWidget>;
}
