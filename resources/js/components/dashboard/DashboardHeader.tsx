import { usePage } from '@inertiajs/react';
import type { SharedProps } from '../../types';
import type { DashboardExperience } from './types';

const profileCopy = {
    employee: 'Review your assigned work, correspondence and recent updates.',
    department_head: 'Review your office workload and items requiring action.',
    executive_oversight: 'Review municipal workload and items requiring executive attention.',
    system_administration: 'Review account access, security and office identities.',
};

export default function DashboardHeader({ experience }: { experience: DashboardExperience }) {
    const { auth } = usePage<SharedProps>().props;
    const name = auth.user?.name.trim().replace(/^(?:(?:Engr|Dr|Atty|Mr|Mrs|Ms)\.?\s+)+/i, '').split(/\s+/)[0];
    return <header className="dashboard-heading">
        <div className="dashboard-heading-context">
            <p className="dashboard-eyebrow">{experience.label}</p>
            <p className="dashboard-context">{experience.department.name}</p>
        </div>
        <h1>Welcome{name ? ', ' + name : ''}</h1>
        <p>{profileCopy[experience.key]}</p>
    </header>;
}
