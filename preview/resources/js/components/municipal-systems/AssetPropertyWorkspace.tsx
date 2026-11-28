import { useEffect, useMemo, useState } from 'react';
import {
    ArrowLeft,
    Building2,
    ChevronLeft,
    ChevronRight,
    History,
    ShieldCheck,
    Wrench,
} from 'lucide-react';
import {
    assetCategoryCounts,
    assetConditionCounts,
    assetPropertyRecords,
    assetPropertySummary,
    type AssetAccountability,
    type AssetCondition,
    type AssetPropertyRecord,
    type AssetReferenceState,
} from '../../data/municipal/assetPropertyData';
import DetailDrawer from './DetailDrawer';

type Props = {
    onBack: () => void;
};

type WorkspaceTab = 'Overview' | 'Asset Register' | 'Custody & Accountability' | 'Condition & Lifecycle';
type DetailStep = 'asset' | 'custody' | 'history';

const tabs: WorkspaceTab[] = ['Overview', 'Asset Register', 'Custody & Accountability', 'Condition & Lifecycle'];
const detailSteps: Array<{ id: DetailStep; label: string }> = [
    { id: 'asset', label: 'Asset' },
    { id: 'custody', label: 'Custody' },
    { id: 'history', label: 'History' },
];

function conditionTone(condition: AssetCondition): string {
    if (condition === 'Serviceable') {
        return 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/45 dark:bg-emerald-950/25 dark:text-emerald-200';
    }

    if (condition === 'For inspection') {
        return 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/45 dark:bg-amber-950/25 dark:text-amber-200';
    }

    if (condition === 'For maintenance reference') {
        return 'border-blue-200 bg-blue-50 text-[var(--brand-ink)] dark:border-[var(--status-info-border)] dark:bg-[var(--status-info-bg)] dark:text-[var(--status-info-fg)]';
    }

    return 'border-slate-200 bg-slate-100 text-slate-700 dark:border-[var(--border-control)] dark:bg-[var(--surface-recessed)] dark:text-[var(--ink-primary)]';
}

function accountabilityTone(accountability: AssetAccountability): string {
    if (accountability === 'Unassigned reference') {
        return 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/45 dark:bg-amber-950/25 dark:text-amber-200';
    }

    if (accountability === 'Assigned reference') {
        return 'border-blue-200 bg-blue-50 text-[var(--brand-ink)] dark:border-[var(--status-info-border)] dark:bg-[var(--status-info-bg)] dark:text-[var(--status-info-fg)]';
    }

    return 'border-slate-200 bg-slate-50 text-slate-700 dark:border-[var(--border-control)] dark:bg-[var(--surface-card)] dark:text-[var(--ink-primary)]';
}

function referenceTone(referenceState: AssetReferenceState): string {
    if (referenceState === 'Reference gap' || referenceState === 'Inspection reference pending') {
        return 'text-amber-700 dark:text-amber-300';
    }

    if (referenceState === 'Maintenance reference current') {
        return 'text-[var(--brand-ink)]';
    }

    return 'text-[var(--ink-secondary)]';
}

function HeaderCounter({
    label,
    value,
    tone,
}: {
    label: string;
    value: number;
    tone: string;
}) {
    return (
        <div className="min-w-0 rounded-lg border border-slate-200 bg-slate-50/80 px-2.5 py-2 dark:border-[var(--border-control)] dark:bg-[var(--surface-card)]">
            <div className={`text-[17px] font-extrabold leading-none tabular-nums ${tone}`}>{value}</div>
            <div className="mt-1 truncate text-xs font-extrabold uppercase tracking-[0.07em] text-slate-400">{label}</div>
        </div>
    );
}

