export type GADSector = 'Livelihood' | 'Health' | 'Education' | 'Governance';

export type GADIndicator = {
    reference: string;
    label: string;
    sector: GADSector;
    female: number;
    male: number;
    context: string;
};

export type GADProgramReference = {
    reference: string;
    title: string;
    sector: GADSector;
    femaleReach: number;
    maleReach: number;
    planningState: 'Planning reference' | 'Active reference' | 'Review reference';
    note: string;
};

export const gadIndicators: GADIndicator[] = [
    { reference: 'GAD-I01', label: 'Livelihood participation reference', sector: 'Livelihood', female: 58, male: 42, context: 'Illustrative share of participants by sex for planning comparison.' },
    { reference: 'GAD-I02', label: 'Preventive health participation reference', sector: 'Health', female: 62, male: 38, context: 'Illustrative program participation split for GAD planning.' },
    { reference: 'GAD-I03', label: 'Skills learning participation reference', sector: 'Education', female: 54, male: 46, context: 'Illustrative learning-program participation split.' },
    { reference: 'GAD-I04', label: 'Community consultation participation reference', sector: 'Governance', female: 51, male: 49, context: 'Illustrative consultation participation split for comparative analysis.' },
    { reference: 'GAD-I05', label: 'Referral awareness reference', sector: 'Health', female: 57, male: 43, context: 'Illustrative awareness-program participation distribution.' },
];

export const gadPrograms: GADProgramReference[] = [
    { reference: 'GAD-P11', title: 'Livelihood capability session reference', sector: 'Livelihood', femaleReach: 72, maleReach: 48, planningState: 'Active reference', note: 'Illustrative program reach reference for sector planning.' },
    { reference: 'GAD-P18', title: 'Community health information reference', sector: 'Health', femaleReach: 81, maleReach: 52, planningState: 'Review reference', note: 'Illustrative health-sector program comparison reference.' },
    { reference: 'GAD-P24', title: 'Digital skills learning reference', sector: 'Education', femaleReach: 64, maleReach: 55, planningState: 'Planning reference', note: 'Illustrative learning reach reference with no participant identities.' },
    { reference: 'GAD-P31', title: 'Inclusive consultation reference', sector: 'Governance', femaleReach: 59, maleReach: 56, planningState: 'Active reference', note: 'Illustrative governance participation reference.' },
];

export const gadSectors: GADSector[] = ['Livelihood', 'Health', 'Education', 'Governance'];
