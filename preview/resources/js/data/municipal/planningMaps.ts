import type { AuthUser, WorkspaceExperience } from '../../types';

export type PlanningMapCategory =
    | 'base_barangay'
    | 'clup_zoning'
    | 'hazard_drrm'
    | 'infrastructure_roads'
    | 'coastal_marine';

export type PlanningMapStatus = 'published' | 'draft' | 'archived';

export type PlanningMapRecord = {
    id: string;
    code: string;
    title: string;
    category: PlanningMapCategory;
    status: PlanningMapStatus;
    description: string;
    imageUrl: string;
    sourceAttribution: string;
    barangays: string[];
    scale: string;
    projection: string;
    effectivePeriod: string;
    authority: string;
    lat: number;
    lng: number;
    legendNotes: string;
    updatedAt: string;
    updatedBy: string;
    isPlaceholder?: boolean;
};

export type DesignatedPlanningStaff = {
    id: string;
    employeeNumber: string;
    name: string;
    position: string;
    office: string;
    active: boolean;
    canManagePlans?: boolean;
    canManagePpas?: boolean;
    canManageMaps?: boolean;
    designatedAt: string;
    designatedBy: string;
};

export type PlanningMapPermissions = {
    canView: boolean;
    canCreate: boolean;
    canEdit: boolean;
    canArchive: boolean;
    canDelete: boolean;
    canManageStaff: boolean;
    accessLabel: string;
};

export const TALIBON_CENTER = { lat: 10.151, lng: 124.327 } as const;

export const TALIBON_BARANGAYS = [
    'Bagacay',
    'Balintawak',
    'Burgos',
    'Busalian',
    'Calituban',
    'Cataban',
    'Guindacpan',
    'Magsaysay',
    'Mahanay',
    'Nocnocan',
    'Poblacion',
    'Rizal',
    'Sag',
    'San Agustin',
    'San Carlos',
    'San Francisco',
    'San Isidro',
    'San Jose',
    'San Pedro',
    'San Roque',
    'Santo Niño',
    'Sikatuna',
    'Suba',
    'Tanghaligue',
    'Zamora',
] as const;

export const PLANNING_MAP_CATEGORY_META: Record<
    PlanningMapCategory,
    { label: string; shortLabel: string; color: string; tone: 'ok' | 'info' | 'warn' | 'danger' | 'neutral' }
> = {
    base_barangay: { label: 'Base & Barangay', shortLabel: 'Base Map', color: '#0e4d36', tone: 'ok' },
    clup_zoning: { label: 'CLUP & Zoning', shortLabel: 'CLUP / Zoning', color: '#1d4ed8', tone: 'info' },
    hazard_drrm: { label: 'Hazard & DRRM', shortLabel: 'Hazard / DRRM', color: '#b91c1c', tone: 'danger' },
    infrastructure_roads: { label: 'Infrastructure & Roads', shortLabel: 'Roads & Infra', color: '#b45309', tone: 'warn' },
    coastal_marine: { label: 'Coastal & Islands', shortLabel: 'Coastal / Marine', color: '#0f766e', tone: 'ok' },
};

export const PLANNING_MAP_TEMPLATES = [
    {
        id: 'ppdo-base',
        label: 'PPDO Bohol — Official Talibon Municipal Base Map',
        imageUrl: '/maps/talibon-ppdo-base.jpg',
        sourceAttribution: 'Provincial Planning and Development Office (PPDO) Bohol · NAMRIA / Cadastral Reference',
    },
    {
        id: 'barangay-boundaries',
        label: 'Talibon 25-Barangay Administrative Map',
        imageUrl: '/maps/talibon-barangay-base.jpg',
        sourceAttribution: 'Wikimedia Commons (CC BY-SA) — Talibon Municipal & Barangay Boundaries Reference',
    },
    {
        id: 'islands-hydrology',
        label: 'Talibon Coastal, Hydrology & Offshore Islands Reference',
        imageUrl: '/maps/talibon-islands.jpg',
        sourceAttribution: 'Wikimedia Commons (CC BY-SA) — Talibon Mainland & Offshore Islands Reference',
    },
    {
        id: 'clup-zoning',
        label: 'CLUP General Land Use & Zoning Reference Plate',
        imageUrl: '/maps/talibon-clup-zoning.jpg',
        sourceAttribution: 'MPDC Talibon Reference Template (derived from PPDO Bohol / NAMRIA base)',
    },
    {
        id: 'hazard-drrm',
        label: 'Flood, Liquefaction & Landslide Hazard Reference Plate',
        imageUrl: '/maps/talibon-hazard-drrm.jpg',
        sourceAttribution: 'MPDC / MDRRMO Talibon Reference Template (PHIVOLCS / MGB susceptibility style)',
    },
] as const;

