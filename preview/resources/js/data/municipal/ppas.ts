import type { PPARecord, PPAPriority, PPAStatus } from './ppas.types';

const seeds = [
    ['Farm-to-market road maintenance', 'Agriculture', 'Municipal Engineering Office', 'Infrastructure Development Plan', '20% Development Fund', 'Road sections serving agricultural production areas', 'plan-ldip-2026-2028', 'map-tal-infra-2026', '4.2 km farm-to-market gravel road graded & compacted', ['San Agustin', 'Zamora', 'Sikatuna'], 0, 450_000, 3_800_000],
    ['High-value crop production support', 'Agriculture', 'Municipal Agriculture Office', 'Agriculture and Fisheries Development Plan', 'General Fund', 'Inputs, technical assistance, and field monitoring for priority crops', 'plan-cdp-2023-2028', 'map-tal-base-2026', '350 farmer-beneficiaries assisted with certified seeds & inputs', ['Bagacay', 'Rizal', 'Magsaysay'], 0, 1_450_000, 350_000],
    ['Municipal fisheries livelihood support', 'Fisheries', 'Municipal Agriculture Office', 'Agriculture and Fisheries Development Plan', 'General Fund', 'Livelihood support for organized fisherfolk groups', 'plan-cdp-2023-2028', 'map-tal-coast-2026', '14 coastal & island fisherfolk associations equipped', ['Calituban', 'Guindacpan', 'Mahanay', 'Nocnocan'], 0, 1_200_000, 600_000],
    ['Coastal resource management activities', 'Environment', 'Municipal Environment and Natural Resources Office', 'Coastal Resource Management Plan', 'General Fund', 'Coastal habitat monitoring and barangay coordination', 'plan-lccap-2021-2030', 'map-tal-coast-2026', '12 marine sanctuary & mangrove monitoring patrols completed', ['Busalian', 'Suba', 'Cataban', 'Sag'], 0, 980_000, 220_000],
    ['Solid waste diversion program', 'Environment', 'Municipal Environment and Natural Resources Office', 'Ten-Year Ecological Solid Waste Management Plan', 'General Fund', 'Waste diversion, recovery, and barangay compliance activities', 'plan-ecological-solid-waste-2025-2034', 'map-tal-base-2026', '25 barangay MRFs monitored with 40% diversion target', ['All 25 Barangays'], 0, 1_650_000, 850_000],
    ['Drainage rehabilitation program', 'Infrastructure', 'Municipal Engineering Office', 'Local Development Investment Program', '20% Development Fund', 'Priority drainage lines with recurring flooding or blockages', 'plan-ldip-2026-2028', 'map-tal-drrm-2026', '820 linear meters of poblacion storm drainage desilted & lined', ['Poblacion', 'San Jose', 'San Isidro'], 0, 300_000, 4_200_000],
    ['Local road rehabilitation program', 'Infrastructure', 'Municipal Engineering Office', 'Local Development Investment Program', '20% Development Fund', 'Municipal and barangay road sections prioritized for rehabilitation', 'plan-ldip-2026-2028', 'map-tal-infra-2026', '1.8 km priority municipal & barangay road concrete paving', ['Poblacion', 'Balintawak', 'San Carlos', 'San Roque'], 0, 250_000, 6_500_000],
    ['Public market facility improvements', 'Economic', 'Municipal Economic Enterprise Office', 'Economic Development Plan', 'Economic Enterprise Fund', 'Repairs and operational improvements in public market facilities', 'plan-cdp-2023-2028', 'map-tal-clup-2026', 'Wet & dry market ventilation, sanitation, and stall upgrades', ['Poblacion'], 0, 720_000, 2_400_000],
    ['Water system rehabilitation support', 'Infrastructure', 'Municipal Engineering Office', 'Local Development Investment Program', '20% Development Fund', 'Support for priority communal and municipal water facilities', 'plan-ldip-2026-2028', 'map-tal-infra-2026', '6 barangay Level II/III potable water systems rehabilitated', ['Santo Niño', 'Tanghaligue', 'Burgos'], 0, 400_000, 3_600_000],
    ['Health center maintenance program', 'Health', 'Municipal Health Office', 'Local Health Investment Plan', 'General Fund', 'Facility maintenance and service readiness for rural health operations', 'plan-cdp-2023-2028', 'map-tal-base-2026', 'RHU & 12 barangay health stations upgraded for PhilHealth Konsulta', ['All 25 Barangays'], 0, 1_350_000, 950_000],
    ['Maternal and child health services', 'Health', 'Municipal Health Office', 'Local Health Investment Plan', 'General Fund', 'Community-based maternal, newborn, and child health services', 'plan-local-nutrition-2026-2028', 'map-tal-base-2026', '100% prenatal tracking & safe birthing supply readiness', ['All 25 Barangays'], 240_000, 1_560_000, 0],
    ['Nutrition intervention program', 'Health', 'Municipal Health Office', 'Local Nutrition Action Plan', 'General Fund', 'Nutrition assessment and intervention for priority households', 'plan-local-nutrition-2026-2028', 'map-tal-base-2026', 'Operation Timbang Plus & supplementary feeding across 25 barangays', ['All 25 Barangays'], 0, 1_180_000, 0],
    ['Senior citizen support services', 'Social Protection', 'Municipal Social Welfare and Development Office', 'Social Protection Development Plan', 'General Fund', 'Municipal support services and coordinated assistance for senior citizens', 'plan-aip-2027', 'map-tal-base-2026', '1,200+ OSCA-registered senior citizens served with quarterly assistance', ['All 25 Barangays'], 0, 2_100_000, 0],
    ['Persons with disability support services', 'Social Protection', 'Municipal Social Welfare and Development Office', 'Social Protection Development Plan', 'General Fund', 'Referral, assistance, and accessibility support for registered clients', 'plan-aip-2027', 'map-tal-base-2026', 'PDAO registry updated & assistive devices issued to priority clients', ['All 25 Barangays'], 0, 1_250_000, 150_000],
    ['Child protection activities', 'Social Protection', 'Municipal Social Welfare and Development Office', 'Local Council for the Protection of Children Plan', 'General Fund', 'Case coordination, prevention activities, and council support', 'plan-cdp-2023-2028', 'map-tal-base-2026', '25 BCPC assemblies strengthened & child-friendly audit targets met', ['All 25 Barangays'], 0, 890_000, 0],
    ['Women and family welfare activities', 'Social Protection', 'Municipal Social Welfare and Development Office', 'Gender and Development Plan and Budget', 'GAD Fund', 'Community activities supporting women, families, and referral mechanisms', 'plan-gad-2027', 'map-tal-base-2026', 'VAWC desk strengthening & livelihood referral for 180 women clients', ['All 25 Barangays'], 0, 1_420_000, 0],
    ['Disaster preparedness program', 'Disaster Risk Reduction', 'Municipal Disaster Risk Reduction and Management Office', 'Local Disaster Risk Reduction and Management Plan', 'LDRRM Fund', 'Preparedness, prepositioning, drills, and barangay coordination', 'plan-ldrrmp-2025-2027', 'map-tal-drrm-2026', 'Quarterly municipal & island barangay early-warning drills conducted', ['All 25 Barangays'], 0, 2_300_000, 900_000],
    ['Emergency response equipment readiness', 'Disaster Risk Reduction', 'Municipal Disaster Risk Reduction and Management Office', 'Local Disaster Risk Reduction and Management Plan', 'LDRRM Fund', 'Readiness checks, maintenance, and replacement of response equipment', 'plan-ldrrmp-2025-2027', 'map-tal-drrm-2026', 'Rescue boats, radios, and trauma kits calibrated & prepositioned', ['Poblacion', 'Calituban', 'Mahanay', 'Guindacpan'], 0, 750_000, 2_150_000],
    ['Flood-prone area mitigation activities', 'Disaster Risk Reduction', 'Municipal Engineering Office', 'Local Disaster Risk Reduction and Management Plan', 'LDRRM Fund', 'Mitigation works and monitoring for identified flood-prone locations', 'plan-ldrrmp-2025-2027', 'map-tal-drrm-2026', 'Riprap slope protection & river gauge markers installed in hazard zones', ['Poblacion', 'San Francisco', 'San Pedro'], 0, 400_000, 3_400_000],
    ['Youth development activities', 'Youth', 'Municipal Mayor’s Office', 'Local Youth Development Plan', 'General Fund', 'Municipal youth participation, leadership, and development activities', 'plan-ela-2025-2028', 'map-tal-base-2026', '25 SK councils engaged in leadership & civic workshops', ['All 25 Barangays'], 0, 950_000, 0],
    ['Sports development program', 'Youth', 'Municipal Mayor’s Office', 'Local Youth Development Plan', 'General Fund', 'Municipal sports activities and barangay participation support', 'plan-ela-2025-2028', 'map-tal-base-2026', 'Inter-barangay athletic meets & grassroots training clinics', ['All 25 Barangays'], 0, 1_100_000, 250_000],
    ['Tourism site maintenance program', 'Tourism', 'Municipal Tourism Office', 'Local Tourism Development Plan', 'General Fund', 'Maintenance and visitor-readiness activities for identified tourism sites', 'plan-tourism-2024-2028', 'map-tal-coast-2026', 'Port welcome signage, eco-trail upkeep & island tourism readiness', ['Poblacion', 'Busalian', 'Suba', 'Mahanay'], 0, 820_000, 680_000],
    ['Tourism promotion and events support', 'Tourism', 'Municipal Tourism Office', 'Local Tourism Development Plan', 'General Fund', 'Municipal tourism calendar and destination information activities', 'plan-tourism-2024-2028', 'map-tal-coast-2026', 'Annual Talibon fiesta, heritage & island eco-tourism collateral', ['All 25 Barangays'], 0, 740_000, 0],
    ['Business one-stop-shop operations', 'Economic', 'Business Permits and Licensing Office', 'Economic Development Plan', 'General Fund', 'Coordinated permitting support during renewal and regular operations', 'plan-ela-2025-2028', 'map-tal-clup-2026', 'Streamlined annual BOSS permit renewal with < 2-day turnaround', ['Poblacion'], 180_000, 620_000, 150_000],
    ['Local investment promotion activities', 'Economic', 'Municipal Planning and Development Office', 'Economic Development Plan', 'General Fund', 'Investment information, coordination, and local enterprise support', 'plan-cdp-2023-2028', 'map-tal-clup-2026', 'Updated Talibon investment profile & MSME briefing kits', ['Poblacion'], 0, 560_000, 0],
    ['Skills training and livelihood assistance', 'Employment', 'Public Employment Service Office', 'Local Development Investment Program', 'General Fund', 'Skills referral and livelihood assistance for identified beneficiaries', 'plan-ldip-2026-2028', 'map-tal-base-2026', '240 residents trained with TESDA-aligned vocational certifications', ['All 25 Barangays'], 0, 1_050_000, 0],
    ['Employment facilitation services', 'Employment', 'Public Employment Service Office', 'Local Development Investment Program', 'General Fund', 'Job matching, referral, and employer coordination activities', 'plan-ldip-2026-2028', 'map-tal-base-2026', '4 municipal job fairs & SPES summer youth placements delivered', ['All 25 Barangays'], 150_000, 680_000, 0],
    ['Civil registry records preservation', 'Governance', 'Municipal Civil Registrar', 'Governance Development Plan', 'General Fund', 'Preservation and indexing support for civil registry records', 'plan-cdp-2023-2028', 'map-tal-base-2026', '15,000+ historical civil registry books digitized & archival-indexed', ['Poblacion'], 0, 520_000, 380_000],
    ['Records management improvement program', 'Governance', 'Municipal Administrator’s Office', 'Governance Development Plan', 'General Fund', 'File organization, retention, and inter-office records coordination', 'plan-ela-2025-2028', 'map-tal-base-2026', 'Unified LGU document retention schedule rolled out across all offices', ['Poblacion'], 0, 640_000, 260_000],
    ['Barangay development coordination', 'Governance', 'Municipal Planning and Development Office', 'Comprehensive Development Plan', 'General Fund', 'Technical coordination for barangay planning and investment programming', 'plan-cdp-2023-2028', 'map-tal-base-2026', '25 Barangay Development Plans aligned with Talibon CDP & AIP', ['All 25 Barangays'], 0, 780_000, 0],
] as const;

