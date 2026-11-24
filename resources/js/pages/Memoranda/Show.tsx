import { Link, useForm } from '@inertiajs/react';
import { CheckCircle2, FileText, Landmark, MailCheck, Users } from 'lucide-react';
import { useRef, useState } from 'react';
import PageFrame from '../../components/PageFrame';
import PageHeader from '../../components/PageHeader';
import AppLayout from '../../layouts/AppLayout';
import { formatDateTimePH, humanizeSlug } from '../../lib/format';

type Memo = {
    id: number;
    memo_number: string;
    title: string;
    body: string;
    classification: string;
    audience_type: string;
    requires_acknowledgement: boolean;
    published_at: string;
    expires_at?: string | null;
    issuer: { name: string };
    issuing_department: { name: string; short_name?: string | null };
};

type Recipient = {
    viewed_at?: string | null;
    acknowledged_at?: string | null;
} | null;

type Statistics = {
    delivered: number;
    viewed: number;
    acknowledged: number;
    pending: number;
};

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

const audienceLabel = (value: string) => {
    if (value === 'all' || value === 'all_employees') return 'All municipal employees';
    if (value === 'departments' || value === 'selected_departments') return 'Department audience';
    if (value === 'employees' || value === 'selected_employees') return 'Selected employees';
    return humanizeSlug(value);
};

