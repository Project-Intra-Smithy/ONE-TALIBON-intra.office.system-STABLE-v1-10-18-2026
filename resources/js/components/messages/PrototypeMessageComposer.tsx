import { Send } from 'lucide-react';
import { useRef, useState } from 'react';
import type { FormEvent, KeyboardEvent } from 'react';

type Props = {
    channel: string;
    sending: boolean;
    error: string | null;
    onSend: (body: string) => Promise<boolean>;
};

export default function PrototypeMessageComposer({ channel, sending, error, onSend }: Props) {
    const [body, setBody] = useState('');
    const textarea = useRef<HTMLTextAreaElement | null>(null);
    const canSend = body.trim().length > 0 && !sending;

    const submit = async () => {
        if (!canSend) return;
        const sent = await onSend(body);
        if (!sent) return;
        setBody('');
        window.requestAnimationFrame(() => {
            if (textarea.current) textarea.current.style.height = 'auto';
            textarea.current?.focus();
        });
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
            className="shrink-0 border-t border-[var(--municipal-border)] bg-[var(--municipal-surface)] px-3 pt-2.5 sm:px-4"
            style={{ paddingBottom: 'max(0.625rem, env(safe-area-inset-bottom))' }}
        >
            <div className="flex items-end gap-2">
                <label htmlFor="prototype-message-body" className="sr-only">Message {channel}</label>
                <textarea
                    ref={textarea}
                    id="prototype-message-body"
                    value={body}
                    onChange={(event) => setBody(event.target.value)}
                    onInput={(event) => {
                        const field = event.currentTarget;
                        field.style.height = 'auto';
                        field.style.height = `${Math.min(field.scrollHeight, 128)}px`;
                    }}
                    onKeyDown={onKeyDown}
                    rows={1}
                    readOnly={sending}
                    aria-label={`Message ${channel}`}
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? 'prototype-message-error' : 'prototype-message-help'}
                    placeholder={`Message ${channel}...`}
                    className="max-h-32 min-h-11 min-w-0 flex-1 resize-none overflow-y-auto rounded-2xl border border-[var(--municipal-border)] bg-[var(--municipal-surface-subtle)] px-4 py-2.5 text-sm leading-5 text-[var(--municipal-text)] outline-none placeholder:text-[var(--municipal-muted)] focus-visible:border-[var(--municipal-focus)] focus-visible:ring-2 focus-visible:ring-[var(--municipal-brand-soft-strong)]"
                />
                <button
                    type="submit"
                    disabled={!canSend}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--municipal-brand)] text-white hover:bg-[var(--municipal-brand-active)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--municipal-focus)] disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto sm:gap-2 sm:rounded-xl sm:px-4"
                >
                    <Send size={16} aria-hidden="true" />
                    <span className="hidden sm:inline">Send</span>
                    <span className="sr-only sm:hidden">Send message</span>
                </button>
            </div>
            <div id="prototype-message-help" className="sr-only">Enter sends. Shift+Enter starts a new line.</div>
            {error && <div id="prototype-message-error" aria-live="polite" className="mt-1.5 text-xs font-medium text-rose-700 dark:text-rose-300">{error}</div>}
        </form>
    );
}
