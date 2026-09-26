import type { PersonaTourKey, PresentationCredits, TourStep } from './types';

export const presentationCredits: PresentationCredits = {
    project: 'ONE TALIBON',
    subtitle: 'Municipal Digital Workspace Prototype',
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
    footer: 'Built as a prototype for stakeholder evaluation and municipal workflow review.',
};

const executive: TourStep[] = [
    { id: 'home', target: 'nav:home', title: 'Municipal operating picture', body: 'This workspace brings together municipality-level work, schedules, projects, and items requiring executive attention.' },
    { id: 'notifications', target: 'shell:notifications', title: 'Items requiring attention', body: 'Use notifications to notice new office arrivals and memoranda available to this workspace without treating prototype activity as production reporting.' },
    { id: 'work-queue', target: 'nav:myWork', title: 'Work Queue', body: 'Track routed municipal work, current responsibility, and items that need action.' },
    { id: 'memoranda', target: 'nav:memoranda', title: 'Official Memoranda', body: 'Review formal internal memoranda available to this workspace. Publishing actions remain limited by actual authorization.' },
    { id: 'calendar', target: 'nav:calendar', title: 'Calendar & Meetings', body: 'Keep municipal schedules, meetings, deadlines, and coordinated activities visible.' },
    { id: 'records', target: 'nav:records', title: 'Records Register', body: 'Reference records available to the current authorized workspace.' },
    { id: 'messages', target: 'nav:messages', title: 'Internal coordination', body: 'Use Messages for prototype internal communication across available municipal channels.' },
];

const departmentHead: TourStep[] = [
    { id: 'home', target: 'nav:home', title: 'Your office context', body: 'Your office context determines which work, information, and actions are available in this workspace.' },
    { id: 'work-queue', target: 'nav:myWork', title: 'Work Queue', body: 'Track routed office work, current ownership, and items requiring action.' },
    { id: 'correspondence', target: 'nav:correspondence', title: 'Inbox & Routing', body: 'Receive, review, and follow official correspondence available to this office context.' },
    { id: 'projects', target: 'nav:projectMonitoring', title: 'Project Monitoring', body: 'Review project information available to this department-head workspace without implying municipality-wide authority.' },
    { id: 'calendar', target: 'nav:calendar', title: 'Calendar', body: 'Keep office schedules, deadlines, and coordinated municipal activities visible.' },
    { id: 'messages', target: 'nav:messages', title: 'Messages', body: 'Coordinate with available municipal channels using the current prototype messaging workspace.' },
    { id: 'switcher', target: 'shell:workspace-switcher', title: 'Switch workspace', body: 'Return to the Showcase workspace selector when you need to evaluate another municipal role.' },
];

const employee: TourStep[] = [
    { id: 'home', target: 'nav:home', title: 'Daily workspace', body: 'Home summarizes the work and municipal context available to this employee workspace.' },
    { id: 'work-queue', target: 'nav:myWork', title: 'Work Queue', body: 'Focus on assigned or routed work and the items that need your follow-through.' },
    { id: 'memoranda', target: 'nav:memoranda', title: 'Official Memoranda', body: 'Review formal internal memoranda delivered to this workspace and acknowledge them when required.' },
    { id: 'calendar', target: 'nav:calendar', title: 'Calendar', body: 'Keep upcoming schedules, deadlines, meetings, and municipal activities visible.' },
    { id: 'records', target: 'nav:records', title: 'Records Register', body: 'Reference records available to your current authorized workspace.' },
    { id: 'messages', target: 'nav:messages', title: 'Messages', body: 'Use Messages for day-to-day prototype internal coordination.' },
];

const humanResources: TourStep[] = [
    { id: 'home', target: 'nav:home', title: 'Workforce context', body: 'Home presents the current operating context for authorized Human Resources work.' },
    { id: 'work-queue', target: 'nav:myWork', title: 'Authorized HR work', body: 'Use Work Queue for authorized HR functions and routed work available to this workspace.' },
    { id: 'staff', target: 'nav:employeeDirectory', title: 'Staff Directory', body: 'Use the Staff Directory as a work-context reference without exposing private personal contact information.' },
    { id: 'records', target: 'nav:records', title: 'Records Register', body: 'Reference records available to the current authorized Human Resources workspace.' },
    { id: 'calendar', target: 'nav:calendar', title: 'Calendar', body: 'Keep workforce schedules and coordinated municipal activities visible.' },
    { id: 'messages', target: 'nav:messages', title: 'Messages', body: 'Use Messages for available internal coordination across municipal channels.' },
];

const legislative: TourStep[] = [
    { id: 'home', target: 'nav:home', title: 'Legislative workspace', body: 'Home summarizes the records, schedules, and work available to this Legislative Office context.' },
    { id: 'issuances', target: 'nav:legislative', title: 'Ordinances & Issuances', body: 'Review the municipal register for ordinances, resolutions, executive orders, and related controlled issuances.' },
    { id: 'records', target: 'nav:records', title: 'Records Register', body: 'Reference records available to the current authorized workspace.' },
    { id: 'calendar', target: 'nav:calendar', title: 'Calendar', body: 'Keep session schedules, deadlines, and coordinated municipal activities visible.' },
    { id: 'meetings', target: 'nav:meetings', title: 'Meetings', body: 'Review the meeting information available to this workspace.' },
    { id: 'messages', target: 'nav:messages', title: 'Messages', body: 'Use Messages for prototype internal coordination across available municipal channels.' },
];

const systemAdministration: TourStep[] = [
    { id: 'home', target: 'nav:home', title: 'Administration workspace', body: 'Home summarizes the current system-administration operating context.' },
    { id: 'admin', target: 'nav:systemAdministration', title: 'System Administration', body: 'Open the administration surface for the functions currently authorized and wired in this prototype.' },
    { id: 'systems', target: 'nav:municipalSystems', title: 'Systems Directory', body: 'Review the internal directory of municipal systems, ownership, status, record scope, and integration context.' },
    { id: 'staff', target: 'nav:employeeDirectory', title: 'Staff Directory', body: 'Use the staff reference surface for work context available to this workspace.' },
    { id: 'switcher', target: 'shell:workspace-switcher', title: 'Switch workspace', body: 'Return to the Showcase workspace selector to evaluate another municipal role. Audit & Security is intentionally not treated as an ordinary tour destination.' },
];

export const personaTours: Record<PersonaTourKey, TourStep[]> = {
    executive,
    engineering_head: departmentHead,
    budget_head: departmentHead,
    employee,
    hr: humanResources,
    legislative,
    system_admin: systemAdministration,
};
