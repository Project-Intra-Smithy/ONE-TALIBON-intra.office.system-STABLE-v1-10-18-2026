import { useCallback } from 'react';
import L from 'leaflet';
import InteractiveReferenceMap, { type InteractiveMapProps } from '../../../../../resources/js/components/maps/InteractiveReferenceMap';
export type { InteractiveMapPin } from '../../../../../resources/js/components/maps/InteractiveReferenceMap';
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

export default function TalibonInteractiveMap({ showZones = true, showHazards = false, showRoadCorridor = true, ...props }: InteractiveMapProps & { showZones?: boolean; showHazards?: boolean; showRoadCorridor?: boolean }) {
    const renderOverlays = useCallback((group: L.LayerGroup) => {
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
    return <InteractiveReferenceMap {...props} renderOverlays={renderOverlays} disclosure="Sample reference overlays. Offline plates are available in the map dossier." />;
}