function WorkspaceHeader({ onBack }: { onBack: () => void }) {
    return (
        <header className="rounded-xl border border-slate-200 bg-white px-3 py-3 dark:border-[var(--border-control)] dark:bg-[var(--surface-card)] sm:px-4">
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(410px,520px)] lg:items-center">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={onBack}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-[var(--surface-recessed)] hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-[var(--municipal-focus)]/30 dark:border-[var(--border-control)] dark:text-[var(--ink-secondary)] dark:hover:bg-[var(--surface-hover)]"
                            aria-label="Back to Future Integrations"
                        >
                            <ArrowLeft size={14} aria-hidden="true" />
                        </button>
                        <span className="text-xs font-extrabold uppercase tracking-[0.12em] text-[var(--brand-ink)]">
                            Property &amp; accountability
                        </span>
                    </div>
                    <h1 className="mt-1.5 text-[22px] font-extrabold tracking-tight text-[var(--ink-primary)]">
                        Asset &amp; Property Management
                    </h1>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[var(--ink-secondary)]">
                        <span className="font-extrabold text-[var(--ink-secondary)]">General Services Office</span>
                        <span className="hidden h-1 w-1 rounded-full bg-slate-300 sm:inline-block" aria-hidden="true" />
                        <span className="font-semibold">Municipal assets, custody, condition and accountability</span>
                    </div>
                    <div className="mt-1.5 text-xs font-semibold text-slate-400">
                        Preview workspace · Reference records only · Custody actions not yet enabled
                    </div>
                </div>

                <section className="grid grid-cols-2 gap-1.5 sm:grid-cols-4" aria-label="Asset accountability summary">
                    <HeaderCounter label="Assets in view" value={assetPropertySummary.assetsInView} tone="text-[var(--ink-primary)]" />
                    <HeaderCounter label="Accountable" value={assetPropertySummary.accountable} tone="text-[var(--brand-ink)]" />
                    <HeaderCounter label="For inspection" value={assetPropertySummary.forInspection} tone="text-amber-700 dark:text-amber-300" />
                    <HeaderCounter label="Reference gap" value={assetPropertySummary.referenceGap} tone="text-[var(--ink-secondary)]" />
                </section>
            </div>
        </header>
    );
}

