import { ArrowLeft, Info } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import usePrototypeMessaging from '../../hooks/messaging/usePrototypeMessaging';
import GroupIdentity from './GroupIdentity';
import LiveMessageTimeline from './LiveMessageTimeline';
import type { MessageConversation } from './messageWorkspace';
import PrototypeMessageComposer from './PrototypeMessageComposer';

const NEAR_BOTTOM_THRESHOLD = 120;

type Props = {
    conversation: MessageConversation | null;
    onBack: () => void;
    onOpenContext: () => void;
    registerHeading: (node: HTMLHeadingElement | null) => void;
};

function isNearLiveEnd(scroller: HTMLDivElement, liveEnd: HTMLDivElement | null): boolean {
    if (!liveEnd || scroller.scrollHeight <= scroller.clientHeight + 1) return true;
    return Math.abs(scroller.getBoundingClientRect().bottom - liveEnd.getBoundingClientRect().bottom) <= NEAR_BOTTOM_THRESHOLD;
}

function scrollToLiveEnd(scroller: HTMLDivElement, liveEnd: HTMLDivElement | null): void {
    if (!liveEnd) return;
    const delta = liveEnd.getBoundingClientRect().bottom - scroller.getBoundingClientRect().bottom;
    scroller.scrollTop += delta + 12;
}

export default function MessageThread({ conversation, onBack, onOpenContext, registerHeading }: Props) {
    const threadScroller = useRef<HTMLDivElement | null>(null);
    const liveEnd = useRef<HTMLDivElement | null>(null);
    const scrollPositions = useRef(new Map<string, number>());
    const pendingRestore = useRef<number | null>(null);
    const nearBottom = useRef(true);
    const followInitialLoad = useRef(false);
    const lastLiveCursor = useRef(0);
    const [ownSendVersion, setOwnSendVersion] = useState(0);
    const prototype = usePrototypeMessaging(conversation?.channel ?? null);
    const liveMessages = conversation
        ? prototype.messages.filter((message) => message.channel === conversation.channel)
        : [];
    const latestLiveCursor = liveMessages.at(-1)?.cursor ?? 0;

    useEffect(() => {
        const scroller = threadScroller.current;
        const channel = conversation?.channel;
        if (!scroller || !channel) return;
        const savedPosition = scrollPositions.current.get(channel);
        lastLiveCursor.current = 0;
        pendingRestore.current = savedPosition !== undefined ? savedPosition : null;
        followInitialLoad.current = savedPosition === undefined;

        if (savedPosition === undefined) {
            const frame = window.requestAnimationFrame(() => {
                if (threadScroller.current) scrollToLiveEnd(threadScroller.current, liveEnd.current);
                nearBottom.current = true;
            });
            return () => {
                window.cancelAnimationFrame(frame);
                scrollPositions.current.set(channel, scroller.scrollTop);
            };
        }

        nearBottom.current = false;
        return () => { scrollPositions.current.set(channel, scroller.scrollTop); };
    }, [conversation?.channel]);

    useEffect(() => {
        const scroller = threadScroller.current;
        const previousCursor = lastLiveCursor.current;
        lastLiveCursor.current = Math.max(previousCursor, latestLiveCursor);
        if (!scroller || latestLiveCursor <= previousCursor) return;

        const restore = pendingRestore.current;
        if (restore !== null) {
            pendingRestore.current = null;
            const frame = window.requestAnimationFrame(() => {
                if (!threadScroller.current) return;
                threadScroller.current.scrollTop = restore;
                nearBottom.current = isNearLiveEnd(threadScroller.current, liveEnd.current);
            });
            return () => window.cancelAnimationFrame(frame);
        }

        if (!followInitialLoad.current && !nearBottom.current) return;
        const frame = window.requestAnimationFrame(() => {
            if (threadScroller.current) scrollToLiveEnd(threadScroller.current, liveEnd.current);
            nearBottom.current = true;
            followInitialLoad.current = false;
        });
        return () => window.cancelAnimationFrame(frame);
    }, [latestLiveCursor]);

    useEffect(() => {
        if (ownSendVersion === 0 || !threadScroller.current) return;
        const frame = window.requestAnimationFrame(() => {
            if (threadScroller.current) scrollToLiveEnd(threadScroller.current, liveEnd.current);
            nearBottom.current = true;
            followInitialLoad.current = false;
            pendingRestore.current = null;
        });
        return () => window.cancelAnimationFrame(frame);
    }, [ownSendVersion]);

    const sendAndFollow = async (body: string): Promise<boolean> => {
        const sent = await prototype.send(body);
        if (sent) setOwnSendVersion((version) => version + 1);
        return sent;
    };

    if (!conversation) {
        return <section aria-label="Active chat" className="flex h-full items-center justify-center text-sm text-[var(--municipal-muted)]">Choose a chat.</section>;
    }

    const officeCount = conversation.offices.length;

    return (
        <section aria-labelledby="messages-thread-title" className="flex h-full min-h-0 flex-col bg-[var(--municipal-surface)]">
            <header className="flex min-h-16 shrink-0 items-center gap-3 border-b border-[var(--municipal-border)] px-3 py-2 sm:px-4">
                <button type="button" onClick={onBack} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[var(--municipal-muted)] hover:bg-[var(--municipal-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--municipal-focus)] md:hidden" aria-label="Back to chats">
                    <ArrowLeft size={18} aria-hidden="true" />
                </button>
                <GroupIdentity offices={conversation.offices} size="sm" />
                <div className="min-w-0 flex-1">
                    <h2 ref={registerHeading} tabIndex={-1} id="messages-thread-title" className="truncate text-sm font-bold text-[var(--municipal-text)] outline-none">{conversation.channel}</h2>
                    <div className="mt-0.5 text-[11px] text-[var(--municipal-muted)]">{officeCount} {officeCount === 1 ? 'office' : 'offices'}</div>
                </div>
                <button type="button" onClick={onOpenContext} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[var(--municipal-muted)] hover:bg-[var(--municipal-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--municipal-focus)] 2xl:hidden" aria-label="Open chat info" aria-haspopup="dialog">
                    <Info size={18} aria-hidden="true" />
                </button>
            </header>

            <div
                ref={threadScroller}
                onScroll={(event) => {
                    const atBottom = isNearLiveEnd(event.currentTarget, liveEnd.current);
                    nearBottom.current = atBottom;
                    if (!atBottom) followInitialLoad.current = false;
                }}
                className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-[var(--municipal-surface-subtle)]"
                aria-label={`${conversation.channel} messages`}
            >
                <LiveMessageTimeline messages={liveMessages} pollError={prototype.pollError} registerEnd={(node) => { liveEnd.current = node; }} />
            </div>

            <PrototypeMessageComposer channel={conversation.channel} sending={prototype.sending} error={prototype.sendError} onSend={sendAndFollow} />
        </section>
    );
}