export const DEFAULT_PLANNING_MAPS: PlanningMapRecord[] = [
    {
        id: 'map-tal-base-2026',
        code: 'TAL-BASE-2026',
        title: 'Municipal Base & 25-Barangay Map',
        category: 'base_barangay',
        status: 'published',
        description:
            'Official municipal base reference map of Talibon, Bohol detailing all 25 mainland and island barangay boundaries, coastlines, rivers/creeks, and classified road networks.',
        imageUrl: '/maps/talibon-ppdo-base.jpg',
        sourceAttribution: 'PPDO Bohol GIS Unit · Consolidated LAMP II / NAMRIA 1:50,000 Topographic Reference',
        barangays: ['All 25 Barangays'],
        scale: '1 : 100,000',
        projection: 'WGS84 / UTM Zone 51 North',
        effectivePeriod: '2025–2028',
        authority: 'PPDO Bohol / MPDC Talibon Reference Plate',
        lat: 10.151,
        lng: 124.327,
        legendNotes: 'Red: National Road · Brown: Provincial Road · Thin grey: Municipal & Barangay Roads · Dashed: Barangay & Municipal Boundaries.',
        updatedAt: '2026-11-10T09:30:00+08:00',
        updatedBy: 'Daniel Department Head (MPDC)',
        isPlaceholder: true,
    },
    {
        id: 'map-tal-clup-2026',
        code: 'TAL-CLUP-2026',
        title: 'CLUP General Land Use & Zoning Map',
        category: 'clup_zoning',
        status: 'published',
        description:
            'Comprehensive Land Use Plan (CLUP) zoning classification plate covering Poblacion urban commercial/institutional core, agricultural expansion bands, forestland, and coastal mangrove zones.',
        imageUrl: '/maps/talibon-clup-zoning.jpg',
        sourceAttribution: 'MPDC Talibon · Reference Thematic Plate derived from PPDO Bohol Base Geometry',
        barangays: ['Poblacion', 'San Jose', 'San Isidro', 'San Pedro', 'San Francisco', 'Balintawak', 'San Carlos'],
        scale: '1 : 50,000',
        projection: 'WGS84 / UTM Zone 51 North',
        effectivePeriod: '2020–2029',
        authority: 'SB Ordinance No. 2020-04 (CLUP Reference)',
        lat: 10.1465,
        lng: 124.3115,
        legendNotes: 'Emerald: Forest & Mangrove Reserve · Gold: Agricultural / Cropland · Crimson: Urban Commercial & Institutional Core · Teal: Coastal / Fishpond.',
        updatedAt: '2026-11-08T14:15:00+08:00',
        updatedBy: 'Amihan Rivera (MPDC Designated Staff)',
        isPlaceholder: true,
    },
    {
        id: 'map-tal-drrm-2026',
        code: 'TAL-DRRM-2026',
        title: 'Flood, Liquefaction & Landslide Susceptibility Map',
        category: 'hazard_drrm',
        status: 'published',
        description:
            'Multi-hazard planning plate identifying coastal liquefaction/storm-surge exposure along Poblacion–San Francisco–San Pedro and rain-induced landslide zones across upland Rizal and Magsaysay.',
        imageUrl: '/maps/talibon-hazard-drrm.jpg',
        sourceAttribution: 'MPDC / MDRRMO Talibon · Reference DRRM Plate (MGB / PHIVOLCS Classification Scheme)',
        barangays: ['Poblacion', 'San Francisco', 'San Pedro', 'Rizal', 'Magsaysay', 'Sikatuna', 'Zamora'],
        scale: '1 : 50,000',
        projection: 'WGS84 / UTM Zone 51 North',
        effectivePeriod: '2025–2028',
        authority: 'Talibon LDRRMP / MPDC Hazard Reference',
        lat: 10.1185,
        lng: 124.289,
        legendNotes: 'Red: High Susceptibility · Amber: Moderate Susceptibility · Blue Hatch: Coastal Flood / Storm Surge Corridor.',
        updatedAt: '2026-11-05T11:00:00+08:00',
        updatedBy: 'Amihan Rivera (MPDC Designated Staff)',
        isPlaceholder: true,
    },
    {
        id: 'map-tal-admin-2026',
        code: 'TAL-BRGY-2026',
        title: '25-Barangay Political & Administrative Reference',
        category: 'base_barangay',
        status: 'published',
        description:
            'Color-coded administrative reference identifying mainland and island barangay jurisdictions from Burgos–Magsaysay in the west to San Agustin–San Roque and offshore island communities.',
        imageUrl: '/maps/talibon-barangay-base.jpg',
        sourceAttribution: 'Wikimedia Commons (CC BY-SA) — Talibon Political Subdivisions Reference',
        barangays: ['All 25 Barangays'],
        scale: '1 : 80,000',
        projection: 'WGS84 Geographic',
        effectivePeriod: '2025–2028',
        authority: 'MPDC / DILG Barangay Directory Reference',
        lat: 10.1355,
        lng: 124.306,
        legendNotes: 'Distinct color fills indicate official barangay jurisdiction polygons across mainland and Danajon Bank island barangays.',
        updatedAt: '2026-10-29T16:40:00+08:00',
        updatedBy: 'Daniel Department Head (MPDC)',
        isPlaceholder: true,
    },
    {
        id: 'map-tal-coast-2026',
        code: 'TAL-COAST-2026',
        title: 'Offshore Islands, Coastal & Hydrology Map',
        category: 'coastal_marine',
        status: 'published',
        description:
            'Hydrological and island-barangay spatial reference highlighting Mahanay, Busalian, Suba, Calituban, Guindacpan, Sag, Cataban, and Nocnocan along the Danajon Double Barrier Reef corridor.',
        imageUrl: '/maps/talibon-islands.jpg',
        sourceAttribution: 'Wikimedia Commons (CC BY-SA) — Talibon Hydrology & Offshore Islands Reference',
        barangays: ['Mahanay', 'Busalian', 'Suba', 'Calituban', 'Guindacpan', 'Sag', 'Cataban', 'Nocnocan'],
        scale: '1 : 75,000',
        projection: 'WGS84 / UTM Zone 51 North',
        effectivePeriod: '2025–2028',
        authority: 'MPDC / Coastal Resource Management Plan',
        lat: 10.228,
        lng: 124.318,
        legendNotes: 'Shaded islands denote Talibon municipal jurisdiction; fine inland lines trace watershed creeks draining toward northern Bohol Sea.',
        updatedAt: '2026-10-22T10:20:00+08:00',
        updatedBy: 'Bituin Santos (MPDC Designated Staff)',
        isPlaceholder: true,
    },
    {
        id: 'map-tal-infra-2026',
        code: 'TAL-INFRA-2026',
        title: 'Priority Road Network & 20% DF Infrastructure Locator',
        category: 'infrastructure_roads',
        status: 'published',
        description:
            'Corridor reference mapping the National Circumferential Highway (Bagacay–Tanghaligue–Sto. Niño–San Jose–Poblacion–San Agustin–San Roque) and priority farm-to-market road linkages.',
        imageUrl: '/maps/talibon-ppdo-base.jpg',
        sourceAttribution: 'PPDO Bohol / Municipal Engineering Office Unified Mapping Program (UMP) Reference',
        barangays: ['Bagacay', 'Tanghaligue', 'Santo Niño', 'San Jose', 'Poblacion', 'Balintawak', 'San Agustin', 'San Roque'],
        scale: '1 : 100,000',
        projection: 'WGS84 / UTM Zone 51 North',
        effectivePeriod: '2026 AIP',
        authority: 'MPDC / Municipal Engineering Office (AIP 2026)',
        lat: 10.1415,
        lng: 124.281,
        legendNotes: 'Highlights primary arterial corridors and priority farm-to-market infrastructure projects tracked under the 2026 AIP.',
        updatedAt: '2026-11-12T08:45:00+08:00',
        updatedBy: 'Daniel Department Head (MPDC)',
        isPlaceholder: true,
    },
    {
        id: 'map-tal-clup-2027-draft',
        code: 'TAL-CLUP-2027-DRAFT',
        title: '2027 Coastal Growth Node & Port Expansion Draft',
        category: 'clup_zoning',
        status: 'draft',
        description:
            'Working MPDC draft proposing updated port-zone setbacks, public market buffer zones, and climate-resilient drainage easements in Poblacion and San Jose ahead of Sangguniang Bayan review.',
        imageUrl: '/maps/talibon-clup-zoning.jpg',
        sourceAttribution: 'MPDC Talibon Working Draft — Internal Review Only',
        barangays: ['Poblacion', 'San Jose', 'San Isidro'],
        scale: '1 : 25,000',
        projection: 'WGS84 / UTM Zone 51 North',
        effectivePeriod: 'Proposed 2027–2032',
        authority: 'Pending Sangguniang Bayan Review',
        lat: 10.1615,
        lng: 124.3395,
        legendNotes: 'Draft working layer — visible only to MPDC Department Head and Designated MPDC Staff until published.',
        updatedAt: '2026-11-14T10:10:00+08:00',
        updatedBy: 'Amihan Rivera (MPDC Designated Staff)',
        isPlaceholder: true,
    },
];

