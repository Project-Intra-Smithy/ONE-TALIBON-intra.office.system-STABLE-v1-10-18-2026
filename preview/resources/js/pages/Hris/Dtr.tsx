import { Link, router, useForm } from '@inertiajs/react';
import { CalendarDays, CheckCircle2, Clock3, Fingerprint, LockKeyhole, ShieldCheck } from 'lucide-react';
import type { FormEvent } from 'react';
import { Button, DateInput, KpiCard, PageHeader, StatusBadge } from '../../components/ui';
import AppLayout from '../../layouts/AppLayout';
import { formatDatePH, humanizeSlug } from '../../lib/format';

type Period = {
    id: number;
    label: string;
    period_start: string;
    period_end: string;
    status: string;
    generated_at?: string | null;
    locked_at?: string | null;
};

type Summary = {
    id: number;
    work_date: string;
    first_in_at?: string | null;
    last_out_at?: string | null;
    raw_event_count: number;
    leave_status?: string | null;
    source_status: string;
};

type Snapshot = {
    daysWithLogs: number;
    completeDays: number;
    partialDays: number;
    leaveDaysRepresented: number;
    approvedLeaveUnits: number;
};

type PayrollPeriod = {
    id: number;
    label: string;
    period_start: string;
    period_end: string;
    status: string;
    dtr_period_id?: number | null;
    calculation_mode?: string | null;
};

type Employee = {
    employee_number: string;
    full_name: string;
    department?: { name: string; short_name?: string | null } | null;
};

function formatTime(value?: string | null) {
    return value ? new Date(value).toLocaleTimeString('en-PH', { timeZone: 'Asia/Manila', hour: '2-digit', minute: '2-digit' }) : '—';
}

