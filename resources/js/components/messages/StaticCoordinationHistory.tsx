import { Building2, FileText } from 'lucide-react';
import type { MessageConversation } from './messageWorkspace';

type Props = {
    conversation: MessageConversation;
    highlightMessageId: string | null;
    registerHighlighted: (node: HTMLElement | null) => void;
};

export default function StaticCoordinationHistory({ conversation, highlightMessageId, registerHighlighted }: Props) {
    return (
        <section aria-labelledby="older-coordination-title" className="border-t border-[var(--municipal-border)] px-3 py-4 sm:px-4">
            <div className="mb-2">
                <h3 id="older-coordination-title" className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--municipal-muted)]">
                    Older coordination / demo records
                </h3>
                <p className="mt-1 text-xs text-[var(--municipal-muted)]">Institutional sample history from the M1 workspace; these are not live employee chat messages.</p>
            </div>
            {conversation.messages.map((message) => {
                const highlighted = message.id === highlightMessageId;
                return (
                    <article
                        key={message.id}
                        ref={highlighted ? registerHighlighted : undefined}
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
        </section>
    );
}
