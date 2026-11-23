<?php

declare(strict_types=1);

namespace App\Services\Planning;

use App\Models\Department;
use App\Models\DevelopmentPlan;
use App\Models\PlanningMap;
use App\Models\PpaRecord;
use Illuminate\Support\Facades\Schema;

final class PlanningSuiteInitializer
{
    public function ensureInitialized(): void
    {
        if (! Schema::hasTable('development_plans')) {
            return;
        }

        $mpdo = Department::query()->whereIn('code', ['MPDO', 'MPDC'])->first();
        $mpdoId = $mpdo?->id;

        if (DevelopmentPlan::query()->count() === 0) {
            foreach ($this->defaultPlans($mpdoId) as $plan) {
                DevelopmentPlan::query()->firstOrCreate(
                    ['code' => $plan['code']],
                    $plan,
                );
            }
        }

        if (Schema::hasTable('ppa_records') && PpaRecord::query()->count() === 0) {
            foreach ($this->defaultPpas() as $ppa) {
                PpaRecord::query()->firstOrCreate(
                    ['ppa_code' => $ppa['ppa_code']],
                    $ppa,
                );
            }
        }

        if (Schema::hasTable('planning_maps') && PlanningMap::query()->count() === 0) {
            foreach ($this->defaultMaps($mpdoId) as $map) {
                PlanningMap::query()->firstOrCreate(
                    ['map_code' => $map['map_code']],
                    $map,
                );
            }
        }
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function defaultPlans(?int $mpdoId): array
    {
        return [
            [
                'plan_key' => 'plan-cdp-2023-2028',
                'code' => 'CDP 2023–2028',
                'title' => 'Comprehensive Development Plan',
                'horizon' => 'Six-year',
                'lead_office' => 'Municipal Planning and Development Office',
                'lead_department_id' => $mpdoId,
                'coordinating_offices' => ['Office of the Municipal Mayor', 'Municipal Engineering Office', 'Municipal Social Welfare and Development Office'],
                'coverage_start' => 2023,
                'coverage_end' => 2028,
                'status' => 'In force',
                'sections_complete' => 18,
                'sections_total' => 18,
                'last_action' => 'Annual implementation review recorded',
                'last_action_date' => '2026-08-28',
                'next_milestone' => '2027 planning assumptions review',
                'next_milestone_date' => '2026-10-09',
                'required_action' => 'Sector focal offices to confirm updated indicators before the review session.',
                'authority' => 'Sangguniang Bayan adoption record on file',
                'document_ref' => 'MPDO-PLAN-CDP-2023-2028',
                'provenance_status' => 'reference_sample',
            ],
            [
                'plan_key' => 'plan-ela-2025-2028',
                'code' => 'ELA 2025–2028',
                'title' => 'Executive-Legislative Agenda',
                'horizon' => 'Three-year',
                'lead_office' => 'Office of the Municipal Mayor',
                'lead_department_id' => $mpdoId,
                'coordinating_offices' => ['Sangguniang Bayan Secretariat', 'Municipal Planning and Development Office'],
                'coverage_start' => 2025,
                'coverage_end' => 2028,
                'status' => 'In force',
                'sections_complete' => 11,
                'sections_total' => 11,
                'last_action' => 'Priority commitments reconciled with current work program',
                'last_action_date' => '2026-09-02',
                'next_milestone' => 'Executive-legislative progress review',
                'next_milestone_date' => '2026-10-16',
                'required_action' => 'Lead offices to submit status notes for commitments marked for joint action.',
                'authority' => 'Joint executive-legislative adoption record on file',
                'document_ref' => 'OMM-SB-ELA-2025-2028',
                'provenance_status' => 'reference_sample',
            ],
            [
                'plan_key' => 'plan-clup-2020-2029',
                'code' => 'CLUP 2020–2029',
                'title' => 'Comprehensive Land Use Plan',
                'horizon' => 'Long-term',
                'lead_office' => 'Municipal Planning and Development Office',
                'lead_department_id' => $mpdoId,
                'coordinating_offices' => ['Municipal Engineering Office', 'Municipal Assessor’s Office', 'Municipal Environment and Natural Resources Office'],
                'coverage_start' => 2020,
                'coverage_end' => 2029,
                'status' => 'For review',
                'sections_complete' => 14,
                'sections_total' => 16,
                'last_action' => 'Land-use data update consolidated',
                'last_action_date' => '2026-08-19',
                'next_milestone' => 'Technical review of updated land-use tables',
                'next_milestone_date' => '2026-09-24',
                'required_action' => 'Planning and Assessor teams to reconcile parcel-level exceptions before technical review.',
                'authority' => 'Existing adoption and zoning references linked to planning file',
                'document_ref' => 'MPDO-PLAN-CLUP-2020-2029',
                'provenance_status' => 'reference_sample',
            ],
            [
                'plan_key' => 'plan-aip-2027',
                'code' => 'AIP 2027',
                'title' => 'Annual Investment Program',
                'horizon' => 'Annual',
                'lead_office' => 'Municipal Planning and Development Office',
                'lead_department_id' => $mpdoId,
                'coordinating_offices' => ['Municipal Budget Office', 'Municipal Accounting Office', 'Office of the Municipal Mayor'],
                'coverage_start' => 2027,
                'coverage_end' => 2027,
                'status' => 'Updating',
                'sections_complete' => 7,
                'sections_total' => 10,
                'last_action' => 'Office submissions consolidated for technical review',
                'last_action_date' => '2026-09-11',
                'next_milestone' => 'Budget alignment conference',
                'next_milestone_date' => '2026-09-21',
                'required_action' => 'Offices with unresolved cost or schedule entries must submit corrections before conference.',
                'authority' => 'Preparation cycle under the local planning and budgeting calendar',
                'document_ref' => 'MPDO-AIP-2027-WORKING',
                'provenance_status' => 'reference_sample',
            ],
            [
                'plan_key' => 'plan-ldip-2026-2028',
                'code' => 'LDIP 2026–2028',
                'title' => 'Local Development Investment Program',
                'horizon' => 'Three-year',
                'lead_office' => 'Municipal Planning and Development Office',
                'lead_department_id' => $mpdoId,
                'coordinating_offices' => ['Municipal Budget Office', 'Municipal Engineering Office', 'Municipal Treasurer’s Office'],
                'coverage_start' => 2026,
                'coverage_end' => 2028,
                'status' => 'In force',
                'sections_complete' => 12,
                'sections_total' => 12,
                'last_action' => 'Project financing references synchronized',
                'last_action_date' => '2026-08-31',
                'next_milestone' => 'Quarterly investment program review',
                'next_milestone_date' => '2026-10-05',
                'required_action' => 'Project owners to verify obligation schedules and implementation status.',
                'authority' => 'Local development investment programming record',
                'document_ref' => 'MPDO-LDIP-2026-2028',
                'provenance_status' => 'reference_sample',
            ],
            [
                'plan_key' => 'plan-ldrrmp-2025-2027',
                'code' => 'LDRRMP 2025–2027',
                'title' => 'Local Disaster Risk Reduction and Management Plan',
                'horizon' => 'Three-year',
                'lead_office' => 'Municipal Disaster Risk Reduction and Management Office',
                'lead_department_id' => $mpdoId,
                'coordinating_offices' => ['Municipal Engineering Office', 'Municipal Health Office', 'Municipal Social Welfare and Development Office'],
                'coverage_start' => 2025,
                'coverage_end' => 2027,
                'status' => 'In force',
                'sections_complete' => 13,
                'sections_total' => 13,
                'last_action' => 'Preparedness actions reviewed for third quarter',
                'last_action_date' => '2026-09-05',
                'next_milestone' => 'Fourth-quarter readiness review',
                'next_milestone_date' => '2026-10-02',
                'required_action' => 'Response cluster leads to confirm resource and contact updates.',
                'authority' => 'Local DRRM Council planning record',
                'document_ref' => 'MDRRMO-LDRRMP-2025-2027',
                'provenance_status' => 'reference_sample',
            ],
            [
                'plan_key' => 'plan-lccap-2021-2030',
                'code' => 'LCCAP 2021–2030',
                'title' => 'Local Climate Change Action Plan',
                'horizon' => 'Long-term',
                'lead_office' => 'Municipal Environment and Natural Resources Office',
                'lead_department_id' => $mpdoId,
                'coordinating_offices' => ['Municipal Planning and Development Office', 'Municipal Agriculture Office', 'Municipal Engineering Office'],
                'coverage_start' => 2021,
                'coverage_end' => 2030,
                'status' => 'For review',
                'sections_complete' => 10,
                'sections_total' => 12,
                'last_action' => 'Adaptation activity inventory updated',
                'last_action_date' => '2026-08-26',
                'next_milestone' => 'Climate expenditure tagging review',
                'next_milestone_date' => '2026-10-13',
                'required_action' => 'Lead offices to verify activities tagged for climate adaptation and mitigation.',
                'authority' => 'Municipal climate action planning record',
                'document_ref' => 'MENRO-LCCAP-2021-2030',
                'provenance_status' => 'reference_sample',
            ],
            [
                'plan_key' => 'plan-gad-2027',
                'code' => 'GAD Plan 2027',
                'title' => 'Gender and Development Plan and Budget',
                'horizon' => 'Annual',
                'lead_office' => 'GAD Focal Point System',
                'lead_department_id' => $mpdoId,
                'coordinating_offices' => ['Municipal Social Welfare and Development Office', 'Municipal Budget Office', 'Municipal Planning and Development Office'],
                'coverage_start' => 2027,
                'coverage_end' => 2027,
                'status' => 'Updating',
                'sections_complete' => 6,
                'sections_total' => 9,
                'last_action' => 'Office issue statements and proposed activities consolidated',
                'last_action_date' => '2026-09-09',
                'next_milestone' => 'Technical review of proposed activities and budget',
                'next_milestone_date' => '2026-09-29',
                'required_action' => 'Focal persons to resolve incomplete issue statements and missing performance indicators.',
                'authority' => 'Annual GAD planning and budgeting cycle',
                'document_ref' => 'GFPS-GAD-2027-WORKING',
                'provenance_status' => 'reference_sample',
            ],
            [
                'plan_key' => 'plan-ecological-solid-waste-2025-2034',
                'code' => 'SWM 2025–2034',
                'title' => 'Ten-Year Ecological Solid Waste Management Plan',
                'horizon' => 'Long-term',
                'lead_office' => 'Municipal Environment and Natural Resources Office',
                'lead_department_id' => $mpdoId,
                'coordinating_offices' => ['Municipal Engineering Office', 'Municipal Health Office', 'Barangay Affairs Desk'],
                'coverage_start' => 2025,
                'coverage_end' => 2034,
                'status' => 'Adopted',
                'sections_complete' => 15,
                'sections_total' => 15,
                'last_action' => 'Implementation responsibility matrix distributed',
                'last_action_date' => '2026-07-30',
                'next_milestone' => 'Annual diversion target review',
                'next_milestone_date' => '2026-11-06',
                'required_action' => 'Responsible offices to update accomplishment notes against assigned actions.',
                'authority' => 'Municipal solid waste management planning record',
                'document_ref' => 'MENRO-SWM-2025-2034',
                'provenance_status' => 'reference_sample',
            ],
            [
                'plan_key' => 'plan-local-shelter-2024-2032',
                'code' => 'LSP 2024–2032',
                'title' => 'Local Shelter Plan',
                'horizon' => 'Long-term',
                'lead_office' => 'Municipal Planning and Development Office',
                'lead_department_id' => $mpdoId,
                'coordinating_offices' => ['Municipal Social Welfare and Development Office', 'Municipal Engineering Office', 'Municipal Assessor’s Office'],
                'coverage_start' => 2024,
                'coverage_end' => 2032,
                'status' => 'For review',
                'sections_complete' => 8,
                'sections_total' => 10,
                'last_action' => 'Housing need references updated',
                'last_action_date' => '2026-08-14',
                'next_milestone' => 'Beneficiary and site criteria review',
                'next_milestone_date' => '2026-10-20',
                'required_action' => 'Planning team to reconcile current household references with identified sites.',
                'authority' => 'Municipal shelter planning record',
                'document_ref' => 'MPDO-LSP-2024-2032',
                'provenance_status' => 'reference_sample',
            ],
            [
                'plan_key' => 'plan-local-nutrition-2026-2028',
                'code' => 'LNAP 2026–2028',
                'title' => 'Local Nutrition Action Plan',
                'horizon' => 'Three-year',
                'lead_office' => 'Municipal Health Office',
                'lead_department_id' => $mpdoId,
                'coordinating_offices' => ['Municipal Social Welfare and Development Office', 'Municipal Agriculture Office', 'Municipal Planning and Development Office'],
                'coverage_start' => 2026,
                'coverage_end' => 2028,
                'status' => 'In force',
                'sections_complete' => 9,
                'sections_total' => 9,
                'last_action' => 'Program coverage notes updated from second-quarter reports',
                'last_action_date' => '2026-08-22',
                'next_milestone' => 'Third-quarter nutrition program review',
                'next_milestone_date' => '2026-10-08',
                'required_action' => 'Program leads to submit current coverage and referral notes before review.',
                'authority' => 'Municipal nutrition planning record',
                'document_ref' => 'MHO-LNAP-2026-2028',
                'provenance_status' => 'reference_sample',
            ],
            [
                'plan_key' => 'plan-tourism-2024-2028',
                'code' => 'Tourism 2024–2028',
                'title' => 'Local Tourism Development Plan',
                'horizon' => 'Six-year',
                'lead_office' => 'Municipal Tourism Office',
                'lead_department_id' => $mpdoId,
                'coordinating_offices' => ['Municipal Planning and Development Office', 'Municipal Environment and Natural Resources Office', 'Business Permits and Licensing Office'],
                'coverage_start' => 2024,
                'coverage_end' => 2028,
                'status' => 'Due this year',
                'sections_complete' => 9,
                'sections_total' => 11,
                'last_action' => 'Destination and enterprise inventory reviewed',
                'last_action_date' => '2026-09-03',
                'next_milestone' => 'Mid-cycle program update',
                'next_milestone_date' => '2026-11-17',
                'required_action' => 'Tourism and planning teams to complete program adjustments for the next implementation year.',
                'authority' => 'Municipal tourism development planning record',
                'document_ref' => 'MTO-LTDP-2024-2028',
                'provenance_status' => 'reference_sample',
            ],
        ];
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function defaultPpas(): array
    {
        $seeds = [
            ['Farm-to-market road maintenance', 'Agriculture', 'Municipal Engineering Office', 'Infrastructure Development Plan', '20% Development Fund', 'Road sections serving agricultural production areas'],
            ['High-value crop production support', 'Agriculture', 'Municipal Agriculture Office', 'Agriculture and Fisheries Development Plan', 'General Fund', 'Inputs, technical assistance, and field monitoring for priority crops'],
            ['Municipal fisheries livelihood support', 'Fisheries', 'Municipal Agriculture Office', 'Agriculture and Fisheries Development Plan', 'General Fund', 'Livelihood support for organized fisherfolk groups'],
            ['Coastal resource management activities', 'Environment', 'Municipal Environment and Natural Resources Office', 'Coastal Resource Management Plan', 'General Fund', 'Coastal habitat monitoring and barangay coordination'],
            ['Solid waste diversion program', 'Environment', 'Municipal Environment and Natural Resources Office', 'Ecological Solid Waste Management Plan', 'General Fund', 'Waste diversion, recovery, and barangay compliance activities'],
            ['Drainage rehabilitation program', 'Infrastructure', 'Municipal Engineering Office', 'Local Development Investment Program', '20% Development Fund', 'Priority drainage lines with recurring flooding or blockages'],
            ['Local road rehabilitation program', 'Infrastructure', 'Municipal Engineering Office', 'Local Development Investment Program', '20% Development Fund', 'Municipal and barangay road sections prioritized for rehabilitation'],
            ['Public market facility improvements', 'Economic', 'Municipal Economic Enterprise Office', 'Economic Development Plan', 'Economic Enterprise Fund', 'Repairs and operational improvements in public market facilities'],
            ['Water system rehabilitation support', 'Infrastructure', 'Municipal Engineering Office', 'Local Development Investment Program', '20% Development Fund', 'Support for priority communal and municipal water facilities'],
            ['Health center maintenance program', 'Health', 'Municipal Health Office', 'Local Health Investment Plan', 'General Fund', 'Facility maintenance and service readiness for rural health operations'],
            ['Maternal and child health services', 'Health', 'Municipal Health Office', 'Local Health Investment Plan', 'General Fund', 'Community-based maternal, newborn, and child health services'],
            ['Nutrition intervention program', 'Health', 'Municipal Health Office', 'Local Nutrition Action Plan', 'General Fund', 'Nutrition assessment and intervention for priority households'],
            ['Senior citizen support services', 'Social Protection', 'Municipal Social Welfare and Development Office', 'Social Protection Development Plan', 'General Fund', 'Municipal support services and coordinated assistance for senior citizens'],
            ['Persons with disability support services', 'Social Protection', 'Municipal Social Welfare and Development Office', 'Social Protection Development Plan', 'General Fund', 'Referral, assistance, and accessibility support for registered clients'],
            ['Child protection activities', 'Social Protection', 'Municipal Social Welfare and Development Office', 'Local Council for the Protection of Children Plan', 'General Fund', 'Case coordination, prevention activities, and council support'],
            ['Women and family welfare activities', 'Social Protection', 'Municipal Social Welfare and Development Office', 'GAD Plan and Budget', 'GAD Fund', 'Community activities supporting women, families, and referral mechanisms'],
            ['Disaster preparedness program', 'Disaster Risk Reduction', 'Municipal Disaster Risk Reduction and Management Office', 'Local DRRM Plan', 'LDRRM Fund', 'Preparedness, prepositioning, drills, and barangay coordination'],
            ['Emergency response equipment readiness', 'Disaster Risk Reduction', 'Municipal Disaster Risk Reduction and Management Office', 'Local DRRM Plan', 'LDRRM Fund', 'Readiness checks, maintenance, and replacement of response equipment'],
            ['Flood-prone area mitigation activities', 'Disaster Risk Reduction', 'Municipal Engineering Office', 'Local DRRM Plan', 'LDRRM Fund', 'Mitigation works and monitoring for identified flood-prone locations'],
            ['Youth development activities', 'Youth', 'Municipal Mayor’s Office', 'Local Youth Development Plan', 'General Fund', 'Municipal youth participation, leadership, and development activities'],
            ['Sports development program', 'Youth', 'Municipal Mayor’s Office', 'Local Youth Development Plan', 'General Fund', 'Municipal sports activities and barangay participation support'],
            ['Tourism site maintenance program', 'Tourism', 'Municipal Tourism Office', 'Local Tourism Development Plan', 'General Fund', 'Maintenance and visitor-readiness activities for identified tourism sites'],
            ['Tourism promotion and events support', 'Tourism', 'Municipal Tourism Office', 'Local Tourism Development Plan', 'General Fund', 'Municipal tourism calendar and destination information activities'],
            ['Business one-stop-shop operations', 'Economic', 'Business Permits and Licensing Office', 'Economic Development Plan', 'General Fund', 'Coordinated permitting support during renewal and regular operations'],
            ['Local investment promotion activities', 'Economic', 'Municipal Planning and Development Office', 'Economic Development Plan', 'General Fund', 'Investment information, coordination, and local enterprise support'],
            ['Skills training and livelihood assistance', 'Employment', 'Public Employment Service Office', 'Local Development Investment Program', 'General Fund', 'Skills referral and livelihood assistance for identified beneficiaries'],
            ['Employment facilitation services', 'Employment', 'Public Employment Service Office', 'Local Development Investment Program', 'General Fund', 'Job matching, referral, and employer coordination activities'],
            ['Civil registry records preservation', 'Governance', 'Municipal Civil Registrar', 'Governance Development Plan', 'General Fund', 'Preservation and indexing support for civil registry records'],
            ['Records management improvement program', 'Governance', 'Municipal Administrator’s Office', 'Governance Development Plan', 'General Fund', 'File organization, retention, and inter-office records coordination'],
            ['Barangay development coordination', 'Governance', 'Municipal Planning and Development Office', 'Comprehensive Development Plan', 'General Fund', 'Technical coordination for barangay planning and investment programming'],
        ];

        $statuses = ['Ongoing', 'Ongoing', 'Planned', 'For Procurement', 'Completed', 'On Hold'];
        $priorities = ['High', 'Medium', 'Routine'];
        $years = [2025, 2026, 2027];
        $records = [];

        foreach ($seeds as $seedIndex => $seed) {
            foreach ($years as $yearIndex => $year) {
                $coAmount = (float) (($seedIndex + 2) * 850000);
                $mooeAmount = (float) (($seedIndex + 1) * 320000);
                $records[] = [
                    'ppa_code' => sprintf('PPA-%d-%03d', $year, $seedIndex + 1),
                    'title' => $seed[0],
                    'sector' => $seed[1],
                    'responsible_office' => $seed[2],
                    'year' => $year,
                    'related_development_plan' => $seed[3],
                    'funding_source' => $seed[4],
                    'status' => $statuses[($seedIndex + $yearIndex) % count($statuses)],
                    'related_project_count' => ($seedIndex * 2 + $yearIndex) % 7,
                    'priority' => $priorities[($seedIndex + $yearIndex) % count($priorities)],
                    'implementation_context' => $seed[5],
                    'location' => 'Municipality of Talibon',
                    'barangay' => 'Poblacion',
                    'appropriation_amount' => $coAmount + $mooeAmount,
                    'ps_amount' => 0,
                    'mooe_amount' => $mooeAmount,
                    'co_amount' => $coAmount,
                    'climate_adaptation_amount' => $seed[1] === 'Environment' || $seed[1] === 'Disaster Risk Reduction' ? $mooeAmount : 0,
                    'climate_mitigation_amount' => 0,
                    'gad_attributed' => $seed[4] === 'GAD Fund' || $seed[1] === 'Social Protection',
                    'drrm_tagged' => $seed[4] === 'LDRRM Fund' || $seed[1] === 'Disaster Risk Reduction',
                    'aip_reference_code' => sprintf('8000-%d-%03d', $year, $seedIndex + 1),
                    'target_quarter' => 'Q4 '.$year,
                    'provenance_status' => 'reference_sample',
                ];
            }
        }

        return $records;
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function defaultMaps(?int $mpdoId): array
    {
        return [
            [
                'map_code' => 'MAP-CLUP-01',
                'title' => 'General Land Use & Zoning Reference Map (2020–2029)',
                'category' => 'Macro & Spatial',
                'plan_code' => 'CLUP 2020–2029',
                'scale' => '1:25,000',
                'crs' => 'PRS92 / Luzon 1911',
                'coverage' => 'Municipality-wide (25 Barangays)',
                'updated_year' => 2026,
                'status' => 'For Review',
                'provenance_status' => 'awaiting_official_gis',
                'summary' => 'Spatial reference plate illustrating urban core, agricultural production, and coastal settlement zones pending certified HLURB/DHSUD GIS vector upload.',
                'center_lat' => 10.153100,
                'center_lng' => 124.326800,
                'default_zoom' => 12,
                'barangays' => ['Poblacion', 'San Jose', 'San Isidro', 'San Agustin', 'Magsaysay'],
                'related_plan_codes' => ['CLUP 2020–2029', 'CDP 2023–2028'],
                'related_ppa_codes' => ['PPA-2026-006', 'PPA-2026-007'],
                'lead_department_id' => $mpdoId,
            ],
            [
                'map_code' => 'MAP-DRRM-02',
                'title' => 'Coastal Storm Surge & Flood Susceptibility Plate',
                'category' => 'Hazard & DRRM',
                'plan_code' => 'LDRRMP 2025–2027',
                'scale' => '1:15,000',
                'crs' => 'PRS92 / Luzon 1911',
                'coverage' => 'Coastal & Low-Lying Riverine Barangays',
                'updated_year' => 2026,
                'status' => 'For Review',
                'provenance_status' => 'awaiting_official_gis',
                'summary' => 'Hazard reference overlay for flood-prone drainage corridors and island evacuation staging points.',
                'center_lat' => 10.159200,
                'center_lng' => 124.334000,
                'default_zoom' => 13,
                'barangays' => ['Poblacion', 'Guindacpan', 'Mahanay', 'Cataban', 'Sag'],
                'related_plan_codes' => ['LDRRMP 2025–2027', 'LCCAP 2021–2030'],
                'related_ppa_codes' => ['PPA-2026-017', 'PPA-2026-019'],
                'lead_department_id' => $mpdoId,
            ],
            [
                'map_code' => 'MAP-INFRA-03',
                'title' => 'Municipal Road Network & Farm-to-Market Corridor Plate',
                'category' => 'Infrastructure & Utilities',
                'plan_code' => 'LDIP 2026–2028',
                'scale' => '1:20,000',
                'crs' => 'PRS92 / Luzon 1911',
                'coverage' => 'Mainland Trunk & Agricultural Feeder Roads',
                'updated_year' => 2026,
                'status' => 'For Review',
                'provenance_status' => 'awaiting_official_gis',
                'summary' => 'Reference corridor map linking 20% Development Fund road and drainage rehabilitation PPAs.',
                'center_lat' => 10.141500,
                'center_lng' => 124.318500,
                'default_zoom' => 12,
                'barangays' => ['San Roque', 'Sto. Niño', 'Bagacay', 'Burgos', 'Rizal'],
                'related_plan_codes' => ['LDIP 2026–2028', 'AIP 2027'],
                'related_ppa_codes' => ['PPA-2026-001', 'PPA-2026-007', 'PPA-2026-009'],
                'lead_department_id' => $mpdoId,
            ],
            [
                'map_code' => 'MAP-ENV-04',
                'title' => 'Danajon Bank Marine Sanctuary & Mangrove Conservation Plate',
                'category' => 'Environment & Coastal',
                'plan_code' => 'LCCAP 2021–2030',
                'scale' => '1:30,000',
                'crs' => 'WGS84 / PRS92',
                'coverage' => 'Municipal Waters & Island Barangays',
                'updated_year' => 2026,
                'status' => 'For Review',
                'provenance_status' => 'awaiting_official_gis',
                'summary' => 'Coastal resource management and marine protected area reference plate.',
                'center_lat' => 10.210000,
                'center_lng' => 124.340000,
                'default_zoom' => 11,
                'barangays' => ['Calituban', 'Nocnocan', 'Bilangbilangan', 'Hingotanan East', 'Hingotanan West'],
                'related_plan_codes' => ['LCCAP 2021–2030', 'SWM 2025–2034'],
                'related_ppa_codes' => ['PPA-2026-003', 'PPA-2026-004'],
                'lead_department_id' => $mpdoId,
            ],
        ];
    }
}