const sectorPrefix: Record<string, string> = {
    Governance: '1000',
    Health: '3000',
    'Social Protection': '3000',
    Youth: '3000',
    Agriculture: '8000',
    Fisheries: '8000',
    Infrastructure: '8000',
    Economic: '8000',
    Tourism: '8000',
    Employment: '8000',
    Environment: '9000',
    'Disaster Risk Reduction': '9000',
};

const statuses: PPAStatus[] = ['Ongoing', 'Ongoing', 'Planned', 'For Procurement', 'Completed', 'On Hold'];
const priorities: PPAPriority[] = ['High', 'Medium', 'Routine'];
const years = [2025, 2026, 2027];

export const ppaRecords: PPARecord[] = seeds.flatMap((seed, seedIndex) =>
    years.map((year, yearIndex) => {
        const scale = year === 2025 ? 0.92 : year === 2026 ? 1 : 1.08;
        const budgetPs = Math.round((seed[10] * scale) / 10_000) * 10_000;
        const budgetMooe = Math.round((seed[11] * scale) / 10_000) * 10_000;
        const budgetCo = Math.round((seed[12] * scale) / 10_000) * 10_000;
        const budgetTotal = budgetPs + budgetMooe + budgetCo;
        const isClimate = seed[1] === 'Environment' || seed[1] === 'Disaster Risk Reduction' || seed[1] === 'Agriculture';
        const isDrrm = seed[1] === 'Disaster Risk Reduction';
        const isGad = seed[4] === 'GAD Fund' || seed[1] === 'Social Protection' || seed[1] === 'Health';

        return {
            id: `PPA-${year}-${String(seedIndex + 1).padStart(3, '0')}`,
            aipRefCode: `${sectorPrefix[seed[1]] ?? '8000'}-000-3-${yearIndex + 1}-${String(seedIndex + 1).padStart(2, '0')}-001`,
            title: seed[0],
            sector: seed[1],
            responsibleOffice: seed[2],
            year,
            relatedDevelopmentPlan: seed[3],
            linkedPlanId: seed[6],
            linkedMapId: seed[7],
            fundingSource: seed[4],
            status: statuses[(seedIndex + yearIndex) % statuses.length],
            relatedProjectCount: (seedIndex * 2 + yearIndex) % 7,
            priority: priorities[(seedIndex + yearIndex) % priorities.length],
            implementationContext: seed[5],
            expectedOutputs: seed[8],
            scheduleStart: `Jan ${year}`,
            scheduleEnd: `Dec ${year}`,
            barangays: [...seed[9]],
            budgetPs,
            budgetMooe,
            budgetCo,
            budgetTotal,
            ccaAmount: isClimate ? Math.round(budgetTotal * 0.45) : undefined,
            ccmAmount: seed[1] === 'Environment' ? Math.round(budgetTotal * 0.25) : undefined,
            gadAttributed: isGad,
            drrmTagged: isDrrm,
            updatedAt: `${year}-09-${String(10 + (seedIndex % 15)).padStart(2, '0')}`,
            updatedBy: 'MPDC Planning Desk',
        };
    }),
);

