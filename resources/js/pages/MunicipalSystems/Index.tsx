import { Link } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import {
    ArrowUpRight,
    ChevronRight,
    FileText,
    FolderKanban,
    ListChecks,
    Network,
    Search,
    ShoppingCart,
    SlidersHorizontal,
    Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import FutureIntegrationDetail from '../../components/municipal-systems/FutureIntegrationDetail';
import ProcurementWorkspace from '../../components/municipal-systems/ProcurementWorkspace';
import SystemDirectory from '../../components/municipal-systems/SystemDirectory';
import PageFrame from '../../components/PageFrame';
import { procurementPrototype } from '../../data/municipal/futureSystemPrototypeData';
import {
    corePlatform,
    initialRollout,
    municipalSystems,
    supportingFoundations,
    systemGroups,
    type MunicipalSystem,
} from '../../data/municipal/systems';
import AppLayout from '../../layouts/AppLayout';

type Props = {
    showcase?: 'procurement';
};

type RolloutEntry = {
    href: string;
    action: string;
    value: string;
    icon: LucideIcon;
};

const rolloutEntries: Record<string, RolloutEntry> = {
    'ROL-01': {
        href: '/correspondence',
        action: 'Open Correspondence',
        value: 'Correspondence, memoranda and routed document work.',
        icon: FileText,
    },
    'ROL-02': {
        href: '/transactions',
        action: 'Open Tasks & Assignments',
        value: 'Task ownership, assignments and executive work visibility.',
        icon: ListChecks,
    },
    'ROL-03': {
        href: '/operations',
        action: 'Open Project Monitoring',
        value: 'PPAs, milestones and implementation progress context.',
        icon: FolderKanban,
    },
    'ROL-04': {
        href: '/procurement',
        action: 'Open Procurement',
        value: 'PR lifecycle, sourcing, delivery and inspection reference.',
        icon: ShoppingCart,
    },
    'ROL-05': {
        href: '/employees',
        action: 'Open HR Employee Portal',
        value: 'Personnel-reference and employee portal foundation.',
        icon: Users,
    },
};

const rolloutTone: Record<string, string> = {
    'Current / Working':
        'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/25 dark:text-emerald-200',
    'Main Showcase / Interactive Static Prototype':
        'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/25 dark:text-amber-200',
    'Current Personnel Reference':
        'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900/60 dark:bg-blue-950/25 dark:text-blue-200',
};

const coreTone: Record<string, string> = {
    Current: 'bg-emerald-500',
    'Current Foundation': 'bg-teal-500',
    'Platform Foundation': 'bg-blue-500',
    'Integration Direction': 'bg-slate-400',
};

function rolloutStateLabel(state: string) {
    return state.startsWith('Main Showcase') ? 'Presentation workspace' : state;
}

function coreLabel(name: string) {
    return name
        .replace('Unified authenticated access / SSO direction', 'Authenticated Access')
        .replace('Employee/User Directory', 'User Directory')
        .replace('Task/Workflow Engine', 'Workflow Engine')
        .replace('Digital Approval foundation', 'Digital Approval')
        .replace('Central File Repository', 'File Repository')
        .replace('API / Integration Layer direction', 'API / Integration');
}

export default function Index({ showcase }: Props) {
    const [q, setQ] = useState('');
    const [filter, setFilter] = useState('');
    const [selectedSystem, setSelectedSystem] = useState<MunicipalSystem | null>(null);

    const systems = useMemo(() => {
        const needle = q.trim().toLowerCase();
        const [filterType, filterValue] = filter ? filter.split(':', 2) : ['', ''];

        return municipalSystems.filter((system) => {
            const matchesFilter =
                !filter ||
                (filterType === 'group' && system.group === filterValue) ||
                (filterType === 'status' && system.status === filterValue);

            const matchesSearch =
                !needle ||
                [
                    system.id,
                    system.name,
                    system.group,
                    system.owningOffice,
                    system.purpose,
                    system.recordScope,
                    ...system.conceptItems,
                ]
                    .join(' ')
                    .toLowerCase()
                    .includes(needle);

            return matchesFilter && matchesSearch;
        });
    }, [q, filter]);

    if (showcase === 'procurement') {
        return (
            <AppLayout title="Procurement / PR Tracking">
                <PageFrame density="compact">
                    <ProcurementWorkspace prototype={procurementPrototype} />
                </PageFrame>
            </AppLayout>
        );
    }

    return (
        <AppLayout title="Municipal Systems">
            <PageFrame density="compact">
                {selectedSystem ? (
                    <FutureIntegrationDetail
                        system={selectedSystem}
                        onBack={() => setSelectedSystem(null)}
                    />
                ) : (
                    <div className="space-y-2.5 xl:grid xl:min-h-[calc(100vh-11.5rem)] xl:grid-rows-[auto_auto_minmax(0,1fr)] xl:gap-3 xl:space-y-0 2xl:min-h-[calc(100vh-10.5rem)]">
                        <section className="rounded-xl border border-emerald-200 bg-gradient-to-r from-white via-emerald-50/55 to-amber-50/35 px-3 py-2.5 shadow-sm dark:border-emerald-900/60 dark:from-[#142236] dark:via-emerald-950/15 dark:to-amber-950/10 xl:px-4 xl:py-3">
                            <div className="grid gap-2.5 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-center 2xl:grid-cols-[minmax(0,1fr)_450px]">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-300 xl:text-[9px]">
                                        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-emerald-700 text-white dark:bg-emerald-600 xl:h-7 xl:w-7">
                                            <Network size={13} aria-hidden="true" />
                                        </span>
                                        TALIBON INTRA-OFFICE PORTAL
                                    </div>
                                    <h1 className="mt-1 text-[17px] font-black leading-tight tracking-tight text-slate-950 dark:text-white sm:text-[19px] xl:text-[22px] 2xl:text-[24px]">
                                        Municipal systems connected through one shared digital backbone.
                                    </h1>
                                    <p className="mt-0.5 text-[9px] text-slate-500 dark:text-slate-400 xl:text-[10px]">
                                        Current rollout, future municipal workspaces and reusable platform foundations.
                                    </p>
                                </div>

                                <div className="grid grid-cols-3 overflow-hidden rounded-lg border border-slate-200 bg-white/85 dark:border-slate-700 dark:bg-slate-900/45">
                                    <div className="px-2.5 py-2 text-center xl:py-2.5">
                                        <div className="text-[17px] font-black tabular-nums text-emerald-700 dark:text-emerald-300 xl:text-[21px]">
                                            {initialRollout.length}
                                        </div>
                                        <div className="text-[7px] font-extrabold uppercase tracking-[0.05em] text-slate-500 dark:text-slate-400 xl:text-[8px]">
                                            Rollout Priorities
                                        </div>
                                    </div>
                                    <div className="border-x border-slate-200 px-2.5 py-2 text-center dark:border-slate-700 xl:py-2.5">
                                        <div className="text-[17px] font-black tabular-nums text-amber-700 dark:text-amber-300 xl:text-[21px]">
                                            {municipalSystems.length}
                                        </div>
                                        <div className="text-[7px] font-extrabold uppercase tracking-[0.05em] text-slate-500 dark:text-slate-400 xl:text-[8px]">
                                            Future Systems
                                        </div>
                                    </div>
                                    <div className="px-2.5 py-2 text-center xl:py-2.5">
                                        <div className="flex h-[21px] items-center justify-center text-emerald-700 dark:text-emerald-300 xl:h-[26px]">
                                            <Network size={16} aria-hidden="true" />
                                        </div>
                                        <div className="text-[7px] font-extrabold uppercase tracking-[0.05em] text-slate-500 dark:text-slate-400 xl:text-[8px]">
                                            Shared Backbone
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section aria-labelledby="rollout-heading" className="space-y-1.5 xl:flex xl:min-h-0 xl:flex-col xl:space-y-2">
                            <div className="flex items-end justify-between gap-3">
                                <div>
                                    <div className="text-[8px] font-black uppercase tracking-[0.11em] text-emerald-700 dark:text-emerald-300 xl:text-[9px]">
                                        Initial Rollout
                                    </div>
                                    <h2 id="rollout-heading" className="text-[12px] font-extrabold text-slate-950 dark:text-slate-100 xl:text-[14px]">
                                        Five working ONE TALIBON entry points
                                    </h2>
                                </div>
                                <span className="hidden text-[8px] font-semibold text-slate-400 sm:block xl:text-[9px]">
                                    Existing portal destinations
                                </span>
                            </div>

                            <div className="grid gap-1.5 sm:grid-cols-2 xl:flex-1 xl:grid-cols-5 xl:gap-2">
                                {initialRollout.map((item) => {
                                    const entry = rolloutEntries[item.id];
                                    const Icon = entry.icon;

                                    return (
                                        <Link
                                            key={item.id}
                                            href={entry.href}
                                            aria-label={`${entry.action}: ${item.name}`}
                                            className="group flex min-h-[108px] min-w-0 flex-col rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[var(--municipal-focus)]/30 dark:border-slate-700 dark:bg-[#142236] dark:hover:border-emerald-900/70 xl:min-h-[128px] xl:p-3 2xl:min-h-[136px]"
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex min-w-0 items-center gap-2">
                                                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300 xl:h-8 xl:w-8">
                                                        <Icon size={14} aria-hidden="true" />
                                                    </span>
                                                    <span className="text-[7px] font-black uppercase tracking-[0.08em] text-slate-400 xl:text-[8px]">
                                                        {item.id}
                                                    </span>
                                                </div>
                                                <ChevronRight
                                                    size={13}
                                                    className="shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-emerald-600"
                                                    aria-hidden="true"
                                                />
                                            </div>

                                            <h3 className="mt-1.5 line-clamp-2 text-[10px] font-extrabold leading-3.5 text-slate-950 dark:text-slate-100 xl:mt-2 xl:text-[11px] xl:leading-4">
                                                {item.name}
                                            </h3>
                                            <p className="mt-1 line-clamp-2 text-[8px] leading-3 text-slate-500 dark:text-slate-400 xl:text-[9px] xl:leading-3.5">
                                                {entry.value}
                                            </p>

                                            <div className="mt-auto flex items-end justify-between gap-2 pt-1.5 xl:pt-2">
                                                <span
                                                    className={
                                                        'rounded-full border px-1.5 py-0.5 text-[7px] font-bold xl:text-[7.5px] ' +
                                                        rolloutTone[item.state]
                                                    }
                                                >
                                                    {rolloutStateLabel(item.state)}
                                                </span>
                                                <span className="truncate text-right text-[7px] font-extrabold text-emerald-700 dark:text-emerald-300 xl:text-[8px]">
                                                    {entry.action}
                                                </span>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        </section>

                        <div className="grid items-stretch gap-2.5 xl:min-h-0 xl:grid-cols-[minmax(0,2.25fr)_minmax(270px,.9fr)] xl:gap-3">
                            <section
                                aria-labelledby="future-heading"
                                className="flex min-h-0 min-w-0 flex-col rounded-xl border border-slate-200 bg-slate-50/55 p-2.5 dark:border-slate-700 dark:bg-slate-900/20 xl:h-full xl:p-3"
                            >
                                <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="min-w-0">
                                        <div className="text-[8px] font-black uppercase tracking-[0.11em] text-amber-700 dark:text-amber-300 xl:text-[9px]">
                                            Future Integrations
                                        </div>
                                        <div className="flex items-baseline gap-2">
                                            <h2 id="future-heading" className="text-[12px] font-extrabold text-slate-950 dark:text-slate-100 xl:text-[14px]">
                                                Municipal system matrix
                                            </h2>
                                            <span className="text-[8px] font-bold tabular-nums text-slate-400 xl:text-[9px]">
                                                {systems.length}/{municipalSystems.length}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="grid gap-1.5 sm:grid-cols-[minmax(170px,1fr)_142px] xl:grid-cols-[minmax(180px,220px)_140px]">
                                        <label className="relative min-w-0">
                                            <span className="sr-only">Search future systems</span>
                                            <Search
                                                size={12}
                                                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                                                aria-hidden="true"
                                            />
                                            <input
                                                value={q}
                                                onChange={(event) => setQ(event.target.value)}
                                                placeholder="Search systems"
                                                className="h-8 w-full rounded-lg border border-slate-300 bg-white pl-8 pr-2 text-[9px] text-slate-900 outline-none focus:border-[var(--municipal-brand)] focus:ring-2 focus:ring-[var(--municipal-focus)]/20 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 xl:text-[9.5px]"
                                            />
                                        </label>

                                        <label className="relative min-w-0">
                                            <span className="sr-only">Filter future systems</span>
                                            <SlidersHorizontal
                                                size={11}
                                                className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                                                aria-hidden="true"
                                            />
                                            <select
                                                value={filter}
                                                onChange={(event) => setFilter(event.target.value)}
                                                className="h-8 w-full appearance-none rounded-lg border border-slate-300 bg-white pl-7 pr-6 text-[8px] font-semibold text-slate-700 outline-none focus:border-[var(--municipal-brand)] dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 xl:text-[8.5px]"
                                                aria-label="Filter future systems by group or status"
                                            >
                                                <option value="">All systems</option>
                                                {systemGroups.map((item) => (
                                                    <option key={item} value={`group:${item}`}>
                                                        {item}
                                                    </option>
                                                ))}
                                                <option value="status:Planned">Status: Planned</option>
                                                <option value="status:Not Enabled">Status: Not Enabled</option>
                                            </select>
                                        </label>
                                    </div>
                                </div>

                                <div className="mt-2 min-h-0 flex-1 xl:mt-2.5">
                                    <SystemDirectory systems={systems} onSelect={setSelectedSystem} />
                                </div>
                            </section>

                            <aside
                                aria-labelledby="core-heading"
                                className="flex min-h-0 flex-col rounded-xl border border-emerald-200 bg-white p-2.5 shadow-sm dark:border-emerald-900/60 dark:bg-[#142236] xl:h-full xl:p-3"
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <div>
                                        <div className="text-[8px] font-black uppercase tracking-[0.11em] text-emerald-700 dark:text-emerald-300 xl:text-[9px]">
                                            Core Platform
                                        </div>
                                        <h2 id="core-heading" className="text-[12px] font-extrabold text-slate-950 dark:text-slate-100 xl:text-[14px]">
                                            Shared architecture
                                        </h2>
                                    </div>
                                    <Network size={17} className="text-emerald-700 dark:text-emerald-300" aria-hidden="true" />
                                </div>

                                <div className="mt-2 divide-y divide-slate-100 border-y border-slate-100 dark:divide-slate-700 dark:border-slate-700 xl:mt-2.5 xl:flex-1">
                                    {corePlatform.map((item) => (
                                        <div key={item.name} className="flex min-h-7 items-center gap-2 py-1 xl:min-h-8 xl:gap-2.5 xl:py-1.5">
                                            <span
                                                className={
                                                    'h-1.5 w-1.5 shrink-0 rounded-full xl:h-2 xl:w-2 ' +
                                                    coreTone[item.state]
                                                }
                                                aria-hidden="true"
                                            />
                                            <span className="min-w-0 flex-1 truncate text-[8px] font-bold text-slate-700 dark:text-slate-200 xl:text-[9.5px]">
                                                {coreLabel(item.name)}
                                            </span>
                                            <span className="shrink-0 text-[6.5px] font-semibold uppercase tracking-[0.04em] text-slate-400 xl:text-[7px]">
                                                {item.state}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-2 xl:mt-2.5">
                                    <div className="text-[7px] font-black uppercase tracking-[0.09em] text-slate-400 xl:text-[8px]">
                                        Supporting foundations
                                    </div>
                                    <div className="mt-1 grid gap-x-2 gap-y-1 sm:grid-cols-2 xl:grid-cols-1 xl:gap-y-1.5">
                                        {supportingFoundations.map((item) => (
                                            <div key={item} className="flex min-w-0 items-start gap-1.5 text-[7px] leading-3 text-slate-500 dark:text-slate-400 xl:text-[8px] xl:leading-3.5">
                                                <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-emerald-500 xl:h-1.5 xl:w-1.5" aria-hidden="true" />
                                                <span className="line-clamp-1">{item}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </aside>
                        </div>
                    </div>
                )}
            </PageFrame>
        </AppLayout>
    );
}
