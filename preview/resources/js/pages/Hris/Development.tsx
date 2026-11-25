import { Link, router, useForm } from '@inertiajs/react';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import type { FormEvent } from 'react';
import { DateInput, FormField, KpiCard, PageHeader, StatusBadge } from '../../components/ui';
import AppLayout from '../../layouts/AppLayout';
import { formatDatePH, humanizeSlug } from '../../lib/format';

type Employee = { id: number; employee_number: string; full_name?: string | null; position_title: string; employment_status: string; contract_end_date?: string | null; department: { name: string; short_name?: string | null } };
type Performance = { id: number; employee: Employee; period_start: string; period_end: string; rating?: string | null; rating_scale?: string | null; status: string; summary?: string | null };
type Development = { id: number; employee: Employee; record_type: string; title: string; provider?: string | null; reference_no?: string | null; attained_at?: string | null; expires_at?: string | null; status: string };
type Summary = { performance: number; development: number; expiringDevelopment: number; contractsDue: number };

export default function Development({
    employees,
    performanceRecords,
    developmentRecords,
    summary,
}: {
    employees: Employee[];
    performanceRecords: Performance[];
    developmentRecords: Development[];
    summary: Summary;
}) {
    const performance = useForm({ employee_id: employees[0]?.id ?? '', period_start: '', period_end: '', rating: '', rating_scale: '5-point', status: 'recorded', summary: '', reviewed: false });
    const development = useForm({ employee_id: employees[0]?.id ?? '', record_type: 'training', title: '', provider: '', reference_no: '', attained_at: '', expires_at: '', status: 'active', notes: '' });

    const submitPerformance = (event: FormEvent) => {
        event.preventDefault();
        if (!performance.data.employee_id) return;
        performance.post(`/hris/admin/development/employees/${performance.data.employee_id}/performance`, {
            preserveScroll: true,
            onSuccess: () => performance.reset('period_start', 'period_end', 'rating', 'summary'),
        });
    };

    const submitDevelopment = (event: FormEvent) => {
        event.preventDefault();
        if (!development.data.employee_id) return;
        development.post(`/hris/admin/development/employees/${development.data.employee_id}/records`, {
            preserveScroll: true,
            onSuccess: () => development.reset('title', 'provider', 'reference_no', 'attained_at', 'expires_at', 'notes'),
        });
    };

    return (
        <AppLayout title="Performance & Development">
            <div className="mx-auto max-w-[1440px] space-y-5 px-4 py-5 sm:px-6">
                <PageHeader
                    eyebrow="HRIS · Personnel Development"
                    title="Performance, Training & Eligibility"
                    subtitle="Track employee performance periods, certifications, and credential expiry reminders."
                    actions={
                        <div className="flex flex-wrap gap-2">
                            <button type="button" onClick={() => router.post('/hris/admin/development/sync-expiries')} className="municipal-primary-button">
                                <RefreshCw size={15} aria-hidden="true" />
                                <span>Sync expiry alerts</span>
                            </button>
                            <Link href="/hris/admin" className="municipal-secondary-button">
                                <ArrowLeft size={15} aria-hidden="true" />
                                <span>HR Administration</span>
                            </Link>
                        </div>
                    }
                />

                <section aria-label="Development summary" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    <KpiCard label="Performance records" value={summary.performance} accent="brand" />
                    <KpiCard label="Development records" value={summary.development} accent="neutral" />
                    <KpiCard label="Credentials due ≤120d" value={summary.expiringDevelopment} accent="warn" />
                    <KpiCard label="Contracts due ≤120d" value={summary.contractsDue} accent="danger" />
                </section>

                <section className="grid gap-5 xl:grid-cols-2">
                    <form onSubmit={submitPerformance} className="tcds-card space-y-4 p-5 sm:p-6">
                        <h2 className="text-base font-bold text-[var(--ink-primary)]">Record performance review</h2>
                        <FormField label="Employee" htmlFor="perf-emp" required>
                            <select id="perf-emp" value={performance.data.employee_id} onChange={(e) => performance.setData('employee_id', Number(e.target.value))} className="tcds-input">
                                {employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.employee_number} · {employee.full_name}</option>)}
                            </select>
                        </FormField>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <FormField label="Period start date" htmlFor="perf-start" required>
                                <DateInput id="perf-start" value={performance.data.period_start} onChange={(next) => performance.setData('period_start', next)} required />
                            </FormField>
                            <FormField label="Period end date" htmlFor="perf-end" required>
                                <DateInput id="perf-end" value={performance.data.period_end} onChange={(next) => performance.setData('period_end', next)} min={performance.data.period_start || undefined} required />
                            </FormField>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <FormField label="Numeric rating" htmlFor="perf-rating" optional>
                                <input id="perf-rating" type="number" step="0.001" placeholder="e.g., 4.75" value={performance.data.rating} onChange={(e) => performance.setData('rating', e.target.value)} className="tcds-input" />
                            </FormField>
                            <FormField label="Rating scale" htmlFor="perf-scale" optional>
                                <input id="perf-scale" value={performance.data.rating_scale} onChange={(e) => performance.setData('rating_scale', e.target.value)} className="tcds-input" />
                            </FormField>
                        </div>
                        <FormField label="Performance summary" htmlFor="perf-summary" optional>
                            <textarea id="perf-summary" rows={3} value={performance.data.summary} onChange={(e) => performance.setData('summary', e.target.value)} className="tcds-input min-h-20" />
                        </FormField>
                        <button type="submit" disabled={performance.processing} className="municipal-primary-button">
                            Save performance record
                        </button>
                    </form>

                    <form onSubmit={submitDevelopment} className="tcds-card space-y-4 p-5 sm:p-6">
                        <h2 className="text-base font-bold text-[var(--ink-primary)]">Record training or eligibility</h2>
                        <FormField label="Employee" htmlFor="dev-emp" required>
                            <select id="dev-emp" value={development.data.employee_id} onChange={(e) => development.setData('employee_id', Number(e.target.value))} className="tcds-input">
                                {employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.employee_number} · {employee.full_name}</option>)}
                            </select>
                        </FormField>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <FormField label="Record type" htmlFor="dev-type" required>
                                <select id="dev-type" value={development.data.record_type} onChange={(e) => development.setData('record_type', e.target.value)} className="tcds-input">
                                    <option value="training">Training</option>
                                    <option value="certification">Certification</option>
                                    <option value="competency">Competency</option>
                                    <option value="eligibility">Eligibility</option>
                                </select>
                            </FormField>
                            <FormField label="Credential / training title" htmlFor="dev-title" required>
                                <input id="dev-title" value={development.data.title} onChange={(e) => development.setData('title', e.target.value)} className="tcds-input" required />
                            </FormField>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <FormField label="Provider or issuer" htmlFor="dev-provider" optional>
                                <input id="dev-provider" value={development.data.provider} onChange={(e) => development.setData('provider', e.target.value)} className="tcds-input" />
                            </FormField>
                            <FormField label="Reference number" htmlFor="dev-ref" optional>
                                <input id="dev-ref" value={development.data.reference_no} onChange={(e) => development.setData('reference_no', e.target.value)} className="tcds-input" />
                            </FormField>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <FormField label="Date attained" htmlFor="dev-attained" optional>
                                <DateInput id="dev-attained" value={development.data.attained_at} onChange={(next) => development.setData('attained_at', next)} />
                            </FormField>
                            <FormField label="Expiry date" htmlFor="dev-expires" optional>
                                <DateInput id="dev-expires" value={development.data.expires_at} onChange={(next) => development.setData('expires_at', next)} />
                            </FormField>
                        </div>
                        <button type="submit" disabled={development.processing} className="municipal-primary-button">
                            Save development record
                        </button>
                    </form>
                </section>

                <section className="grid gap-5 xl:grid-cols-2">
                    <div className="tcds-card overflow-hidden">
                        <div className="border-b border-[var(--border-default)] px-5 py-3.5 font-bold text-[var(--ink-primary)]">
                            Recent performance records
                        </div>
                        <div className="divide-y divide-[var(--border-default)]">
                            {performanceRecords.length === 0 ? (
                                <p className="px-5 py-6 text-sm text-[var(--ink-secondary)]">No performance records recorded yet.</p>
                            ) : (
                                performanceRecords.map((record) => (
                                    <div key={record.id} className="px-5 py-4">
                                        <div className="font-semibold text-[var(--ink-primary)]">{record.employee.full_name}</div>
                                        <div className="mt-1 text-xs text-[var(--ink-secondary)]">
                                            {formatDatePH(record.period_start)} – {formatDatePH(record.period_end)} · {record.rating || 'No numeric rating'} {record.rating_scale || ''}
                                        </div>
                                        <div className="mt-1.5"><StatusBadge tone="info">{humanizeSlug(record.status)}</StatusBadge></div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="tcds-card overflow-hidden">
                        <div className="border-b border-[var(--border-default)] px-5 py-3.5 font-bold text-[var(--ink-primary)]">
                            Development &amp; eligibility records
                        </div>
                        <div className="divide-y divide-[var(--border-default)]">
                            {developmentRecords.length === 0 ? (
                                <p className="px-5 py-6 text-sm text-[var(--ink-secondary)]">No development records recorded yet.</p>
                            ) : (
                                developmentRecords.map((record) => (
                                    <div key={record.id} className="px-5 py-4">
                                        <StatusBadge tone="neutral">{humanizeSlug(record.record_type)}</StatusBadge>
                                        <div className="mt-1.5 font-semibold text-[var(--ink-primary)]">{record.title}</div>
                                        <div className="mt-1 text-xs text-[var(--ink-secondary)]">
                                            {record.employee.full_name}
                                            {record.provider ? ` · ${record.provider}` : ''}
                                            {record.expires_at ? ` · expires ${formatDatePH(record.expires_at)}` : ''}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}
