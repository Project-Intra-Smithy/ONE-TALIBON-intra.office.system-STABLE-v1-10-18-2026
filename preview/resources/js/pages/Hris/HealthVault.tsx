import { Link, useForm } from '@inertiajs/react';
import { ArrowLeft, FileHeart, LockKeyhole, ShieldCheck } from 'lucide-react';
import type { FormEvent } from 'react';
import { DateInput, StatusBadge } from '../../components/ui';
import AppLayout from '../../layouts/AppLayout';
import { formatDatePH, humanizeSlug } from '../../lib/format';

type Employee = { id: number; employee_number: string; full_name?: string | null; position_title: string; department: { name: string; short_name?: string | null } };
type RecordItem = {
    id: number;
    record_type: string;
    title: string;
    issued_at?: string | null;
    valid_until?: string | null;
    status: string;
    summary?: string | null;
    restriction_notes?: string | null;
    creator?: string | null;
    created_at?: string | null;
};

export default function HealthVault({ employee, records, canManage }: { employee: Employee; records: RecordItem[]; canManage: boolean }) {
    const form = useForm({
        record_type: 'fit_to_work',
        title: '',
        issued_at: '',
        valid_until: '',
        status: 'active',
        summary: '',
        restriction_notes: '',
    });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.post(`/hris/health/${employee.id}`, {
            preserveScroll: true,
            onSuccess: () => form.reset('title', 'issued_at', 'valid_until', 'summary', 'restriction_notes'),
        });
    };

    return (
        <AppLayout title="Restricted Health Vault">
            <div className="mx-auto max-w-5xl space-y-4 px-4 py-5 sm:px-6">
                <Link
                    href={`/employees/${employee.id}`}
                    className="inline-flex min-h-9 items-center gap-1.5 text-sm font-semibold text-[var(--brand-ink)] hover:underline"
                >
                    <ArrowLeft size={15} aria-hidden="true" />
                    <span>Return to employee profile</span>
                </Link>

                <section className="rounded-xl border border-[var(--status-danger-border)] bg-rose-950 p-5 text-white sm:p-6">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-200">
                        <LockKeyhole size={15} aria-hidden="true" />
                        <span>Restricted employment record</span>
                    </div>
                    <h1 className="mt-1.5 text-2xl font-extrabold text-white">{employee.full_name} · Health Vault</h1>
                    <p className="mt-1 text-sm text-rose-100">
                        {employee.employee_number} · {employee.position_title} · {employee.department.short_name || employee.department.name}
                    </p>
                    <div className="mt-4 rounded-lg border border-white/15 bg-white/10 p-3.5 text-xs leading-5 text-rose-50">
                        This vault is limited to employment and occupational-health evidence such as medical certificates, fit-to-work status, accommodations, and authorized clearances. It is not an RHU patient chart and does not contain municipal health-service consultation history.
                    </div>
                </section>

                {canManage && (
                    <form onSubmit={submit} className="tcds-card space-y-4 p-5">
                        <div className="flex items-center gap-2">
                            <FileHeart size={18} aria-hidden="true" className="text-[var(--status-danger-fg)]" />
                            <h2 className="text-base font-bold text-[var(--ink-primary)]">Add governed health evidence</h2>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <select value={form.data.record_type} onChange={(e) => form.setData('record_type', e.target.value)} className="tcds-input">
                                <option value="medical_certificate">Medical certificate</option>
                                <option value="fit_to_work">Fit to work</option>
                                <option value="occupational_exam">Occupational examination</option>
                                <option value="accommodation">Authorized accommodation</option>
                                <option value="vaccination">Vaccination record</option>
                                <option value="health_clearance">Health clearance</option>
                                <option value="other">Other employment-health evidence</option>
                            </select>
                            <input required placeholder="Record title" value={form.data.title} onChange={(e) => form.setData('title', e.target.value)} className="tcds-input" />
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div>
                                <label htmlFor="hv-issued" className="mb-1 block text-xs font-bold uppercase tracking-wide text-[var(--ink-secondary)]">Issued</label>
                                <DateInput id="hv-issued" value={form.data.issued_at} onChange={(next) => form.setData('issued_at', next)} />
                            </div>
                            <div>
                                <label htmlFor="hv-valid" className="mb-1 block text-xs font-bold uppercase tracking-wide text-[var(--ink-secondary)]">Valid until</label>
                                <DateInput id="hv-valid" value={form.data.valid_until} onChange={(next) => form.setData('valid_until', next)} min={form.data.issued_at || undefined} />
                            </div>
                        </div>
                        <textarea rows={3} placeholder="Employment-relevant summary" value={form.data.summary} onChange={(e) => form.setData('summary', e.target.value)} className="tcds-input min-h-20 resize-y" />
                        <textarea rows={3} placeholder="Authorized restriction / accommodation notes" value={form.data.restriction_notes} onChange={(e) => form.setData('restriction_notes', e.target.value)} className="tcds-input min-h-20 resize-y" />
                        <button type="submit" disabled={form.processing} className="inline-flex min-h-11 items-center rounded-lg bg-[var(--status-danger-bar)] px-4 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50">
                            Save restricted record
                        </button>
                    </form>
                )}

                <section className="tcds-card p-5">
                    <div className="flex items-center gap-2">
                        <ShieldCheck size={18} aria-hidden="true" className="text-[var(--status-danger-fg)]" />
                        <h2 className="text-base font-bold text-[var(--ink-primary)]">Authorized record view</h2>
                    </div>
                    <div className="mt-4 space-y-3">
                        {records.map((record) => (
                            <article key={record.id} className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-recessed)] p-4">
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                    <div>
                                        <div className="text-xs font-bold uppercase tracking-wide text-[var(--status-danger-fg)]">
                                            {humanizeSlug(record.record_type)}
                                        </div>
                                        <div className="mt-0.5 text-sm font-semibold text-[var(--ink-primary)]">{record.title}</div>
                                    </div>
                                    <StatusBadge tone={record.status === 'active' ? 'ok' : 'neutral'}>{humanizeSlug(record.status)}</StatusBadge>
                                </div>
                                <dl className="mt-3 grid gap-3 text-xs sm:grid-cols-2">
                                    <div>
                                        <dt className="font-bold uppercase tracking-wide text-[var(--ink-secondary)]">Issued / valid until</dt>
                                        <dd className="mt-0.5 font-semibold text-[var(--ink-primary)]">
                                            {record.issued_at ? formatDatePH(record.issued_at) : 'Not recorded'} · {record.valid_until ? formatDatePH(record.valid_until) : 'No expiry recorded'}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="font-bold uppercase tracking-wide text-[var(--ink-secondary)]">Recorded by</dt>
                                        <dd className="mt-0.5 font-semibold text-[var(--ink-primary)]">{record.creator || 'Authorized personnel'}</dd>
                                    </div>
                                </dl>
                                {record.summary && (
                                    <div className="mt-3 rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] p-3 text-xs leading-5 text-[var(--ink-primary)]">
                                        <div className="font-bold uppercase tracking-wide text-[var(--ink-secondary)]">Employment-relevant summary</div>
                                        <div className="mt-1">{record.summary}</div>
                                    </div>
                                )}
                                {record.restriction_notes && (
                                    <div className="mt-3 rounded-lg border border-[var(--status-warn-border)] bg-[var(--status-warn-bg)] p-3 text-xs leading-5 text-[var(--status-warn-fg)]">
                                        <div className="font-bold uppercase tracking-wide">Authorized restriction / accommodation</div>
                                        <div className="mt-1">{record.restriction_notes}</div>
                                    </div>
                                )}
                            </article>
                        ))}
                        {records.length === 0 && (
                            <div className="rounded-lg bg-[var(--surface-recessed)] p-5 text-sm text-[var(--ink-secondary)]">
                                No employment or occupational-health records are present in this restricted vault.
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}
