import { Link, router } from '@inertiajs/react';
import { Button, StatusBadge } from '../../components/ui';
import AppLayout from '../../layouts/AppLayout';
import { formatDatePH, humanizeSlug } from '../../lib/format';

type Employee = {
    id: number;
    employee_number: string;
    full_name?: string | null;
    position_title: string;
    employment_status: string;
    user?: { name: string; email: string } | null;
    department: { name: string; short_name?: string | null };
};

export default function Admin({ employees, pending }: { employees: Employee[]; pending: any[] }) {
    return (
        <AppLayout title="HR Administration">
            <div className="mx-auto max-w-[1440px] space-y-5 px-4 py-5 sm:px-6">
                <section className="rounded-2xl bg-[var(--surface-sidebar)] p-6 text-white sm:p-7">
                    <div className="text-xs font-bold uppercase tracking-wider text-[var(--accent-gold)]">
                        Restricted HR workspace
                    </div>
                    <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                        HRIS Administration
                    </h1>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--surface-sidebar-ink)]">
                        Personnel administration is server-side restricted. Lifecycle controls coordinate onboarding, employee movement, attendance and DTR evidence, payroll context, performance and development records, and property review.
                    </p>
                    <div className="mt-5 flex flex-wrap gap-2">
                        <Link
                            href="/hris/admin/lifecycle"
                            className="inline-flex min-h-11 items-center rounded-lg bg-[#eaf4ee] px-4 text-sm font-bold text-[#0e4d36] transition-colors hover:bg-white"
                        >
                            Employee lifecycle
                        </Link>
                        <Link
                            href="/hris/admin/development"
                            className="inline-flex min-h-11 items-center rounded-lg border border-white/25 bg-white/10 px-4 text-sm font-semibold text-white transition-colors hover:bg-white/20"
                        >
                            Performance &amp; development
                        </Link>
                        <Link
                            href="/hris/dtr"
                            className="inline-flex min-h-11 items-center rounded-lg border border-white/25 bg-white/10 px-4 text-sm font-semibold text-white transition-colors hover:bg-white/20"
                        >
                            Attendance &amp; DTR
                        </Link>
                        <Link
                            href="/hris/payroll"
                            className="inline-flex min-h-11 items-center rounded-lg border border-white/25 bg-white/10 px-4 text-sm font-semibold text-white transition-colors hover:bg-white/20"
                        >
                            Payroll
                        </Link>
                        <Link
                            href="/property"
                            className="inline-flex min-h-11 items-center rounded-lg border border-white/25 bg-white/10 px-4 text-sm font-semibold text-white transition-colors hover:bg-white/20"
                        >
                            Property accountability
                        </Link>
                    </div>
                </section>

                <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
                    <div className="tcds-card overflow-hidden">
                        <div className="border-b border-[var(--border-default)] px-5 py-4">
                            <h2 className="text-base font-bold text-[var(--ink-primary)]">Pending leave requests</h2>
                        </div>
                        <div className="divide-y divide-[var(--border-default)]">
                            {pending.map((r: any) => (
                                <div key={r.id} className="p-5">
                                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                        <div>
                                            <div className="font-semibold text-[var(--ink-primary)]">
                                                {r.employee.full_name || r.employee.user?.name || r.employee.employee_number}
                                            </div>
                                            <div className="mt-1 text-sm text-[var(--ink-secondary)]">
                                                {r.employee.department.short_name || r.employee.department.name} · {r.leave_type.name}
                                            </div>
                                            <div className="mt-1.5 text-sm text-[var(--ink-secondary)]">
                                                {formatDatePH(r.start_date)} – {formatDatePH(r.end_date)} · {Number(r.units).toFixed(1)} units
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button size="sm" onClick={() => router.post(`/hris/admin/leave-requests/${r.id}/approve`)}>Approve</Button>
                                            <Button size="sm" variant="danger" onClick={() => router.post(`/hris/admin/leave-requests/${r.id}/reject`)}>Reject</Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {pending.length === 0 && (
                                <div className="p-10 text-center text-sm text-[var(--ink-secondary)]">
                                    No pending leave requests.
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="tcds-card overflow-hidden">
                        <div className="border-b border-[var(--border-default)] px-5 py-4">
                            <h2 className="text-base font-bold text-[var(--ink-primary)]">Employee directory</h2>
                            <p className="mt-0.5 text-xs text-[var(--ink-secondary)]">
                                {employees.length} internal employee {employees.length === 1 ? 'record' : 'records'}
                            </p>
                        </div>
                        <div className="max-h-[560px] divide-y divide-[var(--border-default)] overflow-auto">
                            {employees.map((e) => (
                                <Link
                                    href={`/employees/${e.id}`}
                                    key={e.id}
                                    className="block px-5 py-4 transition-colors hover:bg-[var(--surface-hover)]"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <div className="font-semibold text-[var(--ink-primary)]">
                                                {e.full_name || e.user?.name || e.employee_number}
                                            </div>
                                            <div className="mt-0.5 text-xs text-[var(--ink-secondary)]">
                                                <span className="font-mono">{e.employee_number}</span> · {e.position_title}
                                            </div>
                                            <div className="mt-1 text-xs font-semibold text-[var(--brand-ink)]">
                                                {e.department.short_name || e.department.name}
                                            </div>
                                        </div>
                                        <StatusBadge tone={e.employment_status === 'active' ? 'ok' : 'neutral'}>
                                            {humanizeSlug(e.employment_status)}
                                        </StatusBadge>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}
