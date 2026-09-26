export const ONBOARDING_GUIDE_EVENT = 'talibon:onboarding:guide';

export const personaTourKeys = [
    'executive',
    'engineering_head',
    'budget_head',
    'employee',
    'hr',
    'legislative',
    'system_admin',
] as const;

export type PersonaTourKey = (typeof personaTourKeys)[number];

export type TourStep = {
    id: string;
    target: string;
    title: string;
    body: string;
};

export type PresentationCredit = {
    name: string;
    role: string;
    specialization?: string;
    organization: string;
};

export type PresentationCredits = {
    project: string;
    subtitle: string;
    municipality: string;
    technicalAuthority: PresentationCredit;
    collaboration: string;
    contributors: PresentationCredit[];
    footer: string;
};

export function isPersonaTourKey(value: string): value is PersonaTourKey {
    return personaTourKeys.includes(value as PersonaTourKey);
}
