import { useEffect, useMemo, useState } from 'react';
import {
    Activity,
    ChevronLeft,
    ChevronRight,
    ClipboardList,
    FileText,
    GitBranch,
    PackageCheck,
    Search,
    Truck,
} from 'lucide-react';
import {
    presentationEnvironmentFooter,
    presentationEnvironmentLabel,
    type FutureSystemPrototypeConfig,
    type PrototypeMetric,
    type PrototypeRecord,
} from '../../data/municipal/futureSystemPrototypeData';
import DetailDrawer from './DetailDrawer';

type Props = {
    prototype: FutureSystemPrototypeConfig;
};

type Tab = 'Overview' | 'Purchase Requests' | 'Procurement Flow' | 'Delivery & Inspection';
type DetailStep = 'summary' | 'activity' | 'documents';

const detailSteps: Array<{ id: DetailStep; label: string }> = [
    { id: 'summary', label: 'Summary' },
    { id: 'activity', label: 'Activity' },
    { id: 'documents', label: 'Documents' },
];

const metricTone = {
    emerald: 'border-emerald-200 bg-emerald-50/80 text-emerald-950 dark:border-emerald-900/60 dark:bg-emerald-950/25 dark:text-emerald-100',
    amber: 'border-amber-200 bg-amber-50/80 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/25 dark:text-amber-100',
    sky: 'border-sky-200 bg-sky-50/80 text-sky-950 dark:border-sky-900/60 dark:bg-sky-950/25 dark:text-sky-100',
    violet: 'border-violet-200 bg-violet-50/80 text-violet-950 dark:border-violet-900/60 dark:bg-violet-950/25 dark:text-violet-100',
    slate: 'border-slate-200 bg-slate-50 text-slate-950 dark:border-slate-700 dark:bg-slate-900/35 dark:text-slate-100',
} as const;

const metricIconTone = {
    emerald: 'bg-white/85 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300',
    amber: 'bg-white/85 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300',
    sky: 'bg-white/85 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300',
    violet: 'bg-white/85 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300',
    slate: 'bg-white text-slate-600 dark:bg-slate-800 dark:text-slate-300',
} as const;

function statusTone(status: string): string {
    const value = status.toLowerCase();
    if (value.includes('inspection')) return 'bg-violet-50 text-violet-800 dark:bg-violet-950/40 dark:text-violet-200';
    if (value.includes('delivery')) return 'bg-sky-50 text-sky-800 dark:bg-sky-950/40 dark:text-sky-200';
    if (value.includes('sourcing') || value.includes('rfq')) return 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200';
    if (value.includes('complete')) return 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200';
    return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200';
}