export default function Dtr({ period, employee, summaries, snapshot, isHrAdmin, payrollPeriods }: {
    period: Period | null;
    employee: Employee;
    summaries: Summary[];
    snapshot: Snapshot | null;
    isHrAdmin: boolean;
    payrollPeriods: PayrollPeriod[];
}) {
    const today = new Date().toISOString().slice(0, 10);
    const startOfMonth = `${today.slice(0, 8)}01`;
    const generation = useForm({ label: '', period_start: startOfMonth, period_end: today });
    const payrollLink = useForm({ payroll_period_id: payrollPeriods[0]?.id ?? '', dtr_period_id: period?.id ?? '' });

    const generate = (event: FormEvent) => {
        event.preventDefault();
        generation.post('/hris/admin/dtr/generate', { preserveScroll: true });
    };

    const linkPayroll = (event: FormEvent) => {
        event.preventDefault();
        if (!payrollLink.data.payroll_period_id || !period) return;
        router.post(`/hris/admin/payroll/${payrollLink.data.payroll_period_id}/link-dtr`, { dtr_period_id: period.id }, { preserveScroll: true });
    };

    const toneForState = (state: string): 'ok' | 'warn' | 'info' | 'neutral' => {
        if (state === 'complete_pair') return 'ok';
        if (state === 'partial') return 'warn';
        if (state === 'leave_only') return 'info';
        return 'neutral';
    };

    return (
        <AppLayout title="Attendance & DTR">
            <div className="mx-auto max-w-[1440px] space-y-5 px-4 py-5 sm:px-6">
                <PageHeader
                    eyebrow="HRIS attendance evidence"
                    title="Daily Time Record"
                    subtitle={`${employee.employee_number} · ${employee.full_name} · ${employee.department?.short_name || employee.department?.name || 'No office'}`}
                    actions={
                        <div className="flex flex-wrap gap-2">
                            <Link href="/hris" className="municipal-secondary-button">HRIS</Link>
                            <Link href="/hris/payroll" className="municipal-primary-button">Payroll</Link>
                        </div>
                    }
                />

                <section className="rounded-xl border border-[var(--status-warn-border)] bg-[var(--status-warn-bg)] p-4 text-sm text-[var(--status-warn-fg)]">
                    <div className="flex items-start gap-3">
                        <ShieldCheck className="mt-0.5 shrink-0" size={18} aria-hidden="true" />
                        <div>
                            <strong>Evidence boundary:</strong> DTR summaries are derived strictly from recorded attendance logs and approved leave without inferring absences, undertime, or biometric connectivity before official schedule validation.
                        </div>
                    </div>
                </section>

                {period ? (
                    <>
                        <section className="grid grid-cols-2 gap-3 lg:grid-cols-6">
                            <div className="col-span-2 rounded-xl bg-[var(--surface-sidebar)] p-4 text-white">
                                <div className="text-xs font-bold uppercase tracking-wider text-[var(--accent-gold)]">Current DTR period</div>
                                <div className="mt-1.5 text-lg font-extrabold">{period.label}</div>
                                <div className="mt-1 text-xs text-[var(--surface-sidebar-muted)]">
                                    {formatDatePH(period.period_start)} – {formatDatePH(period.period_end)}
                                </div>
                                <span className="mt-3 inline-flex rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-bold uppercase text-white">
                                    {humanizeSlug(period.status)}
                                </span>
                            </div>
                            <KpiCard label="Days with logs" value={snapshot?.daysWithLogs ?? 0} accent="brand" />
                            <KpiCard label="Complete pairs" value={snapshot?.completeDays ?? 0} accent="ok" />
                            <KpiCard label="Partial days" value={snapshot?.partialDays ?? 0} accent="warn" />
                            <KpiCard label="Approved leave" value={snapshot?.approvedLeaveUnits ?? 0} accent="neutral" />
                        </section>

                        <section className="tcds-card overflow-hidden">
                            <div className="flex items-center gap-2.5 border-b border-[var(--border-default)] px-5 py-4">
                                <Fingerprint size={18} aria-hidden="true" className="text-[var(--brand-ink)]" />
                                <div>
                                    <h2 className="text-base font-bold text-[var(--ink-primary)]">Recorded daily evidence</h2>
                                    <p className="mt-0.5 text-xs text-[var(--ink-secondary)]">
                                        No row is manufactured for a day without recorded attendance or approved leave.
                                    </p>
                                </div>
                            </div>
                            {summaries.length === 0 ? (
                                <div className="p-8 text-center text-sm text-[var(--ink-secondary)]">
                                    No attendance or approved-leave evidence exists in this DTR period.
                                </div>
                            ) : (
                                <div tabIndex={0} role="region" aria-label="Daily time record table" className="tcds-table-region rounded-none border-0">
                                    <table className="tcds-table" data-stack-mobile="true">
                                        <thead>
                                            <tr>
                                                <th scope="col">Date</th>
                                                <th scope="col">First In</th>
                                                <th scope="col">Last Out</th>
                                                <th scope="col">Events</th>
                                                <th scope="col">Leave</th>
                                                <th scope="col">Evidence State</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {summaries.map((row) => (
                                                <tr key={row.id}>
                                                    <th scope="row" className="whitespace-nowrap font-semibold text-[var(--ink-primary)]">
                                                        {formatDatePH(row.work_date)}
                                                    </th>
                                                    <td data-label="First In" className="whitespace-nowrap text-sm">{formatTime(row.first_in_at)}</td>
                                                    <td data-label="Last Out" className="whitespace-nowrap text-sm">{formatTime(row.last_out_at)}</td>
                                                    <td data-label="Events" className="text-sm">{row.raw_event_count}</td>
                                                    <td data-label="Leave" className="text-sm">{row.leave_status === 'approved' ? 'Approved' : '—'}</td>
                                                    <td data-label="Evidence State">
                                                        <StatusBadge tone={toneForState(row.source_status)}>
                                                            {humanizeSlug(row.source_status)}
                                                        </StatusBadge>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </section>
                    </>
                ) : (
                    <section className="tcds-card p-8 text-center text-sm text-[var(--ink-secondary)]">
                        No DTR period has been generated yet.
                    </section>
                )}

                {isHrAdmin && (
                    <section className="grid gap-5 xl:grid-cols-2">
                        <form onSubmit={generate} className="tcds-card space-y-4 p-5">
                            <div className="flex items-center gap-2">
                                <CalendarDays size={18} aria-hidden="true" className="text-[var(--brand-ink)]" />
                                <h2 className="text-base font-bold text-[var(--ink-primary)]">Generate DTR period</h2>
                            </div>
                            <p className="text-xs text-[var(--ink-secondary)]">
                                Rebuilds summary evidence from raw attendance logs and approved leave. Locked periods cannot be regenerated.
                            </p>
                            <div className="grid gap-3 sm:grid-cols-2">
                                <label className="sm:col-span-2">
                                    <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-[var(--ink-secondary)]">Label (optional)</span>
                                    <input value={generation.data.label} onChange={(e) => generation.setData('label', e.target.value)} className="tcds-input" placeholder="November 2026 DTR" />
                                </label>
                                <div>
                                    <label htmlFor="dtr-start" className="mb-1 block text-xs font-bold uppercase tracking-wide text-[var(--ink-secondary)]">Start</label>
                                    <DateInput id="dtr-start" value={generation.data.period_start} onChange={(next) => generation.setData('period_start', next)} />
                                </div>
                                <div>
                                    <label htmlFor="dtr-end" className="mb-1 block text-xs font-bold uppercase tracking-wide text-[var(--ink-secondary)]">End</label>
                                    <DateInput id="dtr-end" value={generation.data.period_end} onChange={(next) => generation.setData('period_end', next)} min={generation.data.period_start || undefined} />
                                </div>
                            </div>
                            <Button type="submit" disabled={generation.processing}>Generate evidence snapshot</Button>
                        </form>

                        <div className="tcds-card space-y-4 p-5">
                            <div>
                                <div className="flex items-center gap-2">
                                    <LockKeyhole size={18} aria-hidden="true" className="text-[var(--brand-ink)]" />
                                    <h2 className="text-base font-bold text-[var(--ink-primary)]">Payroll context control</h2>
                                </div>
                                <p className="mt-1 text-xs text-[var(--ink-secondary)]">
                                    DTR may be linked only after locking. Linking snapshots attendance and leave context without altering payroll figures.
                                </p>
                            </div>
                            {period && period.status !== 'locked' && (
                                <Button variant="secondary" onClick={() => router.post(`/hris/admin/dtr/${period.id}/lock`, {}, { preserveScroll: true })}>
                                    <LockKeyhole size={15} aria-hidden="true" />
                                    <span>Lock current DTR</span>
                                </Button>
                            )}
                            {period?.status === 'locked' && (
                                <StatusBadge tone="ok"><CheckCircle2 size={14} aria-hidden="true" /> DTR locked</StatusBadge>
                            )}
                            <form onSubmit={linkPayroll} className="space-y-3">
                                <label className="block">
                                    <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-[var(--ink-secondary)]">Payroll period</span>
                                    <select value={payrollLink.data.payroll_period_id} onChange={(e) => payrollLink.setData('payroll_period_id', Number(e.target.value))} className="tcds-input">
                                        <option value="">Choose payroll period…</option>
                                        {payrollPeriods.map((payroll) => (
                                            <option key={payroll.id} value={payroll.id}>
                                                {payroll.label} · {humanizeSlug(payroll.calculation_mode || 'preview')}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                                <Button type="submit" disabled={!period || period.status !== 'locked' || !payrollLink.data.payroll_period_id}>
                                    Link locked DTR context
                                </Button>
                            </form>
                        </div>
                    </section>
                )}

                <div className="flex items-start gap-2.5 rounded-xl border border-[var(--border-default)] bg-[var(--surface-recessed)] p-3.5 text-xs leading-5 text-[var(--ink-secondary)]">
                    <Clock3 size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
                    <span>
                        DTR evidence aggregation reflects recorded attendance and approved leave. Official work schedules, overtime policies, and biometric integrations activate upon LGU production validation.
                    </span>
                </div>
            </div>
        </AppLayout>
    );
}
