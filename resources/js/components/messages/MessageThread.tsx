import { ArrowLeft, Building2, FileText, PanelRightOpen } from 'lucide-react';
import { useEffect, useRef } from 'react';
import type { MessageConversation } from './messageWorkspace';

type Props = {
    conversation: MessageConversation | null;
    highlightMessageId: string | null;
    onBack: () => void;
    onOpenContext: () => void;
    registerHeading: (node: HTMLHeadingElement | null) => void;
};

export default function MessageThread({ conversation, highlightMessageId, onBack, onOpenContext, registerHeading }: Props) {
    const highlightedMessage = useRef<HTMLElement | null>(null);
    const threadScroller = useRef<HTMLDivElement | null>(null);
    const scrollPositions = useRef(new Map<string, number>());

    useEffect(() => {
        const scroller = threadScroller.current;
        const channel = conversation?.channel;
        if (!scroller || !channel) return;

        if (!highlightMessageId) scroller.scrollTop = scrollPositions.current.get(channel) ?? 0;

        return () => {
            scrollPositions.current.set(channel, scroller.scrollTop);
        };
    }, [conversation?.channel]);

    useEffect(() => {
        if (!highlightMessageId || !highlightedMessage.current) return;
        const frame = window.requestAnimationFrame(() => {
            highlightedMessage.current?.scrollIntoView({ block: 'center' });
        });
        return () => window.cancelAnimationFrame(frame);
    }, [conversation?.channel, highlightMessageId]);

    if (!conversation) {
        return (
            <section aria-label="Active coordination" className="flex h-full min-h-0 items-center justify-center bg-[var(--municipal-surface-subtle)] p-6">
                <div className="max-w-sm text-center">
                    <div className="text-sm font-bold text-[var(--municipal-text)]">No conversation selected</div>
                    <p className="mt-1 text-sm text-[var(--municipal-muted)]">Choose a conversation to read its coordination history.</p>
                </div>
            </section>
        );
    }

    return (
        <section aria-labelledby="messages-thread-title" className="flex h-full min-h-0 flex-col bg-[var(--municipal-surface)]">
            <header className="flex min-h-16 items-center gap-2 border-b border-[var(--municipal-border)] px-3 py-2 sm:px-4">
                <button
                    type="button"
                    onClick={onBack}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-[var(--municipal-muted)] hover:bg-[var(--municipal-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--municipal-focus)] md:hidden"
                    aria-label="Back to conversations"
                >
                    <ArrowLeft size={18} aria-hidden="true" />
                </button>
                <div className="min-w-0 flex-1">
                    <h2 ref={registerHeading} tabIndex={-1} id="messages-thread-title" className="truncate text-sm font-bold text-[var(--municipal-text)] outline-none">
                        {conversation.channel}
                    </h2>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-[var(--municipal-muted)]">
                        <span>Read-only coordination history</span>
                        <span aria-hidden="true">·</span>
                        <span>{conversation.messageCount} messages</span>
                        <span aria-hidden="true">·</span>
                        <span>Latest {conversation.latestMessage.date}</span>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={onOpenContext}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-[var(--municipal-muted)] hover:bg-[var(--municipal-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--municipal-focus)] min-[1440px]:hidden"
                    aria-label="Open thread context"
                    aria-haspopup="dialog"
                >
                    <PanelRightOpen size={18} aria-hidden="true" />
                </button>
            </header>

            <div ref={threadScroller} className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-[var(--municipal-surface-subtle)]" aria-label={`${conversation.channel} coordination history`}>
                <div className="mx-auto max-w-4xl px-3 sm:px-4">
                    {conversation.messages.map((message) => {
                        const highlighted = message.id === highlightMessageId;
                        return (
                            <article
                                key={message.id}
                                ref={highlighted ? highlightedMessage : undefined}
                                id={`message-${message.id}`}
                                className={`border-b border-[var(--municipal-border)] py-4 last:border-b-0 ${highlighted ? 'bg-[var(--municipal-brand-soft)] px-3 -mx-3 sm:px-4 sm:-mx-4' : ''}`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--municipal-brand-soft)] text-[var(--municipal-brand)]" aria-hidden="true">
                                        <Building2 size={15} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
                                            <div className="min-w-0">
                                                <div className="break-words text-xs font-bold text-[var(--municipal-brand)]">{message.office}</div>
                                                <h3 className="mt-0.5 break-words text-sm font-semibold text-[var(--municipal-text)]">{message.subject}</h3>
                                            </div>
                                            <div className="flex shrink-0 items-center gap-2">
                                                {message.priority === 'High' && <span className="rounded-full bg-rose-50 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">High priority</span>}
                                                <time className="text-[10px] text-[var(--municipal-muted)]">{message.date}</time>
                                            </div>
                                        </div>
                                        <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-[var(--municipal-text)]">{message.body}</p>
                                        <div className="mt-2 flex items-start gap-1.5 text-xs text-[var(--municipal-muted)]">
                                            <FileText size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
                                            <span className="break-words">{message.reference}</span>
                                        </div>
                                    </div>
                                </div>
                            </article>
                        );
                    })}
                    {conversation.messages.length === 0 && (
                        <div className="px-4 py-12 text-center text-sm text-[var(--municipal-muted)]">
                            No coordination history is available for this conversation.
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
