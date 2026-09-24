import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { addDays, addMonths, formatDate, monthGridDates, sameMonth, startOfMonth } from './calendarDate';
import type { CalendarEvent, DateOnly } from './calendarTypes';

const weekdays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function MiniCalendar({ anchor, today, events, onSelect }: { anchor: DateOnly; today: DateOnly; events: CalendarEvent[]; onSelect: (date: DateOnly) => void }) {
    const [month, setMonth] = useState(startOfMonth(anchor));
    useEffect(() => setMonth(startOfMonth(anchor)), [anchor]);
    const dates = useMemo(() => monthGridDates(month), [month]);
    const eventDates = useMemo(() => new Set(events.flatMap((event) => {
        const dates: DateOnly[] = [];
        for (let cursor = event.start_date; cursor <= (event.end_date ?? event.start_date) && dates.length < 42; cursor = addDays(cursor, 1)) dates.push(cursor);
        return dates;
    })), [events]);

    return <section aria-label="Mini calendar">
        <div className="mb-2 flex items-center justify-between"><div className="text-sm font-semibold">{formatDate(month, { month: 'long', year: 'numeric' })}</div><div className="flex"><button type="button" onClick={() => setMonth(addMonths(month, -1))} className="rounded p-1.5 hover:bg-[var(--municipal-hover)]" aria-label="Previous month"><ChevronLeft size={16}/></button><button type="button" onClick={() => setMonth(addMonths(month, 1))} className="rounded p-1.5 hover:bg-[var(--municipal-hover)]" aria-label="Next month"><ChevronRight size={16}/></button></div></div>
        <div className="grid grid-cols-7 text-center text-[10px] font-semibold text-[var(--municipal-muted)]">{weekdays.map((day, index) => <div key={`${day}-${index}`} className="py-1">{day}</div>)}</div>
        <div className="grid grid-cols-7">{dates.map((date) => {
            const selected = date === anchor; const isToday = date === today; const inMonth = sameMonth(date, month);
            return <button key={date} type="button" onClick={() => onSelect(date)} className={`relative mx-auto my-0.5 flex h-8 w-8 items-center justify-center rounded-full text-xs outline-none focus-visible:ring-2 focus-visible:ring-[var(--municipal-focus)] ${selected ? 'bg-[var(--municipal-brand)] text-white' : isToday ? 'bg-[var(--municipal-brand-soft)] font-bold text-[var(--municipal-brand-active)]' : inMonth ? 'hover:bg-[var(--municipal-hover)]' : 'text-[var(--municipal-muted)] opacity-55'}`} aria-current={isToday ? 'date' : undefined}>{Number(date.slice(8))}{eventDates.has(date) && !selected && <span className="absolute bottom-0.5 h-1 w-1 rounded-full bg-[var(--municipal-brand)]" />}</button>;
        })}</div>
    </section>;
}
