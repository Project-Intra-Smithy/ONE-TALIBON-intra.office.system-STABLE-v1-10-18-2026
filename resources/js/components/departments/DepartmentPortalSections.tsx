import { Link, usePage } from '@inertiajs/react';
import { useState, type ReactNode } from 'react';
import { ArrowUpRight, CalendarDays, FileText, FolderKanban, ListChecks } from 'lucide-react';
import { ppaRecords } from '../../data/municipal/ppas';
import { municipalMeetings } from '../../data/municipal/meetings';
import { buildPortalNavigation } from '../../navigation/portalNavigation';
import type { SharedProps } from '../../types';
import StatusBadge from '../portal/StatusBadge';

const tabs = ['Overview', 'Documents', 'Projects', 'Reports', 'Calendar', 'Personnel', 'Tasks'] as const;
type Tab = typeof tabs[number];
type RecentActivity = { id: number; title?: string | null; reference?: string | null; actionLabel: string; createdAt?: string | null; detailUrl?: string | null };
type Props = {
    department: { code: string; name: string };
    pendingWork: number | undefined;
    drilldowns: { label: string; href: string }[];
    recentActivity: RecentActivity[];
    personnel: ReactNode;
    tasks: ReactNode;
    reports: ReactNode;
    operationalContext: ReactNode;
};