export const DEFAULT_DESIGNATED_STAFF: DesignatedPlanningStaff[] = [
    {
        id: 'mpdc-staff-1',
        employeeNumber: 'SYN-106',
        name: 'Amihan Rivera',
        position: 'Planning Officer II',
        office: 'MPDO',
        active: true,
        canManagePlans: true,
        canManagePpas: true,
        canManageMaps: true,
        designatedAt: '2026-09-01',
        designatedBy: 'Daniel Department Head',
    },
    {
        id: 'mpdc-staff-2',
        employeeNumber: 'SYN-202',
        name: 'Bituin Santos',
        position: 'Project Evaluation Officer I',
        office: 'MPDO',
        active: true,
        canManagePlans: true,
        canManagePpas: true,
        canManageMaps: false,
        designatedAt: '2026-09-15',
        designatedBy: 'Daniel Department Head',
    },
    {
        id: 'mpdc-staff-3',
        employeeNumber: 'SYN-203',
        name: 'Cielo Navarro',
        position: 'Draftsman / GIS Aide',
        office: 'MPDO',
        active: true,
        canManagePlans: false,
        canManagePpas: false,
        canManageMaps: true,
        designatedAt: '2026-10-03',
        designatedBy: 'Daniel Department Head',
    },
    {
        id: 'mpdc-staff-4',
        employeeNumber: 'SYN-204',
        name: 'Dalisay Flores',
        position: 'Statistician I',
        office: 'MPDO',
        active: false,
        canManagePlans: false,
        canManagePpas: false,
        canManageMaps: false,
        designatedAt: '2026-10-03',
        designatedBy: 'Daniel Department Head',
    },
    {
        id: 'mpdc-staff-5',
        employeeNumber: 'SYN-205',
        name: 'Elio Mercado',
        position: 'Planning Assistant',
        office: 'MPDO',
        active: false,
        canManagePlans: false,
        canManagePpas: false,
        canManageMaps: false,
        designatedAt: '2026-10-03',
        designatedBy: 'Daniel Department Head',
    },
];

