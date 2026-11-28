import { Link } from '@inertiajs/react';
import { ArrowLeft, CalendarDays, FileText, Gavel, Hash, Landmark, Tags } from 'lucide-react';
import LegislativeRecordStatus from '../../components/legislative/LegislativeRecordStatus';
import PageFrame from '../../components/PageFrame';
import AppLayout from '../../layouts/AppLayout';
import { formatDatePH } from '../../lib/format';

type RecordItem = {
    record_type: string;
    record_number: string;
    title: string;
    summary?: string | null;
    approved_at?: string | null;
    year?: number | null;
    status: string;
    issuing_body: string;
    keywords?: string | string[] | null;
    creator: { name: string };
};

const prototypeCopyPattern = /\b(?:synthetic|prototype|demo(?:nstrat\w*)?)\b/i;

export default function Show({ record }: { record: RecordItem; canManage: boolean }) {
    const presentationSummary = record.summary && !prototypeCopyPattern.test(record.summary)
        ? record.summary
        : null;

    const approvedLabel = record.approved_at ? formatDatePH(record.approved_at) : 'Not specified';

    const recordType = record.record_type.replaceAll('_', ' ');
    const displayYear = record.year ?? (record.approved_at ? new Date(record.approved_at).getFullYear() : null);
    const displayKeywords = Array.isArray(record.keywords) ? record.keywords.join(', ') : record.keywords;

    return (
        <AppLayout title={record.record_number}>
            <PageFrame density="compact">
                <Link
                    href="/legislation"
                    className="inline-flex min-h-8 items-center gap-1.5 rounded-md px-1 text-xs font-semibold text-[var(--brand-ink)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--municipal-focus)]/30"
                >
                    <ArrowLeft size={14} aria-hidden="true" />
                    Back to Ordinances & Issuances
                </Link>

                <article className="municipal-panel overflow-hidden">
                    <header className="border-b border-[var(--municipal-border)] px-4 py-4 sm:px-5">
                        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[var(--brand-ink)]">
                            <Gavel size={13} aria-hidden="true" />
                            Controlled municipal issuance
                        </div>

                        <h1 className="mt-1.5 max-w-5xl text-2xl font-bold leading-tight tracking-tight text-[var(--municipal-text)] sm:text-[28px]">
                            {record.title}
                        </h1>

                        <div className="mt-3 flex flex-wrap items-center gap-2">
                            <LegislativeRecordStatus status={record.status} />
                            <span className="rounded-md border border-[var(--municipal-border)] bg-[var(--municipal-brand-soft)] px-2 py-1 text-xs font-bold uppercase tracking-wide text-[var(--brand-ink)]">
                                {recordType}
                            </span>
                            {displayYear ? (
                                <span className="rounded-md border border-[var(--municipal-border)] bg-[var(--municipal-surface-subtle)] px-2 py-1 text-xs font-bold text-[var(--municipal-muted)]">
                                    {displayYear}
                                </span>
                            ) : null}
                        </div>
                    </header>

                    <section className="grid border-b border-[var(--municipal-border)] sm:grid-cols-3" aria-label="Issuance metadata">
                        <div className="min-w-0 border-b border-[var(--municipal-border)] px-4 py-3 sm:border-b-0 sm:border-r sm:px-5">
                            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.08em] text-[var(--municipal-muted)]">
                                <Hash size={12} aria-hidden="true" />
                                Record no.
                            </div>
                            <div className="mt-1 text-sm font-semibold text-[var(--municipal-text)]">{record.record_number}</div>
                        </div>

                        <div className="min-w-0 border-b border-[var(--municipal-border)] px-4 py-3 sm:border-b-0 sm:border-r sm:px-5">
                            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.08em] text-[var(--municipal-muted)]">
                                <Landmark size={12} aria-hidden="true" />
                                Issuing body
                            </div>
                            <div className="mt-1 text-sm font-semibold text-[var(--municipal-text)]">{record.issuing_body}</div>
                        </div>

                        <div className="min-w-0 px-4 py-3 sm:px-5">
                            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.08em] text-[var(--municipal-muted)]">
                                <CalendarDays size={12} aria-hidden="true" />
                                Approved
                            </div>
                            <div className="mt-1 text-sm font-semibold text-[var(--municipal-text)]">{approvedLabel}</div>
                        </div>
                    </section>

                    {presentationSummary ? (
                        <section className="border-b border-[var(--municipal-border)] px-4 py-4 sm:px-5">
                            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.08em] text-[var(--municipal-muted)]">
                                <FileText size={12} aria-hidden="true" />
                                Summary
                            </div>
                            <p className="mt-2 max-w-5xl whitespace-pre-wrap text-sm leading-6 text-[var(--municipal-text)]">
                                {presentationSummary}
                            </p>
                        </section>
                    ) : null}

                    {displayKeywords ? (
                        <section className="flex min-w-0 flex-col gap-1.5 bg-[var(--municipal-surface-subtle)] px-4 py-3 text-xs text-[var(--municipal-muted)] sm:flex-row sm:items-start sm:px-5">
                            <div className="flex shrink-0 items-center gap-1.5 font-bold text-[var(--municipal-text)]">
                                <Tags size={12} aria-hidden="true" />
                                Keywords
                            </div>
                            <div className="min-w-0 break-words">{displayKeywords}</div>
                        </section>
                    ) : null}
                </article>
            </PageFrame>
        </AppLayout>
    );
}
