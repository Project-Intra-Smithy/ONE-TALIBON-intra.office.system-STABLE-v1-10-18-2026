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
    const time = readableTime(message.createdAt);

    return (
        <div className={`flex ${message.isMine ? 'justify-end' : 'justify-start'}`}>
            <article
                aria-label={message.isMine ? `Your message at ${time}` : `Message from ${sender} at ${time}`}
                className={`max-w-[88%] rounded-2xl px-3 py-2.5 shadow-sm sm:max-w-[72%] ${
                    message.isMine
                        ? 'rounded-br-md bg-[var(--municipal-brand)] text-white'
                        : 'rounded-bl-md border border-[var(--municipal-border)] bg-[var(--municipal-surface)] text-[var(--municipal-text)]'
                }`}
            >
                <div className={`mb-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[10px] ${message.isMine ? 'text-white/80' : 'text-[var(--municipal-muted)]'}`}>
                    <span className="font-bold">{message.isMine ? 'You' : sender}</span>
                    {message.isMine && sender !== 'Authenticated employee' && <><span aria-hidden="true">·</span><span>{sender}</span></>}
                    {office && <><span aria-hidden="true">·</span><span>{office}</span></>}
                    <span aria-hidden="true">·</span>
                    <time dateTime={message.createdAt}>{time}</time>
                </div>
                <p className="whitespace-pre-wrap break-words text-sm leading-5">{message.body}</p>
            </article>
        </div>
    );
}
