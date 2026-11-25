import { router, useForm } from '@inertiajs/react';
import { type FormEvent, useMemo, useState } from 'react';
import { Button, DateInput, KpiCard, StatusBadge } from '../../components/ui';
import AppLayout from '../../layouts/AppLayout';
import { humanizeSlug } from '../../lib/format';

type Department = { id: number; code: string; name: string; short_name?: string | null };
type Employee = { id: number; employee_number: string; full_name: string };
type Asset = {
    id: number;
    property_number: string;
    qr_value: string;
    category: string;
    description: string;
    physical_location?: string | null;
    condition: string;
    status: string;
    reconciliation_status: string;
    current_department?: Department | null;
    accountable_employee?: Employee | null;
};
type InventorySession = {
    id: number;
    session_code: string;
    title: string;
    status: string;
    inventory_date: string;
    scans_count: number;
    department?: Department | null;
};
type Maintenance = {
    id: number;
    maintenance_type: string;
    status: string;
    issue_description: string;
    asset: Pick<Asset, 'id' | 'property_number' | 'description'>;
};
type Disposal = {
    id: number;
    status: string;
    reason: string;
    asset: Pick<Asset, 'id' | 'property_number' | 'description' | 'status'>;
};
type Props = {
    assets: Asset[];
    inventorySessions: InventorySession[];
    openMaintenance: Maintenance[];
    pendingDisposals: Disposal[];
    departments: Department[];
    canManage: boolean;
    canReconcile: boolean;
};

