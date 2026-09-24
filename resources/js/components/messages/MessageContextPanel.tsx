import { AlertTriangle, Building2, Clock3, FileText, MessageSquareText, X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import type { MessageConversation } from './messageWorkspace';

type ContextProps = {
    conversation: MessageConversation | null;
};

type ContextDetailsProps = ContextProps & {
    idPrefix: string;
};

function ContextDetails({ conversation, idPrefix }: ContextDetailsProps) {
    if (!conversation) {
        return <div className="px-4 py-8 text-sm text-[var(--municipal-muted)]">No additional thread context is available.</div>;
    }

    return (
        <div className="divide-y divide-[var(--municipal-border)]">
            <section className="px-4 py-4" aria-labelledby={`${idPrefix}-channel`}>
                <div className="flex items-center gap-2 text-[var(--municipal-brand)]">
                    <MessageSquareText size={15} aria-hidden="true" />
                    <h3 id={`${idPrefix}-channel`} className="text-[10px] font-bold uppercase tracking-[0.14em]">Channel</h3>
                </div>
                <div className="mt-2 break-words text-sm font-bold text-[var(--municipal-text)]">{conversation.channel}</div>
            </section>

            <section className="px-4 py-4" aria-labelledby={`${idPrefix}-offices`}>
                <div className="flex items-center gap-2 text-[var(--municipal-brand)]">
                    <Building2 size={15} aria-hidden="true" />
                    <h3 id={`${idPrefix}-offices`} className="text-[10px] font-bold uppercase tracking-[0.14em]">Offices represented</h3>
                </div>
                <ul className="mt-2 space-y-1.5 text-xs leading-5 text-[var(--municipal-text)]">
                    {conversation.offices.map((office) => <li key={office}>{office}</li>)}
                </ul>
            </section>

            <section className="px-4 py-4" aria-labelledby={`${idPrefix}-references`}>
                <div className="flex items-center gap-2 text-[var(--municipal-brand)]">
                    <FileText size={15} aria-hidden="true" />
                    <h3 id={`${idPrefix}-references`} className="text-[10px] font-bold uppercase tracking-[0.14em]">Related references</h3>
                </div>
                {conversation.references.length > 0 ? (
                    <ul className="mt-2 space-y-1.5 text-xs leading-5 text-[var(--municipal-muted)]">
                        {conversation.references.map((reference) => <li key={reference} className="break-words">{reference}</li>)}
                    </ul>
                ) : (
                    <div className="mt-2 text-xs text-[var(--municipal-muted)]">No additional thread context is available.</div>
                )}
            </section>

            <section className="grid grid-cols-2 gap-3 px-4 py-4" aria-label="Thread activity summary">
                <div>
                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-[var(--municipal-muted)]"><Clock3 size={13} aria-hidden="true" /> Latest activity</div>
                    <div className="mt-1 text-xs font-semibold text-[var(--municipal-text)]">{conversation.latestMessage.date}</div>
                </div>
                <div>
                    <div className="text-[10px] font-bold uppercase tracking-wide text-[var(--municipal-muted)]">Messages</div>
                    <div className="mt-1 text-xs font-semibold text-[var(--municipal-text)]">{conversation.messageCount}</div>
                </div>
            </section>

            {conversation.hasHighPriority && (
                <section className="px-4 py-4" aria-label="Priority">
                    <div className="flex items-center gap-2 text-xs font-bold text-rose-700 dark:text-rose-300">
                        <AlertTriangle size={14} aria-hidden="true" />
                        High-priority activity is present in this thread.
                    </div>
                </section>
            )}
        </div>
    );
}

export default function MessageContextPanel({ conversation }: ContextProps) {
    return (
        <aside className="hidden h-full min-h-0 flex-col border-l border-[var(--municipal-border)] bg-[var(--municipal-surface)] 2xl:flex" aria-labelledby="messages-context-title">
            <div className="border-b border-[var(--municipal-border)] px-4 py-3">
                <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--municipal-brand)]">Coordination</div>
                <h2 id="messages-context-title" className="mt-0.5 text-sm font-bold text-[var(--municipal-text)]">Thread context</h2>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                <ContextDetails conversation={conversation} idPrefix="messages-context-panel" />
            </div>
        </aside>
    );
}

export function MessageContextDialog({ open, onClose, conversation }: ContextProps & { open: boolean; onClose: () => void }) {
    const dialog = useRef<HTMLDialogElement>(null);
    const closeButton = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (!open) return;
        const element = dialog.current;
        if (!element) return;
        const previousFocus = document.activeElement as HTMLElement | null;
        const previousOverflow = document.body.style.overflow;

        if (!element.open) element.showModal();
        closeButton.current?.focus();
        document.body.style.overflow = 'hidden';

        return () => {
            if (element.open) element.close();
            document.body.style.overflow = previousOverflow;
            previousFocus?.focus();
        };
    }, [open]);

    return (
        <dialog
            ref={dialog}
            aria-modal="true"
            aria-labelledby="messages-context-dialog-title"
            className="fixed inset-y-0 right-0 m-0 ml-auto h-dvh max-h-none w-[min(22rem,calc(100vw-1rem))] max-w-none overflow-hidden border-0 border-l border-[var(--municipal-border)] bg-[var(--municipal-surface)] p-0 text-[var(--municipal-text)] shadow-2xl backdrop:bg-[#051911]/50"
            onCancel={(event) => {
                event.preventDefault();
                onClose();
            }}
            onClick={(event) => {
                if (event.target === event.currentTarget) onClose();
            }}
        >
            <div className="flex h-full min-h-0 flex-col">
                <header className="flex min-h-14 items-center justify-between gap-3 border-b border-[var(--municipal-border)] px-4 py-2">
                    <div>
                        <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--municipal-brand)]">Coordination</div>
                        <h2 id="messages-context-dialog-title" className="text-sm font-bold text-[var(--municipal-text)]">Thread context</h2>
                    </div>
                    <button
                        ref={closeButton}
                        type="button"
                        onClick={onClose}
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-[var(--municipal-muted)] hover:bg-[var(--municipal-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--municipal-focus)]"
                        aria-label="Close thread context"
                    >
                        <X size={18} aria-hidden="true" />
                    </button>
                </header>
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                    <ContextDetails conversation={conversation} idPrefix="messages-context-dialog" />
                </div>
            </div>
        </dialog>
    );
}
