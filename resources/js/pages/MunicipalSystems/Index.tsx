import { Link } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { ArrowUpRight, CheckCircle2, Network, Search, ShieldCheck } from 'lucide-react';
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

const panel =
    'rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-[#142236]';

const rolloutTone: Record<string, string> = {
    'Current / Working':
        'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200',
    'Main Showcase / Interactive Static Prototype':
        'bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-200',
    'Current Personnel Reference':
        'bg-blue-50 text-blue-800 dark:bg-blue-950/30 dark:text-blue-200',
};

const coreTone: Record<string, string> = {
    Current: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200',
    'Current Foundation': 'bg-teal-50 text-teal-800 dark:bg-teal-950/30 dark:text-teal-200',
    'Platform Foundation': 'bg-blue-50 text-blue-800 dark:bg-blue-950/30 dark:text-blue-200',
    'Integration Direction': 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
};

function rolloutStateLabel(state: string) {
    return state.startsWith('Main Showcase') ? 'Presentation workspace' : state;
}

function SectionHeader({
    eyebrow,
    title,
    description,
    aside,
}: {
    eyebrow: string;
    title: string;
    description: string;
    aside?: React.ReactNode;
}) {
    return (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
                <div className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-[var(--municipal-brand)]">
                    {eyebrow}
                </div>
                <h2 className="mt-1 text-[18px] font-extrabold tracking-tight text-slate-950 dark:text-slate-100">
                    {title}
                </h2>
                <p className="mt-1 max-w-3xl text-[10px] leading-4 text-slate-500 dark:text-slate-400">
                    {description}
                </p>
            </div>
            {aside}
        </div>
    );
}

