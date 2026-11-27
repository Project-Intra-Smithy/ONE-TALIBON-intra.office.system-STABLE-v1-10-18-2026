import PlanningDeleteAction from '../../components/planning/PlanningDeleteAction';
import MapExplorerControls from '../../components/maps/MapExplorerControls';
import MapGalleryCard from '../../components/maps/MapGalleryCard';
import MapStudioView from '../../components/maps/MapStudioView';
import MapPlateDialog from '../../components/maps/MapPlateDialog';
import InteractiveReferenceMap from '../../components/maps/InteractiveReferenceMap';
import { Link, router } from '@inertiajs/react';
import { BookOpen, Compass, Layers, Map, MapPin, Plus } from 'lucide-react';
import { type FormEvent, useMemo, useState } from 'react';
import PageFrame from '../../components/PageFrame';
import PageHeader from '../../components/PageHeader';
import SupportingDocsPanel, {
    type ServerPlanningAttachment,
} from '../../components/planning/SupportingDocsPanel';
import PortalWorkspaceNav from '../../components/portal/PortalWorkspaceNav';
import Button from '../../components/ui/Button';
import Dialog from '../../components/ui/Dialog';
import AppLayout from '../../layouts/AppLayout';
import type { PlanningPermissions } from '../Plans/Index';

