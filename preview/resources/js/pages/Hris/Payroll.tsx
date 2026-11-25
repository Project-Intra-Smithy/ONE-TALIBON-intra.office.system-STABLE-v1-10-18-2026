import { Link } from '@inertiajs/react';
import { Banknote, CheckCircle2, Clock3, ShieldCheck } from 'lucide-react';
import { PageHeader, StatusBadge } from '../../components/ui';
import AppLayout from '../../layouts/AppLayout';
import { formatCurrencyPHP, formatDatePH, humanizeSlug } from '../../lib/format';

type Department = { name: string; short_name?: string | null };
type Employee = { employee_number: string; full_name?: string | null; department?: Department | null };
type DtrPeriod = { id: number; label: string; period_start: string; period_end: string; status: string };
type Period = {
    id: number;
    label: string;
    period_start: string;
    period_end: string;
    status: string;
    calculation_mode?: string | null;
    source_notes?: string | null;
    dtr_period?: DtrPeriod | null;
};
type Entry = {
    id: number;
    basic_pay: string;
    allowances: string;
    gross_pay: string;
    gsis: string;
    philhealth: string;
    pagibig: string;
    withholding_tax: string;
    other_deductions: string;
    total_deductions: string;
    net_pay: string;
    status: string;
    dtr_days_with_logs?: number;
    dtr_complete_days?: number;
    dtr_partial_days?: number;
    approved_leave_units?: string;
    dtr_snapshot_status?: string;
    employee?: Employee;
};
type AdminSummary = {
    employees: number;
    gross: number;
    deductions: number;
    net: number;
    released: number;
    dtrLinked?: number;
    partialDtrDays?: number;
};

