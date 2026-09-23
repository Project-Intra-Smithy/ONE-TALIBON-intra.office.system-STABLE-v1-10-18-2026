import type { PrototypeMessage } from './prototypeMessaging';

type Props = { message: PrototypeMessage };

function readableTime(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    }).format(date);
}

export default function PrototypeMessageBubble({ message }: Props) {
    const sender = message.sender.name ?? 'Authenticated employee';
    const office = message.sender.office;

    return (
        <div className={`flex ${message.isMine ? 'justify-end' : 'justify-start'}`}>
            <article
                aria-label={message.isMine ? `Your message at ${readableTime(message.createdAt)}` : `Message from ${sender} at ${readableTime(message.createdAt)}`}
                className={`max-w-[88%] rounded-xl px-3 py-2.5 sm:max-w-[75%] ${
                    message.isMine
                        ? 'bg-[var(--municipal-brand)] text-white'
                        : 'border border-[var(--municipal-border)] bg-[var(--municipal-surface)] text-[var(--municipal-text)]'
                }`}
            >
                <div className={`mb-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[10px] ${message.isMine ? 'text-white/80' : 'text-[var(--municipal-muted)]'}`}>
                    <span className="font-semibold">{sender}</span>
                    {message.isMine && <span className="rounded-full border border-white/30 px-1.5 py-0.5 font-bold uppercase tracking-wide">You</span>}
                    {office && <><span aria-hidden="true">·</span><span>{office}</span></>}
                    <span aria-hidden="true">·</span>
                    <time dateTime={message.createdAt}>{readableTime(message.createdAt)}</time>
                </div>
                <p className="whitespace-pre-wrap break-words text-sm leading-5">{message.body}</p>
            </article>
        </div>
    );
}
