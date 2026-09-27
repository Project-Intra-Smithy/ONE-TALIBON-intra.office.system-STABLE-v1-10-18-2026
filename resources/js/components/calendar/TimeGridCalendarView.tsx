import { useEffect, useMemo, useRef, useState } from 'react';
import CalendarEventChip from './CalendarEventChip';
import { currentCalendarTime, formatDate, formatTime } from './calendarDate';
import { eventsForDate, positionTimedEvents } from './calendarLayout';
import type { CalendarEvent, CalendarMeta, DateOnly, EventOpenHandler } from './calendarTypes';

const DAY_HEIGHT = 1440;
const HOURS = Array.from({ length: 24 }, (_, hour) => hour);

export default function TimeGridCalendarView({ days, events, calendar, onEventOpen }: { days: DateOnly[]; events: CalendarEvent[]; calendar: CalendarMeta; onEventOpen: EventOpenHandler }) {
    const scroll = useRef<HTMLDivElement>(null);
    const headerScroll = useRef<HTMLDivElement>(null);
    const allDayScroll = useRef<HTMLDivElement>(null);
    const [now, setNow] = useState(() => currentCalendarTime(calendar.timezone));
    const columns = `64px repeat(${days.length}, minmax(${days.length === 1 ? '0' : '96px'}, 1fr))`;
    const minWidth = days.length === 1 ? '100%' : `${64 + days.length * 96}px`;

    useEffect(() => { scroll.current?.scrollTo({ top: 7 * 60 + 30 }); }, [days.join('|')]);
    useEffect(() => {
        const update = () => setNow(currentCalendarTime(calendar.timezone));
        const interval = window.setInterval(update, 60_000); return () => window.clearInterval(interval);
    }, [calendar.timezone]);

    const allDayByDate = useMemo(() => new Map(days.map((day) => [day, eventsForDate(events, day).filter((event) => event.all_day)])), [days, events]);
    const syncHorizontalScroll = () => {
        const left = scroll.current?.scrollLeft ?? 0;
        if (headerScroll.current) headerScroll.current.scrollLeft = left;
        if (allDayScroll.current) allDayScroll.current.scrollLeft = left;
    };

    return <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[var(--municipal-surface)]">
        <div ref={headerScroll} className="shrink-0 overflow-hidden border-b border-[var(--municipal-border)]"><div className="grid" style={{ gridTemplateColumns: columns, minWidth }}><div />{days.map((day) => <div key={day} className={`border-l border-[var(--municipal-border)] px-2 py-2 text-center ${day === calendar.today ? 'bg-[var(--municipal-brand-soft)]' : ''}`}><div className="text-[10px] font-semibold uppercase tracking-wide text-[var(--municipal-muted)]">{formatDate(day, { weekday: 'short' })}</div><div className={`mx-auto mt-1 flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${day === calendar.today ? 'bg-[var(--municipal-brand)] text-white' : ''}`}>{Number(day.slice(8))}</div></div>)}</div></div>
        <div ref={allDayScroll} className="max-h-28 shrink-0 overflow-hidden border-b border-[var(--municipal-border)]"><div className="grid" style={{ gridTemplateColumns: columns, minWidth }}><div className="px-2 py-2 text-[10px] font-semibold uppercase text-[var(--municipal-muted)]">All day</div>{days.map((day) => <div key={day} className="min-h-10 space-y-1 overflow-y-auto border-l border-[var(--municipal-border)] p-1">{(allDayByDate.get(day) ?? []).map((event) => <CalendarEventChip key={`${day}-${event.id}`} event={event} date={day} onOpen={onEventOpen} compact />)}</div>)}</div></div>
        <div ref={scroll} onScroll={syncHorizontalScroll} className="min-h-0 flex-1 overflow-auto overscroll-contain">
            <div className="grid" style={{ gridTemplateColumns: columns, minWidth }}>
                <div className="relative border-r border-[var(--municipal-border)]" style={{ height: DAY_HEIGHT }}>{HOURS.map((hour) => <div key={hour} className="absolute right-2 -translate-y-1/2 text-[10px] text-[var(--municipal-muted)]" style={{ top: hour * 60 }}>{hour === 0 ? '' : formatTime(`${String(hour).padStart(2, '0')}:00`)}</div>)}</div>
                {days.map((day) => <TimedDay key={day} day={day} events={events} now={now} calendar={calendar} onEventOpen={onEventOpen} />)}
            </div>
        </div>
    </div>;
}

function TimedDay({ day, events, now, calendar, onEventOpen }: { day: DateOnly; events: CalendarEvent[]; now: { date: DateOnly; minutes: number }; calendar: CalendarMeta; onEventOpen: EventOpenHandler }) {
    const positioned = positionTimedEvents(eventsForDate(events, day).filter((event) => !event.all_day), day);
    return <div className={`relative border-r border-[var(--municipal-border)] ${day === calendar.today ? 'bg-[var(--municipal-brand-soft)]/20' : ''}`} style={{ height: DAY_HEIGHT }}>{HOURS.map((hour) => <div key={hour} className="absolute inset-x-0 border-t border-[var(--municipal-border)]/70" style={{ top: hour * 60 }} />)}{positioned.map((item) => <div key={item.event.id} className="absolute z-10 px-0.5" style={{ top: item.top, height: item.height, left: `${item.left}%`, width: `${item.width}%` }}><CalendarEventChip event={item.event} date={day} onOpen={onEventOpen} /></div>)}{now.date === day && <div className="pointer-events-none absolute inset-x-0 z-20 border-t-2 border-[var(--municipal-danger)]" style={{ top: now.minutes }}><span className="absolute -left-1 -top-1.5 h-3 w-3 rounded-full bg-[var(--municipal-danger)]" /></div>}</div>;
}
