import { usePage } from '@inertiajs/react';
import type { SharedProps } from '../../types';
import { dashboardRoleLabel } from './rolePresentation';
import type { DashboardExperience } from './types';

const profileCopy = {
    employee: 'Your work and office updates in one place.',
    department_head: 'Office workload and items requiring attention.',
    executive_oversight: 'Municipal workload and executive oversight.',
    system_administration: 'Account access, security and platform operations.',
};

export default function DashboardHeader({ experience }: { experience: DashboardExperience }) {
    const { auth } = usePage<SharedProps>().props;
    const name = auth.user?.name?.trim();
    const office = experience.department.shortName || experience.department.name;

    return <header className="ot-dashboard-hero" aria-label="Dashboard welcome">
        <div className="ot-dashboard-hero-copy">
            <p className="ot-dashboard-hero-eyebrow">LGU TALIBON INTRA-OFFICE PORTAL</p>
            <h1>Welcome{name ? ', ' + name : ''}</h1>
            <p className="ot-dashboard-hero-description">{profileCopy[experience.key]}</p>
            <p className="ot-dashboard-hero-context">{dashboardRoleLabel(experience)} · {office}</p>
        </div>
        <div className="ot-dashboard-hero-motto" aria-hidden="true">
            <span>People</span>
            <span>Plans</span>
            <span>Progress</span>
            <strong>One Talibon</strong>
        </div>
    </header>;
}
