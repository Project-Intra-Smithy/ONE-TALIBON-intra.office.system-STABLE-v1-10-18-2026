import type { Message } from './messaging';

type Props = {
    message: Message;
    showSender: boolean;
};

function readableTime(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat('en-PH', { timeZone: 'Asia/Manila', hour: 'numeric', minute: '2-digit' }).format(date);
}

export default function MessageBubble({ message, showSender }: Props) {
    const sender = message.sender.name ?? 'Employee';
    const office = message.sender.office;
    const time = readableTime(message.createdAt);

    return (
        <div className={`flex ${message.isMine ? 'justify-end' : 'justify-start'} ${showSender ? 'pt-2' : ''}`}>
            <article
                aria-label={message.isMine ? `Your message at ${time}` : `Message from ${sender} at ${time}`}
                className={`max-w-[86%] rounded-2xl px-3.5 py-2.5 shadow-sm sm:max-w-[70%] ${
                    message.isMine
                        ? 'rounded-br-md border border-[var(--brand-soft-border)] bg-[var(--brand-soft)] text-[var(--ink-primary)]'
                        : 'rounded-bl-md border border-[var(--border-default)] bg-[var(--surface-card)] text-[var(--ink-primary)]'
                }`}
            >
                {!message.isMine && showSender && (
                    <div className="mb-1.5">
                        <div className="text-xs font-bold text-[var(--brand-ink)]">{sender}</div>
                        {office && <div className="mt-0.5 text-xs text-[var(--ink-secondary)]">{office}</div>}
                    </div>
                )}
                <p className="whitespace-pre-wrap break-words text-sm leading-5">{message.body}</p>
                <div className={`mt-1 text-right text-xs ${message.isMine ? 'text-[var(--brand-ink)]' : 'text-[var(--ink-secondary)]'}`}>
                    <time dateTime={message.createdAt}>{time}</time>
                </div>
            </article>
        </div>
    );
}
