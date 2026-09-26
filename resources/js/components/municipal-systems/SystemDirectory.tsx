import { Database, Link2, ShieldOff } from 'lucide-react';
import type { MunicipalSystem } from '../../data/municipal/systems';

const tone: Record<MunicipalSystem['status'], string> = {
    Active: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200',
    Integrated: 'bg-blue-50 text-blue-800 dark:bg-blue-950/40 dark:text-blue-200',
    'Not Enabled': 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
    Planned: 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200',
};

export default function SystemDirectory({ systems }: { systems: MunicipalSystem[] }) {
    const groups = [...new Set(systems.map((system) => system.group))];

    return <div className="space-y-4">
        {groups.map((group) => {
            const groupSystems = systems.filter((system) => system.group === group);
            return <section key={group} aria-labelledby={`system-group-${group.replaceAll(' ', '-')}`}>
                <div className="mb-1.5 flex items-center justify-between gap-3 px-0.5">
                    <h2 id={`system-group-${group.replaceAll(' ', '-')}`} className="text-sm font-bold text-slate-950 dark:text-slate-100">{group}</h2>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">{groupSystems.length} systems</span>
                </div>
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-[#142236]">
                    <div className="hidden grid-cols-[minmax(11rem,.9fr)_minmax(9rem,.65fr)_auto_minmax(11rem,1fr)_minmax(13rem,1.15fr)] gap-3 border-b border-slate-100 bg-slate-50 px-3 py-1.5 text-[9px] font-bold uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-400 xl:grid">
                        <span>System</span><span>Owning office</span><span>Status</span><span>Record scope</span><span>Integration context</span>
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-slate-700">
                        {groupSystems.map((system) => <article key={system.id} className="grid min-w-0 gap-2 px-3 py-2.5 xl:grid-cols-[minmax(11rem,.9fr)_minmax(9rem,.65fr)_auto_minmax(11rem,1fr)_minmax(13rem,1.15fr)] xl:items-center xl:gap-3">
                            <div className="min-w-0"><div className="text-[9px] font-bold uppercase tracking-wide text-slate-400">{system.id}</div><h3 className="mt-0.5 text-sm font-bold leading-5 text-slate-950 dark:text-slate-100">{system.name}</h3><p className="mt-0.5 text-[11px] leading-4 text-slate-500 dark:text-slate-400">{system.purpose}</p></div>
                            <div className="min-w-0 text-xs font-semibold text-blue-800 dark:text-blue-300"><span className="mr-1 font-bold uppercase tracking-wide text-slate-400 xl:hidden">Office:</span>{system.owningOffice}</div>
                            <div><span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-bold ${tone[system.status]}`}>{system.status}</span></div>
                            <div className="flex min-w-0 gap-2 text-xs text-slate-600 dark:text-slate-300"><Database size={13} className="mt-0.5 shrink-0 text-slate-400" aria-hidden="true" /><span>{system.recordScope}</span></div>
                            <div className="flex min-w-0 gap-2 text-xs text-slate-600 dark:text-slate-300">{system.status === 'Not Enabled' ? <ShieldOff size={13} className="mt-0.5 shrink-0 text-slate-400" aria-hidden="true" /> : <Link2 size={13} className="mt-0.5 shrink-0 text-slate-400" aria-hidden="true" />}<span>{system.integrationNote}</span></div>
                        </article>)}
                    </div>
                </div>
            </section>;
        })}
        {systems.length === 0 && <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">No systems match the current filters.</div>}
    </div>;
}
