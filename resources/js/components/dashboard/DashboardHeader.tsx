import { usePage } from '@inertiajs/react';
import type { SharedProps } from '../../types';
import MunicipalContext from './MunicipalContext';
import type { DashboardExperience } from './types';

const profileCopy = {
    employee: 'Here’s the work currently assigned to you.',
    department_head: 'Review your office workload and items requiring action.',
    executive_oversight: 'Review municipal workload and items requiring executive attention.',
    system_administration: 'Review account access, security, and platform status.',
};

export default function DashboardHeader({ experience }: { experience: DashboardExperience }) {
    const { auth } = usePage<SharedProps>().props;
    const name = auth.user?.name.trim().replace(/^(?:(?:Engr|Dr|Atty|Mr|Mrs|Ms)\.?\s+)+/i, '').split(/\s+/)[0];
    return <div className="space-y-3">
        <header className="workspace-welcome municipal-panel">
            <div className="px-5 py-7 sm:px-7">
                <h1 className="break-words text-[clamp(1.75rem,3vw,2.25rem)] font-extrabold leading-tight tracking-[-0.035em]">Welcome{name ? ', ' + name : ''}</h1>
                <p className="mt-3 max-w-2xl text-base leading-7 text-slate-700 dark:text-slate-200">{profileCopy[experience.key]}</p>
                <p className="mt-3 text-base text-slate-600 dark:text-slate-300">{experience.department.name}</p>
            </div>
        </header>
        <MunicipalContext />
    </div>;
}
