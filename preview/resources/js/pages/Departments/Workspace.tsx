import { Link } from '@inertiajs/react';
import { ArrowRight, Building2, ClipboardList, Users } from 'lucide-react';
import type { OfficeOverviewData } from '../../components/dashboard/types';
import { KpiCard, PageHeader, StatusBadge, toneForWorkState, type KpiAccent } from '../../components/ui';
import AppLayout from '../../layouts/AppLayout';
import { formatDatePH } from '../../lib/format';

type DepartmentWorkspaceProps = {
    department: { id: number; code: string; name: string; shortName?: string | null; branch: string; officeType: string };
    metrics: OfficeOverviewData['metrics'];
    statusOverview: OfficeOverviewData['statusOverview'];
    staffWorkload: OfficeOverviewData['staffWorkload'];
    oldestUnresolved: OfficeOverviewData['oldestUnresolved'];
    recentActivity: Array<{
        id: number;
        actionLabel: string;
        reference: string | null;
        title: string | null;
        actor: string | null;
        createdAt: string | null;
        detailUrl: string | null;
    }>;
    drilldowns: Array<{ label: string; href: string }>;
};

export default function Workspace({
    department,
    metrics,
    staffWorkload,
    recentActivity,
    drilldowns,
}: DepartmentWorkspaceProps) {
    const metricEntries = Object.entries(metrics);
    const accentByKey: Record<string, KpiAccent> = {
        active: 'brand',
        requiresAction: 'warn',
        overdue: 'danger',
        unassigned: 'neutral',
    };

    return (
        <AppLayout title="My Department">
            <div className="mx-auto max-w-[1440px] space-y-5 px-4 py-5 sm:px-6">
                <PageHeader
                    eyebrow="Department head workspace"
                    title="My Department"
                    subtitle={`${department.name} · Authorized office workload, staff capacity, and activity`}
                    actions={
                        <div className="flex flex-wrap items-center gap-2">
                            <Link href="/transactions?view=needs_action" className="municipal-primary-button">
                                <span>Needs Head Action</span>
                                <ArrowRight size={16} aria-hidden="true" />
                            </Link>
                            <Link href="/departments?view=directory" className="municipal-secondary-button">
                                <Building2 size={16} aria-hidden="true" />
                                <span>Office Directory</span>
                            </Link>
                        </div>
                    }
                />

                {/* 4-column above-the-fold KPI cards */}
                <section aria-label="Authorized department metrics" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    {metricEntries.map(([key, metric]) => (
                        <KpiCard
                            key={key}
                            label={metric.label}
                            value={metric.value}
                            accent={accentByKey[key] ?? 'brand'}
                            href={metric.link}
                        />
                    ))}
                </section>

                {/* 2-column Staff Workload + Recent Activity (ZERO cramped inner scrollbars) */}
                <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
                    <section id="department-staff" aria-labelledby="staff-workload-heading" className="min-w-0">
                        <div className="tcds-card overflow-hidden">
                            <div className="flex items-center justify-between gap-2 border-b border-[var(--border-default)] px-4 py-3.5 sm:px-5">
                                <div className="flex items-center gap-2">
                                    <Users size={18} aria-hidden="true" className="text-[var(--brand-ink)]" />
                                    <h2 id="staff-workload-heading" className="text-base font-bold text-[var(--ink-primary)]">
                                        Staff Workload ({staffWorkload.length})
                                    </h2>
                                </div>
                                <Link href="/transactions?view=unassigned" className="text-sm font-semibold text-[var(--brand-ink)] hover:underline">
                                    Assign queue
                                </Link>
                            </div>

                            {staffWorkload.length === 0 ? (
                                <p className="px-5 py-8 text-sm text-[var(--ink-secondary)]">No staff workload records available.</p>
                            ) : (
                                <div tabIndex={0} role="region" aria-labelledby="staff-workload-heading" className="overflow-x-auto">
                                    <table className="tcds-table" data-stack-mobile="true">
                                        <thead>
                                            <tr>
                                                <th scope="col">Staff Member</th>
                                                <th scope="col" className="text-right">Active</th>
                                                <th scope="col" className="text-right">Needs Action</th>
                                                <th scope="col" className="text-right">Overdue</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {staffWorkload.map((member) => (
                                                <tr key={member.employee}>
                                                    <th scope="row" className="font-normal">
                                                        <div className="font-semibold text-[var(--ink-primary)]">{member.employee}</div>
                                                        {member.position && (
                                                            <div className="text-xs text-[var(--ink-secondary)]">
                                                                {member.position.replace(/\s*\(on synthetic leave\)/i, ' · On leave')}
                                                            </div>
                                                        )}
                                                    </th>
                                                    <td data-label="Active" className="text-right font-semibold">{member.active}</td>
                                                    <td data-label="Needs Action" className="text-right">
                                                        {member.requiresAction > 0 ? (
                                                            <StatusBadge tone="warn">{member.requiresAction}</StatusBadge>
                                                        ) : (
                                                            <span className="text-[var(--ink-secondary)]">0</span>
                                                        )}
                                                    </td>
                                                    <td data-label="Overdue" className="text-right">
                                                        {member.overdue > 0 ? (
                                                            <StatusBadge tone="danger">{member.overdue}</StatusBadge>
                                                        ) : (
                                                            <span className="text-[var(--ink-secondary)]">0</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </section>

                    <section aria-labelledby="department-activity-heading" className="min-w-0">
                        <div className="tcds-card overflow-hidden">
                            <div className="flex items-center justify-between gap-2 border-b border-[var(--border-default)] px-4 py-3.5 sm:px-5">
                                <div className="flex items-center gap-2">
                                    <ClipboardList size={18} aria-hidden="true" className="text-[var(--brand-ink)]" />
                                    <h2 id="department-activity-heading" className="text-base font-bold text-[var(--ink-primary)]">
                                        Recent Office Activity
                                    </h2>
                                </div>
                                <Link href="/transactions?view=office_queue" className="text-sm font-semibold text-[var(--brand-ink)] hover:underline">
                                    Office queue
                                </Link>
                            </div>
                            {recentActivity.length === 0 ? (
                                <p className="px-5 py-8 text-sm text-[var(--ink-secondary)]">No recent office activity recorded.</p>
                            ) : (
                                <ul className="divide-y divide-[var(--border-default)]">
                                    {recentActivity.map((item) => (
                                        <li key={item.id} className="flex items-start justify-between gap-3 px-4 py-3.5 sm:px-5">
                                            <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="text-sm font-semibold text-[var(--ink-primary)]">{item.actionLabel}</span>
                                                    {item.reference && (
                                                        <StatusBadge tone={toneForWorkState('in_progress')}>{item.reference}</StatusBadge>
                                                    )}
                                                </div>
                                                {item.title && <p className="mt-0.5 text-sm text-[var(--ink-secondary)]">{item.title}</p>}
                                                <p className="mt-1 text-xs text-[var(--ink-secondary)]">
                                                    {[item.actor, formatDatePH(item.createdAt)].filter(Boolean).join(' · ')}
                                                </p>
                                            </div>
                                            {item.detailUrl && (
                                                <Link
                                                    href={item.detailUrl}
                                                    className="inline-flex min-h-10 shrink-0 items-center text-sm font-semibold text-[var(--brand-ink)] hover:underline"
                                                >
                                                    Open
                                                </Link>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </section>
                </div>

                {/* Clean related workspace links */}
                {drilldowns.length > 0 && (
                    <nav aria-label="Related department workspaces" className="flex flex-wrap gap-2">
                        {drilldowns.map((item) => (
                            <Link key={item.href} href={item.href} className="municipal-secondary-button">
                                {item.label}
                            </Link>
                        ))}
                    </nav>
                )}
            </div>
        </AppLayout>
    );
}
