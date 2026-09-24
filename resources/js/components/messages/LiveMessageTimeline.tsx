import type { PrototypeMessage } from './prototypeMessaging';
import PrototypeMessageBubble from './PrototypeMessageBubble';

type Props = {
    channel: string;
    messages: PrototypeMessage[];
    pollError: string | null;
    registerEnd: (node: HTMLDivElement | null) => void;
};

export default function LiveMessageTimeline({ channel, messages, pollError, registerEnd }: Props) {
    return (
        <section aria-labelledby="live-prototype-title" className="mx-auto w-full max-w-4xl px-3 py-4 sm:px-5">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-[var(--municipal-brand)]" aria-hidden="true" />
                        <h3 id="live-prototype-title" className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--municipal-brand)]">
                            Live employee messages
                        </h3>
                    </div>
                    <p className="mt-1 text-xs text-[var(--municipal-muted)]">Writable messages shared in {channel}.</p>
                </div>
                {pollError && (
                    <div role="status" aria-live="polite" className="text-xs font-medium text-amber-700 dark:text-amber-300">
                        {pollError}
                    </div>
                )}
            </div>

            {messages.length > 0 ? (
                <div className="space-y-3">
                    {messages.map((message) => <PrototypeMessageBubble key={message.publicId} message={message} />)}
                </div>
            ) : (
                <div className="mx-auto max-w-sm py-8 text-center sm:py-10">
                    <div className="text-sm font-bold text-[var(--municipal-text)]">No messages yet</div>
                    <p className="mt-1 text-xs leading-5 text-[var(--municipal-muted)]">
                        Start the conversation for {channel}.
                    </p>
                </div>
            )}

            <div ref={registerEnd} className="h-px" aria-hidden="true" />
        </section>
    );
}
