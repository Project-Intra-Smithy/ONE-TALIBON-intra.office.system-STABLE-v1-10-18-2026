import { Link } from '@inertiajs/react';
import { CalendarDays, Clock3, MapPin, X } from 'lucide-react';
import { useEffect, useRef } from 'react';
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
        : `${formatDate(event.start_date, { month: 'long', day: 'numeric', year: 'numeric' })} · ${formatTime(event.start_time)}${event.end_time ? ` – ${formatTime(event.end_time)}` : ''}`
        : '';

    return (
        <dialog ref={dialog} onCancel={(eventCancel) => { eventCancel.preventDefault(); close(); }} onClick={(eventClick) => { if (eventClick.target === dialog.current) close(); }} className="w-[min(92vw,430px)] rounded-xl border border-[var(--municipal-border)] bg-[var(--municipal-surface)] p-0 text-[var(--municipal-text)] shadow-2xl backdrop:bg-slate-950/35">
            {event && <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0"><h2 className="text-lg font-semibold leading-6">{event.title}</h2><div className="mt-1 text-xs capitalize text-[var(--municipal-muted)]">{event.event_type.replaceAll('_', ' ')}</div></div>
                    <button type="button" onClick={close} className="rounded-lg p-2 text-[var(--municipal-muted)] hover:bg-[var(--municipal-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--municipal-focus)]" aria-label="Close event details"><X size={18} /></button>
                </div>
                <dl className="mt-5 space-y-3 text-sm">
                    <Detail icon={<CalendarDays size={16} />} value={schedule} />
                    {event.location && <Detail icon={<MapPin size={16} />} value={event.location} />}
                    <Detail icon={<Clock3 size={16} />} value={`${event.department?.short_name || event.department?.name || 'Municipality'} · ${event.status.replaceAll('_', ' ')} · ${event.priority}`} />
                </dl>
                {event.description && <p className="mt-5 whitespace-pre-wrap border-t border-[var(--municipal-border)] pt-4 text-sm leading-6 text-[var(--municipal-muted)]">{event.description}</p>}
                {event.action_url && <div className="mt-5"><Link href={event.action_url} className="inline-flex rounded-lg bg-[var(--municipal-brand)] px-4 py-2 text-sm font-semibold text-[var(--municipal-brand-contrast)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--municipal-focus)]">Open record</Link></div>}
            </div>}
        </dialog>
    );
}

function Detail({ icon, value }: { icon: React.ReactNode; value: string }) {
    return <div className="flex gap-3"><dt className="mt-0.5 text-[var(--municipal-muted)]">{icon}</dt><dd className="min-w-0 capitalize">{value}</dd></div>;
}
