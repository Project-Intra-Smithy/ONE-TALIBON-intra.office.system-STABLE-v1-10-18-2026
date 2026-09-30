import type { PersonaTourKey, PresentationCredits, TourStep } from './types';

export const presentationCredits: PresentationCredits = {
    project: 'Talibon Intra-Office Portal',
    subtitle: 'ONE TALIBON',
    municipality: 'Municipality of Talibon, Bohol',
    technicalAuthority: {
        name: 'Kirch Ivan Balite',
        role: 'Chief Technology Officer (CTO) / Technical Authority',
        specialization: 'Backend Systems & Architecture',
        organization: 'Kirjane Labs',
    },
    collaboration: 'Kirjane Labs × ALZA IT Solutions',
    contributors: [
        { name: 'Osiris Kedigadash Palac', role: 'DevOps Lead', organization: 'Kirjane Labs' },
        { name: 'Kurt Shine Khasi Halasan', role: 'Developer / DevOps & Release Operations', organization: 'Kirjane Labs' },
        { name: 'AJ RIENZE', role: 'Chief Executive Officer (CEO)', organization: 'ALZA IT Solutions' },
        { name: 'Kikiam', role: 'Chief Operating Officer (COO)', organization: 'ALZA IT Solutions' },
    ],
    footer: 'Showcase prototype for stakeholder evaluation and municipal workflow review.',
};

const showcaseTour: TourStep[] = [
    {
        id: 'correspondence',
        target: 'nav:correspondence',
        title: 'Document routing & correspondence',
        body: 'Use Correspondence for official office-to-office communication, document routing, and follow-through. Document Center supports the files and documents available to your workspace.',
    },
    {
        id: 'tasks',
        target: 'nav:myWork',
        title: 'Tasks & Assignments',
        body: 'See assigned municipal work, current responsibility, priority and status, and the items that need follow-through.',
    },
    {
        id: 'projects',
        target: 'nav:projectMonitoring',
        title: 'Project Monitoring',
        body: 'Review implementation status, milestones, and project visibility for planning and department oversight available to this workspace.',
    },
    {
        id: 'procurement',
        target: 'nav:procurementTracking',
        title: 'Procurement / PR Tracking',
        body: 'Follow purchase-request visibility across procurement, sourcing, delivery, and inspection references available to the workspace.',
    },
    {
        id: 'people',
        target: 'nav:employeeDirectory',
        title: 'HR Employee Portal',
        body: 'Use the municipal employee portal as a reference for employee, office, and personnel information available to your workspace.',
    },
    {
        id: 'systems',
        target: 'nav:municipalSystems',
        title: 'Future Integrations',
        body: 'Explore the wider ONE TALIBON roadmap through interactive previews of municipal systems and future integration areas.',
    },
    {
        id: 'switcher',
        target: 'shell:workspace-switcher',
        title: 'Switch Workspace',
        body: 'Change office or role context during the showcase when another authorized workspace is available.',
    },
];

export const personaTours: Record<PersonaTourKey, TourStep[]> = {
    executive: showcaseTour,
    engineering_head: showcaseTour,
    budget_head: showcaseTour,
    employee: showcaseTour,
    hr: showcaseTour,
    legislative: showcaseTour,
    system_admin: showcaseTour,
};
