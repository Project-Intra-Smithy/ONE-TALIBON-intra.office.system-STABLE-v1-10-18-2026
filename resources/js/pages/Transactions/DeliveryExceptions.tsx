import { Link, useForm } from '@inertiajs/react';
import { AlertTriangle, ArrowLeft, CheckCircle2, ShieldCheck } from 'lucide-react';
import { type FormEvent } from 'react';
import PageFrame from '../../components/PageFrame';
import PageHeader from '../../components/PageHeader';
import AppLayout from '../../layouts/AppLayout';

type DeliveryException = {
    id: number;
    transactionId: number;
    eventId: number;
    reference: string;
    reason: string;
    createdAt: string;
    acknowledged: boolean;
    resolved: boolean;
};

function ExceptionCase({ entry }: { entry: DeliveryException }) {
    const nextAction = entry.acknowledged ? 'resolve' : 'acknowledge';
    const form = useForm<{ action: 'acknowledge' | 'resolve'; note: string }>({
        action: nextAction,
        note: '',
    });

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        form.transform((data) => ({ ...data, action: nextAction }));
        form.post('/work-requests/origin-delivery-exceptions/' + entry.id + '/actions', {
            preserveScroll: true,
            onSuccess: () => form.reset('note'),
        });
    };

    const label = entry.resolved ? 'Resolved' : entry.acknowledged ? 'Acknowledged — follow-up required' : 'Needs acknowledgment';

    return (
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900" aria-label={'Delivery gap ' + entry.reference}>
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">
                        <Link className="underline underline-offset-2" href={'/transactions/' + entry.transactionId}>{entry.reference}</Link>
                    </h2>
                    <p className="text-sm text-slate-600 dark:text-slate-300">No eligible origin requester/designee was available at completion. The event and its audit/receipt remain linked.</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Event #{entry.eventId} · {new Date(entry.createdAt).toLocaleString('en-PH')}</p>
                </div>
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900 dark:bg-amber-900/40 dark:text-amber-200">{label}</span>
            </div>

            {!entry.resolved && (
                <form className="mt-5 space-y-3" onSubmit={submit}>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200" htmlFor={'delivery-note-' + entry.id}>
                        {nextAction === 'acknowledge' ? 'Acknowledgment and owner follow-up note' : 'Resolution and notification follow-up evidence'}
                    </label>
                    <textarea
                        id={'delivery-note-' + entry.id}
                        required
                        minLength={1}
                        maxLength={2000}
                        value={form.data.note}
                        onChange={(event) => form.setData('note', event.target.value)}
                        rows={3}
                        className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-900 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                        placeholder="Record the specific action taken. Do not enter private employee details or credentials."
                    />
                    {(form.errors.note || form.errors.action) && <p className="text-sm text-red-700" role="alert">{form.errors.note || form.errors.action}</p>}
                    <button
                        type="submit"
                        disabled={form.processing || !form.data.note.trim()}
                        className="inline-flex items-center gap-2 rounded-xl bg-blue-900 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {nextAction === 'acknowledge' ? <ShieldCheck size={16} aria-hidden="true" /> : <CheckCircle2 size={16} aria-hidden="true" />}
                        {form.processing ? 'Recording…' : nextAction === 'acknowledge' ? 'Acknowledge case' : 'Record resolution'}
                    </button>
                </form>
            )}
        </article>
    );
}

export default function DeliveryExceptions({ exceptions }: { exceptions: DeliveryException[] }) {
    return (
        <AppLayout title="Origin notice exceptions">
            <PageFrame density="comfortable">
                <PageHeader
                    icon={AlertTriangle}
                    eyebrow="Work Requests · restricted origin-office head queue"
                    title="Origin notice exceptions"
                    description="These are traceable delivery gaps, not sent notifications or municipal sign-off. An eligible office Head must acknowledge and document the follow-up. Actions are append-only."
                />
                <Link href="/transactions" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-800 underline underline-offset-2 dark:text-blue-300">
                    <ArrowLeft size={16} aria-hidden="true" /> Back to Work Requests
                </Link>
                {exceptions.length === 0
                    ? <p className="rounded-xl border border-slate-200 p-6 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300">No visible delivery exceptions for your current authorized office.</p>
                    : <div className="space-y-4">{exceptions.map((entry) => <ExceptionCase key={entry.id} entry={entry} />)}</div>}
            </PageFrame>
        </AppLayout>
    );
}
