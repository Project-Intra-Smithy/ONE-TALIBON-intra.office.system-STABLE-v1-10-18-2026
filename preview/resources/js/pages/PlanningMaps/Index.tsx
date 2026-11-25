import { usePage } from '@inertiajs/react';
import {
    Archive,
    CheckCircle2,
    Eye,
    Layers,
    MapPin,
    Pencil,
    Plus,
    RotateCcw,
    Search,
    ShieldCheck,
    Trash2,
    Users,
} from 'lucide-react';
import { useEffect, useId, useMemo, useState } from 'react';
import DesignatedStaffDrawer from '../../components/maps/DesignatedStaffDrawer';
import PlanningMapFormDrawer from '../../components/maps/PlanningMapFormDrawer';
import PlanningMapPlateModal from '../../components/maps/PlanningMapPlateModal';
import TalibonInteractiveMap, { type InteractiveMapPin } from '../../components/maps/TalibonInteractiveMap';
import PortalWorkspaceNav from '../../components/portal/PortalWorkspaceNav';
import { Button, ConfirmDialog, EmptyState, PageHeader, StatusBadge } from '../../components/ui';
import {
    loadDesignatedStaff,
    loadPlanningMaps,
    PLANNING_MAP_CATEGORY_META,
    resetPlanningMaps,
    resolvePlanningMapPermissions,
    saveDesignatedStaff,
    savePlanningMaps,
    type DesignatedPlanningStaff,
    type PlanningMapCategory,
    type PlanningMapPermissions,
    type PlanningMapRecord,
    type PlanningMapStatus,
} from '../../data/municipal/planningMaps';
import AppLayout from '../../layouts/AppLayout';
import { formatDatePH } from '../../lib/format';
import type { SharedProps } from '../../types';

type Props = {
    planningMaps?: PlanningMapRecord[];
    designatedStaff?: DesignatedPlanningStaff[];
    planningMapPermissions?: Partial<PlanningMapPermissions>;
};

type FilterTab = 'published' | PlanningMapCategory | 'draft' | 'archived';

