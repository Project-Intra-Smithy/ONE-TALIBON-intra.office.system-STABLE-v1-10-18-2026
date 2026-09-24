import { useMemo } from 'react';
import { formatDate, formatTime } from './calendarDate';
import type { CalendarEvent, CalendarMeta, EventOpenHandler } from './calendarTypes';

export default function ScheduleCalendarView({ events, calendar, onEventOpen }: { events: CalendarEvent[]; calendar: CalendarMeta; onEventOpen: EventOpenHandler }) {
    const groups = useMemo(() => {
        const grouped = new Map<string, CalendarEvent[]>();
        events.forEach((event) => {
            const date = event.start_date < calendar.anchor_date ? calendar.anchor_date : event.start_date;
            grouped.set(date, [...(grouped.get(date) ?? []), event]);
        });
        return [...grouped.entries()].sort(([left], [right]) => left.localeCompare(right));
    }, [events, calendar.anchor_date]);

    return <div className="h-full min-h-0 overflow-y-auto bg-[var(--municipal-surface)] px-3 py-2 sm:px-6">{groups.map(([date, dayEvents]) => <section key={date} className="mx-auto max-w-4xl border-b border-[var(--municipal-border)] py-4"><h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--municipal-muted)]">{date === calendar.today ? 'Today · ' : ''}{formatDate(date, { weekday: 'long', month: 'long', day: 'numeric' })}</h2><div>{dayEvents.map((event) => <button key={event.id} type="button" onClick={(click) => onEventOpen(event, click.currentTarget)} className="grid w-full grid-cols-[78px_minmax(0,1fr)] gap-3 rounded-lg px-2 py-3 text-left outline-none hover:bg-[var(--municipal-hover)] focus-visible:ring-2 focus-visible:ring-[var(--municipal-focus)]"><div className="text-xs font-medium text-[var(--municipal-muted)]">{event.all_day ? 'All day' : formatTime(event.start_time)}</div><div className="min-w-0"><div className="font-semibold">{event.title}</div><div className="mt-0.5 text-xs text-[var(--municipal-muted)]">{event.department?.short_name || event.department?.name || 'Municipality'}{event.location ? ` · ${event.location}` : ''}</div></div></button>)}</div></section>)}{groups.length === 0 && <p className="mx-auto max-w-4xl py-10 text-sm text-[var(--municipal-muted)]">No events in this period.</p>}</div>;
}
