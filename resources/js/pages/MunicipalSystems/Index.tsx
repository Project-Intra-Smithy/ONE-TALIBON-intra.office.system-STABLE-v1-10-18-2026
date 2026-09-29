import { Link } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { Network, Search } from 'lucide-react';
import AppLayout from '../../layouts/AppLayout';
import PageFrame from '../../components/PageFrame';
import PageHeader from '../../components/PageHeader';
import FutureIntegrationDetail from '../../components/municipal-systems/FutureIntegrationDetail';
import FutureSystemPrototype from '../../components/municipal-systems/FutureSystemPrototype';
import SystemDirectory from '../../components/municipal-systems/SystemDirectory';
import { procurementPrototype } from '../../data/municipal/futureSystemPrototypeData';
import {
    corePlatform,
    initialRollout,
    municipalSystems,
    supportingFoundations,
    systemGroups,
    type MunicipalSystem,
} from '../../data/municipal/systems';

type View = 'rollout' | 'future' | 'core';

type Props = {
    showcase?: 'procurement';
};

const views: Array<{ id: View; label: string; description: string }> = [
    { id: 'rollout', label: 'Initial Rollout', description: 'Exactly five showcase priorities with their real current state.' },
    { id: 'future', label: 'Future Integrations', description: 'Exactly 14 interactive static system previews — FUT-02 through FUT-15.' },
    { id: 'core', label: 'Core Platform', description: 'ONE TALIBON backbone and current supporting foundations.' },
];

const rolloutTone = {
    'Current / Working': 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200',
    'Main Showcase / Interactive Static Prototype': 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200',
    'Current Personnel Reference': 'bg-blue-50 text-blue-800 dark:bg-blue-950/40 dark:text-blue-200',
} as const;

const coreTone = {
    Current: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200',
    'Current Foundation': 'bg-teal-50 text-teal-800 dark:bg-teal-950/40 dark:text-teal-200',
    'Platform Foundation': 'bg-blue-50 text-blue-800 dark:bg-blue-950/40 dark:text-blue-200',
    'Integration Direction': 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
} as const;