function CategoryConditionContext() {
    return (
        <section className="grid gap-2 md:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]" aria-label="Asset category and condition context">
            <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 dark:border-[var(--border-control)] dark:bg-[var(--surface-card)]">
                <div className="text-xs font-extrabold uppercase tracking-[0.08em] text-slate-400">Register categories</div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                    {assetCategoryCounts.map((item) => (
                        <span key={item.category} className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs font-bold text-slate-600 dark:border-[var(--border-control)] dark:bg-[var(--surface-card)] dark:text-[var(--ink-secondary)]">
                            <span>{item.category}</span>
                            <span className="font-extrabold tabular-nums text-[var(--ink-primary)]">{item.count}</span>
                        </span>
                    ))}
                </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 dark:border-[var(--border-control)] dark:bg-[var(--surface-card)]">
                <div className="text-xs font-extrabold uppercase tracking-[0.08em] text-slate-400">Condition context</div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                    {assetConditionCounts.map((item) => (
                        <span key={item.condition} className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1.5 text-xs font-bold ${conditionTone(item.condition)}`}>
                            <span>{item.condition}</span>
                            <span className="font-extrabold tabular-nums">{item.count}</span>
                        </span>
                    ))}
                </div>
            </div>
        </section>
    );
}

function AssetRegisterTable({
    onOpen,
    compact = false,
}: {
    onOpen: (record: AssetPropertyRecord) => void;
    compact?: boolean;
}) {
    return (
        <div className="overflow-x-auto">
            <table className={`w-full table-fixed text-left ${compact ? 'min-w-[980px]' : 'min-w-[1040px]'}`}>
                <colgroup>
                    <col className="w-[12%]" />
                    <col className="w-[18%]" />
                    <col className="w-[11%]" />
                    <col className="w-[18%]" />
                    <col className="w-[16%]" />
                    <col className="w-[12%]" />
                    <col className="w-[13%]" />
                </colgroup>
                <thead className="bg-slate-50 text-xs font-bold uppercase tracking-[0.06em] text-slate-500 dark:bg-[var(--surface-card)] dark:text-[var(--ink-secondary)]">
                    <tr>
                        <th className="px-3 py-2.5">Asset ID</th>
                        <th className="px-3 py-2.5">Property / asset</th>
                        <th className="px-3 py-2.5">Category</th>
                        <th className="px-3 py-2.5">Responsible office</th>
                        <th className="px-3 py-2.5">Accountability</th>
                        <th className="px-3 py-2.5">Condition</th>
                        <th className="px-3 py-2.5">Reference state</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-default)]">
                    {assetPropertyRecords.map((record) => (
                        <tr key={record.id}
                            tabIndex={0} onClick={() => onOpen(record)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(record); } }}
                            className="cursor-pointer transition hover:bg-[var(--brand-soft)]/25 dark:hover:bg-[var(--surface-hover)]"
                        >
                            <td className="px-3 py-2.5 text-xs font-extrabold text-[var(--ink-secondary)]">{record.id}</td>
                            <td className="px-3 py-2.5 text-xs font-bold text-[var(--ink-primary)]">{record.name}</td>
                            <td className="px-3 py-2.5 text-xs font-semibold text-[var(--ink-secondary)]">{record.category}</td>
                            <td className="px-3 py-2.5 text-xs font-semibold text-[var(--ink-secondary)]">{record.office}</td>
                            <td className="px-3 py-2.5">
                                <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-bold ${accountabilityTone(record.accountability)}`}>
                                    {record.accountability}
                                </span>
                            </td>
                            <td className="px-3 py-2.5">
                                <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-bold ${conditionTone(record.condition)}`}>
                                    {record.condition}
                                </span>
                            </td>
                            <td className={`px-3 py-2.5 text-xs font-semibold ${referenceTone(record.referenceState)}`}>
                                {record.referenceState}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function CustodySnapshot() {
    const reviewItems = assetPropertyRecords.filter(
        (record) => record.accountability === 'Unassigned reference' || record.condition !== 'Serviceable',
    );

    return (
        <section className="rounded-xl border border-slate-200 bg-white p-3 dark:border-[var(--border-control)] dark:bg-[var(--surface-card)]">
            <div className="flex items-center justify-between gap-2">
                <div>
                    <h2 className="text-xs font-extrabold text-[var(--ink-primary)]">Custody snapshot</h2>
                    <p className="mt-0.5 text-xs text-[var(--ink-secondary)]">Office accountability and reference gaps requiring attention.</p>
                </div>
                <ShieldCheck size={16} className="text-[var(--brand-ink)]" aria-hidden="true" />
            </div>
            <div className="mt-2 divide-y divide-[var(--border-default)]">
                {reviewItems.map((record) => (
                    <div key={record.id} className="py-2">
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <div className="truncate text-xs font-extrabold text-[var(--ink-secondary)]">{record.id}</div>
                                <div className="mt-0.5 text-xs font-bold text-[var(--ink-primary)]">{record.name}</div>
                            </div>
                            <span className={`shrink-0 rounded-full border px-2 py-1 text-xs font-bold ${conditionTone(record.condition)}`}>
                                {record.condition}
                            </span>
                        </div>
                        <div className="mt-1 text-xs leading-4 text-slate-400">{record.lastMovement}</div>
                    </div>
                ))}
            </div>
        </section>
    );
}

function Overview({ onOpen }: { onOpen: (record: AssetPropertyRecord) => void }) {
    return (
        <div className="space-y-2.5">
            <CategoryConditionContext />
            <div className="grid items-start gap-2.5 xl:grid-cols-[minmax(0,2.5fr)_minmax(250px,.8fr)]">
                <section className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-[var(--border-control)] dark:bg-[var(--surface-card)]">
                    <div className="flex flex-col gap-1 border-b border-slate-100 px-3 py-2.5 dark:border-[var(--border-control)] sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <h2 className="text-xs font-extrabold text-[var(--ink-primary)]">Asset register</h2>
                            <p className="mt-0.5 text-xs text-[var(--ink-secondary)]">Property identity, accountable office, condition and reference state.</p>
                        </div>
                        <span className="text-xs font-semibold tabular-nums text-slate-400">{assetPropertyRecords.length} illustrative records</span>
                    </div>
                    <AssetRegisterTable onOpen={onOpen} compact />
                </section>
                <CustodySnapshot />
            </div>
        </div>
    );
}

function FullAssetRegister({ onOpen }: { onOpen: (record: AssetPropertyRecord) => void }) {
    return (
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-[var(--border-control)] dark:bg-[var(--surface-card)]">
            <div className="flex flex-col gap-1 border-b border-slate-100 px-3 py-2.5 dark:border-[var(--border-control)] sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h2 className="text-[12px] font-extrabold text-[var(--ink-primary)]">Municipal asset register</h2>
                    <p className="mt-0.5 text-xs text-[var(--ink-secondary)]">
                        Dense presentation register for property identity, office accountability, condition and reference state.
                    </p>
                </div>
                <span className="text-xs font-semibold text-slate-400">Reference-only · no serial, plate or personal custody data</span>
            </div>
            <AssetRegisterTable onOpen={onOpen} />
        </section>
    );
}

function CustodyAccountabilityView({ onOpen }: { onOpen: (record: AssetPropertyRecord) => void }) {
    return (
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-[var(--border-control)] dark:bg-[var(--surface-card)]">
            <div className="border-b border-slate-100 px-3 py-2.5 dark:border-[var(--border-control)]">
                <h2 className="text-[12px] font-extrabold text-[var(--ink-primary)]">Custody &amp; accountability references</h2>
                <p className="mt-0.5 text-xs text-[var(--ink-secondary)]">
                    Office-level accountability and movement context only. No issuance, transfer or personal custodian actions are represented.
                </p>
            </div>
            <div className="divide-y divide-[var(--border-default)]">
                {assetPropertyRecords.map((record) => (
                    <button
                        key={record.id}
                        type="button"
                        onClick={() => onOpen(record)}
                        className="grid w-full gap-2 px-3 py-3 text-left transition hover:bg-[var(--brand-soft)]/20 dark:hover:bg-[var(--surface-hover)] md:grid-cols-[190px_minmax(220px,.9fr)_minmax(0,1.35fr)_170px] md:items-center"
                    >
                        <div className="min-w-0">
                            <div className="text-xs font-extrabold text-[var(--ink-secondary)]">{record.id}</div>
                            <div className="mt-0.5 truncate text-xs font-bold text-[var(--ink-primary)]">{record.name}</div>
                        </div>
                        <div className="min-w-0">
                            <div className="truncate text-xs font-bold text-[var(--ink-secondary)]">{record.office}</div>
                            <div className="mt-0.5 truncate text-xs text-slate-400">{record.accountabilityReference}</div>
                        </div>
                        <div className="min-w-0">
                            <div className="text-xs font-semibold leading-4 text-[var(--ink-secondary)]">{record.custodyContext}</div>
                            <div className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                                <History size={11} aria-hidden="true" />
                                <span>{record.lastMovement}</span>
                            </div>
                        </div>
                        <div className="md:text-right">
                            <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-bold ${accountabilityTone(record.accountability)}`}>
                                {record.accountability}
                            </span>
                        </div>
                    </button>
                ))}
            </div>
        </section>
    );
}

