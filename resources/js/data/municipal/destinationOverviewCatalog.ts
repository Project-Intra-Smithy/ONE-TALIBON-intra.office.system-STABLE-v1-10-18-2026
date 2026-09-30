import type { PortalDestinationKey } from '../../navigation/navigationTypes';

export type DestinationOverview = {
    title: string;
    overview: string;
    purpose: string[];
    connection?: string;
};

export const destinationOverviewCatalog: Record<PortalDestinationKey, DestinationOverview> = {
    home: {
        title: 'Home',
        overview: 'Home is the starting point for the municipal work and operating context available to your current workspace.',
        purpose: [
            'See the workspace context available to you.',
            'Orient yourself before moving into focused work areas.',
            'Reach the daily tools and information your role can access.',
        ],
    },
    portalSearch: {
        title: 'Search Portal',
        overview: 'Search Portal provides one place to find supported ONE TALIBON destinations and information available to your workspace.',
        purpose: [
            'Find a portal area without browsing the full sidebar.',
            'Locate supported records and references available to you.',
            'Move directly to the relevant municipal work area.',
        ],
    },
    documentCenter: {
        title: 'Document Center',
        overview: 'Document Center is the shared document-access area for files and document references available to your workspace.',
        purpose: [
            'Open documents made available to your workspace.',
            'Keep document access separate from routing and correspondence actions.',
            'Support day-to-day reference and follow-through on official work.',
        ],
    },
    myWork: {
        title: 'Tasks & Assignments',
        overview: 'Tasks & Assignments focuses the municipal work currently assigned, routed, or requiring follow-through in your workspace.',
        purpose: [
            'See work that needs attention.',
            'Understand current responsibility, priority, and status.',
            'Follow assigned work through its next required action.',
        ],
    },
    correspondence: {
        title: 'Correspondence',
        overview: 'Correspondence supports official office-to-office communication, routing, and follow-through across municipal work.',
        purpose: [
            'Receive and review official correspondence available to your office.',
            'Route work to the responsible office or personnel when authorized.',
            'Keep document movement and follow-through visible.',
        ],
        connection: 'Document Center complements this area by providing document and file access without replacing correspondence workflow.',
    },
    procurementTracking: {
        title: 'Procurement / PR Tracking',
        overview: 'Procurement / PR Tracking provides a focused view of purchase-request progress and procurement references available to the workspace.',
        purpose: [
            'Follow purchase-request status through the visible procurement lifecycle.',
            'Reference sourcing, delivery, and inspection information when available.',
            'Support coordination between requesting and responsible offices.',
        ],
    },
    records: {
        title: 'Municipal Records',
        overview: 'Municipal Records is the reference area for official records available to your authorized workspace.',
        purpose: [
            'Review records available to your office or role.',
            'Use a consistent municipal reference surface.',
            'Move from record discovery to the appropriate related work area.',
        ],
    },
    memoranda: {
        title: 'Official Memoranda',
        overview: 'Official Memoranda is the formal internal memorandum area for issuances available to your workspace.',
        purpose: [
            'Review newly available internal memoranda.',
            'See memorandum details relevant to your workspace.',
            'Acknowledge an issuance when the memorandum requires it and your workspace permits it.',
        ],
    },
    announcements: {
        title: 'Announcements',
        overview: 'Announcements keeps internal municipal notices and shared updates visible in one dedicated area.',
        purpose: [
            'Review municipal notices available to your workspace.',
            'Keep broad internal updates separate from formal memoranda.',
            'Stay current on information shared across offices.',
        ],
    },
    calendar: {
        title: 'Calendar',
        overview: 'Calendar is the date-first workspace for authorized municipal, office, and personal event information available to you.',
        purpose: [
            'Review schedules and dated municipal work.',
            'Move between calendar periods and supported views.',
            'Keep office and personal event context visible without widening authorization.',
        ],
    },
    meetings: {
        title: 'Meetings',
        overview: 'Meetings provides the meeting information and coordination references available to your workspace.',
        purpose: [
            'Review scheduled meeting information.',
            'Keep meeting context separate from general calendar browsing.',
            'Support preparation and coordination around municipal meetings.',
        ],
    },
    messages: {
        title: 'Messages',
        overview: 'Messages is the internal conversation workspace for municipal channels available to your current role and office context.',
        purpose: [
            'Read available internal conversations.',
            'Send messages where the current channel permits it.',
            'Keep day-to-day coordination in a focused chat workspace.',
        ],
    },
    executiveDepartments: {
        title: 'Executive Departments',
        overview: 'Executive Departments provides a municipal reference for executive offices and department structure available to the workspace.',
        purpose: [
            'Review executive department information.',
            'Understand office context within the municipal organization.',
            'Use department references when coordinating official work.',
        ],
    },
    employeeDirectory: {
        title: 'HR Employee Portal',
        overview: 'HR Employee Portal provides municipal employee and office reference information available to your workspace.',
        purpose: [
            'Reference employees available to your authorized workspace.',
            'Review office and personnel context used for municipal coordination.',
            'Support work routing and internal reference without implying broader HR functions.',
        ],
    },
    legislative: {
        title: 'Ordinances & Issuances',
        overview: 'Ordinances & Issuances provides the municipal reference surface for legislative and controlled issuance records available to your workspace.',
        purpose: [
            'Review ordinances, resolutions, and related issuances.',
            'Reference controlled municipal issuance information.',
            'Keep legislative records distinct from general documents and memoranda.',
        ],
    },
    localSpecialBodies: {
        title: 'Councils, Boards & Committees',
        overview: 'This area provides an organizational reference for municipal councils, boards, committees, and other local special bodies represented in ONE TALIBON.',
        purpose: [
            'Review represented municipal bodies.',
            'Understand organizational relationships relevant to coordination.',
            'Use the reference when navigating related municipal work.',
        ],
    },
    developmentPlans: {
        title: 'Development Plans',
        overview: 'Development Plans provides the planning-reference area for municipal development plans available to your workspace.',
        purpose: [
            'Review development-plan references.',
            'Keep long-range planning context visible to authorized workspaces.',
            'Connect planning references with programs, projects, and monitoring areas.',
        ],
    },
    ppas: {
        title: 'PPAs',
        overview: 'PPAs provides a planning reference for programs, projects, and activities represented in the municipal workspace.',
        purpose: [
            'Review program, project, and activity references.',
            'Support planning and department coordination.',
            'Connect planned work with related monitoring information where available.',
        ],
    },
    projectMonitoring: {
        title: 'Project Monitoring',
        overview: 'Project Monitoring focuses on implementation status, milestones, and project visibility available to planning and oversight workspaces.',
        purpose: [
            'Review project implementation status.',
            'Follow milestones and progress references.',
            'Support department and planning oversight without changing project authority.',
        ],
    },
    users: {
        title: 'Users',
        overview: 'Users is reserved for authorized administration of portal user references when that destination is enabled for the workspace.',
        purpose: [
            'Review user administration information when available.',
            'Support authorized portal administration.',
            'Keep user administration separate from employee-reference functions.',
        ],
    },
    adminDepartments: {
        title: 'Departments',
        overview: 'Departments is reserved for authorized administration of department references when that destination is enabled for the workspace.',
        purpose: [
            'Review department administration information when available.',
            'Support authorized maintenance of municipal department references.',
            'Keep administrative controls separate from the general department directory.',
        ],
    },
    systemAdministration: {
        title: 'System Administration',
        overview: 'System Administration contains the ONE TALIBON administration functions made available to authorized system-administration workspaces.',
        purpose: [
            'Access authorized system-administration functions.',
            'Review administrative controls available to the current workspace.',
            'Keep restricted administration separate from everyday employee work areas.',
        ],
    },
    municipalSystems: {
        title: 'Future Integrations',
        overview: 'Future Integrations presents the wider ONE TALIBON municipal-systems roadmap through controlled system previews and integration context.',
        purpose: [
            'Explore planned municipal-system integration areas.',
            'Understand how future systems may connect to ONE TALIBON.',
            'Review previews without treating them as live operational modules.',
        ],
    },
};
