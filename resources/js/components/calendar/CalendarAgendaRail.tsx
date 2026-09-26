import { CalendarDays, Clock3, MapPin } from 'lucide-react';
import type { CalendarEvent, CalendarMeta, EventOpenHandler } from './calendarTypes';

export default function CalendarAgendaRail({ events, calendar, onEventOpen }: { events: CalendarEvent[]; calendar: CalendarMeta; onEventOpen: EventOpenHandler }) {
    const ordered = [...events].sort((a, b) => a.starts_at.localeCompare(b.starts_at));
    const groups = [
        { title: 'Today', items: ordered.filter((event) => event.start_date <= calendar.today && (event.end_date || event.start_date) >= calendar.today).slice(0, 4) },
        { title: 'Upcoming', items: ordered.filter((event) => event.start_date > calendar.today).slice(0, 5) },
    ];
    return <aside className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-1" aria-label="Calendar agenda">
        {groups.map(({ title, items }) => <section key={title} className="municipal-panel min-w-0 overflow-hidden"><header className="flex items-center gap-2 border-b border-[var(--municipal-border)] bg-[var(--municipal-brand-soft)] p-3 text-[var(--municipal-brand)]"><CalendarDays size={17} aria-hidden="true" /><h2 className="text-sm font-bold">{title}</h2></header><div className="divide-y divide-[var(--municipal-border)]">{items.map((event) => <button key={event.id} type="button" onClick={(click) => onEventOpen(event, click.currentTarget)} className="block min-h-11 w-full min-w-0 p-3 text-left hover:bg-[var(--municipal-hover)]"><div className="break-words text-sm font-semibold leading-5">{event.title}</div><div className="mt-2 flex items-start gap-1.5 text-xs text-[var(--municipal-muted)]"><Clock3 size={13} className="shrink-0" aria-hidden="true" />{event.start_date} · {event.all_day ? 'All day' : event.start_time || new Date(event.starts_at).toLocaleTimeString('en-PH', { timeZone: calendar.timezone, hour: 'numeric', minute: '2-digit' })}</div>{event.location && <div className="mt-1 flex items-start gap-1.5 text-xs text-[var(--municipal-muted)]"><MapPin size={13} className="shrink-0" aria-hidden="true" />{event.location}</div>}</button>)}{!items.length && <p className="p-4 text-sm leading-6 text-[var(--municipal-muted)]">No {title.toLowerCase()} events in the displayed calendar range.</p>}</div></section>)}
    </aside>;
}
