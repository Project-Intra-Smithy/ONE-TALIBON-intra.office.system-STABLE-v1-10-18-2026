import { groupMapPins } from './groupMapPins';
import L from 'leaflet';
import { Dialog } from '../ui/Dialog';
import { LocateFixed, Minus, Plus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';

const TALIBON_CENTER = { lat: 10.151, lng: 124.327 };

export type InteractiveMapPin = {
    id: string;
    code: string;
    title: string;
    subtitle?: string;
    category: string;
    color: string;
    lat: number;
    lng: number;
};

export type InteractiveMapProps = {
    pins: InteractiveMapPin[];
    selectedPinId?: string | null;
    onSelectPin?: (pinId: string) => void;
    renderOverlays?: (group: L.LayerGroup) => void;
    disclosure?: string;
    pickMode?: boolean;
    pickedCoords?: { lat: number; lng: number } | null;
    onPickCoords?: (coords: { lat: number; lng: number }) => void;
    heightClass?: string;
    ariaLabel?: string;
};

function makeMarkerIcon(color: string, label: string, selected: boolean) {
    color = /^#[\da-f]{3}(?:[\da-f]{3})?$/i.test(color) ? color : '#176b4a';
    label = label.replace(/[<>&"']/g, '');
    const size = 44;
    const ring = selected ? '0 0 0 4px rgba(200, 155, 60, 0.45), 0 4px 10px rgba(0,0,0,0.35)' : '0 2px 6px rgba(0,0,0,0.28)';
    return L.divIcon({
        className: 'tcds-leaflet-pin',
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
        html: `<div style="width:${size}px;height:${size}px;border-radius:9999px;background:${color};border:2.5px solid #ffffff;box-shadow:${ring};display:flex;align-items:center;justify-content:center;color:#ffffff;font-weight:800;font-size:12px;font-family:var(--font-sans);cursor:pointer;">${label}</div>`,
    });
}

export default function InteractiveReferenceMap({
    pins,
    selectedPinId,
    onSelectPin,
    renderOverlays,
    disclosure = "Reference coordinates only. No official GIS layers are displayed.",
    pickMode = false,
    pickedCoords = null,
    onPickCoords,
    heightClass = 'h-[420px]',
    ariaLabel = 'Interactive map of Talibon, Bohol',
}: InteractiveMapProps) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<L.Map | null>(null);
    const markersLayerRef = useRef<L.LayerGroup | null>(null);
    const overlaysLayerRef = useRef<L.LayerGroup | null>(null);
    const [openCluster, setOpenCluster] = useState<InteractiveMapPin[] | null>(null);
    const clusterTriggerRef = useRef<HTMLElement | null>(null);
    const closeCluster = () => { setOpenCluster(null); requestAnimationFrame(() => clusterTriggerRef.current?.focus({ preventScroll: true })); };
    const [mapTone, setMapTone] = useState<'night' | 'paper'>('night');

    useEffect(() => {
        if (!containerRef.current || mapRef.current) return;

        const map = L.map(containerRef.current, {
            center: [TALIBON_CENTER.lat, TALIBON_CENTER.lng],
            zoom: 12,
            zoomControl: false,
            attributionControl: true,
        });

        map.attributionControl.addAttribution('Offline reference coordinates');
        overlaysLayerRef.current = L.layerGroup().addTo(map);
        markersLayerRef.current = L.layerGroup().addTo(map);
        mapRef.current = map;

        const resizeObserver = new ResizeObserver(() => map.invalidateSize({ pan: false }));
        resizeObserver.observe(containerRef.current);

        return () => {
            resizeObserver.disconnect();
            map.remove();
            mapRef.current = null;
            markersLayerRef.current = null;
            overlaysLayerRef.current = null;
        };
    }, []);

    // Coordinate pick mode listener
    useEffect(() => {
        const map = mapRef.current;
        if (!map || !pickMode || !onPickCoords) return;

        const onClick = (event: L.LeafletMouseEvent) => {
            onPickCoords({
                lat: Number(event.latlng.lat.toFixed(5)),
                lng: Number(event.latlng.lng.toFixed(5)),
            });
        };
        map.on('click', onClick);
        return () => {
            map.off('click', onClick);
        };
    }, [pickMode, onPickCoords]);

    // Vector reference overlays (CLUP zones, DRRM hazard belts, National Road corridor)
    useEffect(() => {
        const group = overlaysLayerRef.current;
        if (!group) return;
        group.clearLayers();

        renderOverlays?.(group);
    }, [renderOverlays]);

    // Sync markers
    useEffect(() => {
        const group = markersLayerRef.current;
        const map = mapRef.current;
        if (!group || !map) return;
        const renderMarkers = () => {
            group.clearLayers();
            groupMapPins(pins, pin => map.latLngToContainerPoint([pin.lat, pin.lng])).forEach(cluster => {
                const pin = cluster[0];
                const selected = cluster.some(item => item.id === selectedPinId);
                const markerLabel = cluster.length > 1 ? `Select from ${cluster.length} nearby map references` : `${pin.code}: ${pin.title}`;
                const marker = L.marker([pin.lat, pin.lng], {
                    icon: makeMarkerIcon(pin.color, cluster.length > 1 ? String(cluster.length) : String(pins.indexOf(pin) + 1), selected),
                    title: markerLabel,
                }).addTo(group);
                marker.getElement()?.setAttribute('aria-label', markerLabel);
                const tooltip = document.createElement('span');
                tooltip.textContent = cluster.length > 1 ? `${cluster.length} nearby references — open to select` : `${pin.code}: ${pin.title}`;
                marker.bindTooltip(tooltip, { direction: 'top', offset: [0, -22] });
                if (cluster.length === 1) marker.on('click', () => onSelectPin?.(pin.id));
                else marker.on('click', () => { clusterTriggerRef.current = marker.getElement() ?? null; setOpenCluster(cluster); });
            });
            if (pickMode && pickedCoords) L.marker([pickedCoords.lat, pickedCoords.lng], {
                icon: makeMarkerIcon('#c89b3c', '★', true), title: 'Selected map pin location', interactive: false, keyboard: false,
            }).addTo(group);
        };
        renderMarkers();
        map.on('zoomend', renderMarkers);
        return () => { map.off('zoomend', renderMarkers); group.clearLayers(); };
    }, [pins, selectedPinId, onSelectPin, pickMode, pickedCoords]);

    // Pan softly when selected pin changes
    useEffect(() => {
        const map = mapRef.current;
        if (!map || !selectedPinId) return;
        const active = pins.find((p) => p.id === selectedPinId);
        if (active) {
            map.panTo([active.lat, active.lng], { animate: true, duration: 0.45 });
        }
    }, [selectedPinId, pins]);

    return (
        <div
            className={`isolate relative w-full overflow-hidden rounded-xl border border-[var(--border-default)] bg-[var(--surface-recessed)] ${
                mapTone === 'night' ? 'tcds-map-night' : 'tcds-map-paper'
            } ${heightClass}`}
        >
            <div
                ref={containerRef}
                tabIndex={0}
                role="application"
                aria-label={ariaLabel}
                className={`h-full w-full ${pickMode ? 'cursor-crosshair' : ''}`}
            />

            <Dialog open={Boolean(openCluster)} onClose={closeCluster} title="Nearby map references" description="Choose a reference to inspect its recorded metadata.">
                <ul aria-label="Nearby reference records" className="divide-y divide-[var(--border-default)]">
                    {openCluster?.map((pin, index) => <li key={pin.id}><button type="button" autoFocus={index === 0}
                        onClick={() => { setOpenCluster(null); onSelectPin?.(pin.id); requestAnimationFrame(() => containerRef.current?.focus({ preventScroll: true })); }}
                        className="min-h-11 w-full break-words px-2 py-3 text-left text-sm font-semibold text-[var(--ink-primary)] hover:bg-[var(--surface-hover)]">{pin.code} — {pin.title}</button></li>)}
                </ul>
            </Dialog>

            {/* Dark-mode cartographic tone switch (Night dark-cartography vs Paper daylight OSM) */}
            <div
                role="group"
                aria-label="Map tile tone"
                className="absolute left-3 top-3 z-[400] hidden items-center rounded-lg border border-[var(--border-elevated)] bg-[var(--surface-elevated)]/95 p-0.5 shadow-sm backdrop-blur dark:inline-flex"
            >
                <button
                    type="button"
                    aria-pressed={mapTone === 'paper'}
                    onClick={() => setMapTone('paper')}
                    className={`min-h-8 rounded-md px-2.5 text-xs font-semibold transition-colors ${
                        mapTone === 'paper'
                            ? 'bg-[var(--brand-primary)] text-white'
                            : 'text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]'
                    }`}
                >
                    Paper
                </button>
                <button
                    type="button"
                    aria-pressed={mapTone === 'night'}
                    onClick={() => setMapTone('night')}
                    className={`min-h-8 rounded-md px-2.5 text-xs font-semibold transition-colors ${
                        mapTone === 'night'
                            ? 'bg-[var(--brand-primary)] text-white'
                            : 'text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]'
                    }`}
                >
                    Night
                </button>
            </div>

            {/* Accessible map zoom & recenter controls */}
            <div className="absolute right-3 top-3 z-[400] flex flex-col gap-1.5">
                <button
                    type="button"
                    onClick={() => mapRef.current?.zoomIn()}
                    aria-label="Zoom in map"
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--border-elevated)] bg-[var(--surface-elevated)] text-[var(--ink-primary)] shadow-sm transition-colors hover:bg-[var(--surface-hover)]"
                >
                    <Plus size={16} aria-hidden="true" />
                </button>
                <button
                    type="button"
                    onClick={() => mapRef.current?.zoomOut()}
                    aria-label="Zoom out map"
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--border-elevated)] bg-[var(--surface-elevated)] text-[var(--ink-primary)] shadow-sm transition-colors hover:bg-[var(--surface-hover)]"
                >
                    <Minus size={16} aria-hidden="true" />
                </button>
                <button
                    type="button"
                    onClick={() => mapRef.current?.setView([TALIBON_CENTER.lat, TALIBON_CENTER.lng], 12)}
                    aria-label="Center map on Talibon, Bohol"
                    title="Center on Talibon, Bohol"
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--border-elevated)] bg-[var(--surface-elevated)] text-[var(--ink-primary)] shadow-sm transition-colors hover:bg-[var(--surface-hover)]"
                >
                    <LocateFixed size={16} aria-hidden="true" />
                </button>
            </div>

            {/* Coordinate & municipality badge */}
            <div className="pointer-events-none absolute bottom-3 left-3 z-[400] rounded-lg border border-[var(--border-elevated)] bg-[var(--surface-elevated)]/95 px-3 py-1.5 text-xs shadow-sm backdrop-blur">
                <span className="font-bold text-[var(--ink-primary)]">Talibon, Bohol</span>
                <span className="mx-1.5 text-[var(--ink-secondary)]">·</span>
                <span className="font-mono text-[var(--ink-secondary)]">10.151° N, 124.327° E</span>
                <span className="mx-1.5 text-[var(--ink-secondary)]">·</span>
                <span className="text-[var(--ink-secondary)]">25 Barangays</span>
            </div>

            <div className="pointer-events-none absolute left-3 top-14 z-[400] max-w-xs rounded-lg bg-[var(--surface-elevated)] px-3 py-2 text-xs text-[var(--ink-primary)]">
                {disclosure}
            </div>
        </div>
    );
}
