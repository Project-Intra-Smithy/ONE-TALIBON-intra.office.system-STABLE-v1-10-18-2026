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

    return <header className="tcds-card p-5" aria-label="Dashboard welcome">
        <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--brand-ink)]">Daily municipal workspace</p>
            <h1 className="mt-1 text-2xl font-bold text-[var(--ink-primary)]">{name ? `${name}'s work` : 'Daily work'}</h1>
            <p className="mt-1 text-sm text-[var(--ink-secondary)]">{profileCopy[experience.key]}</p>
            {context && <p className="mt-1 text-xs font-semibold text-[var(--ink-secondary)]">{context}</p>}
        </div>
    </header>;
}
