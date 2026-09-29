import { useEffect, useState } from 'react';
import {
    ArrowLeft,
    Building2,
    ChevronRight,
    CircleDot,
    FileText,
    ShieldCheck,
    Workflow,
} from 'lucide-react';
import type { FutureSystemPrototypeConfig } from '../../data/municipal/futureSystemPrototypeData';
import {
    buildingPermitCases,
    clearanceLabels,
    permitLifecycle,
    type BuildingPermitCase,
    type ClearanceKey,
    type PermitReferenceState,
    type PermitStage,
} from '../../data/municipal/buildingPermitData';
import DetailDrawer from './DetailDrawer';

type Props = {
    prototype: FutureSystemPrototypeConfig;
    onBack?: () => void;
};

type WorkspaceTab = 'Overview' | 'Applications' | 'Clearance Matrix' | 'Permit Flow';
type DetailStep = 'Case Summary' | 'Clearances' | 'Timeline';

const tabs: WorkspaceTab[] = ['Overview', 'Applications', 'Clearance Matrix', 'Permit Flow'];

const referenceTone: Record<PermitReferenceState, string> = {
    'Complete reference': 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/25 dark:text-emerald-200',
    'Under review': 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/25 dark:text-amber-200',
    'Pending reference': 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900/60 dark:bg-blue-950/25 dark:text-blue-200',
    'Not yet reached': 'border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300',
};

const stageTone: Record<PermitStage, string> = {
    Application: 'border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200',
    Engineering: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/25 dark:text-amber-200',
    Zoning: 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900/60 dark:bg-blue-950/25 dark:text-blue-200',
    Fire: 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/25 dark:text-rose-200',
    'Other clearances': 'border-violet-200 bg-violet-50 text-violet-800 dark:border-violet-900/60 dark:bg-violet-950/25 dark:text-violet-200',
    'Permit processing': 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/25 dark:text-emerald-200',
};

const clearanceLanes: Array<{ key: ClearanceKey; context: string }> = [
    { key: 'engineering', context: 'Plan-set and structural review reference' },
    { key: 'zoning', context: 'Land-use and zoning coordination reference' },
    { key: 'fire', context: 'Fire-clearance coordination reference' },
    { key: 'other', context: 'Remaining cross-office reference set' },
];

const stageContext: Record<PermitStage, string> = {
    Application: 'Case materials enter the illustrative reference sequence.',
    Engineering: 'Engineering plan-set reference and technical review context.',
    Zoning: 'Zoning dependency reference and land-use coordination context.',
    Fire: 'Fire-clearance dependency reference for cross-office coordination.',
    'Other clearances': 'Remaining reference dependencies are coordinated.',
    'Permit processing': 'Consolidated references are represented at permit-processing stage.',
};

function ReferenceBadge({ state }: { state: PermitReferenceState }) {
    return <span className={'inline-flex rounded-full border px-2 py-1 text-[9px] font-bold ' + referenceTone[state]}>{state}</span>;
}

function StageBadge({ stage }: { stage: PermitStage }) {
    return <span className={'inline-flex rounded-full border px-2 py-1 text-[9px] font-bold ' + stageTone[stage]}>{stage}</span>;
}

function flowReferenceState(permitCase: BuildingPermitCase, stage: PermitStage): PermitReferenceState {
    if (stage === 'Application') return 'Complete reference';
    if (stage === 'Engineering') return permitCase.referenceStates.engineering;
    if (stage === 'Zoning') return permitCase.referenceStates.zoning;
    if (stage === 'Fire') return permitCase.referenceStates.fire;
    if (stage === 'Other clearances') return permitCase.referenceStates.other;
    return permitCase.referenceStates.permitProcessing;
}

