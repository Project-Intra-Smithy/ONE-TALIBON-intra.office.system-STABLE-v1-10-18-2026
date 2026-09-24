import { weekDates } from './calendarDate';
import MonthCalendarView from './MonthCalendarView';
import ScheduleCalendarView from './ScheduleCalendarView';
import TimeGridCalendarView from './TimeGridCalendarView';
import type { CalendarEvent, CalendarMeta, DateOnly, EventOpenHandler } from './calendarTypes';

export default function CalendarCanvas({ events, calendar, onDateSelect, onEventOpen }: { events: CalendarEvent[]; calendar: CalendarMeta; onDateSelect: (date: DateOnly) => void; onEventOpen: EventOpenHandler }) {
    if (calendar.view === 'month') return <MonthCalendarView events={events} calendar={calendar} onDateSelect={onDateSelect} onEventOpen={onEventOpen} />;
    if (calendar.view === 'schedule') return <ScheduleCalendarView events={events} calendar={calendar} onEventOpen={onEventOpen} />;
    const days = calendar.view === 'week' ? weekDates(calendar.anchor_date) : [calendar.anchor_date];
    return <TimeGridCalendarView days={days} events={events} calendar={calendar} onEventOpen={onEventOpen} />;
}
