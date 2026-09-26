import { FileText } from 'lucide-react';
import type { AnnouncementPriority, MunicipalAnnouncement } from '../../data/municipal/announcements';

const tone: Record<AnnouncementPriority, string> = {
    Routine: 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200',
    Important: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200',
    Urgent: 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200',
};

const groups = [
    ['Urgent', 'Urgent notices', 'Time-sensitive operational information requiring prompt awareness.'],
    ['Important', 'Important notices', 'High-priority information for current municipal coordination.'],
    ['Routine', 'Routine notices', 'General operational information retained for reference.'],
] as const;

const dateContext = (value: string) => {
    const date = new Date(value + 'T00:00:00+08:00');
    const exact = date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'Asia/Manila' });
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila' }).format(new Date());
    const days = Math.round((Date.parse(value + 'T00:00:00Z') - Date.parse(today + 'T00:00:00Z')) / 86400000);
    if (days === 0) return { relative: 'Today', exact };
    if (days === 1) return { relative: 'Tomorrow', exact };
    if (days === -1) return { relative: 'Yesterday', exact };
    if (days > 1 && days <= 7) return { relative: 'In ' + days + ' days', exact };
    if (days < -1 && days >= -7) return { relative: Math.abs(days) + ' days ago', exact };
    return { relative: exact, exact };
};

function Notice({ item }: { item: MunicipalAnnouncement }) {
    const date = dateContext(item.date);
    return <article className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-[#142236]">
        <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
                <div className="flex flex-wrap gap-1.5 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                    <span>{item.id}</span><span aria-hidden="true">·</span>
                    <time dateTime={item.date} title={date.exact} className="font-bold text-slate-700 dark:text-slate-300">{date.relative}</time>
                    {date.relative !== date.exact && <><span aria-hidden="true">·</span><span>{date.exact}</span></>}
                </div>
                <h3 className="mt-1 text-sm font-bold leading-5 text-slate-950 dark:text-slate-100">{item.title}</h3>
            </div>
            <span className={'shrink-0 rounded-full border px-2 py-1 text-[10px] font-bold uppercase ' + tone[item.priority]}>{item.priority}</span>
        </div>
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs"><span className="font-semibold text-blue-800 dark:text-blue-300">{item.issuingOffice}</span><span className="text-slate-500 dark:text-slate-400">Audience: {item.audience}</span></div>
        <p className="mt-2 text-xs leading-5 text-slate-600 dark:text-slate-300">{item.summary}</p>
        <div className="mt-2 flex items-start gap-1.5 border-t border-slate-100 pt-2 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400"><FileText size={12} className="mt-0.5 shrink-0" aria-hidden="true" /><span>{item.relatedDocument}</span></div>
    </article>;
}

export default function AnnouncementRegister({ items }: { items: MunicipalAnnouncement[] }) {
    const sorted = [...items].sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title));
    if (!sorted.length) return <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">No announcements match the current search and priority filter.</div>;

    return <div className="space-y-3">{groups.map(([priority, title, description]) => {
        const groupItems = sorted.filter((item) => item.priority === priority);
        if (!groupItems.length) return null;
        return <section key={priority} className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50/60 dark:border-slate-700 dark:bg-slate-900/20">
            <div className="flex flex-col gap-1 border-b border-slate-200 px-3 py-2.5 dark:border-slate-700 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-sm font-bold text-slate-950 dark:text-slate-100">{title}</h2><p className="text-xs text-slate-500 dark:text-slate-400">{description}</p></div><span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{groupItems.length} notice{groupItems.length === 1 ? '' : 's'}</span></div>
            <div className={priority === 'Routine' ? 'max-h-[34rem] space-y-2 overflow-y-auto p-2.5' : 'grid gap-2.5 p-2.5 lg:grid-cols-2'}>{groupItems.map((item) => <Notice key={item.id} item={item} />)}</div>
        </section>;
    })}</div>;
}
