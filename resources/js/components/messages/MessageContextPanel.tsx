import { Building2, X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import GroupIdentity from './GroupIdentity';
import type { MessageConversation } from './messageWorkspace';

type ContextProps = { conversation: MessageConversation | null };
type ContextDetailsProps = ContextProps & { idPrefix: string };

function ContextDetails({ conversation, idPrefix }: ContextDetailsProps) {
    if (!conversation) return <div className="px-4 py-8 text-sm text-[var(--municipal-muted)]">No chat selected.</div>;
    const officeCount = conversation.offices.length;

    return (
        <div>
            <section className="px-4 py-5 text-center" aria-labelledby={`${idPrefix}-group`}>
                <div className="flex justify-center"><GroupIdentity offices={conversation.offices} /></div>
                <h3 id={`${idPrefix}-group`} className="mt-3 text-base font-bold text-[var(--municipal-text)]">{conversation.channel}</h3>
                <p className="mt-1 text-xs text-[var(--municipal-muted)]">{officeCount} participating {officeCount === 1 ? 'office' : 'offices'}</p>
            </section>

            <section className="border-t border-[var(--municipal-border)] px-4 py-4" aria-labelledby={`${idPrefix}-offices`}>
                <h3 id={`${idPrefix}-offices`} className="text-xs font-bold text-[var(--municipal-text)]">Participating offices</h3>
                <ul className="mt-3 space-y-2.5">
                    {conversation.offices.map((office) => (
                        <li key={office} className="flex items-center gap-2.5 text-xs text-[var(--municipal-text)]">
                            <Building2 size={14} className="shrink-0 text-[var(--municipal-brand)]" aria-hidden="true" />
                            <span className="min-w-0 break-words">{office}</span>
                        </li>
                    ))}
                </ul>
            </section>
        </div>
    );
}

export default function MessageContextPanel({ conversation }: ContextProps) {
    return (
        <aside className="hidden h-full min-h-0 flex-col border-l border-[var(--municipal-border)] bg-[var(--municipal-surface)] 2xl:flex" aria-labelledby="messages-context-title">
            <header className="shrink-0 border-b border-[var(--municipal-border)] px-4 py-4">
                <h2 id="messages-context-title" className="text-sm font-bold text-[var(--municipal-text)]">Chat info</h2>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain"><ContextDetails conversation={conversation} idPrefix="messages-context-panel" /></div>
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
            onCancel={(event) => { event.preventDefault(); onClose(); }}
            onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
        >
            <div className="flex h-full min-h-0 flex-col">
                <header className="flex min-h-14 shrink-0 items-center justify-between gap-3 border-b border-[var(--municipal-border)] px-4 py-2">
                    <h2 id="messages-context-dialog-title" className="text-sm font-bold text-[var(--municipal-text)]">Chat info</h2>
                    <button ref={closeButton} type="button" onClick={onClose} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[var(--municipal-muted)] hover:bg-[var(--municipal-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--municipal-focus)]" aria-label="Close chat info">
                        <X size={18} aria-hidden="true" />
                    </button>
                </header>
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain"><ContextDetails conversation={conversation} idPrefix="messages-context-dialog" /></div>
            </div>
        </dialog>
    );
}