export const ppaOptions = {
    sectors: [...new Set(ppaRecords.map((item) => item.sector))].sort(),
    offices: [...new Set(ppaRecords.map((item) => item.responsibleOffice))].sort(),
    years: [...new Set(ppaRecords.map((item) => String(item.year)))].sort(),
    plans: [...new Set(ppaRecords.map((item) => item.relatedDevelopmentPlan))].sort(),
    fundingSources: [...new Set(ppaRecords.map((item) => item.fundingSource))].sort(),
    statuses: [
        'Draft',
        'For MPDC Review',
        'Planned',
        'For Procurement',
        'Ongoing',
        'Completed',
        'On Hold',
        'Archived',
    ] as PPAStatus[],
};

const PPAS_STORAGE_KEY = 'ot.planningPpas.v1';

const LEGACY_MAP_ID_ALIASES: Record<string, string> = {
    'map-talibon-base-2026': 'map-tal-base-2026',
    'map-talibon-clup-zoning': 'map-tal-clup-2026',
    'map-talibon-drrm-hazard': 'map-tal-drrm-2026',
    'map-talibon-coastal-islands': 'map-tal-coast-2026',
    'map-talibon-infra-roads': 'map-tal-infra-2026',
};

export function loadPpaRecords(): PPARecord[] {
    if (typeof window === 'undefined') return ppaRecords;
    try {
        const raw = window.localStorage.getItem(PPAS_STORAGE_KEY);
        if (!raw) return ppaRecords;
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
            return (parsed as PPARecord[]).map((item) => ({
                ...item,
                linkedMapId: item.linkedMapId
                    ? (LEGACY_MAP_ID_ALIASES[item.linkedMapId] ?? item.linkedMapId)
                    : undefined,
            }));
        }
    } catch {
        // Fallback cleanly to deterministic seed
    }
    return ppaRecords;
}

