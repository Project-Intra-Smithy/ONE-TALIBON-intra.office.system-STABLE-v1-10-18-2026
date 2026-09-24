import type { PrototypeMessage } from './prototypeMessaging';

type Props = {
    message: PrototypeMessage;
    showSender: boolean;
};

function readableTime(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(date);
}

export default function PrototypeMessageBubble({ message, showSender }: Props) {
    const sender = message.sender.name ?? 'Employee';
    const office = message.sender.office;
    const time = readableTime(message.createdAt);

    return (
        <div className={`flex ${message.isMine ? 'justify-end' : 'justify-start'} ${showSender ? 'pt-2' : ''}`}>
            <article
                aria-label={message.isMine ? `Your message at ${time}` : `Message from ${sender} at ${time}`}
                className={`max-w-[86%] rounded-2xl px-3 py-2 shadow-sm sm:max-w-[70%] ${
                    message.isMine
                        ? 'rounded-br-md border border-[var(--municipal-brand-soft-strong)] bg-[var(--municipal-brand-soft)] text-[var(--municipal-text)]'
                        : 'rounded-bl-md border border-[var(--municipal-border)] bg-[var(--municipal-surface)] text-[var(--municipal-text)]'
                }`}
            >
                {!message.isMine && showSender && (
                    <div className="mb-1.5">
                        <div className="text-[11px] font-bold text-[var(--municipal-brand)]">{sender}</div>
                        {office && <div className="mt-0.5 text-[9px] text-[var(--municipal-muted)]">{office}</div>}
                    </div>
                )}
                <p className="whitespace-pre-wrap break-words text-sm leading-5">{message.body}</p>
                <div className={`mt-1 text-right text-[9px] ${message.isMine ? 'text-[var(--municipal-brand)]' : 'text-[var(--municipal-muted)]'}`}>
                    <time dateTime={message.createdAt}>{time}</time>
                </div>
            </article>
        </div>
    );
}
