import { router, useForm } from '@inertiajs/react';
import { type FormEvent, useState } from 'react';
import { DateInput, FormField, KpiCard, PageHeader, StatusBadge, toneForWorkState } from '../../components/ui';
import AppLayout from '../../layouts/AppLayout';
import { humanizeSlug } from '../../lib/format';

type Department = { id: number; code: string; name: string; short_name?: string | null };
type Employee = { id: number; employee_number: string; full_name: string; position_title: string; employment_status: string; department: Department };
type Asset = {
    id: number;
    property_number: string;
    qr_value: string;
    category: string;
    description: string;
    serial_number?: string | null;
    acquisition_cost?: string | null;
    physical_location?: string | null;
    par_reference?: string | null;
    ics_reference?: string | null;
    condition: string;
    status: string;
    reconciliation_status: string;
    current_department?: Department | null;
    accountable_employee?: Employee | null;
};
type Props = {
    assets: Asset[];
    employees: Employee[];
    departments: Department[];
    canManage: boolean;
    summary: { total: number; assigned: number; available: number; needsAttention: number };
};

export default function PropertyIndex({ assets, employees, departments, canManage, summary }: Props) {
    const register = useForm({
        property_number: '',
        category: '',
        description: '',
        serial_number: '',
        acquisition_date: '',
        acquisition_cost: '',
        funding_source: '',
        supplier: '',
        warranty_until: '',
        current_department_id: '',
        physical_location: '',
        condition: 'good',
    });
    const [assignee, setAssignee] = useState<Record<number, string>>({});
    const [parRef, setParRef] = useState<Record<number, string>>({});
    const [icsRef, setIcsRef] = useState<Record<number, string>>({});

    const submitRegister = (event: FormEvent) => {
        event.preventDefault();
        register.post('/property', { preserveScroll: true, onSuccess: () => register.reset() });
    };
    const assign = (asset: Asset) => {
        const employeeId = assignee[asset.id];
        if (!employeeId) return;
        router.post(
            `/property/${asset.id}/assign`,
            { employee_id: employeeId, par_reference: parRef[asset.id] || null, ics_reference: icsRef[asset.id] || null },
            { preserveScroll: true },
        );
    };
    const returnAsset = (asset: Asset) =>
        router.post(`/property/${asset.id}/return`, { condition_at_return: asset.condition }, { preserveScroll: true });

    return (
        <AppLayout title="Property Accountability">
            <div className="mx-auto max-w-[1440px] space-y-5 px-4 py-5 sm:px-6">
                <PageHeader
                    eyebrow="General Services Office · Property Ledger"
                    title="LGU Property & Asset Accountability"
                    subtitle="Track municipal property numbers, office custody, PAR/ICS references, asset condition, and assignment history."
                    actions={!canManage ? <StatusBadge tone="neutral">Read-only view</StatusBadge> : undefined}
                />

                <section aria-label="Property summary" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    <KpiCard label="Total Assets" value={summary.total} accent="brand" />
                    <KpiCard label="Assigned" value={summary.assigned} accent="neutral" />
                    <KpiCard label="Available" value={summary.available} accent="brand" />
                    <KpiCard label="Needs Attention" value={summary.needsAttention} accent="warn" />
                </section>

                {canManage && (
                    <form onSubmit={submitRegister} className="tcds-card space-y-4 p-5 sm:p-6">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-[var(--brand-ink)]">Property Master</p>
                            <h2 className="mt-0.5 text-lg font-bold text-[var(--ink-primary)]">Register Municipal Asset</h2>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <FormField label="Property number" htmlFor="prop-num" required>
                                <input id="prop-num" value={register.data.property_number} onChange={(e) => register.setData('property_number', e.target.value)} className="tcds-input" required />
                            </FormField>
                            <FormField label="Category" htmlFor="prop-cat" required>
                                <input id="prop-cat" value={register.data.category} onChange={(e) => register.setData('category', e.target.value)} className="tcds-input" required />
                            </FormField>
                            <FormField label="Description" htmlFor="prop-desc" required className="lg:col-span-2">
                                <input id="prop-desc" value={register.data.description} onChange={(e) => register.setData('description', e.target.value)} className="tcds-input" required />
                            </FormField>
                            <FormField label="Serial number" htmlFor="prop-sn" optional>
                                <input id="prop-sn" value={register.data.serial_number} onChange={(e) => register.setData('serial_number', e.target.value)} className="tcds-input" />
                            </FormField>
                            <FormField label="Acquisition date" htmlFor="prop-date" optional>
                                <DateInput id="prop-date" value={register.data.acquisition_date} onChange={(next) => register.setData('acquisition_date', next)} />
                            </FormField>
                            <FormField label="Acquisition cost (PHP)" htmlFor="prop-cost" optional>
                                <input id="prop-cost" type="number" min="0" step="0.01" value={register.data.acquisition_cost} onChange={(e) => register.setData('acquisition_cost', e.target.value)} className="tcds-input" />
                            </FormField>
                            <FormField label="Custodian office" htmlFor="prop-dept" optional>
                                <select id="prop-dept" value={register.data.current_department_id} onChange={(e) => register.setData('current_department_id', e.target.value)} className="tcds-input">
                                    <option value="">GSO custody</option>
                                    {departments.map((d) => <option key={d.id} value={d.id}>{d.short_name || d.name}</option>)}
                                </select>
                            </FormField>
                            <FormField label="Funding source" htmlFor="prop-fund" optional>
                                <input id="prop-fund" value={register.data.funding_source} onChange={(e) => register.setData('funding_source', e.target.value)} className="tcds-input" />
                            </FormField>
                            <FormField label="Supplier" htmlFor="prop-sup" optional>
                                <input id="prop-sup" value={register.data.supplier} onChange={(e) => register.setData('supplier', e.target.value)} className="tcds-input" />
                            </FormField>
                            <FormField label="Physical location" htmlFor="prop-loc" optional>
                                <input id="prop-loc" value={register.data.physical_location} onChange={(e) => register.setData('physical_location', e.target.value)} className="tcds-input" />
                            </FormField>
                            <FormField label="Condition" htmlFor="prop-cond">
                                <select id="prop-cond" value={register.data.condition} onChange={(e) => register.setData('condition', e.target.value)} className="tcds-input">
                                    <option value="good">Good</option>
                                    <option value="fair">Fair</option>
                                    <option value="needs_repair">Needs repair</option>
                                    <option value="unserviceable">Unserviceable</option>
                                </select>
                            </FormField>
                        </div>
                        {Object.keys(register.errors).length > 0 && (
                            <p role="alert" className="rounded-lg border border-[var(--status-danger-border)] bg-[var(--status-danger-bg)] p-3 text-sm font-medium text-[var(--status-danger-fg)]">
                                {Object.values(register.errors)[0]}
                            </p>
                        )}
                        <button type="submit" disabled={register.processing} className="municipal-primary-button">
                            Register property
                        </button>
                    </form>
                )}

                <section aria-labelledby="property-register-heading" className="space-y-3">
                    <h2 id="property-register-heading" className="text-base font-bold text-[var(--ink-primary)]">
                        Registered Property ({assets.length})
                    </h2>
                    {assets.map((asset) => (
                        <article key={asset.id} className="tcds-card p-4 sm:p-5">
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="font-mono text-sm font-bold text-[var(--brand-ink)]">
                                            {asset.property_number}
                                        </span>
                                        <StatusBadge tone="neutral">{humanizeSlug(asset.status)}</StatusBadge>
                                        <StatusBadge tone={toneForWorkState(asset.condition)}>{humanizeSlug(asset.condition)}</StatusBadge>
                                    </div>
                                    <h3 className="mt-1.5 text-base font-bold text-[var(--ink-primary)]">{asset.description}</h3>
                                    <p className="mt-1 text-sm text-[var(--ink-secondary)]">
                                        {[asset.category, asset.serial_number ? `SN ${asset.serial_number}` : null, asset.current_department?.short_name || asset.current_department?.name || 'Unassigned office'].filter(Boolean).join(' · ')}
                                    </p>
                                    {asset.accountable_employee && (
                                        <div className="mt-3 rounded-lg border border-[var(--brand-soft-border)] bg-[var(--brand-soft)] px-3 py-2 text-xs text-[var(--ink-primary)]">
                                            <strong>Accountable:</strong> {asset.accountable_employee.full_name} · {asset.accountable_employee.employee_number}
                                            {asset.par_reference ? ` · PAR ${asset.par_reference}` : ''}
                                            {asset.ics_reference ? ` · ICS ${asset.ics_reference}` : ''}
                                        </div>
                                    )}
                                </div>

                                {canManage && (
                                    <div className="w-full max-w-xl shrink-0">
                                        {asset.accountable_employee ? (
                                            <button type="button" onClick={() => returnAsset(asset)} className="municipal-secondary-button w-full">
                                                Record return
                                            </button>
                                        ) : (
                                            <div className="grid gap-2 sm:grid-cols-[1fr_120px_120px_auto]">
                                                <select aria-label={`Assign employee for ${asset.property_number}`} value={assignee[asset.id] || ''} onChange={(e) => setAssignee((v) => ({ ...v, [asset.id]: e.target.value }))} className="tcds-input">
                                                    <option value="">Assign employee</option>
                                                    {employees.map((e) => <option key={e.id} value={e.id}>{e.full_name} · {e.department.short_name || e.department.name}</option>)}
                                                </select>
                                                <input aria-label={`PAR reference for ${asset.property_number}`} placeholder="PAR ref" value={parRef[asset.id] || ''} onChange={(e) => setParRef((v) => ({ ...v, [asset.id]: e.target.value }))} className="tcds-input" />
                                                <input aria-label={`ICS reference for ${asset.property_number}`} placeholder="ICS ref" value={icsRef[asset.id] || ''} onChange={(e) => setIcsRef((v) => ({ ...v, [asset.id]: e.target.value }))} className="tcds-input" />
                                                <button type="button" onClick={() => assign(asset)} disabled={!assignee[asset.id]} className="municipal-primary-button">Assign</button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </article>
                    ))}
                    {assets.length === 0 && (
                        <div className="tcds-card p-10 text-center text-sm text-[var(--ink-secondary)]">
                            No property records registered yet.
                        </div>
                    )}
                </section>
            </div>
        </AppLayout>
    );
}
