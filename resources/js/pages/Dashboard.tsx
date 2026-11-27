import { Link, usePage } from '@inertiajs/react';
import { ArrowRight, Bell, Building2, CheckSquare, FileText, Plus, ShieldCheck } from 'lucide-react';
import { useContext, useEffect, useState } from 'react';
import CorrespondenceOverview from '../components/dashboard/CorrespondenceOverview';
import ExecutiveOverview from '../components/dashboard/ExecutiveOverview';
import SystemOverview from '../components/dashboard/SystemOverview';
import type { DashboardProps } from '../components/dashboard/types';
import { NotificationContext, NotificationStateContext } from '../components/shell/NotificationContext';
import { KpiCard, StatusBadge, toneForWorkState, type KpiAccent } from '../components/ui';
import WorkspaceUnavailable from '../components/WorkspaceUnavailable';
import AppLayout from '../layouts/AppLayout';
import { formatDatePH, humanizeSlug, relativeTimePH } from '../lib/format';
import { withReturnContext } from '../navigation/returnContext';
import type { SharedProps } from '../types';

type TaskPreview = {
    id: number;
    title: string;
    state: 'open' | 'in_progress' | 'completed';
    due_at?: string | null;
};

function greetingForPhilippineTime(): string {
    const hour = Number(
        new Intl.DateTimeFormat('en-PH', { hour: 'numeric', hour12: false, timeZone: 'Asia/Manila' }).format(new Date()),
    );
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
}

