import { useState } from 'react';
import { dateKey, intervalPosition, monthDays } from './schedulePresentation';

type Event = { id: number; title: string; starts_at: string; ends_at?: string | null; all_day: boolean };
type Props = { events: Event[]; anchor: string | null; timezone: string; rangeStart?: string; rangeEnd?: string };

export default function ScheduleCalendar({ events, anchor, timezone, rangeStart, rangeEnd }: Props) {
    const displayTime = (value: string) => {
        if (!dateKey(value, timezone)) return 'Date unavailable';
        if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
        return new Intl.DateTimeFormat('en-PH', { timeZone: timezone, dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
    };
    const [selected, setSelected] = useState(anchor ?? '');
    const days = monthDays(selected);
    const selectedEvents = events.filter(event => {
        const start = dateKey(event.starts_at, timezone);
        const end = event.ends_at ? dateKey(event.ends_at, timezone) : start;
        return start && end && start <= selected && end >= selected;
    });
    const firstWeekday = days.length ? new Date(`${days[0]}T00:00:00Z`).getUTCDay() : 0;
    const monthLabel = days.length ? new Date(`${days[0]}T00:00:00Z`).toLocaleDateString('en-PH', { month: 'long', year: 'numeric', timeZone: 'UTC' }) : 'Choose a date';
    const moveMonth = (offset: number) => {
        if (!selected) return;
        const date = new Date(`${selected.slice(0, 7)}-01T00:00:00Z`);
        date.setUTCMonth(date.getUTCMonth() + offset);
        setSelected(date.toISOString().slice(0, 10));
    };
    return <section className="municipal-panel p-5 sm:p-6" aria-labelledby="schedule-calendar-title">
        <h2 id="schedule-calendar-title" className="text-xl font-bold">Calendar & timeline</h2>
        <p className="mt-2 text-base text-slate-600 dark:text-slate-300">Browse dates within the loaded schedule. Other dates may need a new calendar range.</p>
        <div className="mt-5 grid gap-7 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
            <div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <button type="button" className="workspace-button" onClick={() => moveMonth(-1)} disabled={!selected} aria-label="Previous calendar month">Previous</button>
                    <h3 className="font-semibold" aria-live="polite">{monthLabel}</h3>
                    <button type="button" className="workspace-button" onClick={() => moveMonth(1)} disabled={!selected} aria-label="Next calendar month">Next</button>
                </div>
                <label className="mt-4 block">Choose date<input type="date" value={selected} onChange={event => setSelected(dateKey(event.target.value) ?? '')} className="mt-2 block w-full rounded border border-slate-400 bg-transparent px-3" /></label>
                <div className="mt-4 hidden sm:block">
                    <div className="workspace-calendar-days" aria-hidden="true">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => <span key={day}>{day}</span>)}</div>
                    <div className="workspace-calendar-days" aria-label={monthLabel}>
                        {Array.from({ length: firstWeekday }, (_, i) => <span key={`blank-${i}`} />)}
                        {days.map(day => {
                            const count = events.filter(event => dateKey(event.starts_at, timezone) === day).length;
                            return <button type="button" key={day} aria-pressed={day === selected} data-has-events={count > 0} aria-label={`${day}, ${count} loaded event starts`} onClick={() => setSelected(day)}>{Number(day.slice(-2))}</button>;
                        })}
                    </div>
                    <p className="mt-3 text-sm">Underlined dates have loaded event starts.</p>
                </div>
                <div className="mt-5 border-t border-slate-200 pt-4" aria-live="polite">
                    <h3 className="font-semibold">Events on {selected || 'selected date'}</h3>
                    {selectedEvents.length ? <ul className="mt-3 space-y-3">{selectedEvents.map(event => <li key={event.id}>{event.title}{event.all_day ? ' · All day' : ''}</li>)}</ul> : <p className="mt-2">No loaded events for this date.</p>}
                </div>
            </div>
            <div>
                <h3 className="text-lg font-semibold">Scheduled durations</h3>
                <p className="mt-2 text-sm">Bars use recorded start and end times in the loaded range. No completion or dependencies are inferred.</p>
                <div className="mt-4 flex flex-wrap justify-between gap-2 text-sm"><span>From {rangeStart ? dateKey(rangeStart, timezone) : 'unavailable'}</span><span>To {rangeEnd ? dateKey(rangeEnd, timezone) : 'unavailable'}</span></div>
                <ul className="mt-4 space-y-5">
                    {events.map(event => {
                        const position = rangeStart && rangeEnd ? intervalPosition(event.starts_at, event.ends_at, rangeStart, rangeEnd) : null;
                        return <li key={event.id} className="border-t border-slate-200 pt-4">
                            <div className="font-semibold">{event.title}</div>
                            <div className="mt-1 text-sm">{displayTime(event.starts_at)}{event.ends_at ? ` to ${displayTime(event.ends_at)}` : ' · End not recorded'} · {timezone}</div>
                            {position ? <div className="workspace-timeline-track" aria-hidden="true"><span className="workspace-timeline-bar" style={{ left: `${position.left}%`, width: `${position.width}%` }} /></div> : <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Duration unavailable in this range.</p>}
                        </li>;
                    })}
                </ul>
                {!events.length && <p className="municipal-empty mt-4">No scheduled events supplied.</p>}
            </div>
        </div>
    </section>;
}
