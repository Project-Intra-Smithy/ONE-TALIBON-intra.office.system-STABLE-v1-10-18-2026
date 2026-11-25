import InteractiveReferenceMap from '../../components/maps/InteractiveReferenceMap';
import { Link, router } from '@inertiajs/react';
import { BookOpen, Compass, Layers, Map, MapPin, Plus } from 'lucide-react';
import { type FormEvent, useMemo, useState } from 'react';
import PageFrame from '../../components/PageFrame';
import PageHeader from '../../components/PageHeader';
import SupportingDocsPanel, {
    type ServerPlanningAttachment,
} from '../../components/planning/SupportingDocsPanel';
import Button from '../../components/ui/Button';
import Dialog from '../../components/ui/Dialog';
import AppLayout from '../../layouts/AppLayout';
import type { PlanningPermissions } from '../Plans/Index';

export type ServerPlanningMap = {
    id: string;
    dbId: number;
    code: string;
    title: string;
    category: string;
    planCode: string;
    scale: string;
    crs: string;
    coverage: string;
    updatedYear: number;
    status: string;
    provenanceStatus: string;
    summary: string;
    centerLat: number;
    centerLng: number;
    defaultZoom: number;
    barangays: string[];
    relatedPlanCodes: string[];
    relatedPpaCodes: string[];
};

type Props = {
    planningMaps?: ServerPlanningMap[];
    attachments?: ServerPlanningAttachment[];
    planningPermissions?: PlanningPermissions;
};

const categories = [
    'All',
    'Macro & Spatial',
    'Hazard & DRRM',
    'Infrastructure & Utilities',
    'Social & Economic',
    'Environment & Coastal',
];

