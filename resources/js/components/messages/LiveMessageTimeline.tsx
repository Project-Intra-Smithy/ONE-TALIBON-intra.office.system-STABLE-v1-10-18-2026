import type { PrototypeMessage } from './prototypeMessaging';
import PrototypeMessageBubble from './PrototypeMessageBubble';

type Props = {
    messages: PrototypeMessage[];
    pollError: string | null;
    registerEnd: (node: HTMLDivElement | null) => void;
};

const GROUP_WINDOW_MS = 5 * 60 * 1000;

function continuesSender(messages: PrototypeMessage[], index: number): boolean {
    if (index === 0) return false;
    const current = messages[index];
    const previous = messages[index - 1];
    const currentTime = Date.parse(current.createdAt);
    const previousTime = Date.parse(previous.createdAt);
    const elapsed = currentTime - previousTime;

    return current.isMine === previous.isMine
        && current.sender.name === previous.sender.name
        && current.sender.office === previous.sender.office
        && Number.isFinite(elapsed)
        && elapsed >= 0
        && elapsed <= GROUP_WINDOW_MS;
}

export default function LiveMessageTimeline({ messages, pollError, registerEnd }: Props) {
    return (
        <section aria-label="Messages" className="mx-auto w-full max-w-3xl px-3 py-4 sm:px-6 sm:py-5">
            {pollError && <div role="status" aria-live="polite" className="mb-3 text-center text-xs font-medium text-amber-700 dark:text-amber-300">{pollError}</div>}

            {messages.length > 0 ? (
                <div className="space-y-1.5">
                    {messages.map((message, index) => (
                        <PrototypeMessageBubble key={message.publicId} message={message} showSender={!continuesSender(messages, index)} />
                    ))}
                </div>
            ) : (
                <div className="flex min-h-40 items-center justify-center text-center">
                    <div><div className="text-sm font-semibold text-[var(--municipal-text)]">No messages yet</div><div className="mt-1 text-xs text-[var(--municipal-muted)]">Start the conversation.</div></div>
                </div>
            )}

            <div ref={registerEnd} className="h-2" aria-hidden="true" />
        </section>
    );
}
