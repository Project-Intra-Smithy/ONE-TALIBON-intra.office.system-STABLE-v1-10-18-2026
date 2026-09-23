export type ServiceItem = { title: string; description: string; group: 'services' | 'information'; meta: string; action?: string; href?: string };
export type TransparencyItem = { label: string; value: string; note: string };
export type ProjectItem = { title: string; summary: string; tag: string };
export type DashboardItem = { label: string; value: string; detail: string };
export type NewsItem = { type: string; title: string; summary: string; date: string };
export type CapabilityItem = {
    id: 'transactions' | 'documents' | 'projects' | 'people' | 'calendar' | 'follow-up';
    title: string;
    description: string;
};
export type PreviewModuleKind = 'memorandum' | 'schedule' | 'notification' | 'weather';
export type PreviewModuleItem = {
    id: string;
    kind: PreviewModuleKind;
    title: string;
    description: string;
};
export type PublicContent = {
    dataMode: string;
    sampleLabel: string;
    municipality: string;
    hero: { eyebrow: string; title: string; lead: string; description: string };
    portalPreview: { eyebrow: string; title: string; modules: PreviewModuleItem[]; quickAccess: string[] };
    dailyConvenience: { eyebrow: string; title: string; description: string; items: PreviewModuleItem[] };
    capabilities: { title: string; description: string; items: CapabilityItem[] };
    workflow: { eyebrow: string; title: string; description: string; steps: string[] };
    officeOverview: { eyebrow: string; title: string; description: string };
    secureAccess: { eyebrow: string; title: string; description: string; note: string };
    services: ServiceItem[];
    transparency: TransparencyItem[];
    projects: ProjectItem[];
    dashboard: DashboardItem[];
    news: NewsItem[];
    contact: { heading: string; description: string; location: string };
};
