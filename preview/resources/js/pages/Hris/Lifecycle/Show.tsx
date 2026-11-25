import { Link, router } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { KpiCard, StatusBadge } from '../../../components/ui';
import AppLayout from '../../../layouts/AppLayout';
import { formatDateTimePH, humanizeSlug } from '../../../lib/format';

type Task = {
    id: number;
    task_key: string;
    title: string;
    category: string;
    is_required: boolean;
    status: string;
    due_at?: string | null;
    completed_at?: string | null;
    notes?: string | null;
    owner_department?: { name: string; short_name?: string | null } | null;
    completer?: { name: string } | null;
};
type Props = {
    case: {
        id: number;
        status: string;
        appointment_reference?: string | null;
        planned_start_date?: string | null;
        employee: any;
        target_department: any;
        supervisor?: any;
        tasks: Task[];
    };
    summary: { required: number; completed: number; openRequired: number };
};

export default function OnboardingShow({ case: onboardingCase, summary }: Props) {
    const completeTask = (task: Task) =>
        router.post(`/hris/admin/lifecycle/onboarding/tasks/${task.id}/complete`, {}, { preserveScroll: true });
    const completeCase = () =>
        router.post(`/hris/admin/lifecycle/onboarding/${onboardingCase.id}/complete`, {}, { preserveScroll: true });

    return (
        <AppLayout title="Onboarding Case">
            <div className="mx-auto max-w-5xl space-y-4 px-4 py-5 sm:px-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <Link
                        href="/hris/admin/lifecycle"
                        className="inline-flex min-h-9 items-center gap-1.5 text-sm font-semibold text-[var(--brand-ink)] hover:underline"
                    >
                        <ArrowLeft size={15} aria-hidden="true" />
                        <span>Back to Employee Lifecycle</span>
                    </Link>
                    <StatusBadge tone={onboardingCase.status === 'completed' ? 'ok' : 'warn'}>
                        {humanizeSlug(onboardingCase.status)}
                    </StatusBadge>
                </div>

                <section className="rounded-xl bg-[#0e4d36] p-5 text-white sm:p-6">
                    <div className="font-mono text-xs font-bold uppercase tracking-wider text-emerald-200">
                        {onboardingCase.employee.employee_number}
                    </div>
                    <h1 className="mt-1 text-2xl font-extrabold text-white">{onboardingCase.employee.full_name}</h1>
                    <p className="mt-1 text-sm text-emerald-100">
                        {onboardingCase.employee.position_title} · {onboardingCase.target_department.short_name || onboardingCase.target_department.name}
                    </p>
                </section>

                <div className="grid grid-cols-3 gap-3">
                    <KpiCard label="Required" value={summary.required} accent="brand" />
                    <KpiCard label="Completed" value={summary.completed} accent="ok" />
                    <KpiCard label="Open Blockers" value={summary.openRequired} accent={summary.openRequired > 0 ? 'warn' : 'ok'} />
                </div>

                <section className="tcds-card overflow-hidden">
                    <div className="border-b border-[var(--border-default)] bg-[var(--surface-recessed)] px-4 py-3 sm:px-5">
                        <h2 className="text-sm font-bold text-[var(--ink-primary)]">Activation checklist</h2>
                        <p className="mt-0.5 text-xs text-[var(--ink-secondary)]">
                            Required tasks must be completed or formally waived before employee activation.
                        </p>
                    </div>
                    <div className="divide-y divide-[var(--border-default)]">
                        {onboardingCase.tasks.map((task) => (
                            <div key={task.id} className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-start sm:justify-between sm:px-5">
                                <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-sm font-semibold text-[var(--ink-primary)]">{task.title}</span>
                                        {task.is_required && <StatusBadge tone="danger">Required</StatusBadge>}
                                    </div>
                                    <div className="mt-1 text-xs text-[var(--ink-secondary)]">
                                        {humanizeSlug(task.category)} · Owner: {task.owner_department?.short_name || task.owner_department?.name || 'HR administration'}
                                    </div>
                                    {task.completed_at && (
                                        <div className="mt-1 text-xs font-medium text-[var(--status-ok-fg)]">
                                            Completed {formatDateTimePH(task.completed_at)}
                                            {task.completer?.name ? ` by ${task.completer.name}` : ''}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    {task.status === 'pending' ? (
                                        <button type="button" onClick={() => completeTask(task)} className="municipal-primary-button">
                                            Mark complete
                                        </button>
                                    ) : (
                                        <StatusBadge tone={task.status === 'completed' ? 'ok' : 'neutral'}>
                                            {humanizeSlug(task.status)}
                                        </StatusBadge>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="tcds-card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                    <div>
                        <h2 className="text-sm font-bold text-[var(--ink-primary)]">Activate employment record</h2>
                        <p className="mt-1 text-xs leading-5 text-[var(--ink-secondary)]">
                            Activation also enables the linked portal identity. The service rejects this action while required blockers remain open.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={completeCase}
                        disabled={onboardingCase.status === 'completed'}
                        className="municipal-primary-button shrink-0 disabled:opacity-40"
                    >
                        Complete onboarding
                    </button>
                </section>
            </div>
        </AppLayout>
    );
}
