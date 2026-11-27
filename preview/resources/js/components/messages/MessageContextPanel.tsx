import { Building2 } from 'lucide-react';
import { Dialog } from '../ui';
import GroupIdentity from './GroupIdentity';
import type { MessageConversation } from './messageWorkspace';

type ContextProps = { conversation: MessageConversation | null };
type ContextDetailsProps = ContextProps & { idPrefix: string };

function ContextDetails({ conversation, idPrefix }: ContextDetailsProps) {
    if (!conversation) return <div className="px-4 py-8 text-sm text-[var(--ink-secondary)]">No chat selected.</div>;
    const officeCount = conversation.offices.length;

    return (
        <div>
            <section className="px-4 py-5 text-center" aria-labelledby={`${idPrefix}-group`}>
                <div className="flex justify-center"><GroupIdentity offices={conversation.offices} /></div>
                <h3 id={`${idPrefix}-group`} className="mt-3 text-base font-bold text-[var(--ink-primary)]">{conversation.channel}</h3>
                <p className="mt-1 text-xs leading-5 text-[var(--ink-secondary)]">{conversation.description}</p>
                <p className="mt-1 text-xs text-[var(--ink-secondary)]">{officeCount} participating {officeCount === 1 ? 'office' : 'offices'}</p>
            </section>

            <section className="border-t border-[var(--border-default)] px-4 py-4" aria-labelledby={`${idPrefix}-offices`}>
                <h3 id={`${idPrefix}-offices`} className="text-xs font-bold uppercase tracking-wider text-[var(--ink-secondary)]">Participating offices</h3>
                <ul className="mt-3 space-y-2.5">
                    {conversation.offices.map((office) => (
                        <li key={office} className="flex items-center gap-2.5 text-xs text-[var(--ink-primary)]">
                            <Building2 size={14} className="shrink-0 text-[var(--brand-ink)]" aria-hidden="true" />
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
        <aside className="hidden h-full min-h-0 flex-col border-l border-[var(--border-default)] bg-[var(--surface-card)] 2xl:flex" aria-labelledby="messages-context-title">
            <header className="shrink-0 border-b border-[var(--border-default)] px-4 py-4">
                <h2 id="messages-context-title" className="text-sm font-bold text-[var(--ink-primary)]">Chat info</h2>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                <ContextDetails conversation={conversation} idPrefix="messages-context-panel" />
            </div>
        </aside>
    );
}

export function MessageContextDialog({ open, onClose, conversation }: ContextProps & { open: boolean; onClose: () => void }) {
    return (
        <Dialog
            open={open}
            onClose={onClose}
            variant="drawer-right"
            title="Chat info"
            description={conversation?.channel}
        >
            <ContextDetails conversation={conversation} idPrefix="messages-context-dialog" />
        </Dialog>
    );
}
