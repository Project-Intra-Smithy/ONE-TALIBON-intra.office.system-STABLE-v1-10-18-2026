import { Link, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { DateInput, KpiCard, PageHeader, StatusBadge } from '../../../components/ui';
import AppLayout from '../../../layouts/AppLayout';
import { formatDatePH, humanizeSlug } from '../../../lib/format';

type Department = { id: number; code: string; name: string; short_name?: string | null; branch?: string };
type Employee = { id: number; employee_number: string; full_name: string; department_id: number; position_title: string; department?: Department };
type OnboardingCase = { id: number; status: string; planned_start_date?: string | null; appointment_reference?: string | null; open_required_tasks_count: number; employee: Employee; target_department: Department };
type Movement = { id: number; movement_type: string; effective_date: string; open_required_tasks_count: number; employee: Employee; from_department?: Department | null; to_department: Department };

type Props = {
    onboardingCases: OnboardingCase[];
    movements: Movement[];
    departments: Department[];
    employees: Employee[];
    supervisors: Employee[];
    today: string;
    summary: { onboardingActive: number; onboardingBlocked: number; movementReviews: number };
};

export default function LifecycleIndex({ onboardingCases, movements, departments, employees, supervisors, today, summary }: Props) {
    const onboarding = useForm({
        full_name: '',
        work_email: '',
        department_id: '',
        position_title: '',
        employment_type: 'regular',
        appointment_date: '',
        planned_start_date: '',
        supervisor_employee_id: '',
        appointment_reference: '',
    });
    const movement = useForm({
        employee_id: '',
        movement_type: 'transfer',
        effective_date: today,
        to_department_id: '',
        to_position_title: '',
        new_supervisor_employee_id: '',
        reason: '',
    });

    const submitOnboarding = (event: FormEvent) => {
        event.preventDefault();
        onboarding.post('/hris/admin/lifecycle/onboarding', { preserveScroll: true });
    };
    const submitMovement = (event: FormEvent) => {
        event.preventDefault();
        if (!movement.data.employee_id) return;
        movement.post(`/hris/admin/lifecycle/employees/${movement.data.employee_id}/movements`, { preserveScroll: true });
    };

    return (
        <AppLayout title="Employee Lifecycle">
            <div className="mx-auto max-w-[1440px] space-y-5 px-4 py-5 sm:px-6">
                <PageHeader
                    eyebrow="HRIS · Lifecycle control"
                    title="Onboarding & Employment Movement"
                    subtitle="Activation is blocker-driven. Office movements generate access, open-work, and property-accountability review tasks instead of silently mutating employee records."
                />

                <section className="grid grid-cols-1 gap-3 sm:grid-cols-3" aria-label="Lifecycle summary">
                    <KpiCard label="Active onboarding" value={summary.onboardingActive} accent="brand" />
                    <KpiCard label="Blocked cases" value={summary.onboardingBlocked} accent={summary.onboardingBlocked > 0 ? 'warn' : 'ok'} />
                    <KpiCard label="Movement reviews" value={summary.movementReviews} accent="neutral" />
                </section>

                <section className="grid gap-5 lg:grid-cols-2">
                    <form onSubmit={submitOnboarding} className="tcds-card space-y-4 p-5">
                        <div>
                            <div className="text-xs font-bold uppercase tracking-wider text-[var(--brand-ink)]">New employee</div>
                            <h2 className="mt-0.5 text-lg font-bold text-[var(--ink-primary)]">Start onboarding</h2>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <label className="block sm:col-span-2">
                                <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-[var(--ink-secondary)]">Full name</span>
                                <input value={onboarding.data.full_name} onChange={(e) => onboarding.setData('full_name', e.target.value)} className="tcds-input" required />
                            </label>
                            <label className="block sm:col-span-2">
                                <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-[var(--ink-secondary)]">Municipal work email</span>
                                <input type="email" value={onboarding.data.work_email} onChange={(e) => onboarding.setData('work_email', e.target.value)} className="tcds-input" required />
                            </label>
                            <label className="block">
                                <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-[var(--ink-secondary)]">Office</span>
                                <select value={onboarding.data.department_id} onChange={(e) => onboarding.setData('department_id', e.target.value)} className="tcds-input" required>
                                    <option value="">Select office</option>
                                    {departments.map((d) => <option key={d.id} value={d.id}>{d.short_name || d.name}</option>)}
                                </select>
                            </label>
                            <label className="block">
                                <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-[var(--ink-secondary)]">Position</span>
                                <input value={onboarding.data.position_title} onChange={(e) => onboarding.setData('position_title', e.target.value)} className="tcds-input" required />
                            </label>
                            <label className="block">
                                <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-[var(--ink-secondary)]">Employment type</span>
                                <select value={onboarding.data.employment_type} onChange={(e) => onboarding.setData('employment_type', e.target.value)} className="tcds-input">
                                    <option value="regular">Regular</option>
                                    <option value="permanent">Permanent</option>
                                    <option value="casual">Casual</option>
                                    <option value="contractual">Contractual</option>
                                    <option value="coterminous">Coterminous</option>
                                    <option value="job_order">Job order</option>
                                    <option value="other">Other</option>
                                </select>
                            </label>
                            <div>
                                <label htmlFor="onb-start" className="mb-1 block text-xs font-bold uppercase tracking-wide text-[var(--ink-secondary)]">Planned start</label>
                                <DateInput id="onb-start" min={today} value={onboarding.data.planned_start_date} onChange={(next) => onboarding.setData('planned_start_date', next)} />
                            </div>
                            <div>
                                <label htmlFor="onb-apt" className="mb-1 block text-xs font-bold uppercase tracking-wide text-[var(--ink-secondary)]">Appointment date</label>
                                <DateInput id="onb-apt" value={onboarding.data.appointment_date} onChange={(next) => onboarding.setData('appointment_date', next)} />
                            </div>
                            <label className="block">
                                <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-[var(--ink-secondary)]">Appointment reference</span>
                                <input value={onboarding.data.appointment_reference} onChange={(e) => onboarding.setData('appointment_reference', e.target.value)} className="tcds-input" />
                            </label>
                            <label className="block sm:col-span-2">
                                <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-[var(--ink-secondary)]">Supervisor (optional)</span>
                                <select value={onboarding.data.supervisor_employee_id} onChange={(e) => onboarding.setData('supervisor_employee_id', e.target.value)} className="tcds-input">
                                    <option value="">Assign later</option>
                                    {supervisors
                                        .filter((s) => !onboarding.data.department_id || String(s.department_id) === String(onboarding.data.department_id))
                                        .map((s) => <option key={s.id} value={s.id}>{s.full_name} · {s.position_title}</option>)}
                                </select>
                            </label>
                        </div>
                        {Object.keys(onboarding.errors).length > 0 && (
                            <div className="rounded-lg border border-[var(--status-danger-border)] bg-[var(--status-danger-bg)] p-3 text-xs font-semibold text-[var(--status-danger-fg)]">
                                {Object.values(onboarding.errors)[0]}
                            </div>
                        )}
                        <button type="submit" disabled={onboarding.processing} className="municipal-primary-button w-full disabled:opacity-50">
                            {onboarding.processing ? 'Creating…' : 'Create onboarding case'}
                        </button>
                    </form>

                    <form onSubmit={submitMovement} className="tcds-card space-y-4 p-5">
                        <div>
                            <div className="text-xs font-bold uppercase tracking-wider text-[var(--brand-ink)]">Active workforce</div>
                            <h2 className="mt-0.5 text-lg font-bold text-[var(--ink-primary)]">Apply employment movement</h2>
                            <p className="mt-1 text-xs leading-5 text-[var(--ink-secondary)]">
                                Applies the movement immediately. Future-dated scheduling requires a formal scheduler workflow.
                            </p>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <label className="block sm:col-span-2">
                                <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-[var(--ink-secondary)]">Employee</span>
                                <select value={movement.data.employee_id} onChange={(e) => movement.setData('employee_id', e.target.value)} className="tcds-input" required>
                                    <option value="">Select employee</option>
                                    {employees.map((e) => <option key={e.id} value={e.id}>{e.full_name} · {e.employee_number} · {e.department?.short_name || e.department?.name}</option>)}
                                </select>
                            </label>
                            <label className="block">
                                <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-[var(--ink-secondary)]">Movement</span>
                                <select value={movement.data.movement_type} onChange={(e) => movement.setData('movement_type', e.target.value)} className="tcds-input">
                                    <option value="transfer">Transfer</option>
                                    <option value="promotion">Promotion</option>
                                    <option value="reassignment">Reassignment</option>
                                    <option value="acting_assignment">Acting assignment</option>
                                </select>
                            </label>
                            <div>
                                <label htmlFor="mov-effective" className="mb-1 block text-xs font-bold uppercase tracking-wide text-[var(--ink-secondary)]">Effective date</label>
                                <DateInput id="mov-effective" max={today} value={movement.data.effective_date} onChange={(next) => movement.setData('effective_date', next)} required />
                            </div>
                            <label className="block">
                                <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-[var(--ink-secondary)]">Destination office</span>
                                <select value={movement.data.to_department_id} onChange={(e) => movement.setData('to_department_id', e.target.value)} className="tcds-input" required>
                                    <option value="">Select office</option>
                                    {departments.map((d) => <option key={d.id} value={d.id}>{d.short_name || d.name}</option>)}
                                </select>
                            </label>
                            <label className="block">
                                <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-[var(--ink-secondary)]">New position (optional)</span>
                                <input value={movement.data.to_position_title} onChange={(e) => movement.setData('to_position_title', e.target.value)} className="tcds-input" />
                            </label>
                            <label className="block sm:col-span-2">
                                <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-[var(--ink-secondary)]">New supervisor (optional)</span>
                                <select value={movement.data.new_supervisor_employee_id} onChange={(e) => movement.setData('new_supervisor_employee_id', e.target.value)} className="tcds-input">
                                    <option value="">Keep current / assign later</option>
                                    {supervisors
                                        .filter((s) => !movement.data.to_department_id || String(s.department_id) === String(movement.data.to_department_id))
                                        .map((s) => <option key={s.id} value={s.id}>{s.full_name} · {s.position_title}</option>)}
                                </select>
                            </label>
                            <label className="block sm:col-span-2">
                                <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-[var(--ink-secondary)]">Reason / authority</span>
                                <textarea value={movement.data.reason} onChange={(e) => movement.setData('reason', e.target.value)} className="tcds-input min-h-20 resize-y" />
                            </label>
                        </div>
                        {Object.keys(movement.errors).length > 0 && (
                            <div className="rounded-lg border border-[var(--status-danger-border)] bg-[var(--status-danger-bg)] p-3 text-xs font-semibold text-[var(--status-danger-fg)]">
                                {Object.values(movement.errors)[0]}
                            </div>
                        )}
                        <button type="submit" disabled={movement.processing || !movement.data.employee_id} className="municipal-primary-button w-full disabled:opacity-50">
                            {movement.processing ? 'Applying…' : 'Apply movement'}
                        </button>
                    </form>
                </section>

                <section className="grid gap-5 lg:grid-cols-2">
                    <div className="tcds-card overflow-hidden">
                        <div className="border-b border-[var(--border-default)] bg-[var(--surface-recessed)] px-4 py-3">
                            <h2 className="text-sm font-bold text-[var(--ink-primary)]">Onboarding cases</h2>
                        </div>
                        <div className="divide-y divide-[var(--border-default)]">
                            {onboardingCases.map((c) => (
                                <Link key={c.id} href={`/hris/admin/lifecycle/onboarding/${c.id}`} className="block px-4 py-3.5 transition-colors hover:bg-[var(--surface-hover)]">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <div className="text-sm font-semibold text-[var(--ink-primary)]">{c.employee.full_name}</div>
                                            <div className="mt-0.5 text-xs text-[var(--ink-secondary)]">
                                                {c.employee.employee_number} · {c.target_department.short_name || c.target_department.name}
                                                {c.planned_start_date ? ` · Starts ${formatDatePH(c.planned_start_date)}` : ''}
                                            </div>
                                        </div>
                                        <StatusBadge tone={c.open_required_tasks_count > 0 ? 'warn' : 'ok'}>
                                            {c.open_required_tasks_count} {c.open_required_tasks_count === 1 ? 'blocker' : 'blockers'}
                                        </StatusBadge>
                                    </div>
                                </Link>
                            ))}
                            {onboardingCases.length === 0 && (
                                <div className="p-6 text-center text-sm text-[var(--ink-secondary)]">No onboarding cases yet.</div>
                            )}
                        </div>
                    </div>

                    <div className="tcds-card overflow-hidden">
                        <div className="border-b border-[var(--border-default)] bg-[var(--surface-recessed)] px-4 py-3">
                            <h2 className="text-sm font-bold text-[var(--ink-primary)]">Recent movements</h2>
                        </div>
                        <div className="divide-y divide-[var(--border-default)]">
                            {movements.map((m) => (
                                <div key={m.id} className="px-4 py-3.5">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <div className="text-sm font-semibold text-[var(--ink-primary)]">{m.employee.full_name}</div>
                                            <div className="mt-0.5 text-xs text-[var(--ink-secondary)]">
                                                {humanizeSlug(m.movement_type)} · {m.from_department?.short_name || m.from_department?.name || '—'} → {m.to_department.short_name || m.to_department.name} · {formatDatePH(m.effective_date)}
                                            </div>
                                        </div>
                                        <StatusBadge tone="neutral">
                                            {m.open_required_tasks_count} {m.open_required_tasks_count === 1 ? 'review' : 'reviews'}
                                        </StatusBadge>
                                    </div>
                                </div>
                            ))}
                            {movements.length === 0 && (
                                <div className="p-6 text-center text-sm text-[var(--ink-secondary)]">No employment movements recorded.</div>
                            )}
                        </div>
                    </div>
                </section>

                <div className="rounded-xl border border-[var(--status-warn-border)] bg-[var(--status-warn-bg)] px-4 py-3 text-xs leading-5 text-[var(--status-warn-fg)]">
                    <strong>Integration boundary:</strong> payroll setup and biometric enrollment are operational checklist items at this milestone. Completing those tasks records administrative confirmation without claiming live hardware or statutory payroll integration.
                </div>
            </div>
        </AppLayout>
    );
}
