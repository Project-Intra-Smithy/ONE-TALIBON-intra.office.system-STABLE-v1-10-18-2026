export type AssetCategory = 'Vehicles' | 'Computers' | 'Furniture' | 'Buildings' | 'Equipment';

export type AssetCondition =
    | 'Serviceable'
    | 'For inspection'
    | 'For maintenance reference'
    | 'For review';

export type AssetAccountability =
    | 'Office accountable'
    | 'Assigned reference'
    | 'Property reference'
    | 'Unassigned reference';

export type AssetReferenceState =
    | 'Reference current'
    | 'Custody reference current'
    | 'Property reference current'
    | 'Inspection reference pending'
    | 'Maintenance reference current'
    | 'Reference gap';

export type AssetHistoryEvent = {
    label: string;
    detail: string;
};

export type AssetPropertyRecord = {
    id: string;
    name: string;
    category: AssetCategory;
    office: string;
    accountability: AssetAccountability;
    accountabilityReference: string;
    condition: AssetCondition;
    referenceState: AssetReferenceState;
    custodyContext: string;
    lastMovement: string;
    lifecycleContext: string;
    history: AssetHistoryEvent[];
};

export const assetCategories: AssetCategory[] = [
    'Vehicles',
    'Computers',
    'Furniture',
    'Buildings',
    'Equipment',
];

export const assetPropertyRecords: AssetPropertyRecord[] = [
    {
        id: 'AST-2026-001',
        name: 'Service vehicle reference',
        category: 'Vehicles',
        office: 'General Services Office',
        accountability: 'Office accountable',
        accountabilityReference: 'GSO vehicle custody reference',
        condition: 'Serviceable',
        referenceState: 'Reference current',
        custodyContext: 'Retained under office-level accountability for presentation reference.',
        lastMovement: 'Office accountability reference reaffirmed',
        lifecycleContext: 'Serviceable reference · routine condition monitoring',
        history: [
            { label: 'Asset reference recorded', detail: 'Presentation-only vehicle property reference entered for register review.' },
            { label: 'Office accountability noted', detail: 'General Services Office shown as the accountable office reference.' },
            { label: 'Condition reviewed', detail: 'Current presentation condition remains Serviceable.' },
        ],
    },
    {
        id: 'AST-2026-002',
        name: 'Desktop workstation set',
        category: 'Computers',
        office: 'Engineering Office',
        accountability: 'Assigned reference',
        accountabilityReference: 'Engineering equipment assignment reference',
        condition: 'Serviceable',
        referenceState: 'Custody reference current',
        custodyContext: 'Office equipment set shown against an assignment reference; no personal custodian is identified.',
        lastMovement: 'Assignment reference updated for office use',
        lifecycleContext: 'Serviceable reference · office custody context current',
        history: [
            { label: 'Equipment set referenced', detail: 'Desktop workstation set added as an illustrative municipal equipment record.' },
            { label: 'Assignment reference recorded', detail: 'Engineering Office linked through an office-level assignment reference only.' },
            { label: 'Condition retained', detail: 'Serviceable condition remains the current presentation reference.' },
        ],
    },
    {
        id: 'AST-2026-003',
        name: 'Office furniture set',
        category: 'Furniture',
        office: 'Administrative Services',
        accountability: 'Office accountable',
        accountabilityReference: 'Administrative furniture accountability reference',
        condition: 'For inspection',
        referenceState: 'Inspection reference pending',
        custodyContext: 'Office-level accountability retained while an illustrative inspection reference remains pending.',
        lastMovement: 'Inspection reference flagged for follow-up',
        lifecycleContext: 'Inspection reference pending · no disposal or transfer action represented',
        history: [
            { label: 'Furniture set referenced', detail: 'Illustrative furniture group created without serial or employee custody data.' },
            { label: 'Office accountability retained', detail: 'Administrative Services remains the responsible office reference.' },
            { label: 'Inspection reference noted', detail: 'Condition context moved to For inspection for presentation review.' },
        ],
    },
    {
        id: 'AST-2026-004',
        name: 'Municipal facility reference',
        category: 'Buildings',
        office: 'General Services Office',
        accountability: 'Property reference',
        accountabilityReference: 'Municipal facility property reference',
        condition: 'Serviceable',
        referenceState: 'Property reference current',
        custodyContext: 'Facility shown as a municipal property reference under office stewardship context.',
        lastMovement: 'Property reference reviewed',
        lifecycleContext: 'Serviceable property reference · stewardship context current',
        history: [
            { label: 'Facility reference recorded', detail: 'Presentation-only municipal facility reference entered without title or parcel data.' },
            { label: 'Stewardship context noted', detail: 'General Services Office shown for property-reference context.' },
            { label: 'Reference reviewed', detail: 'Facility remains Serviceable in this illustrative workspace.' },
        ],
    },
    {
        id: 'AST-2026-005',
        name: 'Portable equipment set',
        category: 'Equipment',
        office: 'Operations reference',
        accountability: 'Unassigned reference',
        accountabilityReference: 'Assignment reference not established',
        condition: 'For review',
        referenceState: 'Reference gap',
        custodyContext: 'Illustrative equipment record intentionally shows an assignment-reference gap for review.',
        lastMovement: 'Accountability reference requires review',
        lifecycleContext: 'Reference gap · condition and accountability context require review',
        history: [
            { label: 'Portable set referenced', detail: 'Illustrative equipment group entered without identifying serial or custody information.' },
            { label: 'Reference gap noted', detail: 'No office-level assignment reference is established in this presentation record.' },
            { label: 'Review context retained', detail: 'Record remains For review; no operational assignment action is available.' },
        ],
    },
    {
        id: 'AST-2026-006',
        name: 'Utility equipment reference',
        category: 'Equipment',
        office: 'General Services Office',
        accountability: 'Office accountable',
        accountabilityReference: 'GSO utility equipment custody reference',
        condition: 'For maintenance reference',
        referenceState: 'Maintenance reference current',
        custodyContext: 'Office accountability remains visible while maintenance is represented as reference context only.',
        lastMovement: 'Maintenance reference recorded',
        lifecycleContext: 'Maintenance reference current · no work-order or repair authority represented',
        history: [
            { label: 'Utility equipment referenced', detail: 'Presentation-only equipment reference added to the municipal property register.' },
            { label: 'Office accountability noted', detail: 'General Services Office remains the accountable office reference.' },
            { label: 'Maintenance context recorded', detail: 'Condition shown as For maintenance reference without creating a work order.' },
        ],
    },
];

export const assetPropertySummary = {
    assetsInView: assetPropertyRecords.length,
    accountable: assetPropertyRecords.filter((record) => record.accountability !== 'Unassigned reference').length,
    forInspection: assetPropertyRecords.filter((record) => record.condition === 'For inspection').length,
    referenceGap: assetPropertyRecords.filter(
        (record) => record.accountability === 'Unassigned reference' || record.referenceState === 'Reference gap',
    ).length,
};

export const assetCategoryCounts = assetCategories.map((category) => ({
    category,
    count: assetPropertyRecords.filter((record) => record.category === category).length,
}));

export const assetConditionCounts: Array<{ condition: AssetCondition; count: number }> = [
    'Serviceable',
    'For inspection',
    'For maintenance reference',
    'For review',
].map((condition) => ({
    condition: condition as AssetCondition,
    count: assetPropertyRecords.filter((record) => record.condition === condition).length,
}));