export default function Show({
    memorandum: memo,
    recipient,
    statistics,
}: {
    memorandum: Memo;
    recipient: Recipient;
    canInspectIssuance: boolean;
    statistics: Statistics | null;
}) {
    const acknowledgement = useForm({});
    const acknowledgementInFlight = useRef(false);
    const [acknowledgementError, setAcknowledgementError] = useState<string | null>(null);
    const publication = publicationContext(memo.published_at);
    const issuingOffice = memo.issuing_department.short_name || memo.issuing_department.name;

    const acknowledge = () => {
        if (acknowledgementInFlight.current || acknowledgement.processing) return;

        acknowledgementInFlight.current = true;
        setAcknowledgementError(null);
        acknowledgement.post('/memoranda/' + memo.id + '/acknowledge', {
            preserveScroll: true,
            onError: (errors) => {
                const message = Object.values(errors).find((value): value is string => typeof value === 'string');
                setAcknowledgementError(message ?? 'Unable to record acknowledgement.');
            },
            onFinish: () => {
                acknowledgementInFlight.current = false;
            },
        });
    };

    return (
        <AppLayout title={memo.memo_number}>
            <PageFrame width="standard" density="compact" className="civic-page">
                <PageHeader
                    eyebrow={memo.memo_number}
                    title={memo.title}
                    description={issuingOffice + ' · Issued by ' + memo.issuer.name + ' · ' + publication.exact}
                    icon={FileText}
                />

                <section className="municipal-panel overflow-hidden">
                    <header className="flex flex-wrap items-center gap-1.5 border-b border-[var(--municipal-border)] bg-[var(--municipal-surface-subtle)] px-3 py-2">
                        <span className="rounded-full border border-[var(--border-default)] bg-[var(--surface-card)] px-2.5 py-1 text-xs font-bold uppercase text-[var(--ink-primary)]">{humanizeSlug(memo.classification)}</span>
                        <span className="rounded-full border border-[var(--status-ok-border)] bg-[var(--status-ok-bg)] px-2.5 py-1 text-xs font-bold text-[var(--status-ok-fg)]">{audienceLabel(memo.audience_type)}</span>
                        {memo.requires_acknowledgement ? (
                            <span className="rounded-full border border-[var(--status-warn-border)] bg-[var(--status-warn-bg)] px-2.5 py-1 text-xs font-bold text-[var(--status-warn-fg)]">Acknowledgement required</span>
                        ) : (
                            <span className="rounded-full border border-[var(--border-default)] bg-[var(--surface-card)] px-2.5 py-1 text-xs font-bold text-[var(--ink-secondary)]">No acknowledgement required</span>
                        )}
                        <span className="ml-auto text-xs text-[var(--ink-secondary)]">{publication.relative}</span>
                    </header>

                    <article className="px-4 py-4 sm:px-5">
                        <div className="whitespace-pre-wrap text-sm leading-6 text-[var(--ink-primary)]">{memo.body}</div>
                    </article>

                    {recipient && memo.requires_acknowledgement ? (
                        <div className="border-t border-[var(--municipal-border)] px-4 py-3 sm:px-5">
                            {recipient.acknowledged_at ? (
                                <div className="inline-flex items-center gap-2 rounded-md border border-[var(--status-ok-border)] bg-[var(--status-ok-bg)] px-3 py-2 text-xs font-semibold text-[var(--status-ok-fg)]">
                                    <CheckCircle2 size={15} aria-hidden="true" />
                                    Acknowledged {formatDateTimePH(recipient.acknowledged_at)}
                                </div>
                            ) : (
                                <div className="flex flex-wrap items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={acknowledge}
                                        disabled={acknowledgement.processing}
                                        className="municipal-primary-button"
                                    >
                                        {acknowledgement.processing ? 'Acknowledging...' : 'Acknowledge Memorandum'}
                                    </button>
                                    <span className="text-xs text-[var(--ink-secondary)]">Records your acknowledgement against this formal issuance.</span>
                                    {acknowledgementError ? <p role="alert" className="w-full text-xs text-[var(--status-danger-fg)]">{acknowledgementError}</p> : null}
                                </div>
                            )}
                        </div>
                    ) : null}
                </section>

                {statistics ? (
                    <section aria-labelledby="delivery-statistics">
                        <div className="mb-1 flex items-center justify-between gap-3">
                            <h2 id="delivery-statistics" className="text-xs font-bold uppercase tracking-wide text-[var(--municipal-muted)]">Delivery</h2>
                            <span className="text-xs text-[var(--municipal-muted)]">Issuing-office telemetry</span>
                        </div>
                        <div className="grid gap-1.5 sm:grid-cols-2 xl:grid-cols-4">
                            <div className="rounded-lg border border-[#cfe0f6] bg-[#eef5ff] p-2.5 text-[#265fa8]">
                                <MailCheck size={15} aria-hidden="true" />
                                <div className="mt-1 text-lg font-bold">{statistics.delivered}</div>
                                <div className="text-xs font-bold uppercase">Delivered</div>
                            </div>
                            <div className="rounded-lg border border-[#ddd2f3] bg-[#f5f0ff] p-2.5 text-[#7150a8]">
                                <Users size={15} aria-hidden="true" />
                                <div className="mt-1 text-lg font-bold">{statistics.viewed}</div>
                                <div className="text-xs font-bold uppercase">Viewed</div>
                            </div>
                            <div className="rounded-lg border border-[#cfe6d5] bg-[#eef8f1] p-2.5 text-[#17633f]">
                                <CheckCircle2 size={15} aria-hidden="true" />
                                <div className="mt-1 text-lg font-bold">{statistics.acknowledged}</div>
                                <div className="text-xs font-bold uppercase">Acknowledged</div>
                            </div>
                            <div className="rounded-lg border border-[#f0dfb4] bg-[#fff8e8] p-2.5 text-[#9a6a08]">
                                <Landmark size={15} aria-hidden="true" />
                                <div className="mt-1 text-lg font-bold">{statistics.pending}</div>
                                <div className="text-xs font-bold uppercase">Pending</div>
                            </div>
                        </div>
                    </section>
                ) : null}

                <div>
                    <Link href="/memoranda" className="inline-flex min-h-9 items-center text-xs font-bold text-[var(--municipal-brand)]">← Back to Official Memoranda</Link>
                </div>
            </PageFrame>
        </AppLayout>
    );
}
