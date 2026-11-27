import { router } from '@inertiajs/react';
import { StatusBadge } from '../../../components/ui';
import AppLayout from '../../../layouts/AppLayout';
import { formatDatePH, humanizeSlug } from '../../../lib/format';

type Department = { id: number; code: string; name: string; short_name?: string | null };
type Task = {
    id: number;
    task_key: string;
    title: string;
    is_required: boolean;
    status: string;
    due_at?: string | null;
    notes?: string | null;
    owner_department?: Department | null;
    completer?: { id: number; name: string } | null;
    completed_at?: string | null;
};
type Props = {
    case: {
        id: number;
        separation_type: string;
        effective_date: string;
        status: string;
        reason?: string | null;
        employee: { id: number; employee_number: string; full_name: string; position_title: string; employment_status: string; department?: Department };
        tasks: Task[];
    };
    summary: { required: number; completed: number; openRequired: number };
};

export default function OffboardingShow({ case: offboarding, summary }: Props) {
    const complete = (task: Task) => router.post(`/hris/admin/offboarding/tasks/${task.id}/complete`, {}, { preserveScroll: true });
    const finalize = () => router.post(`/hris/admin/offboarding/${offboarding.id}/finalize`, {}, { preserveScroll: true });

    return (
        <AppLayout title="Offboarding Clearance">
            <div className="mx-auto max-w-5xl space-y-4 px-4 py-5 sm:px-6">
                <section className="rounded-xl bg-[#0e4d36] p-5 text-white sm:p-6">
                    <div className="text-xs font-bold uppercase tracking-wider text-emerald-200">Employee separation</div>
                    <h1 className="mt-1.5 text-2xl font-extrabold text-white">{offboarding.employee.full_name}</h1>
                    <p className="mt-1 text-sm text-emerald-100">
                        {offboarding.employee.employee_number} · {offboarding.employee.position_title} · {offboarding.employee.department?.short_name || offboarding.employee.department?.name}
                    </p>
                    <div className="mt-3.5 flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full bg-white/15 px-3 py-1 font-semibold">{humanizeSlug(offboarding.separation_type)}</span>
                        <span className="rounded-full bg-white/15 px-3 py-1 font-semibold">Effective {formatDatePH(offboarding.effective_date)}</span>
                        <span className="rounded-full bg-white/15 px-3 py-1 font-semibold">
                            {summary.openRequired} open {summary.openRequired === 1 ? 'blocker' : 'blockers'}
                        </span>
                    </div>
                </section>

                <section className="tcds-card overflow-hidden">
                    <div className="border-b border-[var(--border-default)] bg-[var(--surface-recessed)] px-4 py-3 sm:px-5">
                        <h2 className="text-sm font-bold text-[var(--ink-primary)]">Clearance checklist</h2>
                        <p className="mt-0.5 text-xs text-[var(--ink-secondary)]">
                            Mandatory operational blockers are verified against live work and property state where applicable.
                        </p>
                    </div>
                    <div className="divide-y divide-[var(--border-default)]">
                        {offboarding.tasks.map((task) => (
                            <div key={task.id} className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-start sm:justify-between sm:px-5">
                                <div>
                                    <div className="text-sm font-semibold text-[var(--ink-primary)]">{task.title}</div>
                                    <div className="mt-0.5 text-xs text-[var(--ink-secondary)]">
                                        {task.owner_department?.short_name || task.owner_department?.name || 'System managed'} · {task.is_required ? 'Required' : 'Optional'}
                                    </div>
                                    {task.notes && <div className="mt-1.5 text-xs text-[var(--ink-secondary)]">{task.notes}</div>}
                                </div>
                                <div className="flex items-center gap-2">
                                    <StatusBadge tone={task.status === 'completed' ? 'ok' : 'warn'}>{humanizeSlug(task.status)}</StatusBadge>
                                    {!['completed', 'not_required', 'waived', 'system_pending'].includes(task.status) && (
                                        <button type="button" onClick={() => complete(task)} className="municipal-primary-button min-h-9 px-3 text-xs">
                                            Complete
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {offboarding.status !== 'completed' && (
                    <section className="rounded-xl border border-[var(--status-warn-border)] bg-[var(--status-warn-bg)] p-4 sm:p-5">
                        <div className="text-sm font-bold text-[var(--status-warn-fg)]">Finalization gate</div>
                        <p className="mt-1.5 text-xs leading-5 text-[var(--status-warn-fg)]">
                            Finalization re-checks open assigned work and outstanding property, requires all mandatory manual clearances, deactivates the linked portal identity, and archives employment while retaining historical HR, payroll, DTR, property, and audit records.
                        </p>
                        <button
                            type="button"
                            disabled={summary.openRequired > 1}
                            onClick={finalize}
                            className="mt-3.5 inline-flex min-h-11 items-center rounded-lg bg-[var(--status-warn-bar)] px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            Finalize offboarding
                        </button>
                    </section>
                )}
            </div>
        </AppLayout>
    );
}
