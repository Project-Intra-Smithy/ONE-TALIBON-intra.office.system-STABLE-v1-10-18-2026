import { Link } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowRight,
    CheckCircle2,
    Clock3,
    Inbox,
    Route,
    UserRound,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type RecordOffice = { id: number; code: string; name: string; shortName?: string | null };
type Assignee = { id: number; employeeNumber: string; name?: string | null; position: string };
export type CorrespondencePreview = {
    publicId: string;
    reference: string;
    sender: { name: string; organization?: string | null; source: string; channel?: string | null };
    subject: string;
    classification?: string | null;
    lifecycleState: string;
    currentOffice?: RecordOffice | null;
    assignedEmployee?: Assignee | null;
    workflowReference?: string | null;
    receivedAt?: string | null;
    routedAt?: string | null;
    age: string;
    actionRequired: boolean;
    overdue: boolean;
};

export type CorrespondenceOverviewData = {
    counts: {
        all: number;
        received: number;
        needs_action: number;
        assigned_to_me: number;
        routed: number;
        archived: number;
        overdue: number;
    };
    previews: {
        needs_action: CorrespondencePreview[];
        received: CorrespondencePreview[];
        routed: CorrespondencePreview[];
        archived: CorrespondencePreview[];
    };
};

type Card = {
    key: 'received' | 'needs_action' | 'assigned_to_me' | 'routed' | 'archived' | 'overdue';
    label: string;
    detail: string;
    icon: LucideIcon;
    tone: string;
};

const cards: Card[] = [
    { key: 'received', label: 'New Intake', detail: 'Newly received correspondence', icon: Inbox, tone: 'border-[#cfe6d5] bg-[#eef8f1] text-[#17633f]' },
    { key: 'needs_action', label: 'Needs Action', detail: 'Requires current action', icon: AlertTriangle, tone: 'border-[#f0dfb4] bg-[#fff8e8] text-[#9a6a08]' },
    { key: 'assigned_to_me', label: 'Assigned to Me', detail: 'Personally assigned work', icon: UserRound, tone: 'border-[#cfe0f6] bg-[#eef5ff] text-[#265fa8]' },
    { key: 'routed', label: 'Routed', detail: 'Active routed correspondence', icon: Route, tone: 'border-[#ddd2f3] bg-[#f5f0ff] text-[#7150a8]' },
    { key: 'archived', label: 'Completed / Filed', detail: 'Archived correspondence', icon: CheckCircle2, tone: 'border-[#d9dfdc] bg-[#f5f7f6] text-[#53635b]' },
    { key: 'overdue', label: 'Overdue', detail: 'Past workflow deadline', icon: Clock3, tone: 'border-[#edc9cd] bg-[#fff0f1] text-[#b23b45]' },
];

const humanize = (value: string) => value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

function PreviewPanel({ title, subtitle, view, items, onSelect }: {
    title: string;
    subtitle: string;
    view: string;
    items: CorrespondencePreview[];
    onSelect: (view: string) => void;
}) {
    return (
        <section className="municipal-panel min-w-0 overflow-hidden">
            <header className="flex min-h-9 items-center justify-between gap-2 border-b border-[var(--municipal-border)] px-2.5 py-1.5">
                <div className="min-w-0">
                    <h2 className="text-xs font-bold leading-4 text-[var(--municipal-text)]">{title}</h2>
                    <p className="truncate text-[9px] leading-3.5 text-[var(--municipal-muted)]">{subtitle}</p>
                </div>
                <button type="button" onClick={() => onSelect(view)} className="shrink-0 text-[10px] font-bold text-[var(--municipal-brand)]">View all</button>
            </header>
            <div className="divide-y divide-[var(--municipal-border)]">
                {items.map((item) => (
                    <Link
                        key={item.publicId}
                        href={`/correspondence/${item.publicId}/workspace`}
                        className="flex min-h-10 items-center gap-2 px-2.5 py-1.5 hover:bg-[var(--municipal-hover)]"
                    >
                        <Inbox size={14} className="shrink-0 text-[var(--municipal-brand)]" aria-hidden="true" />
                        <div className="min-w-0 flex-1">
                            <div className="truncate text-[11px] font-semibold leading-4 text-[var(--municipal-text)]">{item.subject}</div>
                            <div className="truncate text-[9px] leading-3.5 text-[var(--municipal-muted)]">
                                {item.reference} · {humanize(item.lifecycleState)}
                                {item.currentOffice ? ` · ${item.currentOffice.shortName || item.currentOffice.name}` : ''}
                            </div>
                        </div>
                        <ArrowRight size={12} className="shrink-0 text-[var(--municipal-muted)]" aria-hidden="true" />
                    </Link>
                ))}
                {!items.length ? <p className="px-2.5 py-3 text-[10px] text-[var(--municipal-muted)]">Nothing in this view right now.</p> : null}
            </div>
        </section>
    );
}

export default function CorrespondenceOverview({ overview, onSelect }: {
    overview: CorrespondenceOverviewData;
    onSelect: (view: string) => void;
}) {
    return (
        <div className="space-y-2.5">
            <section aria-labelledby="correspondence-glance">
                <div className="mb-1 flex items-center justify-between gap-3">
                    <h2 id="correspondence-glance" className="text-[10px] font-bold uppercase tracking-wide text-[var(--municipal-muted)]">At a glance</h2>
                    <span className="text-[9px] text-[var(--municipal-muted)]">{overview.counts.all} authorized correspondence record{overview.counts.all === 1 ? '' : 's'}</span>
                </div>
                <div className="grid gap-1.5 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
                    {cards.map((card) => {
                        const Icon = card.icon;
                        return (
                            <button
                                key={card.key}
                                type="button"
                                onClick={() => onSelect(card.key)}
                                className={`min-h-[74px] rounded-lg border p-2.5 text-left transition hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--municipal-focus)] ${card.tone}`}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <Icon size={16} aria-hidden="true" />
                                    <strong className="text-lg leading-none">{overview.counts[card.key]}</strong>
                                </div>
                                <div className="mt-1.5 truncate text-[11px] font-bold leading-4">{card.label}</div>
                                <div className="truncate text-[9px] leading-3.5 opacity-80">{card.detail}</div>
                            </button>
                        );
                    })}
                </div>
            </section>

            <section className="grid min-w-0 gap-2 lg:grid-cols-2" aria-label="Correspondence overview">
                <PreviewPanel title="Needs Action" subtitle="Correspondence requiring current action" view="needs_action" items={overview.previews.needs_action} onSelect={onSelect} />
                <PreviewPanel title="Recently Received" subtitle="Newest authorized correspondence intake" view="received" items={overview.previews.received} onSelect={onSelect} />
                <PreviewPanel title="Recently Routed" subtitle="Correspondence already routed into workflow" view="routed" items={overview.previews.routed} onSelect={onSelect} />
                <PreviewPanel title="Completed / Filed" subtitle="Recently archived correspondence" view="archived" items={overview.previews.archived} onSelect={onSelect} />
            </section>
        </div>
    );
}