function SelectedClearanceMatrix({ permitCase }: { permitCase: BuildingPermitCase }) {
    return (
        <section className="rounded-xl border border-[var(--municipal-border)] bg-[var(--municipal-surface)] p-3" aria-label="Selected case clearance matrix">
            <div className="flex items-center justify-between gap-3 border-b border-[var(--municipal-border)] pb-2.5">
                <div>
                    <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.08em] text-[var(--municipal-muted)]"><ShieldCheck size={14} className="text-[var(--municipal-brand)]" aria-hidden="true" /> Clearance Matrix</div>
                    <div className="mt-0.5 text-[9px] font-semibold text-[var(--municipal-muted)]">{permitCase.reference} · dependency references</div>
                </div>
            </div>
            <div className="mt-2 divide-y divide-[var(--municipal-border)]">
                {clearanceLanes.map(({ key, context }) => (
                    <div key={key} className="grid gap-1.5 py-2.5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                        <div className="min-w-0">
                            <div className="text-[10px] font-bold text-[var(--municipal-text)]">{clearanceLabels[key]}</div>
                            <div className="mt-0.5 text-[9px] leading-4 text-[var(--municipal-muted)]">{context}</div>
                        </div>
                        <ReferenceBadge state={permitCase.referenceStates[key]} />
                    </div>
                ))}
            </div>
            <div className="mt-2 border-t border-[var(--municipal-border)] pt-2 text-[9px] leading-4 text-[var(--municipal-muted)]">Reference state shows presentation dependency only. It does not represent an approval or regulatory decision.</div>
        </section>
    );
}

function CaseList({ selected, onSelect }: { selected: BuildingPermitCase; onSelect: (permitCase: BuildingPermitCase) => void }) {
    return (
        <aside className="overflow-hidden rounded-xl border border-[var(--municipal-border)] bg-[var(--municipal-surface)]" aria-label="Permit case list">
            <div className="border-b border-[var(--municipal-border)] px-3 py-2.5">
                <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.08em] text-[var(--municipal-muted)]"><FileText size={14} className="text-[var(--municipal-brand)]" aria-hidden="true" /> Case List</div>
                <div className="mt-0.5 text-[9px] text-[var(--municipal-muted)]">Illustrative regulatory references</div>
            </div>
            <div className="divide-y divide-[var(--municipal-border)]">
                {buildingPermitCases.map((permitCase) => {
                    const active = selected.reference === permitCase.reference;
                    return (
                        <button
                            key={permitCase.reference}
                            type="button"
                            onClick={() => onSelect(permitCase)}
                            className={'w-full border-l-2 px-3 py-3 text-left transition '
                                + (active
                                    ? 'border-l-[var(--municipal-brand)] bg-emerald-50/50 dark:bg-emerald-950/15'
                                    : 'border-l-transparent hover:bg-[var(--municipal-hover)]')}
                        >
                            <div className="flex items-start justify-between gap-2">
                                <span className="text-[9px] font-extrabold uppercase tracking-[0.06em] text-[var(--municipal-brand)]">{permitCase.reference}</span>
                                <ChevronRight size={12} className="mt-0.5 shrink-0 text-[var(--municipal-muted)]" aria-hidden="true" />
                            </div>
                            <div className="mt-1 text-[11px] font-bold leading-4 text-[var(--municipal-text)]">{permitCase.projectType}</div>
                            <div className="mt-2"><StageBadge stage={permitCase.currentStage} /></div>
                        </button>
                    );
                })}
            </div>
        </aside>
    );
}