export default function Payroll({ period, employee, entry, canAdmin, adminSummary, adminEntries }: {
    period: Period | null;
    employee: Employee;
    entry: Entry | null;
    canAdmin: boolean;
    adminSummary: AdminSummary | null;
    adminEntries: Entry[];
}) {
    return (
        <AppLayout title="Payroll">
            <div className="mx-auto max-w-[1440px] space-y-5 px-4 py-5 sm:px-6">
                <PageHeader
                    eyebrow="Employee payroll record"
                    title="Payroll & Payslip"
                    subtitle={`${employee.employee_number} · ${employee.full_name} · ${employee.department?.short_name || employee.department?.name || 'No office'}`}
                    actions={
                        <div className="flex flex-wrap gap-2">
                            <Link href="/hris/dtr" className="municipal-secondary-button">
                                <Clock3 size={15} aria-hidden="true" />
                                <span>DTR</span>
                            </Link>
                            <Link href="/hris" className="municipal-primary-button">HRIS</Link>
                        </div>
                    }
                />

                <section className="rounded-xl border border-[var(--status-warn-border)] bg-[var(--status-warn-bg)] p-4 text-sm text-[var(--status-warn-fg)]">
                    <div className="flex items-start gap-3">
                        <ShieldCheck className="mt-0.5 shrink-0" size={18} aria-hidden="true" />
                        <div>
                            <strong>Payroll boundary:</strong> Monetary values remain sample preview figures until official Talibon payroll schedules, authorized deductions, and statutory contribution rules are connected. Linked DTR records provide review context only.
                        </div>
                    </div>
                </section>

                {period ? (
                    <>
                        <section className="grid gap-3 sm:grid-cols-3">
                            <div className="rounded-xl bg-[var(--surface-sidebar)] p-5 text-white">
                                <div className="text-xs font-bold uppercase tracking-wider text-[var(--accent-gold)]">Payroll period</div>
                                <div className="mt-1.5 text-lg font-extrabold">{period.label}</div>
                                <div className="mt-1 text-xs text-[var(--surface-sidebar-muted)]">
                                    {formatDatePH(period.period_start)} – {formatDatePH(period.period_end)}
                                </div>
                            </div>

                            <div className="tcds-card p-5">
                                <div className="text-xs font-bold uppercase tracking-wider text-[var(--ink-secondary)]">Calculation mode</div>
                                <div className="mt-2 text-base font-bold text-[var(--ink-primary)]">
                                    {humanizeSlug(period.calculation_mode || 'preview')}
                                </div>
                                <div className="mt-1.5 text-xs leading-5 text-[var(--ink-secondary)]">
                                    {period.source_notes || 'Preview payroll values pending official configuration.'}
                                </div>
                            </div>

                            <div className="tcds-card p-5">
                                <div className="text-xs font-bold uppercase tracking-wider text-[var(--ink-secondary)]">DTR context</div>
                                {period.dtr_period ? (
                                    <>
                                        <div className="mt-2 flex items-center gap-1.5 text-sm font-bold text-[var(--status-ok-fg)]">
                                            <CheckCircle2 size={16} aria-hidden="true" />
                                            <span>Linked</span>
                                        </div>
                                        <div className="mt-1.5 text-xs text-[var(--ink-secondary)]">
                                            {period.dtr_period.label} · {humanizeSlug(period.dtr_period.status)}
                                        </div>
                                    </>
                                ) : (
                                    <div className="mt-2 text-sm font-bold text-[var(--ink-secondary)]">Not linked</div>
                                )}
                            </div>
                        </section>

                        {entry ? (
                            <section className="tcds-card space-y-4 p-5">
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <Banknote size={18} aria-hidden="true" className="text-[var(--brand-ink)]" />
                                        <h2 className="text-base font-bold text-[var(--ink-primary)]">My payroll entry</h2>
                                    </div>
                                    <StatusBadge tone="ok">{humanizeSlug(entry.status)}</StatusBadge>
                                </div>
                                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                                    {[
                                        ['Basic pay', formatCurrencyPHP(entry.basic_pay)],
                                        ['Allowances', formatCurrencyPHP(entry.allowances)],
                                        ['Gross', formatCurrencyPHP(entry.gross_pay)],
                                        ['Net pay', formatCurrencyPHP(entry.net_pay)],
                                    ].map(([label, val], idx) => (
                                        <div key={label} className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-recessed)] p-3">
                                            <div className="text-xs font-bold uppercase text-[var(--ink-secondary)]">{label}</div>
                                            <div className={`mt-1 font-bold tabular-nums ${idx === 3 ? 'text-lg text-[var(--brand-ink)]' : 'text-sm text-[var(--ink-primary)]'}`}>
                                                {val}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="grid grid-cols-2 gap-3 rounded-xl border border-[var(--border-default)] bg-[var(--surface-recessed)] p-3.5 text-xs sm:grid-cols-5">
                                    <div><div className="uppercase text-[var(--ink-secondary)]">GSIS</div><div className="mt-1 font-semibold text-[var(--ink-primary)]">{formatCurrencyPHP(entry.gsis)}</div></div>
                                    <div><div className="uppercase text-[var(--ink-secondary)]">PhilHealth</div><div className="mt-1 font-semibold text-[var(--ink-primary)]">{formatCurrencyPHP(entry.philhealth)}</div></div>
                                    <div><div className="uppercase text-[var(--ink-secondary)]">Pag-IBIG</div><div className="mt-1 font-semibold text-[var(--ink-primary)]">{formatCurrencyPHP(entry.pagibig)}</div></div>
                                    <div><div className="uppercase text-[var(--ink-secondary)]">Withholding</div><div className="mt-1 font-semibold text-[var(--ink-primary)]">{formatCurrencyPHP(entry.withholding_tax)}</div></div>
                                    <div><div className="uppercase text-[var(--ink-secondary)]">Other</div><div className="mt-1 font-semibold text-[var(--ink-primary)]">{formatCurrencyPHP(entry.other_deductions)}</div></div>
                                </div>
                            </section>
                        ) : (
                            <section className="tcds-card p-8 text-center text-sm text-[var(--ink-secondary)]">
                                No payroll entry exists for this employee in the latest period.
                            </section>
                        )}

                        {canAdmin && adminSummary && (
                            <section className="tcds-card space-y-4 p-5">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div>
                                        <h2 className="text-base font-bold text-[var(--ink-primary)]">Restricted payroll summary</h2>
                                        <p className="mt-0.5 text-xs text-[var(--ink-secondary)]">
                                            Administrative totals remain restricted to authorized HR roles.
                                        </p>
                                    </div>
                                    <Link href="/reports/export/payroll-summary" className="municipal-secondary-button">
                                        Export summary
                                    </Link>
                                </div>

                                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
                                    {[
                                        ['Employees', adminSummary.employees],
                                        ['Gross', formatCurrencyPHP(adminSummary.gross)],
                                        ['Deductions', formatCurrencyPHP(adminSummary.deductions)],
                                        ['Net', formatCurrencyPHP(adminSummary.net)],
                                        ['DTR linked', adminSummary.dtrLinked ?? 0],
                                        ['Partial days', adminSummary.partialDtrDays ?? 0],
                                    ].map(([label, value]) => (
                                        <div key={String(label)} className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-recessed)] p-3.5">
                                            <div className="whitespace-nowrap text-xs font-bold uppercase tracking-wide text-[var(--ink-secondary)]">{label}</div>
                                            <div className="mt-1.5 text-base font-extrabold tabular-nums text-[var(--ink-primary)]">{value}</div>
                                        </div>
                                    ))}
                                </div>

                                {adminEntries.length > 0 && (
                                    <div tabIndex={0} role="region" aria-label="Payroll entries" className="tcds-table-region">
                                        <table className="tcds-table" data-stack-mobile="true">
                                            <thead>
                                                <tr>
                                                    <th scope="col">Employee</th>
                                                    <th scope="col">Office</th>
                                                    <th scope="col">Gross</th>
                                                    <th scope="col">Deductions</th>
                                                    <th scope="col">Net</th>
                                                    <th scope="col">DTR</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {adminEntries.map((row) => (
                                                    <tr key={row.id}>
                                                        <th scope="row" className="font-semibold">{row.employee?.full_name || row.employee?.employee_number}</th>
                                                        <td data-label="Office">{row.employee?.department?.short_name || row.employee?.department?.name}</td>
                                                        <td data-label="Gross">{formatCurrencyPHP(row.gross_pay)}</td>
                                                        <td data-label="Deductions">{formatCurrencyPHP(row.total_deductions)}</td>
                                                        <td data-label="Net" className="font-semibold">{formatCurrencyPHP(row.net_pay)}</td>
                                                        <td data-label="DTR">{humanizeSlug(row.dtr_snapshot_status || 'not_linked')}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </section>
                        )}
                    </>
                ) : (
                    <section className="tcds-card p-8 text-center text-sm text-[var(--ink-secondary)]">
                        No payroll period is available.
                    </section>
                )}
            </div>
        </AppLayout>
    );
}