export default function Index({ showcase }: Props) {
    const [view, setView] = useState<View>('rollout');
    const [q, setQ] = useState('');
    const [group, setGroup] = useState('');
    const [status, setStatus] = useState('');
    const [selectedSystem, setSelectedSystem] = useState<MunicipalSystem | null>(null);

    const systems = useMemo(() => {
        const needle = q.trim().toLowerCase();
        return municipalSystems.filter((system) =>
            (!group || system.group === group)
            && (!status || system.status === status)
            && (!needle || [system.name, system.group, system.owningOffice, system.purpose, system.recordScope, system.integrationNote, ...system.conceptItems].join(' ').toLowerCase().includes(needle))
        );
    }, [q, group, status]);

    if (showcase === 'procurement') {
        return (
            <AppLayout title="Procurement / PR Tracking">
                <PageFrame density="compact">
                    <FutureSystemPrototype prototype={procurementPrototype} />
                </PageFrame>
            </AppLayout>
        );
    }

    const selectView = (nextView: View) => {
        setSelectedSystem(null);
        setView(nextView);
    };

    const openConcept = (system: MunicipalSystem) => {
        setView('future');
        setSelectedSystem(system);
    };

    return (
        <AppLayout title="Future Integrations">
            <PageFrame density="compact">
                <PageHeader
                    eyebrow="ONE TALIBON digital operations platform"
                    title="Future Integrations"
                    description="Five rollout priorities, the shared platform backbone, and exactly 14 future systems presented as believable interactive static workspaces without claiming live municipal operation."
                    icon={Network}
                />

                {!selectedSystem && (
                    <div role="tablist" aria-label="Municipal systems presentation views" className="grid gap-1 rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-[#142236] md:grid-cols-3">
                        {views.map((item) => {
                            const selected = view === item.id;
                            return (
                                <button key={item.id} type="button" role="tab" aria-selected={selected} onClick={() => selectView(item.id)} className={'min-h-12 rounded-lg px-3 py-2 text-left transition focus:outline-none focus:ring-2 focus:ring-[var(--municipal-focus)]/30 ' + (selected ? 'bg-emerald-50 text-emerald-950 dark:bg-emerald-950/35 dark:text-emerald-100' : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900/40')}>
                                    <div className="text-[12px] font-bold">{item.label}</div>
                                    <div className="mt-0.5 text-[10px] leading-4 opacity-75">{item.description}</div>
                                </button>
                            );
                        })}
                    </div>
                )}

                {selectedSystem ? (
                    <FutureIntegrationDetail system={selectedSystem} onBack={() => setSelectedSystem(null)} />
                ) : (
                    <>
                        {view === 'rollout' && (
                            <section aria-labelledby="initial-rollout-title" className="space-y-2">
                                <div className="flex flex-col gap-1 rounded-xl border border-emerald-100 bg-emerald-50/50 px-3 py-2 dark:border-emerald-900/50 dark:bg-emerald-950/20">
                                    <h2 id="initial-rollout-title" className="text-[13px] font-bold text-slate-950 dark:text-slate-100">Initial Rollout</h2>
                                    <p className="text-[11px] leading-4 text-slate-600 dark:text-slate-300">Five client-aligned priorities. Procurement is the main interactive static showcase; HR remains the current personnel-reference foundation.</p>
                                </div>
                                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-[#142236]">
                                    <div className="divide-y divide-slate-100 dark:divide-slate-700">
                                        {initialRollout.map((item, index) => (
                                            <article key={item.id} className="grid gap-2 px-3 py-2.5 md:grid-cols-[36px_minmax(0,1fr)_minmax(190px,260px)] md:items-center">
                                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-[11px] font-extrabold text-slate-600 dark:bg-slate-800 dark:text-slate-200">{index + 1}</div>
                                                <div className="min-w-0">
                                                    <h3 className="text-[13px] font-bold text-slate-950 dark:text-slate-100">{item.name}</h3>
                                                    <p className="mt-0.5 text-[10px] leading-4 text-slate-500 dark:text-slate-400">{item.description}</p>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-1.5 md:justify-end">
                                                    <span className={'inline-flex rounded-full px-2 py-1 text-[9px] font-bold ' + rolloutTone[item.state]}>{item.state}</span>
                                                    {item.href && item.actionLabel && (
                                                        <Link href={item.href} className="inline-flex min-h-8 items-center rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 text-[9px] font-bold text-emerald-900 transition hover:bg-emerald-100 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200">
                                                            {item.actionLabel}
                                                        </Link>
                                                    )}
                                                </div>
                                            </article>
                                        ))}
                                    </div>
                                </div>
                            </section>
                        )}

                        {view === 'future' && (
                            <section aria-labelledby="future-integrations-title" className="space-y-2">
                                <div className="rounded-xl border border-amber-100 bg-amber-50/60 px-3 py-2 dark:border-amber-900/50 dark:bg-amber-950/20">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div>
                                            <h2 id="future-integrations-title" className="text-[13px] font-bold text-slate-950 dark:text-slate-100">Future Integrations</h2>
                                            <p className="mt-0.5 text-[11px] leading-4 text-slate-600 dark:text-slate-300">Exactly 14 systems — FUT-02 through FUT-15. Each opens a whole-system interactive concept preview powered by one shared prototype architecture.</p>
                                        </div>
                                        <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-extrabold text-amber-900 dark:bg-slate-900 dark:text-amber-200">14 systems</span>
                                    </div>
                                </div>

                                <div className="grid gap-1.5 rounded-xl border border-slate-200 bg-white p-2 dark:border-slate-700 dark:bg-[#142236] md:grid-cols-[minmax(0,1fr)_230px_190px]">
                                    <label className="relative min-w-0">
                                        <span className="sr-only">Search Future Integrations</span>
                                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                                        <input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Filter future system, office, or intended scope" className="min-h-9 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm outline-none focus:border-[var(--municipal-brand)] focus:ring-2 focus:ring-[var(--municipal-focus)]/20 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100" />
                                    </label>
                                    <select aria-label="Future Integration group" value={group} onChange={(event) => setGroup(event.target.value)} className="min-h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-[var(--municipal-brand)] focus:ring-2 focus:ring-[var(--municipal-focus)]/20 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100">
                                        <option value="">All future groups</option>{systemGroups.map((item) => <option key={item}>{item}</option>)}
                                    </select>
                                    <select aria-label="Future Integration status" value={status} onChange={(event) => setStatus(event.target.value)} className="min-h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-[var(--municipal-brand)] focus:ring-2 focus:ring-[var(--municipal-focus)]/20 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100">
                                        <option value="">All future statuses</option><option>Planned</option><option>Not Enabled</option>
                                    </select>
                                </div>
                                <SystemDirectory systems={systems} onSelect={openConcept} />
                            </section>
                        )}

                        {view === 'core' && (
                            <section aria-labelledby="core-platform-title" className="space-y-2">
                                <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 px-3 py-2 dark:border-emerald-900/50 dark:bg-emerald-950/20">
                                    <h2 id="core-platform-title" className="text-[13px] font-bold text-slate-950 dark:text-slate-100">Core Platform Backbone</h2>
                                    <p className="mt-0.5 text-[11px] leading-4 text-slate-600 dark:text-slate-300">ONE TALIBON provides the common authenticated, routing, workflow, file, audit, and integration foundation. Encode once, use many times.</p>
                                </div>
                                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-[#142236]">
                                    <div className="divide-y divide-slate-100 dark:divide-slate-700">
                                        {corePlatform.map((item) => (
                                            <article key={item.name} className="grid gap-2 px-3 py-2 md:grid-cols-[minmax(0,1fr)_180px] md:items-center">
                                                <div className="min-w-0"><h3 className="text-[12px] font-bold text-slate-950 dark:text-slate-100">{item.name}</h3><p className="mt-0.5 text-[10px] leading-4 text-slate-500 dark:text-slate-400">{item.description}</p></div>
                                                <div className="md:text-right"><span className={'inline-flex rounded-full px-2 py-1 text-[9px] font-bold ' + coreTone[item.state]}>{item.state}</span></div>
                                            </article>
                                        ))}
                                    </div>
                                </div>
                                <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-[#142236]">
                                    <h2 className="text-[12px] font-bold text-slate-950 dark:text-slate-100">Current supporting foundations</h2>
                                    <div className="mt-2 grid gap-1.5 md:grid-cols-2">
                                        {supportingFoundations.map((item) => <div key={item} className="rounded-lg bg-slate-50 px-2.5 py-2 text-[10px] leading-4 text-slate-600 dark:bg-slate-900/40 dark:text-slate-300">{item}</div>)}
                                    </div>
                                </div>
                            </section>
                        )}
                    </>
                )}
            </PageFrame>
        </AppLayout>
    );
}