function CaseDossier({ permitCase, onOpenDetail }: { permitCase: BuildingPermitCase; onOpenDetail: () => void }) {
    return (
        <section className="rounded-xl border border-[var(--municipal-border)] bg-[var(--municipal-surface)] p-3" aria-label="Selected permit case dossier">
            <div className="flex flex-col gap-2 border-b border-[var(--municipal-border)] pb-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                    <div className="text-[9px] font-extrabold uppercase tracking-[0.08em] text-[var(--municipal-muted)]">Selected Permit Case</div>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                        <span className="text-[12px] font-extrabold text-[var(--municipal-brand)]">{permitCase.reference}</span>
                        <StageBadge stage={permitCase.currentStage} />
                    </div>
                    <h2 className="mt-1 text-[17px] font-extrabold tracking-tight text-[var(--municipal-text)]">{permitCase.projectType}</h2>
                </div>
                <button type="button" onClick={onOpenDetail} className="inline-flex min-h-8 shrink-0 items-center justify-center rounded-lg border border-[var(--municipal-border)] bg-[var(--municipal-surface-subtle)] px-2.5 text-[9px] font-bold text-[var(--municipal-text)] transition hover:bg-[var(--municipal-hover)]">Open case detail</button>
            </div>

            <dl className="mt-3 grid gap-2 sm:grid-cols-2">
                <div className="rounded-lg bg-[var(--municipal-surface-subtle)] px-3 py-2.5">
                    <dt className="text-[8px] font-extrabold uppercase tracking-[0.07em] text-[var(--municipal-muted)]">Current stage</dt>
                    <dd className="mt-1 text-[11px] font-bold text-[var(--municipal-text)]">{permitCase.currentStage}</dd>
                </div>
                <div className="rounded-lg bg-[var(--municipal-surface-subtle)] px-3 py-2.5">
                    <dt className="text-[8px] font-extrabold uppercase tracking-[0.07em] text-[var(--municipal-muted)]">Permit state</dt>
                    <dd className="mt-1 text-[11px] font-bold text-[var(--municipal-text)]">{permitCase.permitState}</dd>
                </div>
                <div className="sm:col-span-2 rounded-lg bg-[var(--municipal-surface-subtle)] px-3 py-2.5">
                    <dt className="text-[8px] font-extrabold uppercase tracking-[0.07em] text-[var(--municipal-muted)]">Office context</dt>
                    <dd className="mt-1 text-[10px] font-semibold leading-4 text-[var(--municipal-text)]">{permitCase.officeContext}</dd>
                </div>
            </dl>

            <div className="mt-3 rounded-lg border border-[var(--municipal-border)] px-3 py-2.5">
                <div className="text-[8px] font-extrabold uppercase tracking-[0.07em] text-[var(--municipal-muted)]">Case note</div>
                <p className="mt-1 text-[10px] leading-4 text-[var(--municipal-text)]">{permitCase.caseNote}</p>
            </div>

            <div className="mt-3">
                <div className="text-[8px] font-extrabold uppercase tracking-[0.07em] text-[var(--municipal-muted)]">Required references</div>
                <div className="mt-1.5 grid gap-1.5 sm:grid-cols-2">
                    {permitCase.requiredReferences.map((reference) => (
                        <div key={reference} className="flex items-start gap-2 rounded-lg border border-[var(--municipal-border)] bg-[var(--municipal-surface-subtle)] px-2.5 py-2 text-[9px] leading-4 text-[var(--municipal-text)]">
                            <CircleDot size={10} className="mt-0.5 shrink-0 text-[var(--municipal-brand)]" aria-hidden="true" />
                            <span>{reference}</span>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

function Overview({ selected, onSelect, onOpenDetail }: { selected: BuildingPermitCase; onSelect: (permitCase: BuildingPermitCase) => void; onOpenDetail: () => void }) {
    return (
        <div className="grid gap-2.5 xl:grid-cols-[240px_minmax(0,1.2fr)_minmax(280px,0.8fr)]">
            <CaseList selected={selected} onSelect={onSelect} />
            <CaseDossier permitCase={selected} onOpenDetail={onOpenDetail} />
            <SelectedClearanceMatrix permitCase={selected} />
        </div>
    );
}

function Applications({ onOpenDetail }: { onOpenDetail: (permitCase: BuildingPermitCase) => void }) {
    return (
        <section className="overflow-hidden rounded-xl border border-[var(--municipal-border)] bg-[var(--municipal-surface)]" aria-label="Building permit application register">
            <div className="border-b border-[var(--municipal-border)] px-3 py-2.5">
                <div className="text-[10px] font-extrabold uppercase tracking-[0.08em] text-[var(--municipal-muted)]">Permit Case Register</div>
                <p className="mt-0.5 text-[9px] text-[var(--municipal-muted)]">Reference-only application and cross-office dependency states.</p>
            </div>

            <div className="hidden overflow-x-auto lg:block">
                <table className="w-full min-w-[1120px] text-left">
                    <thead className="bg-[var(--municipal-surface-subtle)] text-[8px] font-extrabold uppercase tracking-[0.06em] text-[var(--municipal-muted)]">
                        <tr>
                            <th className="px-3 py-2.5">Case</th>
                            <th className="px-3 py-2.5">Project / Application</th>
                            <th className="px-3 py-2.5">Current Stage</th>
                            <th className="px-3 py-2.5">Engineering</th>
                            <th className="px-3 py-2.5">Zoning</th>
                            <th className="px-3 py-2.5">Fire</th>
                            <th className="px-3 py-2.5">Other</th>
                            <th className="px-3 py-2.5">Permit State</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--municipal-border)]">
                        {buildingPermitCases.map((permitCase) => (
                            <tr key={permitCase.reference} className="hover:bg-[var(--municipal-hover)]">
                                <td className="px-3 py-3 align-top"><button type="button" onClick={() => onOpenDetail(permitCase)} className="text-[10px] font-extrabold text-[var(--municipal-brand)] hover:underline">{permitCase.reference}</button></td>
                                <td className="px-3 py-3 align-top text-[10px] font-bold text-[var(--municipal-text)]">{permitCase.projectType}</td>
                                <td className="px-3 py-3 align-top"><StageBadge stage={permitCase.currentStage} /></td>
                                <td className="px-3 py-3 align-top"><ReferenceBadge state={permitCase.referenceStates.engineering} /></td>
                                <td className="px-3 py-3 align-top"><ReferenceBadge state={permitCase.referenceStates.zoning} /></td>
                                <td className="px-3 py-3 align-top"><ReferenceBadge state={permitCase.referenceStates.fire} /></td>
                                <td className="px-3 py-3 align-top"><ReferenceBadge state={permitCase.referenceStates.other} /></td>
                                <td className="px-3 py-3 align-top text-[9px] font-semibold leading-4 text-[var(--municipal-text)]">{permitCase.permitState}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="divide-y divide-[var(--municipal-border)] lg:hidden">
                {buildingPermitCases.map((permitCase) => (
                    <button key={permitCase.reference} type="button" onClick={() => onOpenDetail(permitCase)} className="w-full p-3 text-left hover:bg-[var(--municipal-hover)]">
                        <div className="flex items-start justify-between gap-2"><div><div className="text-[9px] font-extrabold text-[var(--municipal-brand)]">{permitCase.reference}</div><div className="mt-1 text-[11px] font-bold text-[var(--municipal-text)]">{permitCase.projectType}</div></div><ChevronRight size={13} className="mt-1 shrink-0 text-[var(--municipal-muted)]" aria-hidden="true" /></div>
                        <div className="mt-2"><StageBadge stage={permitCase.currentStage} /></div>
                        <div className="mt-2 grid grid-cols-2 gap-1.5 text-[9px]">
                            {clearanceLanes.map(({ key }) => <div key={key} className="rounded-lg bg-[var(--municipal-surface-subtle)] px-2 py-1.5"><div className="font-bold text-[var(--municipal-muted)]">{clearanceLabels[key]}</div><div className="mt-1"><ReferenceBadge state={permitCase.referenceStates[key]} /></div></div>)}
                        </div>
                    </button>
                ))}
            </div>
        </section>
    );
}

function ClearanceMatrix({ onOpenDetail }: { onOpenDetail: (permitCase: BuildingPermitCase) => void }) {
    return (
        <section className="overflow-hidden rounded-xl border border-[var(--municipal-border)] bg-[var(--municipal-surface)]" aria-label="Cross-office clearance matrix">
            <div className="flex flex-col gap-1 border-b border-[var(--municipal-border)] px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
                <div><div className="text-[10px] font-extrabold uppercase tracking-[0.08em] text-[var(--municipal-muted)]">Cross-office Clearance Matrix</div><p className="mt-0.5 text-[9px] text-[var(--municipal-muted)]">Dependency references by case. Complete reference never means approved.</p></div>
                <span className="text-[9px] font-semibold text-[var(--municipal-muted)]">Engineering · Zoning · Fire · Other · Permit processing</span>
            </div>

            <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[960px] text-left">
                    <thead className="bg-[var(--municipal-surface-subtle)] text-[8px] font-extrabold uppercase tracking-[0.06em] text-[var(--municipal-muted)]">
                        <tr><th className="px-3 py-2.5">Permit case</th><th className="px-3 py-2.5">Engineering</th><th className="px-3 py-2.5">Zoning</th><th className="px-3 py-2.5">Fire</th><th className="px-3 py-2.5">Other clearances</th><th className="px-3 py-2.5">Permit processing</th></tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--municipal-border)]">
                        {buildingPermitCases.map((permitCase) => (
                            <tr key={permitCase.reference} className="hover:bg-[var(--municipal-hover)]">
                                <td className="px-3 py-3"><button type="button" onClick={() => onOpenDetail(permitCase)} className="text-left"><span className="block text-[10px] font-extrabold text-[var(--municipal-brand)]">{permitCase.reference}</span><span className="mt-0.5 block text-[9px] font-semibold text-[var(--municipal-text)]">{permitCase.projectType}</span></button></td>
                                <td className="px-3 py-3"><ReferenceBadge state={permitCase.referenceStates.engineering} /></td>
                                <td className="px-3 py-3"><ReferenceBadge state={permitCase.referenceStates.zoning} /></td>
                                <td className="px-3 py-3"><ReferenceBadge state={permitCase.referenceStates.fire} /></td>
                                <td className="px-3 py-3"><ReferenceBadge state={permitCase.referenceStates.other} /></td>
                                <td className="px-3 py-3"><ReferenceBadge state={permitCase.referenceStates.permitProcessing} /></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="divide-y divide-[var(--municipal-border)] md:hidden">
                {buildingPermitCases.map((permitCase) => (
                    <div key={permitCase.reference} className="p-3">
                        <button type="button" onClick={() => onOpenDetail(permitCase)} className="text-left"><span className="block text-[10px] font-extrabold text-[var(--municipal-brand)]">{permitCase.reference}</span><span className="mt-0.5 block text-[10px] font-bold text-[var(--municipal-text)]">{permitCase.projectType}</span></button>
                        <div className="mt-2 grid gap-1.5">
                            {clearanceLanes.map(({ key }) => <div key={key} className="flex items-center justify-between gap-2 rounded-lg bg-[var(--municipal-surface-subtle)] px-2.5 py-2"><span className="text-[9px] font-bold text-[var(--municipal-text)]">{clearanceLabels[key]}</span><ReferenceBadge state={permitCase.referenceStates[key]} /></div>)}
                            <div className="flex items-center justify-between gap-2 rounded-lg bg-[var(--municipal-surface-subtle)] px-2.5 py-2"><span className="text-[9px] font-bold text-[var(--municipal-text)]">Permit processing</span><ReferenceBadge state={permitCase.referenceStates.permitProcessing} /></div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}

function PermitFlow({ selected, onSelect }: { selected: BuildingPermitCase; onSelect: (permitCase: BuildingPermitCase) => void }) {
    return (
        <div className="grid gap-2.5 lg:grid-cols-[240px_minmax(0,1fr)]">
            <aside className="rounded-xl border border-[var(--municipal-border)] bg-[var(--municipal-surface)] p-2.5" aria-label="Permit flow case selection">
                <div className="flex items-center gap-2 px-1 text-[10px] font-extrabold uppercase tracking-[0.08em] text-[var(--municipal-muted)]"><Workflow size={14} className="text-[var(--municipal-brand)]" aria-hidden="true" /> Permit Flow Cases</div>
                <div className="mt-2 space-y-1">
                    {buildingPermitCases.map((permitCase) => (
                        <button key={permitCase.reference} type="button" onClick={() => onSelect(permitCase)} className={'w-full rounded-lg px-2.5 py-2 text-left transition ' + (selected.reference === permitCase.reference ? 'bg-emerald-50 text-emerald-950 dark:bg-emerald-950/25 dark:text-emerald-100' : 'hover:bg-[var(--municipal-hover)]')}>
                            <span className="block text-[9px] font-extrabold text-[var(--municipal-brand)]">{permitCase.reference}</span><span className="mt-0.5 block text-[9px] font-semibold">{permitCase.projectType}</span>
                        </button>
                    ))}
                </div>
            </aside>

            <section className="rounded-xl border border-[var(--municipal-border)] bg-[var(--municipal-surface)] p-3" aria-label="Permit case regulatory progression">
                <div className="flex flex-col gap-2 border-b border-[var(--municipal-border)] pb-3 sm:flex-row sm:items-center sm:justify-between">
                    <div><div className="text-[9px] font-extrabold uppercase tracking-[0.08em] text-[var(--municipal-muted)]">Regulatory Dependency Sequence</div><div className="mt-1 text-[13px] font-extrabold text-[var(--municipal-text)]">{selected.reference} · {selected.projectType}</div></div>
                    <StageBadge stage={selected.currentStage} />
                </div>
                <ol className="mt-2 divide-y divide-[var(--municipal-border)]">
                    {permitLifecycle.map((stage, index) => {
                        const current = selected.currentStage === stage;
                        const state = flowReferenceState(selected, stage);
                        return (
                            <li key={stage} className={'grid gap-2 px-1 py-3 sm:grid-cols-[32px_minmax(0,1fr)_auto] sm:items-center ' + (current ? 'bg-amber-50/30 dark:bg-amber-950/10' : '')}>
                                <span className={'flex h-7 w-7 items-center justify-center rounded-full border text-[9px] font-extrabold tabular-nums ' + (current ? 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/25 dark:text-amber-200' : 'border-[var(--municipal-border)] bg-[var(--municipal-surface-subtle)] text-[var(--municipal-muted)]')}>{index + 1}</span>
                                <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="text-[11px] font-bold text-[var(--municipal-text)]">{stage}</span>{current && <span className="text-[8px] font-extrabold uppercase tracking-[0.07em] text-amber-700 dark:text-amber-300">Current reference stage</span>}</div><p className="mt-0.5 text-[9px] leading-4 text-[var(--municipal-muted)]">{stageContext[stage]}</p></div>
                                <ReferenceBadge state={state} />
                            </li>
                        );
                    })}
                </ol>
                <div className="mt-2 border-t border-[var(--municipal-border)] pt-2 text-[9px] leading-4 text-[var(--municipal-muted)]">This sequence demonstrates case dependencies only. It does not execute submission, approval, issuance, inspection, payment or regulatory decisions.</div>
            </section>
        </div>
    );
}

function CaseDetail({ permitCase, onClose }: { permitCase: BuildingPermitCase; onClose: () => void }) {
    const [step, setStep] = useState<DetailStep>('Case Summary');

    useEffect(() => {
        setStep('Case Summary');
    }, [permitCase.reference]);

    return (
        <DetailDrawer
            open
            onClose={onClose}
            title={`${permitCase.reference} · ${permitCase.projectType}`}
            eyebrow="Building permit case reference"
            size="standard"
            footer={<div className="text-[9px] font-semibold text-slate-400">Illustrative reference data · No permit decision or regulatory action enabled</div>}
        >
            <div className="space-y-4">
                <div className="grid grid-cols-3 gap-1.5" role="tablist" aria-label="Building permit detail steps">
                    {(['Case Summary', 'Clearances', 'Timeline'] as DetailStep[]).map((item, index) => (
                        <button key={item} type="button" role="tab" aria-selected={step === item} onClick={() => setStep(item)} className={'min-h-9 rounded-lg border px-2 text-[9px] font-bold transition ' + (step === item ? 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/25 dark:text-emerald-100' : 'border-transparent text-[var(--municipal-muted)] hover:bg-[var(--municipal-hover)]')}><span className="mr-1 text-[8px] opacity-60">{index + 1}</span>{item}</button>
                    ))}
                </div>

                {step === 'Case Summary' && (
                    <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2"><span className="text-[10px] font-extrabold text-[var(--municipal-brand)]">{permitCase.reference}</span><StageBadge stage={permitCase.currentStage} /></div>
                        <dl className="grid gap-2 sm:grid-cols-2">
                            {[
                                ['Project / application', permitCase.projectType],
                                ['Permit state', permitCase.permitState],
                                ['Office context', permitCase.officeContext],
                                ['Current stage', permitCase.currentStage],
                            ].map(([label, value]) => (
                                <div key={label} className="rounded-lg border border-[var(--municipal-border)] bg-[var(--municipal-surface-subtle)] px-3 py-2.5"><dt className="text-[8px] font-extrabold uppercase tracking-[0.06em] text-[var(--municipal-muted)]">{label}</dt><dd className="mt-1 text-[10px] font-semibold leading-4 text-[var(--municipal-text)]">{value}</dd></div>
                            ))}
                        </dl>
                        <div className="rounded-lg border border-[var(--municipal-border)] px-3 py-3"><div className="text-[8px] font-extrabold uppercase tracking-[0.06em] text-[var(--municipal-muted)]">Case note</div><p className="mt-1 text-[10px] leading-4 text-[var(--municipal-text)]">{permitCase.caseNote}</p></div>
                        <div><div className="text-[8px] font-extrabold uppercase tracking-[0.06em] text-[var(--municipal-muted)]">Required references</div><div className="mt-1.5 grid gap-1.5 sm:grid-cols-2">{permitCase.requiredReferences.map((reference) => <div key={reference} className="rounded-lg bg-[var(--municipal-surface-subtle)] px-2.5 py-2 text-[9px] leading-4 text-[var(--municipal-text)]">{reference}</div>)}</div></div>
                    </div>
                )}

                {step === 'Clearances' && (
                    <div className="space-y-2">
                        {clearanceLanes.map(({ key, context }) => (
                            <div key={key} className="grid gap-2 rounded-lg border border-[var(--municipal-border)] p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"><div><div className="text-[10px] font-bold text-[var(--municipal-text)]">{clearanceLabels[key]}</div><p className="mt-0.5 text-[9px] leading-4 text-[var(--municipal-muted)]">{context}</p></div><ReferenceBadge state={permitCase.referenceStates[key]} /></div>
                        ))}
                        <div className="grid gap-2 rounded-lg border border-[var(--municipal-border)] p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"><div><div className="text-[10px] font-bold text-[var(--municipal-text)]">Permit processing</div><p className="mt-0.5 text-[9px] leading-4 text-[var(--municipal-muted)]">Consolidated reference-processing state</p></div><ReferenceBadge state={permitCase.referenceStates.permitProcessing} /></div>
                    </div>
                )}

                {step === 'Timeline' && (
                    <ol className="space-y-1">
                        {permitCase.timeline.map((event, index) => (
                            <li key={event.stage + event.label} className="grid grid-cols-[24px_minmax(0,1fr)] gap-2">
                                <div className="flex flex-col items-center"><span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/25 dark:text-emerald-300"><CircleDot size={9} aria-hidden="true" /></span>{index < permitCase.timeline.length - 1 && <span className="mt-1 h-full w-px bg-[var(--municipal-border)]" />}</div>
                                <div className="pb-3"><div className="flex flex-wrap items-center gap-2"><span className="text-[10px] font-bold text-[var(--municipal-text)]">{event.label}</span><span className="text-[8px] font-bold text-[var(--municipal-muted)]">{event.stage}</span></div><p className="mt-0.5 text-[9px] leading-4 text-[var(--municipal-muted)]">{event.detail}</p></div>
                            </li>
                        ))}
                    </ol>
                )}
            </div>
        </DetailDrawer>
    );
}

export default function BuildingPermitWorkspace({ onBack }: Props) {
    const [activeTab, setActiveTab] = useState<WorkspaceTab>('Overview');
    const [selectedCase, setSelectedCase] = useState<BuildingPermitCase>(buildingPermitCases[0]!);
    const [detailCase, setDetailCase] = useState<BuildingPermitCase | null>(null);

    const headerSignals = [
        {
            label: 'Cases in view',
            value: buildingPermitCases.length,
            tone: 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900/35 dark:text-slate-200',
        },
        {
            label: 'Engineering review',
            value: buildingPermitCases.filter((permitCase) => permitCase.currentStage === 'Engineering').length,
            tone: 'border-amber-200 bg-amber-50/70 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-200',
        },
        {
            label: 'Clearance coordination',
            value: buildingPermitCases.filter((permitCase) => ['Zoning', 'Fire', 'Other clearances'].includes(permitCase.currentStage)).length,
            tone: 'border-blue-200 bg-blue-50/70 text-blue-900 dark:border-blue-900/60 dark:bg-blue-950/20 dark:text-blue-200',
        },
        {
            label: 'Permit processing',
            value: buildingPermitCases.filter((permitCase) => permitCase.currentStage === 'Permit processing').length,
            tone: 'border-emerald-200 bg-emerald-50/70 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/20 dark:text-emerald-200',
        },
    ];

    return (
        <section className="space-y-2.5" aria-label="Building Permit Workflow workspace">
            <header className="rounded-xl border border-[var(--municipal-border)] bg-[var(--municipal-surface)] px-4 py-3">
                <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(430px,520px)] lg:items-center">
                    <div className="min-w-0">
                        {onBack && <button type="button" onClick={onBack} className="mb-1 inline-flex min-h-7 items-center gap-1.5 text-[9px] font-bold text-[var(--municipal-muted)] transition hover:text-[var(--municipal-brand)] focus:outline-none focus:ring-2 focus:ring-[var(--municipal-focus)]/30"><ArrowLeft size={12} aria-hidden="true" /> Future Integrations</button>}
                        <div className="text-[9px] font-extrabold uppercase tracking-[0.1em] text-[var(--municipal-brand)]">Regulatory Casework</div>
                        <div className="mt-0.5 flex items-center gap-2"><Building2 size={17} className="shrink-0 text-[var(--municipal-brand)]" aria-hidden="true" /><h1 className="text-[21px] font-extrabold tracking-tight text-[var(--municipal-text)]">Building Permit Workflow</h1></div>
                        <p className="mt-0.5 text-[10px] font-bold text-[var(--municipal-text)]">Municipal Engineering Office</p>
                        <p className="mt-0.5 text-[9px] font-semibold text-[var(--municipal-muted)]">Cross-office clearance and permit processing</p>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4" aria-label="Building permit case signals">
                        {headerSignals.map((signal) => (
                            <div key={signal.label} className={'min-h-11 rounded-lg border px-2.5 py-2 ' + signal.tone}>
                                <div className="text-[8px] font-extrabold uppercase tracking-[0.06em] opacity-75">{signal.label}</div>
                                <div className="mt-1 text-[15px] font-extrabold leading-none tabular-nums">{signal.value}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </header>

            <nav className="flex gap-1 overflow-x-auto rounded-xl border border-[var(--municipal-border)] bg-[var(--municipal-surface)] p-1" role="tablist" aria-label="Building permit workflow views">
                {tabs.map((tab) => (
                    <button key={tab} type="button" role="tab" aria-selected={activeTab === tab} onClick={() => setActiveTab(tab)} className={'min-h-9 shrink-0 rounded-lg px-3 text-[10px] font-bold transition ' + (activeTab === tab ? 'bg-emerald-50 text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100' : 'text-[var(--municipal-muted)] hover:bg-[var(--municipal-hover)]')}>{tab}</button>
                ))}
            </nav>

            {activeTab === 'Overview' && <Overview selected={selectedCase} onSelect={setSelectedCase} onOpenDetail={() => setDetailCase(selectedCase)} />}
            {activeTab === 'Applications' && <Applications onOpenDetail={setDetailCase} />}
            {activeTab === 'Clearance Matrix' && <ClearanceMatrix onOpenDetail={setDetailCase} />}
            {activeTab === 'Permit Flow' && <PermitFlow selected={selectedCase} onSelect={setSelectedCase} />}

            <div className="flex items-start gap-2 rounded-lg border border-[var(--municipal-border)] bg-[var(--municipal-surface-subtle)] px-3 py-2 text-[9px] font-semibold leading-4 text-[var(--municipal-muted)]"><ShieldCheck size={12} className="mt-0.5 shrink-0 text-[var(--municipal-brand)]" aria-hidden="true" /> Illustrative reference data only. No application submission, permit approval, issuance, inspection authority, fire approval, zoning approval, payment or applicant record is enabled.</div>

            {detailCase && <CaseDetail permitCase={detailCase} onClose={() => setDetailCase(null)} />}
        </section>
    );
}
