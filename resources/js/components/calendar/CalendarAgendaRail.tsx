import { Link } from '@inertiajs/react';
import { ArrowRight, CalendarDays, Clock3, MapPin } from 'lucide-react';
import type { CalendarEvent, CalendarMeta, EventOpenHandler } from './calendarTypes';

export default function CalendarAgendaRail({ events, calendar, onEventOpen }: { events: CalendarEvent[]; calendar: CalendarMeta; onEventOpen: EventOpenHandler }) {
    const ordered = [...events].sort((a, b) => a.starts_at.localeCompare(b.starts_at));
    const today = ordered
        .filter((event) => event.start_date <= calendar.today && (event.end_date || event.start_date) >= calendar.today)
        .slice(0, 3);
    const upcoming = ordered
        .filter((event) => event.start_date > calendar.today)
        .slice(0, 5);

    return <aside className="municipal-panel min-w-0 self-start overflow-hidden" aria-label="Calendar agenda">
        <header className="flex min-h-9 items-center gap-2 border-b border-[var(--municipal-border)] px-2.5 text-[var(--municipal-brand)]">
            <CalendarDays size={14} aria-hidden="true" />
            <h2 className="text-xs font-bold">Agenda</h2>
        </header>

        <AgendaSection title="Today" items={today} calendar={calendar} onEventOpen={onEventOpen} />
        <AgendaSection title="Upcoming" items={upcoming} calendar={calendar} onEventOpen={onEventOpen} />

        <Link href="/meetings" className="flex min-h-9 items-center justify-between border-t border-[var(--municipal-border)] px-2.5 text-[10px] font-bold text-[var(--municipal-brand)] hover:bg-[var(--municipal-hover)]">
            View meetings
            <ArrowRight size={12} aria-hidden="true" />
        </Link>
    </aside>;
}

function AgendaSection({
    title,
    items,
    calendar,
    onEventOpen,
}: {
    title: string;
    items: CalendarEvent[];
    calendar: CalendarMeta;
    onEventOpen: EventOpenHandler;
}) {
    return <section>
        <div className="border-b border-[var(--municipal-border)] bg-[var(--municipal-surface-subtle)] px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-wide text-[var(--municipal-muted)]">
            {title}
        </div>
        <div className="divide-y divide-[var(--municipal-border)]">
            {items.map((event) => <button
                key={event.id}
                type="button"
                onClick={(click) => onEventOpen(event, click.currentTarget)}
                className="block w-full min-w-0 px-2.5 py-2 text-left hover:bg-[var(--municipal-hover)]"
            >
                <div className="line-clamp-2 text-[10px] font-semibold leading-4 text-[var(--municipal-text)]">{event.title}</div>
                <div className="mt-0.5 flex items-center gap-1 text-[9px] leading-3 text-[var(--municipal-muted)]">
                    <Clock3 size={9} className="shrink-0" aria-hidden="true" />
                    <span>{event.start_date} · {event.all_day ? 'All day' : event.start_time || new Date(event.starts_at).toLocaleTimeString('en-PH', { timeZone: calendar.timezone, hour: 'numeric', minute: '2-digit' })}</span>
                </div>
                {event.location && <div className="mt-0.5 flex items-start gap-1 text-[9px] leading-3 text-[var(--municipal-muted)]">
                    <MapPin size={9} className="mt-0.5 shrink-0" aria-hidden="true" />
                    <span className="line-clamp-1">{event.location}</span>
                </div>}
            </button>)}
            {!items.length && <p className="px-2.5 py-3 text-[9px] leading-4 text-[var(--municipal-muted)]">No {title.toLowerCase()} events.</p>}
        </div>
    </section>;
}
