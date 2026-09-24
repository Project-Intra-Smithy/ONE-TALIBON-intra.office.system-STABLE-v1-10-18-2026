import MiniCalendar from './MiniCalendar';
import type { CalendarBucket, CalendarEvent, CalendarFilters, CalendarMeta, DateOnly } from './calendarTypes';

const calendars: { key: CalendarBucket; label: string; className: string }[] = [
    { key: 'municipality', label: 'Municipality', className: 'accent-[var(--municipal-brand)]' },
    { key: 'office', label: 'My Office', className: 'accent-[var(--municipal-info)]' },
    { key: 'personal', label: 'My Events', className: 'accent-[var(--municipal-warning)]' },
];

export default function CalendarSidebar({ calendar, events, filters, onToggle, onSelectDate }: { calendar: CalendarMeta; events: CalendarEvent[]; filters: CalendarFilters; onToggle: (bucket: CalendarBucket) => void; onSelectDate: (date: DateOnly) => void }) {
    return <aside className="flex h-full min-h-0 w-[260px] shrink-0 flex-col gap-6 overflow-y-auto bg-[var(--municipal-surface)] p-4 text-[var(--municipal-text)]">
        <MiniCalendar anchor={calendar.anchor_date} today={calendar.today} events={events} onSelect={onSelectDate} />
        <section><h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--municipal-muted)]">Calendars</h2><div className="space-y-1">{calendars.map((item) => <label key={item.key} className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-sm hover:bg-[var(--municipal-hover)]"><input type="checkbox" checked={filters[item.key]} onChange={() => onToggle(item.key)} className={`h-4 w-4 rounded ${item.className}`} /><span>{item.label}</span></label>)}</div></section>
    </aside>;
}
