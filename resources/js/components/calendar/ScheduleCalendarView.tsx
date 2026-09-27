import { useMemo } from 'react';
import { ArrowRight, MapPin } from 'lucide-react';
import { formatDate, formatTime } from './calendarDate';
import type { CalendarEvent, CalendarMeta, EventOpenHandler } from './calendarTypes';

export default function ScheduleCalendarView({ events, calendar, onEventOpen }: { events: CalendarEvent[]; calendar: CalendarMeta; onEventOpen: EventOpenHandler }) {
    const ordered = useMemo(
        () => [...events].sort((a, b) => a.starts_at.localeCompare(b.starts_at)),
        [events],
    );

    return <div className="h-full min-h-0 overflow-y-auto bg-[var(--municipal-surface)]">
        <div className="sticky top-0 z-10 hidden grid-cols-[105px_78px_minmax(240px,1.2fr)_minmax(180px,.8fr)_24px] gap-2 border-b border-[var(--municipal-border)] bg-[var(--municipal-surface-subtle)] px-3 py-1.5 text-[9px] font-bold uppercase tracking-wide text-[var(--municipal-muted)] md:grid">
            <div>Date</div>
            <div>Time</div>
            <div>Event / office</div>
            <div>Venue</div>
            <div></div>
        </div>

        <div className="divide-y divide-[var(--municipal-border)]">
            {ordered.map((event) => <button
                key={event.id}
                type="button"
                onClick={(click) => onEventOpen(event, click.currentTarget)}
                className="grid w-full min-w-0 gap-1.5 px-3 py-2 text-left outline-none hover:bg-[var(--municipal-hover)] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--municipal-focus)] md:grid-cols-[105px_78px_minmax(240px,1.2fr)_minmax(180px,.8fr)_24px] md:items-center md:gap-2"
            >
                <div className="text-[10px] font-semibold text-[var(--municipal-text)]">{formatDate(event.start_date, { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                <div className="text-[10px] text-[var(--municipal-muted)]">{event.all_day ? 'All day' : formatTime(event.start_time)}</div>
                <div className="min-w-0">
                    <div className="text-[11px] font-semibold leading-4 text-[var(--municipal-text)]">{event.title}</div>
                    <div className="mt-0.5 text-[9px] leading-3 text-[var(--municipal-muted)]">{event.department?.short_name || event.department?.name || 'Municipality'}</div>
                </div>
                <div className="min-w-0 text-[10px] text-[var(--municipal-muted)]">
                    <div className="flex items-start gap-1">
                        <MapPin size={10} className="mt-0.5 shrink-0" aria-hidden="true" />
                        <span className="line-clamp-2">{event.location || '—'}</span>
                    </div>
                </div>
                <ArrowRight size={12} className="justify-self-end text-[var(--municipal-brand)]" aria-hidden="true" />
            </button>)}
            {ordered.length === 0 && <p className="px-3 py-8 text-center text-[11px] text-[var(--municipal-muted)]">No events in this period.</p>}
        </div>
    </div>;
}
