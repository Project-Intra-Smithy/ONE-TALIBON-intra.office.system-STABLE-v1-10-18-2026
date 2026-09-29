export type SupplyCategory = 'Office supplies' | 'Janitorial' | 'IT consumables' | 'Field supplies';
export type StockAttention = 'Healthy stock' | 'Monitor level' | 'Reorder attention';
export type IssuanceReferenceState = 'No open reference' | 'Issuance reference active' | 'Recent issuance reference';

export type SupplyMovement = {
    reference: string;
    direction: 'Receipt reference' | 'Issuance reference' | 'Adjustment reference';
    quantity: number;
    context: string;
};

export type InventorySupplyRecord = {
    id: string;
    item: string;
    category: SupplyCategory;
    quantity: number;
    unit: string;
    reorderPoint: number;
    stockAttention: StockAttention;
    issuanceState: IssuanceReferenceState;
    officeContext: string;
    latestMovement: string;
    movements: SupplyMovement[];
};

export const inventorySupplyRecords: InventorySupplyRecord[] = [
    {
        id: 'SUP-0018',
        item: 'A4 copy paper reference stock',
        category: 'Office supplies',
        quantity: 42,
        unit: 'reams',
        reorderPoint: 20,
        stockAttention: 'Healthy stock',
        issuanceState: 'Recent issuance reference',
        officeContext: 'General office supply pool',
        latestMovement: 'ISS-2026-073',
        movements: [
            { reference: 'REC-2026-041', direction: 'Receipt reference', quantity: 30, context: 'Illustrative stock receipt reference.' },
            { reference: 'ISS-2026-073', direction: 'Issuance reference', quantity: 8, context: 'Illustrative office issuance reference.' },
        ],
    },
    {
        id: 'SUP-0032',
        item: 'Black ballpen reference stock',
        category: 'Office supplies',
        quantity: 18,
        unit: 'boxes',
        reorderPoint: 12,
        stockAttention: 'Monitor level',
        issuanceState: 'Issuance reference active',
        officeContext: 'Shared office consumables',
        latestMovement: 'ISS-2026-081',
        movements: [
            { reference: 'ISS-2026-081', direction: 'Issuance reference', quantity: 4, context: 'Presentation-only issuance reference awaiting stock movement closeout.' },
        ],
    },
    {
        id: 'SUP-0054',
        item: 'Surface cleaner reference stock',
        category: 'Janitorial',
        quantity: 7,
        unit: 'containers',
        reorderPoint: 10,
        stockAttention: 'Reorder attention',
        issuanceState: 'No open reference',
        officeContext: 'Facility maintenance supply pool',
        latestMovement: 'ISS-2026-069',
        movements: [
            { reference: 'ISS-2026-069', direction: 'Issuance reference', quantity: 3, context: 'Illustrative janitorial issuance reference.' },
        ],
    },
    {
        id: 'SUP-0061',
        item: 'Printer toner reference stock',
        category: 'IT consumables',
        quantity: 5,
        unit: 'cartridges',
        reorderPoint: 6,
        stockAttention: 'Reorder attention',
        issuanceState: 'Issuance reference active',
        officeContext: 'Shared print-support consumables',
        latestMovement: 'ISS-2026-084',
        movements: [
            { reference: 'REC-2026-052', direction: 'Receipt reference', quantity: 6, context: 'Illustrative replenishment reference.' },
            { reference: 'ISS-2026-084', direction: 'Issuance reference', quantity: 1, context: 'Illustrative toner issuance reference.' },
        ],
    },
    {
        id: 'SUP-0076',
        item: 'Reflective safety vest reference stock',
        category: 'Field supplies',
        quantity: 14,
        unit: 'pieces',
        reorderPoint: 8,
        stockAttention: 'Healthy stock',
        issuanceState: 'Recent issuance reference',
        officeContext: 'Field operations supply pool',
        latestMovement: 'ISS-2026-079',
        movements: [
            { reference: 'ISS-2026-079', direction: 'Issuance reference', quantity: 6, context: 'Illustrative field-supply issuance reference.' },
        ],
    },
    {
        id: 'SUP-0088',
        item: 'Archive storage box reference stock',
        category: 'Office supplies',
        quantity: 26,
        unit: 'pieces',
        reorderPoint: 10,
        stockAttention: 'Healthy stock',
        issuanceState: 'No open reference',
        officeContext: 'Records-support supply pool',
        latestMovement: 'REC-2026-058',
        movements: [
            { reference: 'REC-2026-058', direction: 'Receipt reference', quantity: 20, context: 'Illustrative records-support receipt reference.' },
        ],
    },
];

export const supplyCategories: SupplyCategory[] = ['Office supplies', 'Janitorial', 'IT consumables', 'Field supplies'];