export default function PlanningMapsIndex({
    planningMaps: initialMaps,
    designatedStaff: initialStaff,
    planningMapPermissions: permissionOverride,
}: Props) {
    const { auth, workspaceExperience } = usePage<SharedProps>().props;
    const searchId = useId();

    const [maps, setMaps] = useState<PlanningMapRecord[]>(() => loadPlanningMaps(initialMaps));
    const [staff, setStaff] = useState<DesignatedPlanningStaff[]>(() => loadDesignatedStaff(initialStaff));
    const [activeTab, setActiveTab] = useState<FilterTab>('published');
    const [search, setSearch] = useState('');
    const [selectedPinId, setSelectedPinId] = useState<string | null>(() =>
        typeof window === 'undefined' ? null : new URLSearchParams(window.location.search).get('pin'),
    );
    const [viewingPlate, setViewingPlate] = useState<PlanningMapRecord | null>(null);
    const [editingMap, setEditingMap] = useState<PlanningMapRecord | null>(null);
    const [formOpen, setFormOpen] = useState(false);
    const [staffDrawerOpen, setStaffDrawerOpen] = useState(false);
    const [deletingMap, setDeletingMap] = useState<PlanningMapRecord | null>(null);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);

    // Interactive map overlay toggles
    const [showZones, setShowZones] = useState(true);
    const [showHazards, setShowHazards] = useState(false);
    const [showRoadCorridor, setShowRoadCorridor] = useState(true);
    const [enabledCategories, setEnabledCategories] = useState<Record<PlanningMapCategory, boolean>>({
        base_barangay: true,
        clup_zoning: true,
        hazard_drrm: true,
        infrastructure_roads: true,
        coastal_marine: true,
    });

    const permissions = useMemo(
        () => resolvePlanningMapPermissions(auth.user, workspaceExperience, staff, permissionOverride),
        [auth.user, workspaceExperience, staff, permissionOverride],
    );

    const canManage = permissions.canCreate || permissions.canEdit;

    // Reset restricted tabs and transient editor toast if user switches role
    useEffect(() => {
        if (!canManage && (activeTab === 'draft' || activeTab === 'archived')) {
            setActiveTab('published');
        }
    }, [canManage, activeTab]);

    useEffect(() => {
        setStatusMessage(null);
    }, [auth.user?.id, workspaceExperience]);

    const visiblePool = useMemo(
        () => (canManage ? maps : maps.filter((item) => item.status === 'published')),
        [maps, canManage],
    );

    const publishedMaps = useMemo(() => maps.filter((item) => item.status === 'published'), [maps]);
    const draftMaps = useMemo(() => maps.filter((item) => item.status === 'draft'), [maps]);
    const archivedMaps = useMemo(() => maps.filter((item) => item.status === 'archived'), [maps]);

    const filteredMaps = useMemo(() => {
        const needle = search.trim().toLowerCase();
        return visiblePool.filter((item) => {
            const matchesTab =
                activeTab === 'published'
                    ? item.status === 'published'
                    : activeTab === 'draft'
                      ? item.status === 'draft'
                      : activeTab === 'archived'
                        ? item.status === 'archived'
                        : item.status === 'published' && item.category === activeTab;

            const matchesSearch =
                !needle ||
                [item.code, item.title, item.description, item.authority, ...item.barangays]
                    .join(' ')
                    .toLowerCase()
                    .includes(needle);

            return matchesTab && matchesSearch;
        });
    }, [visiblePool, activeTab, search]);

    const interactivePins = useMemo<InteractiveMapPin[]>(() => {
        return visiblePool
            .filter((item) => item.status !== 'archived' && enabledCategories[item.category])
            .map((item) => ({
                id: item.id,
                code: item.code,
                title: item.title,
                subtitle: item.barangays.slice(0, 3).join(', '),
                category: PLANNING_MAP_CATEGORY_META[item.category].label,
                color: PLANNING_MAP_CATEGORY_META[item.category].color,
                lat: item.lat,
                lng: item.lng,
            }));
    }, [visiblePool, enabledCategories]);

    const selectedRecord = useMemo(
        () => visiblePool.find((item) => item.id === selectedPinId) ?? filteredMaps[0] ?? publishedMaps[0] ?? null,
        [visiblePool, selectedPinId, filteredMaps, publishedMaps],
    );

    const persistMaps = (next: PlanningMapRecord[], feedback: string) => {
        setMaps(next);
        savePlanningMaps(next);
        setStatusMessage(feedback);
    };

    const handleSaveMap = (record: PlanningMapRecord) => {
        const exists = maps.some((item) => item.id === record.id);
        const next = exists ? maps.map((item) => (item.id === record.id ? record : item)) : [record, ...maps];
        persistMaps(next, exists ? `Updated planning map ${record.code}.` : `Added planning map ${record.code}.`);
        setSelectedPinId(record.id);
    };

    const handleStatusChange = (record: PlanningMapRecord, nextStatus: PlanningMapStatus) => {
        const next = maps.map((item) =>
            item.id === record.id
                ? { ...item, status: nextStatus, updatedAt: new Date().toISOString(), updatedBy: auth.user?.name || 'MPDC Editor' }
                : item,
        );
        persistMaps(next, `Marked ${record.code} as ${nextStatus}.`);
    };

    const handleConfirmDelete = () => {
        if (!deletingMap) return;
        const next = maps.filter((item) => item.id !== deletingMap.id);
        persistMaps(next, `Removed planning map ${deletingMap.code} from registry.`);
        if (selectedPinId === deletingMap.id) setSelectedPinId(null);
        setDeletingMap(null);
    };

    const handleToggleDesignatedStaff = (id: string) => {
        const next = staff.map((member) => {
            if (member.id !== id) return member;
            const nextActive = !member.active;
            return {
                ...member,
                active: nextActive,
                canManagePlans: nextActive ? (member.canManagePlans ?? true) : false,
                canManagePpas: nextActive ? (member.canManagePpas ?? true) : false,
                canManageMaps: nextActive ? (member.canManageMaps ?? true) : false,
            };
        });
        setStaff(next);
        saveDesignatedStaff(next);
    };

    const handleToggleModuleScope = (id: string, mod: 'plans' | 'ppas' | 'maps') => {
        const next = staff.map((member) => {
            if (member.id !== id) return member;
            const field = mod === 'plans' ? 'canManagePlans' : mod === 'ppas' ? 'canManagePpas' : 'canManageMaps';
            const nextVal = !(member.active && (member[field] ?? true));
            const updated = {
                ...member,
                canManagePlans: member.active ? (member.canManagePlans ?? true) : false,
                canManagePpas: member.active ? (member.canManagePpas ?? true) : false,
                canManageMaps: member.active ? (member.canManageMaps ?? true) : false,
                [field]: nextVal,
            };
            updated.active = Boolean(updated.canManagePlans || updated.canManagePpas || updated.canManageMaps);
            return updated;
        });
        setStaff(next);
        saveDesignatedStaff(next);
    };

    const activeStaffCount = staff.filter((member) => member.active).length;

    const filterTabs: { key: FilterTab; label: string; count: number }[] = [
        { key: 'published', label: 'All Published', count: publishedMaps.length },
        { key: 'base_barangay', label: 'Base', count: publishedMaps.filter((m) => m.category === 'base_barangay').length },
        { key: 'clup_zoning', label: 'CLUP / Zoning', count: publishedMaps.filter((m) => m.category === 'clup_zoning').length },
        { key: 'hazard_drrm', label: 'Hazard', count: publishedMaps.filter((m) => m.category === 'hazard_drrm').length },
        { key: 'infrastructure_roads', label: 'Roads', count: publishedMaps.filter((m) => m.category === 'infrastructure_roads').length },
        { key: 'coastal_marine', label: 'Coastal', count: publishedMaps.filter((m) => m.category === 'coastal_marine').length },
        ...(canManage
            ? [
                  { key: 'draft' as const, label: 'Drafts', count: draftMaps.length },
                  { key: 'archived' as const, label: 'Archived', count: archivedMaps.length },
              ]
            : []),
    ];

    return (
        <AppLayout title="Planning Maps">
            <div className="mx-auto max-w-[1440px] space-y-5 px-4 py-5 sm:px-6">
                <PageHeader
                    eyebrow="Municipality of Talibon · MPDC Spatial Reference"
                    title="Municipal Planning Maps"
                    subtitle="Bundled reference plates and sample overlays for interface evaluation. These are not verified official GIS data."
                    actions={
                        <>
                            {permissions.canCreate && (
                                <Button
                                    onClick={() => {
                                        setEditingMap(null);
                                        setFormOpen(true);
                                    }}
                                >
                                    <Plus size={16} aria-hidden="true" />
                                    <span>Add Planning Map</span>
                                </Button>
                            )}
                            {permissions.canManageStaff && (
                                <Button variant="secondary" onClick={() => setStaffDrawerOpen(true)}>
                                    <Users size={16} aria-hidden="true" />
                                    <span>Designated Staff ({activeStaffCount})</span>
                                </Button>
                            )}
                        </>
                    }
                />

                <PortalWorkspaceNav current="availablePlanningMaps" destinations={['developmentPlans', 'availablePlanningMaps', 'ppas']} />

                {/* Access boundary banner: clear for both MPDC editors and all-staff viewers */}
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] px-4 py-3 text-xs">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <ShieldCheck size={16} aria-hidden="true" className="shrink-0 text-[var(--brand-ink)]" />
                        <span className="font-semibold text-[var(--ink-primary)]">{permissions.accessLabel}</span>
                        <span className="hidden text-[var(--ink-secondary)] lg:inline">
                            — Published plates are open to every Talibon LGU office; editing is restricted to MPDC Head and designated MPDC staff.
                        </span>
                    </div>
                    {canManage && (
                        <button
                            type="button"
                            onClick={() => {
                                const seeded = resetPlanningMaps();
                                setMaps(seeded);
                                setStatusMessage('Restored default Talibon reference map plates.');
                            }}
                            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-[var(--border-control)] px-2.5 text-xs font-semibold text-[var(--ink-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--ink-primary)]"
                        >
                            <RotateCcw size={13} aria-hidden="true" />
                            <span>Reset sample maps</span>
                        </button>
                    )}
                </div>

                {statusMessage && (
                    <div
                        role="status"
                        aria-live="polite"
                        className="flex items-center justify-between gap-3 rounded-xl border border-[var(--status-ok-border)] bg-[var(--status-ok-bg)] px-4 py-2.5 text-sm font-semibold text-[var(--status-ok-fg)]"
                    >
                        <span className="inline-flex items-center gap-2">
                            <CheckCircle2 size={16} aria-hidden="true" />
                            {statusMessage}
                        </span>
                        <button type="button" onClick={() => setStatusMessage(null)} className="text-xs underline">
                            Dismiss
                        </button>
                    </div>
                )}

                {/* Filter tabs + search */}
                <div className="tcds-card flex flex-col gap-3 p-3 xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex flex-wrap items-center gap-1.5" role="tablist" aria-label="Planning map categories">
                        {filterTabs.map((tab) => {
                            const active = activeTab === tab.key;
                            return (
                                <button
                                    key={tab.key}
                                    type="button"
                                    role="tab"
                                    aria-selected={active}
                                    onClick={() => setActiveTab(tab.key)}
                                    className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-semibold transition-colors ${
                                        active
                                            ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)] text-white'
                                            : 'border-transparent bg-[var(--surface-recessed)] text-[var(--ink-primary)] hover:bg-[var(--surface-hover)]'
                                    }`}
                                >
                                    <span>{tab.label}</span>
                                    <span
                                        className={`rounded-full px-1.5 py-0.5 text-xs font-bold leading-none ${
                                            active ? 'bg-white/20 text-white' : 'bg-[var(--surface-card)] text-[var(--ink-secondary)]'
                                        }`}
                                    >
                                        {tab.count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    <search className="w-full shrink-0 xl:w-60">
                        <label htmlFor={searchId} className="sr-only">Search planning maps</label>
                        <div className="relative">
                            <Search size={15} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-secondary)]" />
                            <input
                                id={searchId}
                                type="search"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search maps, barangays…"
                                className="tcds-input pl-9"
                            />
                        </div>
                    </search>
                </div>

                {/* Interactive Leaflet / OpenStreetMap Talibon Map + Layer Toggles & Selected Pin */}
                <section aria-label="Interactive Talibon planning map" className="grid gap-4 lg:grid-cols-[minmax(0,1.85fr)_minmax(290px,0.85fr)]">
                    <TalibonInteractiveMap
                        pins={interactivePins}
                        selectedPinId={selectedRecord?.id ?? null}
                        onSelectPin={(id) => setSelectedPinId(id)}
                        showZones={showZones}
                        showHazards={showHazards}
                        showRoadCorridor={showRoadCorridor}
                        heightClass="h-[430px]"
                        ariaLabel="Interactive OpenStreetMap planning map of Talibon, Bohol"
                    />

                    <aside className="tcds-card flex flex-col justify-between gap-4 p-4">
                        <div>
                            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--brand-ink)]">
                                <Layers size={15} aria-hidden="true" />
                                <span>Layer Toggles</span>
                            </div>

                            <div className="mt-3 space-y-2 border-b border-[var(--border-default)] pb-3">
                                <label className="flex min-h-9 cursor-pointer items-center gap-2.5 text-sm font-medium text-[var(--ink-primary)]">
                                    <input type="checkbox" checked={showZones} onChange={(e) => setShowZones(e.target.checked)} className="h-4 w-4 accent-[var(--brand-ink)]" />
                                    <span>CLUP Land Use Zones</span>
                                </label>
                                <label className="flex min-h-9 cursor-pointer items-center gap-2.5 text-sm font-medium text-[var(--ink-primary)]">
                                    <input type="checkbox" checked={showHazards} onChange={(e) => setShowHazards(e.target.checked)} className="h-4 w-4 accent-[var(--brand-ink)]" />
                                    <span>Flood &amp; Landslide Advisories</span>
                                </label>
                                <label className="flex min-h-9 cursor-pointer items-center gap-2.5 text-sm font-medium text-[var(--ink-primary)]">
                                    <input type="checkbox" checked={showRoadCorridor} onChange={(e) => setShowRoadCorridor(e.target.checked)} className="h-4 w-4 accent-[var(--brand-ink)]" />
                                    <span>National Road Corridor</span>
                                </label>
                            </div>

                            <div className="mt-3">
                                <p className="text-xs font-bold uppercase tracking-wide text-[var(--ink-secondary)]">Map Pins by Category</p>
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                    {(Object.keys(PLANNING_MAP_CATEGORY_META) as PlanningMapCategory[]).map((key) => {
                                        const meta = PLANNING_MAP_CATEGORY_META[key];
                                        const enabled = enabledCategories[key];
                                        return (
                                            <button
                                                key={key}
                                                type="button"
                                                aria-pressed={enabled}
                                                onClick={() => setEnabledCategories((prev) => ({ ...prev, [key]: !prev[key] }))}
                                                className={`inline-flex min-h-9 items-center gap-1.5 rounded-full border px-2.5 text-xs font-semibold transition-colors ${
                                                    enabled
                                                        ? 'border-[var(--brand-primary)] bg-[var(--brand-soft)] text-[var(--ink-primary)]'
                                                        : 'border-[var(--border-default)] bg-[var(--surface-recessed)] text-[var(--ink-secondary)] opacity-70'
                                                }`}
                                            >
                                                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: meta.color }} aria-hidden="true" />
                                                <span>{meta.shortLabel}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {selectedRecord && (
                            <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-recessed)] p-3.5">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="font-mono text-xs font-bold text-[var(--brand-ink)]">
                                        {selectedRecord.code}
                                    </span>
                                    <StatusBadge tone={PLANNING_MAP_CATEGORY_META[selectedRecord.category].tone}>
                                        {PLANNING_MAP_CATEGORY_META[selectedRecord.category].shortLabel}
                                    </StatusBadge>
                                </div>
                                <h2 className="mt-1 text-sm font-bold text-[var(--ink-primary)]">Selected map reference</h2>
                                <p className="mt-1 text-sm font-semibold text-[var(--ink-primary)]">{selectedRecord.title}</p>
                                <p className="mt-1 flex items-center gap-1.5 font-mono text-xs text-[var(--ink-secondary)]">
                                    <MapPin size={13} aria-hidden="true" />
                                    <span>{selectedRecord.lat.toFixed(4)}° N, {selectedRecord.lng.toFixed(4)}° E</span>
                                </p>
                                <p className="mt-1.5 line-clamp-2 text-xs text-[var(--ink-secondary)]">{selectedRecord.description}</p>
                                <button
                                    type="button"
                                    onClick={() => setViewingPlate(selectedRecord)}
                                    className="municipal-primary-button mt-3 w-full"
                                >
                                    <Eye size={15} aria-hidden="true" />
                                    <span>Open Full Map Plate</span>
                                </button>
                            </div>
                        )}
                    </aside>
                </section>

                {/* Published / Filtered Planning Map Plates Gallery */}
                <section aria-labelledby="plates-gallery-heading" className="space-y-3">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <h2 id="plates-gallery-heading" className="text-lg font-bold text-[var(--ink-primary)]">
                            {activeTab === 'draft'
                                ? 'MPDC Draft Planning Maps'
                                : activeTab === 'archived'
                                  ? 'Archived Planning Maps'
                                  : 'Published Planning Map Plates'}
                        </h2>
                        <span className="text-xs font-semibold text-[var(--ink-secondary)]">
                            Showing {filteredMaps.length} {filteredMaps.length === 1 ? 'plate' : 'plates'}
                        </span>
                    </div>

                    {filteredMaps.length === 0 ? (
                        <EmptyState
                            icon={<MapPin size={24} aria-hidden="true" />}
                            title="No planning maps match this view"
                            description="Switch categories, clear the search query, or add a new map plate if you hold MPDC editing access."
                            action={
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearch('');
                                        setActiveTab('published');
                                    }}
                                    className="municipal-secondary-button"
                                >
                                    Show all published maps
                                </button>
                            }
                        />
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                            {filteredMaps.map((item) => {
                                const cat = PLANNING_MAP_CATEGORY_META[item.category];
                                const selected = selectedRecord?.id === item.id;
                                return (
                                    <article
                                        key={item.id}
                                        className={`tcds-card flex flex-col overflow-hidden transition-colors ${
                                            selected ? 'border-[var(--brand-primary)] ring-1 ring-[var(--brand-primary)]' : 'hover:border-[var(--border-strong)]'
                                        }`}
                                    >
                                        <button
                                            type="button"
                                            onClick={() => setViewingPlate(item)}
                                            aria-label={`Inspect full map plate for ${item.title}`}
                                            className="group relative block h-44 w-full overflow-hidden border-b border-[var(--border-default)] bg-[var(--surface-recessed)] p-2 text-left"
                                        >
                                            <img
                                                src={item.imageUrl}
                                                alt={`${item.title} (${item.code})`}
                                                loading="lazy"
                                                className="tcds-plate-thumb h-full w-full rounded-lg border border-[var(--border-default)] object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                                            />
                                            <span className="absolute left-3.5 top-3.5 rounded-md bg-[var(--surface-sidebar)]/92 px-2 py-0.5 font-mono text-xs font-bold text-white backdrop-blur-sm">
                                                {item.code}
                                            </span>
                                        </button>

                                        <div className="flex flex-1 flex-col p-4">
                                            <div className="flex flex-wrap items-center gap-1.5">
                                                <StatusBadge tone={item.status === 'published' ? 'ok' : item.status === 'draft' ? 'warn' : 'neutral'}>
                                                    {item.status === 'published' ? 'Published' : item.status === 'draft' ? 'Draft' : 'Archived'}
                                                </StatusBadge>
                                                <StatusBadge tone={cat.tone}>{cat.shortLabel}</StatusBadge>
                                            </div>

                                            <h3 className="mt-2 text-base font-bold leading-snug text-[var(--ink-primary)]">{item.title}</h3>
                                            <p className="mt-1 line-clamp-2 flex-1 text-xs leading-5 text-[var(--ink-secondary)]">
                                                {item.description}
                                            </p>

                                            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border-default)] pt-2.5 text-xs text-[var(--ink-secondary)]">
                                                <span>{item.effectivePeriod}</span>
                                                <span>Updated {formatDatePH(item.updatedAt)}</span>
                                            </div>

                                            <div className="mt-3 flex flex-wrap items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setViewingPlate(item)}
                                                    className="municipal-primary-button flex-1"
                                                >
                                                    <Eye size={15} aria-hidden="true" />
                                                    <span>View Plate</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedPinId(item.id)}
                                                    className="municipal-secondary-button px-3"
                                                    aria-label={`Locate ${item.title} on interactive map`}
                                                    title="Locate on interactive map"
                                                >
                                                    <MapPin size={15} aria-hidden="true" />
                                                </button>
                                                {permissions.canEdit && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setEditingMap(item);
                                                            setFormOpen(true);
                                                        }}
                                                        className="municipal-secondary-button px-3"
                                                        aria-label={`Edit ${item.title}`}
                                                    >
                                                        <Pencil size={15} aria-hidden="true" />
                                                        <span>Edit</span>
                                                    </button>
                                                )}
                                            </div>

                                            {canManage && (
                                                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-dashed border-[var(--border-default)] pt-1.5">
                                                    {item.status !== 'published' ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleStatusChange(item, 'published')}
                                                            className="inline-flex min-h-10 items-center rounded-md px-2 text-xs font-bold text-[var(--brand-ink)] hover:bg-[var(--brand-soft)]"
                                                        >
                                                            Publish to all staff
                                                        </button>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleStatusChange(item, 'archived')}
                                                            className="inline-flex min-h-10 items-center gap-1.5 rounded-md px-2 text-xs font-semibold text-[var(--ink-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--ink-primary)]"
                                                        >
                                                            <Archive size={14} aria-hidden="true" />
                                                            <span>Archive</span>
                                                        </button>
                                                    )}

                                                    {permissions.canDelete && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setDeletingMap(item)}
                                                            className="inline-flex min-h-10 items-center gap-1.5 rounded-md px-2 text-xs font-semibold text-[var(--status-danger-fg)] hover:bg-[var(--status-danger-bg)]"
                                                        >
                                                            <Trash2 size={13} aria-hidden="true" />
                                                            <span>Delete</span>
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    )}
                </section>
            </div>

            <PlanningMapPlateModal map={viewingPlate} onClose={() => setViewingPlate(null)} />

            <PlanningMapFormDrawer
                open={formOpen}
                editing={editingMap}
                actorName={auth.user?.name || 'MPDC Staff'}
                onClose={() => {
                    setFormOpen(false);
                    setEditingMap(null);
                }}
                onSave={handleSaveMap}
            />

            <DesignatedStaffDrawer
                open={staffDrawerOpen}
                staff={staff}
                headName={auth.user?.name || 'MPDC Department Head'}
                contextModule="maps"
                onClose={() => setStaffDrawerOpen(false)}
                onToggleStaff={handleToggleDesignatedStaff}
                onToggleModuleScope={handleToggleModuleScope}
            />

            <ConfirmDialog
                open={Boolean(deletingMap)}
                title={deletingMap ? `Delete planning map ${deletingMap.code}?` : 'Delete planning map?'}
                message={
                    deletingMap
                        ? `This permanently removes “${deletingMap.title}” from the Municipal Planning Maps registry. Consider archiving instead if historical traceability is required.`
                        : ''
                }
                confirmLabel="Delete map"
                destructive
                onCancel={() => setDeletingMap(null)}
                onConfirm={handleConfirmDelete}
            />
        </AppLayout>
    );
}