export default function Dashboard({
    experience,
    metricGroups,
    correspondenceOverview,
    recentWork,
    officeOverview,
    executiveOverview,
    systemOverview,
    municipalDashboard,
}: DashboardProps) {
    const { auth } = usePage<SharedProps>().props;
    const [tasks, setTasks] = useState<TaskPreview[]>([]);
    const [taskState, setTaskState] = useState<'loading' | 'ready' | 'unavailable'>('loading');

    useEffect(() => {
        const controller = new AbortController();
        setTaskState('loading');
        fetch('/tasks?per_page=4&page=1', { headers: { Accept: 'application/json' }, signal: controller.signal })
            .then((res) => {
                if (!res.ok) throw new Error('Tasks unavailable');
                return res.json();
            })
            .then((body) => {
                if (body && Array.isArray(body.data)) {
                    setTasks(body.data.slice(0, 4));
                    setTaskState('ready');
                } else {
                    setTaskState('unavailable');
                }
            })
            .catch(() => {
                if (controller.signal.aborted) return;
                setTaskState('unavailable');
            });
        return () => controller.abort();
    }, [experience?.key]);

    if (!experience?.department || !Array.isArray(experience.quickActions) || !Array.isArray(metricGroups) || !Array.isArray(recentWork)) {
        return <WorkspaceUnavailable title="Dashboard" />;
    }

    const isEmployee = experience.key === 'employee';
    const isHead = experience.key === 'department_head';
    const isExecutive = experience.key === 'executive_oversight';
    const isAdmin = experience.key === 'system_administration';

    const firstName = (auth?.user?.name || 'Colleague').trim().split(/\s+/)[0];
    const deptLabel = experience.department.shortName || experience.department.code || experience.department.name;
    const todayLabel = new Intl.DateTimeFormat('en-PH', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        timeZone: 'Asia/Manila',
    }).format(new Date());

    // Build high-signal above-the-fold KPI tiles strictly from server-supplied props
    const kpiTiles: Array<{ key: string; label: string; value: number; hint: string; accent: KpiAccent; href: string }> = [];
    if (isHead && officeOverview?.metrics) {
        const m = officeOverview.metrics;
        if (m.requiresAction) kpiTiles.push({ key: 'action', label: m.requiresAction.label, value: m.requiresAction.value, hint: 'Awaiting your review', accent: 'warn', href: m.requiresAction.link });
        if (m.overdue) kpiTiles.push({ key: 'overdue', label: m.overdue.label, value: m.overdue.value, hint: 'Past target completion', accent: 'danger', href: m.overdue.link });
        if (m.active) kpiTiles.push({ key: 'active', label: m.active.label, value: m.active.value, hint: `Across ${officeOverview.staffWorkload?.length || 0} office staff`, accent: 'brand', href: m.active.link });
        if (m.unassigned) kpiTiles.push({ key: 'unassigned', label: m.unassigned.label, value: m.unassigned.value, hint: 'Ready to assign', accent: 'neutral', href: m.unassigned.link });
    } else {
        const primaryKey = { employee: 'personal', department_head: 'office', executive_oversight: 'executive', system_administration: 'system' }[experience.key];
        const primary = metricGroups.find((g) => g.key === primaryKey) ?? metricGroups[0];
        (primary?.metrics ?? []).slice(0, 4).forEach((item, idx) => {
            const labelLower = item.label.toLowerCase();
            const accent: KpiAccent = labelLower.includes('overdue')
                ? 'danger'
                : labelLower.includes('due') || labelLower.includes('pending') || labelLower.includes('action')
                  ? 'warn'
                  : labelLower.includes('complete') || labelLower.includes('closed')
                    ? 'ok'
                    : 'brand';
            kpiTiles.push({
                key: `${item.label}-${idx}`,
                label: item.label,
                value: item.value,
                hint: 'Authorized workload',
                accent,
                href: item.link,
            });
        });
    }

    const visibleWork = recentWork.slice(0, 6);

    return (
        <AppLayout workspaceRefinement title="Dashboard" presentation="portal-dashboard">
            <div className="mx-auto max-w-[1440px] space-y-5 px-4 py-5 sm:px-6">
                {/* Compact single-row greeting header — zero bloated double hero banners */}
                <header className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                        <h1 className="text-2xl font-extrabold tracking-tight text-[var(--ink-primary)] sm:text-[1.65rem]">
                            {`${greetingForPhilippineTime()}, ${firstName}`}
                        </h1>
                        <p className="mt-0.5 text-sm text-[var(--ink-secondary)]">
                            {deptLabel} · {todayLabel} · Philippine Standard Time
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2.5">
                        {(isEmployee || isHead) && (
                            <Link href="/transactions/create" className="municipal-primary-button">
                                <Plus size={16} aria-hidden="true" />
                                <span>New Work Request</span>
                            </Link>
                        )}
                        {isHead && (
                            <Link href="/my-department" className="municipal-secondary-button">
                                <Building2 size={16} aria-hidden="true" />
                                <span>Open My Department</span>
                            </Link>
                        )}
                        {isEmployee && (
                            <Link href="/my-tasks" className="municipal-secondary-button">
                                <CheckSquare size={16} aria-hidden="true" />
                                <span>Open My Tasks</span>
                            </Link>
                        )}
                        {isAdmin && (
                            <Link href="/admin" className="municipal-primary-button">
                                <ShieldCheck size={16} aria-hidden="true" />
                                <span>System Administration</span>
                            </Link>
                        )}
                    </div>
                </header>

                {/* Above-the-fold KPI strip */}
                {kpiTiles.length > 0 && (
                    <section
                        aria-label="Workload summary"
                        className={`grid grid-cols-2 gap-3 ${kpiTiles.length === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-4'}`}
                    >
                        {kpiTiles.map((tile) => (
                            <KpiCard
                                key={tile.key}
                                label={tile.label}
                                value={tile.value}
                                hint={tile.hint}
                                accent={tile.accent}
                                href={tile.href}
                            />
                        ))}
                    </section>
                )}

                {/* 65 / 35 Operational Workboard immediately visible above the fold */}
                <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.75fr)_minmax(0,1fr)]">
                    {/* Priority Work Requests */}
                    <section aria-labelledby="dashboard-work-heading" className="min-w-0">
                        <div className="tcds-card overflow-hidden">
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-default)] px-4 py-3.5 sm:px-5">
                                <div className="flex items-center gap-2">
                                    <FileText size={18} aria-hidden="true" className="text-[var(--brand-ink)]" />
                                    <h2 id="dashboard-work-heading" className="text-base font-bold text-[var(--ink-primary)]">
                                        {isHead ? 'Priority Work Requests' : 'My Recent Work Requests'}
                                    </h2>
                                </div>
                                <Link
                                    href="/transactions"
                                    className="inline-flex min-h-9 items-center gap-1 text-sm font-semibold text-[var(--brand-ink)] hover:underline"
                                >
                                    <span>View all</span>
                                    <ArrowRight size={15} aria-hidden="true" />
                                </Link>
                            </div>

                            {visibleWork.length === 0 ? (
                                <p className="px-5 py-8 text-sm text-[var(--ink-secondary)]">
                                    No active work requests assigned to your authorized view right now.
                                </p>
                            ) : (
                                <div
                                    tabIndex={0}
                                    role="region"
                                    aria-labelledby="dashboard-work-heading"
                                    className="tcds-table-region rounded-none border-0"
                                >
                                    <table className="tcds-table" data-stack-mobile="true">
                                        <thead>
                                            <tr>
                                                <th scope="col">Request ID</th>
                                                <th scope="col">Title</th>
                                                <th scope="col">Status</th>
                                                <th scope="col">Due</th>
                                                <th scope="col" className="text-right">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {visibleWork.map((item) => {
                                                const stateBadge = item.dueState === 'overdue' ? 'overdue' : item.status;
                                                const href = withReturnContext(item.detailUrl, '/dashboard', '/transactions');
                                                return (
                                                    <tr key={item.reference}>
                                                        <th scope="row" className="whitespace-nowrap font-mono text-xs font-bold text-[var(--brand-ink)]">
                                                            {item.reference}
                                                        </th>
                                                        <td data-label="Title">
                                                            <div className="min-w-0">
                                                                <div className="font-semibold text-[var(--ink-primary)]">{item.title}</div>
                                                                {item.assignedEmployee?.name && (
                                                                    <div className="mt-0.5 text-xs text-[var(--ink-secondary)]">
                                                                        {item.assignedEmployee.name}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td data-label="Status">
                                                            <StatusBadge tone={toneForWorkState(stateBadge)}>
                                                                {humanizeSlug(stateBadge)}
                                                            </StatusBadge>
                                                        </td>
                                                        <td data-label="Due" className="whitespace-nowrap text-sm text-[var(--ink-secondary)]">
                                                            {formatDatePH(item.dueAt, { month: 'short', day: 'numeric' })}
                                                        </td>
                                                        <td data-label="Action" className="text-right">
                                                            <Link
                                                                href={href}
                                                                className="inline-flex min-h-10 items-center gap-1 rounded-lg px-2.5 text-sm font-semibold text-[var(--brand-ink)] hover:bg-[var(--brand-soft)]"
                                                            >
                                                                <span>Review</span>
                                                                <ArrowRight size={14} aria-hidden="true" />
                                                            </Link>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Right rail: My Tasks Today + Official Memoranda & Updates */}
                    <div className="flex min-w-0 flex-col gap-5">
                        {(isEmployee || isHead) && (
                            <section aria-labelledby="dashboard-tasks-heading" className="tcds-card overflow-hidden">
                                <div className="flex items-center justify-between gap-2 border-b border-[var(--border-default)] px-4 py-3.5">
                                    <div className="flex items-center gap-2">
                                        <CheckSquare size={17} aria-hidden="true" className="text-[var(--brand-ink)]" />
                                        <h2 id="dashboard-tasks-heading" className="text-base font-bold text-[var(--ink-primary)]">
                                            My Tasks Today
                                        </h2>
                                    </div>
                                    <Link href="/my-tasks" className="text-sm font-semibold text-[var(--brand-ink)] hover:underline">
                                        All tasks
                                    </Link>
                                </div>
                                <div className="divide-y divide-[var(--border-default)]">
                                    {taskState === 'loading' ? (
                                        <p className="px-4 py-5 text-sm text-[var(--ink-secondary)]">
                                            Loading your tasks…
                                        </p>
                                    ) : taskState === 'unavailable' ? (
                                        <p className="px-4 py-5 text-sm text-[var(--ink-secondary)]" role="status">
                                            Personal tasks could not be loaded right now.{' '}
                                            <Link href="/my-tasks" className="font-semibold text-[var(--brand-ink)] underline">
                                                Open My Tasks
                                            </Link>{' '}
                                            to retry.
                                        </p>
                                    ) : tasks.length === 0 ? (
                                        <p className="px-4 py-5 text-sm text-[var(--ink-secondary)]">
                                            No personal tasks queued. <Link href="/my-tasks" className="font-semibold text-[var(--brand-ink)] underline">Open My Tasks</Link> to add one.
                                        </p>
                                    ) : (
                                        tasks.map((task) => (
                                            <Link
                                                key={task.id}
                                                href="/my-tasks"
                                                className="flex items-start justify-between gap-3 px-4 py-3 transition-colors hover:bg-[var(--surface-hover)]"
                                            >
                                                <div className="min-w-0">
                                                    <div className={`text-sm font-semibold ${task.state === 'completed' ? 'text-[var(--ink-secondary)] line-through' : 'text-[var(--ink-primary)]'}`}>
                                                        {task.title}
                                                    </div>
                                                    {task.due_at && (
                                                        <div className="mt-0.5 text-xs text-[var(--ink-secondary)]">
                                                            Due {formatDatePH(task.due_at, { month: 'short', day: 'numeric' })}
                                                        </div>
                                                    )}
                                                </div>
                                                <StatusBadge tone={toneForWorkState(task.state)}>
                                                    {humanizeSlug(task.state)}
                                                </StatusBadge>
                                            </Link>
                                        ))
                                    )}
                                </div>
                            </section>
                        )}

                        <DashboardUpdatesPanel municipalDashboard={municipalDashboard} />
                    </div>
                </div>

                {/* Role-specific secondary sections */}
                {(isEmployee || isHead) && correspondenceOverview && (
                    <section aria-label="Correspondence overview">
                        <CorrespondenceOverview overview={correspondenceOverview} />
                    </section>
                )}

                {isExecutive && executiveOverview && (
                    <section aria-label="Executive oversight">
                        <ExecutiveOverview overview={executiveOverview} />
                    </section>
                )}

                {isAdmin && systemOverview && (
                    <section aria-label="Administration overview">
                        <SystemOverview overview={systemOverview} />
                    </section>
                )}
            </div>
        </AppLayout>
    );
}

function DashboardUpdatesPanel({
    municipalDashboard,
}: {
    municipalDashboard?: DashboardProps['municipalDashboard'];
}) {
    const notifications = useContext(NotificationContext);
    const feedState = useContext(NotificationStateContext);
    const announcements = municipalDashboard?.announcements ?? [];

    return (
        <section aria-labelledby="dashboard-updates-heading" className="tcds-card overflow-hidden">
            <div className="flex items-center justify-between gap-2 border-b border-[var(--border-default)] px-4 py-3.5">
                <div className="flex items-center gap-2">
                    <Bell size={17} aria-hidden="true" className="text-[var(--brand-ink)]" />
                    <h2 id="dashboard-updates-heading" className="text-base font-bold text-[var(--ink-primary)]">
                        Official Memoranda &amp; Updates
                    </h2>
                </div>
                <Link href="/memoranda" className="text-sm font-semibold text-[var(--brand-ink)] hover:underline">
                    Memoranda
                </Link>
            </div>
            <div className="divide-y divide-[var(--border-default)]">
                {feedState === 'expired' ? (
                    <p className="px-4 py-5 text-sm text-[var(--ink-secondary)]" role="status">
                        Your session expired. Sign in again to refresh office updates and memoranda.
                    </p>
                ) : notifications.length > 0 ? (
                    <>
                        {feedState === 'unavailable' && (
                            <p className="bg-[var(--status-warn-bg)] px-4 py-2 text-xs font-medium text-[var(--status-warn-fg)]" role="status">
                                Live feed unavailable; showing last received updates.
                            </p>
                        )}
                        {notifications.slice(0, 4).map((item) => (
                            <Link
                                key={item.key}
                                href={item.url}
                                className="flex items-start justify-between gap-3 px-4 py-3 transition-colors hover:bg-[var(--surface-hover)]"
                            >
                                <div className="min-w-0">
                                    <div className="text-xs font-bold uppercase tracking-wide text-[var(--brand-ink)]">
                                        {item.title}
                                    </div>
                                    <div className="mt-0.5 text-sm font-medium text-[var(--ink-primary)]">
                                        {item.message}
                                    </div>
                                    {item.created_at && (
                                        <div className="mt-1 text-xs text-[var(--ink-secondary)]">
                                            {relativeTimePH(item.created_at)}
                                        </div>
                                    )}
                                </div>
                                {item.urgent && <StatusBadge tone="gold">Action</StatusBadge>}
                            </Link>
                        ))}
                    </>
                ) : feedState === 'loading' ? (
                    <p className="px-4 py-5 text-sm text-[var(--ink-secondary)]" role="status">
                        Checking recent office updates and memoranda…
                    </p>
                ) : feedState === 'unavailable' ? (
                    <p className="px-4 py-5 text-sm text-[var(--ink-secondary)]" role="status">
                        Live office updates are currently unavailable. Check Memoranda directly or retry shortly.
                    </p>
                ) : announcements.length > 0 ? (
                    announcements.slice(0, 3).map((item) => (
                        <Link
                            key={item.id}
                            href="/memoranda"
                            className="flex items-start justify-between gap-3 px-4 py-3 transition-colors hover:bg-[var(--surface-hover)]"
                        >
                            <div className="min-w-0">
                                <div className="text-xs font-bold uppercase tracking-wide text-[var(--brand-ink)]">
                                    {item.office || 'Official Memorandum'}
                                </div>
                                <div className="mt-0.5 text-sm font-medium text-[var(--ink-primary)]">
                                    {item.title}
                                </div>
                                {(item.body || item.summary) && (
                                    <div className="mt-0.5 line-clamp-1 text-xs text-[var(--ink-secondary)]">
                                        {item.body || item.summary}
                                    </div>
                                )}
                            </div>
                            <StatusBadge tone="gold">Review</StatusBadge>
                        </Link>
                    ))
                ) : (
                    <p className="px-4 py-5 text-sm text-[var(--ink-secondary)]">
                        You are caught up on recent office updates and memoranda.
                    </p>
                )}
            </div>
        </section>
    );
}