export default function Index({ showcase }: Props) {
    const [q, setQ] = useState('');
    const [group, setGroup] = useState('');
    const [status, setStatus] = useState('');
    const [selectedSystem, setSelectedSystem] = useState<MunicipalSystem | null>(null);

    const systems = useMemo(() => {
        const needle = q.trim().toLowerCase();

        return municipalSystems.filter(
            (system) =>
                (!group || system.group === group) &&
                (!status || system.status === status) &&
                (!needle ||
                    [
                        system.name,
                        system.group,
                        system.owningOffice,
                        system.purpose,
                        system.recordScope,
                        system.integrationNote,
                        ...system.conceptItems,
                    ]
                        .join(' ')
                        .toLowerCase()
                        .includes(needle)),
        );
    }, [q, group, status]);

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
                    <div className="space-y-4">
                        <section className="overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-br from-white via-emerald-50/50 to-amber-50/40 shadow-sm dark:border-emerald-900/60 dark:from-[#142236] dark:via-emerald-950/15 dark:to-amber-950/10">
                            <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_480px] lg:items-center">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 text-[9px] font-extrabold uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-300">
                                        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-emerald-700 text-white dark:bg-emerald-600">
                                            <Network size={14} aria-hidden="true" />
                                        </span>
                                        ONE TALIBON Digital Operations Platform
                                    </div>
                                    <h1 className="mt-2 max-w-3xl text-[24px] font-black leading-[1.08] tracking-tight text-slate-950 dark:text-white sm:text-[28px]">
                                        Municipal systems working through one shared digital backbone.
                                    </h1>
                                    <p className="mt-2 max-w-2xl text-[11px] leading-5 text-slate-600 dark:text-slate-300">
                                        Current rollout, future municipal workspaces, and shared platform foundations in one presentation hub.
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                                    <div className={panel + ' p-3'}>
                                        <div className="text-[24px] font-black tabular-nums text-emerald-700 dark:text-emerald-300">
                                            {initialRollout.length}
                                        </div>
                                        <div className="mt-1 text-[8px] font-extrabold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400">
                                            Initial rollout priorities
                                        </div>
                                    </div>
                                    <div className={panel + ' p-3'}>
                                        <div className="text-[24px] font-black tabular-nums text-amber-700 dark:text-amber-300">
                                            {municipalSystems.length}
                                        </div>
                                        <div className="mt-1 text-[8px] font-extrabold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400">
                                            Future systems
                                        </div>
                                    </div>
                                    <div className={panel + ' col-span-2 p-3 sm:col-span-1'}>
                                        <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                                            <ShieldCheck size={18} aria-hidden="true" />
                                            <span className="text-[11px] font-black uppercase tracking-[0.04em]">
                                                Shared backbone
                                            </span>
                                        </div>
                                        <div className="mt-2 text-[8px] font-extrabold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400">
                                            Core platform
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <nav className="grid border-t border-emerald-100 dark:border-emerald-900/40 sm:grid-cols-3">
                                {[
                                    ['Initial Rollout', '#initial-rollout'],
                                    ['Future Integrations', '#future-integrations'],
                                    ['Core Platform', '#core-platform'],
                                ].map(([label, href]) => (
                                    <a
                                        key={label}
                                        href={href}
                                        className="flex min-h-11 items-center justify-between border-b border-emerald-100 px-4 text-[10px] font-extrabold text-slate-800 transition hover:bg-white/70 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0 dark:border-emerald-900/30 dark:text-slate-100 dark:hover:bg-slate-900/30"
                                    >
                                        {label}
                                        <ArrowUpRight size={12} aria-hidden="true" />
                                    </a>
                                ))}
                            </nav>
                        </section>

                        <section id="initial-rollout" className="scroll-mt-4 space-y-2.5">
                            <SectionHeader
                                eyebrow="Initial Rollout"
                                title="Five priorities already shaping the platform"
                                description="Current municipal foundations stay visible while Procurement serves as the primary presentation workspace and HR remains personnel-reference only."
                                aside={
                                    <span className="w-fit rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.05em] text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200">
                                        {initialRollout.length} priorities
                                    </span>
                                }
                            />

                            <div className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-5">
                                {initialRollout.map((item) => {
                                    const description =
                                        item.id === 'ROL-04'
                                            ? 'Procurement request lifecycle, sourcing, delivery and inspection presented as an interactive review workspace.'
                                            : item.description;
                                    const actionLabel =
                                        item.id === 'ROL-04' ? 'Open Procurement' : item.actionLabel;

                                    return (
                                        <article
                                            key={item.id}
                                            className={panel + ' flex min-h-[170px] flex-col p-3 transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md dark:hover:border-emerald-900/70'}
                                        >
                                            <div className="text-[8px] font-black uppercase tracking-[0.08em] text-emerald-700 dark:text-emerald-300">
                                                {item.id}
                                            </div>
                                            <h3 className="mt-1.5 text-[12px] font-extrabold leading-4 text-slate-950 dark:text-slate-100">
                                                {item.name}
                                            </h3>
                                            <p className="mt-1.5 flex-1 text-[9px] leading-4 text-slate-500 dark:text-slate-400">
                                                {description}
                                            </p>
                                            <span
                                                className={
                                                    'mt-2 w-fit rounded-full px-2 py-1 text-[8px] font-bold ' +
                                                    rolloutTone[item.state]
                                                }
                                            >
                                                {rolloutStateLabel(item.state)}
                                            </span>
                                            {item.href && actionLabel && (
                                                <Link
                                                    href={item.href}
                                                    className="mt-2 flex min-h-8 items-center justify-between rounded-lg bg-emerald-700 px-2.5 text-[9px] font-extrabold text-white transition hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500"
                                                >
                                                    {actionLabel}
                                                    <ArrowUpRight size={12} aria-hidden="true" />
                                                </Link>
                                            )}
                                        </article>
                                    );
                                })}
                            </div>
                        </section>

                        <section
                            id="future-integrations"
                            className="scroll-mt-4 space-y-2.5 rounded-2xl border border-slate-200 bg-slate-50/55 p-3 dark:border-slate-700 dark:bg-slate-900/20 sm:p-4"
                        >
                            <SectionHeader
                                eyebrow="Future Integrations"
                                title="Municipal system preview matrix"
                                description="Scan the planned system landscape, narrow by office group or status, then open any preview without leaving the ONE TALIBON presentation shell."
                                aside={
                                    <span className="w-fit rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.05em] text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
                                        {systems.length} of {municipalSystems.length} shown
                                    </span>
                                }
                            />

                            <div className={panel + ' grid gap-2 p-2 lg:grid-cols-[minmax(0,1fr)_220px_180px]'}>
                                <label className="relative min-w-0">
                                    <span className="sr-only">Search Future Integrations</span>
                                    <Search
                                        size={14}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                        aria-hidden="true"
                                    />
                                    <input
                                        value={q}
                                        onChange={(event) => setQ(event.target.value)}
                                        placeholder="Search system, office, or intended scope"
                                        className="min-h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-[11px] text-slate-900 outline-none transition focus:border-[var(--municipal-brand)] focus:ring-2 focus:ring-[var(--municipal-focus)]/20 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                                    />
                                </label>

                                <select
                                    aria-label="Future Integration group"
                                    value={group}
                                    onChange={(event) => setGroup(event.target.value)}
                                    className="min-h-10 min-w-0 rounded-lg border border-slate-300 bg-white px-3 text-[11px] text-slate-900 outline-none focus:border-[var(--municipal-brand)] dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                                >
                                    <option value="">All future groups</option>
                                    {systemGroups.map((item) => (
                                        <option key={item}>{item}</option>
                                    ))}
                                </select>

                                <select
                                    aria-label="Future Integration status"
                                    value={status}
                                    onChange={(event) => setStatus(event.target.value)}
                                    className="min-h-10 min-w-0 rounded-lg border border-slate-300 bg-white px-3 text-[11px] text-slate-900 outline-none focus:border-[var(--municipal-brand)] dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                                >
                                    <option value="">All future statuses</option>
                                    <option>Planned</option>
                                    <option>Not Enabled</option>
                                </select>
                            </div>

                            <SystemDirectory systems={systems} onSelect={setSelectedSystem} />
                        </section>

                        <section id="core-platform" className="scroll-mt-4 space-y-2.5">
                            <SectionHeader
                                eyebrow="Core Platform"
                                title="One shared municipal digital backbone"
                                description="Existing ONE TALIBON capabilities provide reusable access, directory, routing, workflow, approval, audit, file and integration foundations rather than fourteen disconnected applications."
                                aside={
                                    <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.05em] text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200">
                                        <Network size={11} aria-hidden="true" />
                                        Shared architecture
                                    </span>
                                }
                            />

                            <div className="grid gap-2.5 xl:grid-cols-[minmax(0,2fr)_minmax(300px,.8fr)]">
                                <div className={panel + ' p-2.5'}>
                                    <div className="mb-2 flex items-center justify-between gap-2 px-1">
                                        <div className="text-[10px] font-extrabold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">
                                            Shared capabilities
                                        </div>
                                        <span className="text-[9px] font-bold tabular-nums text-slate-400">
                                            {corePlatform.length} references
                                        </span>
                                    </div>

                                    <div className="grid gap-1.5 md:grid-cols-2 xl:grid-cols-3">
                                        {corePlatform.map((item) => (
                                            <article
                                                key={item.name}
                                                className="rounded-lg border border-slate-200 bg-slate-50/65 p-2.5 dark:border-slate-700 dark:bg-slate-900/30"
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white text-emerald-700 shadow-sm dark:bg-slate-800 dark:text-emerald-300">
                                                        <CheckCircle2 size={13} aria-hidden="true" />
                                                    </span>
                                                    <span
                                                        className={
                                                            'rounded-full px-1.5 py-0.5 text-[7px] font-bold ' +
                                                            coreTone[item.state]
                                                        }
                                                    >
                                                        {item.state}
                                                    </span>
                                                </div>
                                                <h3 className="mt-2 text-[10px] font-extrabold leading-4 text-slate-950 dark:text-slate-100">
                                                    {item.name}
                                                </h3>
                                                <p className="mt-1 text-[8px] leading-3.5 text-slate-500 dark:text-slate-400">
                                                    {item.description}
                                                </p>
                                            </article>
                                        ))}
                                    </div>
                                </div>

                                <aside className={panel + ' p-3'}>
                                    <div className="flex items-center gap-2">
                                        <ShieldCheck
                                            size={15}
                                            className="text-emerald-700 dark:text-emerald-300"
                                            aria-hidden="true"
                                        />
                                        <div>
                                            <div className="text-[10px] font-extrabold uppercase tracking-[0.06em] text-slate-700 dark:text-slate-200">
                                                Supporting foundations
                                            </div>
                                            <div className="text-[8px] text-slate-400">
                                                Existing municipal platform context
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-2.5 space-y-1.5">
                                        {supportingFoundations.map((item) => (
                                            <div
                                                key={item}
                                                className="rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-2 text-[9px] leading-4 text-slate-600 dark:border-slate-700 dark:bg-slate-900/35 dark:text-slate-300"
                                            >
                                                {item}
                                            </div>
                                        ))}
                                    </div>
                                </aside>
                            </div>
                        </section>
                    </div>
                )}
            </PageFrame>
        </AppLayout>
    );
}
