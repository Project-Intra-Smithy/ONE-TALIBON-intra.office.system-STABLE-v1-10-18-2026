import {
    ArrowLeft,
    Building2,
    Database,
    GitBranch,
    Network,
    ShieldAlert,
} from 'lucide-react';
import type { MunicipalSystem } from '../../data/municipal/systems';

const statusTone: Record<MunicipalSystem['status'], string> = {
    Planned: 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200',
    'Not Enabled': 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
};

type Props = {
    system: MunicipalSystem;
    onBack: () => void;
};

export default function FutureIntegrationDetail({ system, onBack }: Props) {
    const scopeTitle = system.conceptMode === 'workflow'
        ? 'Illustrative future workflow'
        : 'Illustrative future scope';

    return (
        <section aria-labelledby="future-concept-title" className="space-y-2.5">
            <button
                type="button"
                onClick={onBack}
                className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-bold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[var(--municipal-focus)]/30 dark:border-slate-700 dark:bg-[#142236] dark:text-slate-200 dark:hover:bg-slate-900/50"
            >
                <ArrowLeft size={14} aria-hidden="true" />
                Back to Future Integrations
            </button>

            <div className="overflow-hidden rounded-xl border border-emerald-100 bg-white dark:border-emerald-900/50 dark:bg-[#142236]">
                <div className="border-b border-emerald-100 bg-emerald-50/65 px-4 py-3 dark:border-emerald-900/50 dark:bg-emerald-950/20">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div className="min-w-0">
                            <div className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-emerald-700 dark:text-emerald-300">
                                Future Integration — Concept Preview
                            </div>
                            <h2 id="future-concept-title" className="mt-1 text-xl font-extrabold tracking-tight text-slate-950 dark:text-slate-100">
                                {system.name}
                            </h2>
                            <p className="mt-1 max-w-3xl text-[11px] leading-5 text-slate-600 dark:text-slate-300">
                                {system.purpose}
                            </p>
                        </div>

                        <div className="flex shrink-0 flex-wrap gap-1.5 md:justify-end">
                            <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold text-emerald-900 dark:bg-emerald-950/45 dark:text-emerald-200">
                                Future Integration
                            </span>
                            <span className={'inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ' + statusTone[system.status]}>
                                {system.status}
                            </span>
                        </div>
                    </div>

                    <div className="mt-3 flex items-center gap-2 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-white text-[var(--municipal-brand)] shadow-sm dark:bg-slate-900">
                            <Building2 size={14} aria-hidden="true" />
                        </span>
                        <span>
                            <span className="text-slate-400">Lead office:</span> {system.owningOffice}
                        </span>
                    </div>
                </div>

                <div className="grid gap-2.5 p-3 lg:grid-cols-[minmax(0,1.25fr)_minmax(18rem,.75fr)]">
                    <div className="space-y-2.5">
                        <section className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                            <div className="flex items-center gap-2">
                                <Network size={14} className="text-[var(--municipal-brand)]" aria-hidden="true" />
                                <h3 className="text-[12px] font-bold text-slate-950 dark:text-slate-100">What this could cover</h3>
                            </div>
                            <p className="mt-2 text-[11px] leading-5 text-slate-600 dark:text-slate-300">{system.recordScope}</p>
                        </section>

                        <section className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                            <div className="flex items-center gap-2">
                                <GitBranch size={14} className="text-[var(--municipal-brand)]" aria-hidden="true" />
                                <h3 className="text-[12px] font-bold text-slate-950 dark:text-slate-100">{scopeTitle}</h3>
                            </div>
                            <div className="mt-2 flex flex-wrap items-stretch gap-1.5">
                                {system.conceptItems.map((item, index) => (
                                    <div key={item} className="flex items-center gap-1.5">
                                        <div className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-[10px] font-semibold leading-4 text-slate-700 dark:border-slate-700 dark:bg-slate-900/45 dark:text-slate-200">
                                            {item}
                                        </div>
                                        {system.conceptMode === 'workflow' && index < system.conceptItems.length - 1 && (
                                            <span className="text-[11px] font-bold text-slate-300 dark:text-slate-600" aria-hidden="true">→</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                            {system.id === 'FUT-13' || system.id === 'FUT-14' ? (
                                <p className="mt-2 text-[10px] leading-4 text-slate-500 dark:text-slate-400">
                                    The supplied authority names this domain as a future plug-in but does not define a detailed operational workflow; this preview intentionally remains conservative.
                                </p>
                            ) : null}
                        </section>

                        <section className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                            <div className="flex items-center gap-2">
                                <Database size={14} className="text-[var(--municipal-brand)]" aria-hidden="true" />
                                <h3 className="text-[12px] font-bold text-slate-950 dark:text-slate-100">Information / records it could manage</h3>
                            </div>
                            <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
                                {system.conceptRecords.map((item) => (
                                    <div key={item} className="rounded-lg bg-slate-50 px-2.5 py-2 text-[10px] leading-4 text-slate-600 dark:bg-slate-900/45 dark:text-slate-300">
                                        {item}
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>

                    <div className="space-y-2.5">
                        <section className="rounded-xl border border-emerald-100 bg-emerald-50/45 p-3 dark:border-emerald-900/50 dark:bg-emerald-950/15">
                            <h3 className="text-[12px] font-bold text-slate-950 dark:text-slate-100">ONE TALIBON integration context</h3>
                            <p className="mt-2 text-[10px] leading-5 text-slate-600 dark:text-slate-300">{system.integrationContext}</p>
                        </section>

                        <section className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 dark:border-amber-900/60 dark:bg-amber-950/20">
                            <div className="flex items-start gap-2">
                                <ShieldAlert size={15} className="mt-0.5 shrink-0 text-amber-700 dark:text-amber-300" aria-hidden="true" />
                                <div>
                                    <h3 className="text-[12px] font-bold text-amber-950 dark:text-amber-200">Current boundary</h3>
                                    <p className="mt-1 text-[10px] leading-5 text-amber-900/80 dark:text-amber-200/80">{system.currentBoundary}</p>
                                </div>
                            </div>
                        </section>

                        <div className="rounded-xl border border-dashed border-slate-300 px-3 py-2.5 text-[10px] leading-4 text-slate-500 dark:border-slate-700 dark:text-slate-400">
                            Presentation navigation is the only interaction on this concept surface. No operational controls are exposed.
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
