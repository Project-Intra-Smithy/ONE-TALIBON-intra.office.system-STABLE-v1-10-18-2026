import { CalendarDays, Clock3, MapPin } from 'lucide-react';
import type { CalendarEvent, CalendarMeta, EventOpenHandler } from './calendarTypes';

export default function CalendarAgendaRail({ events, calendar, onEventOpen }: { events: CalendarEvent[]; calendar: CalendarMeta; onEventOpen: EventOpenHandler }) {
    const ordered = [...events].sort((a, b) => a.starts_at.localeCompare(b.starts_at));
    const groups = [
        { title: 'Today', items: ordered.filter((event) => event.start_date <= calendar.today && (event.end_date || event.start_date) >= calendar.today).slice(0, 4) },
        { title: 'Upcoming', items: ordered.filter((event) => event.start_date > calendar.today).slice(0, 5) },
    ];

    return <aside className="grid min-w-0 gap-2 sm:grid-cols-2 xl:grid-cols-1" aria-label="Calendar agenda">
        {groups.map(({ title, items }) => <section key={title} className="municipal-panel min-w-0 overflow-hidden">
            <header className="flex min-h-9 items-center gap-2 border-b border-[var(--municipal-border)] px-2.5 text-[var(--municipal-brand)]"><CalendarDays size={14} aria-hidden="true" /><h2 className="text-xs font-bold">{title}</h2></header>
            <div className="divide-y divide-[var(--municipal-border)]">
                {items.map((event) => <button key={event.id} type="button" onClick={(click) => onEventOpen(event, click.currentTarget)} className="block min-h-10 w-full min-w-0 px-2.5 py-2 text-left hover:bg-[var(--municipal-hover)]">
                    <div className="break-words text-[11px] font-semibold leading-4">{event.title}</div>
                    <div className="mt-1 flex items-start gap-1 text-[9px] text-[var(--municipal-muted)]"><Clock3 size={10} className="shrink-0" aria-hidden="true" />{event.start_date} / {event.all_day ? 'All day' : event.start_time || new Date(event.starts_at).toLocaleTimeString('en-PH', { timeZone: calendar.timezone, hour: 'numeric', minute: '2-digit' })}</div>
                    {event.location && <div className="mt-0.5 flex items-start gap-1 text-[9px] text-[var(--municipal-muted)]"><MapPin size={10} className="shrink-0" aria-hidden="true" />{event.location}</div>}
                </button>)}
                {!items.length && <p className="p-2.5 text-[10px] leading-4 text-[var(--municipal-muted)]">No {title.toLowerCase()} events in the displayed calendar range.</p>}
            </div>
        </section>)}
    </aside>;
}
