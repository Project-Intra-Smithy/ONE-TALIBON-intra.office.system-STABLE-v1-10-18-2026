import { Download, MapPin, Printer, ZoomIn, ZoomOut } from 'lucide-react';
import { useState } from 'react';
import { PLANNING_MAP_CATEGORY_META, type PlanningMapRecord } from '../../data/municipal/planningMaps';
import { formatDatePH } from '../../lib/format';
import { Dialog, StatusBadge } from '../ui';

type Props = {
    map: PlanningMapRecord | null;
    onClose: () => void;
};

const ZOOM_STEPS = [100, 135, 175, 225] as const;

export default function PlanningMapPlateModal({ map, onClose }: Props) {
    const [zoomIndex, setZoomIndex] = useState(0);
    const [plateView, setPlateView] = useState<'night' | 'paper'>('night');
    const zoom = ZOOM_STEPS[zoomIndex];

    if (!map) return null;
    const cat = PLANNING_MAP_CATEGORY_META[map.category];

    return (
        <Dialog
            open={Boolean(map)}
            onClose={() => {
                setZoomIndex(0);
                onClose();
            }}
            size="xl"
            title={map.title}
            description={`${map.code} · ${cat.label} · ${map.effectivePeriod}`}
            footer={
                <>
                    <div className="mr-auto flex items-center gap-1.5">
                        <button
                            type="button"
                            onClick={() => setZoomIndex((i) => Math.max(0, i - 1))}
                            disabled={zoomIndex === 0}
                            aria-label="Zoom out map plate"
                            className="municipal-secondary-button px-3 disabled:opacity-50"
                        >
                            <ZoomOut size={15} aria-hidden="true" />
                        </button>
                        <span className="min-w-12 text-center font-mono text-xs font-bold text-[var(--ink-primary)]">{zoom}%</span>
                        <button
                            type="button"
                            onClick={() => setZoomIndex((i) => Math.min(ZOOM_STEPS.length - 1, i + 1))}
                            disabled={zoomIndex === ZOOM_STEPS.length - 1}
                            aria-label="Zoom in map plate"
                            className="municipal-secondary-button px-3 disabled:opacity-50"
                        >
                            <ZoomIn size={15} aria-hidden="true" />
                        </button>
                    </div>
                    <button type="button" onClick={() => window.print()} className="municipal-secondary-button">
                        <Printer size={15} aria-hidden="true" />
                        <span>Print Plate</span>
                    </button>
                    <a
                        href={map.imageUrl}
                        download={`${map.code.toLowerCase()}.jpg`}
                        className="municipal-primary-button"
                    >
                        <Download size={15} aria-hidden="true" />
                        <span>Download Image</span>
                    </a>
                </>
            }
        >
            <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge tone={map.status === 'published' ? 'ok' : map.status === 'draft' ? 'warn' : 'neutral'}>
                            {map.status === 'published' ? 'Published · All LGU Staff' : map.status === 'draft' ? 'Draft · MPDC Only' : 'Archived'}
                        </StatusBadge>
                        <StatusBadge tone={cat.tone}>{cat.label}</StatusBadge>
                        {map.isPlaceholder && (
                            <StatusBadge tone="neutral">Reference Map Plate</StatusBadge>
                        )}
                    </div>
                    <div
                        role="group"
                        aria-label="Plate viewing surface"
                        className="hidden items-center rounded-lg border border-[var(--border-default)] bg-[var(--surface-recessed)] p-0.5 dark:inline-flex"
                    >
                        <button
                            type="button"
                            aria-pressed={plateView === 'night'}
                            onClick={() => setPlateView('night')}
                            className={`min-h-8 rounded-md px-2.5 text-xs font-semibold transition-colors ${
                                plateView === 'night'
                                    ? 'bg-[var(--brand-primary)] text-white'
                                    : 'text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]'
                            }`}
                        >
                            Night Mat
                        </button>
                        <button
                            type="button"
                            aria-pressed={plateView === 'paper'}
                            onClick={() => setPlateView('paper')}
                            className={`min-h-8 rounded-md px-2.5 text-xs font-semibold transition-colors ${
                                plateView === 'paper'
                                    ? 'bg-[var(--brand-primary)] text-white'
                                    : 'text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]'
                            }`}
                        >
                            Paper Print
                        </button>
                    </div>
                </div>

                <div
                    tabIndex={0}
                    role="region"
                    aria-label={`Scrollable map preview for ${map.title}`}
                    className={`max-h-[58dvh] overflow-auto rounded-xl border border-[var(--border-default)] p-3 ${
                        plateView === 'paper' ? 'tcds-paper-surface' : 'bg-[var(--surface-recessed)]'
                    }`}
                >
                    <img
                        src={map.imageUrl}
                        alt={`${map.title} (${map.code}) cartographic reference plate for Talibon, Bohol`}
                        style={{ width: `${zoom}%`, maxWidth: 'none' }}
                        className={`mx-auto block rounded-lg transition-[width,filter] duration-150 ${
                            plateView === 'paper' ? 'bg-white' : 'tcds-plate-thumb'
                        }`}
                    />
                </div>

                <p className="text-sm leading-6 text-[var(--ink-primary)]">{map.description}</p>

                <dl className="grid gap-3 rounded-xl border border-[var(--border-default)] bg-[var(--surface-recessed)] p-4 text-xs sm:grid-cols-2">
                    <div>
                        <dt className="font-bold uppercase tracking-wide text-[var(--ink-secondary)]">Covered Barangays</dt>
                        <dd className="mt-1 font-semibold text-[var(--ink-primary)]">{map.barangays.join(', ')}</dd>
                    </div>
                    <div>
                        <dt className="font-bold uppercase tracking-wide text-[var(--ink-secondary)]">Authority / Reference</dt>
                        <dd className="mt-1 font-semibold text-[var(--ink-primary)]">{map.authority}</dd>
                    </div>
                    <div>
                        <dt className="font-bold uppercase tracking-wide text-[var(--ink-secondary)]">Scale &amp; Projection</dt>
                        <dd className="mt-1 font-mono font-semibold text-[var(--ink-primary)]">{map.scale} · {map.projection}</dd>
                    </div>
                    <div>
                        <dt className="font-bold uppercase tracking-wide text-[var(--ink-secondary)]">Map Pin Coordinates</dt>
                        <dd className="mt-1 inline-flex items-center gap-1 font-mono font-semibold text-[var(--ink-primary)]">
                            <MapPin size={13} aria-hidden="true" className="text-[var(--brand-ink)]" />
                            <span>{map.lat.toFixed(4)}° N, {map.lng.toFixed(4)}° E</span>
                        </dd>
                    </div>
                    <div className="sm:col-span-2">
                        <dt className="font-bold uppercase tracking-wide text-[var(--ink-secondary)]">Legend &amp; Notes</dt>
                        <dd className="mt-1 leading-5 text-[var(--ink-primary)]">{map.legendNotes}</dd>
                    </div>
                    <div className="sm:col-span-2">
                        <dt className="font-bold uppercase tracking-wide text-[var(--ink-secondary)]">Source Attribution &amp; Last Update</dt>
                        <dd className="mt-1 text-[var(--ink-secondary)]">
                            {map.sourceAttribution} · Updated {formatDatePH(map.updatedAt)} by {map.updatedBy}
                        </dd>
                    </div>
                </dl>
            </div>
        </Dialog>
    );
}
