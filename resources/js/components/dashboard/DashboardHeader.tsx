import { usePage } from '@inertiajs/react';
import type { SharedProps } from '../../types';
import { talibonAssets } from '../../branding/talibonAssets';
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
    const name = auth.user?.name?.trim().replace(/^(?:(?:Engr|Dr|Atty|Mr|Mrs|Ms)\.?\s+)+/i, '').split(/\s+/)[0];
    return <header className="ot-dashboard-hero" style={{ backgroundImage: `linear-gradient(90deg, rgba(11,68,45,.98), rgba(11,68,45,.88) 54%, rgba(11,68,45,.50)), url("${talibonAssets.internalHero}")` }}>
        <div className="ot-dashboard-hero-copy">
            <p className="ot-dashboard-hero-eyebrow">ONE TALIBON · LGU INTRA-OFFICE PORTAL</p>
            <h1>Welcome{name ? `, ${name}` : ''}</h1>
            <p className="ot-dashboard-hero-description">{profileCopy[experience.key]}</p>
            <p className="ot-dashboard-hero-context">{dashboardRoleLabel(experience)} · {experience.department.shortName || experience.department.name}</p>
        </div>
        <span className="ot-dashboard-hero-motto" aria-hidden="true">One LGU.<br />One Portal.<br />One Talibon.</span>
    </header>;
}
