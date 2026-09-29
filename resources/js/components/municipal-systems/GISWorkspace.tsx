import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Layers3, MapPin, RefreshCw } from 'lucide-react';
import {
    presentationEnvironmentDetail,
    presentationEnvironmentLabel,
    type FutureSystemPrototypeConfig,
    type PrototypeRecord,
} from '../../data/municipal/futureSystemPrototypeData';

type Props = {
    prototype: FutureSystemPrototypeConfig;
    onBack?: () => void;
};

type LatLng = { lat: number; lng: number };
type MapHandle = Record<string, unknown>;
type MarkerHandle = {
    setMap?: (map: null) => void;
    map?: MapHandle | null;
};

type MapsNamespace = {
    Map: new (node: HTMLElement, options: Record<string, unknown>) => MapHandle;
    Marker?: new (options: Record<string, unknown>) => MarkerHandle & { addListener?: (event: string, callback: () => void) => void };
    marker?: {
        AdvancedMarkerElement?: new (options: Record<string, unknown>) => MarkerHandle & { addListener?: (event: string, callback: () => void) => void };
    };
};

type GoogleWindow = Window & {
    google?: { maps?: MapsNamespace };
    gm_authFailure?: () => void;
};

const TALIBON_CENTER: LatLng = { lat: 10.1491667, lng: 124.325 };
const MAP_SCRIPT_ID = 'one-talibon-google-maps';

const referencePositions: Record<string, LatLng> = {
    'MAP-01': { lat: 10.1538, lng: 124.3234 },
    'MAP-02': { lat: 10.1476, lng: 124.3292 },
    'MAP-03': { lat: 10.1455, lng: 124.3218 },
    'MAP-04': { lat: 10.1512, lng: 124.3271 },
    'MAP-05': { lat: 10.1481, lng: 124.324 },
    'MAP-06': { lat: 10.1428, lng: 124.3188 },
    'MAP-07': { lat: 10.1502, lng: 124.3306 },
};

