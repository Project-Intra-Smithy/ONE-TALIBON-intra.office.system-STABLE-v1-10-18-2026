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
    const context = [dashboardRoleLabel(experience), office].filter(Boolean).join(' · ');

    return <header className="ot-dashboard-hero r7-civic-hero" aria-label="Dashboard welcome">
        <div className="ot-dashboard-hero-copy r7-civic-hero__copy">
            <p className="ot-dashboard-hero-eyebrow">LGU TALIBON <span aria-hidden="true">/</span> INTRA-OFFICE PORTAL</p>
            <h1>Welcome{name ? `, ${name}` : ''}</h1>
            <p className="ot-dashboard-hero-description">{profileCopy[experience.key]}</p>
            {context && <p className="ot-dashboard-hero-context">{context}</p>}
        </div>
        <div className="r7-civic-hero__art" aria-hidden="true">
            <span className="r7-civic-hero__ring r7-civic-hero__ring--outer" />
            <span className="r7-civic-hero__ring r7-civic-hero__ring--inner" />
            <span className="r7-civic-hero__art-line" />
            <span className="r7-civic-hero__art-label">ONE TALIBON</span>
        </div>
    </header>;
}
