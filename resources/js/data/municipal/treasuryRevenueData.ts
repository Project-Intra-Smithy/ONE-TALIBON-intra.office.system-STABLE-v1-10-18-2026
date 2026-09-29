export type TreasuryReferenceState = 'Collection reference' | 'Payment handoff' | 'Receipt reference check' | 'Treasury linked reference';

export type TreasuryRevenueReference = {
    reference: string;
    revenueSource: string;
    sourceOffice: string;
    paymentReference: string;
    receiptReference: string;
    collectionContext: string;
    checkpointState: TreasuryReferenceState;
    note: string;
};

export const treasuryRevenueReferences: TreasuryRevenueReference[] = [
    {
        reference: 'TRY-REF-019',
        revenueSource: 'Business permit collection reference',
        sourceOffice: 'BPLO reference',
        paymentReference: 'PAY-REF-2026-071',
        receiptReference: 'Receipt reference pending check',
        collectionContext: 'Permit-related collection handoff context',
        checkpointState: 'Payment handoff',
        note: 'Illustrative source-to-Treasury payment reference handoff; no payment processing is represented.',
    },
    {
        reference: 'TRY-REF-027',
        revenueSource: 'Property tax collection reference',
        sourceOffice: 'Assessment reference',
        paymentReference: 'PAY-REF-2026-084',
        receiptReference: 'RCPT-REF-2026-044',
        collectionContext: 'Property-revenue integration context',
        checkpointState: 'Receipt reference check',
        note: 'Illustrative receipt-reference verification state without cashier or receipt-issuance authority.',
    },
    {
        reference: 'TRY-REF-034',
        revenueSource: 'Service fee collection reference',
        sourceOffice: 'Service-office reference',
        paymentReference: 'PAY-REF-2026-093',
        receiptReference: 'RCPT-REF-2026-051',
        collectionContext: 'Municipal service fee handoff context',
        checkpointState: 'Treasury linked reference',
        note: 'Illustrative linked Treasury reference for integration visibility only.',
    },
    {
        reference: 'TRY-REF-041',
        revenueSource: 'Market fee collection reference',
        sourceOffice: 'Market administration reference',
        paymentReference: 'PAY reference queued',
        receiptReference: 'Receipt reference not yet reached',
        collectionContext: 'Market-source collection reference context',
        checkpointState: 'Collection reference',
        note: 'Presentation-only collection reference before payment handoff.',
    },
    {
        reference: 'TRY-REF-049',
        revenueSource: 'Permit service collection reference',
        sourceOffice: 'Permit-service reference',
        paymentReference: 'PAY-REF-2026-107',
        receiptReference: 'RCPT-REF-2026-063',
        collectionContext: 'Permit-service revenue integration context',
        checkpointState: 'Treasury linked reference',
        note: 'Illustrative Treasury-linked reference without payment, cashiering or ledger mutation.',
    },
];

export const treasuryCheckpoints = ['Collection reference', 'Payment handoff', 'Receipt reference check', 'Treasury linked reference'] as const;
