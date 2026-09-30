import { useEffect, useMemo, useState } from 'react';
import {
    ArrowLeft,
    BarChart3,
    ChevronLeft,
    ChevronRight,
    FileText,
    Gauge,
    Landmark,
    WalletCards,
} from 'lucide-react';
import {
    budgetAttention,
    budgetLines,
    budgetSummary,
    formatPeso,
    obligationReferences,
    type BudgetLine,
    type ObligationReference,
} from '../../data/municipal/budgetMonitoringData';
import DetailDrawer from './DetailDrawer';

type Props = {
    onBack: () => void;
};

type Tab = 'Overview' | 'Budget Lines' | 'Obligations' | 'Utilization';
type DetailStep = 'summary' | 'obligations' | 'movement';

const tabs: Tab[] = ['Overview', 'Budget Lines', 'Obligations', 'Utilization'];
const detailSteps: Array<{ id: DetailStep; label: string }> = [
    { id: 'summary', label: 'Summary' },
    { id: 'obligations', label: 'Obligation References' },
    { id: 'movement', label: 'Movement' },
];

function percentageWidth(value: number): string {
    return `${Math.max(0, Math.min(100, value))}%`;
}

function formatCompactPeso(value: number): string {
    return `₱${(value / 1_000_000).toFixed(2)}M`;
}

function utilizationTone(value: number): string {
    if (value >= 70) return 'bg-amber-500';
    if (value < 40) return 'bg-slate-400';
    return 'bg-indigo-500';
}

function obligationStatusTone(status: ObligationReference['status']): string {
    if (status === 'Recorded') return 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/35 dark:text-emerald-200';
    if (status === 'For reference') return 'bg-blue-50 text-blue-800 dark:bg-blue-950/35 dark:text-blue-200';
    return 'bg-amber-50 text-amber-800 dark:bg-amber-950/35 dark:text-amber-200';
}

