import { Link } from '@inertiajs/react';
import { ArrowLeft, ArrowUpRight, Layers3 } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
    presentationEnvironmentDetail,
    presentationEnvironmentLabel,
    type FutureSystemPrototypeConfig,
} from '../../data/municipal/futureSystemPrototypeData';
import TalibonInteractiveMap, { type InteractiveMapPin } from '../maps/TalibonInteractiveMap';

type Props = {
    prototype: FutureSystemPrototypeConfig;
    onBack?: () => void;
};

const referencePositions: Record<string, { lat: number; lng: number; color: string }> = {
    'MAP-01': { lat: 10.1538, lng: 124.3234, color: '#0e4d36' },
    'MAP-02': { lat: 10.1476, lng: 124.3292, color: '#b45309' },
    'MAP-03': { lat: 10.1455, lng: 124.3218, color: '#1d4ed8' },
    'MAP-04': { lat: 10.1512, lng: 124.3271, color: '#0f766e' },
    'MAP-05': { lat: 10.1481, lng: 124.324, color: '#0e4d36' },
    'MAP-06': { lat: 10.1428, lng: 124.3188, color: '#b91c1c' },
    'MAP-07': { lat: 10.1502, lng: 124.3306, color: '#7c3aed' },
};

function layerLabel(label: string): string {
    return label === 'Government properties' ? 'Government Properties' : label;
}

