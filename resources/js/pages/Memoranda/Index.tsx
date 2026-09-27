import { Link, router } from '@inertiajs/react';
import {
    ArrowRight,
    CheckCircle2,
    Eye,
    FileText,
    Inbox,
    Landmark,
    MailCheck,
    Plus,
    Send,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import PageFrame from '../../components/PageFrame';
import PageHeader from '../../components/PageHeader';
import AppLayout from '../../layouts/AppLayout';

type RecipientState = {
    delivered_at?: string | null;
    viewed_at?: string | null;
    acknowledged_at?: string | null;
};

type Memo = {
    id: number;
    memo_number: string;
    title: string;
    classification: string;
    audience_type: string;
    requires_acknowledgement: boolean;
    published_at: string;
    expires_at?: string | null;
    recipients_count: number;
    issuer?: { name: string } | null;
    issuing_department?: { id: number; code: string; name: string; short_name?: string | null } | null;
    recipients?: RecipientState[];
};

type Authority = {
    canPublish: boolean;
    scope: 'recipient' | 'department' | 'municipal';
    issuingOffice?: { id: number; code: string; name: string; shortName?: string | null } | null;
    allowedAudienceTypes: string[];
    municipalityWide: boolean;
    memoPrefix?: string | null;
    authorityLabel: string;
};

type Overview = {
    counts: {
        for_me: number;
        needs_acknowledgement: number;
        unread: number;
        acknowledged: number;
        office_issuances: number;
        municipality_wide: number;
    };
};

type Card = {
    key: string;
    label: string;
    detail: string;
    icon: LucideIcon;
    tone: string;
    publisherOnly?: boolean;
    municipalOnly?: boolean;
};

const cards: Card[] = [
    { key: 'for_me', label: 'For Me', detail: 'Memoranda delivered to you', icon: Inbox, tone: 'border-[#cfe6d5] bg-[#eef8f1] text-[#17633f]' },
    { key: 'needs_acknowledgement', label: 'Needs Acknowledgement', detail: 'Awaiting your acknowledgement', icon: MailCheck, tone: 'border-[#f0dfb4] bg-[#fff8e8] text-[#9a6a08]' },
    { key: 'unread', label: 'Unread', detail: 'Not yet opened', icon: Eye, tone: 'border-[#cfe0f6] bg-[#eef5ff] text-[#265fa8]' },
    { key: 'acknowledged', label: 'Acknowledged', detail: 'Acknowledgement recorded', icon: CheckCircle2, tone: 'border-[#d9dfdc] bg-[#f5f7f6] text-[#53635b]' },
    { key: 'office_issuances', label: 'Office Issuances', detail: 'Published by your issuing office', icon: Send, tone: 'border-[#ddd2f3] bg-[#f5f0ff] text-[#7150a8]', publisherOnly: true },
    { key: 'municipality_wide', label: 'Municipality-wide', detail: "Mayor's Office issuances to all", icon: Landmark, tone: 'border-[#cae2d8] bg-[#edf7f3] text-[#1f6b50]', municipalOnly: true },
];

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

const viewLabels: Record<string, string> = {
    for_me: 'For Me',
    needs_acknowledgement: 'Needs Acknowledgement',
    unread: 'Unread',
    acknowledged: 'Acknowledged',
    office_issuances: 'Office Issuances',
    municipality_wide: 'Municipality-wide',
};

function MemoRows({ memoranda, authority }: { memoranda: Memo[]; authority: Authority }) {
    return (
        <div className="divide-y divide-[var(--municipal-border)]">
            {memoranda.map((memo) => {
                const publication = publicationContext(memo.published_at);
                const recipient = memo.recipients?.[0] ?? null;
                const needsAck = memo.requires_acknowledgement && recipient && !recipient.acknowledged_at;

                return (
                    <Link
                        key={memo.id}
                        href={'/memoranda/' + memo.id}
                        className="grid min-w-0 gap-2 px-3 py-2.5 transition hover:bg-[var(--municipal-hover)] lg:grid-cols-[minmax(0,1.6fr)_minmax(150px,.7fr)_minmax(160px,.8fr)_80px] lg:items-center"
                    >
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                                <span className="text-[10px] font-bold uppercase tracking-wide text-[var(--municipal-brand)]">{memo.memo_number}</span>
                                <span className="text-[9px] font-bold uppercase tracking-wide text-[var(--municipal-muted)]">{memo.classification}</span>
                            </div>
                            <div className="mt-0.5 truncate text-[11px] font-semibold leading-4 text-[var(--municipal-text)]">{memo.title}</div>
                            <div className="mt-0.5 truncate text-[9px] text-[var(--municipal-muted)]">
                                {memo.issuing_department?.short_name || memo.issuing_department?.name || 'Issuing office'}
                                {memo.issuer?.name ? ' · ' + memo.issuer.name : ''}
                            </div>
                        </div>

                        <div className="min-w-0">
                            <div className="text-[10px] font-semibold text-[var(--municipal-text)]">{publication.relative}</div>
                            <div className="truncate text-[9px] text-[var(--municipal-muted)]">{publication.exact}</div>
                        </div>

                        <div className="flex flex-wrap items-center gap-1">
                            {needsAck ? <span className="rounded-full bg-[#fff8e8] px-2 py-1 text-[9px] font-bold uppercase text-[#9a6a08]">Acknowledgement required</span> : null}
                            {recipient?.acknowledged_at ? <span className="rounded-full bg-[#eef8f1] px-2 py-1 text-[9px] font-bold uppercase text-[#17633f]">Acknowledged</span> : null}
                            {!recipient && authority.canPublish ? <span className="rounded-full bg-[#f5f0ff] px-2 py-1 text-[9px] font-bold uppercase text-[#7150a8]">{memo.recipients_count} recipients</span> : null}
                            {!needsAck && !recipient?.acknowledged_at && recipient ? <span className="rounded-full bg-[var(--municipal-surface-subtle)] px-2 py-1 text-[9px] font-bold uppercase text-[var(--municipal-muted)]">Delivered</span> : null}
                        </div>

                        <div className="inline-flex min-h-9 items-center justify-end gap-1 text-[10px] font-bold text-[var(--municipal-brand)]">
                            Open <ArrowRight size={12} aria-hidden="true" />
                        </div>
                    </Link>
                );
            })}

            {!memoranda.length ? (
                <div className="px-5 py-8 text-center">
                    <FileText className="mx-auto text-[var(--municipal-muted)]" size={24} aria-hidden="true" />
                    <div className="mt-2 text-xs font-bold text-[var(--municipal-text)]">No memoranda in this view.</div>
                    <div className="mt-1 text-[10px] text-[var(--municipal-muted)]">Published memoranda appear here when they are delivered or issued within your authority.</div>
                </div>
            ) : null}
        </div>
    );
}

export default function Index({ memoranda, authority, overview, view }: { memoranda: Memo[]; authority: Authority; overview: Overview; view: string }) {
    const visibleCards = cards.filter((card) => {
        if (card.publisherOnly && !authority.canPublish) return false;
        if (card.municipalOnly && !authority.municipalityWide) return false;
        return true;
    });

    const openView = (nextView: string) => router.get('/memoranda', { view: nextView }, {
        preserveState: true,
        preserveScroll: true,
        replace: true,
    });

    return (
        <AppLayout title="Official Memoranda">
            <PageFrame width="standard" density="compact">
                <PageHeader
                    eyebrow="Formal internal issuance"
                    title="Official Memoranda"
                    icon={FileText}
                    description="Formal numbered internal issuances with defined recipients and acknowledgement tracking."
                    aside={authority.canPublish ? (
                        <Link href="/memoranda/create" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-[var(--municipal-brand-deep)] px-3 text-xs font-bold text-white">
                            <Plus size={15} aria-hidden="true" /> New Memorandum
                        </Link>
                    ) : null}
                />

                {view === 'overview' ? (
                    <div className="space-y-2.5">
                        <section aria-labelledby="memoranda-glance">
                            <div className="mb-1 flex items-center justify-between gap-3">
                                <h2 id="memoranda-glance" className="text-[10px] font-bold uppercase tracking-wide text-[var(--municipal-muted)]">At a glance</h2>
                                {authority.canPublish && authority.issuingOffice ? (
                                    <span className="text-[9px] text-[var(--municipal-muted)]">{authority.authorityLabel} · {authority.issuingOffice.shortName || authority.issuingOffice.name}</span>
                                ) : null}
                            </div>

                            <div className={`grid gap-1.5 sm:grid-cols-2 ${visibleCards.length >= 5 ? 'xl:grid-cols-5' : 'xl:grid-cols-4'}`}>
                                {visibleCards.map((card) => {
                                    const Icon = card.icon;
                                    const count = overview.counts[card.key as keyof Overview['counts']] ?? 0;
                                    return (
                                        <button
                                            key={card.key}
                                            type="button"
                                            onClick={() => openView(card.key)}
                                            className={`min-h-[76px] rounded-lg border p-2.5 text-left transition hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--municipal-focus)] ${card.tone}`}
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <Icon size={16} aria-hidden="true" />
                                                <strong className="text-lg leading-none">{count}</strong>
                                            </div>
                                            <div className="mt-1.5 truncate text-[11px] font-bold leading-4">{card.label}</div>
                                            <div className="truncate text-[9px] leading-3.5 opacity-80">{card.detail}</div>
                                        </button>
                                    );
                                })}
                            </div>
                        </section>

                        <section className="municipal-panel overflow-hidden" aria-label="Recent memoranda">
                            <header className="flex min-h-10 items-center justify-between gap-3 border-b border-[var(--municipal-border)] bg-[var(--municipal-surface-subtle)] px-3 py-2">
                                <div>
                                    <h2 className="text-xs font-bold text-[var(--municipal-text)]">Recent Memoranda</h2>
                                    <p className="text-[9px] text-[var(--municipal-muted)]">Latest formal issuances visible to your account</p>
                                </div>
                                <button type="button" onClick={() => openView('for_me')} className="text-[10px] font-bold text-[var(--municipal-brand)]">View mine</button>
                            </header>
                            <MemoRows memoranda={memoranda} authority={authority} />
                        </section>
                    </div>
                ) : (
                    <div className="space-y-2.5">
                        <nav className="municipal-panel flex min-w-0 flex-wrap items-center gap-2 px-2.5 py-1.5" aria-label="Memoranda navigation">
                            <button type="button" onClick={() => openView('overview')} className="inline-flex min-h-9 items-center gap-1 rounded-md px-2 text-[11px] font-bold text-[var(--municipal-brand)] hover:bg-[var(--municipal-hover)]">
                                ← Overview
                            </button>
                            <span className="text-[10px] text-[var(--municipal-border-strong)]">/</span>
                            <span className="text-[11px] font-semibold text-[var(--municipal-text)]">{viewLabels[view] || 'Memoranda'}</span>
                            <span className="ml-auto text-[10px] text-[var(--municipal-muted)]"><strong className="text-[var(--municipal-text)]">{memoranda.length}</strong> shown</span>
                        </nav>

                        <section className="municipal-panel overflow-hidden" aria-label={viewLabels[view] || 'Memoranda'}>
                            <header className="border-b border-[var(--municipal-border)] bg-[var(--municipal-surface-subtle)] px-3 py-2">
                                <h2 className="text-xs font-bold text-[var(--municipal-text)]">{viewLabels[view] || 'Memoranda'}</h2>
                                <p className="text-[9px] text-[var(--municipal-muted)]">Formal issuances matching this authorized view</p>
                            </header>
                            <MemoRows memoranda={memoranda} authority={authority} />
                        </section>
                    </div>
                )}
            </PageFrame>
        </AppLayout>
    );
}
