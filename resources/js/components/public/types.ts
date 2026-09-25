export type ServiceItem = { title: string; description: string; group: 'services' | 'information'; meta: string; action?: string; href?: string };
export type TransparencyItem = { label: string; value: string; note: string };
export type ProjectItem = { title: string; summary: string; tag: string };
export type DashboardItem = { label: string; value: string; detail: string };
export type NewsItem = { type: string; title: string; summary: string; date: string };

export type PublicNavItem = { label: string; href: string };
export type PublicFeatureItem = {
    id: string;
    title: string;
    description: string;
    image?: string | null;
    items: string[];
    action?: string | null;
    href?: string | null;
};
export type PublicQuickAccessItem = { label: string; href?: string | null };

export type PublicInfoDetail = {
    summary: string;
    highlights: string[];
    note?: string;
};

export type PublicInfoSelection = {
    eyebrow: string;
    title: string;
    description: string;
    detail: PublicInfoDetail;
};

export type CapabilityItem = {
    id: 'transactions' | 'documents' | 'projects' | 'people' | 'calendar' | 'follow-up';
    title: string;
    description: string;
    detail: PublicInfoDetail;
};

export type PreviewModuleKind = 'memorandum' | 'schedule' | 'notification' | 'weather';

export type PreviewModuleItem = {
    id: string;
    kind: PreviewModuleKind;
    title: string;
    description: string;
    detail?: PublicInfoDetail;
};

export type PreviewQuickAccessItem = {
    capabilityId: CapabilityItem['id'];
    label: string;
};

export type AboutPillar = {
    title: string;
    description: string;
};

export type WorkflowStep = { title: string; description: string };

export type PublicContent = {
    dataMode: string;
    sampleLabel: string;
    municipality: string;

    government: { republic: string; province: string; surfaceLabel: string };
    masthead: { eyebrow: string; title: string; subtitle: string };
    navigation: PublicNavItem[];
    hero: { eyebrow: string; title: string; lead: string; description: string; values: string[] };
    features: PublicFeatureItem[];
    quickAccess: PublicQuickAccessItem[];

    about: { eyebrow: string; title: string; description: string; pillars: AboutPillar[] };
    portalPreview: { eyebrow: string; title: string; modules: PreviewModuleItem[]; quickAccess: PreviewQuickAccessItem[] };
    dailyConvenience: { eyebrow: string; title: string; description: string; items: PreviewModuleItem[] };
    capabilities: { title: string; description: string; items: CapabilityItem[] };
    workflow: { eyebrow: string; title: string; description: string; steps: WorkflowStep[] };
    officeOverview: { eyebrow: string; title: string; description: string };
    secureAccess: { eyebrow: string; title: string; description: string; note: string; trustPoints: string[] };

    services: ServiceItem[];
    transparency: TransparencyItem[];
    projects: ProjectItem[];
    dashboard: DashboardItem[];
    news: NewsItem[];
    contact: {
        heading: string;
        description: string;
        location: string;
        telephone?: string | null;
        email?: string | null;
        officeHours?: string | null;
    };
};