export function savePpaRecords(records: PPARecord[]): void {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.setItem(PPAS_STORAGE_KEY, JSON.stringify(records));
    } catch {
        // Ignore storage limits cleanly
    }
}

export function exportPpasToCsv(records: PPARecord[]): string {
    const headers = [
        'AIP Reference Code',
        'Portal ID',
        'Program / Project / Activity',
        'Implementing Office',
        'Sector',
        'Year',
        'Schedule Start',
        'Schedule End',
        'Expected Outputs',
        'Funding Source',
        'PS (PHP)',
        'MOOE (PHP)',
        'CO (PHP)',
        'Total Allocation (PHP)',
        'CCA (PHP)',
        'CCM (PHP)',
        'GAD Attributed',
        'Parent Development Plan',
        'Status',
        'Priority',
        'Covered Barangays',
    ];
    const escapeCell = (val: unknown) => {
        const str = String(val ?? '');
        return /[",\n]/.test(str) ? `"${str.replaceAll('"', '""')}"` : str;
    };
    const rows = records.map((r) => [
        r.aipRefCode,
        r.id,
        r.title,
        r.responsibleOffice,
        r.sector,
        r.year,
        r.scheduleStart,
        r.scheduleEnd,
        r.expectedOutputs,
        r.fundingSource,
        r.budgetPs,
        r.budgetMooe,
        r.budgetCo,
        r.budgetTotal,
        r.ccaAmount ?? 0,
        r.ccmAmount ?? 0,
        r.gadAttributed ? 'Yes' : 'No',
        r.relatedDevelopmentPlan,
        r.status,
        r.priority,
        r.barangays.join('; '),
    ]);
    return [headers, ...rows].map((row) => row.map(escapeCell).join(',')).join('\n');
}
