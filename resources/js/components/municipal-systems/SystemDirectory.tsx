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
    return (
        <>
            <div className="grid h-full gap-1.5 sm:grid-cols-2 lg:grid-cols-4 lg:content-between lg:gap-2">
                {systems.map((system) => {
                    const Icon = groupIcons[system.group] ?? Landmark;

                    return (
                        <button
                            key={system.id}
                            type="button"
                            onClick={() => onSelect(system)}
                            className="group flex min-h-11 min-w-0 items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-left shadow-sm transition hover:-translate-y-px hover:border-emerald-300 hover:bg-emerald-50/35 focus:outline-none focus:ring-2 focus:ring-[var(--municipal-focus)]/30 dark:border-slate-700 dark:bg-[#142236] dark:hover:border-emerald-900/70 dark:hover:bg-emerald-950/10 lg:min-h-[58px] lg:gap-2.5 lg:px-3 lg:py-2 2xl:min-h-[62px]"
                            aria-label={`Open preview for ${system.name}`}
                            title={`${system.id} · ${system.owningOffice} · ${system.status}`}
                        >
                            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-slate-100 text-emerald-700 dark:bg-slate-800 dark:text-emerald-300 lg:h-8 lg:w-8">
                                <Icon size={14} aria-hidden="true" />
                            </span>

                            <span className="min-w-0 flex-1">
                                <span className="block text-[6.5px] font-black uppercase tracking-[0.06em] text-slate-400 lg:text-[7.5px]">
                                    {system.id}
                                </span>
                                <span className="mt-0.5 block line-clamp-2 text-[8.5px] font-extrabold leading-3 text-slate-800 dark:text-slate-100 lg:text-[10px] lg:leading-[1.15rem]">
                                    {system.name}
                                </span>
                            </span>

                            <ChevronRight
                                size={12}
                                className="shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-emerald-600 dark:text-slate-600 lg:size-[13px]"
                                aria-hidden="true"
                            />
                        </button>
                    );
                })}
            </div>

            {systems.length === 0 && (
                <div className="rounded-lg border border-dashed border-slate-300 bg-white px-3 py-5 text-center dark:border-slate-700 dark:bg-[#142236]">
                    <div className="text-[9px] font-extrabold text-slate-700 dark:text-slate-200">
                        No matching future systems
                    </div>
                    <p className="mt-0.5 text-[8px] text-slate-500 dark:text-slate-400">
                        Adjust the search or filter to restore the municipal system matrix.
                    </p>
                </div>
            )}
        </>
    );
}