function WorkspaceHeader({ onBack }: { onBack: () => void }) {
    return (
        <div className="space-y-2.5">
            <button type="button" onClick={onBack} className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-bold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[var(--municipal-focus)]/30 dark:border-slate-700 dark:bg-[#142236] dark:text-slate-200">
                <ArrowLeft size={14} aria-hidden="true" /> Back to Future Integrations
            </button>
            <header className="rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-[#142236]">
                <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                    <div className="min-w-0">
                        <div className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-blue-700 dark:text-blue-300">Financial monitoring</div>
                        <h1 className="mt-0.5 text-[22px] font-extrabold tracking-tight text-slate-950 dark:text-slate-100">Budget &amp; Obligation Monitoring</h1>
                        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-slate-500 dark:text-slate-400">
                            <span className="font-extrabold text-slate-700 dark:text-slate-200">Municipal Budget Office</span>
                            <span className="hidden h-1 w-1 rounded-full bg-slate-300 sm:inline-block" aria-hidden="true" />
                            <span className="font-semibold">Budget utilization, obligation references and available balance</span>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                        <span className="inline-flex rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-[9px] font-extrabold uppercase tracking-[0.08em] text-blue-800 dark:border-blue-900/55 dark:bg-blue-950/25 dark:text-blue-200">FY 2026</span>
                        <div className="text-left lg:text-right">
                            <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[8px] font-extrabold uppercase tracking-[0.08em] text-slate-600 dark:border-slate-700 dark:bg-slate-900/45 dark:text-slate-300">Presentation environment</span>
                            <div className="mt-1 text-[9px] font-semibold text-slate-400">Reference data only · Actions disabled</div>
                        </div>
                    </div>
                </div>
            </header>
        </div>
    );
}

function SummaryCards() {
    const cards = [
        { label: 'Approved Budget', value: formatCompactPeso(budgetSummary.approved), detail: 'Reference appropriation total', icon: Landmark, className: 'border-blue-200 bg-blue-50/60 text-blue-950 dark:border-blue-900/55 dark:bg-blue-950/18 dark:text-blue-100', iconClass: 'text-blue-700 dark:text-blue-300' },
        { label: 'Obligated', value: formatCompactPeso(budgetSummary.obligated), detail: 'Recorded obligation total', icon: FileText, className: 'border-amber-200 bg-amber-50/60 text-amber-950 dark:border-amber-900/55 dark:bg-amber-950/18 dark:text-amber-100', iconClass: 'text-amber-700 dark:text-amber-300' },
        { label: 'Available Balance', value: formatCompactPeso(budgetSummary.available), detail: 'Remaining reference balance', icon: WalletCards, className: 'border-emerald-200 bg-emerald-50/60 text-emerald-950 dark:border-emerald-900/55 dark:bg-emerald-950/18 dark:text-emerald-100', iconClass: 'text-emerald-700 dark:text-emerald-300' },
        { label: 'Overall Utilization', value: `${budgetSummary.utilization.toFixed(1)}%`, detail: 'Obligated against approved', icon: Gauge, className: 'border-indigo-200 bg-indigo-50/60 text-indigo-950 dark:border-indigo-900/55 dark:bg-indigo-950/18 dark:text-indigo-100', iconClass: 'text-indigo-700 dark:text-indigo-300' },
    ];

    return (
        <section className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4" aria-label="Budget monitoring summary">
            {cards.map(({ label, value, detail, icon: Icon, className, iconClass }) => (
                <div key={label} className={`grid min-h-[82px] grid-cols-[36px_minmax(0,1fr)] items-center gap-3 rounded-lg border px-3 py-2.5 ${className}`}>
                    <span className="flex h-9 w-9 items-center justify-center rounded-md bg-white/80 shadow-sm dark:bg-slate-950/20"><Icon size={17} className={iconClass} aria-hidden="true" /></span>
                    <div className="min-w-0">
                        <div className="text-[8px] font-extrabold uppercase tracking-[0.09em] opacity-65">{label}</div>
                        <div className="mt-1 truncate text-[21px] font-extrabold leading-none tabular-nums tracking-tight">{value}</div>
                        <div className="mt-1 truncate text-[9px] font-semibold opacity-65">{detail}</div>
                    </div>
                </div>
            ))}
        </section>
    );
}

function UtilizationRow({ line, compact = false }: { line: BudgetLine; compact?: boolean }) {
    return (
        <div className={compact ? 'py-1.5' : 'py-2'}>
            <div className="flex items-center justify-between gap-3">
                <div className="min-w-0"><div className="truncate text-[10px] font-bold text-slate-800 dark:text-slate-100">{line.program}</div><div className="mt-0.5 truncate text-[8px] font-medium text-slate-400">{line.office}</div></div>
                <div className="shrink-0 text-[10px] font-extrabold tabular-nums text-indigo-700 dark:text-indigo-300">{line.utilization.toFixed(1)}%</div>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div className={`h-full rounded-full ${utilizationTone(line.utilization)}`} style={{ width: percentageWidth(line.utilization) }} /></div>
        </div>
    );
}

function CompactBudgetRegister({ onOpen }: { onOpen: (line: BudgetLine) => void }) {
    return (
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-[#142236]">
            <div className="flex flex-col gap-1 border-b border-slate-100 px-3 py-2.5 dark:border-slate-700 sm:flex-row sm:items-end sm:justify-between">
                <div><h2 className="text-[11px] font-extrabold text-slate-950 dark:text-slate-100">Budget line register</h2><p className="mt-0.5 text-[9px] text-slate-500 dark:text-slate-400">Financial control surface for appropriation, obligation, balance and utilization comparison.</p></div>
                <span className="text-[9px] font-semibold tabular-nums text-slate-400">{budgetLines.length} budget lines</span>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full min-w-[920px] table-fixed text-left">
                    <colgroup><col className="w-[12%]" /><col className="w-[19%]" /><col className="w-[19%]" /><col className="w-[12.5%]" /><col className="w-[12.5%]" /><col className="w-[12.5%]" /><col className="w-[12.5%]" /></colgroup>
                    <thead className="bg-slate-50 text-[8px] font-bold uppercase tracking-[0.06em] text-slate-500 dark:bg-slate-900/40 dark:text-slate-400"><tr><th className="px-3 py-2">Budget line</th><th className="px-3 py-2">Program / purpose</th><th className="px-3 py-2">Responsible office</th><th className="px-3 py-2 text-right">Approved</th><th className="px-3 py-2 text-right">Obligated</th><th className="px-3 py-2 text-right">Available</th><th className="px-3 py-2 text-right">Utilization</th></tr></thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {budgetLines.map((line) => (
                            <tr key={line.id} onClick={() => onOpen(line)} className="cursor-pointer transition hover:bg-blue-50/30 dark:hover:bg-slate-900/35">
                                <td className="px-3 py-2.5 text-[9px] font-extrabold text-slate-600 dark:text-slate-300">{line.id}</td>
                                <td className="px-3 py-2.5 text-[10px] font-bold text-slate-800 dark:text-slate-100">{line.program}</td>
                                <td className="px-3 py-2.5 text-[9px] font-semibold text-slate-500 dark:text-slate-400">{line.office}</td>
                                <td className="px-3 py-2.5 text-right text-[9px] font-semibold tabular-nums text-slate-700 dark:text-slate-200">{formatPeso(line.approved)}</td>
                                <td className="px-3 py-2.5 text-right text-[9px] font-semibold tabular-nums text-amber-700 dark:text-amber-300">{formatPeso(line.obligated)}</td>
                                <td className="px-3 py-2.5 text-right text-[9px] font-semibold tabular-nums text-emerald-700 dark:text-emerald-300">{formatPeso(line.available)}</td>
                                <td className="px-3 py-2.5 text-right text-[9px] font-extrabold tabular-nums text-indigo-700 dark:text-indigo-300">{line.utilization.toFixed(1)}%</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    );
}

function Overview({ onOpen }: { onOpen: (line: BudgetLine) => void }) {
    const attention = [
        { label: 'High utilization', value: budgetAttention.highUtilization, detail: '70% and above', tone: 'border-amber-200 bg-amber-50/70 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/25 dark:text-amber-200' },
        { label: 'Low utilization', value: budgetAttention.lowUtilization, detail: 'Below 40%', tone: 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-200' },
        { label: 'Pending references', value: budgetAttention.pendingReferences, detail: 'Reference follow-up', tone: 'border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-[#142236] dark:text-slate-200' },
    ];

    return (
        <div className="space-y-3">
            <SummaryCards />
            <div className="grid items-start gap-3 xl:grid-cols-[minmax(0,2.35fr)_minmax(250px,.9fr)]">
                <section className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-[#142236]">
                    <div className="flex items-center justify-between gap-3"><div><h2 className="text-[11px] font-extrabold text-slate-950 dark:text-slate-100">Utilization by program</h2><p className="mt-0.5 text-[9px] text-slate-500 dark:text-slate-400">Obligation use against each approved budget line.</p></div><BarChart3 size={16} className="text-indigo-500" aria-hidden="true" /></div>
                    <div className="mt-2 divide-y divide-slate-100 dark:divide-slate-700">{budgetLines.map((line) => <UtilizationRow key={line.id} line={line} compact />)}</div>
                </section>
                <section className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-[#142236]">
                    <h2 className="text-[11px] font-extrabold text-slate-950 dark:text-slate-100">Budget attention</h2>
                    <p className="mt-0.5 text-[9px] text-slate-500 dark:text-slate-400">Reference conditions that merit review.</p>
                    <div className="mt-2 space-y-2">{attention.map((item) => <div key={item.label} className={`rounded-lg border px-2.5 py-2 ${item.tone}`}><div className="flex items-center justify-between gap-3"><span className="text-[9px] font-bold">{item.label}</span><span className="text-[17px] font-extrabold tabular-nums">{item.value}</span></div><div className="mt-0.5 text-[8px] opacity-65">{item.detail}</div></div>)}</div>
                </section>
            </div>
            <CompactBudgetRegister onOpen={onOpen} />
        </div>
    );
}

function BudgetLinesRegister({ onOpen }: { onOpen: (line: BudgetLine) => void }) {
    return (
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-[#142236]">
            <div className="border-b border-slate-100 px-3 py-2.5 dark:border-slate-700"><h2 className="text-[12px] font-extrabold text-slate-950 dark:text-slate-100">Budget lines</h2><p className="mt-0.5 text-[9px] text-slate-500 dark:text-slate-400">Detailed financial register for approved amounts, obligations, remaining balances and utilization.</p></div>
            <div className="overflow-x-auto">
                <table className="w-full min-w-[980px] table-fixed text-left">
                    <colgroup><col className="w-[12%]" /><col className="w-[20%]" /><col className="w-[20%]" /><col className="w-[12%]" /><col className="w-[12%]" /><col className="w-[12%]" /><col className="w-[12%]" /></colgroup>
                    <thead className="bg-slate-50 text-[9px] font-bold uppercase tracking-[0.06em] text-slate-500 dark:bg-slate-900/40 dark:text-slate-400"><tr><th className="px-3 py-2.5">Budget line</th><th className="px-3 py-2.5">Program / purpose</th><th className="px-3 py-2.5">Responsible office</th><th className="px-3 py-2.5 text-right">Approved</th><th className="px-3 py-2.5 text-right">Obligated</th><th className="px-3 py-2.5 text-right">Available</th><th className="px-3 py-2.5 text-right">Utilization</th></tr></thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {budgetLines.map((line) => (
                            <tr key={line.id} onClick={() => onOpen(line)} className="cursor-pointer transition hover:bg-blue-50/30 dark:hover:bg-slate-900/35">
                                <td className="px-3 py-3 text-[9px] font-extrabold text-slate-600 dark:text-slate-300">{line.id}</td>
                                <td className="px-3 py-3 text-[10px] font-bold text-slate-800 dark:text-slate-100">{line.program}</td>
                                <td className="px-3 py-3 text-[10px] font-semibold text-slate-600 dark:text-slate-300">{line.office}</td>
                                <td className="px-3 py-3 text-right text-[10px] font-semibold tabular-nums text-blue-700 dark:text-blue-300">{formatPeso(line.approved)}</td>
                                <td className="px-3 py-3 text-right text-[10px] font-semibold tabular-nums text-amber-700 dark:text-amber-300">{formatPeso(line.obligated)}</td>
                                <td className="px-3 py-3 text-right text-[10px] font-semibold tabular-nums text-emerald-700 dark:text-emerald-300">{formatPeso(line.available)}</td>
                                <td className="px-3 py-3 text-right"><div className="ml-auto w-[92px]"><div className="text-[10px] font-extrabold tabular-nums text-indigo-700 dark:text-indigo-300">{line.utilization.toFixed(1)}%</div><div className="mt-1 h-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div className={`h-full rounded-full ${utilizationTone(line.utilization)}`} style={{ width: percentageWidth(line.utilization) }} /></div></div></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    );
}

function ObligationsRegister() {
    return (
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-[#142236]">
            <div className="border-b border-slate-100 px-3 py-2.5 dark:border-slate-700"><h2 className="text-[12px] font-extrabold text-slate-950 dark:text-slate-100">Obligation references</h2><p className="mt-0.5 text-[9px] text-slate-500 dark:text-slate-400">Budget-line obligation references only. No ledger posting, disbursement or approval behavior is represented.</p></div>
            <div className="overflow-x-auto">
                <table className="w-full min-w-[850px] table-fixed text-left">
                    <colgroup><col className="w-[18%]" /><col className="w-[16%]" /><col className="w-[32%]" /><col className="w-[16%]" /><col className="w-[18%]" /></colgroup>
                    <thead className="bg-slate-50 text-[9px] font-bold uppercase tracking-[0.06em] text-slate-500 dark:bg-slate-900/40 dark:text-slate-400"><tr><th className="px-3 py-2.5">Obligation reference</th><th className="px-3 py-2.5">Budget line</th><th className="px-3 py-2.5">Program / purpose</th><th className="px-3 py-2.5 text-right">Amount</th><th className="px-3 py-2.5">Status / reference state</th></tr></thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {obligationReferences.map((reference) => {
                            const line = budgetLines.find((item) => item.id === reference.budgetLineId);
                            return (
                                <tr key={reference.id}>
                                    <td className="px-3 py-3 text-[9px] font-extrabold text-slate-600 dark:text-slate-300">{reference.id}</td>
                                    <td className="px-3 py-3 text-[9px] font-bold text-blue-700 dark:text-blue-300">{reference.budgetLineId}</td>
                                    <td className="px-3 py-3"><div className="text-[10px] font-bold text-slate-800 dark:text-slate-100">{line?.program ?? reference.description}</div><div className="mt-0.5 text-[8px] text-slate-400">{reference.description}</div></td>
                                    <td className="px-3 py-3 text-right text-[10px] font-semibold tabular-nums text-slate-700 dark:text-slate-200">{formatPeso(reference.amount)}</td>
                                    <td className="px-3 py-3"><span className={`inline-flex rounded-full px-2 py-1 text-[8px] font-bold ${obligationStatusTone(reference.status)}`}>{reference.status}</span></td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </section>
    );
}

function UtilizationView() {
    const highest = budgetLines.reduce((best, line) => line.utilization > best.utilization ? line : best, budgetLines[0]);
    const lowest = budgetLines.reduce((best, line) => line.utilization < best.utilization ? line : best, budgetLines[0]);
    const availableShare = (budgetSummary.available / budgetSummary.approved) * 100;
    const tiles = [
        { label: 'Overall utilization', value: `${budgetSummary.utilization.toFixed(1)}%`, detail: 'Obligated / approved' },
        { label: 'Available balance', value: formatCompactPeso(budgetSummary.available), detail: `${availableShare.toFixed(1)}% of approved budget` },
        { label: 'Highest utilization', value: `${highest.utilization.toFixed(1)}%`, detail: highest.program },
        { label: 'Lowest utilization', value: `${lowest.utilization.toFixed(1)}%`, detail: lowest.program },
    ];

    return (
        <div className="space-y-3">
            <section className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4" aria-label="Utilization statistics">{tiles.map((tile) => <div key={tile.label} className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-[#142236]"><div className="text-[8px] font-extrabold uppercase tracking-[0.08em] text-slate-400">{tile.label}</div><div className="mt-1 text-[18px] font-extrabold tabular-nums text-indigo-700 dark:text-indigo-300">{tile.value}</div><div className="mt-1 truncate text-[9px] text-slate-500 dark:text-slate-400">{tile.detail}</div></div>)}</section>
            <div className="grid items-start gap-3 xl:grid-cols-[minmax(0,1.75fr)_minmax(290px,.85fr)]">
                <section className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-[#142236]"><div className="flex items-end justify-between gap-3"><div><h2 className="text-[11px] font-extrabold text-slate-950 dark:text-slate-100">Program utilization</h2><p className="mt-0.5 text-[9px] text-slate-500 dark:text-slate-400">Percentage comparison with remaining-balance context.</p></div><span className="text-[9px] font-semibold tabular-nums text-slate-400">Available {formatPeso(budgetSummary.available)}</span></div><div className="mt-2 divide-y divide-slate-100 dark:divide-slate-700">{budgetLines.map((line) => <div key={line.id} className="py-2"><div className="grid gap-1 sm:grid-cols-[minmax(0,1fr)_120px_80px] sm:items-center"><div className="min-w-0"><div className="truncate text-[10px] font-bold text-slate-800 dark:text-slate-100">{line.program}</div><div className="mt-0.5 truncate text-[8px] text-slate-400">{line.office}</div></div><div className="text-right text-[9px] font-semibold tabular-nums text-emerald-700 dark:text-emerald-300">{formatPeso(line.available)} available</div><div className="text-right text-[10px] font-extrabold tabular-nums text-indigo-700 dark:text-indigo-300">{line.utilization.toFixed(1)}%</div></div><div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div className={`h-full rounded-full ${utilizationTone(line.utilization)}`} style={{ width: percentageWidth(line.utilization) }} /></div></div>)}</div></section>
                <section className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-[#142236]"><h2 className="text-[11px] font-extrabold text-slate-950 dark:text-slate-100">Attention thresholds</h2><p className="mt-0.5 text-[9px] text-slate-500 dark:text-slate-400">Analytical thresholds for presentation review.</p><div className="mt-2 space-y-2 text-[9px]"><div className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-2 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/25 dark:text-amber-200"><strong>70%+</strong><span className="ml-2 opacity-75">High-utilization reference</span></div><div className="rounded-lg border border-indigo-100 bg-indigo-50/60 px-2.5 py-2 text-indigo-800 dark:border-indigo-900/40 dark:bg-indigo-950/20 dark:text-indigo-200"><strong>40–69.9%</strong><span className="ml-2 opacity-75">Mid-range monitoring</span></div><div className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-slate-700 dark:border-slate-700 dark:bg-slate-900/35 dark:text-slate-200"><strong>Below 40%</strong><span className="ml-2 opacity-75">Low-utilization reference</span></div></div></section>
            </div>
            <section className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-[#142236]"><h2 className="text-[11px] font-extrabold text-slate-950 dark:text-slate-100">Approved budget distribution</h2><p className="mt-0.5 text-[9px] text-slate-500 dark:text-slate-400">Program share of the approved reference budget.</p><div className="mt-3 grid gap-x-5 gap-y-2 md:grid-cols-2">{budgetLines.map((line) => { const share = (line.approved / budgetSummary.approved) * 100; return <div key={line.id}><div className="flex items-center justify-between gap-3 text-[9px]"><span className="truncate font-bold text-slate-700 dark:text-slate-200">{line.program}</span><span className="shrink-0 font-semibold tabular-nums text-slate-500">{formatPeso(line.approved)} · {share.toFixed(1)}%</span></div><div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div className="h-full rounded-full bg-blue-500" style={{ width: percentageWidth(share) }} /></div></div>; })}</div></section>
        </div>
    );
}

function BudgetLineModal({ line, open, onClose }: { line: BudgetLine | null; open: boolean; onClose: () => void }) {
    const [step, setStep] = useState<DetailStep>('summary');
    useEffect(() => { if (open) setStep('summary'); }, [open, line?.id]);
    const lineReferences = useMemo(() => line ? obligationReferences.filter((reference) => line.obligationReferenceIds.includes(reference.id)) : [], [line]);
    const stepIndex = detailSteps.findIndex((item) => item.id === step);
    const moveStep = (offset: number) => { const next = detailSteps[stepIndex + offset]; if (next) setStep(next.id); };

    return (
        <DetailDrawer
            open={open && Boolean(line)}
            onClose={onClose}
            size="standard"
            eyebrow="Budget line details"
            title={line ? `${line.id} · ${line.program}` : 'Budget line details'}
            footer={line ? <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><div className="text-[9px] font-semibold text-slate-400">Step {stepIndex + 1} of {detailSteps.length}</div><div className="flex flex-wrap justify-end gap-2">{stepIndex > 0 && <button type="button" onClick={() => moveStep(-1)} className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 text-[10px] font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:bg-[#142236] dark:text-slate-200"><ChevronLeft size={13} aria-hidden="true" /> Back</button>}<button type="button" onClick={onClose} className="min-h-9 rounded-lg border border-slate-300 bg-white px-3 text-[10px] font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:bg-[#142236] dark:text-slate-200">Close</button>{stepIndex < detailSteps.length - 1 && <button type="button" onClick={() => moveStep(1)} className="inline-flex min-h-9 items-center gap-1 rounded-lg bg-[#0b2852] px-3 text-[10px] font-bold text-white hover:bg-[#123764]">Next <ChevronRight size={13} aria-hidden="true" /></button>}</div></div> : undefined}
        >
            {line && <div className="space-y-4">
                <div role="tablist" aria-label="Budget line detail sections" className="grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-900/55">{detailSteps.map((item, index) => <button key={item.id} type="button" role="tab" aria-selected={step === item.id} onClick={() => setStep(item.id)} className={'min-h-9 rounded-lg px-2 text-[10px] font-bold transition ' + (step === item.id ? 'bg-white text-blue-800 shadow-sm dark:bg-[#142236] dark:text-blue-300' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200')}><span className="mr-1 text-[9px] opacity-55">{index + 1}</span>{item.label}</button>)}</div>
                {step === 'summary' && <section aria-label="Budget line summary"><dl className="grid gap-3 text-[11px] sm:grid-cols-2"><div className="rounded-lg bg-slate-50 px-3 py-2.5 dark:bg-slate-900/40"><dt className="text-slate-400">Budget line</dt><dd className="mt-1 font-bold text-slate-800 dark:text-slate-200">{line.id}</dd></div><div className="rounded-lg bg-slate-50 px-3 py-2.5 dark:bg-slate-900/40"><dt className="text-slate-400">Program</dt><dd className="mt-1 font-bold text-slate-800 dark:text-slate-200">{line.program}</dd></div><div className="rounded-lg border border-slate-200 px-3 py-2.5 dark:border-slate-700 sm:col-span-2"><dt className="text-slate-400">Responsible office</dt><dd className="mt-1 font-semibold text-slate-700 dark:text-slate-300">{line.office}</dd></div><div className="rounded-lg bg-blue-50 px-3 py-2.5 dark:bg-blue-950/20"><dt className="text-blue-500">Approved</dt><dd className="mt-1 font-extrabold tabular-nums text-blue-900 dark:text-blue-200">{formatPeso(line.approved)}</dd></div><div className="rounded-lg bg-amber-50 px-3 py-2.5 dark:bg-amber-950/20"><dt className="text-amber-600">Obligated</dt><dd className="mt-1 font-extrabold tabular-nums text-amber-900 dark:text-amber-200">{formatPeso(line.obligated)}</dd></div><div className="rounded-lg bg-emerald-50 px-3 py-2.5 dark:bg-emerald-950/20"><dt className="text-emerald-600">Available</dt><dd className="mt-1 font-extrabold tabular-nums text-emerald-900 dark:text-emerald-200">{formatPeso(line.available)}</dd></div><div className="rounded-lg bg-indigo-50 px-3 py-2.5 dark:bg-indigo-950/20"><dt className="text-indigo-500">Utilization</dt><dd className="mt-1 font-extrabold tabular-nums text-indigo-900 dark:text-indigo-200">{line.utilization.toFixed(1)}%</dd></div></dl></section>}
                {step === 'obligations' && <section aria-label="Obligation references"><div className="mb-3 text-[9px] text-slate-500 dark:text-slate-400">Reference-only rows associated with this budget line.</div><div className="space-y-2">{lineReferences.map((reference) => <div key={reference.id} className="grid gap-2 rounded-lg border border-slate-200 px-3 py-2.5 dark:border-slate-700 sm:grid-cols-[120px_minmax(0,1fr)_120px_auto] sm:items-center"><span className="text-[9px] font-extrabold text-slate-500">{reference.id}</span><span className="text-[10px] font-semibold text-slate-700 dark:text-slate-200">{reference.description}</span><span className="text-right text-[10px] font-bold tabular-nums text-slate-700 dark:text-slate-200">{formatPeso(reference.amount)}</span><span className={`inline-flex justify-self-start rounded-full px-2 py-1 text-[8px] font-bold sm:justify-self-end ${obligationStatusTone(reference.status)}`}>{reference.status}</span></div>)}{lineReferences.length === 0 && <div className="text-[10px] text-slate-500">No obligation references are linked in this presentation record.</div>}</div></section>}
                {step === 'movement' && <section aria-label="Budget reference movement"><div className="relative ml-2 border-l border-slate-200 pl-5 dark:border-slate-700">{line.movement.map((item, index) => <div key={`${line.id}-movement-${index}`} className="relative pb-4 last:pb-0"><span className="absolute -left-[25px] top-1.5 h-2 w-2 rounded-full border-2 border-white bg-blue-600 ring-1 ring-blue-200 dark:border-[#142236] dark:ring-blue-900" /><div className="text-[10px] font-semibold leading-5 text-slate-700 dark:text-slate-300">{item}</div></div>)}</div></section>}
            </div>}
        </DetailDrawer>
    );
}

export default function BudgetMonitoringWorkspace({ onBack }: Props) {
    const [tab, setTab] = useState<Tab>('Overview');
    const [selectedLine, setSelectedLine] = useState<BudgetLine | null>(null);
    const openLine = (line: BudgetLine) => setSelectedLine(line);

    return (
        <section className="space-y-2.5" aria-label="Budget & Obligation Monitoring workspace">
            <WorkspaceHeader onBack={onBack} />
            <div className="rounded-xl border border-slate-200 bg-white px-2 pt-1 dark:border-slate-700 dark:bg-[#142236]">
                <div role="tablist" aria-label="Budget monitoring views" className="flex gap-1 overflow-x-auto">{tabs.map((item) => <button key={item} type="button" role="tab" aria-selected={tab === item} onClick={() => setTab(item)} className={'min-h-9 shrink-0 rounded-lg px-3 text-[10px] font-bold transition ' + (tab === item ? 'bg-blue-50 text-blue-900 dark:bg-blue-950/35 dark:text-blue-100' : 'text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-900/35')}>{item}</button>)}</div>
            </div>
            {tab === 'Overview' && <Overview onOpen={openLine} />}
            {tab === 'Budget Lines' && <BudgetLinesRegister onOpen={openLine} />}
            {tab === 'Obligations' && <ObligationsRegister />}
            {tab === 'Utilization' && <UtilizationView />}
            <footer className="px-1 text-[9px] text-slate-400">This financial monitoring workspace is configured for presentation review. Posting, approval, ledger and disbursement actions are unavailable.</footer>
            <BudgetLineModal line={selectedLine} open={Boolean(selectedLine)} onClose={() => setSelectedLine(null)} />
        </section>
    );
}
