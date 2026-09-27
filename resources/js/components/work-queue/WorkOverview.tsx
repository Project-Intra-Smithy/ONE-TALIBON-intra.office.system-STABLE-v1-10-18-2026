import { Link } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowRight,
    CheckCircle2,
    CircleUserRound,
    Clock3,
    Inbox,
    Send,
    TimerReset,
    UserCheck,
    UsersRound,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ScopeGroup, WorkItem, WorkOverview as OverviewData } from './types';
import { humanizeWorkValue } from './presentation';

type Props = {
    profile: string;
    groups: ScopeGroup[];
    overview: OverviewData;
    onSelect: (view: string) => void;
};

type CardDefinition = {
    key: string;
    label: string;
    detail: string;
    icon: LucideIcon;
    tone: string;
};

const toneClasses: Record<string, string> = {
    green: 'border-[#cfe6d5] bg-[#eef8f1] text-[#17633f]',
    blue: 'border-[#cfe0f6] bg-[#eef5ff] text-[#265fa8]',
    amber: 'border-[#f0dfb4] bg-[#fff8e8] text-[#9a6a08]',
    red: 'border-[#edc9cd] bg-[#fff0f1] text-[#b23b45]',
    violet: 'border-[#ddd2f3] bg-[#f5f0ff] text-[#7150a8]',
    cyan: 'border-[#cce7e5] bg-[#eef9f8] text-[#247874]',
    slate: 'border-[#d9dfdc] bg-[#f5f7f6] text-[#53635b]',
    teal: 'border-[#cae2d8] bg-[#edf7f3] text-[#1f6b50]',
};

const personalCards: CardDefinition[] = [
    { key: 'needs_my_action', label: 'Needs My Action', detail: 'Work waiting for you', icon: UserCheck, tone: 'green' },
    { key: 'assigned_to_me', label: 'Assigned to Me', detail: 'All active assignments', icon: CircleUserRound, tone: 'blue' },
    { key: 'due_soon', label: 'Due Soon', detail: 'Approaching deadline', icon: Clock3, tone: 'amber' },
    { key: 'overdue', label: 'Overdue', detail: 'Past deadline', icon: AlertTriangle, tone: 'red' },
    { key: 'my_requests', label: 'My Requests', detail: 'Work you initiated', icon: Send, tone: 'violet' },
    { key: 'waiting_on_others', label: 'Waiting on Others', detail: 'Your requests outside your office', icon: TimerReset, tone: 'cyan' },
    { key: 'recently_completed', label: 'Completed', detail: 'Recently completed work', icon: CheckCircle2, tone: 'slate' },
];

const officeCards: CardDefinition[] = [
    { key: 'office_queue', label: 'Incoming Office Work', detail: 'Work currently routed here', icon: Inbox, tone: 'teal' },
    { key: 'unassigned', label: 'Unassigned', detail: 'Office work without an owner', icon: UsersRound, tone: 'amber' },
    { key: 'staff_workload', label: 'Staff Workload', detail: 'Distribution across staff', icon: UsersRound, tone: 'blue' },
    { key: 'escalations', label: 'Escalations', detail: 'Urgent or overdue office work', icon: AlertTriangle, tone: 'red' },
];

const executiveCards: CardDefinition[] = [
    { key: 'needs_my_action', label: 'For Approval', detail: 'Executive decisions required', icon: UserCheck, tone: 'green' },
    { key: 'due_soon', label: 'Due Soon', detail: 'Municipal work nearing deadline', icon: Clock3, tone: 'amber' },
    { key: 'overdue', label: 'Overdue', detail: 'Municipal work past deadline', icon: AlertTriangle, tone: 'red' },
    { key: 'recently_updated', label: 'Recently Updated', detail: 'Recent municipal movement', icon: TimerReset, tone: 'blue' },
    { key: 'recently_completed', label: 'Completed Decisions', detail: 'Recently completed work', icon: CheckCircle2, tone: 'slate' },
];

const systemCards: CardDefinition[] = [
    { key: 'all', label: 'Active Work', detail: 'Authorized active workflow', icon: Inbox, tone: 'teal' },
    { key: 'overdue', label: 'Overdue', detail: 'Items past deadline', icon: AlertTriangle, tone: 'red' },
    { key: 'recently_updated', label: 'Recently Updated', detail: 'Recent workflow activity', icon: TimerReset, tone: 'blue' },
    { key: 'recently_completed', label: 'Completed Recently', detail: 'Recent terminal records', icon: CheckCircle2, tone: 'slate' },
];

function countMap(groups: ScopeGroup[]) {
    return new Map(groups.flatMap((group) => group.views).map((view) => [view.key, view.count]));
}

