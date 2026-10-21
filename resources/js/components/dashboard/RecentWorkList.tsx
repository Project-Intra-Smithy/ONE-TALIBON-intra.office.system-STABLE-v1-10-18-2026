import { Link } from '@inertiajs/react';
import { FileText } from 'lucide-react';
import { dueTone, formatDate, humanize } from './format';
import type { DashboardWork } from './types';

type Props = { title: string; description: string; items: DashboardWork[]; emptyMessage?: string };

export default function RecentWorkList({ title, description, items, emptyMessage = 'No work currently requires attention in this view.' }: Props) {
    return <section className="municipal-panel overflow-hidden" aria-label={title}>
        <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-700">
            <h2 className="municipal-panel-title"><FileText size={17} className="shrink-0 text-blue-700 dark:text-blue-300" />{title}</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-500 dark:text-slate-400">{description}</p>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {items.map((item) => <article key={item.detailUrl} className="min-w-0 px-5 py-6">
                <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="break-all text-sm font-semibold text-blue-700 dark:text-blue-300">{item.reference} <span className="font-normal text-slate-500 dark:text-slate-400">· {item.transactionType}</span></div>
                    <span className={`text-sm font-semibold ${item.dueState === 'on_track' ? 'text-slate-500 dark:text-slate-400' : dueTone[item.dueState].replace(/bg-\S+\s/, '')}`}>{humanize(item.dueState)}</span>
                </div>
                <h3 className="mt-3 break-words text-lg font-semibold leading-7">{item.title}</h3>
                <div className="mt-1 break-words text-sm leading-6 text-slate-500 dark:text-slate-400">{item.originOffice?.shortName || item.originOffice?.name || 'Unknown origin'} → {item.currentOffice?.shortName || item.currentOffice?.name || 'Unknown office'}</div>
                <div className="mt-1 flex flex-wrap justify-between gap-x-3 gap-y-1 text-sm leading-6 text-slate-500 dark:text-slate-400"><span>{item.assignedEmployee?.name || 'Unassigned'} · {humanize(item.status)}</span><span>Updated {formatDate(item.updatedAt)}</span></div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-4 dark:border-slate-700">
                    <span className="text-base">{item.dueAt ? `Due ${formatDate(item.dueAt)}` : 'No deadline recorded'} · {humanize(item.priority)} priority</span>
                    <Link href={item.detailUrl} className="workspace-button" aria-label={`Open ${item.reference}: ${item.title}`}>Open work item</Link>
                </div>
            </article>)}
            {items.length === 0 && <div className="px-5 py-7 text-center text-sm leading-6 text-slate-500 dark:text-slate-500 dark:text-slate-400">{emptyMessage}</div>}
        </div>
    </section>;
}
