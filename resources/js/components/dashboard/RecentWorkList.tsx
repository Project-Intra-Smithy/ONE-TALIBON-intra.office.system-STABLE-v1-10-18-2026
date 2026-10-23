import { Link } from '@inertiajs/react';
import { FileText } from 'lucide-react';
import { dueTone, formatDate, humanize } from './format';
import DashboardScrollRegion from './DashboardScrollRegion';
import type { DashboardWork } from './types';

type Props = { title: string; description: string; items: DashboardWork[]; emptyMessage?: string; compact?: boolean };

export default function RecentWorkList({ title, description, items, emptyMessage = 'No work currently requires attention in this view.', compact = false }: Props) {
    const rows = items.map((item) => compact ? <Link key={item.detailUrl} href={item.detailUrl} className="ot-dashboard-work-row" aria-label={`Open ${item.reference}: ${item.title}`}>
                <span className="ot-dashboard-work-main"><span className="ot-dashboard-work-ref">{item.reference} · {item.transactionType}</span><span className="ot-dashboard-work-title">{item.title}</span><span className="ot-dashboard-work-meta">{item.currentOffice?.shortName || item.currentOffice?.name || 'Office not recorded'} · {humanize(item.status)}</span></span>
                <span className="ot-dashboard-work-side"><strong className={item.dueState === 'overdue' ? 'text-rose-700 dark:text-rose-300' : item.dueState === 'due_soon' ? 'text-amber-700 dark:text-amber-300' : 'text-slate-600 dark:text-slate-300'}>{humanize(item.dueState)}</strong><small>{item.dueAt ? `Due ${formatDate(item.dueAt)}` : `Updated ${formatDate(item.updatedAt)}`}</small></span>
            </Link> : <article key={item.detailUrl} className="min-w-0 px-5 py-6">
                <div className="flex flex-wrap items-start justify-between gap-2"><div className="break-all text-sm font-semibold text-blue-700 dark:text-blue-300">{item.reference} <span className="font-normal text-slate-500 dark:text-slate-400">· {item.transactionType}</span></div><span className={`text-sm font-semibold ${item.dueState === 'on_track' ? 'text-slate-500 dark:text-slate-400' : dueTone[item.dueState].replace(/bg-\S+\s/, '')}`}>{humanize(item.dueState)}</span></div>
                <h3 className="mt-3 break-words text-lg font-semibold leading-7">{item.title}</h3>
                <div className="mt-1 break-words text-sm leading-6 text-slate-500 dark:text-slate-400">{item.originOffice?.shortName || item.originOffice?.name || 'Unknown origin'} → {item.currentOffice?.shortName || item.currentOffice?.name || 'Unknown office'}</div>
                <div className="mt-1 flex flex-wrap justify-between gap-x-3 gap-y-1 text-sm leading-6 text-slate-500 dark:text-slate-400"><span>{item.assignedEmployee?.name || 'Unassigned'} · {humanize(item.status)}</span><span>Updated {formatDate(item.updatedAt)}</span></div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-4 dark:border-slate-700"><span className="text-base">{item.dueAt ? `Due ${formatDate(item.dueAt)}` : 'No deadline recorded'} · {humanize(item.priority)} priority</span><Link href={item.detailUrl} className="workspace-button" aria-label={`Open ${item.reference}: ${item.title}`}>Open work item</Link></div>
            </article>);
    const empty = items.length === 0 && <div className={`px-5 py-7 text-center text-sm leading-6 text-slate-500 dark:text-slate-400 ${compact ? 'ot-dashboard-empty-state' : ''}`}>{emptyMessage}</div>;
    return <section className={`municipal-panel overflow-hidden ${compact ? 'ot-dashboard-recent' : ''}`} aria-label={title}>
        <div className={`${compact ? 'ot-dashboard-panel-heading ' : ''}border-b border-slate-100 px-4 py-3 dark:border-slate-700`}>
            <h2 className="municipal-panel-title"><FileText size={17} className="shrink-0 text-emerald-700 dark:text-emerald-300" />{title}</h2>
            {compact && <span className="ot-dashboard-panel-count" aria-label={`${items.length} recent work items`}>{items.length}</span>}
            {!compact && <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">{description}</p>}
        </div>
        {compact ? <DashboardScrollRegion label={`${title} list`} itemCount={items.length} className="divide-y divide-slate-100 dark:divide-slate-700">
            {rows}{empty}
        </DashboardScrollRegion> : <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {rows}{empty}
        </div>}
    </section>;
}
