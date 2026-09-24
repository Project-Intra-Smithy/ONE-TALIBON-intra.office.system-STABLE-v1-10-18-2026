import type { CalendarEvent, DateOnly, EventOpenHandler } from './calendarTypes';
import { formatTime } from './calendarDate';

const bucketClass = {
    municipality: 'border-[var(--municipal-brand)]/25 bg-[var(--municipal-brand-soft)] text-[var(--municipal-brand-deep)] dark:text-[var(--municipal-brand-active)]',
    office: 'border-[var(--municipal-info)]/25 bg-[var(--municipal-status-blue-bg)] text-[var(--municipal-status-blue-text)]',
    personal: 'border-[var(--municipal-warning)]/25 bg-[var(--municipal-status-amber-bg)] text-[var(--municipal-status-amber-text)]',
};

export default function CalendarEventChip({ event, date, onOpen, compact = false }: { event: CalendarEvent; date: DateOnly; onOpen: EventOpenHandler; compact?: boolean }) {
    const endDate = event.end_date ?? event.start_date;
    const continuesBefore = date > event.start_date;
    const continuesAfter = date < endDate;
    const time = event.all_day || continuesBefore ? '' : formatTime(event.start_time);
    const priority = event.priority === 'urgent' || event.priority === 'high';

    return (
        <button
            type="button"
            onClick={(eventClick) => onOpen(event, eventClick.currentTarget)}
            className={`group flex w-full min-w-0 items-center gap-1 border px-1.5 text-left font-medium outline-none transition hover:brightness-95 focus-visible:ring-2 focus-visible:ring-[var(--municipal-focus)] ${bucketClass[event.calendar_bucket]} ${continuesBefore ? 'rounded-l-none border-l-0' : 'rounded-l-md'} ${continuesAfter ? 'rounded-r-none border-r-0' : 'rounded-r-md'} ${compact ? 'h-5 text-[10px]' : 'min-h-6 py-0.5 text-[11px]'}`}
            aria-label={`${event.title}${time ? `, ${time}` : ''}`}
        >
            {priority && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--municipal-danger)]" aria-hidden="true" />}
            {time && <span className="shrink-0 opacity-70">{time}</span>}
            <span className="truncate">{event.title}</span>
        </button>
    );
}
