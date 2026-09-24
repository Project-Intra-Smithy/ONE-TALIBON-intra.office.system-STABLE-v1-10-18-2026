export type PrototypeChannel = {
    channel: string;
    offices: string[];
};

export const prototypeChannels: PrototypeChannel[] = [
    {
        channel: 'General',
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
