import { Link, useForm } from '@inertiajs/react';
import { ArrowLeft, FileCheck2 } from 'lucide-react';
import type { FormEvent } from 'react';
import EvidenceFields from '../../components/documents/EvidenceFields';
import { DateInput, PageHeader } from '../../components/ui';
import AppLayout from '../../layouts/AppLayout';

type Department = { id: number; code: string; name: string; shortName?: string | null };
type Props = { departments: Department[] };

export default function Create({ departments }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        reference_number: '',
        issuance_date: '',
        purpose: '',
        destination: '',
        department_id: '',
        travel_start_date: '',
        travel_end_date: '',
        employee_numbers: '',
        evidence: [] as File[],
    });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        post('/travel-orders', { forceFormData: true });
    };

    const errorFor = (key: string) => (errors as Record<string, string | undefined>)[key];

    return (
        <AppLayout title="Record Approved Travel Order">
            <div className="civic-page mx-auto max-w-3xl space-y-4">
                <PageHeader
                    eyebrow="Post-approval registry · Mayor approver"
                    title="Record Approved Travel Order"
                    subtitle="Enter an order that has already been officially approved. This does not submit or route a travel request."
                    actions={
                        <Link href="/travel-orders" className="municipal-secondary-button">
                            <ArrowLeft size={15} aria-hidden="true" />
                            <span>Travel Orders</span>
                        </Link>
                    }
                />

                <form onSubmit={submit} className="space-y-4">
                    <section className="tcds-card grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
                        <label className="block">
                            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[var(--ink-secondary)]">Official reference number</span>
                            <input
                                value={data.reference_number}
                                onChange={(e) => setData('reference_number', e.target.value)}
                                placeholder="e.g., TO-2026-042"
                                className="tcds-input font-mono"
                            />
                            {errorFor('reference_number') && <div className="mt-1 text-xs font-semibold text-[var(--status-danger-fg)]">{errorFor('reference_number')}</div>}
                        </label>

                        <div>
                            <label htmlFor="to-issuance" className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[var(--ink-secondary)]">
                                Issuance date
                            </label>
                            <DateInput id="to-issuance" value={data.issuance_date} onChange={(next) => setData('issuance_date', next)} />
                            {errorFor('issuance_date') && <div className="mt-1 text-xs font-semibold text-[var(--status-danger-fg)]">{errorFor('issuance_date')}</div>}
                        </div>

                        <label className="block sm:col-span-2">
                            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[var(--ink-secondary)]">Purpose / subject</span>
                            <textarea rows={3} value={data.purpose} onChange={(e) => setData('purpose', e.target.value)} className="tcds-input min-h-24 resize-y" />
                            {errorFor('purpose') && <div className="mt-1 text-xs font-semibold text-[var(--status-danger-fg)]">{errorFor('purpose')}</div>}
                        </label>

                        <label className="block">
                            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[var(--ink-secondary)]">Destination / location</span>
                            <input value={data.destination} onChange={(e) => setData('destination', e.target.value)} placeholder="e.g., Tagbilaran City, Bohol" className="tcds-input" />
                            {errorFor('destination') && <div className="mt-1 text-xs font-semibold text-[var(--status-danger-fg)]">{errorFor('destination')}</div>}
                        </label>

                        <label className="block">
                            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[var(--ink-secondary)]">Responsible office</span>
                            <select value={data.department_id} onChange={(e) => setData('department_id', e.target.value)} className="tcds-input">
                                <option value="">Select office</option>
                                {departments.map((department) => (
                                    <option key={department.id} value={department.id}>{department.shortName || department.name}</option>
                                ))}
                            </select>
                            {errorFor('department_id') && <div className="mt-1 text-xs font-semibold text-[var(--status-danger-fg)]">{errorFor('department_id')}</div>}
                        </label>

                        <div>
                            <label htmlFor="to-start" className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[var(--ink-secondary)]">
                                Inclusive travel start
                            </label>
                            <DateInput id="to-start" value={data.travel_start_date} onChange={(next) => setData('travel_start_date', next)} presets="deadline" />
                            {errorFor('travel_start_date') && <div className="mt-1 text-xs font-semibold text-[var(--status-danger-fg)]">{errorFor('travel_start_date')}</div>}
                        </div>

                        <div>
                            <label htmlFor="to-end" className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[var(--ink-secondary)]">
                                Inclusive travel end
                            </label>
                            <DateInput id="to-end" value={data.travel_end_date} onChange={(next) => setData('travel_end_date', next)} min={data.travel_start_date || undefined} />
                            {errorFor('travel_end_date') && <div className="mt-1 text-xs font-semibold text-[var(--status-danger-fg)]">{errorFor('travel_end_date')}</div>}
                        </div>

                        <label className="block sm:col-span-2">
                            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[var(--ink-secondary)]">Issued-to employee numbers</span>
                            <textarea
                                rows={3}
                                value={data.employee_numbers}
                                onChange={(e) => setData('employee_numbers', e.target.value)}
                                placeholder={'One official employee number per line\nExample: SYN-101'}
                                className="tcds-input min-h-24 resize-y font-mono text-sm"
                            />
                            <div className="mt-1 text-xs text-[var(--ink-secondary)]">
                                Up to 20. Official employee numbers are resolved server-side; the employee directory is not serialized into this form.
                            </div>
                            {(errorFor('employee_numbers') || errorFor('employee_numbers.0')) && (
                                <div className="mt-1 text-xs font-semibold text-[var(--status-danger-fg)]">
                                    {errorFor('employee_numbers') || errorFor('employee_numbers.0')}
                                </div>
                            )}
                        </label>
                    </section>

                    <div className="tcds-card p-5">
                        <EvidenceFields
                            files={data.evidence}
                            onChange={(files) => setData('evidence', files)}
                            errors={errors as Record<string, string | undefined>}
                            disabled={processing}
                            label="Approved order evidence"
                        />
                    </div>

                    <div className="flex flex-wrap justify-end gap-2.5">
                        <Link href="/travel-orders" className="municipal-secondary-button">Cancel</Link>
                        <button type="submit" disabled={processing} className="municipal-primary-button disabled:opacity-50">
                            <FileCheck2 size={15} aria-hidden="true" />
                            <span>{processing ? 'Recording…' : 'Record approved order'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
