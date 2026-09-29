import { useEffect, useMemo, useState } from 'react';
import {
    Activity,
    ArrowLeft,
    ChevronRight,
    ClipboardList,
    Database,
    FileText,
    GitBranch,
    Layers3,
    MapPinned,
    Network,
    PackageCheck,
    Search,
    Truck,
} from 'lucide-react';
import {
    presentationEnvironmentDetail,
    presentationEnvironmentFooter,
    presentationEnvironmentLabel,
    type FutureSystemPrototypeConfig,
    type PrototypeMetric,
    type PrototypeRecord,
    type PrototypeTabMode,
    type PrototypeTabView,
} from '../../data/municipal/futureSystemPrototypeData';

type Props = {
    prototype: FutureSystemPrototypeConfig;
    onBack?: () => void;
    backLabel?: string;
};

const metricTone: Record<NonNullable<PrototypeMetric['tone']>, string> = {
    emerald: 'border-emerald-200 bg-emerald-50/80 text-emerald-950 dark:border-emerald-900/60 dark:bg-emerald-950/25 dark:text-emerald-100',
    amber: 'border-amber-200 bg-amber-50/80 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/25 dark:text-amber-100',
    sky: 'border-sky-200 bg-sky-50/80 text-sky-950 dark:border-sky-900/60 dark:bg-sky-950/25 dark:text-sky-100',
    violet: 'border-violet-200 bg-violet-50/80 text-violet-950 dark:border-violet-900/60 dark:bg-violet-950/25 dark:text-violet-100',
    slate: 'border-slate-200 bg-slate-50 text-slate-950 dark:border-slate-700 dark:bg-slate-900/35 dark:text-slate-100',
};

const metricIconTone: Record<NonNullable<PrototypeMetric['tone']>, string> = {
    emerald: 'bg-white/80 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300',
    amber: 'bg-white/80 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300',
    sky: 'bg-white/80 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300',
    violet: 'bg-white/80 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300',
    slate: 'bg-white text-slate-600 dark:bg-slate-800 dark:text-slate-300',
};

function statusTone(status: string): string {
    const value = status.toLowerCase();
    if (value.includes('inspection') || value.includes('verification')) return 'bg-violet-50 text-violet-800 dark:bg-violet-950/40 dark:text-violet-200';
    if (value.includes('delivery') || value.includes('linked') || value.includes('assigned') || value.includes('trip')) return 'bg-sky-50 text-sky-800 dark:bg-sky-950/40 dark:text-sky-200';
    if (value.includes('sourcing') || value.includes('review') || value.includes('await') || value.includes('reorder') || value.includes('response')) return 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200';
    if (value.includes('complete') || value.includes('service') || value.includes('healthy') || value.includes('available') || value.includes('committed')) return 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200';
    return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200';
}