function ConditionLifecycleView({ onOpen }: { onOpen: (record: AssetPropertyRecord) => void }) {
    return (
        <div className="space-y-2.5">
            <section className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4" aria-label="Asset condition distribution">
                {assetConditionCounts.map((item) => (
                    <div key={item.condition} className={`rounded-lg border px-3 py-2.5 ${conditionTone(item.condition)}`}>
                        <div className="text-xs font-extrabold uppercase tracking-[0.07em] opacity-70">{item.condition}</div>
                        <div className="mt-1 text-[20px] font-extrabold leading-none tabular-nums">{item.count}</div>
                        <div className="mt-1 text-xs opacity-65">Illustrative condition references</div>
                    </div>
                ))}
            </section>

            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-[var(--border-control)] dark:bg-[var(--surface-card)]">
                <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-3 py-2.5 dark:border-[var(--border-control)]">
                    <div>
                        <h2 className="text-[12px] font-extrabold text-[var(--ink-primary)]">Condition &amp; lifecycle references</h2>
                        <p className="mt-0.5 text-xs text-[var(--ink-secondary)]">
                            Condition, maintenance/inspection context and reference state without depreciation, valuation or disposal authority.
                        </p>
                    </div>
                    <Wrench size={16} className="shrink-0 text-slate-400" aria-hidden="true" />
                </div>
                <div className="divide-y divide-[var(--border-default)]">
                    {assetPropertyRecords.map((record) => (
                        <button
                            key={record.id}
                            type="button"
                            onClick={() => onOpen(record)}
                            className="grid w-full gap-2 px-3 py-3 text-left transition hover:bg-[var(--brand-soft)]/20 dark:hover:bg-[var(--surface-hover)] md:grid-cols-[190px_170px_minmax(0,1fr)_190px] md:items-center"
                        >
                            <div className="min-w-0">
                                <div className="text-xs font-extrabold text-[var(--ink-secondary)]">{record.id}</div>
                                <div className="mt-0.5 truncate text-xs font-bold text-[var(--ink-primary)]">{record.name}</div>
                            </div>
                            <div>
                                <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-bold ${conditionTone(record.condition)}`}>
                                    {record.condition}
                                </span>
                            </div>
                            <div className="text-xs font-semibold leading-4 text-[var(--ink-secondary)]">{record.lifecycleContext}</div>
                            <div className={`text-xs font-bold md:text-right ${referenceTone(record.referenceState)}`}>{record.referenceState}</div>
                        </button>
                    ))}
                </div>
            </section>
        </div>
    );
}

function AssetDetailModal({
    record,
    open,
    onClose,
}: {
    record: AssetPropertyRecord | null;
    open: boolean;
    onClose: () => void;
}) {
    const [step, setStep] = useState<DetailStep>('asset');

    useEffect(() => {
        if (open) setStep('asset');
    }, [open, record?.id]);

    const stepIndex = detailSteps.findIndex((item) => item.id === step);
    const moveStep = (offset: number) => {
        const next = detailSteps[stepIndex + offset];
        if (next) setStep(next.id);
    };

    return (
        <DetailDrawer
            open={open && Boolean(record)}
            onClose={onClose}
            size="standard"
            eyebrow="Asset / property record"
            title={record ? `${record.id} · ${record.name}` : 'Asset / property record'}
            footer={record ? (
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-xs font-semibold text-slate-400">Step {stepIndex + 1} of {detailSteps.length} · reference only</div>
                    <div className="flex flex-wrap justify-end gap-2">
                        {stepIndex > 0 && (
                            <button type="button" onClick={() => moveStep(-1)} className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-[var(--border-control)] dark:bg-[var(--surface-card)] dark:text-[var(--ink-primary)]">
                                <ChevronLeft size={13} aria-hidden="true" /> Back
                            </button>
                        )}
                        <button type="button" onClick={onClose} className="min-h-9 rounded-lg border border-slate-300 bg-white px-3 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-[var(--border-control)] dark:bg-[var(--surface-card)] dark:text-[var(--ink-primary)]">
                            Close
                        </button>
                        {stepIndex < detailSteps.length - 1 && (
                            <button type="button" onClick={() => moveStep(1)} className="inline-flex min-h-9 items-center gap-1 rounded-lg bg-[#0e4d36] px-3 text-xs font-bold text-white hover:bg-[#123764]">
                                Next <ChevronRight size={13} aria-hidden="true" />
                            </button>
                        )}
                    </div>
                </div>
            ) : undefined}
        >
            {record && (
                <div className="space-y-4">
                    <div role="tablist" aria-label="Asset property detail sections" className="grid grid-cols-3 gap-1 rounded-xl bg-[var(--surface-recessed)] p-1">
                        {detailSteps.map((item, index) => (
                            <button
                                key={item.id}
                                type="button"
                                role="tab"
                                aria-selected={step === item.id}
                                onClick={() => setStep(item.id)}
                                className={'min-h-9 rounded-lg border px-2 text-xs font-bold transition '
                                    + (step === item.id
                                        ? 'border-[var(--brand-soft-border)] bg-[var(--brand-soft)] text-[var(--brand-ink)]'
                                        : 'border-transparent text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]')}
                            >
                                <span className="mr-1 text-xs opacity-55">{index + 1}</span>{item.label}
                            </button>
                        ))}
                    </div>

                    {step === 'asset' && (
                        <section aria-label="Asset identity">
                            <div className="mb-3 flex flex-wrap items-center gap-2">
                                <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-bold ${conditionTone(record.condition)}`}>{record.condition}</span>
                                <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-bold ${accountabilityTone(record.accountability)}`}>{record.accountability}</span>
                            </div>
                            <dl className="grid gap-3 text-xs sm:grid-cols-2">
                                <div className="rounded-lg bg-slate-50 px-3 py-2.5 dark:bg-[var(--surface-card)]">
                                    <dt className="text-slate-400">Asset ID</dt>
                                    <dd className="mt-1 font-extrabold text-[var(--ink-primary)]">{record.id}</dd>
                                </div>
                                <div className="rounded-lg bg-slate-50 px-3 py-2.5 dark:bg-[var(--surface-card)]">
                                    <dt className="text-slate-400">Category</dt>
                                    <dd className="mt-1 font-bold text-[var(--ink-primary)]">{record.category}</dd>
                                </div>
                                <div className="rounded-lg border border-slate-200 px-3 py-2.5 dark:border-[var(--border-control)] sm:col-span-2">
                                    <dt className="text-slate-400">Property / asset</dt>
                                    <dd className="mt-1 font-bold text-[var(--ink-primary)]">{record.name}</dd>
                                </div>
                                <div className="rounded-lg border border-slate-200 px-3 py-2.5 dark:border-[var(--border-control)] sm:col-span-2">
                                    <dt className="text-slate-400">Responsible office</dt>
                                    <dd className="mt-1 font-semibold text-[var(--ink-secondary)]">{record.office}</dd>
                                </div>
                                <div className="rounded-lg bg-slate-50 px-3 py-2.5 dark:bg-[var(--surface-card)]">
                                    <dt className="text-slate-400">Condition</dt>
                                    <dd className="mt-1 font-bold text-[var(--ink-primary)]">{record.condition}</dd>
                                </div>
                                <div className="rounded-lg bg-slate-50 px-3 py-2.5 dark:bg-[var(--surface-card)]">
                                    <dt className="text-slate-400">Reference state</dt>
                                    <dd className={`mt-1 font-bold ${referenceTone(record.referenceState)}`}>{record.referenceState}</dd>
                                </div>
                            </dl>
                        </section>
                    )}

                    {step === 'custody' && (
                        <section aria-label="Asset custody and accountability">
                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="rounded-lg border border-slate-200 p-3 dark:border-[var(--border-control)]">
                                    <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.07em] text-slate-400">
                                        <ShieldCheck size={13} aria-hidden="true" /> Accountability
                                    </div>
                                    <div className="mt-2 text-xs font-bold text-[var(--ink-primary)]">{record.accountability}</div>
                                    <div className="mt-1 text-xs leading-4 text-[var(--ink-secondary)]">{record.accountabilityReference}</div>
                                </div>
                                <div className="rounded-lg border border-slate-200 p-3 dark:border-[var(--border-control)]">
                                    <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.07em] text-slate-400">
                                        <Building2 size={13} aria-hidden="true" /> Responsible office
                                    </div>
                                    <div className="mt-2 text-xs font-bold text-[var(--ink-primary)]">{record.office}</div>
                                    <div className="mt-1 text-xs leading-4 text-[var(--ink-secondary)]">Office-level reference only; no named custodian is stored.</div>
                                </div>
                            </div>
                            <div className="mt-3 rounded-lg bg-slate-50 p-3 dark:bg-[var(--surface-card)]">
                                <div className="text-xs font-extrabold uppercase tracking-[0.07em] text-slate-400">Current custody context</div>
                                <div className="mt-1.5 text-xs leading-5 text-[var(--ink-secondary)]">{record.custodyContext}</div>
                            </div>
                            <div className="mt-3 rounded-lg border border-slate-200 px-3 py-2.5 dark:border-[var(--border-control)]">
                                <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.07em] text-slate-400">
                                    <History size={13} aria-hidden="true" /> Last reference movement
                                </div>
                                <div className="mt-1.5 text-xs font-semibold text-[var(--ink-secondary)]">{record.lastMovement}</div>
                            </div>
                        </section>
                    )}

                    {step === 'history' && (
                        <section aria-label="Asset reference history">
                            <div className="mb-3 text-xs text-[var(--ink-secondary)]">
                                Presentation-only custody and condition reference history. No transaction, issuance or disposal authority is implied.
                            </div>
                            <div className="relative ml-2 border-l border-slate-200 pl-5 dark:border-[var(--border-control)]">
                                {record.history.map((item, index) => (
                                    <div key={`${record.id}-history-${index}`} className="relative pb-4 last:pb-0">
                                        <span className="absolute -left-[25px] top-1.5 h-2 w-2 rounded-full border-2 border-white bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] ring-1 ring-blue-200 dark:border-[#142236] dark:ring-blue-900" />
                                        <div className="text-xs font-bold text-[var(--ink-primary)]">{item.label}</div>
                                        <div className="mt-0.5 text-xs leading-4 text-[var(--ink-secondary)]">{item.detail}</div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            )}
        </DetailDrawer>
    );
}

export default function AssetPropertyWorkspace({ onBack }: Props) {
    const [tab, setTab] = useState<WorkspaceTab>('Overview');
    const [selectedRecord, setSelectedRecord] = useState<AssetPropertyRecord | null>(null);

    const selectedReferenceCount = useMemo(
        () => assetPropertyRecords.filter((record) => record.referenceState !== 'Reference gap').length,
        [],
    );

    return (
        <section className="space-y-2.5" aria-label="Asset & Property Management workspace">
            <WorkspaceHeader onBack={onBack} />

            <div className="rounded-xl border border-slate-200 bg-white px-2 pt-1 dark:border-[var(--border-control)] dark:bg-[var(--surface-card)]">
                <div role="tablist" aria-label="Asset property workspace views" className="flex gap-1 overflow-x-auto">
                    {tabs.map((item) => (
                        <button
                            key={item}
                            type="button"
                            role="tab"
                            aria-selected={tab === item}
                            onClick={() => setTab(item)}
                            className={'min-h-9 shrink-0 rounded-lg px-3 text-xs font-bold transition '
                                + (tab === item
                                    ? 'bg-blue-50 text-[var(--brand-ink)] dark:bg-[var(--status-info-bg)] dark:text-[var(--status-info-fg)]'
                                    : 'text-slate-500 hover:bg-[var(--surface-recessed)] dark:text-[var(--ink-secondary)] dark:hover:bg-[var(--surface-hover)]')}
                        >
                            {item}
                        </button>
                    ))}
                </div>
            </div>

            {tab === 'Overview' && <Overview onOpen={setSelectedRecord} />}
            {tab === 'Asset Register' && <FullAssetRegister onOpen={setSelectedRecord} />}
            {tab === 'Custody & Accountability' && <CustodyAccountabilityView onOpen={setSelectedRecord} />}
            {tab === 'Condition & Lifecycle' && <ConditionLifecycleView onOpen={setSelectedRecord} />}

            <footer className="flex flex-col gap-1 px-1 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
                <span>Presentation reference only · no live asset ledger, custody transaction, transfer, issuance or disposal behavior.</span>
                <span className="tabular-nums">{selectedReferenceCount} of {assetPropertyRecords.length} records carry a current reference context</span>
            </footer>

            <AssetDetailModal
                record={selectedRecord}
                open={Boolean(selectedRecord)}
                onClose={() => setSelectedRecord(null)}
            />
        </section>
    );
}