const MAPS_STORAGE_KEY = 'ot.planningMaps.v1';
const STAFF_STORAGE_KEY = 'ot.planningMaps.designatedStaff.v1';

export function loadPlanningMaps(seed?: PlanningMapRecord[]): PlanningMapRecord[] {
    if (seed && seed.length > 0) return seed;
    if (typeof window === 'undefined') return DEFAULT_PLANNING_MAPS;
    try {
        const raw = window.localStorage.getItem(MAPS_STORAGE_KEY);
        if (!raw) return DEFAULT_PLANNING_MAPS;
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed as PlanningMapRecord[];
    } catch {
        // Fallback cleanly to deterministic seed
    }
    return DEFAULT_PLANNING_MAPS;
}

export function savePlanningMaps(records: PlanningMapRecord[]): void {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.setItem(MAPS_STORAGE_KEY, JSON.stringify(records));
    } catch {
        // Ignore storage quota errors cleanly
    }
}

export function resetPlanningMaps(): PlanningMapRecord[] {
    if (typeof window !== 'undefined') {
        try {
            window.localStorage.removeItem(MAPS_STORAGE_KEY);
        } catch {
            // Ignore
        }
    }
    return DEFAULT_PLANNING_MAPS;
}

export function normalizeDesignatedStaff(list: DesignatedPlanningStaff[]): DesignatedPlanningStaff[] {
    return list.map((member) => ({
        ...member,
        canManagePlans: member.canManagePlans ?? member.active,
        canManagePpas: member.canManagePpas ?? member.active,
        canManageMaps: member.canManageMaps ?? member.active,
    }));
}

