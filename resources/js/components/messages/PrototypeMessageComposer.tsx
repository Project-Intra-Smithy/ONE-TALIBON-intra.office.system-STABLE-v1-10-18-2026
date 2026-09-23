import { Send } from 'lucide-react';
import { FormEvent, KeyboardEvent, useRef, useState } from 'react';

type Props = {
    sending: boolean;
    error: string | null;
    onSend: (body: string) => Promise<boolean>;
};

export default function PrototypeMessageComposer({ sending, error, onSend }: Props) {
    const [body, setBody] = useState('');
    const textarea = useRef<HTMLTextAreaElement | null>(null);
    const canSend = body.trim().length > 0 && !sending;

    const submit = async () => {
        if (!canSend) return;
        const sent = await onSend(body);
        if (!sent) return;
        setBody('');
        window.requestAnimationFrame(() => textarea.current?.focus());
    };

    const onSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        void submit();
    };

    const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key !== 'Enter' || event.shiftKey) return;
        event.preventDefault();
        void submit();
    };

    return (
        <form
            onSubmit={onSubmit}
            className="border-t border-[var(--municipal-border)] bg-[var(--municipal-surface)] px-3 pt-3 sm:px-4"
            style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
        >
            <label htmlFor="prototype-message-body" className="sr-only">Message</label>
            <div className="flex items-end gap-2">
                <textarea
                    ref={textarea}
                    id="prototype-message-body"
                    value={body}
                    onChange={(event) => setBody(event.target.value)}
                    onKeyDown={onKeyDown}
                    maxLength={2000}
                    rows={2}
                    readOnly={sending}
                    aria-label="Message"
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? 'prototype-message-error' : 'prototype-message-help'}
                    placeholder="Type a message"
                    className="min-h-11 min-w-0 flex-1 resize-none rounded-lg border border-[var(--municipal-border)] bg-[var(--municipal-surface)] px-3 py-2 text-sm leading-5 text-[var(--municipal-text)] outline-none placeholder:text-[var(--municipal-muted)] focus-visible:ring-2 focus-visible:ring-[var(--municipal-focus)]"
                />
                <button
                    type="submit"
                    disabled={!canSend}
                    className="flex min-h-11 shrink-0 items-center gap-2 rounded-lg bg-[var(--municipal-brand)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--municipal-brand-active)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--municipal-focus)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <Send size={16} aria-hidden="true" />
                    <span className="hidden sm:inline">Send</span>
                    <span className="sr-only sm:hidden">Send message</span>
                </button>
            </div>
            <div id="prototype-message-help" className="mt-1.5 text-[10px] text-[var(--municipal-muted)]">
                Plain text only · Enter to send · Shift+Enter for a new line
            </div>
            <div id="prototype-message-error" aria-live="polite" className="mt-1 min-h-4 text-xs font-medium text-rose-700 dark:text-rose-300">
                {error}
            </div>
        </form>
    );
}