function loadGoogleMaps(apiKey: string): Promise<MapsNamespace> {
    return new Promise((resolve, reject) => {
        const host = window as GoogleWindow;
        if (host.google?.maps) {
            resolve(host.google.maps);
            return;
        }
        if (!apiKey) {
            reject(new Error('missing-key'));
            return;
        }

        const existing = document.getElementById(MAP_SCRIPT_ID);
        if (existing) existing.remove();

        const previousAuthFailure = host.gm_authFailure;
        let settled = false;
        let timeout = 0;
        const finish = (callback: () => void) => {
            if (settled) return;
            settled = true;
            window.clearTimeout(timeout);
            host.gm_authFailure = previousAuthFailure;
            callback();
        };

        host.gm_authFailure = () => finish(() => reject(new Error('auth-failure')));

        const script = document.createElement('script');
        script.id = MAP_SCRIPT_ID;
        script.async = true;
        script.defer = true;
        script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&v=weekly&libraries=marker`;
        script.onload = () => finish(() => {
            if (host.google?.maps) resolve(host.google.maps);
            else reject(new Error('maps-unavailable'));
        });
        script.onerror = () => finish(() => reject(new Error('network-failure')));
        document.head.appendChild(script);

        timeout = window.setTimeout(() => finish(() => reject(new Error('timeout'))), 12000);
    });
}

function clearMarkers(markers: MarkerHandle[]) {
    markers.forEach((marker) => {
        if (marker.setMap) marker.setMap(null);
        else if ('map' in marker) marker.map = null;
    });
}

function layerLabel(label: string): string {
    return label === 'Government properties' ? 'Government Properties' : label;
}

export default function GISWorkspace({ prototype, onBack }: Props) {
    const layers = prototype.mapLayers ?? [];
    const [activeLayer, setActiveLayer] = useState(layers[0]?.label ?? 'Projects');
    const [selectedId, setSelectedId] = useState(layers[0]?.recordIds[0] ?? prototype.records[0]?.id ?? '');
    const [mapState, setMapState] = useState<'loading' | 'ready' | 'error'>('loading');
    const [attempt, setAttempt] = useState(0);
    const mapNodeRef = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<MapHandle | null>(null);
    const mapsRef = useRef<MapsNamespace | null>(null);
    const markerHandlesRef = useRef<MarkerHandle[]>([]);

    const activeLayerConfig = layers.find((layer) => layer.label === activeLayer) ?? layers[0];
    const activeRecords = useMemo(
        () => prototype.records.filter((record) => activeLayerConfig?.recordIds.includes(record.id)),
        [activeLayerConfig, prototype.records],
    );
    const selectedRecord = prototype.records.find((record) => record.id === selectedId) ?? activeRecords[0];

    useEffect(() => {
        const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? '';
        const mapId = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID ?? '';
        let cancelled = false;
        setMapState('loading');

        loadGoogleMaps(apiKey)
            .then((maps) => {
                if (cancelled || !mapNodeRef.current) return;
                mapsRef.current = maps;
                const options: Record<string, unknown> = {
                    center: TALIBON_CENTER,
                    zoom: 14,
                    mapTypeControl: false,
                    fullscreenControl: true,
                    streetViewControl: false,
                    clickableIcons: true,
                    gestureHandling: 'greedy',
                };
                if (mapId) options.mapId = mapId;
                mapRef.current = new maps.Map(mapNodeRef.current, options);
                setMapState('ready');
            })
            .catch(() => {
                if (!cancelled) setMapState('error');
            });

        return () => {
            cancelled = true;
            clearMarkers(markerHandlesRef.current);
            markerHandlesRef.current = [];
        };
    }, [attempt]);

    useEffect(() => {
        if (mapState !== 'ready' || !mapRef.current || !mapsRef.current) return;
        const maps = mapsRef.current;
        const map = mapRef.current;
        const mapId = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID ?? '';

        clearMarkers(markerHandlesRef.current);
        markerHandlesRef.current = [];

        activeRecords.forEach((record) => {
            const position = referencePositions[record.id] ?? TALIBON_CENTER;
            const selectRecord = () => setSelectedId(record.id);
            let marker: MarkerHandle & { addListener?: (event: string, callback: () => void) => void } | undefined;

            if (mapId && maps.marker?.AdvancedMarkerElement) {
                const pin = document.createElement('button');
                pin.type = 'button';
                pin.className = 'flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-[#0d6b4f] text-[9px] font-extrabold text-white shadow-md';
                pin.textContent = record.id.replace('MAP-', '');
                marker = new maps.marker.AdvancedMarkerElement({ map, position, title: record.title, content: pin });
                pin.addEventListener('click', selectRecord);
            } else if (maps.Marker) {
                marker = new maps.Marker({ map, position, title: record.title });
                marker.addListener?.('click', selectRecord);
            }

            if (marker) markerHandlesRef.current.push(marker);
        });
    }, [activeRecords, mapState]);

    const chooseLayer = (label: string) => {
        setActiveLayer(label);
        const nextLayer = layers.find((layer) => layer.label === label);
        if (nextLayer?.recordIds[0]) setSelectedId(nextLayer.recordIds[0]);
    };

    return (
        <section className="space-y-2.5" aria-label="GIS / Mapping Portal workspace">
            {onBack && (
                <button type="button" onClick={onBack} className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-bold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[var(--municipal-focus)]/30 dark:border-slate-700 dark:bg-[#142236] dark:text-slate-200">
                    <ArrowLeft size={14} aria-hidden="true" /> Back to Future Integrations
                </button>
            )}

            <header className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 dark:border-slate-700 dark:bg-[#142236]">
                <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                        <div className="text-[9px] font-extrabold uppercase tracking-[0.1em] text-emerald-700 dark:text-emerald-300">GIS / spatial reference</div>
                        <h1 className="mt-0.5 text-[21px] font-extrabold tracking-tight text-slate-950 dark:text-slate-100">GIS / Mapping Portal</h1>
                        <p className="mt-0.5 text-[10px] font-semibold text-slate-500 dark:text-slate-400">Planning / Engineering · Talibon, Bohol geographic reference workspace</p>
                    </div>
                    <div className="shrink-0 text-left lg:text-right">
                        <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[8px] font-extrabold uppercase tracking-[0.08em] text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-200">{presentationEnvironmentLabel}</span>
                        <div className="mt-1 text-[9px] font-semibold text-slate-400">{presentationEnvironmentDetail}</div>
                    </div>
                </div>
            </header>

            <div className="grid gap-2 xl:grid-cols-[210px_minmax(0,1fr)_280px]">
                <aside className="rounded-xl border border-slate-200 bg-white p-2.5 dark:border-slate-700 dark:bg-[#142236]">
                    <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.08em] text-slate-500"><Layers3 size={13} className="text-[var(--municipal-brand)]" aria-hidden="true" /> Layers</div>
                    <div className="mt-2 space-y-1">
                        {layers.map((layer) => (
                            <button key={layer.label} type="button" onClick={() => chooseLayer(layer.label)} className={'flex min-h-9 w-full items-center justify-between rounded-lg px-2.5 text-left text-[10px] font-semibold transition ' + (activeLayer === layer.label ? 'bg-emerald-50 text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200' : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900/40')}>
                                <span>{layerLabel(layer.label)}</span><span className="rounded-full bg-white px-1.5 py-0.5 text-[8px] text-slate-500 dark:bg-slate-800 dark:text-slate-300">{layer.recordIds.length}</span>
                            </button>
                        ))}
                    </div>
                    <div className="mt-3 border-t border-slate-100 pt-3 dark:border-slate-700">
                        <div className="text-[9px] font-bold uppercase tracking-wide text-slate-400">Locations in layer</div>
                        <div className="mt-1.5 space-y-1">
                            {activeRecords.map((record) => (
                                <button key={record.id} type="button" onClick={() => setSelectedId(record.id)} className={'w-full rounded-lg border px-2 py-2 text-left transition ' + (selectedRecord?.id === record.id ? 'border-emerald-200 bg-emerald-50/60 dark:border-emerald-900/60 dark:bg-emerald-950/20' : 'border-slate-200 hover:border-emerald-200 dark:border-slate-700')}>
                                    <div className="text-[8px] font-extrabold uppercase tracking-wide text-slate-400">{record.id}</div>
                                    <div className="mt-0.5 text-[9px] font-bold text-slate-700 dark:text-slate-200">{record.title}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                </aside>

                <div className="relative min-h-[480px] overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-900" style={{ height: '68vh', maxHeight: '760px' }}>
                    <div ref={mapNodeRef} className="absolute inset-0" aria-label="Google map focused on Talibon, Bohol" />
                    {mapState === 'loading' && (
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-50/90 dark:bg-slate-900/90">
                            <div className="text-center"><RefreshCw size={22} className="mx-auto animate-spin text-[var(--municipal-brand)]" aria-hidden="true" /><div className="mt-2 text-[11px] font-bold text-slate-700 dark:text-slate-200">Loading Talibon map…</div></div>
                        </div>
                    )}
                    {mapState === 'error' && (
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-50 dark:bg-slate-900">
                            <div className="max-w-sm px-5 text-center">
                                <MapPin size={26} className="mx-auto text-slate-400" aria-hidden="true" />
                                <div className="mt-3 text-[12px] font-extrabold uppercase tracking-[0.08em] text-slate-700 dark:text-slate-200">Map temporarily unavailable</div>
                                <p className="mt-2 text-[10px] leading-4 text-slate-500 dark:text-slate-400">Google Maps could not initialize in this environment. Layer controls, location references and the selected-location inspector remain available.</p>
                                <button type="button" onClick={() => setAttempt((value) => value + 1)} className="mt-3 min-h-9 rounded-lg border border-slate-300 bg-white px-3 text-[10px] font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-[#142236] dark:text-slate-200">Retry map</button>
                            </div>
                        </div>
                    )}
                    <div className="pointer-events-none absolute left-3 top-3 rounded-lg border border-slate-200 bg-white/92 px-3 py-2 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/90">
                        <div className="text-[8px] font-extrabold uppercase tracking-[0.08em] text-slate-400">Talibon, Bohol</div>
                        <div className="mt-0.5 text-[10px] font-bold text-slate-700 dark:text-slate-200">{layerLabel(activeLayer)} layer · {activeRecords.length} reference location{activeRecords.length === 1 ? '' : 's'}</div>
                    </div>
                </div>

                <aside className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-[#142236]">
                    <div className="text-[9px] font-extrabold uppercase tracking-[0.08em] text-slate-400">Location details</div>
                    {selectedRecord ? (
                        <div className="mt-2">
                            <div className="text-[10px] font-extrabold text-[var(--municipal-brand)]">{selectedRecord.id}</div>
                            <h2 className="mt-0.5 text-[14px] font-extrabold text-slate-950 dark:text-slate-100">{selectedRecord.title}</h2>
                            <div className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">{selectedRecord.subtitle}</div>
                            <dl className="mt-4 space-y-3 text-[10px]">
                                <div><dt className="text-slate-400">Layer / category</dt><dd className="mt-0.5 font-semibold text-slate-700 dark:text-slate-200">{layerLabel(selectedRecord.layer ?? activeLayer)}</dd></div>
                                <div><dt className="text-slate-400">Responsible office</dt><dd className="mt-0.5 font-semibold text-slate-700 dark:text-slate-200">{selectedRecord.owner}</dd></div>
                                <div><dt className="text-slate-400">Planning / reference status</dt><dd className="mt-0.5 font-semibold text-slate-700 dark:text-slate-200">{selectedRecord.stage}</dd></div>
                                <div><dt className="text-slate-400">Context</dt><dd className="mt-0.5 font-semibold leading-4 text-slate-700 dark:text-slate-200">{selectedRecord.note}</dd></div>
                            </dl>
                            <div className="mt-4 rounded-lg border border-amber-100 bg-amber-50/70 px-2.5 py-2 text-[9px] leading-4 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200">Reference overlay positions are approximate for presentation review and do not represent survey-grade or authoritative municipal coordinates.</div>
                        </div>
                    ) : <div className="mt-3 text-[10px] text-slate-500">Select a location reference from the active layer.</div>}
                </aside>
            </div>
        </section>
    );
}
