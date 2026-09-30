export type AccountingCheckpointState = 'Reference ready' | 'In handoff' | 'Checkpoint review' | 'Linked reference';

export type AccountingIntegrationReference = {
    reference: string;
    sourceOffice: string;
    destinationOffice: string;
    documentReference: string;
    journalContext: string;
    obligationReference: string;
    disbursementReference: string;
    checkpointState: AccountingCheckpointState;
    note: string;
};

export const accountingIntegrationReferences: AccountingIntegrationReference[] = [
    {
        reference: 'ACC-REF-026',
        sourceOffice: 'Budget Office reference',
        destinationOffice: 'Accounting Office reference',
        documentReference: 'DOC-2026-118',
        journalContext: 'Journal/document reference pending checkpoint',
        obligationReference: 'OBL-2026-064',
        disbursementReference: 'DISB reference not yet linked',
        checkpointState: 'Checkpoint review',
        note: 'Illustrative obligation-to-accounting handoff reference; no posting or voucher action is represented.',
    },
    {
        reference: 'ACC-REF-031',
        sourceOffice: 'Procurement reference',
        destinationOffice: 'Accounting Office reference',
        documentReference: 'DOC-2026-126',
        journalContext: 'Supporting document reference set',
        obligationReference: 'OBL-2026-071',
        disbursementReference: 'DISB-REF-044',
        checkpointState: 'In handoff',
        note: 'Illustrative procurement-document handoff with obligation and disbursement reference linkage.',
    },
    {
        reference: 'ACC-REF-038',
        sourceOffice: 'General Services reference',
        destinationOffice: 'Accounting Office reference',
        documentReference: 'DOC-2026-139',
        journalContext: 'Property-supporting document reference',
        obligationReference: 'OBL-2026-079',
        disbursementReference: 'DISB-REF-052',
        checkpointState: 'Linked reference',
        note: 'Illustrative linked reference demonstrating integration visibility only.',
    },
    {
        reference: 'ACC-REF-044',
        sourceOffice: 'HRMO payroll-support reference',
        destinationOffice: 'Accounting Office reference',
        documentReference: 'DOC-2026-147',
        journalContext: 'Payroll-support document reference',
        obligationReference: 'OBL-2026-083',
        disbursementReference: 'DISB reference pending',
        checkpointState: 'Reference ready',
        note: 'Presentation-only source reference awaiting accounting handoff.',
    },
    {
        reference: 'ACC-REF-051',
        sourceOffice: 'Engineering reference',
        destinationOffice: 'Accounting Office reference',
        documentReference: 'DOC-2026-155',
        journalContext: 'Project-support document reference',
        obligationReference: 'OBL-2026-091',
        disbursementReference: 'DISB-REF-061',
        checkpointState: 'Linked reference',
        note: 'Illustrative project-document linkage showing source-to-accounting integration visibility.',
    },
];

export const accountingPipeline = ['Source reference', 'Accounting handoff', 'Document checkpoint', 'Linked reference'] as const;