export default function PropertyLifecycle({
    assets,
    inventorySessions,
    openMaintenance,
    pendingDisposals,
    departments,
    canManage,
    canReconcile,
}: Props) {
    const inventory = useForm({ title: '', department_id: '', inventory_date: new Date().toISOString().slice(0, 10), notes: '' });
    const [selectedSession, setSelectedSession] = useState('');
    const [selectedAsset, setSelectedAsset] = useState('');
    const [scanValue, setScanValue] = useState('');
    const [location, setLocation] = useState('');
    const [condition, setCondition] = useState('good');
    const openSessions = useMemo(() => inventorySessions.filter((s) => s.status === 'open'), [inventorySessions]);

    const submitInventory = (e: FormEvent) => {
        e.preventDefault();
        inventory.post('/property/inventory', { preserveScroll: true, onSuccess: () => inventory.reset('title', 'department_id', 'notes') });
    };

    const scan = () => {
        if (!selectedSession || !selectedAsset || !scanValue.trim()) return;
        router.post(
            `/property/inventory/${selectedSession}/assets/${selectedAsset}/scan`,
            { scan_value: scanValue.trim(), observed_location: location || null, observed_condition: condition },
            { preserveScroll: true, onSuccess: () => setScanValue('') },
        );
    };

    return (
        <AppLayout title="Property Lifecycle">
            <div className="mx-auto max-w-[1440px] space-y-5 px-4 py-5 sm:px-6">
                <section className="rounded-2xl bg-[var(--surface-sidebar)] p-6 text-white sm:p-7">
                    <div className="text-xs font-bold uppercase tracking-wider text-[var(--accent-gold)]">
                        General Services Office · Asset Lifecycle
                    </div>
                    <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                        LGU Property Lifecycle
                    </h1>
                    <p className="mt-2 max-w-4xl text-sm leading-6 text-[var(--surface-sidebar-ink)]">
                        Inventory sessions, QR/reference verification, maintenance tracking, accounting reconciliation, discrepancy evidence, and controlled disposal extend the PAR/ICS accountability ledger.
                    </p>
                </section>

                <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <KpiCard label="Assets" value={assets.length} accent="brand" />
                    <KpiCard label="Open inventory" value={openSessions.length} accent="ok" />
                    <KpiCard label="Maintenance" value={openMaintenance.length} accent="warn" />
                    <KpiCard label="Disposal review" value={pendingDisposals.length} accent="danger" />
                </section>

                {canManage && (
                    <section className="grid gap-5 xl:grid-cols-2">
                        <form onSubmit={submitInventory} className="tcds-card space-y-4 p-5">
                            <div>
                                <div className="text-xs font-bold uppercase tracking-wider text-[var(--brand-ink)]">Physical count</div>
                                <h2 className="mt-1 text-lg font-bold text-[var(--ink-primary)]">Start inventory session</h2>
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2">
                                <label className="sm:col-span-2">
                                    <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-[var(--ink-secondary)]">Inventory title</span>
                                    <input required placeholder="e.g., Q4 Municipal Equipment Count" value={inventory.data.title} onChange={(e) => inventory.setData('title', e.target.value)} className="tcds-input" />
                                </label>
                                <label>
                                    <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-[var(--ink-secondary)]">Department scope</span>
                                    <select value={inventory.data.department_id} onChange={(e) => inventory.setData('department_id', e.target.value)} className="tcds-input">
                                        <option value="">Municipality-wide</option>
                                        {departments.map((d) => <option key={d.id} value={d.id}>{d.short_name || d.name}</option>)}
                                    </select>
                                </label>
                                <div>
                                    <label htmlFor="prop-inv-date" className="mb-1 block text-xs font-bold uppercase tracking-wide text-[var(--ink-secondary)]">Inventory date</label>
                                    <DateInput id="prop-inv-date" value={inventory.data.inventory_date} onChange={(next) => inventory.setData('inventory_date', next)} />
                                </div>
                                <label className="sm:col-span-2">
                                    <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-[var(--ink-secondary)]">Notes</span>
                                    <textarea placeholder="Scope or instructions" value={inventory.data.notes} onChange={(e) => inventory.setData('notes', e.target.value)} className="tcds-input min-h-20 resize-y" />
                                </label>
                            </div>
                            <Button type="submit" disabled={inventory.processing}>Start inventory</Button>
                        </form>

                        <div className="tcds-card space-y-4 p-5">
                            <div>
                                <div className="text-xs font-bold uppercase tracking-wider text-[var(--brand-ink)]">QR / reference verification</div>
                                <h2 className="mt-1 text-lg font-bold text-[var(--ink-primary)]">Record inventory observation</h2>
                            </div>
                            <div className="grid gap-3">
                                <select aria-label="Select open session" value={selectedSession} onChange={(e) => setSelectedSession(e.target.value)} className="tcds-input">
                                    <option value="">Select open session</option>
                                    {openSessions.map((s) => <option key={s.id} value={s.id}>{s.session_code} · {s.title}</option>)}
                                </select>
                                <select
                                    aria-label="Select asset record"
                                    value={selectedAsset}
                                    onChange={(e) => {
                                        setSelectedAsset(e.target.value);
                                        setScanValue('');
                                        const a = assets.find((x) => String(x.id) === e.target.value);
                                        setLocation(a?.physical_location || '');
                                        setCondition(a?.condition || 'good');
                                    }}
                                    className="tcds-input"
                                >
                                    <option value="">Select asset record</option>
                                    {assets.filter((a) => a.status !== 'disposed').map((a) => (
                                        <option key={a.id} value={a.id}>{a.property_number} · {a.description}</option>
                                    ))}
                                </select>
                                <input aria-label="Property reference or QR" placeholder="Scan QR / enter exact property reference" value={scanValue} onChange={(e) => setScanValue(e.target.value)} className="tcds-input" />
                                <input aria-label="Observed location" placeholder="Observed location" value={location} onChange={(e) => setLocation(e.target.value)} className="tcds-input" />
                                <select aria-label="Observed condition" value={condition} onChange={(e) => setCondition(e.target.value)} className="tcds-input">
                                    <option value="good">Good</option>
                                    <option value="fair">Fair</option>
                                    <option value="needs_repair">Needs repair</option>
                                    <option value="unserviceable">Unserviceable</option>
                                </select>
                                <Button onClick={scan} disabled={!selectedSession || !selectedAsset || !scanValue.trim()}>
                                    Verify and record
                                </Button>
                            </div>
                        </div>
                    </section>
                )}

                <section className="grid gap-5 xl:grid-cols-3">
                    <div className="tcds-card p-5">
                        <h2 className="text-base font-bold text-[var(--ink-primary)]">Inventory sessions</h2>
                        <div className="mt-3 space-y-2.5">
                            {inventorySessions.length === 0 ? (
                                <p className="text-sm text-[var(--ink-secondary)]">No inventory sessions recorded yet.</p>
                            ) : (
                                inventorySessions.map((s) => (
                                    <div key={s.id} className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-recessed)] p-3.5 text-xs">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="font-mono font-bold text-[var(--brand-ink)]">{s.session_code}</span>
                                            <StatusBadge tone={s.status === 'open' ? 'ok' : 'neutral'}>{humanizeSlug(s.status)}</StatusBadge>
                                        </div>
                                        <div className="mt-1 font-medium text-[var(--ink-primary)]">{s.title}</div>
                                        <div className="mt-0.5 text-[var(--ink-secondary)]">
                                            {s.scans_count} {s.scans_count === 1 ? 'scan' : 'scans'}
                                        </div>
                                        {canManage && s.status === 'open' && (
                                            <button
                                                type="button"
                                                onClick={() => router.post(`/property/inventory/${s.id}/close`, {}, { preserveScroll: true })}
                                                className="mt-2 font-semibold text-[var(--brand-ink)] hover:underline"
                                            >
                                                Close session
                                            </button>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="tcds-card p-5">
                        <h2 className="text-base font-bold text-[var(--ink-primary)]">Open maintenance</h2>
                        <div className="mt-3 space-y-2.5">
                            {openMaintenance.length === 0 ? (
                                <p className="rounded-xl border border-dashed border-[var(--border-default)] bg-[var(--surface-recessed)] p-4 text-sm text-[var(--ink-secondary)]">
                                    No open property maintenance requests.
                                </p>
                            ) : (
                                openMaintenance.map((m) => (
                                    <div key={m.id} className="rounded-xl border border-[var(--status-warn-border)] bg-[var(--status-warn-bg)] p-3.5 text-xs text-[var(--status-warn-fg)]">
                                        <div className="font-semibold">{m.asset.property_number} · {m.asset.description}</div>
                                        <div className="mt-1">{humanizeSlug(m.maintenance_type)} · {m.issue_description}</div>
                                        {canManage && (
                                            <button
                                                type="button"
                                                onClick={() => router.post(`/property/maintenance/${m.id}/complete`, { condition_after: 'good' }, { preserveScroll: true })}
                                                className="mt-2 font-bold underline"
                                            >
                                                Mark completed / good
                                            </button>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="tcds-card p-5">
                        <h2 className="text-base font-bold text-[var(--ink-primary)]">Pending disposal</h2>
                        <div className="mt-3 space-y-2.5">
                            {pendingDisposals.length === 0 ? (
                                <p className="rounded-xl border border-dashed border-[var(--border-default)] bg-[var(--surface-recessed)] p-4 text-sm text-[var(--ink-secondary)]">
                                    No assets pending disposal review.
                                </p>
                            ) : (
                                pendingDisposals.map((d) => (
                                    <div key={d.id} className="rounded-xl border border-[var(--status-danger-border)] bg-[var(--status-danger-bg)] p-3.5 text-xs text-[var(--status-danger-fg)]">
                                        <div className="font-semibold">{d.asset.property_number} · {d.asset.description}</div>
                                        <div className="mt-1">Awaiting documented authority / decision</div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </section>

                <section className="tcds-card overflow-hidden">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-default)] px-5 py-4">
                        <div>
                            <div className="text-xs font-bold uppercase tracking-wider text-[var(--brand-ink)]">Asset state</div>
                            <h2 className="mt-0.5 text-lg font-bold text-[var(--ink-primary)]">Lifecycle register</h2>
                        </div>
                        {!canReconcile && <StatusBadge tone="neutral">Accounting reconciliation read-only</StatusBadge>}
                    </div>
                    <div tabIndex={0} role="region" aria-label="Property lifecycle register" className="tcds-table-region rounded-none border-0">
                        <table className="tcds-table" data-stack-mobile="true">
                            <thead>
                                <tr>
                                    <th scope="col">Property</th>
                                    <th scope="col">Office</th>
                                    <th scope="col">Location</th>
                                    <th scope="col">Condition</th>
                                    <th scope="col">Status</th>
                                    <th scope="col">Reconciliation</th>
                                </tr>
                            </thead>
                            <tbody>
                                {assets.map((a) => (
                                    <tr key={a.id}>
                                        <th scope="row" className="font-normal">
                                            <div className="font-mono text-xs font-bold text-[var(--brand-ink)]">{a.property_number}</div>
                                            <div className="text-sm font-semibold text-[var(--ink-primary)]">{a.description}</div>
                                        </th>
                                        <td data-label="Office" className="text-sm">{a.current_department?.short_name || a.current_department?.name || '—'}</td>
                                        <td data-label="Location" className="text-sm">{a.physical_location || '—'}</td>
                                        <td data-label="Condition"><StatusBadge tone="ok">{humanizeSlug(a.condition)}</StatusBadge></td>
                                        <td data-label="Status"><StatusBadge tone="neutral">{humanizeSlug(a.status)}</StatusBadge></td>
                                        <td data-label="Reconciliation" className="text-sm">{humanizeSlug(a.reconciliation_status)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}
