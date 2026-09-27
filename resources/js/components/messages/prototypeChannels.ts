export type PrototypeChannel = {
    channel: string;
    description: string;
    offices: string[];
};

export const prototypeChannels: PrototypeChannel[] = [
    {
        channel: 'General',
        description: 'Municipality-wide coordination',
        offices: [
            'Municipal Planning and Development Office',
            'Municipal Health Office',
            'Municipal Disaster Risk Reduction and Management Office',
            'Municipal Environment and Natural Resources Office',
            'Municipal Treasurer’s Office',
            'Sangguniang Bayan Secretariat',
        ],
    },
    {
        channel: 'Department Heads',
        description: 'Department leadership coordination',
        offices: [
            'Municipal Planning and Development Office',
            'Municipal Engineering Office',
            'Municipal Disaster Risk Reduction and Management Office',
            'Municipal Environment and Natural Resources Office',
            'Municipal Agriculture Office',
            'Sangguniang Bayan Secretariat',
        ],
    },
    {
        channel: 'MPDO Planning',
        description: 'Plans, programs, and office inputs',
        offices: [
            'Municipal Planning and Development Office',
            'Municipal Engineering Office',
            'Municipal Budget Office',
            'Municipal Environment and Natural Resources Office',
            'Municipal Agriculture Office',
            'Municipal Social Welfare and Development Office',
        ],
    },
    {
        channel: 'Project Monitoring',
        description: 'Milestones, utilization, and follow-up',
        offices: [
            'Municipal Engineering Office',
            'Municipal Budget Office',
            'Municipal Administrator’s Office',
            'Municipal Agriculture Office',
            'Municipal Social Welfare and Development Office',
            'Municipal Tourism Office',
        ],
    },
    {
        channel: "Mayor's Office",
        description: 'Executive coordination and endorsements',
        offices: [
            'Municipal Budget Office',
            'Municipal Administrator’s Office',
            'Municipal Health Office',
            'Municipal Social Welfare and Development Office',
            'Municipal Tourism Office',
            'Municipal Treasurer’s Office',
        ],
    },
    {
        channel: 'Inter-Office Coordination',
        description: 'Cross-office routing and follow-up',
        offices: [
            'Municipal Administrator’s Office',
            'Municipal Health Office',
            'Municipal Disaster Risk Reduction and Management Office',
            'Municipal Tourism Office',
            'Municipal Treasurer’s Office',
            'Sangguniang Bayan Secretariat',
        ],
    },
];
