import { Link } from '@inertiajs/react';
import { ArrowRight, FileText, Plus } from 'lucide-react';
import PageFrame from '../../components/PageFrame';
import PageHeader from '../../components/PageHeader';
import AppLayout from '../../layouts/AppLayout';

type Memo = { id: number; memo_number: string; title: string; classification: string; requires_acknowledgement: boolean; published_at: string; recipients_count: number; issuer: { name: string }; issuing_department: { name: string; short_name?: string } };

const publicationContext = (value: string) => {
    const date = new Date(value);
    const exact = date.toLocaleString('en-PH', { timeZone: 'Asia/Manila', year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
    const elapsedMinutes = Math.floor((Date.now() - date.getTime()) / 60000);
    if (elapsedMinutes >= 0 && elapsedMinutes < 1) return { relative: 'Just now', exact };
    if (elapsedMinutes >= 1 && elapsedMinutes < 60) return { relative: elapsedMinutes + ' min ago', exact };
    if (elapsedMinutes >= 60 && elapsedMinutes < 24 * 60) return { relative: Math.floor(elapsedMinutes / 60) + ' hr ago', exact };
    if (elapsedMinutes >= 24 * 60 && elapsedMinutes < 48 * 60) return { relative: 'Yesterday', exact };
    return { relative: date.toLocaleDateString('en-PH', { timeZone: 'Asia/Manila', month: 'short', day: 'numeric', year: 'numeric' }), exact };
};

export default function Index({ memoranda, canPublish }: { memoranda: Memo[]; canPublish: boolean }) {
    return <AppLayout title="Official Memoranda"><PageFrame width="standard">
        <PageHeader
            eyebrow="Formal internal issuance"
            title="Official Memoranda"
            icon={FileText}
            description="Formal numbered internal issuances from municipal offices, delivered to defined recipients with acknowledgement tracking when required. General operational notices remain under Announcements."
            aside={canPublish && <Link href="/memoranda/create" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[var(--municipal-brand-deep)] px-4 py-2.5 text-sm font-semibold text-white"><Plus size={17} aria-hidden="true" />Publish memorandum</Link>}
        />
        <div className="municipal-panel divide-y divide-slate-100 overflow-hidden dark:divide-slate-700">
            {memoranda.map((memo) => {
                const publication = publicationContext(memo.published_at);
                return <Link key={memo.id} href={'/memoranda/' + memo.id} className="flex flex-col gap-2.5 px-4 py-3 transition hover:bg-[var(--municipal-hover)] sm:px-5 md:flex-row md:items-center md:justify-between">
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <span className="text-xs font-bold uppercase tracking-wide text-[var(--municipal-brand)]">{memo.memo_number}</span>
                            <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">{memo.classification}</span>
                        </div>
                        <div className="mt-1 break-words text-sm font-semibold leading-5 text-slate-950 dark:text-slate-100">{memo.title}</div>
                        <div className="mt-1 flex flex-wrap gap-x-2 gap-y-0.5 text-xs text-slate-500 dark:text-slate-400">
                            <span>{memo.issuing_department.short_name || memo.issuing_department.name}</span>
                            <span aria-hidden="true">·</span>
                            <time dateTime={memo.published_at} title={publication.exact} className="font-semibold text-slate-700 dark:text-slate-300">{publication.relative}</time>
                            <span aria-hidden="true">·</span>
                            <span>{publication.exact}</span>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <span className={memo.requires_acknowledgement ? 'rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[10px] font-bold uppercase text-blue-800 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-200' : 'rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-semibold uppercase text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'}>{memo.requires_acknowledgement ? 'Acknowledgement required' : 'No acknowledgement required'}</span>
                        {canPublish && <span className="text-xs text-slate-500 dark:text-slate-400">{memo.recipients_count} recipients</span>}
                        <ArrowRight size={16} className="text-slate-400 dark:text-slate-400" aria-hidden="true" />
                    </div>
                </Link>;
            })}
            {memoranda.length === 0 && <div className="px-5 py-10 text-center text-sm text-slate-500 dark:text-slate-400">No official memoranda are available in this authorized view.</div>}
        </div>
    </PageFrame></AppLayout>;
}
