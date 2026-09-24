import { dateWithin, minutesFromTime } from './calendarDate';
import type { CalendarEvent, DateOnly } from './calendarTypes';

export type PositionedCalendarEvent = { event: CalendarEvent; top: number; height: number; left: number; width: number };

export function eventsForDate(events: CalendarEvent[], date: DateOnly): CalendarEvent[] {
    return events
        .filter((event) => dateWithin(date, event.start_date, event.end_date ?? event.start_date))
        .sort((left, right) => {
            const leftRank = left.all_day || (left.end_date ?? left.start_date) !== left.start_date ? 0 : 1;
            const rightRank = right.all_day || (right.end_date ?? right.start_date) !== right.start_date ? 0 : 1;
            return leftRank - rightRank || (left.start_time ?? '').localeCompare(right.start_time ?? '') || left.id - right.id;
        });
}

function interval(event: CalendarEvent, date: DateOnly): { start: number; end: number } {
    const startsToday = event.start_date === date;
    const endsToday = (event.end_date ?? event.start_date) === date;
    const start = startsToday ? minutesFromTime(event.start_time) : 0;
    let end = endsToday && event.end_time ? minutesFromTime(event.end_time) : 1440;
    if (!event.ends_at && startsToday) end = Math.min(1440, start + 30);
    if (end <= start) end = Math.min(1440, start + 30);
    return { start, end };
}

export function positionTimedEvents(events: CalendarEvent[], date: DateOnly): PositionedCalendarEvent[] {
    const sorted = events.map((event) => ({ event, ...interval(event, date) })).sort((a, b) => a.start - b.start || a.end - b.end || a.event.id - b.event.id);
    const groups: typeof sorted[] = []; let group: typeof sorted = []; let groupEnd = -1;
    sorted.forEach((item) => {
        if (group.length && item.start >= groupEnd) { groups.push(group); group = []; groupEnd = -1; }
        group.push(item); groupEnd = Math.max(groupEnd, item.end);
    });
    if (group.length) groups.push(group);

    return groups.flatMap((items) => {
        const columnEnds: number[] = [];
        const assignments = items.map((item) => {
            let column = columnEnds.findIndex((end) => end <= item.start);
            if (column === -1) column = columnEnds.length;
            columnEnds[column] = item.end; return { ...item, column };
        });
        const columns = Math.max(1, columnEnds.length);
        return assignments.map(({ event, start, end, column }) => ({ event, top: start, height: Math.max(24, end - start), left: (column / columns) * 100, width: 100 / columns }));
    });
}
