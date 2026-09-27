import { Link } from '@inertiajs/react';
import { CalendarDays, Clock3, MapPin, X } from 'lucide-react';
import { useEffect, useRef, type ReactNode } from 'react';
import { formatDate, formatTime } from './calendarDate';
import type { CalendarEvent } from './calendarTypes';

export default function CalendarEventPopover({ event, origin, onClose }: { event: CalendarEvent | null; origin: HTMLElement | null; onClose: () => void }) {
    const dialog = useRef<HTMLDialogElement>(null);

    useEffect(() => {
        const node = dialog.current;
        if (!node) return;
        if (event && !node.open) node.showModal();
        if (!event && node.open) node.close();
    }, [event]);

    const close = () => {
        dialog.current?.close();
        onClose();
        window.requestAnimationFrame(() => origin?.focus());
    };

    const schedule = event ? event.all_day
        ? `${formatDate(event.start_date, { month: 'long', day: 'numeric', year: 'numeric' })}${event.end_date && event.end_date !== event.start_date ? ` – ${formatDate(event.end_date, { month: 'long', day: 'numeric', year: 'numeric' })}` : ''} · All day`
        : timedSchedule(event)
        : '';

    return <dialog
        ref={dialog}
        onCancel={(cancel) => { cancel.preventDefault(); close(); }}
        onClick={(click) => { if (click.target === dialog.current) close(); }}
        className="fixed left-1/2 top-1/2 m-0 w-[min(92vw,640px)] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-[var(--municipal-border)] bg-[var(--municipal-surface)] p-0 text-[var(--municipal-text)] shadow-2xl backdrop:bg-slate-950/35"
    >
        {event && <>
            <header className="flex items-start justify-between gap-3 border-b border-[var(--municipal-border)] px-3 py-2.5">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 text-[9px] font-bold uppercase tracking-wide text-[var(--municipal-brand)]">
                        <span>{event.event_type.replaceAll('_', ' ')}</span>
                        <span className="text-[var(--municipal-border-strong)]">·</span>
                        <span>{event.status.replaceAll('_', ' ')}</span>
                    </div>
                    <h2 className="mt-1 text-base font-bold leading-5">{event.title}</h2>
                </div>
                <button type="button" onClick={close} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-[var(--municipal-border)] text-[var(--municipal-muted)] hover:bg-[var(--municipal-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--municipal-focus)]" aria-label="Close event details">
                    <X size={15} />
                </button>
            </header>

            <div className="space-y-2 px-3 py-2.5">
                <dl className="grid gap-2 sm:grid-cols-2">
                    <Detail icon={<CalendarDays size={13} />} label="Schedule" value={schedule} />
                    {event.location && <Detail icon={<MapPin size={13} />} label="Venue" value={event.location} />}
                    <Detail icon={<Clock3 size={13} />} label="Office / priority" value={`${event.department?.short_name || event.department?.name || 'Municipality'} · ${event.priority}`} />
                </dl>

                {event.description && <section className="border-t border-[var(--municipal-border)] pt-2.5">
                    <div className="text-[9px] font-bold uppercase tracking-wide text-[var(--municipal-muted)]">Details</div>
                    <p className="mt-1 whitespace-pre-wrap text-[11px] leading-5 text-[var(--municipal-muted)]">{event.description}</p>
                </section>}

                {event.action_url && <div className="flex justify-end border-t border-[var(--municipal-border)] pt-2.5">
                    <Link href={event.action_url} className="inline-flex min-h-8 items-center rounded-md bg-[var(--municipal-brand)] px-3 text-[10px] font-bold text-[var(--municipal-brand-contrast)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--municipal-focus)]">
                        Open record
                    </Link>
                </div>}
            </div>
        </>}
    </dialog>;
}

function timedSchedule(event: CalendarEvent): string {
    const start = `${formatDate(event.start_date, { month: 'long', day: 'numeric', year: 'numeric' })} · ${formatTime(event.start_time)}`;
    if (!event.ends_at) return start;
    if (!event.end_date || event.end_date === event.start_date) return `${start}${event.end_time ? ` – ${formatTime(event.end_time)}` : ''}`;
    return `${start} – ${formatDate(event.end_date, { month: 'long', day: 'numeric', year: 'numeric' })} · ${formatTime(event.end_time)}`;
}

function Detail({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
    return <div className="rounded-md border border-[var(--municipal-border)] bg-[var(--municipal-surface-subtle)] px-2.5 py-1.5">
        <dt className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide text-[var(--municipal-muted)]">{icon}{label}</dt>
        <dd className="mt-1 text-[11px] leading-4 text-[var(--municipal-text)]">{value}</dd>
    </div>;
}