function PreviewPanel({ title, subtitle, view, items, onSelect, mode }: {
    title: string;
    subtitle: string;
    view: string;
    items: WorkItem[];
    onSelect: (view: string) => void;
    mode: 'action' | 'tracking' | 'office';
}) {
    return (
        <section className="municipal-panel min-w-0 overflow-hidden">
            <header className="flex min-h-10 items-center justify-between gap-3 border-b border-[var(--municipal-border)] px-3 py-2">
                <div className="min-w-0">
                    <h2 className="text-[13px] font-bold text-[var(--municipal-text)]">{title}</h2>
                    <p className="text-[10px] text-[var(--municipal-muted)]">{subtitle}</p>
                </div>
                <button type="button" onClick={() => onSelect(view)} className="shrink-0 text-[10px] font-bold text-[var(--municipal-brand)]">View all</button>
            </header>
            <div className="divide-y divide-[var(--municipal-border)]">
                {items.map((item) => {
                    const Icon = mode === 'action' ? UserCheck : mode === 'office' ? Inbox : Send;
                    return (
                        <Link key={item.id} href={`/transactions/${item.id}`} className="flex min-h-12 items-center gap-2.5 px-3 py-2 hover:bg-[var(--municipal-hover)]">
                            <Icon size={15} className="shrink-0 text-[var(--municipal-brand)]" aria-hidden="true" />
                            <div className="min-w-0 flex-1">
                                <div className="truncate text-xs font-semibold text-[var(--municipal-text)]">{item.title}</div>
                                <div className="mt-0.5 truncate text-[10px] text-[var(--municipal-muted)]">
                                    {item.reference} · {humanizeWorkValue(item.status)}
                                    {mode === 'tracking' && item.currentOffice ? ` · Waiting: ${item.currentOffice.shortName || item.currentOffice.name}` : ''}
                                    {mode === 'office' && item.assignedEmployee ? ` · ${item.assignedEmployee.name}` : ''}
                                </div>
                            </div>
                            <ArrowRight size={13} className="shrink-0 text-[var(--municipal-muted)]" aria-hidden="true" />
                        </Link>
                    );
                })}
                {!items.length && <p className="px-3 py-4 text-xs text-[var(--municipal-muted)]">Nothing in this view right now.</p>}
            </div>
        </section>
    );
}

export default function WorkOverview({ profile, groups, overview, onSelect }: Props) {
    const counts = countMap(groups);
    const isDepartmentHead = profile === 'department_head';
    const cardDefinitions = profile === 'executive_oversight'
        ? executiveCards
        : profile === 'system_administration'
            ? systemCards
            : [...personalCards, ...(isDepartmentHead ? officeCards : [])];

    const cards = cardDefinitions.filter((card) => counts.has(card.key));

    const panels = profile === 'executive_oversight'
        ? [
            ['For Approval', 'Executive decisions currently requiring attention', 'needs_my_action', 'action'],
            ['Overdue', 'Authorized municipal work past deadline', 'overdue', 'action'],
            ['Due Soon', 'Authorized municipal work approaching deadline', 'due_soon', 'action'],
            ['Recently Updated', 'Recent movement across authorized workflow', 'recently_updated', 'tracking'],
        ] as const
        : profile === 'system_administration'
            ? [
                ['Active Work', 'Authorized active workflow', 'all', 'office'],
                ['Overdue', 'Authorized workflow past deadline', 'overdue', 'action'],
                ['Recently Updated', 'Recent workflow movement', 'recently_updated', 'tracking'],
                ['Completed Recently', 'Recent terminal workflow records', 'recently_completed', 'tracking'],
            ] as const
            : isDepartmentHead
                ? [
                    ['Needs My Action', 'Direct assignments that require your action', 'needs_my_action', 'action'],
                    ['Incoming Office Work', 'Work currently routed to your office', 'office_queue', 'office'],
                    ['My Requests', 'Work you initiated and are tracking', 'my_requests', 'tracking'],
                    ['Waiting on Others', 'Your requests currently outside your office', 'waiting_on_others', 'tracking'],
                ] as const
                : [
                    ['Needs My Action', 'Direct assignments that require your action', 'needs_my_action', 'action'],
                    ['Assigned to Me', 'Your current active assignments', 'assigned_to_me', 'action'],
                    ['My Requests', 'Work you initiated and are tracking', 'my_requests', 'tracking'],
                    ['Waiting on Others', 'Your requests currently outside your office', 'waiting_on_others', 'tracking'],
                ] as const;

    return (
        <div className="space-y-3">
            <section aria-labelledby="task-overview-cards">
                <div className="mb-1.5 flex items-center justify-between gap-3">
                    <h2 id="task-overview-cards" className="text-xs font-bold uppercase tracking-wide text-[var(--municipal-muted)]">At a glance</h2>
                    <span className="text-[10px] text-[var(--municipal-muted)]">Select a card to open the full queue</span>
                </div>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
                    {cards.map((card) => {
                        const Icon = card.icon;
                        return (
                            <button
                                key={card.key}
                                type="button"
                                onClick={() => onSelect(card.key)}
                                className={`min-h-[92px] rounded-lg border p-3 text-left transition hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--municipal-focus)] ${toneClasses[card.tone]}`}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <Icon size={19} aria-hidden="true" />
                                    <strong className="text-xl leading-none">{counts.get(card.key) ?? 0}</strong>
                                </div>
                                <div className="mt-2 text-xs font-bold leading-4">{card.label}</div>
                                <div className="mt-0.5 text-[10px] leading-4 opacity-80">{card.detail}</div>
                            </button>
                        );
                    })}
                </div>
            </section>

            <section className="grid min-w-0 gap-3 lg:grid-cols-2" aria-label="Task overview">
                {panels.map(([title, subtitle, view, mode]) => (
                    <PreviewPanel
                        key={view}
                        title={title}
                        subtitle={subtitle}
                        view={view}
                        items={overview.previews[view] ?? []}
                        onSelect={onSelect}
                        mode={mode}
                    />
                ))}
            </section>
        </div>
    );
}
