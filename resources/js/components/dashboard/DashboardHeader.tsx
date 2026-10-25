import { usePage } from '@inertiajs/react';
import type { SharedProps } from '../../types';
import { dashboardRoleLabel } from './rolePresentation';
import type { DashboardExperience } from './types';
import MunicipalContext from './MunicipalContext';

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
        <div className="dashboard-civic-identity">
            <img className="dashboard-municipal-seal" src="/brand/municipal.logo.png" alt="Municipality of Talibon seal" />
            <div className="ot-dashboard-hero-copy r7-civic-hero__copy">
                <p className="ot-dashboard-hero-eyebrow">Municipality of Talibon · Bohol</p>
                <h1>One <span>Talibon</span></h1>
                <p className="dashboard-portal-subtitle">Intra-Office Portal</p>
                <p className="ot-dashboard-hero-description">{profileCopy[experience.key]}</p>
            </div>
        </div>
        <div className="dashboard-civic-footer">
            <div>
                <p>Welcome{name ? `, ${name}` : ''}</p>
                {context && <p className="ot-dashboard-hero-context">{context}</p>}
            </div>
            <MunicipalContext />
        </div>
    </header>;
}
