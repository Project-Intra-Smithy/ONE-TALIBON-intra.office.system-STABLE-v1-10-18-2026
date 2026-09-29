import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ChevronRight, Database, GitBranch, Network, Search, ShieldAlert } from 'lucide-react';
import {
    prototypeBoundary,
    prototypeTruth,
    type FutureSystemPrototypeConfig,
    type PrototypeRecord,
} from '../../data/municipal/futureSystemPrototypeData';

type Props = {
    prototype: FutureSystemPrototypeConfig;
    onBack?: () => void;
    backLabel?: string;
};

const archetypeLabel: Record<FutureSystemPrototypeConfig['archetype'], string> = {
    workflow: 'Workflow / case management',
    monitoring: 'Monitoring / analytics',
    map: 'Map / spatial workspace',
    assets: 'Asset / logistics register',
    integration: 'Integration handoff workspace',
    knowledge: 'Knowledge library',
};

function RecordRow({ record, selected, onSelect }: { record: PrototypeRecord; selected: boolean; onSelect: () => void }) {
    return (
        <button
            type="button"
            onClick={onSelect}
            className={'grid w-full min-w-0 gap-1.5 border-b border-slate-100 px-3 py-2.5 text-left transition last:border-b-0 dark:border-slate-700/80 md:grid-cols-[minmax(0,1.4fr)_minmax(7rem,.65fr)_minmax(7rem,.65fr)] md:items-center '
                + (selected
                    ? 'bg-emerald-50/80 dark:bg-emerald-950/20'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-900/35')}
        >
            <span className="min-w-0">
                <span className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-400">{record.id}</span>
                <span className="block truncate text-[12px] font-bold text-slate-950 dark:text-slate-100">{record.title}</span>
                <span className="block truncate text-[10px] text-slate-500 dark:text-slate-400">{record.subtitle}</span>
            </span>
            <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-300">{record.status}</span>
            <span className="flex items-center justify-between gap-2 text-[10px] font-semibold text-[var(--municipal-brand)]">
                {record.stage}
                <ChevronRight size={13} aria-hidden="true" />
            </span>
            {typeof record.progress === 'number' && (
                <span className="md:col-span-3">
                    <span className="block h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <span className="block h-full rounded-full bg-[var(--municipal-brand)]" style={{ width: `${record.progress}%` }} />
                    </span>
                </span>
            )}
        </button>
    );
}

function MapCanvas({ prototype, selected, onSelectLayer }: { prototype: FutureSystemPrototypeConfig; selected: string; onSelectLayer: (layer: string) => void }) {
    const layers = prototype.layers ?? [];
    return (
        <div className="grid gap-2 lg:grid-cols-[190px_minmax(0,1fr)]">
            <div className="rounded-xl border border-slate-200 bg-white p-2 dark:border-slate-700 dark:bg-[#142236]">
                <div className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">Layers</div>
                <div className="space-y-1">
                    {layers.map((layer) => (
                        <button
                            key={layer}
                            type="button"
                            onClick={() => onSelectLayer(layer)}
                            className={'flex min-h-8 w-full items-center justify-between rounded-lg px-2 text-left text-[10px] font-semibold transition '
                                + (selected === layer
                                    ? 'bg-emerald-50 text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200'
                                    : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900/40')}
                        >
                            {layer}
                            <span className="h-2 w-2 rounded-full bg-[var(--municipal-brand)] opacity-70" />
                        </button>
                    ))}
                </div>
            </div>
            <div className="relative min-h-[270px] overflow-hidden rounded-xl border border-slate-200 bg-[linear-gradient(90deg,rgba(15,23,42,.05)_1px,transparent_1px),linear-gradient(rgba(15,23,42,.05)_1px,transparent_1px)] bg-[size:32px_32px] dark:border-slate-700 dark:bg-slate-900/55">
                <div className="absolute inset-x-0 top-0 flex items-center justify-between border-b border-slate-200/70 bg-white/85 px-3 py-2 backdrop-blur dark:border-slate-700 dark:bg-slate-900/80">
                    <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200">Illustrative municipal map canvas</span>
                    <span className="text-[9px] font-semibold text-slate-400">{selected} layer</span>
                </div>
                {prototype.records.map((record, index) => (
                    <div
                        key={record.id}
                        className="absolute flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-[var(--municipal-brand)] text-[9px] font-extrabold text-white shadow-sm dark:border-slate-900"
                        style={{ left: `${22 + index * 27}%`, top: `${34 + (index % 2) * 29}%` }}
                        title={record.title}
                    >
                        {index + 1}
                    </div>
                ))}
                <div className="absolute bottom-3 left-3 rounded-lg border border-slate-200 bg-white/90 px-2.5 py-2 text-[9px] leading-4 text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-900/90 dark:text-slate-300">
                    No external map API · no real coordinates
                </div>
            </div>
        </div>
    );
}

export default function FutureSystemPrototype({ prototype, onBack, backLabel = 'Back to Future Integrations' }: Props) {
    const [activeTab, setActiveTab] = useState(prototype.tabs[0]);
    const [activeFilter, setActiveFilter] = useState('All');
    const [selectedRecordId, setSelectedRecordId] = useState(prototype.records[0]?.id ?? '');
    const [activeStage, setActiveStage] = useState(prototype.lifecycle?.[0] ?? '');
    const [mapLayer, setMapLayer] = useState(prototype.layers?.[0] ?? '');
    const [query, setQuery] = useState('');

    useEffect(() => {
        setActiveTab(prototype.tabs[0]);
        setActiveFilter('All');
        setSelectedRecordId(prototype.records[0]?.id ?? '');
        setActiveStage(prototype.lifecycle?.[0] ?? '');
        setMapLayer(prototype.layers?.[0] ?? '');
        setQuery('');
    }, [prototype]);

    const visibleRecords = useMemo(() => {
        const needle = query.trim().toLowerCase();
        return prototype.records.filter((record) => {
            const filterMatches = activeFilter === 'All' || record.status === activeFilter;
            const queryMatches = !needle || [record.id, record.title, record.subtitle, record.owner, record.status, record.stage, record.meta]
                .join(' ')
                .toLowerCase()
                .includes(needle);
            return filterMatches && queryMatches;
        });
    }, [activeFilter, prototype.records, query]);

    const selectedRecord = prototype.records.find((record) => record.id === selectedRecordId)
        ?? visibleRecords[0]
        ?? prototype.records[0];

    return (
        <section aria-labelledby={`prototype-${prototype.id}`} className="space-y-2.5">
            {onBack && (
                <button
                    type="button"
                    onClick={onBack}
                    className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-bold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[var(--municipal-focus)]/30 dark:border-slate-700 dark:bg-[#142236] dark:text-slate-200"
                >
                    <ArrowLeft size={14} aria-hidden="true" />
                    {backLabel}
                </button>
            )}

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-[#142236]">
                <header className="border-b border-slate-200 bg-slate-50/70 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/35">
                    <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.08em] text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
                                    {prototypeBoundary}
                                </span>
                                <span className="text-[9px] font-bold uppercase tracking-[0.08em] text-slate-400">{archetypeLabel[prototype.archetype]}</span>
                            </div>
                            <h2 id={`prototype-${prototype.id}`} className="mt-2 text-xl font-extrabold tracking-tight text-slate-950 dark:text-slate-100">
                                {prototype.name}
                            </h2>
                            <p className="mt-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">Lead: {prototype.leadOffice}</p>
                        </div>
                        <div className="max-w-lg rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[10px] leading-4 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-200">
                            <div className="flex items-start gap-2">
                                <ShieldAlert size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
                                <span>{prototypeTruth}</span>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="border-b border-slate-200 px-3 pt-2 dark:border-slate-700">
                    <div role="tablist" aria-label={`${prototype.name} views`} className="flex gap-1 overflow-x-auto">
                        {prototype.tabs.map((tab) => (
                            <button
                                key={tab}
                                type="button"
                                role="tab"
                                aria-selected={activeTab === tab}
                                onClick={() => setActiveTab(tab)}
                                className={'min-h-9 shrink-0 rounded-t-lg px-3 text-[10px] font-bold transition focus:outline-none focus:ring-2 focus:ring-[var(--municipal-focus)]/30 '
                                    + (activeTab === tab
                                        ? 'border border-b-white border-slate-200 bg-white text-[var(--municipal-brand)] dark:border-slate-700 dark:border-b-[#142236] dark:bg-[#142236]'
                                        : 'text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-900/40')}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-3 p-3">
                    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                        {prototype.metrics.map((metric) => (
                            <div key={metric.label} className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900/25">
                                <div className="text-[9px] font-bold uppercase tracking-wide text-slate-400">{metric.label}</div>
                                <div className="mt-1 text-lg font-extrabold text-slate-950 dark:text-slate-100">{metric.value}</div>
                                <div className="mt-0.5 text-[10px] leading-4 text-slate-500 dark:text-slate-400">{metric.detail}</div>
                            </div>
                        ))}
                    </div>

                    {prototype.lifecycle && (
                        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-2.5 dark:border-slate-700 dark:bg-slate-900/25">
                            <div className="mb-2 flex items-center gap-2 text-[10px] font-bold text-slate-700 dark:text-slate-200">
                                <GitBranch size={13} className="text-[var(--municipal-brand)]" aria-hidden="true" />
                                Inspect workflow stage
                            </div>
                            <div className="flex gap-1.5 overflow-x-auto pb-1">
                                {prototype.lifecycle.map((stage, index) => (
                                    <button
                                        key={stage}
                                        type="button"
                                        onClick={() => setActiveStage(stage)}
                                        className={'flex min-h-9 shrink-0 items-center gap-1.5 rounded-lg border px-2.5 text-[9px] font-bold transition '
                                            + (activeStage === stage
                                                ? 'border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200'
                                                : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-200 dark:border-slate-700 dark:bg-[#142236] dark:text-slate-300')}
                                    >
                                        <span className="text-slate-400">{String(index + 1).padStart(2, '0')}</span>
                                        {stage}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {prototype.archetype === 'map' && (
                        <MapCanvas prototype={prototype} selected={mapLayer} onSelectLayer={setMapLayer} />
                    )}

                    <div className="grid gap-3 xl:grid-cols-[minmax(0,1.55fr)_minmax(18rem,.75fr)]">
                        <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
                            <div className="flex flex-col gap-2 border-b border-slate-200 bg-slate-50/60 p-2.5 dark:border-slate-700 dark:bg-slate-900/25 lg:flex-row lg:items-center lg:justify-between">
                                <div>
                                    <div className="text-[11px] font-bold text-slate-950 dark:text-slate-100">{activeTab} workspace</div>
                                    <div className="text-[9px] text-slate-500 dark:text-slate-400">Select a sample record to inspect its local detail panel.</div>
                                </div>
                                <div className="flex flex-col gap-1.5 sm:flex-row">
                                    <label className="relative min-w-[210px]">
                                        <span className="sr-only">Search illustrative records</span>
                                        <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                                        <input
                                            value={query}
                                            onChange={(event) => setQuery(event.target.value)}
                                            placeholder="Search sample records"
                                            className="min-h-8 w-full rounded-lg border border-slate-300 bg-white pl-8 pr-2 text-[10px] outline-none focus:border-[var(--municipal-brand)] focus:ring-2 focus:ring-[var(--municipal-focus)]/20 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                                        />
                                    </label>
                                    <select
                                        value={activeFilter}
                                        onChange={(event) => setActiveFilter(event.target.value)}
                                        aria-label="Prototype record filter"
                                        className="min-h-8 rounded-lg border border-slate-300 bg-white px-2 text-[10px] font-semibold text-slate-600 outline-none focus:border-[var(--municipal-brand)] dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
                                    >
                                        {prototype.filters.map((filter) => <option key={filter}>{filter}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                {visibleRecords.map((record) => (
                                    <RecordRow key={record.id} record={record} selected={selectedRecord?.id === record.id} onSelect={() => setSelectedRecordId(record.id)} />
                                ))}
                                {visibleRecords.length === 0 && (
                                    <div className="p-6 text-center text-[11px] text-slate-500 dark:text-slate-400">No illustrative records match this local filter.</div>
                                )}
                            </div>
                        </div>

                        <aside className="space-y-2.5">
                            {selectedRecord && (
                                <div className="rounded-xl border border-emerald-100 bg-emerald-50/35 p-3 dark:border-emerald-900/50 dark:bg-emerald-950/10">
                                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-emerald-800 dark:text-emerald-200">
                                        <Database size={13} aria-hidden="true" /> Selected record
                                    </div>
                                    <div className="mt-2 text-[13px] font-extrabold text-slate-950 dark:text-slate-100">{selectedRecord.title}</div>
                                    <div className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">{selectedRecord.id} · {selectedRecord.subtitle}</div>
                                    <dl className="mt-3 grid gap-2 text-[10px]">
                                        <div><dt className="text-slate-400">Owner / source</dt><dd className="font-semibold text-slate-700 dark:text-slate-200">{selectedRecord.owner}</dd></div>
                                        <div><dt className="text-slate-400">Status</dt><dd className="font-semibold text-slate-700 dark:text-slate-200">{selectedRecord.status}</dd></div>
                                        <div><dt className="text-slate-400">Stage</dt><dd className="font-semibold text-[var(--municipal-brand)]">{selectedRecord.stage}</dd></div>
                                        <div><dt className="text-slate-400">Reference</dt><dd className="font-semibold text-slate-700 dark:text-slate-200">{selectedRecord.meta}</dd></div>
                                    </dl>
                                    <p className="mt-3 rounded-lg bg-white/80 px-2.5 py-2 text-[10px] leading-4 text-slate-600 dark:bg-slate-900/45 dark:text-slate-300">{selectedRecord.note}</p>
                                </div>
                            )}

                            <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                                <div className="text-[10px] font-bold text-slate-950 dark:text-slate-100">{prototype.secondaryTitle}</div>
                                <div className="mt-2 space-y-1.5">
                                    {prototype.secondaryItems.map((item) => (
                                        <div key={item} className="rounded-lg bg-slate-50 px-2.5 py-2 text-[10px] text-slate-600 dark:bg-slate-900/40 dark:text-slate-300">{item}</div>
                                    ))}
                                </div>
                            </div>
                        </aside>
                    </div>

                    <div className="grid gap-2 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,.55fr)]">
                        <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-950 dark:text-slate-100">
                                <Network size={13} className="text-[var(--municipal-brand)]" aria-hidden="true" /> ONE TALIBON connection points
                            </div>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                                {prototype.integrationPoints.map((point) => (
                                    <span key={point} className="rounded-full bg-slate-100 px-2.5 py-1 text-[9px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{point}</span>
                                ))}
                            </div>
                        </div>
                        <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-[10px] leading-4 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-200">
                            {prototype.conservativeNote ?? 'Client-side presentation only. Tabs, filters, record selection, workflow inspection, and layer switching do not submit, persist, approve, issue, or process anything.'}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