function MetricCards({ metrics }: { metrics: PrototypeMetric[] }) {
    const icons = [ClipboardList, Activity, Truck, PackageCheck];
    return (
        <section className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4" aria-label="Procurement summary">
            {metrics.map((metric, index) => {
                const tone = metric.tone ?? 'slate';
                const Icon = icons[index % icons.length];
                return (
                    <div key={metric.label} className={`flex min-h-[70px] items-center gap-3 rounded-lg border px-3 py-2.5 ${metricTone[tone]}`}>
                        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${metricIconTone[tone]}`}>
                            <Icon size={17} aria-hidden="true" />
                        </span>
                        <div className="min-w-0">
                            <div className="text-[9px] font-extrabold uppercase tracking-[0.08em] opacity-65">{metric.label}</div>
                            <div className="mt-0.5 text-[20px] font-extrabold leading-none tabular-nums">{metric.value}</div>
                            <div className="mt-1 truncate text-[10px] font-semibold opacity-70">{metric.detail}</div>
                        </div>
                    </div>
                );
            })}
        </section>
    );
}

function CompactHeader() {
    return (
        <header className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 dark:border-slate-700 dark:bg-[#142236]">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                    <div className="text-[9px] font-extrabold uppercase tracking-[0.1em] text-emerald-700 dark:text-emerald-300">Procurement operations</div>
                    <h1 className="mt-0.5 text-[21px] font-extrabold tracking-tight text-slate-950 dark:text-slate-100">Procurement / PR Tracking</h1>
                    <p className="mt-0.5 text-[10px] font-semibold text-slate-500 dark:text-slate-400">BAC / General Services · Purchase requests, sourcing, delivery &amp; inspection</p>
                </div>
                <div className="shrink-0 text-left lg:text-right">
                    <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[8px] font-extrabold uppercase tracking-[0.08em] text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-200">{presentationEnvironmentLabel}</span>
                    <div className="mt-1 text-[9px] font-semibold text-slate-400">Reference data only · Actions disabled</div>
                </div>
            </div>
        </header>
    );
}

function Filters({ query, onQuery, status, onStatus, statuses }: {
    query: string;
    onQuery: (value: string) => void;
    status: string;
    onStatus: (value: string) => void;
    statuses: string[];
}) {
    return (
        <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_190px]">
            <label className="relative min-w-0">
                <span className="sr-only">Search purchase requests</span>
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                <input
                    value={query}
                    onChange={(event) => onQuery(event.target.value)}
                    placeholder="Search PR, request, office or stage"
                    className="min-h-9 w-full rounded-lg border border-slate-300 bg-white pl-8 pr-3 text-[11px] text-slate-900 outline-none transition focus:border-[var(--municipal-brand)] focus:ring-2 focus:ring-[var(--municipal-focus)]/20 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                />
            </label>
            <select
                value={status}
                onChange={(event) => onStatus(event.target.value)}
                aria-label="Purchase request status"
                className="min-h-9 rounded-lg border border-slate-300 bg-white px-3 text-[11px] font-semibold text-slate-700 outline-none focus:border-[var(--municipal-brand)] dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
            >
                {statuses.map((item) => <option key={item}>{item}</option>)}
            </select>
        </div>
    );
}

function RequestDrawer({ record, open, onClose }: { record?: PrototypeRecord; open: boolean; onClose: () => void }) {
    const [step, setStep] = useState<DetailStep>('summary');

    useEffect(() => {
        if (open) setStep('summary');
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
            title={record ? `${record.id} · ${record.title}` : 'Request details'}
            eyebrow="Request details"
            footer={record ? (
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-[9px] font-semibold text-slate-400">Step {stepIndex + 1} of {detailSteps.length}</div>
                    <div className="flex flex-wrap justify-end gap-2">
                        {stepIndex > 0 && (
                            <button type="button" onClick={() => moveStep(-1)} className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 text-[10px] font-bold text-slate-600 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-[#142236] dark:text-slate-200">
                                <ChevronLeft size={13} aria-hidden="true" /> Back
                            </button>
                        )}
                        <button type="button" onClick={onClose} className="min-h-9 rounded-lg border border-slate-300 bg-white px-3 text-[10px] font-bold text-slate-600 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-[#142236] dark:text-slate-200">Close</button>
                        {stepIndex < detailSteps.length - 1 && (
                            <button type="button" onClick={() => moveStep(1)} className="inline-flex min-h-9 items-center gap-1 rounded-lg bg-[#0b2852] px-3 text-[10px] font-bold text-white transition hover:bg-[#123764]">
                                Next <ChevronRight size={13} aria-hidden="true" />
                            </button>
                        )}
                    </div>
                </div>
            ) : undefined}
        >
            {record && (
                <div className="space-y-4">
                    <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 dark:border-slate-700 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                            <div className="text-[10px] font-extrabold uppercase tracking-[0.08em] text-slate-400">{record.id}</div>
                            <div className="mt-1 text-[18px] font-extrabold text-slate-950 dark:text-slate-100">{record.title}</div>
                            <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">{record.subtitle}</div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2 sm:flex-col sm:items-end">
                            <span className={`inline-flex rounded-full px-2.5 py-1 text-[9px] font-bold ${statusTone(record.status)}`}>{record.status}</span>
                            <span className="text-[16px] font-extrabold tabular-nums text-slate-800 dark:text-slate-200">{record.amount ?? record.meta}</span>
                        </div>
                    </div>

                    <div role="tablist" aria-label="Request detail sections" className="grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-900/55">
                        {detailSteps.map((item, index) => (
                            <button
                                key={item.id}
                                type="button"
                                role="tab"
                                aria-selected={step === item.id}
                                onClick={() => setStep(item.id)}
                                className={'min-h-9 rounded-lg px-2 text-[10px] font-bold transition '
                                    + (step === item.id
                                        ? 'bg-white text-[var(--municipal-brand)] shadow-sm dark:bg-[#142236] dark:text-emerald-300'
                                        : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200')}
                            >
                                <span className="mr-1 text-[9px] opacity-55">{index + 1}</span>{item.label}
                            </button>
                        ))}
                    </div>

                    {step === 'summary' && (
                        <section aria-label="Request summary">
                            <dl className="grid gap-3 text-[11px] sm:grid-cols-2">
                                <div className="rounded-lg bg-slate-50 px-3 py-2.5 dark:bg-slate-900/40"><dt className="text-slate-400">Requesting office</dt><dd className="mt-1 font-semibold text-slate-800 dark:text-slate-200">{record.owner}</dd></div>
                                <div className="rounded-lg bg-slate-50 px-3 py-2.5 dark:bg-slate-900/40"><dt className="text-slate-400">Estimated amount</dt><dd className="mt-1 font-semibold text-slate-800 dark:text-slate-200">{record.amount ?? record.meta}</dd></div>
                                <div className="rounded-lg bg-slate-50 px-3 py-2.5 dark:bg-slate-900/40"><dt className="text-slate-400">Status</dt><dd className="mt-1"><span className={`inline-flex rounded-full px-2 py-1 text-[9px] font-bold ${statusTone(record.status)}`}>{record.status}</span></dd></div>
                                <div className="rounded-lg bg-slate-50 px-3 py-2.5 dark:bg-slate-900/40"><dt className="text-slate-400">Current stage</dt><dd className="mt-1 font-bold text-[var(--municipal-brand)]">{record.stage}</dd></div>
                                <div className="rounded-lg border border-slate-200 px-3 py-2.5 dark:border-slate-700 sm:col-span-2"><dt className="text-slate-400">Last activity</dt><dd className="mt-1 font-semibold text-slate-700 dark:text-slate-300">{record.history?.at(-1) ?? record.updated ?? 'Reference updated'}</dd></div>
                                <div className="rounded-lg border border-slate-200 px-3 py-2.5 dark:border-slate-700 sm:col-span-2"><dt className="text-slate-400">Next handoff</dt><dd className="mt-1 font-semibold leading-5 text-slate-700 dark:text-slate-300">{record.nextAction ?? record.note}</dd></div>
                            </dl>
                        </section>
                    )}

                    {step === 'activity' && (
                        <section aria-label="Request activity">
                            <div className="mb-3 flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.08em] text-slate-500"><Activity size={13} aria-hidden="true" /> Recent activity</div>
                            <div className="relative ml-2 border-l border-slate-200 pl-5 dark:border-slate-700">
                                {(record.history ?? []).map((item, index) => (
                                    <div key={`${record.id}-history-${index}`} className="relative pb-4 last:pb-0">
                                        <span className="absolute -left-[25px] top-1.5 h-2 w-2 rounded-full border-2 border-white bg-[var(--municipal-brand)] ring-1 ring-emerald-200 dark:border-[#142236] dark:ring-emerald-900" />
                                        <div className="text-[10px] font-semibold leading-5 text-slate-700 dark:text-slate-300">{item}</div>
                                    </div>
                                ))}
                                {(record.history ?? []).length === 0 && <div className="text-[10px] text-slate-500">No request history is available in the reference record.</div>}
                            </div>
                        </section>
                    )}

                    {step === 'documents' && (
                        <section aria-label="Supporting document references">
                            <div className="mb-3 flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.08em] text-slate-500"><FileText size={13} aria-hidden="true" /> Supporting references</div>
                            <div className="grid gap-2 sm:grid-cols-2">
                                {(record.documents ?? []).map((item) => (
                                    <div key={item} className="flex items-center gap-2.5 rounded-lg border border-slate-200 px-3 py-2.5 dark:border-slate-700">
                                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300"><FileText size={14} aria-hidden="true" /></span>
                                        <div><div className="text-[10px] font-bold text-slate-700 dark:text-slate-200">{item}</div><div className="mt-0.5 text-[8px] text-slate-400">Reference only</div></div>
                                    </div>
                                ))}
                                {(record.documents ?? []).length === 0 && <div className="text-[10px] text-slate-500">No supporting references are available for this record.</div>}
                            </div>
                        </section>
                    )}
                </div>
            )}
        </DetailDrawer>
    );
}

function Overview({ records, lifecycle, onOpen, onStage }: { records: PrototypeRecord[]; lifecycle: string[]; onOpen: (id: string) => void; onStage: (stage: string) => void }) {
    const attention = [
        { label: 'For sourcing', count: records.filter((record) => record.status === 'For sourcing').length, tone: 'text-amber-700 bg-amber-50 dark:bg-amber-950/25 dark:text-amber-200' },
        { label: 'For delivery', count: records.filter((record) => record.status === 'In delivery').length, tone: 'text-sky-700 bg-sky-50 dark:bg-sky-950/25 dark:text-sky-200' },
        { label: 'For inspection', count: records.filter((record) => record.status === 'For inspection').length, tone: 'text-violet-700 bg-violet-50 dark:bg-violet-950/25 dark:text-violet-200' },
    ];

    return (
        <div className="space-y-3">
            <div className="grid items-start gap-3 xl:grid-cols-[minmax(0,1.85fr)_minmax(260px,.9fr)]">
                <section className="self-start overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-[#142236]">
                    <div className="border-b border-slate-200 px-3 py-2 dark:border-slate-700">
                        <h2 className="text-[11px] font-extrabold text-slate-950 dark:text-slate-100">Active procurement</h2>
                        <p className="mt-0.5 text-[9px] text-slate-500 dark:text-slate-400">Open requests moving through sourcing, delivery and inspection.</p>
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-slate-700">
                        {records.map((record) => (
                            <button key={record.id} type="button" onClick={() => onOpen(record.id)} className="grid w-full gap-2 px-3 py-2.5 text-left transition hover:bg-emerald-50/30 dark:hover:bg-slate-900/35 md:grid-cols-[110px_minmax(0,1.3fr)_minmax(120px,.8fr)_110px_95px_100px] md:items-center">
                                <span className="text-[9px] font-extrabold text-slate-500 dark:text-slate-400">{record.id}</span>
                                <span className="truncate text-[11px] font-bold text-slate-950 dark:text-slate-100">{record.title}</span>
                                <span className="truncate text-[9px] font-semibold text-slate-500 dark:text-slate-400">{record.owner}</span>
                                <span><span className={`inline-flex rounded-full px-2 py-1 text-[8px] font-bold ${statusTone(record.status)}`}>{record.status}</span></span>
                                <span className="text-[9px] font-bold text-[var(--municipal-brand)]">{record.stage}</span>
                                <span className="text-right text-[10px] font-semibold text-slate-700 dark:text-slate-200">{record.amount}</span>
                            </button>
                        ))}
                    </div>
                </section>

                <div className="grid self-start gap-3 md:grid-cols-2 xl:grid-cols-1">
                    <section className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-[#142236]">
                        <h2 className="text-[11px] font-extrabold text-slate-950 dark:text-slate-100">Process attention</h2>
                        <div className="mt-2 grid gap-1.5">
                            {attention.map((item) => (
                                <div key={item.label} className={`flex items-center justify-between rounded-lg px-2.5 py-2 ${item.tone}`}>
                                    <span className="text-[10px] font-bold">{item.label}</span>
                                    <span className="text-[17px] font-extrabold tabular-nums">{item.count}</span>
                                </div>
                            ))}
                        </div>
                    </section>
                    <section className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-[#142236]">
                        <h2 className="text-[11px] font-extrabold text-slate-950 dark:text-slate-100">Recent movement</h2>
                        <div className="mt-2 space-y-2">
                            {records.map((record) => (
                                <button key={record.id} type="button" onClick={() => onOpen(record.id)} className="flex w-full items-start gap-2 rounded-lg px-1 py-1 text-left hover:bg-slate-50 dark:hover:bg-slate-900/35">
                                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--municipal-brand)]" />
                                    <span className="min-w-0"><span className="block text-[9px] font-extrabold text-slate-500">{record.id}</span><span className="block truncate text-[10px] font-semibold text-slate-700 dark:text-slate-300">{record.history?.at(-1) ?? record.note}</span></span>
                                </button>
                            ))}
                        </div>
                    </section>
                </div>
            </div>

            <section className="rounded-xl border border-slate-200 bg-slate-50/60 p-2.5 dark:border-slate-700 dark:bg-slate-900/25">
                <div className="mb-2 flex items-center gap-2 text-[10px] font-bold text-slate-700 dark:text-slate-200"><GitBranch size={13} className="text-[var(--municipal-brand)]" aria-hidden="true" /> Procurement lifecycle</div>
                <div className="grid gap-1.5 sm:grid-cols-4 xl:grid-cols-7">
                    {lifecycle.map((stage, index) => {
                        const count = records.filter((record) => record.stage === stage).length;
                        return (
                            <button key={stage} type="button" onClick={() => onStage(stage)} className={`rounded-lg border px-2 py-2 text-left transition ${count > 0 ? 'border-emerald-200 bg-white hover:bg-emerald-50 dark:border-emerald-900/50 dark:bg-[#142236]' : 'border-slate-200 bg-white/60 dark:border-slate-800 dark:bg-slate-900/30'}`}>
                                <div className="text-[8px] font-bold text-slate-400">{String(index + 1).padStart(2, '0')}</div>
                                <div className="mt-0.5 text-[9px] font-extrabold text-slate-700 dark:text-slate-200">{stage}</div>
                                <div className="mt-1 text-[9px] font-semibold text-slate-400">{count} request{count === 1 ? '' : 's'}</div>
                            </button>
                        );
                    })}
                </div>
            </section>
        </div>
    );
}

function PurchaseRegister({ records, onOpen }: { records: PrototypeRecord[]; onOpen: (id: string) => void }) {
    return (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-[#142236]">
            <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] table-fixed text-left">
                    <colgroup>
                        <col className="w-[12%]" /><col className="w-[23%]" /><col className="w-[18%]" /><col className="w-[12%]" /><col className="w-[13%]" /><col className="w-[10%]" /><col className="w-[12%]" />
                    </colgroup>
                    <thead className="bg-slate-50 text-[9px] font-bold uppercase tracking-[0.06em] text-slate-500 dark:bg-slate-900/40 dark:text-slate-400">
                        <tr><th className="px-2.5 py-2.5">PR No.</th><th className="px-2.5 py-2.5">Request</th><th className="px-2.5 py-2.5">Requesting office</th><th className="px-2.5 py-2.5">Current stage</th><th className="px-2.5 py-2.5">Status</th><th className="px-2.5 py-2.5">Amount</th><th className="px-2.5 py-2.5">Updated / context</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {records.map((record) => (
                            <tr key={record.id} onClick={() => onOpen(record.id)} className="cursor-pointer transition hover:bg-emerald-50/35 dark:hover:bg-slate-900/35">
                                <td className="px-2.5 py-2.5 text-[9px] font-extrabold text-slate-600 dark:text-slate-300">{record.id}</td>
                                <td className="px-2.5 py-2.5"><div className="truncate text-[11px] font-bold text-slate-950 dark:text-slate-100">{record.title}</div><div className="mt-0.5 truncate text-[9px] text-slate-400">{record.subtitle}</div></td>
                                <td className="px-2.5 py-2.5 text-[10px] font-semibold text-slate-600 dark:text-slate-300"><span className="line-clamp-2">{record.owner}</span></td>
                                <td className="px-2.5 py-2.5 text-[10px] font-bold text-[var(--municipal-brand)]">{record.stage}</td>
                                <td className="px-2.5 py-2.5"><span className={`inline-flex rounded-full px-2 py-1 text-[8px] font-bold ${statusTone(record.status)}`}>{record.status}</span></td>
                                <td className="px-2.5 py-2.5 text-[10px] font-semibold text-slate-700 dark:text-slate-200">{record.amount}</td>
                                <td className="px-2.5 py-2.5 text-[9px] text-slate-500 dark:text-slate-400">{record.updated ?? record.history?.at(-1) ?? 'Reference updated'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {records.length === 0 && <div className="p-8 text-center text-[11px] text-slate-500">No purchase requests match the current filters.</div>}
        </div>
    );
}

function FlowBoard({ records, lifecycle, focusedStage, onStage, onOpen }: { records: PrototypeRecord[]; lifecycle: string[]; focusedStage: string; onStage: (stage: string) => void; onOpen: (id: string) => void }) {
    return (
        <div className="overflow-x-auto pb-1">
            <div className="flex min-w-max gap-2">
                {lifecycle.map((stage) => {
                    const stageRecords = records.filter((record) => record.stage === stage);
                    const focused = focusedStage === stage;
                    return (
                        <section key={stage} className={`w-[190px] rounded-xl border p-2.5 ${focused ? 'border-emerald-300 bg-emerald-50/55 dark:border-emerald-800 dark:bg-emerald-950/15' : 'border-slate-200 bg-slate-50/55 dark:border-slate-700 dark:bg-slate-900/25'}`}>
                            <button type="button" onClick={() => onStage(focused ? '' : stage)} className="flex w-full items-center justify-between gap-2 text-left">
                                <span className="text-[10px] font-extrabold text-slate-800 dark:text-slate-100">{stage}</span>
                                <span className="rounded-full bg-white px-2 py-0.5 text-[9px] font-bold text-slate-500 dark:bg-slate-900 dark:text-slate-300">{stageRecords.length}</span>
                            </button>
                            <div className="mt-2 space-y-1.5">
                                {stageRecords.map((record) => (
                                    <button key={record.id} type="button" onClick={() => onOpen(record.id)} className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-left transition hover:border-emerald-200 dark:border-slate-700 dark:bg-[#142236]">
                                        <div className="text-[8px] font-extrabold uppercase tracking-wide text-slate-400">{record.id}</div>
                                        <div className="mt-0.5 text-[10px] font-bold text-slate-800 dark:text-slate-100">{record.title}</div>
                                        <div className="mt-1 text-[9px] text-slate-500">{record.owner}</div>
                                    </button>
                                ))}
                                {stageRecords.length === 0 && <div className="rounded-lg border border-dashed border-slate-200 px-2 py-6 text-center text-[9px] text-slate-400 dark:border-slate-700">No requests</div>}
                            </div>
                        </section>
                    );
                })}
            </div>
        </div>
    );
}

function FulfillmentBoard({ records, onOpen }: { records: PrototypeRecord[]; onOpen: (id: string) => void }) {
    return (
        <div className="grid gap-3 lg:grid-cols-2">
            {records.map((record) => (
                <button key={record.id} type="button" onClick={() => onOpen(record.id)} className="rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:border-emerald-200 hover:bg-emerald-50/20 dark:border-slate-700 dark:bg-[#142236] dark:hover:border-emerald-900/70">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0"><div className="text-[9px] font-extrabold uppercase tracking-wide text-slate-400">{record.id}</div><div className="mt-0.5 text-[13px] font-extrabold text-slate-950 dark:text-slate-100">{record.title}</div><div className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">{record.owner}</div></div>
                        <div className="text-right text-[12px] font-extrabold text-slate-800 dark:text-slate-200">{record.amount}</div>
                    </div>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        <div className="rounded-lg bg-sky-50 px-2.5 py-2 dark:bg-sky-950/20"><div className="text-[8px] font-bold uppercase tracking-wide text-sky-600 dark:text-sky-300">Delivery status</div><div className="mt-1 text-[10px] font-bold text-sky-900 dark:text-sky-100">{record.deliveryStatus ?? 'Delivery reference pending'}</div></div>
                        <div className="rounded-lg bg-violet-50 px-2.5 py-2 dark:bg-violet-950/20"><div className="text-[8px] font-bold uppercase tracking-wide text-violet-600 dark:text-violet-300">Inspection status</div><div className="mt-1 text-[10px] font-bold text-violet-900 dark:text-violet-100">{record.inspectionStatus ?? 'Inspection reference pending'}</div></div>
                    </div>
                    <div className="mt-3 grid gap-2 border-t border-slate-100 pt-3 text-[10px] dark:border-slate-700 sm:grid-cols-2">
                        <div><span className="block text-[8px] font-bold uppercase tracking-wide text-slate-400">Reference context</span><span className="mt-0.5 block font-semibold text-slate-600 dark:text-slate-300">Delivery / inspection references</span></div>
                        <div><span className="block text-[8px] font-bold uppercase tracking-wide text-slate-400">Next handoff</span><span className="mt-0.5 block font-semibold text-slate-600 dark:text-slate-300">{record.nextAction}</span></div>
                    </div>
                </button>
            ))}
        </div>
    );
}

export default function ProcurementWorkspace({ prototype }: Props) {
    const [tab, setTab] = useState<Tab>('Overview');
    const [query, setQuery] = useState('');
    const [status, setStatus] = useState('All');
    const [focusedStage, setFocusedStage] = useState('');
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);

    const records = prototype.records;
    const lifecycle = prototype.lifecycle ?? [];
    const fulfillmentRecords = records.filter((record) => ['Delivery', 'Inspection'].includes(record.stage));

    const filteredRecords = useMemo(() => {
        const needle = query.trim().toLowerCase();
        return records.filter((record) => {
            const statusMatches = status === 'All' || record.status === status;
            const stageMatches = !focusedStage || record.stage === focusedStage;
            const queryMatches = !needle || [record.id, record.title, record.subtitle, record.owner, record.status, record.stage, record.amount].join(' ').toLowerCase().includes(needle);
            return statusMatches && stageMatches && queryMatches;
        });
    }, [focusedStage, query, records, status]);

    const selectedRecord = records.find((record) => record.id === selectedId);

    useEffect(() => {
        if (selectedId && !filteredRecords.some((record) => record.id === selectedId) && tab === 'Purchase Requests') {
            setSelectedId(null);
            setDrawerOpen(false);
        }
    }, [filteredRecords, selectedId, tab]);

    const openRecord = (id: string) => {
        setSelectedId(id);
        setDrawerOpen(true);
    };

    const selectTab = (next: Tab) => {
        setTab(next);
        setQuery('');
        setStatus('All');
        setFocusedStage('');
        setDrawerOpen(false);
        setSelectedId(null);
    };

    const focusStage = (stage: string) => {
        setFocusedStage(stage);
        if (tab === 'Overview' && stage) setTab('Purchase Requests');
    };

    return (
        <section className="space-y-2.5" aria-label="Procurement / PR Tracking workspace">
            <CompactHeader />

            <div className="rounded-xl border border-slate-200 bg-white px-2 pt-1 dark:border-slate-700 dark:bg-[#142236]">
                <div role="tablist" aria-label="Procurement views" className="flex gap-1 overflow-x-auto">
                    {(['Overview', 'Purchase Requests', 'Procurement Flow', 'Delivery & Inspection'] as Tab[]).map((item) => (
                        <button key={item} type="button" role="tab" aria-selected={tab === item} onClick={() => selectTab(item)} className={'min-h-9 shrink-0 rounded-lg px-3 text-[10px] font-bold transition ' + (tab === item ? 'bg-emerald-50 text-emerald-900 dark:bg-emerald-950/35 dark:text-emerald-100' : 'text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-900/35')}>{item}</button>
                    ))}
                </div>
            </div>

            {tab === 'Overview' && (
                <>
                    <MetricCards metrics={prototype.metrics} />
                    <Overview records={records} lifecycle={lifecycle} onOpen={openRecord} onStage={focusStage} />
                </>
            )}

            {tab === 'Purchase Requests' && (
                <div className="space-y-2.5">
                    <section className="rounded-xl border border-slate-200 bg-white p-2.5 dark:border-slate-700 dark:bg-[#142236]">
                        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                            <div><h2 className="text-[12px] font-extrabold text-slate-950 dark:text-slate-100">Purchase request register</h2><p className="mt-0.5 text-[9px] text-slate-500 dark:text-slate-400">Full-width request register with status, stage and amount context.</p></div>
                            <div className="w-full lg:max-w-[600px]"><Filters query={query} onQuery={setQuery} status={status} onStatus={setStatus} statuses={prototype.filters} /></div>
                        </div>
                    </section>
                    {focusedStage && <div className="flex items-center justify-between rounded-lg border border-emerald-100 bg-emerald-50/55 px-3 py-2 text-[10px] text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-200"><span>Focused stage: <strong>{focusedStage}</strong></span><button type="button" onClick={() => setFocusedStage('')} className="font-bold hover:underline">Clear stage</button></div>}
                    <PurchaseRegister records={filteredRecords} onOpen={openRecord} />
                </div>
            )}

            {tab === 'Procurement Flow' && (
                <section className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-[#142236]">
                    <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="text-[12px] font-extrabold text-slate-950 dark:text-slate-100">Procurement lifecycle board</h2><p className="mt-0.5 text-[9px] text-slate-500 dark:text-slate-400">Request distribution from PR through payment handoff.</p></div>{focusedStage && <button type="button" onClick={() => setFocusedStage('')} className="text-[9px] font-bold text-[var(--municipal-brand)] hover:underline">Show all stages</button>}</div>
                    <FlowBoard records={records} lifecycle={lifecycle} focusedStage={focusedStage} onStage={setFocusedStage} onOpen={openRecord} />
                </section>
            )}

            {tab === 'Delivery & Inspection' && (
                <section className="space-y-2.5">
                    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-[#142236]"><h2 className="text-[12px] font-extrabold text-slate-950 dark:text-slate-100">Fulfillment operations</h2><p className="mt-0.5 text-[9px] text-slate-500 dark:text-slate-400">Downstream delivery, inspection and next-handoff context.</p></div>
                    <FulfillmentBoard records={fulfillmentRecords} onOpen={openRecord} />
                </section>
            )}

            <footer className="px-1 text-[9px] text-slate-400">{presentationEnvironmentFooter}</footer>
            <RequestDrawer record={selectedRecord} open={drawerOpen} onClose={() => setDrawerOpen(false)} />
        </section>
    );
}