export default function PlanningMapsIndex({
    planningMaps = [],
    attachments = [],
    planningPermissions,
}: Props) {
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedMapCode, setSelectedMapCode] = useState<string | null>(
        planningMaps[0]?.code ?? null,
    );
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [mapCode, setMapCode] = useState('');
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('Macro & Spatial');
    const [planCode, setPlanCode] = useState('CLUP 2020–2029');
    const [scale, setScale] = useState('1:25,000');
    const [crs, setCrs] = useState('PRS92 / Luzon 1911');
    const [coverage, setCoverage] = useState('Municipality-wide (25 Barangays)');
    const [status, setStatus] = useState('For Review');
    const [summary, setSummary] = useState('');
    const [barangaysInput, setBarangaysInput] = useState('Poblacion, San Jose');
    const [busy, setBusy] = useState(false);

    const filteredMaps = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        return planningMaps.filter((map) => {
            const matchesCategory =
                selectedCategory === 'All' || map.category === selectedCategory;
            const searchable = [
                map.code,
                map.title,
                map.category,
                map.planCode,
                map.coverage,
                ...(map.barangays ?? []),
            ]
                .join(' ')
                .toLowerCase();
            return matchesCategory && (!query || searchable.includes(query));
        });
    }, [planningMaps, selectedCategory, searchQuery]);

    const selectedMap =
        filteredMaps.find((m) => m.code === selectedMapCode) ?? filteredMaps[0] ?? null;

    const handleCreateMap = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!mapCode.trim() || !title.trim() || busy) return;
        setBusy(true);

        const barangays = barangaysInput
            .split(',')
            .map((b) => b.trim())
            .filter(Boolean);

        router.post(
            '/planning-maps',
            {
                map_code: mapCode.trim(),
                title: title.trim(),
                category,
                plan_code: planCode.trim(),
                scale: scale.trim() || '1:25,000',
                crs: crs.trim() || 'PRS92 / Luzon 1911',
                coverage: coverage.trim() || 'Municipality-wide (25 Barangays)',
                status,
                summary: summary.trim() || undefined,
                barangays,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setMapCode('');
                    setTitle('');
                    setSummary('');
                    setShowCreateModal(false);
                },
                onFinish: () => setBusy(false),
            },
        );
    };

    const [expandedPlateCode, setExpandedPlateCode] = useState<string | null>(null);
    const referencePlate = (idPrefix: string) => selectedMap ? (
        <svg
            viewBox="0 0 640 260"
            role="img"
            aria-label={`Illustrative spatial reference diagram for ${selectedMap.title}`}
            className="h-56 w-full rounded-lg border border-slate-700 bg-[#0d1f2d]"
        >
            <defs>
                <pattern
                    id={idPrefix + "talibon-grid"}
                    width="40"
                    height="40"
                    patternUnits="userSpaceOnUse"
                >
                    <path
                        d="M 40 0 L 0 0 0 40"
                        fill="none"
                        stroke="rgba(148, 163, 184, 0.14)"
                        strokeWidth="1"
                    />
                </pattern>
            </defs>
            <rect width="640" height="260" fill={`url(#${idPrefix}talibon-grid)`} />
            {/* Mainland & Danajon Bank island schematic */}
            <path
                d="M 40 230 Q 150 165 290 175 T 580 195 L 600 250 L 40 250 Z"
                fill="rgba(20, 83, 45, 0.55)"
                stroke="#34d399"
                strokeWidth="1.75"
            />
            <ellipse
                cx="220"
                cy="95"
                rx="48"
                ry="18"
                fill="rgba(15, 118, 110, 0.45)"
                stroke="#2dd4bf"
                strokeWidth="1.5"
            />
            <ellipse
                cx="370"
                cy="78"
                rx="62"
                ry="20"
                fill="rgba(15, 118, 110, 0.45)"
                stroke="#2dd4bf"
                strokeWidth="1.5"
            />
            <ellipse
                cx="500"
                cy="108"
                rx="42"
                ry="15"
                fill="rgba(15, 118, 110, 0.45)"
                stroke="#2dd4bf"
                strokeWidth="1.5"
            />
            {/* Thematic corridor overlay */}
            <polyline
                points="95,215 215,192 330,196 465,205"
                fill="none"
                stroke="#fbbf24"
                strokeWidth="2.5"
                strokeDasharray="6 4"
            />
            <circle cx="215" cy="192" r="5" fill="#f59e0b" />
            <circle cx="330" cy="196" r="5" fill="#38bdf8" />
            <text
                x="224"
                y="188"
                fill="#f8fafc"
                fontSize="11"
                fontWeight="600"
            >
                {selectedMap.barangays[0] ?? 'Poblacion'} Sector
            </text>
            <text
                x="18"
                y="26"
                fill="#94a3b8"
                fontSize="10"
                fontFamily="monospace"
            >
                SCHEMATIC PLATE · NOT AN OFFICIAL CADASTRAL SURVEY
            </text>
        </svg>
    ) : null;

    return (
        <AppLayout title="Planning Maps Atlas">
            <PageFrame
                width="wide"
                density="compact"
                className="civic-page ot-r6-modules max-w-[1480px]"
            >
                <PageHeader
                    eyebrow="Municipality of Talibon · Spatial Planning Reference"
                    title="Planning Maps Atlas"
                    description="Thematic land-use, hazard, infrastructure, and coastal conservation plates linked to development plans and PPAs."
                    icon={Map}
                    aside={
                        <div className="flex flex-wrap items-center gap-2">
                            <Link
                                href="/development-plans"
                                className="municipal-action inline-flex min-h-9 items-center gap-1.5 px-3 text-xs font-semibold"
                            >
                                <BookOpen size={14} aria-hidden="true" /> Development Plans
                            </Link>
                            {planningPermissions?.canManageMaps && (
                                <Button
                                    type="button"
                                    variant="primary"
                                    size="sm"
                                    icon={<Plus className="h-3.5 w-3.5" />}
                                    onClick={() => setShowCreateModal(true)}
                                >
                                    Register Map Plate
                                </Button>
                            )}
                        </div>
                    }
                />

                <div
                    role="note"
                    className="rounded-lg border border-amber-300 bg-amber-50/90 px-3.5 py-2.5 text-xs leading-5 text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
                >
                    <strong>Spatial Reference Disclosure (Awaiting Official GIS):</strong> Map plates and coordinate overlays shown here are provisional planning references (`awaiting_official_gis`) and do not constitute certified cadastral surveys or legally binding zoning clearances until official DHSUD/Sangguniang Bayan GIS layers are uploaded.
                </div>

                <div className="municipal-panel flex flex-wrap items-center justify-between gap-3 p-3">
                    <div
                        role="group"
                        aria-label="Map thematic category filter"
                        className="flex flex-wrap gap-1.5"
                    >
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                type="button"
                                aria-pressed={selectedCategory === cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`min-h-8 rounded-md px-2.5 text-xs font-semibold transition ${
                                    selectedCategory === cat
                                        ? 'bg-[var(--municipal-brand)] text-white'
                                        : 'border border-[var(--municipal-border)] bg-[var(--municipal-surface)] text-[var(--municipal-text)] hover:bg-[var(--municipal-hover)]'
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                    <input
                        type="search"
                        aria-label="Search planning maps"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search map code, barangay, or plan…"
                        className="min-h-9 w-full rounded-md border border-[var(--municipal-border-strong)] bg-[var(--municipal-surface)] px-3 text-xs text-[var(--municipal-text)] sm:w-64"
                    />
                </div>

                <div className="grid gap-4 lg:grid-cols-12">
                    <section
                        aria-label="Planning map catalog"
                        className="space-y-2.5 lg:col-span-5"
                    >
                        {filteredMaps.map((map) => {
                            const isSelected = selectedMap?.code === map.code;
                            return (
                                <button
                                    key={map.code}
                                    type="button"
                                    onClick={() => setSelectedMapCode(map.code)}
                                    aria-pressed={isSelected}
                                    className={`municipal-panel block w-full p-3.5 text-left transition ${
                                        isSelected
                                            ? 'border-[var(--municipal-brand)] ring-2 ring-[var(--municipal-brand)]/20'
                                            : 'hover:bg-[var(--municipal-hover)]'
                                    }`}
                                >
                                    <div className="flex items-center justify-between gap-2 text-[11px]">
                                        <span className="font-bold uppercase tracking-wider text-[var(--municipal-brand)]">
                                            {map.code} · {map.category}
                                        </span>
                                        <span className="rounded bg-[var(--municipal-surface-muted)] px-2 py-0.5 font-semibold text-[var(--municipal-muted)]">
                                            {map.status}
                                        </span>
                                    </div>
                                    <h2 className="mt-1 text-sm font-bold text-[var(--municipal-text)]">
                                        {map.title}
                                    </h2>
                                    <p className="mt-1 line-clamp-2 text-xs text-[var(--municipal-muted)]">
                                        {map.summary}
                                    </p>
                                    <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-[var(--municipal-muted)]">
                                        <span>Plan: {map.planCode}</span>
                                        <span>Scale: {map.scale}</span>
                                        <span>CRS: {map.crs}</span>
                                    </div>
                                </button>
                            );
                        })}
                        {filteredMaps.length === 0 && (
                            <div className="municipal-panel border-dashed p-6 text-center text-xs text-[var(--municipal-muted)]">
                                No planning maps match the selected category or search query.
                            </div>
                        )}
                    </section>

                    <section
                        aria-label="Selected map plate viewer"
                        className="municipal-panel p-4 lg:col-span-7"
                    >
                        {selectedMap ? (
                            <div>
                                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--municipal-border)] pb-3">
                                    <div>
                                        <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[var(--municipal-brand)]">
                                            <span>{selectedMap.code}</span>
                                            <span>·</span>
                                            <span>{selectedMap.category}</span>
                                            <span>·</span>
                                            <span>Provenance: {selectedMap.provenanceStatus}</span>
                                        </div>
                                        <h2 className="mt-1 text-base font-bold text-[var(--municipal-text)]">
                                            {selectedMap.title}
                                        </h2>
                                    </div>
                                    <span className="rounded-full border border-[var(--municipal-border-strong)] px-2.5 py-1 text-xs font-semibold text-[var(--municipal-text)]">
                                        {selectedMap.status}
                                    </span>
                                </div>

                                {/* Self-contained SVG Cartographic Plate (zero third-party tile leakage) */}
                                <div className="mt-3 overflow-hidden rounded-xl border border-[var(--municipal-border-strong)] bg-slate-900 p-3 text-slate-100">
                                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-300">
                                        <span className="inline-flex items-center gap-1.5 font-semibold">
                                            <Compass className="h-3.5 w-3.5 text-amber-400" />
                                            Talibon Spatial Reference Grid · {selectedMap.crs}
                                        </span>
                                        <span className="font-mono">
                                            {selectedMap.centerLat.toFixed(4)}° N,{' '}
                                            {selectedMap.centerLng.toFixed(4)}° E · Scale{' '}
                                            {selectedMap.scale}
                                        </span>
                                    </div>
                                    {referencePlate('inline-')}
                                    <Button className="mt-3" variant="secondary" onClick={() => setExpandedPlateCode(selectedMap.code)}>
                                        Open reference plate
                                    </Button>
                                </div>

                                <p className="mt-3 text-xs leading-5 text-[var(--municipal-text)]">
                                    {selectedMap.summary}
                                </p>

                                <section aria-label="Planning map explorer" className="mt-4 w-full min-w-0">
                                    <InteractiveReferenceMap
                                        pins={filteredMaps.filter(map => Number.isFinite(map.centerLat) && Number.isFinite(map.centerLng) && Math.abs(map.centerLat) <= 90 && Math.abs(map.centerLng) <= 180).map(map => ({
                                            id: map.code, code: map.code, title: map.title, category: map.category,
                                            color: '#176b4a', lat: map.centerLat, lng: map.centerLng,
                                        }))}
                                        selectedPinId={selectedMap.code}
                                        onSelectPin={setSelectedMapCode}
                                        ariaLabel="Interactive planning reference coordinates"
                                    />
                                </section>

                                <dl className="mt-3 grid gap-2.5 sm:grid-cols-3">
                                    <div className="rounded-lg bg-[var(--municipal-surface-subtle)] p-2.5 text-xs">
                                        <dt className="flex items-center gap-1 text-[10px] font-bold uppercase text-[var(--municipal-muted)]">
                                            <Layers size={12} /> Coverage
                                        </dt>
                                        <dd className="mt-1 font-semibold text-[var(--municipal-text)]">
                                            {selectedMap.coverage}
                                        </dd>
                                    </div>
                                    <div className="rounded-lg bg-[var(--municipal-surface-subtle)] p-2.5 text-xs">
                                        <dt className="flex items-center gap-1 text-[10px] font-bold uppercase text-[var(--municipal-muted)]">
                                            <MapPin size={12} /> Covered Barangays
                                        </dt>
                                        <dd className="mt-1 font-semibold text-[var(--municipal-text)]">
                                            {(selectedMap.barangays ?? []).join(', ') || 'Municipality-wide'}
                                        </dd>
                                    </div>
                                    <div className="rounded-lg bg-[var(--municipal-surface-subtle)] p-2.5 text-xs">
                                        <dt className="text-[10px] font-bold uppercase text-[var(--municipal-muted)]">
                                            Linked Plans & PPAs
                                        </dt>
                                        <dd className="mt-1 font-semibold text-[var(--municipal-text)]">
                                            {[
                                                ...(selectedMap.relatedPlanCodes ?? []),
                                                ...(selectedMap.relatedPpaCodes ?? []),
                                            ].join(', ') || selectedMap.planCode}
                                        </dd>
                                    </div>
                                </dl>

                                <SupportingDocsPanel
                                    parentType="map"
                                    parentCode={selectedMap.code}
                                    attachments={attachments}
                                    canUpload={Boolean(planningPermissions?.canManageMaps)}
                                    canManageExecutive={Boolean(
                                        planningPermissions?.canViewExecutiveAttachments,
                                    )}
                                    canDelete={Boolean(planningPermissions?.isMpdcHead)}
                                />
                            </div>
                        ) : (
                            <p className="p-6 text-center text-xs text-[var(--municipal-muted)]">
                                Select a map plate from the catalog to inspect metadata and attachments.
                            </p>
                        )}
                    </section>
                </div>
            </PageFrame>

            <Dialog
                open={expandedPlateCode !== null && expandedPlateCode === selectedMap?.code}
                onClose={() => setExpandedPlateCode(null)}
                title={selectedMap?.title ?? 'Reference plate'}
                description="Provisional schematic. Awaiting official GIS."
                size="xl"
            >
                {expandedPlateCode !== null && expandedPlateCode === selectedMap?.code ? referencePlate('dialog-') : null}
            </Dialog>

            <Dialog
                variant="drawer-right"
                open={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                title="Register Planning Map Plate"
                description="Create a thematic spatial reference plate in the Planning Maps Atlas."
                size="lg"
            >
                <form onSubmit={handleCreateMap} className="space-y-3 text-xs">
                    <div className="grid gap-3 sm:grid-cols-2">
                        <label className="block font-semibold text-[var(--municipal-text)]">
                            Map Code
                            <input
                                type="text"
                                required
                                maxLength={100}
                                value={mapCode}
                                onChange={(e) => setMapCode(e.target.value)}
                                placeholder="e.g., MAP-CLUP-05"
                                className="mt-1 block min-h-9 w-full rounded border border-[var(--municipal-border-strong)] bg-[var(--municipal-surface)] px-2.5 text-xs text-[var(--municipal-text)]"
                            />
                        </label>
                        <label className="block font-semibold text-[var(--municipal-text)]">
                            Thematic Category
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="mt-1 block min-h-9 w-full rounded border border-[var(--municipal-border-strong)] bg-[var(--municipal-surface)] px-2.5 text-xs text-[var(--municipal-text)]"
                            >
                                {categories
                                    .filter((c) => c !== 'All')
                                    .map((cat) => (
                                        <option key={cat} value={cat}>
                                            {cat}
                                        </option>
                                    ))}
                            </select>
                        </label>
                    </div>
                    <label className="block font-semibold text-[var(--municipal-text)]">
                        Map Plate Title
                        <input
                            type="text"
                            required
                            maxLength={255}
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g., Poblacion Urban Growth & Infrastructure Overlay"
                            className="mt-1 block min-h-9 w-full rounded border border-[var(--municipal-border-strong)] bg-[var(--municipal-surface)] px-2.5 text-xs text-[var(--municipal-text)]"
                        />
                    </label>
                    <div className="grid gap-3 sm:grid-cols-3">
                        <label className="block font-semibold text-[var(--municipal-text)]">
                            Source Plan Code
                            <input
                                type="text"
                                required
                                value={planCode}
                                onChange={(e) => setPlanCode(e.target.value)}
                                className="mt-1 block min-h-9 w-full rounded border border-[var(--municipal-border-strong)] bg-[var(--municipal-surface)] px-2.5 text-xs text-[var(--municipal-text)]"
                            />
                        </label>
                        <label className="block font-semibold text-[var(--municipal-text)]">
                            Scale
                            <input
                                type="text"
                                value={scale}
                                onChange={(e) => setScale(e.target.value)}
                                className="mt-1 block min-h-9 w-full rounded border border-[var(--municipal-border-strong)] bg-[var(--municipal-surface)] px-2.5 text-xs text-[var(--municipal-text)]"
                            />
                        </label>
                        <label className="block font-semibold text-[var(--municipal-text)]">
                            Status
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className="mt-1 block min-h-9 w-full rounded border border-[var(--municipal-border-strong)] bg-[var(--municipal-surface)] px-2.5 text-xs text-[var(--municipal-text)]"
                            >
                                <option value="Draft">Draft</option>
                                <option value="For Review">For Review</option>
                                {planningPermissions?.canPublishOrArchive && (
                                    <option value="Published">Published</option>
                                )}
                            </select>
                        </label>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <label className="block font-semibold text-[var(--municipal-text)]">
                            CRS / Projection
                            <input
                                type="text"
                                value={crs}
                                onChange={(e) => setCrs(e.target.value)}
                                className="mt-1 block min-h-9 w-full rounded border border-[var(--municipal-border-strong)] bg-[var(--municipal-surface)] px-2.5 text-xs text-[var(--municipal-text)]"
                            />
                        </label>
                        <label className="block font-semibold text-[var(--municipal-text)]">
                            Coverage Scope
                            <input
                                type="text"
                                value={coverage}
                                onChange={(e) => setCoverage(e.target.value)}
                                className="mt-1 block min-h-9 w-full rounded border border-[var(--municipal-border-strong)] bg-[var(--municipal-surface)] px-2.5 text-xs text-[var(--municipal-text)]"
                            />
                        </label>
                    </div>
                    <label className="block font-semibold text-[var(--municipal-text)]">
                        Covered Barangays (comma-separated)
                        <input
                            type="text"
                            value={barangaysInput}
                            onChange={(e) => setBarangaysInput(e.target.value)}
                            className="mt-1 block min-h-9 w-full rounded border border-[var(--municipal-border-strong)] bg-[var(--municipal-surface)] px-2.5 text-xs text-[var(--municipal-text)]"
                        />
                    </label>
                    <label className="block font-semibold text-[var(--municipal-text)]">
                        Spatial Summary & Technical Notes
                        <textarea
                            rows={2}
                            maxLength={2000}
                            value={summary}
                            onChange={(e) => setSummary(e.target.value)}
                            className="mt-1 block w-full rounded border border-[var(--municipal-border-strong)] bg-[var(--municipal-surface)] p-2.5 text-xs text-[var(--municipal-text)]"
                        />
                    </label>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => setShowCreateModal(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" variant="primary" size="sm" loading={busy}>
                            Save Map Plate
                        </Button>
                    </div>
                </form>
            </Dialog>
        </AppLayout>
    );
}
