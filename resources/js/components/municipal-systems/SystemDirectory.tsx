import {
    Boxes,
    Building2,
    ChevronRight,
    GraduationCap,
    Landmark,
    Map,
    PackageSearch,
    WalletCards,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { MunicipalSystem } from '../../data/municipal/systems';

const statusTone: Record<MunicipalSystem['status'], string> = {
    Planned: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200',
    'Not Enabled': 'border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200',
};

const groupIcons: Record<string, LucideIcon> = {
    'Major Pipeline': Boxes,
    'Data & Mapping': Map,
    'Service & Regulatory': Building2,
    'Assets & Logistics': PackageSearch,
    'Financial Integration': WalletCards,
    'People & Knowledge': GraduationCap,
};

type Props = {
    systems: MunicipalSystem[];
    onSelect: (system: MunicipalSystem) => void;
};

export default function SystemDirectory({ systems, onSelect }: Props) {
    const groups = [...new Set(systems.map((system) => system.group))];

    return (
        <div className="space-y-3">
            {groups.map((group) => {
                const groupSystems = systems.filter((system) => system.group === group);
                const groupId = 'future-group-' + group.replaceAll(' ', '-').replaceAll('&', 'and');
                const GroupIcon = groupIcons[group] ?? Landmark;

                return (
                    <section key={group} aria-labelledby={groupId}>
                        <div className="mb-1.5 flex items-center justify-between gap-3 px-0.5">
                            <div className="flex min-w-0 items-center gap-2">
                                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
                                    <GroupIcon size={12} aria-hidden="true" />
                                </span>
                                <div className="min-w-0">
                                    <h3 id={groupId} className="truncate text-[11px] font-extrabold text-slate-950 dark:text-slate-100">{group}</h3>
                                    <p className="text-[8px] text-slate-400">{groupSystems.length} system{groupSystems.length === 1 ? '' : 's'}</p>
                                </div>
                            </div>
                            <span className="hidden text-[8px] font-extrabold uppercase tracking-[0.07em] text-slate-400 sm:block">Open workspace preview</span>
                        </div>

                        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                            {groupSystems.map((system) => (
                                <article key={system.id} className="group flex min-w-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md dark:border-slate-700 dark:bg-[#142236] dark:hover:border-emerald-900/70">
                                    <div className="flex items-start justify-between gap-2 border-b border-slate-100 px-3 py-2.5 dark:border-slate-700">
                                        <div className="min-w-0">
                                            <div className="text-[8px] font-black uppercase tracking-[0.08em] text-emerald-700 dark:text-emerald-300">{system.id}</div>
                                            <h4 className="mt-1 text-[11px] font-extrabold leading-4 text-slate-950 dark:text-slate-100">{system.name}</h4>
                                        </div>
                                        <span className={'shrink-0 rounded-full border px-1.5 py-0.5 text-[7px] font-extrabold uppercase tracking-[0.04em] ' + statusTone[system.status]}>{system.status}</span>
                                    </div>

                                    <div className="flex flex-1 flex-col px-3 py-2.5">
                                        <div className="text-[8px] font-extrabold uppercase tracking-[0.06em] text-slate-400">Lead office</div>
                                        <div className="mt-0.5 text-[9px] font-bold leading-3.5 text-[var(--municipal-brand)]">{system.owningOffice}</div>
                                        <p className="mt-2 line-clamp-3 text-[9px] leading-4 text-slate-500 dark:text-slate-400">{system.purpose}</p>

                                        <div className="mt-2 flex flex-wrap gap-1">
                                            {system.conceptItems.slice(0, 2).map((item) => (
                                                <span key={item} className="rounded-md bg-slate-100 px-1.5 py-1 text-[7px] font-semibold leading-none text-slate-600 dark:bg-slate-800 dark:text-slate-300">{item}</span>
                                            ))}
                                            {system.conceptItems.length > 2 && (
                                                <span className="rounded-md bg-slate-100 px-1.5 py-1 text-[7px] font-bold leading-none text-slate-500 dark:bg-slate-800 dark:text-slate-400">+{system.conceptItems.length - 2}</span>
                                            )}
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => onSelect(system)}
                                            className="mt-3 flex min-h-9 w-full items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 text-[9px] font-extrabold text-emerald-900 transition hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-[var(--municipal-focus)]/30 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200"
                                            aria-label={'Open preview for ' + system.name}
                                        >
                                            Open preview
                                            <ChevronRight size={12} aria-hidden="true" />
                                        </button>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </section>
                );
            })}

            {systems.length === 0 && (
                <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-700 dark:bg-[#142236]">
                    <div className="text-[11px] font-extrabold text-slate-700 dark:text-slate-200">No matching future systems</div>
                    <p className="mt-1 text-[9px] text-slate-500 dark:text-slate-400">Adjust the search, group, or status filter to restore the municipal system matrix.</p>
                </div>
            )}
        </div>
    );
}