export default function DepartmentPortalSections({ department, pendingWork, drilldowns, recentActivity, personnel, tasks, reports, operationalContext }: Props) {
    const [tab, setTab] = useState<Tab>('Overview');
    const { workspaceExperience, permissions } = usePage<SharedProps>().props;
    const destinations = buildPortalNavigation(workspaceExperience, permissions.navigation).flatMap((group) => group.items);
    const canOpen = (path: string) => destinations.some((item) => item.href.split('?')[0] === path);
    const matchOffice = (value: string) => [department.name, department.code].some((office) => office.trim().toLowerCase() === value.trim().toLowerCase());
    const projects = ppaRecords.filter((item) => matchOffice(item.responsibleOffice));
    const meetings = municipalMeetings.filter((item) => matchOffice(item.organizingOffice));
    const scheduled = meetings.filter((item) => item.status === 'Scheduled');
    const documentLinks = drilldowns.filter((item) => /record|document|correspondence/i.test(item.label));
    const reportLink = drilldowns.find((item) => /report/i.test(item.label));
    const workLink = drilldowns.find((item) => /office work/i.test(item.label));
    // Preserve server activity ordering; show each source record once in the preview.
    const seen = new Set<string>();
    const recentRecords = recentActivity.filter((item) => {
        if (!item.detailUrl || seen.has(item.detailUrl)) return false;
        seen.add(item.detailUrl);
        return true;
    }).slice(0, 5);
    const records = <section className="department-panel">
        <header><h2>Recent workflow records</h2>{documentLinks[0] && <Link href={documentLinks[0].href}>Open register <ArrowUpRight size={14} /></Link>}</header>
        <p className="department-note department-panel-note">Latest office activity references; a separate document feed is not supplied.</p>
        <div className="department-list">{recentRecords.map((item) => <Link className="department-record" key={item.detailUrl} href={item.detailUrl!}>
            <FileText size={18} aria-hidden="true" /><div><strong>{item.title || item.reference || 'Workflow record'}</strong><small>{[item.reference, item.actionLabel].filter(Boolean).join(' / ')}</small></div>
            {item.createdAt && <time dateTime={item.createdAt} title="Activity date">{new Date(item.createdAt).toLocaleDateString()}</time>}
        </Link>)}{!recentRecords.length && <p className="department-empty">No workflow record references in the current activity view.</p>}</div>
    </section>;
    const projectList = (limit?: number) => <div className="department-list">{projects.slice(0, limit).map((item) => <article className="department-list-row" key={item.id}>
        <div className="department-row-heading"><strong>{item.title}</strong><StatusBadge label={item.status} tone={item.status === 'Completed' ? 'success' : item.status === 'Ongoing' ? 'info' : item.status === 'On Hold' ? 'warning' : 'neutral'} /></div>
        <small>{item.year} / {item.fundingSource}</small>
        {canOpen('/ppas') && <Link className="department-inline-link" href={'/ppas?search=' + encodeURIComponent(item.id)}>Open PPA reference <ArrowUpRight size={14} /></Link>}
    </article>)}{!projects.length && <p className="department-empty">No PPA references matched to this office.</p>}</div>;
    const meetingList = (overview = false) => <div className="department-list">{(overview ? scheduled.slice(0, 3) : meetings).map((item) => <article className="department-record" key={item.id}>
        <CalendarDays size={18} aria-hidden="true" /><div><strong>{item.title}</strong><small>{item.date} / {item.time}</small><small>{item.venue} / {item.status}</small></div>
    </article>)}{!(overview ? scheduled : meetings).length && <p className="department-empty">No {overview ? 'scheduled ' : ''}meeting references matched to this office.</p>}</div>;
    const sourceLinks = <div className="department-source-links">{documentLinks.map((item) => <Link key={item.href} href={item.href}>{item.label}<ArrowUpRight size={14} /></Link>)}{canOpen('/documents') && <Link href="/documents">Document Center<ArrowUpRight size={14} /></Link>}</div>;

    return <section aria-label="Department portal" className="department-sections">
        <div role="tablist" aria-label="Department views" className="department-tabs">{tabs.map((value) => <button key={value} id={'office-tab-' + value} role="tab" type="button" tabIndex={tab === value ? 0 : -1} aria-selected={tab === value} aria-controls="office-tab-panel" onClick={() => setTab(value)} onKeyDown={(event) => {
            const direction = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
            const next = event.key === 'Home' ? tabs[0] : event.key === 'End' ? tabs[tabs.length - 1] : direction ? tabs[(tabs.indexOf(value) + direction + tabs.length) % tabs.length] : null;
            if (next) { event.preventDefault(); setTab(next); document.getElementById('office-tab-' + next)?.focus(); }
        }}>{value}</button>)}</div>
        <div role="tabpanel" tabIndex={0} id="office-tab-panel" aria-labelledby={'office-tab-' + tab} className="department-tab-content">
            {tab === 'Overview' && <>
                <div className="department-metrics">{[
                    { label: 'Documents', value: 'Source registers', note: 'Document total not supplied', icon: FileText },
                    { label: 'Active PPAs', value: projects.filter((item) => item.status === 'Ongoing').length, note: 'Prototype references', icon: FolderKanban },
                    { label: 'Active office work', value: pendingWork ?? 'Not supplied', note: 'Authorized office queue', icon: ListChecks },
                    { label: 'Scheduled meetings', value: scheduled.length, note: 'Prototype references', icon: CalendarDays },
                ].map(({ label, value, note, icon: Icon }) => <div className="department-metric" key={label}><span><Icon size={16} aria-hidden="true" />{label}</span><strong>{value}</strong><small>{note}</small></div>)}</div>
                <div className="department-overview-grid"><div className="department-column">{records}<section className="department-panel"><header><h2>Office project references</h2><button type="button" onClick={() => setTab('Projects')}>View all</button></header>{projectList(3)}</section></div>
                    <div className="department-column"><section className="department-panel"><header><h2>Scheduled meeting references</h2><button type="button" onClick={() => setTab('Calendar')}>View all</button></header><p className="department-note department-panel-note">Prototype schedule, not a live calendar feed.</p>{meetingList(true)}</section>
                    <section className="department-panel"><header><h2>Office workload</h2><button type="button" onClick={() => setTab('Personnel')}>Personnel</button></header><div className="department-panel-body"><p className="department-note">View staff assignment counts and the oldest unresolved work in this office.</p><div className="department-source-links"><button type="button" onClick={() => setTab('Tasks')}>View tasks</button>{workLink && <Link href={workLink.href}>Open office queue<ArrowUpRight size={14} /></Link>}</div></div></section></div>
                </div>
                <details className="department-operational"><summary>Operational context <span>Office metrics and activity</span></summary><div>{operationalContext}</div></details>
            </>}
            {tab === 'Documents' && <>{sourceLinks}{records}</>}
            {tab === 'Projects' && <section className="department-panel"><header><h2>Programs, Projects & Activities</h2>{canOpen('/operations') && <Link href="/operations">Project monitoring<ArrowUpRight size={14} /></Link>}</header><p className="department-note department-panel-note">Office-matched prototype reference records.</p>{projectList()}</section>}
            {tab === 'Calendar' && <section className="department-panel"><header><h2>Calendar & Meetings</h2>{canOpen('/calendar') && <Link href="/calendar">Open calendar<ArrowUpRight size={14} /></Link>}</header><p className="department-note department-panel-note">Office prototype references. Open the calendar for authorized events.</p>{meetingList()}</section>}
            {tab === 'Reports' && <>{reportLink && <div className="department-source-links"><Link href={reportLink.href}>Open {reportLink.label}<ArrowUpRight size={14} /></Link></div>}{reports}</>}
            {tab === 'Personnel' && <><p className="department-note">Bounded staff workload view, not a complete personnel directory.</p>{personnel}</>}
            {tab === 'Tasks' && <>{workLink && <div className="department-source-links"><Link href={workLink.href}>Open {workLink.label}<ArrowUpRight size={14} /></Link></div>}{tasks}</>}
        </div>
    </section>;
}
