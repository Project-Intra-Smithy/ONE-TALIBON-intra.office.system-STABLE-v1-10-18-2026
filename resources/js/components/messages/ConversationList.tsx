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

export default function ConversationList({ conversations, selectedChannel, query, onQueryChange, onSelect, registerButton, registerSearch }: Props) {
    return (
        <section aria-label="Chats" className="flex h-full min-h-0 flex-col bg-[var(--municipal-surface)]">
            <header className="shrink-0 px-4 pb-3 pt-4">
                <h1 className="text-xl font-bold tracking-tight text-[var(--municipal-text)]">Chats</h1>
                <label className="relative mt-3 block">
                    <span className="sr-only">Search chats</span>
                    <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--municipal-muted)]" aria-hidden="true" />
                    <input
                        ref={registerSearch}
                        value={query}
                        onChange={(event) => onQueryChange(event.target.value)}
                        type="search"
                        aria-label="Search chats"
                        placeholder="Search chats"
                        className="min-h-10 w-full rounded-lg border border-[var(--municipal-border)] bg-[var(--municipal-surface-subtle)] pl-9 pr-3 text-sm text-[var(--municipal-text)] outline-none placeholder:text-[var(--municipal-muted)] focus-visible:border-[var(--municipal-focus)] focus-visible:ring-2 focus-visible:ring-[var(--municipal-brand-soft-strong)]"
                    />
                </label>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 pb-2">
                <ul className="space-y-1" aria-label="Chats">
                    {conversations.map((conversation) => {
                        const selected = conversation.channel === selectedChannel;
                        const officeCount = conversation.offices.length;
                        return (
                            <li key={conversation.channel}>
                                <button
                                    ref={(node) => registerButton(conversation.channel, node)}
                                    type="button"
                                    aria-current={selected ? 'true' : undefined}
                                    onClick={(event) => onSelect(conversation.channel, event.currentTarget)}
                                    className={`block w-full rounded-xl px-3 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--municipal-focus)] ${selected ? 'bg-[var(--municipal-brand-soft)]' : 'hover:bg-[var(--municipal-hover)]'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${selected ? 'bg-[var(--municipal-brand)] text-white' : 'bg-[var(--municipal-surface-subtle)] text-[var(--municipal-brand)]'}`}>
                                            <MessageSquareText size={17} aria-hidden="true" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className={`truncate text-sm ${selected ? 'font-bold' : 'font-semibold'} text-[var(--municipal-text)]`}>{conversation.channel}</div>
                                            <div className="mt-0.5 line-clamp-1 text-[11px] text-[var(--municipal-muted)]">
                                                {officeCount} {officeCount === 1 ? 'office' : 'offices'} · {conversation.latestMessage.subject}
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            </li>
                        );
                    })}
                </ul>
                {conversations.length === 0 && <div className="px-4 py-10 text-center text-sm text-[var(--municipal-muted)]">No chats found.</div>}
            </div>
        </section>
    );
}