function MetricCards({ metrics }: { metrics: PrototypeMetric[] }) {
    const icons = [ClipboardList, Activity, Truck, PackageCheck];
    return (
        <section className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4" aria-label="Workspace summary">
            {metrics.map((metric, index) => {
                const tone = metric.tone ?? (['emerald', 'amber', 'sky', 'violet'] as const)[index % 4];
                const Icon = icons[index % icons.length];
                return (
                    <div key={metric.label} className={`flex min-h-[76px] items-center gap-3 rounded-lg border px-3 py-2.5 ${metricTone[tone]}`}>
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

function WorkflowStages({ lifecycle, records, activeStage, onSelect }: {
    lifecycle: string[];
    records: PrototypeRecord[];
    activeStage: string;
    onSelect: (stage: string) => void;
}) {
    return (
        <section className="rounded-xl border border-slate-200 bg-slate-50/55 p-2.5 dark:border-slate-700 dark:bg-slate-900/25" aria-label="Workflow stages">
            <div className="mb-2 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-800 dark:text-slate-100">
                    <GitBranch size={14} className="text-[var(--municipal-brand)]" aria-hidden="true" />
                    Workflow stages
                </div>
                {activeStage && (
                    <button type="button" onClick={() => onSelect('')} className="text-[9px] font-bold text-[var(--municipal-brand)] hover:underline">
                        Show all stages
                    </button>
                )}
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-1">
                {lifecycle.map((stage, index) => {
                    const count = records.filter((record) => record.stage.toLowerCase() === stage.toLowerCase()).length;
                    const selected = activeStage === stage;
                    return (
                        <button
                            key={stage}
                            type="button"
                            onClick={() => onSelect(selected ? '' : stage)}
                            className={'flex min-h-10 shrink-0 items-center gap-2 rounded-lg border px-2.5 text-[9px] font-bold transition '
                                + (selected
                                    ? 'border-emerald-300 bg-emerald-100/80 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/35 dark:text-emerald-100'
                                    : count > 0
                                        ? 'border-slate-200 bg-white text-slate-700 hover:border-emerald-200 dark:border-slate-700 dark:bg-[#142236] dark:text-slate-200'
                                        : 'border-slate-200 bg-slate-50 text-slate-400 dark:border-slate-800 dark:bg-slate-900/30 dark:text-slate-500')}
                        >
                            <span className="text-slate-400">{String(index + 1).padStart(2, '0')}</span>
                            {stage}
                            <span className="rounded-full bg-white/75 px-1.5 py-0.5 text-[8px] tabular-nums text-slate-500 dark:bg-slate-900/60 dark:text-slate-300">{count}</span>
                        </button>
                    );
                })}
            </div>
        </section>
    );
}

function RecordFilters({ query, onQuery, activeFilter, onFilter, filters }: {
    query: string;
    onQuery: (value: string) => void;
    activeFilter: string;
    onFilter: (value: string) => void;
    filters: string[];
}) {
    return (
        <div className="flex flex-col gap-1.5 sm:flex-row">
            <label className="relative min-w-[220px] flex-1">
                <span className="sr-only">Search records</span>
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                <input
                    value={query}
                    onChange={(event) => onQuery(event.target.value)}
                    placeholder="Search reference, request, office or status"
                    className="min-h-9 w-full rounded-lg border border-slate-300 bg-white pl-8 pr-2 text-[11px] outline-none focus:border-[var(--municipal-brand)] focus:ring-2 focus:ring-[var(--municipal-focus)]/20 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                />
            </label>
            <select
                value={activeFilter}
                onChange={(event) => onFilter(event.target.value)}
                aria-label="Status filter"
                className="min-h-9 rounded-lg border border-slate-300 bg-white px-2.5 text-[10px] font-semibold text-slate-700 outline-none focus:border-[var(--municipal-brand)] dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
            >
                {filters.map((filter) => <option key={filter}>{filter}</option>)}
            </select>
        </div>
    );
}

function RegisterTable({ records, selectedId, onSelect, delivery = false }: {
    records: PrototypeRecord[];
    selectedId: string;
    onSelect: (id: string) => void;
    delivery?: boolean;
}) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] table-fixed text-left">
                <thead className="bg-slate-50 text-[9px] font-bold uppercase tracking-[0.07em] text-slate-500 dark:bg-slate-900/40 dark:text-slate-400">
                    <tr>
                        <th className="w-[14%] px-3 py-2.5">Reference</th>
                        <th className="w-[24%] px-3 py-2.5">Request</th>
                        <th className="w-[18%] px-3 py-2.5">Requesting office</th>
                        {delivery ? (
                            <>
                                <th className="w-[15%] px-3 py-2.5">Delivery status</th>
                                <th className="w-[15%] px-3 py-2.5">Inspection status</th>
                                <th className="w-[14%] px-3 py-2.5">Amount / reference</th>
                            </>
                        ) : (
                            <>
                                <th className="w-[13%] px-3 py-2.5">Current stage</th>
                                <th className="w-[13%] px-3 py-2.5">Status</th>
                                <th className="w-[12%] px-3 py-2.5">Amount / reference</th>
                                <th className="w-[6%] px-3 py-2.5">Updated</th>
                            </>
                        )}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {records.map((record) => {
                        const selected = record.id === selectedId;
                        return (
                            <tr
                                key={record.id}
                                onClick={() => onSelect(record.id)}
                                className={'cursor-pointer border-l-2 transition-colors '
                                    + (selected
                                        ? 'border-l-[var(--municipal-brand)] bg-emerald-50/55 dark:bg-emerald-950/15'
                                        : 'border-l-transparent hover:bg-slate-50 dark:hover:bg-slate-900/35')}
                            >
                                <td className="px-3 py-2.5 align-middle text-[10px] font-extrabold text-slate-600 dark:text-slate-300">{record.id}</td>
                                <td className="px-3 py-2.5 align-middle">
                                    <div className="text-[11px] font-bold text-slate-950 dark:text-slate-100">{record.title}</div>
                                    <div className="mt-0.5 truncate text-[9px] text-slate-500 dark:text-slate-400">{record.subtitle}</div>
                                </td>
                                <td className="px-3 py-2.5 align-middle text-[10px] font-semibold text-slate-600 dark:text-slate-300">{record.owner}</td>
                                {delivery ? (
                                    <>
                                        <td className="px-3 py-2.5 align-middle text-[10px] text-slate-600 dark:text-slate-300">{record.deliveryStatus ?? record.stage}</td>
                                        <td className="px-3 py-2.5 align-middle"><span className={`inline-flex rounded-full px-2 py-1 text-[9px] font-bold ${statusTone(record.inspectionStatus ?? record.status)}`}>{record.inspectionStatus ?? record.status}</span></td>
                                        <td className="px-3 py-2.5 align-middle text-[10px] font-semibold text-slate-700 dark:text-slate-200">{record.amount ?? record.meta}</td>
                                    </>
                                ) : (
                                    <>
                                        <td className="px-3 py-2.5 align-middle text-[10px] font-bold text-[var(--municipal-brand)]">{record.stage}</td>
                                        <td className="px-3 py-2.5 align-middle"><span className={`inline-flex rounded-full px-2 py-1 text-[9px] font-bold ${statusTone(record.status)}`}>{record.status}</span></td>
                                        <td className="px-3 py-2.5 align-middle text-[10px] font-semibold text-slate-700 dark:text-slate-200">{record.amount ?? record.meta}</td>
                                        <td className="px-3 py-2.5 align-middle text-[9px] text-slate-500 dark:text-slate-400">{record.updated ?? '—'}</td>
                                    </>
                                )}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
            {records.length === 0 && <div className="p-8 text-center text-[11px] text-slate-500 dark:text-slate-400">No records match the current view.</div>}
        </div>
    );
}

function RequestDetails({ record, procurement }: { record?: PrototypeRecord; procurement: boolean }) {
    if (!record) return <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-[11px] text-slate-500 dark:border-slate-700 dark:text-slate-400">Select a visible record to inspect details.</div>;
    return (
        <section className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900/20">
            <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">
                <Database size={13} className="text-[var(--municipal-brand)]" aria-hidden="true" />
                {procurement ? 'Request details' : 'Record details'}
            </div>
            <div className="mt-2 text-[10px] font-extrabold uppercase tracking-wide text-slate-400">{record.id}</div>
            <h3 className="mt-0.5 text-[14px] font-extrabold text-slate-950 dark:text-slate-100">{record.title}</h3>
            <div className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">{record.subtitle}</div>
            <dl className="mt-3 grid gap-2 text-[10px] sm:grid-cols-2 xl:grid-cols-1">
                <div><dt className="text-slate-400">{procurement ? 'Requesting office' : 'Owner / source'}</dt><dd className="font-semibold text-slate-700 dark:text-slate-200">{record.owner}</dd></div>
                <div><dt className="text-slate-400">Status</dt><dd><span className={`inline-flex rounded-full px-2 py-1 text-[9px] font-bold ${statusTone(record.status)}`}>{record.status}</span></dd></div>
                <div><dt className="text-slate-400">Current stage</dt><dd className="font-semibold text-[var(--municipal-brand)]">{record.stage}</dd></div>
                <div><dt className="text-slate-400">{procurement ? 'Estimated amount' : 'Reference'}</dt><dd className="font-semibold text-slate-700 dark:text-slate-200">{record.amount ?? record.meta}</dd></div>
                {record.updated && <div><dt className="text-slate-400">Last activity</dt><dd className="font-semibold text-slate-700 dark:text-slate-200">{record.updated}</dd></div>}
                {record.nextAction && <div><dt className="text-slate-400">Next action</dt><dd className="font-semibold text-slate-700 dark:text-slate-200">{record.nextAction}</dd></div>}
            </dl>
            <p className="mt-3 rounded-lg bg-slate-50 px-2.5 py-2 text-[10px] leading-4 text-slate-600 dark:bg-slate-900/45 dark:text-slate-300">{record.note}</p>
        </section>
    );
}

function ReferenceList({ title, items }: { title: string; items: string[] }) {
    return (
        <section className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900/20">
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-950 dark:text-slate-100">
                <FileText size={13} className="text-[var(--municipal-brand)]" aria-hidden="true" /> {title}
            </div>
            <div className="mt-2 space-y-1.5">
                {items.map((item) => <div key={item} className="rounded-lg bg-slate-50 px-2.5 py-2 text-[10px] text-slate-600 dark:bg-slate-900/45 dark:text-slate-300">{item}</div>)}
            </div>
        </section>
    );
}

function ActivityList({ items }: { items: string[] }) {
    return (
        <section className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900/20">
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-950 dark:text-slate-100">
                <Activity size={13} className="text-[var(--municipal-brand)]" aria-hidden="true" /> Recent activity
            </div>
            <ol className="mt-2 space-y-2">
                {items.map((item, index) => (
                    <li key={`${item}-${index}`} className="flex items-start gap-2 text-[10px] text-slate-600 dark:text-slate-300">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--municipal-brand)]" />
                        <span>{item}</span>
                    </li>
                ))}
            </ol>
        </section>
    );
}

function FlowBoard({ lifecycle, records, activeStage, onStage, onRecord }: {
    lifecycle: string[];
    records: PrototypeRecord[];
    activeStage: string;
    onStage: (stage: string) => void;
    onRecord: (id: string) => void;
}) {
    return (
        <div className="overflow-x-auto pb-1">
            <div className="flex min-w-max gap-2">
                {lifecycle.map((stage) => {
                    const stageRecords = records.filter((record) => record.stage.toLowerCase() === stage.toLowerCase());
                    const selected = activeStage === stage;
                    return (
                        <section key={stage} className={`w-[190px] rounded-xl border p-2.5 ${selected ? 'border-emerald-300 bg-emerald-50/45 dark:border-emerald-800 dark:bg-emerald-950/15' : 'border-slate-200 bg-slate-50/60 dark:border-slate-700 dark:bg-slate-900/25'}`}>
                            <button type="button" onClick={() => onStage(selected ? '' : stage)} className="flex w-full items-center justify-between gap-2 text-left">
                                <span className="text-[10px] font-extrabold text-slate-800 dark:text-slate-100">{stage}</span>
                                <span className="rounded-full bg-white px-2 py-0.5 text-[9px] font-bold text-slate-500 dark:bg-slate-900 dark:text-slate-300">{stageRecords.length}</span>
                            </button>
                            <div className="mt-2 space-y-1.5">
                                {stageRecords.map((record) => (
                                    <button key={record.id} type="button" onClick={() => { onStage(stage); onRecord(record.id); }} className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-left transition hover:border-emerald-200 dark:border-slate-700 dark:bg-[#142236]">
                                        <div className="text-[9px] font-bold uppercase tracking-wide text-slate-400">{record.id}</div>
                                        <div className="mt-0.5 text-[10px] font-bold text-slate-800 dark:text-slate-100">{record.title}</div>
                                    </button>
                                ))}
                                {stageRecords.length === 0 && <div className="rounded-lg border border-dashed border-slate-200 px-2 py-4 text-center text-[9px] text-slate-400 dark:border-slate-700">No requests at this stage</div>}
                            </div>
                        </section>
                    );
                })}
            </div>
        </div>
    );
}

function MapCanvas({ prototype, activeLayer, onLayer, selectedId, onRecord }: {
    prototype: FutureSystemPrototypeConfig;
    activeLayer: string;
    onLayer: (layer: string) => void;
    selectedId: string;
    onRecord: (id: string) => void;
}) {
    const layers = prototype.mapLayers ?? [];
    const layer = layers.find((item) => item.label === activeLayer) ?? layers[0];
    const markers = prototype.records.filter((record) => layer?.recordIds.includes(record.id));
    const layerIndex = Math.max(0, layers.findIndex((item) => item.label === layer?.label));

    return (
        <div className="grid gap-2 lg:grid-cols-[210px_minmax(0,1fr)]">
            <section className="rounded-xl border border-slate-200 bg-white p-2.5 dark:border-slate-700 dark:bg-slate-900/20">
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-950 dark:text-slate-100"><Layers3 size={13} className="text-[var(--municipal-brand)]" aria-hidden="true" /> Map layers</div>
                <div className="mt-2 space-y-1">
                    {layers.map((item) => (
                        <button
                            key={item.label}
                            type="button"
                            onClick={() => {
                                onLayer(item.label);
                                if (item.recordIds[0]) onRecord(item.recordIds[0]);
                            }}
                            className={'flex min-h-9 w-full items-center justify-between rounded-lg px-2.5 text-left text-[10px] font-semibold transition '
                                + (layer?.label === item.label ? 'bg-emerald-50 text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200' : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900/40')}
                        >
                            {item.label}<span className="rounded-full bg-white px-1.5 py-0.5 text-[8px] text-slate-500 dark:bg-slate-800 dark:text-slate-300">{item.recordIds.length}</span>
                        </button>
                    ))}
                </div>
            </section>

            <section className="relative min-h-[330px] overflow-hidden rounded-xl border border-slate-200 bg-[linear-gradient(90deg,rgba(15,23,42,.05)_1px,transparent_1px),linear-gradient(rgba(15,23,42,.05)_1px,transparent_1px)] bg-[size:32px_32px] dark:border-slate-700 dark:bg-slate-900/55">
                <div className="absolute inset-x-0 top-0 flex items-center justify-between border-b border-slate-200/70 bg-white/90 px-3 py-2 backdrop-blur dark:border-slate-700 dark:bg-slate-900/85">
                    <span className="flex items-center gap-2 text-[10px] font-bold text-slate-700 dark:text-slate-200"><MapPinned size={13} className="text-[var(--municipal-brand)]" aria-hidden="true" /> {layer?.label ?? 'Map'} layer</span>
                    <span className="text-[9px] font-semibold text-slate-400">{markers.length} location{markers.length === 1 ? '' : 's'}</span>
                </div>
                {markers.map((record, index) => {
                    const selected = record.id === selectedId;
                    return (
                        <button
                            key={record.id}
                            type="button"
                            onClick={() => onRecord(record.id)}
                            className={'absolute flex h-8 w-8 items-center justify-center rounded-full border-2 text-[9px] font-extrabold text-white shadow-sm transition ' + (selected ? 'scale-110 border-amber-300 bg-[var(--municipal-brand)]' : 'border-white bg-[var(--municipal-brand)] hover:scale-105 dark:border-slate-900')}
                            style={{ left: `${18 + ((layerIndex * 13 + index * 29) % 62)}%`, top: `${30 + ((layerIndex * 17 + index * 23) % 48)}%` }}
                            aria-label={`Select ${record.title}`}
                            title={record.title}
                        >
                            {index + 1}
                        </button>
                    );
                })}
                <div className="absolute bottom-3 left-3 right-3 max-w-md rounded-lg border border-slate-200 bg-white/92 px-3 py-2 shadow-sm dark:border-slate-700 dark:bg-slate-900/92">
                    <div className="text-[9px] font-bold uppercase tracking-wide text-slate-400">{layer?.label ?? 'Map context'}</div>
                    <div className="mt-0.5 text-[10px] leading-4 text-slate-600 dark:text-slate-300">{layer?.context}</div>
                </div>
            </section>
        </div>
    );
}

function KnowledgeCards({ records, selectedId, onSelect }: { records: PrototypeRecord[]; selectedId: string; onSelect: (id: string) => void }) {
    return (
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {records.map((record) => (
                <button key={record.id} type="button" onClick={() => onSelect(record.id)} className={'rounded-xl border p-3 text-left transition ' + (record.id === selectedId ? 'border-emerald-300 bg-emerald-50/60 dark:border-emerald-800 dark:bg-emerald-950/15' : 'border-slate-200 bg-white hover:border-emerald-200 dark:border-slate-700 dark:bg-slate-900/20')}>
                    <div className="text-[9px] font-bold uppercase tracking-wide text-slate-400">{record.status}</div>
                    <div className="mt-1 text-[12px] font-extrabold text-slate-950 dark:text-slate-100">{record.title}</div>
                    <div className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">{record.subtitle}</div>
                    <div className="mt-3 flex items-center justify-between gap-2 text-[9px] font-semibold text-slate-500 dark:text-slate-400"><span>{record.owner}</span><ChevronRight size={13} aria-hidden="true" /></div>
                </button>
            ))}
        </div>
    );
}

const ignoredTabWords = new Set(['overview', 'applications', 'assets', 'fleet', 'stock', 'library', 'handoffs', 'map']);

function deriveMode(prototype: FutureSystemPrototypeConfig, tab: string, index: number): PrototypeTabMode {
    if (prototype.archetype === 'map') return tab === 'Map' ? 'map' : tab === 'Locations' ? 'register' : 'cards';
    if (prototype.archetype === 'knowledge') return 'cards';
    if (prototype.archetype === 'integration') return 'integration';
    if (index === 0 && prototype.archetype === 'monitoring') return 'overview';
    if (index === 0) return 'register';
    if (/flow|routing|history|clearance|response/i.test(tab) && prototype.lifecycle) return 'flow';
    return 'register';
}

function deriveTabRecords(prototype: FutureSystemPrototypeConfig, tab: string, configured?: PrototypeTabView): PrototypeRecord[] {
    if (configured?.recordIds) return prototype.records.filter((record) => configured.recordIds?.includes(record.id));
    if (configured?.statuses) return prototype.records.filter((record) => configured.statuses?.includes(record.status));
    if (configured?.stages) return prototype.records.filter((record) => configured.stages?.includes(record.stage));

    const index = prototype.tabs.indexOf(tab);
    if (index <= 0) return prototype.records;

    const words = tab.toLowerCase().split(/[^a-z0-9]+/).filter((word) => word.length > 2 && !ignoredTabWords.has(word));
    const matches = prototype.records.filter((record) => {
        const haystack = [record.title, record.subtitle, record.status, record.stage, record.meta, record.note].join(' ').toLowerCase();
        return words.some((word) => haystack.includes(word));
    });
    if (matches.length > 0 && matches.length < prototype.records.length) return matches;
    return prototype.records.length > 0 ? [prototype.records[(index - 1) % prototype.records.length]] : [];
}

export default function FutureSystemPrototype({ prototype, onBack, backLabel = 'Back to Future Integrations' }: Props) {
    const procurement = prototype.id === 'PROCUREMENT';
    const [activeTab, setActiveTab] = useState(prototype.tabs[0]);
    const [activeFilter, setActiveFilter] = useState('All');
    const [selectedRecordId, setSelectedRecordId] = useState(prototype.records[0]?.id ?? '');
    const [activeStage, setActiveStage] = useState('');
    const [mapLayer, setMapLayer] = useState(prototype.mapLayers?.[0]?.label ?? '');
    const [query, setQuery] = useState('');

    useEffect(() => {
        setActiveTab(prototype.tabs[0]);
        setActiveFilter('All');
        setSelectedRecordId(prototype.records[0]?.id ?? '');
        setActiveStage('');
        setMapLayer(prototype.mapLayers?.[0]?.label ?? '');
        setQuery('');
    }, [prototype]);

    const tabIndex = prototype.tabs.indexOf(activeTab);
    const configuredView = prototype.tabViews?.[activeTab];
    const activeView: PrototypeTabView = configuredView ?? {
        mode: deriveMode(prototype, activeTab, tabIndex),
        title: activeTab,
        description: `${activeTab} view for ${prototype.description.toLowerCase()}.`,
        showLifecycle: Boolean(prototype.lifecycle) && tabIndex > 0,
    };

    const tabRecords = useMemo(
        () => deriveTabRecords(prototype, activeTab, configuredView),
        [activeTab, configuredView, prototype],
    );

    const visibleRecords = useMemo(() => {
        const needle = query.trim().toLowerCase();
        return tabRecords.filter((record) => {
            const filterMatches = activeFilter === 'All' || record.status === activeFilter;
            const stageMatches = !activeStage || record.stage.toLowerCase() === activeStage.toLowerCase();
            const queryMatches = !needle || [record.id, record.title, record.subtitle, record.owner, record.status, record.stage, record.meta]
                .join(' ').toLowerCase().includes(needle);
            return filterMatches && stageMatches && queryMatches;
        });
    }, [activeFilter, activeStage, query, tabRecords]);

    useEffect(() => {
        if (!visibleRecords.some((record) => record.id === selectedRecordId)) {
            setSelectedRecordId(visibleRecords[0]?.id ?? '');
        }
    }, [selectedRecordId, visibleRecords]);

    useEffect(() => {
        setActiveFilter('All');
        setActiveStage('');
        setQuery('');
    }, [activeTab]);

    const selectedRecord = visibleRecords.find((record) => record.id === selectedRecordId);
    const secondaryTitle = activeView.secondaryTitle ?? prototype.secondaryTitle;
    const secondaryItems = activeView.secondaryItems ?? selectedRecord?.documents ?? prototype.secondaryItems;
    const metrics = activeView.metricLabels
        ? prototype.metrics.filter((metric) => activeView.metricLabels?.includes(metric.label))
        : prototype.metrics;

    const registerHeader = (
        <div className="flex flex-col gap-2 border-b border-slate-200 bg-slate-50/60 p-2.5 dark:border-slate-700 dark:bg-slate-900/25 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
                <div className="text-[11px] font-bold text-slate-950 dark:text-slate-100">{activeView.title}</div>
                <div className="mt-0.5 text-[9px] text-slate-500 dark:text-slate-400">{activeView.description}</div>
            </div>
            <RecordFilters query={query} onQuery={setQuery} activeFilter={activeFilter} onFilter={setActiveFilter} filters={prototype.filters} />
        </div>
    );

    const detailColumn = (
        <aside className="space-y-2.5">
            <RequestDetails record={selectedRecord} procurement={procurement} />
            {selectedRecord?.history && <ActivityList items={selectedRecord.history} />}
            <ReferenceList title={secondaryTitle} items={secondaryItems} />
        </aside>
    );

    return (
        <section aria-labelledby={`system-${prototype.id}`} className="space-y-2.5">
            {onBack && (
                <button type="button" onClick={onBack} className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-bold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[var(--municipal-focus)]/30 dark:border-slate-700 dark:bg-[#142236] dark:text-slate-200">
                    <ArrowLeft size={14} aria-hidden="true" />{backLabel}
                </button>
            )}

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-[#142236]">
                <header className="border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-[#142236]">
                    <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.08em] text-emerald-800 dark:bg-emerald-950/35 dark:text-emerald-200">{prototype.contextLabel}</span>
                                {prototype.contextValue && <span className="text-[9px] font-bold uppercase tracking-[0.08em] text-slate-400">{prototype.contextValue}</span>}
                            </div>
                            <h2 id={`system-${prototype.id}`} className="mt-2 text-[22px] font-extrabold tracking-tight text-slate-950 dark:text-slate-100">{prototype.name}</h2>
                            <p className="mt-1 text-[11px] font-bold text-slate-600 dark:text-slate-300">{prototype.leadOffice}</p>
                            <p className="mt-1 text-[10px] leading-4 text-slate-500 dark:text-slate-400">{prototype.description}</p>
                        </div>
                        <div className="shrink-0 rounded-lg border border-amber-200 bg-amber-50/65 px-3 py-2 dark:border-amber-900/50 dark:bg-amber-950/15">
                            <div className="text-[9px] font-extrabold uppercase tracking-[0.08em] text-amber-900 dark:text-amber-200">{presentationEnvironmentLabel}</div>
                            <div className="mt-0.5 text-[9px] text-amber-800/80 dark:text-amber-200/75">{presentationEnvironmentDetail}</div>
                        </div>
                    </div>
                </header>

                <div className="border-b border-slate-200 bg-slate-50/35 px-3 pt-2 dark:border-slate-700 dark:bg-slate-900/15">
                    <div role="tablist" aria-label={`${prototype.name} views`} className="flex gap-1 overflow-x-auto">
                        {prototype.tabs.map((tab) => (
                            <button
                                key={tab}
                                type="button"
                                role="tab"
                                aria-selected={activeTab === tab}
                                onClick={() => setActiveTab(tab)}
                                className={'min-h-9 shrink-0 rounded-t-lg px-3 text-[10px] font-bold transition focus:outline-none focus:ring-2 focus:ring-[var(--municipal-focus)]/30 '
                                    + (activeTab === tab ? 'border border-b-white border-slate-200 bg-white text-[var(--municipal-brand)] dark:border-slate-700 dark:border-b-[#142236] dark:bg-[#142236]' : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-900/40')}
                            >{tab}</button>
                        ))}
                    </div>
                </div>

                <div className="space-y-3 p-3">
                    {activeView.mode === 'overview' && <MetricCards metrics={metrics} />}

                    {activeView.showLifecycle && prototype.lifecycle && (
                        <WorkflowStages lifecycle={prototype.lifecycle} records={tabRecords} activeStage={activeStage} onSelect={setActiveStage} />
                    )}

                    {activeView.mode === 'overview' && (
                        <div className="grid gap-3 xl:grid-cols-[minmax(0,1.6fr)_minmax(19rem,.75fr)]">
                            <section className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
                                {registerHeader}
                                <RegisterTable records={visibleRecords} selectedId={selectedRecordId} onSelect={setSelectedRecordId} />
                            </section>
                            {detailColumn}
                        </div>
                    )}

                    {(activeView.mode === 'register' || activeView.mode === 'integration') && (
                        <div className="grid gap-3 xl:grid-cols-[minmax(0,1.7fr)_minmax(19rem,.7fr)]">
                            <section className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
                                {registerHeader}
                                <RegisterTable records={visibleRecords} selectedId={selectedRecordId} onSelect={setSelectedRecordId} />
                            </section>
                            {detailColumn}
                        </div>
                    )}

                    {activeView.mode === 'delivery' && (
                        <div className="grid gap-3 xl:grid-cols-[minmax(0,1.7fr)_minmax(20rem,.7fr)]">
                            <section className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
                                {registerHeader}
                                <RegisterTable records={visibleRecords} selectedId={selectedRecordId} onSelect={setSelectedRecordId} delivery />
                            </section>
                            {detailColumn}
                        </div>
                    )}

                    {activeView.mode === 'flow' && prototype.lifecycle && (
                        <div className="space-y-3">
                            <div>
                                <div className="text-[11px] font-bold text-slate-950 dark:text-slate-100">{activeView.title}</div>
                                <div className="mt-0.5 text-[9px] text-slate-500 dark:text-slate-400">{activeView.description}</div>
                            </div>
                            <FlowBoard lifecycle={prototype.lifecycle} records={tabRecords} activeStage={activeStage} onStage={setActiveStage} onRecord={setSelectedRecordId} />
                            <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(19rem,.55fr)]">
                                <div className="rounded-xl border border-slate-200 bg-slate-50/55 p-3 text-[10px] text-slate-600 dark:border-slate-700 dark:bg-slate-900/25 dark:text-slate-300">
                                    {activeStage ? <><span className="font-bold text-slate-900 dark:text-slate-100">{activeStage}</span> · {visibleRecords.length} request{visibleRecords.length === 1 ? '' : 's'} in the current stage view.</> : 'Select a workflow stage to focus the request set and next handoff context.'}
                                </div>
                                {detailColumn}
                            </div>
                        </div>
                    )}

                    {activeView.mode === 'map' && (
                        <div className="grid gap-3 xl:grid-cols-[minmax(0,1.55fr)_minmax(19rem,.7fr)]">
                            <MapCanvas prototype={prototype} activeLayer={mapLayer} onLayer={setMapLayer} selectedId={selectedRecordId} onRecord={setSelectedRecordId} />
                            {detailColumn}
                        </div>
                    )}

                    {activeView.mode === 'cards' && (
                        <div className="space-y-2.5">
                            <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50/55 p-2.5 dark:border-slate-700 dark:bg-slate-900/25 lg:flex-row lg:items-center lg:justify-between">
                                <div><div className="text-[11px] font-bold text-slate-950 dark:text-slate-100">{activeView.title}</div><div className="mt-0.5 text-[9px] text-slate-500 dark:text-slate-400">{activeView.description}</div></div>
                                <RecordFilters query={query} onQuery={setQuery} activeFilter={activeFilter} onFilter={setActiveFilter} filters={prototype.filters} />
                            </div>
                            <KnowledgeCards records={visibleRecords} selectedId={selectedRecordId} onSelect={setSelectedRecordId} />
                            <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(19rem,.55fr)]">
                                <ReferenceList title={secondaryTitle} items={secondaryItems} />
                                <RequestDetails record={selectedRecord} procurement={false} />
                            </div>
                        </div>
                    )}

                    <div className="grid gap-2 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,.6fr)]">
                        <section className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-950 dark:text-slate-100"><Network size={13} className="text-[var(--municipal-brand)]" aria-hidden="true" /> ONE TALIBON connection points</div>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                                {prototype.integrationPoints.map((point) => <span key={point} className="rounded-full bg-slate-100 px-2.5 py-1 text-[9px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{point}</span>)}
                            </div>
                        </section>
                        <section className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-[10px] leading-4 text-slate-600 dark:border-slate-700 dark:bg-slate-900/25 dark:text-slate-300">
                            {prototype.conservativeNote ?? presentationEnvironmentFooter}
                        </section>
                    </div>
                </div>
            </div>
        </section>
    );
}