export default function GISWorkspace({ prototype, onBack }: Props) {
    const layers = prototype.mapLayers ?? [];
    const [activeLayer, setActiveLayer] = useState(layers[0]?.label ?? 'Projects');
    const [selectedId, setSelectedId] = useState(layers[0]?.recordIds[0] ?? prototype.records[0]?.id ?? '');

    const activeLayerConfig = layers.find((layer) => layer.label === activeLayer) ?? layers[0];
    const activeRecords = useMemo(
        () => prototype.records.filter((record) => activeLayerConfig?.recordIds.includes(record.id)),
        [activeLayerConfig, prototype.records],
    );
    const selectedRecord = prototype.records.find((record) => record.id === selectedId) ?? activeRecords[0];

    const pins = useMemo<InteractiveMapPin[]>(
        () =>
            activeRecords.map((record) => {
                const pos = referencePositions[record.id] ?? { lat: 10.151, lng: 124.327, color: '#0e4d36' };
                return {
                    id: record.id,
                    code: record.id,
                    title: record.title,
                    subtitle: record.subtitle,
                    category: layerLabel(record.layer ?? activeLayer),
                    color: pos.color,
                    lat: pos.lat,
                    lng: pos.lng,
                };
            }),
        [activeRecords, activeLayer],
    );

    const chooseLayer = (label: string) => {
        setActiveLayer(label);
        const nextLayer = layers.find((layer) => layer.label === label);
        if (nextLayer?.recordIds[0]) setSelectedId(nextLayer.recordIds[0]);
    };

    return (
        <section className="space-y-3" aria-label="GIS / Mapping Portal workspace">
            <div className="flex flex-wrap items-center justify-between gap-2">
                {onBack && (
                    <button type="button" onClick={onBack} className="municipal-secondary-button">
                        <ArrowLeft size={15} aria-hidden="true" />
                        <span>Back to Future Integrations</span>
                    </button>
                )}
                <Link href="/planning-maps" className="municipal-primary-button">
                    <span>Open Full Planning Maps Workspace</span>
                    <ArrowUpRight size={15} aria-hidden="true" />
                </Link>
            </div>

            <header className="tcds-card px-5 py-4">
                <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                        <div className="text-xs font-bold uppercase tracking-wider text-[var(--brand-ink)]">
                            GIS / spatial reference
                        </div>
                        <h1 className="mt-0.5 text-xl font-extrabold tracking-tight text-[var(--ink-primary)]">
                            GIS / Mapping Portal
                        </h1>
                        <p className="mt-0.5 text-xs font-medium text-[var(--ink-secondary)]">
                            Planning / Engineering · Talibon, Bohol OpenStreetMap geographic reference workspace
                        </p>
                    </div>
                    <div className="shrink-0 text-left lg:text-right">
                        <span className="inline-flex rounded-full border border-[var(--status-warn-border)] bg-[var(--status-warn-bg)] px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-[var(--status-warn-fg)]">
                            {presentationEnvironmentLabel}
                        </span>
                        <div className="mt-1 text-xs text-[var(--ink-secondary)]">{presentationEnvironmentDetail}</div>
                    </div>
                </div>
            </header>

            <div className="grid gap-3 lg:grid-cols-[220px_minmax(0,1fr)_280px]">
                <aside className="tcds-card p-3">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--ink-secondary)]">
                        <Layers3 size={14} className="text-[var(--brand-ink)]" aria-hidden="true" />
                        <span>Layers</span>
                    </div>
                    <div className="mt-2.5 space-y-1">
                        {layers.map((layer) => {
                            const active = activeLayer === layer.label;
                            return (
                                <button
                                    key={layer.label}
                                    type="button"
                                    onClick={() => chooseLayer(layer.label)}
                                    className={`flex min-h-10 w-full items-center justify-between rounded-lg px-2.5 text-left text-xs font-semibold transition-colors ${
                                        active
                                            ? 'bg-[var(--brand-soft)] text-[var(--brand-ink)]'
                                            : 'text-[var(--ink-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--ink-primary)]'
                                    }`}
                                >
                                    <span>{layerLabel(layer.label)}</span>
                                    <span className="rounded-full bg-[var(--surface-card)] px-2 py-0.5 text-xs font-bold text-[var(--ink-secondary)]">
                                        {layer.recordIds.length}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    <div className="mt-4 border-t border-[var(--border-default)] pt-3">
                        <div className="text-xs font-bold uppercase tracking-wide text-[var(--ink-secondary)]">Locations in layer</div>
                        <div className="mt-2 space-y-1.5">
                            {activeRecords.map((record) => {
                                const selected = selectedRecord?.id === record.id;
                                return (
                                    <button
                                        key={record.id}
                                        type="button"
                                        onClick={() => setSelectedId(record.id)}
                                        className={`w-full rounded-lg border px-2.5 py-2 text-left transition-colors ${
                                            selected
                                                ? 'border-[var(--brand-primary)] bg-[var(--brand-soft)]'
                                                : 'border-[var(--border-default)] hover:border-[var(--brand-primary)]'
                                        }`}
                                    >
                                        <div className="font-mono text-xs font-bold text-[var(--brand-ink)]">{record.id}</div>
                                        <div className="mt-0.5 text-xs font-semibold text-[var(--ink-primary)]">{record.title}</div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </aside>

                <TalibonInteractiveMap
                    pins={pins}
                    selectedPinId={selectedRecord?.id ?? null}
                    onSelectPin={setSelectedId}
                    showZones={activeLayer.toLowerCase().includes('zoning') || activeLayer.toLowerCase().includes('project')}
                    showHazards={activeLayer.toLowerCase().includes('hazard')}
                    showRoadCorridor={activeLayer.toLowerCase().includes('road') || activeLayer.toLowerCase().includes('project')}
                    heightClass="h-[520px]"
                    ariaLabel="Interactive GIS map of Talibon, Bohol"
                />

                <aside className="tcds-card p-4">
                    <div className="text-xs font-bold uppercase tracking-wider text-[var(--ink-secondary)]">Location details</div>
                    {selectedRecord ? (
                        <div className="mt-2.5">
                            <div className="font-mono text-xs font-bold text-[var(--brand-ink)]">
                                {selectedRecord.id}
                            </div>
                            <h2 className="mt-1 text-base font-bold text-[var(--ink-primary)]">{selectedRecord.title}</h2>
                            <div className="mt-1 text-xs text-[var(--ink-secondary)]">{selectedRecord.subtitle}</div>
                            <dl className="mt-4 space-y-3 text-xs">
                                <div>
                                    <dt className="text-[var(--ink-secondary)]">Layer / category</dt>
                                    <dd className="mt-0.5 font-semibold text-[var(--ink-primary)]">{layerLabel(selectedRecord.layer ?? activeLayer)}</dd>
                                </div>
                                <div>
                                    <dt className="text-[var(--ink-secondary)]">Responsible office</dt>
                                    <dd className="mt-0.5 font-semibold text-[var(--ink-primary)]">{selectedRecord.owner}</dd>
                                </div>
                                <div>
                                    <dt className="text-[var(--ink-secondary)]">Planning / reference status</dt>
                                    <dd className="mt-0.5 font-semibold text-[var(--ink-primary)]">{selectedRecord.stage}</dd>
                                </div>
                                <div>
                                    <dt className="text-[var(--ink-secondary)]">Context</dt>
                                    <dd className="mt-0.5 leading-5 text-[var(--ink-primary)]">{selectedRecord.note}</dd>
                                </div>
                            </dl>
                            <div className="mt-4 rounded-lg border border-[var(--status-warn-border)] bg-[var(--status-warn-bg)] px-3 py-2 text-xs leading-5 text-[var(--status-warn-fg)]">
                                Reference overlay positions are indicative for municipal planning review and do not represent survey-grade cadastral coordinates.
                            </div>
                        </div>
                    ) : (
                        <div className="mt-3 text-xs text-[var(--ink-secondary)]">Select a location reference from the active layer.</div>
                    )}
                </aside>
            </div>
        </section>
    );
}
