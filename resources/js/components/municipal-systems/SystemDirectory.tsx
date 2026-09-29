import { ChevronRight, Clock3, Database, ShieldOff } from 'lucide-react';
import type { MunicipalSystem } from '../../data/municipal/systems';

const statusTone: Record<MunicipalSystem['status'], string> = {
    Planned: 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200',
    'Not Enabled': 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
};

type Props = {
    systems: MunicipalSystem[];
    onSelect: (system: MunicipalSystem) => void;
};

export default function SystemDirectory({ systems, onSelect }: Props) {
    const groups = [...new Set(systems.map((system) => system.group))];

    return (
        <div className="space-y-2.5">
            {groups.map((group) => {
                const groupSystems = systems.filter((system) => system.group === group);
                const groupId = 'future-group-' + group.replaceAll(' ', '-').replaceAll('&', 'and');

                return (
                    <section key={group} aria-labelledby={groupId}>
                        <div className="mb-1 flex items-center justify-between gap-3 px-0.5">
                            <h2 id={groupId} className="text-[13px] font-bold text-slate-950 dark:text-slate-100">
                                {group}
                            </h2>
                            <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                                Static future integration
                            </span>
                        </div>

                        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-[#142236]">
                            <div className="hidden grid-cols-[minmax(12rem,1fr)_minmax(9rem,.7fr)_minmax(10rem,.7fr)_minmax(12rem,1fr)_minmax(9rem,.55fr)] gap-3 border-b border-slate-100 bg-slate-50 px-3 py-1.5 text-[9px] font-bold uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-400 xl:grid">
                                <span>Future system</span>
                                <span>Lead office</span>
                                <span>Presentation state</span>
                                <span>Intended scope</span>
                                <span>Concept</span>
                            </div>

                            <div className="divide-y divide-slate-100 dark:divide-slate-700">
                                {groupSystems.map((system) => (
                                    <article
                                        key={system.id}
                                        className="grid min-w-0 gap-2 px-3 py-2 transition-colors hover:bg-emerald-50/25 dark:hover:bg-slate-900/30 xl:grid-cols-[minmax(12rem,1fr)_minmax(9rem,.7fr)_minmax(10rem,.7fr)_minmax(12rem,1fr)_minmax(9rem,.55fr)] xl:items-center xl:gap-3"
                                    >
                                        <div className="min-w-0">
                                            <div className="text-[9px] font-bold uppercase tracking-[0.05em] text-slate-400">{system.id}</div>
                                            <h3 className="mt-0.5 text-[13px] font-bold leading-4 text-slate-950 dark:text-slate-100">{system.name}</h3>
                                            <p className="mt-0.5 text-[10px] leading-4 text-slate-500 dark:text-slate-400">{system.purpose}</p>
                                        </div>

                                        <div className="min-w-0 text-[11px] font-semibold leading-4 text-[var(--municipal-brand)]">
                                            <span className="mr-1 font-bold uppercase tracking-wide text-slate-400 xl:hidden">Lead:</span>
                                            {system.owningOffice}
                                        </div>

                                        <div className="flex flex-wrap gap-1">
                                            <span className="inline-flex rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-bold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
                                                {system.presentationState}
                                            </span>
                                            <span className={'inline-flex rounded-full px-2 py-1 text-[9px] font-bold ' + statusTone[system.status]}>
                                                {system.status}
                                            </span>
                                        </div>

                                        <div className="flex min-w-0 gap-1.5 text-[10px] leading-4 text-slate-600 dark:text-slate-300">
                                            {system.status === 'Not Enabled'
                                                ? <ShieldOff size={11} className="mt-0.5 shrink-0 text-slate-400" aria-hidden="true" />
                                                : <Clock3 size={11} className="mt-0.5 shrink-0 text-slate-400" aria-hidden="true" />}
                                            <span className="line-clamp-3">{system.recordScope}</span>
                                        </div>

                                        <div className="flex items-center xl:justify-end">
                                            <button
                                                type="button"
                                                onClick={() => onSelect(system)}
                                                className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-[10px] font-bold text-emerald-900 transition hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-[var(--municipal-focus)]/30 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200 dark:hover:bg-emerald-950/50"
                                                aria-label={'View concept for ' + system.name}
                                            >
                                                View concept
                                                <ChevronRight size={13} aria-hidden="true" />
                                            </button>
                                        </div>

                                        <div className="sr-only">
                                            <Database aria-hidden="true" />
                                            {system.integrationNote}
                                        </div>
                                    </article>
                                ))}
                            </div>
                        </div>
                    </section>
                );
            })}

            {systems.length === 0 && (
                <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                    No Future Integration entries match the current presentation filters.
                </div>
            )}
        </div>
    );
}
