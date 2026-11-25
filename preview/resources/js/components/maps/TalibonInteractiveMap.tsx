import L from 'leaflet';
import { LocateFixed, Minus, Plus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { TALIBON_CENTER } from '../../data/municipal/planningMaps';

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

type Props = {
    pins: InteractiveMapPin[];
    selectedPinId?: string | null;
    onSelectPin?: (pinId: string) => void;
    showZones?: boolean;
    showHazards?: boolean;
    showRoadCorridor?: boolean;
    pickMode?: boolean;
    pickedCoords?: { lat: number; lng: number } | null;
    onPickCoords?: (coords: { lat: number; lng: number }) => void;
    heightClass?: string;
    ariaLabel?: string;
};

function makeMarkerIcon(color: string, label: string, selected: boolean) {
    color = /^#[\da-f]{3}(?:[\da-f]{3})?$/i.test(color) ? color : '#176b4a';
    label = label.replace(/[<>&"']/g, '');
    const size = selected ? 34 : 30;
    const ring = selected ? '0 0 0 4px rgba(200, 155, 60, 0.45), 0 4px 10px rgba(0,0,0,0.35)' : '0 2px 6px rgba(0,0,0,0.28)';
    return L.divIcon({
        className: 'tcds-leaflet-pin',
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
        html: `<div style="width:${size}px;height:${size}px;border-radius:9999px;background:${color};border:2.5px solid #ffffff;box-shadow:${ring};display:flex;align-items:center;justify-content:center;color:#ffffff;font-weight:800;font-size:12px;font-family:var(--font-sans);cursor:pointer;">${label}</div>`,
    });
}

const TALIBON_ROAD_CORRIDOR: [number, number][] = [
    [10.156, 124.228], // Burgos / Bagacay
    [10.148, 124.262], // Tanghaligue
    [10.142, 124.285], // Sto. Niño
    [10.144, 124.309], // San Jose
    [10.151, 124.327], // Poblacion
    [10.132, 124.329], // Balintawak
    [10.112, 124.328], // San Agustin
    [10.094, 124.325], // San Roque
];

export default function TalibonInteractiveMap({
    pins,
    selectedPinId,
    onSelectPin,
    showZones = true,
    showHazards = false,
    showRoadCorridor = true,
    pickMode = false,
    pickedCoords = null,
    onPickCoords,
    heightClass = 'h-[420px]',
    ariaLabel = 'Interactive map of Talibon, Bohol',
}: Props) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<L.Map | null>(null);
    const markersLayerRef = useRef<L.LayerGroup | null>(null);
    const overlaysLayerRef = useRef<L.LayerGroup | null>(null);
    const [mapTone, setMapTone] = useState<'night' | 'paper'>('night');

    useEffect(() => {
        if (!containerRef.current || mapRef.current) return;

        const map = L.map(containerRef.current, {
            center: [TALIBON_CENTER.lat, TALIBON_CENTER.lng],
            zoom: 12,
            zoomControl: false,
            attributionControl: true,
        });

        map.attributionControl.addAttribution('SAMPLE reference overlays - not an official GIS survey');
        overlaysLayerRef.current = L.layerGroup().addTo(map);
        markersLayerRef.current = L.layerGroup().addTo(map);
        mapRef.current = map;

        const resizeTimer = window.setTimeout(() => map.invalidateSize(), 150);

        return () => {
            window.clearTimeout(resizeTimer);
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

        if (showZones) {
            L.circle([10.151, 124.327], {
                radius: 1100,
                color: '#0e4d36',
                weight: 2,
                fillColor: '#176b4a',
                fillOpacity: 0.16,
            })
                .bindTooltip('Poblacion Urban & Institutional Core (CLUP Zone)', { sticky: true })
                .addTo(group);

            L.circle([10.135, 124.296], {
                radius: 2100,
                color: '#c89b3c',
                weight: 1.5,
                dashArray: '5 5',
                fillColor: '#c89b3c',
                fillOpacity: 0.12,
            })
                .bindTooltip('Agricultural & Agro-Industrial Band (San Carlos / Sto. Niño)', { sticky: true })
                .addTo(group);
        }

        if (showHazards) {
            L.circle([10.158, 124.322], {
                radius: 1350,
                color: '#b91c1c',
                weight: 2,
                dashArray: '6 4',
                fillColor: '#ef4444',
                fillOpacity: 0.15,
            })
                .bindTooltip('Coastal Liquefaction & Storm Surge Advisory Corridor', { sticky: true })
                .addTo(group);

            L.circle([10.105, 124.275], {
                radius: 1850,
                color: '#b45309',
                weight: 1.8,
                dashArray: '4 4',
                fillColor: '#f59e0b',
                fillOpacity: 0.14,
            })
                .bindTooltip('Upland Rain-Induced Landslide Advisory (Rizal / Magsaysay)', { sticky: true })
                .addTo(group);
        }

        if (showRoadCorridor) {
            L.polyline(TALIBON_ROAD_CORRIDOR, {
                color: '#b45309',
                weight: 3.5,
                opacity: 0.8,
            })
                .bindTooltip('Bohol Circumferential National Road (Talibon Segment)', { sticky: true })
                .addTo(group);
        }
    }, [showZones, showHazards, showRoadCorridor]);

    // Sync markers
    useEffect(() => {
        const group = markersLayerRef.current;
        const map = mapRef.current;
        if (!group || !map) return;
        group.clearLayers();

        pins.forEach((pin, idx) => {
            const isSelected = pin.id === selectedPinId;
            const shortBadge = String(idx + 1);
            const marker = L.marker([pin.lat, pin.lng], {
                icon: makeMarkerIcon(pin.color, shortBadge, isSelected),
                title: pin.title,
            });
            const tooltip = document.createElement('span');
            tooltip.textContent = `${pin.code}: ${pin.title}`;
            marker.bindTooltip(tooltip, { direction: 'top', offset: [0, -14] });
            marker.on('click', () => onSelectPin?.(pin.id));
            marker.addTo(group);
        });

        if (pickMode && pickedCoords) {
            L.marker([pickedCoords.lat, pickedCoords.lng], {
                icon: makeMarkerIcon('#c89b3c', '★', true),
                title: 'Selected map pin location',
            }).addTo(group);
        }
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
                role="application"
                aria-label={ariaLabel}
                className={`h-full w-full ${pickMode ? 'cursor-crosshair' : ''}`}
            />

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
                SAMPLE reference overlays. Offline map plates are available in the map dossier; no external tiles are requested.
            </div>
        </div>
    );
}
