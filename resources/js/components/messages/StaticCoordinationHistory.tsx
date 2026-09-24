import { ChevronDown, FileText } from 'lucide-react';
import { useState } from 'react';
import type { MessageConversation } from './messageWorkspace';

type Props = {
    conversation: MessageConversation;
    highlightMessageId: string | null;
    registerHighlighted: (node: HTMLElement | null) => void;
};

export default function StaticCoordinationHistory({ conversation, highlightMessageId, registerHighlighted }: Props) {
    const [open, setOpen] = useState(false);
    const expanded = open || Boolean(highlightMessageId);

    return (
        <section aria-labelledby="demo-history-title" className="mx-auto w-full max-w-3xl px-3 pb-3 sm:px-6">
            <button
                type="button"
                onClick={() => setOpen((value) => !value)}
                aria-expanded={expanded}
                aria-controls="demo-history-records"
                className="flex w-full items-center justify-between gap-3 border-t border-[var(--municipal-border)] py-2.5 text-left text-xs text-[var(--municipal-muted)] hover:text-[var(--municipal-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--municipal-focus)]"
            >
                <span id="demo-history-title" className="font-semibold">Demo history · {conversation.messageCount} records</span>
                <span className="flex items-center gap-1 text-[10px] font-semibold text-[var(--municipal-brand)]">
                    {expanded ? 'Hide' : 'View'}
                    <ChevronDown size={14} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} aria-hidden="true" />
                </span>
            </button>

            {expanded && (
                <div id="demo-history-records" className="divide-y divide-[var(--municipal-border)]">
                    {conversation.messages.map((message) => {
                        const highlighted = message.id === highlightMessageId;
                        return (
                            <article
                                key={message.id}
                                ref={highlighted ? registerHighlighted : undefined}
                                id={`message-${message.id}`}
                                className={`py-3 ${highlighted ? 'bg-[var(--municipal-brand-soft)] px-3 -mx-3' : ''}`}
                            >
                                <div className="flex flex-wrap items-start justify-between gap-2">
                                    <div className="min-w-0">
                                        <div className="text-[10px] font-semibold text-[var(--municipal-brand)]">{message.office}</div>
                                        <h4 className="mt-0.5 break-words text-xs font-semibold text-[var(--municipal-text)]">{message.subject}</h4>
                                    </div>
                                    <time className="shrink-0 text-[9px] text-[var(--municipal-muted)]">{message.date}</time>
                                </div>
                                <p className="mt-1.5 whitespace-pre-wrap break-words text-xs leading-5 text-[var(--municipal-muted)]">{message.body}</p>
                                <div className="mt-1.5 flex items-start gap-1.5 text-[10px] text-[var(--municipal-muted)]">
                                    <FileText size={12} className="mt-0.5 shrink-0" aria-hidden="true" />
                                    <span className="break-words">{message.reference}</span>
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}
        </section>
    );
}
