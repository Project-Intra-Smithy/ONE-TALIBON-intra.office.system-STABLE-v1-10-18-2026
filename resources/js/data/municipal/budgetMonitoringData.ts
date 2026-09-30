export type BudgetLine = {
    id: string;
    program: string;
    office: string;
    approved: number;
    obligated: number;
    available: number;
    utilization: number;
    obligationReferenceIds: string[];
    movement: string[];
};

export type ObligationReference = {
    id: string;
    description: string;
    office: string;
    budgetLineId: string;
    amount: number;
    status: 'Recorded' | 'For reference' | 'Pending supporting reference';
};

export const budgetLines: BudgetLine[] = [
    {
        id: 'BL-2026-001',
        program: 'General Administration',
        office: "Mayor's Office",
        approved: 4_200_000,
        obligated: 3_050_000,
        available: 1_150_000,
        utilization: 72.6,
        obligationReferenceIds: ['OBR-2026-018'],
        movement: [
            'Approved budget reference established',
            'Administrative obligation reference recorded',
            'Available balance reference updated',
        ],
    },
    {
        id: 'BL-2026-002',
        program: 'Infrastructure Support',
        office: 'Municipal Engineering Office',
        approved: 6_000_000,
        obligated: 3_240_000,
        available: 2_760_000,
        utilization: 54.0,
        obligationReferenceIds: ['OBR-2026-024'],
        movement: [
            'Approved infrastructure budget reference established',
            'Road maintenance obligation reference recorded',
            'Available balance reference updated',
        ],
    },
    {
        id: 'BL-2026-003',
        program: 'Social Services',
        office: 'Municipal Social Welfare reference',
        approved: 3_500_000,
        obligated: 2_310_000,
        available: 1_190_000,
        utilization: 66.0,
        obligationReferenceIds: ['OBR-2026-031'],
        movement: [
            'Approved social-services budget reference established',
            'Community assistance obligation reference linked for review',
            'Available balance reference updated',
        ],
    },
    {
        id: 'BL-2026-004',
        program: 'Local Development Programs',
        office: 'Planning reference',
        approved: 4_800_000,
        obligated: 1_820_000,
        available: 2_980_000,
        utilization: 37.9,
        obligationReferenceIds: ['OBR-2026-036'],
        movement: [
            'Approved local-development budget reference established',
            'Planning-support obligation reference awaiting supporting reference',
            'Available balance reference updated',
        ],
    },
];

export const obligationReferences: ObligationReference[] = [
    {
        id: 'OBR-2026-018',
        description: 'Administrative operating requirements',
        office: "Mayor's Office",
        budgetLineId: 'BL-2026-001',
        amount: 1_250_000,
        status: 'Recorded',
    },
    {
        id: 'OBR-2026-024',
        description: 'Road maintenance program support',
        office: 'Municipal Engineering Office',
        budgetLineId: 'BL-2026-002',
        amount: 2_100_000,
        status: 'Recorded',
    },
    {
        id: 'OBR-2026-031',
        description: 'Community assistance program reference',
        office: 'Municipal Social Welfare reference',
        budgetLineId: 'BL-2026-003',
        amount: 980_000,
        status: 'For reference',
    },
    {
        id: 'OBR-2026-036',
        description: 'Local development planning support',
        office: 'Planning reference',
        budgetLineId: 'BL-2026-004',
        amount: 640_000,
        status: 'Pending supporting reference',
    },
];

const approved = budgetLines.reduce((sum, line) => sum + line.approved, 0);
const obligated = budgetLines.reduce((sum, line) => sum + line.obligated, 0);
const available = budgetLines.reduce((sum, line) => sum + line.available, 0);

export const budgetSummary = {
    approved,
    obligated,
    available,
    utilization: Number(((obligated / approved) * 100).toFixed(1)),
};

export const budgetAttention = {
    highUtilization: budgetLines.filter((line) => line.utilization >= 70).length,
    lowUtilization: budgetLines.filter((line) => line.utilization < 40).length,
    pendingReferences: obligationReferences.filter((reference) => reference.status !== 'Recorded').length,
};

export function formatPeso(value: number): string {
    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        maximumFractionDigits: 0,
    }).format(value).replace('PHP', '₱').replace(/\s+/g, '');
}
