import { Link, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { DateInput, PageHeader, StatusBadge } from '../../../components/ui';
import AppLayout from '../../../layouts/AppLayout';
import { formatDatePH, humanizeSlug } from '../../../lib/format';

type Department = { id: number; code: string; name: string; short_name?: string | null };
type Employee = { id: number; employee_number: string; full_name: string; position_title: string; department?: Department };
type OffboardingCase = { id: number; separation_type: string; effective_date: string; status: string; open_required_tasks_count: number; employee: Employee };
type Props = { cases: OffboardingCase[]; employees: Employee[]; today: string };

export default function OffboardingIndex({ cases, employees, today }: Props) {
    const form = useForm({ employee_id: '', separation_type: 'resignation', effective_date: today, reason: '' });
    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.post('/hris/admin/offboarding', { preserveScroll: true });
    };

    return (
        <AppLayout title="Employee Offboarding">
            <div className="mx-auto max-w-[1440px] space-y-5 px-4 py-5 sm:px-6">
                <PageHeader
                    eyebrow="HRIS · Separation control"
                    title="Offboarding & Clearance"
                    subtitle="Separation is blocked by unresolved work, accountable property, payroll review, records handover, biometric disablement, and mandatory clearances. Portal access is revoked only during finalization."
                />

                <section className="grid gap-5 xl:grid-cols-[.9fr_1.1fr]">
                    <form onSubmit={submit} className="tcds-card space-y-4 p-5">
                        <div>
                            <div className="text-xs font-bold uppercase tracking-wider text-[var(--brand-ink)]">Active employee</div>
                            <h2 className="mt-0.5 text-lg font-bold text-[var(--ink-primary)]">Start separation case</h2>
                        </div>
                        <div className="space-y-3">
                            <label className="block">
                                <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-[var(--ink-secondary)]">Employee</span>
                                <select value={form.data.employee_id} onChange={(e) => form.setData('employee_id', e.target.value)} className="tcds-input" required>
                                    <option value="">Select employee</option>
                                    {employees.map((e) => (
                                        <option key={e.id} value={e.id}>
                                            {e.full_name} · {e.employee_number} · {e.department?.short_name || e.department?.name}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label className="block">
                                <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-[var(--ink-secondary)]">Separation type</span>
                                <select value={form.data.separation_type} onChange={(e) => form.setData('separation_type', e.target.value)} className="tcds-input">
                                    <option value="resignation">Resignation</option>
                                    <option value="retirement">Retirement</option>
                                    <option value="end_of_contract">End of contract</option>
                                    <option value="termination">Termination</option>
                                    <option value="transfer_out">Transfer out</option>
                                    <option value="other">Other</option>
                                </select>
                            </label>
                            <div>
                                <label htmlFor="offb-effective" className="mb-1 block text-xs font-bold uppercase tracking-wide text-[var(--ink-secondary)]">
                                    Effective date
                                </label>
                                <DateInput id="offb-effective" value={form.data.effective_date} onChange={(next) => form.setData('effective_date', next)} required />
                            </div>
                            <label className="block">
                                <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-[var(--ink-secondary)]">Reason / authority</span>
                                <textarea value={form.data.reason} onChange={(e) => form.setData('reason', e.target.value)} className="tcds-input min-h-24 resize-y" />
                            </label>
                        </div>
                        {Object.keys(form.errors).length > 0 && (
                            <div className="rounded-lg border border-[var(--status-danger-border)] bg-[var(--status-danger-bg)] p-3 text-xs font-semibold text-[var(--status-danger-fg)]">
                                {Object.values(form.errors)[0]}
                            </div>
                        )}
                        <button type="submit" disabled={form.processing} className="municipal-primary-button w-full disabled:opacity-50">
                            {form.processing ? 'Starting…' : 'Start offboarding'}
                        </button>
                    </form>

                    <div className="tcds-card overflow-hidden">
                        <div className="border-b border-[var(--border-default)] bg-[var(--surface-recessed)] px-4 py-3">
                            <h2 className="text-sm font-bold text-[var(--ink-primary)]">Offboarding cases</h2>
                        </div>
                        <div className="divide-y divide-[var(--border-default)]">
                            {cases.map((c) => (
                                <Link key={c.id} href={`/hris/admin/offboarding/${c.id}`} className="block px-4 py-3.5 transition-colors hover:bg-[var(--surface-hover)]">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <div className="text-sm font-semibold text-[var(--ink-primary)]">{c.employee.full_name}</div>
                                            <div className="mt-0.5 text-xs text-[var(--ink-secondary)]">
                                                {c.employee.employee_number} · {humanizeSlug(c.separation_type)} · Effective {formatDatePH(c.effective_date)}
                                            </div>
                                        </div>
                                        <StatusBadge tone={c.open_required_tasks_count > 0 ? 'warn' : 'ok'}>
                                            {c.open_required_tasks_count} {c.open_required_tasks_count === 1 ? 'blocker' : 'blockers'}
                                        </StatusBadge>
                                    </div>
                                </Link>
                            ))}
                            {cases.length === 0 && (
                                <div className="p-6 text-center text-sm text-[var(--ink-secondary)]">No offboarding cases yet.</div>
                            )}
                        </div>
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}
