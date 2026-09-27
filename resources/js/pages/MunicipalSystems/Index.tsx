import { useMemo, useState } from 'react';
import { Activity, Clock3, Link2, Network, Search, ShieldOff } from 'lucide-react';
import AppLayout from '../../layouts/AppLayout';
import PageFrame from '../../components/PageFrame';
import PageHeader from '../../components/PageHeader';
import SystemDirectory from '../../components/municipal-systems/SystemDirectory';
import { municipalSystems, systemGroups } from '../../data/municipal/systems';

const summaryTone = {
    Active: {
        shell: 'border-emerald-100 bg-emerald-50/80 text-emerald-950 dark:border-emerald-900/50 dark:bg-emerald-950/35 dark:text-emerald-200',
        icon: 'bg-white/80 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300',
        Icon: Activity,
    },
    Integrated: {
        shell: 'border-teal-100 bg-teal-50/80 text-teal-950 dark:border-teal-900/50 dark:bg-teal-950/35 dark:text-teal-200',
        icon: 'bg-white/80 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300',
        Icon: Link2,
    },
    'Not Enabled': {
        shell: 'border-slate-200 bg-slate-50/90 text-slate-800 dark:border-slate-700 dark:bg-slate-900/45 dark:text-slate-200',
        icon: 'bg-white/80 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
        Icon: ShieldOff,
    },
    Planned: {
        shell: 'border-amber-100 bg-amber-50/80 text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200',
        icon: 'bg-white/80 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300',
        Icon: Clock3,
    },
} as const;

export default function Index() {
    const [q, setQ] = useState('');
    const [group, setGroup] = useState('');
    const [status, setStatus] = useState('');

    const systems = useMemo(() => {
        const needle = q.trim().toLowerCase();
        return municipalSystems.filter((system) =>
            (!group || system.group === group)
            && (!status || system.status === status)
            && (!needle || [system.name, system.group, system.owningOffice, system.purpose, system.recordScope, system.integrationNote].join(' ').toLowerCase().includes(needle))
        );
    }, [q, group, status]);

    const counts = {
        Active: systems.filter((system) => system.status === 'Active').length,
        Integrated: systems.filter((system) => system.status === 'Integrated').length,
        'Not Enabled': systems.filter((system) => system.status === 'Not Enabled').length,
        Planned: systems.filter((system) => system.status === 'Planned').length,
    } as const;

    return (
        <AppLayout title="Systems Directory">
            <PageFrame density="compact">
                <PageHeader
                    eyebrow="Municipal systems map"
                    title="Systems Directory"
                    description="Internal directory and map of municipal systems, their owning offices, operating status, record scope, and current integration context."
                    icon={Network}
                />

                <section className="grid gap-1.5 sm:grid-cols-2 xl:grid-cols-4" aria-label="Systems directory status summary">
                    {(Object.keys(summaryTone) as Array<keyof typeof summaryTone>).map((label) => {
                        const { shell, icon, Icon } = summaryTone[label];
                        return (
                            <div key={label} className={`flex min-h-[46px] min-w-0 items-center gap-2.5 rounded-lg border px-3 py-2 ${shell}`}>
                                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${icon}`}>
                                    <Icon size={14} aria-hidden="true" />
                                </span>
                                <div className="min-w-0">
                                    <div className="text-[16px] font-extrabold leading-none tabular-nums">{counts[label]}</div>
                                    <div className="mt-1 truncate text-[10px] font-semibold leading-none opacity-75">{label}</div>
                                </div>
                            </div>
                        );
                    })}
                </section>

                <div className="grid gap-1.5 rounded-xl border border-slate-200 bg-white p-2 dark:border-slate-700 dark:bg-[#142236] md:grid-cols-[minmax(0,1fr)_230px_190px]">
                    <label className="relative min-w-0">
                        <span className="sr-only">Search systems directory</span>
                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                        <input
                            value={q}
                            onChange={(event) => setQ(event.target.value)}
                            placeholder="Search system, office, scope, or context"
                            className="min-h-9 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm outline-none focus:border-[var(--municipal-brand)] focus:ring-2 focus:ring-[var(--municipal-focus)]/20 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                        />
                    </label>

                    <select
                        aria-label="System group"
                        value={group}
                        onChange={(event) => setGroup(event.target.value)}
                        className="min-h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-[var(--municipal-brand)] focus:ring-2 focus:ring-[var(--municipal-focus)]/20 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                    >
                        <option value="">All groups</option>
                        {systemGroups.map((item) => <option key={item}>{item}</option>)}
                    </select>

                    <select
                        aria-label="System status"
                        value={status}
                        onChange={(event) => setStatus(event.target.value)}
                        className="min-h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-[var(--municipal-brand)] focus:ring-2 focus:ring-[var(--municipal-focus)]/20 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                    >
                        <option value="">All statuses</option>
                        <option>Active</option>
                        <option>Integrated</option>
                        <option>Not Enabled</option>
                        <option>Planned</option>
                    </select>
                </div>

                <SystemDirectory systems={systems} />
            </PageFrame>
        </AppLayout>
    );
}
