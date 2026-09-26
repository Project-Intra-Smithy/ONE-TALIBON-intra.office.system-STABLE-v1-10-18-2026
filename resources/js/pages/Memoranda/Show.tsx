import { Link, useForm } from '@inertiajs/react';
import { CheckCircle2 } from 'lucide-react';
import { useRef, useState } from 'react';
import AppLayout from '../../layouts/AppLayout';

type Memo = { id: number; memo_number: string; title: string; body: string; classification: string; requires_acknowledgement: boolean; published_at: string; issuer: { name: string }; issuing_department: { name: string; short_name?: string } };
type Recipient = { viewed_at?: string | null; acknowledged_at?: string | null } | null;

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

export default function Show({ memorandum: memo, recipient, statistics }: { memorandum: Memo; recipient: Recipient; statistics: null | { delivered: number; viewed: number; acknowledged: number } }) {
    const acknowledgement = useForm({});
    const acknowledgementInFlight = useRef(false);
    const [acknowledgementError, setAcknowledgementError] = useState<string | null>(null);
    const publication = publicationContext(memo.published_at);

    const acknowledge = () => {
        if (acknowledgementInFlight.current || acknowledgement.processing) {
            return;
        }

        acknowledgementInFlight.current = true;
        setAcknowledgementError(null);
        acknowledgement.post('/memoranda/' + memo.id + '/acknowledge', {
            preserveScroll: true,
            onSuccess: () => setAcknowledgementError(null),
            onError: (errors) => {
                const message = Object.values(errors).find((value): value is string => typeof value === 'string');
                setAcknowledgementError(message ?? 'Unable to record acknowledgement. Please try again.');
            },
            onFinish: () => {
                acknowledgementInFlight.current = false;
            },
        });
    };

    return <AppLayout title={memo.memo_number}><div className="mx-auto max-w-4xl space-y-3">
        <Link href="/memoranda" className="text-sm font-semibold text-blue-700 dark:text-blue-300">← Back to Official Memoranda</Link>

        <article className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-[#142236]">
            <header className="border-b border-slate-100 px-4 py-4 sm:px-5 dark:border-slate-700">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                        <div className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700 dark:text-blue-300">{memo.memo_number}</div>
                        <h1 className="mt-1.5 text-2xl font-bold leading-tight text-slate-950 dark:text-slate-100">{memo.title}</h1>
                        <div className="mt-2 flex flex-wrap gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                            <span>Issued by {memo.issuing_department.short_name || memo.issuing_department.name}</span>
                            <span aria-hidden="true">·</span>
                            <time dateTime={memo.published_at} title={publication.exact} className="font-semibold text-slate-700 dark:text-slate-300">{publication.relative}</time>
                            <span aria-hidden="true">·</span>
                            <span>{publication.exact}</span>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-bold uppercase text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">{memo.classification}</span>
                        <span className={memo.requires_acknowledgement ? 'rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[10px] font-bold uppercase text-blue-800 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-200' : 'rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-semibold uppercase text-slate-500 dark:border-slate-700 dark:bg-[#142236] dark:text-slate-400'}>{memo.requires_acknowledgement ? 'Acknowledgement required' : 'No acknowledgement required'}</span>
                    </div>
                </div>
            </header>

            <div className="whitespace-pre-wrap px-4 py-5 text-[15px] leading-7 text-slate-700 sm:px-5 dark:text-slate-300">{memo.body}</div>

            {recipient && memo.requires_acknowledgement && <div className="border-t border-slate-100 px-4 py-4 sm:px-5 dark:border-slate-700">
                {recipient.acknowledged_at
                    ? <div className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm font-semibold text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200"><CheckCircle2 size={18} aria-hidden="true" /> Acknowledged {new Date(recipient.acknowledged_at).toLocaleString('en-PH', { timeZone: 'Asia/Manila' })}</div>
                    : <div><button type="button" onClick={acknowledge} disabled={acknowledgement.processing} aria-busy={acknowledgement.processing} className="min-h-10 rounded-lg bg-[#0b2852] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">{acknowledgement.processing ? 'Acknowledging…' : 'I acknowledge receipt'}</button>{acknowledgementError && <p role="alert" className="mt-2 text-sm text-red-600 dark:text-red-300">{acknowledgementError}</p>}</div>}
            </div>}
        </article>

        {statistics && <section className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-[#142236]" aria-label="Memorandum delivery statistics">
            <div className="flex items-baseline gap-1.5"><span className="text-lg font-bold text-slate-950 dark:text-slate-100">{statistics.delivered}</span><span className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Delivered</span></div>
            <div className="flex items-baseline gap-1.5"><span className="text-lg font-bold text-slate-950 dark:text-slate-100">{statistics.viewed}</span><span className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Viewed</span></div>
            <div className="flex items-baseline gap-1.5"><span className="text-lg font-bold text-slate-950 dark:text-slate-100">{statistics.acknowledged}</span><span className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Acknowledged</span></div>
        </section>}
    </div></AppLayout>;
}
