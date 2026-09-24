import { Building2, ChevronDown, FileText } from 'lucide-react';
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
        <section aria-labelledby="older-coordination-title" className="border-t border-[var(--municipal-border)] bg-[var(--municipal-surface)]">
            <button
                type="button"
                onClick={() => setOpen((value) => !value)}
                aria-expanded={expanded}
                aria-controls="older-coordination-records"
                className="flex w-full items-center justify-between gap-3 px-3 py-3 text-left hover:bg-[var(--municipal-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--municipal-focus)] sm:px-5"
            >
                <div>
                    <h3 id="older-coordination-title" className="text-xs font-bold text-[var(--municipal-text)]">Older coordination records</h3>
                    <p className="mt-0.5 text-[10px] text-[var(--municipal-muted)]">
                        {conversation.messageCount} historical/demo entries · not live employee chat
                    </p>
                </div>
                <span className="flex shrink-0 items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-[var(--municipal-brand)]">
                    {expanded ? 'Hide' : 'Show'}
                    <ChevronDown size={15} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} aria-hidden="true" />
                </span>
            </button>

            {expanded && (
                <div id="older-coordination-records" className="border-t border-[var(--municipal-border)] px-3 sm:px-5">
                    {conversation.messages.map((message) => {
                        const highlighted = message.id === highlightMessageId;
                        return (
                            <article
                                key={message.id}
                                ref={highlighted ? registerHighlighted : undefined}
                                id={`message-${message.id}`}
                                className={`border-b border-[var(--municipal-border)] py-4 last:border-b-0 ${highlighted ? 'bg-[var(--municipal-brand-soft)] px-3 -mx-3 sm:px-5 sm:-mx-5' : ''}`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--municipal-brand-soft)] text-[var(--municipal-brand)]" aria-hidden="true">
                                        <Building2 size={15} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
                                            <div className="min-w-0">
                                                <div className="break-words text-xs font-bold text-[var(--municipal-brand)]">{message.office}</div>
                                                <h4 className="mt-0.5 break-words text-sm font-semibold text-[var(--municipal-text)]">{message.subject}</h4>
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
                </div>
            )}
        </section>
    );
}
