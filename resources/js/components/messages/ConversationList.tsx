import { MessageSquareText, Search } from 'lucide-react';
import type { MessageConversation } from './messageWorkspace';

type Props = {
    conversations: MessageConversation[];
    selectedChannel: string | null;
    query: string;
    onQueryChange: (value: string) => void;
    onSelect: (channel: string, trigger: HTMLButtonElement) => void;
    registerButton: (channel: string, node: HTMLButtonElement | null) => void;
    registerSearch: (node: HTMLInputElement | null) => void;
};

export default function ConversationList({
    conversations,
    selectedChannel,
    query,
    onQueryChange,
    onSelect,
    registerButton,
    registerSearch,
}: Props) {
    return (
        <section aria-label="Conversations" className="flex h-full min-h-0 flex-col bg-[var(--municipal-surface)]">
            <div className="border-b border-[var(--municipal-border)] px-3 py-3 sm:px-4">
                <div className="flex items-end justify-between gap-3">
                    <div>
                        <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--municipal-brand)]">Coordination</div>
                        <h1 className="mt-0.5 text-base font-bold text-[var(--municipal-text)]">Conversations</h1>
                    </div>
                    <span className="text-[10px] font-semibold text-[var(--municipal-muted)]">{conversations.length} shown</span>
                </div>
                <label className="relative mt-3 block">
                    <span className="sr-only">Search conversations</span>
                    <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--municipal-muted)]" aria-hidden="true" />
                    <input
                        ref={registerSearch}
                        value={query}
                        onChange={(event) => onQueryChange(event.target.value)}
                        type="search"
                        aria-label="Search conversations"
                        placeholder="Search coordination history"
                        className="min-h-11 w-full rounded-lg border border-[var(--municipal-border-strong)] bg-[var(--municipal-surface)] pl-9 pr-3 text-sm text-[var(--municipal-text)] outline-none placeholder:text-[var(--municipal-muted)] focus-visible:border-[var(--municipal-focus)] focus-visible:ring-2 focus-visible:ring-[var(--municipal-brand-soft-strong)]"
                    />
                </label>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain" role="list" aria-label="Message conversations">
                {conversations.map((conversation) => {
                    const selected = conversation.channel === selectedChannel;
                    return (
                        <button
                            key={conversation.channel}
                            ref={(node) => registerButton(conversation.channel, node)}
                            type="button"
                            role="listitem"
                            aria-current={selected ? 'true' : undefined}
                            onClick={(event) => onSelect(conversation.channel, event.currentTarget)}
                            className={`block min-h-[76px] w-full border-b border-[var(--municipal-border)] px-3 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--municipal-focus)] sm:px-4 ${selected ? 'bg-[var(--municipal-brand-soft)]' : 'bg-[var(--municipal-surface)] hover:bg-[var(--municipal-hover)]'}`}
                        >
                            <div className="flex items-start gap-2.5">
                                <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${selected ? 'bg-[var(--municipal-brand)] text-white' : 'bg-[var(--municipal-surface-subtle)] text-[var(--municipal-brand)]'}`}>
                                    <MessageSquareText size={15} aria-hidden="true" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="truncate text-xs font-bold text-[var(--municipal-text)]">{conversation.channel}</div>
                                        <time className="shrink-0 text-[9px] text-[var(--municipal-muted)]">{conversation.latestMessage.date.slice(5)}</time>
                                    </div>
                                    <div className="mt-0.5 line-clamp-1 text-[11px] font-semibold text-[var(--municipal-text)]">{conversation.latestMessage.subject}</div>
                                    <div className="mt-1 flex min-w-0 items-center gap-2 text-[10px] text-[var(--municipal-muted)]">
                                        <span className="truncate">{conversation.latestMessage.office}</span>
                                        <span aria-hidden="true">·</span>
                                        <span className="shrink-0">{conversation.messageCount} messages</span>
                                    </div>
                                    {conversation.hasHighPriority && <div className="mt-1 text-[9px] font-bold uppercase tracking-wide text-rose-700 dark:text-rose-300">High-priority activity</div>}
                                </div>
                            </div>
                        </button>
                    );
                })}
                {conversations.length === 0 && (
                    <div className="px-4 py-10 text-center text-sm text-[var(--municipal-muted)]">
                        No conversations match your search.
                    </div>
                )}
            </div>
        </section>
    );
}