export type ServerPlanningMap = {
    id: string;
    dbId: number;
    canEdit?: boolean;
    canDelete?: boolean;
    canUploadAttachments?: boolean;
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
    const [hiddenPinCategories,setHiddenPinCategories]=useState<string[]>([]);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState(() => typeof window === 'undefined' ? '' : new URLSearchParams(window.location.search).get('search') ?? '');
    const [selectedMapCode, setSelectedMapCode] = useState<string | null>(
        planningMaps[0]?.code ?? null,
    );
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingMap,setEditingMap]=useState<ServerPlanningMap|null>(null);
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
    const [submissionError,setSubmissionError]=useState('');
    const [coordinates,setCoordinates]=useState({lat:10.1531,lng:124.3268});

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

    const openMapStudio=(map:ServerPlanningMap|null)=>{
        setEditingMap(map);setSubmissionError('');setMapCode(map?.code??'');setTitle(map?.title??'');setCategory(map?.category??'Macro & Spatial');setPlanCode(map?.planCode??'');setScale(map?.scale??'1:25,000');setCrs(map?.crs??'PRS92 / Luzon 1911');setCoverage(map?.coverage??'');setStatus(map?.status??'For Review');setSummary(map?.summary??'');setBarangaysInput(map?.barangays.join(', ')??'');setCoordinates({lat:map?.centerLat??10.151,lng:map?.centerLng??124.327});setShowCreateModal(true);
    };

    const handleCreateMap = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!mapCode.trim() || !title.trim() || busy) return;
        setSubmissionError('');
        setBusy(true);

        const barangays = barangaysInput
            .split(',')
            .map((b) => b.trim())
            .filter(Boolean);

        const data = {
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
                center_lat: coordinates.lat,
                center_lng: coordinates.lng,
            };
        const options = {
                preserveScroll: true,
                onSuccess: () => {
                    setMapCode('');
                    setTitle('');
                    setSummary('');
                    setShowCreateModal(false);
                },
                onError: (errors:Record<string,string>)=>setSubmissionError(Object.values(errors).join(' ')),
                onFinish: () => setBusy(false),
            };
        if(editingMap) router.put(`/planning-maps/${editingMap.dbId}`,data,options);
        else router.post('/planning-maps',data,options);
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
                            {planningPermissions?.canDesignateStaff&&<Link href="/development-plans?staff=1" className="municipal-secondary-button">Staff Scopes</Link>}
                            {planningPermissions?.canManageMaps && (
                                <Button
                                    type="button"
                                    variant="primary"
                                    size="sm"
                                    icon={<Plus className="h-3.5 w-3.5" />}
                                    onClick={() => openMapStudio(null)}
                                >
                                    Register Map Plate
                                </Button>
                            )}
                        </div>
                    }
                />

                {submissionError&&!showCreateModal&&<p role="alert" className="rounded-lg border border-[var(--status-danger-border)] bg-[var(--status-danger-bg)] p-3 text-sm text-[var(--status-danger-fg)]">{submissionError}</p>}
                <PortalWorkspaceNav
                    current="availablePlanningMaps"
                    destinations={['developmentPlans', 'availablePlanningMaps', 'ppas']}
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
                                className={`min-h-11 rounded-md px-2.5 text-xs font-semibold transition ${
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
                        className="min-h-11 w-full rounded-md border border-[var(--municipal-border-strong)] bg-[var(--municipal-surface)] px-3 text-xs text-[var(--municipal-text)] sm:w-64"
                    />
                </div>

                <div className="space-y-4">
                    <section
                        aria-label="Planning map catalog"
                        className="space-y-3"
                    >
                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                            {filteredMaps.map(map=><MapGalleryCard key={map.code} code={map.code} title={map.title} description={map.summary} category={map.category} status={map.status} updatedLabel={`Updated year ${map.updatedYear}`} selected={selectedMap?.code===map.code}
                                onInspect={()=>{setSelectedMapCode(map.code);setExpandedPlateCode(map.code);}}
                                onEdit={map.canEdit?()=>openMapStudio(map):undefined}
                                managementActions={map.canDelete?<PlanningDeleteAction title={map.code} busy={busy} disabledReason={map.status!=='Draft'?'Only draft maps can be deleted.':undefined} onDelete={()=>{setBusy(true);setSubmissionError('');router.delete(`/planning-maps/${map.dbId}`,{preserveScroll:true,onError:errors=>setSubmissionError(Object.values(errors).join(' ')),onFinish:()=>setBusy(false)});}} />:undefined}
                                onLocate={()=>{setSelectedMapCode(map.code);document.getElementById('planning-map-explorer')?.scrollIntoView({behavior:'smooth',block:'center'});}} />)}
                        </div>
                        {filteredMaps.length === 0 && (
                            <div className="municipal-panel border-dashed p-6 text-center text-xs text-[var(--municipal-muted)]">
                                No planning maps match the selected category or search query.
                            </div>
                        )}
                    </section>

                    <section
                        aria-label="Selected map plate viewer"
                        className="tcds-card p-4"
                    >
                        {selectedMap ? (
                            <div>
                                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--municipal-border)] pb-3">
                                    <div>
                                        <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[var(--brand-ink)]">
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

                                <section id="planning-map-explorer" aria-label="Planning map explorer" className="mt-4 grid w-full min-w-0 gap-4 lg:grid-cols-[minmax(0,1.85fr)_minmax(290px,0.85fr)]">
                                    <InteractiveReferenceMap
                                        pins={filteredMaps.filter(map => !hiddenPinCategories.includes(map.category) && Number.isFinite(map.centerLat) && Number.isFinite(map.centerLng) && Math.abs(map.centerLat) <= 90 && Math.abs(map.centerLng) <= 180).map(map => ({
                                            id: map.code, code: map.code, title: map.title, category: map.category,
                                            color: '#176b4a', lat: map.centerLat, lng: map.centerLng,
                                        }))}
                                        selectedPinId={selectedMap.code}
                                        onSelectPin={setSelectedMapCode}
                                        ariaLabel="Interactive planning reference coordinates"
                                    />
                                    <aside className="tcds-card p-4"><MapExplorerControls overlays={['CLUP Land Use Zones','Flood & Landslide Advisories','National Road Corridor'].map(label=>({label,checked:false}))} unavailableReason="Official overlay geometries are not supplied by the current GIS contract. The map shows reference coordinates only." categories={[...new Set(planningMaps.map(map=>map.category))].map(label=>({label,checked:!hiddenPinCategories.includes(label),color:'#176b4a',onChange:()=>setHiddenPinCategories(previous=>previous.includes(label)?previous.filter(category=>category!==label):[...previous,label])}))} /></aside>
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
                                            <ul className="flex flex-wrap gap-x-3">
                                                {(selectedMap.relatedPlanCodes?.length ? selectedMap.relatedPlanCodes : [selectedMap.planCode]).filter(Boolean).map(code => (
                                                    <li key={code}><Link className="inline-flex min-h-11 items-center underline" href={`/development-plans?search=${encodeURIComponent(code)}`}>{code}</Link></li>
                                                ))}
                                                {(selectedMap.relatedPpaCodes ?? []).map(code => (
                                                    <li key={code}><Link className="inline-flex min-h-11 items-center underline" href={`/ppas?search=${encodeURIComponent(code)}`}>{code}</Link></li>
                                                ))}
                                            </ul>
                                        </dd>
                                    </div>
                                </dl>

                                <SupportingDocsPanel
                                    parentType="map"
                                    parentCode={selectedMap.code} parentRecordId={selectedMap.dbId}
                                    attachments={attachments}
                                    canUpload={Boolean(selectedMap?.canUploadAttachments)}
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

            {expandedPlateCode !== null && expandedPlateCode === selectedMap?.code && selectedMap && <MapPlateDialog key={selectedMap.code} open onClose={()=>setExpandedPlateCode(null)} title={selectedMap.title} description="Provisional schematic. Awaiting official GIS." status={selectedMap.status} category={selectedMap.category} plate={referencePlate('dialog-')} note={selectedMap.summary} metadata={[
                ['Covered Barangays',selectedMap.barangays.join(', ')],['Authority / Reference','Not supplied by the current server record'],['Scale & Projection',`${selectedMap.scale} · ${selectedMap.crs}`],['Map Pin Coordinates',`${selectedMap.centerLat} · ${selectedMap.centerLng}`],['Legend & Notes','Official symbology is not supplied by the current server record'],['Source Attribution & Last Update',`${selectedMap.provenanceStatus} · ${selectedMap.updatedYear}`]
            ]} />}

            <MapStudioView error={submissionError} open={showCreateModal} editing={editingMap} onClose={()=>setShowCreateModal(false)} busy={busy}
                values={{code:mapCode,title,category,status,description:summary,imageUrl:'',sourceAttribution:'Plate image upload is unavailable in the current registry contract.',barangaysText:barangaysInput,scale,projection:crs,effectivePeriod:'',authority:'',legendNotes:'',lat:coordinates.lat,lng:coordinates.lng}}
                onChange={(field,value)=>{
                    if(field==='lat'||field==='lng'){setCoordinates(coords=>({...coords,[field]:Number(value)}));return;}
                    const setters:Record<string,(value:string)=>void>={code:setMapCode,title:setTitle,category:setCategory,status:setStatus,description:setSummary,barangaysText:setBarangaysInput,scale:setScale,projection:setCrs};
                    setters[field]?.(String(value));
                }}
                onSubmit={handleCreateMap} categories={Object.fromEntries(categories.filter(category=>category!=='All').map(category=>[category,{label:category}]))}
                templates={[]} barangays={[]} statuses={['Draft','For Review',...(planningPermissions?.canPublishOrArchive?['Published','Archived']:[])].map(value=>({value,label:value,description:value==='Published'?'Visible according to server authorization':'Provisional registry record'}))}
                onFileUpload={()=>{}} unavailable={[...(editingMap?['code' as const]:[]),'imageUrl','sourceAttribution','effectivePeriod','authority','legendNotes']}
                coordinatePicker={<InteractiveReferenceMap pins={[]} pickMode pickedCoords={coordinates} onPickCoords={setCoordinates} ariaLabel="Click to pick map pin coordinates in Talibon" heightClass="h-52" />}
                referenceFields={<div className="grid gap-3 sm:grid-cols-2"><label className="text-xs font-semibold">Linked Plan Reference<input required value={planCode} onChange={event=>setPlanCode(event.target.value)} className="tcds-input mt-1" /></label><label className="text-xs font-semibold">Coverage Scope<input value={coverage} onChange={event=>setCoverage(event.target.value)} className="tcds-input mt-1" /></label></div>}
            />
        </AppLayout>
    );
}