export function loadDesignatedStaff(seed?: DesignatedPlanningStaff[]): DesignatedPlanningStaff[] {
    if (seed && seed.length > 0) return normalizeDesignatedStaff(seed);
    if (typeof window === 'undefined') return DEFAULT_DESIGNATED_STAFF;
    try {
        const raw = window.localStorage.getItem(STAFF_STORAGE_KEY);
        if (!raw) return DEFAULT_DESIGNATED_STAFF;
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
            return normalizeDesignatedStaff(parsed as DesignatedPlanningStaff[]);
        }
    } catch {
        // Fallback cleanly
    }
    return DEFAULT_DESIGNATED_STAFF;
}

export function saveDesignatedStaff(staff: DesignatedPlanningStaff[]): void {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.setItem(STAFF_STORAGE_KEY, JSON.stringify(staff));
    } catch {
        // Ignore
    }
}

export function resolvePlanningMapPermissions(
    user: AuthUser | null,
    workspaceExperience: WorkspaceExperience | null,
    designatedStaff: DesignatedPlanningStaff[],
    override?: Partial<PlanningMapPermissions>,
): PlanningMapPermissions {
    const deptCode = (user?.employee?.department?.code || user?.employee?.department?.short_name || '').toUpperCase();
    const isMpdcOffice = deptCode === 'MPDO' || deptCode === 'MPDC';
    const role = (user?.role || '').toLowerCase();
    const empNo = user?.employee?.employee_number || '';
    const userName = (user?.name || '').trim().toLowerCase();

    const isMpdcHead = isMpdcOffice && (role === 'department_head' || workspaceExperience === 'department_head');
    const isDesignated =
        isMpdcOffice &&
        (role === 'mpdc_designated_staff' ||
            designatedStaff.some(
                (member) =>
                    member.active &&
                    (member.canManageMaps ?? true) &&
                    ((empNo && member.employeeNumber === empNo) || member.name.trim().toLowerCase() === userName),
            ));

    const computed: PlanningMapPermissions = {
        canView: true,
        canCreate: isMpdcHead || isDesignated,
        canEdit: isMpdcHead || isDesignated,
        canArchive: isMpdcHead || isDesignated,
        canDelete: isMpdcHead,
        canManageStaff: isMpdcHead,
        accessLabel: isMpdcHead
            ? 'MPDC Department Head · Full Map Management & Staff Authorization'
            : isDesignated
              ? 'MPDC Designated Staff · Map Editor Access'
              : 'All-Staff View · Read-Only Published Maps',
    };

    return { ...computed, ...override };
}
