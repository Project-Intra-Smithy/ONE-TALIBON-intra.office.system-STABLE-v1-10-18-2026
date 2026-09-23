import { ArrowLeft, PanelRightOpen } from 'lucide-react';
import { useEffect, useRef } from 'react';
import usePrototypeMessaging from '../../hooks/messaging/usePrototypeMessaging';
import type { MessageConversation } from './messageWorkspace';
import PrototypeMessageBubble from './PrototypeMessageBubble';
import PrototypeMessageComposer from './PrototypeMessageComposer';
import StaticCoordinationHistory from './StaticCoordinationHistory';

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
    const prototype = usePrototypeMessaging(conversation?.channel ?? null);

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
        const frame = window.requestAnimationFrame(() => highlightedMessage.current?.scrollIntoView({ block: 'center' }));
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
                <button type="button" onClick={onBack} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-[var(--municipal-muted)] hover:bg-[var(--municipal-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--municipal-focus)] md:hidden" aria-label="Back to conversations">
                    <ArrowLeft size={18} aria-hidden="true" />
                </button>
                <div className="min-w-0 flex-1">
                    <h2 ref={registerHeading} tabIndex={-1} id="messages-thread-title" className="truncate text-sm font-bold text-[var(--municipal-text)] outline-none">{conversation.channel}</h2>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-[var(--municipal-muted)]">
                        <span>Writable prototype messaging</span><span aria-hidden="true">·</span><span>{conversation.messageCount} older demo records</span>
                    </div>
                </div>
                <button type="button" onClick={onOpenContext} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-[var(--municipal-muted)] hover:bg-[var(--municipal-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--municipal-focus)] min-[1440px]:hidden" aria-label="Open thread context" aria-haspopup="dialog">
                    <PanelRightOpen size={18} aria-hidden="true" />
                </button>
            </header>

            <div ref={threadScroller} className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-[var(--municipal-surface-subtle)]" aria-label={`${conversation.channel} coordination history`}>
                <section aria-labelledby="live-prototype-title" className="mx-auto max-w-4xl px-3 py-4 sm:px-4">
                    <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                        <div>
                            <h3 id="live-prototype-title" className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--municipal-brand)]">Live prototype messages</h3>
                            <p className="mt-1 text-xs text-[var(--municipal-muted)]">Persisted employee messages for this fixed channel.</p>
                        </div>
                        {prototype.pollError && <div role="status" aria-live="polite" className="text-xs font-medium text-amber-700 dark:text-amber-300">{prototype.pollError}</div>}
                    </div>
                    <div className="space-y-2.5">
                        {prototype.messages.map((message) => <PrototypeMessageBubble key={message.publicId} message={message} />)}
                        {prototype.messages.length === 0 && <div className="rounded-lg border border-dashed border-[var(--municipal-border)] px-4 py-6 text-center text-sm text-[var(--municipal-muted)]">No live prototype messages in this channel yet.</div>}
                    </div>
                </section>
                <div className="mx-auto max-w-4xl">
                    <StaticCoordinationHistory conversation={conversation} highlightMessageId={highlightMessageId} registerHighlighted={(node) => { highlightedMessage.current = node; }} />
                </div>
            </div>

            <PrototypeMessageComposer sending={prototype.sending} error={prototype.sendError} onSend={prototype.send} />
        </section>
    );
}
