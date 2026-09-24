import type { CalendarView, DateOnly } from './calendarTypes';

const pad = (value: number) => String(value).padStart(2, '0');

function parts(value: DateOnly) {
    const [year, month, day] = value.split('-').map(Number);
    return { year, month, day };
}

function utcDate(value: DateOnly): Date {
    const { year, month, day } = parts(value);
    return new Date(Date.UTC(year, month - 1, day));
}

function fromUtc(date: Date): DateOnly {
    return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

export function addDays(value: DateOnly, amount: number): DateOnly {
    const date = utcDate(value);
    date.setUTCDate(date.getUTCDate() + amount);
    return fromUtc(date);
}

export function addMonths(value: DateOnly, amount: number): DateOnly {
    const { year, month, day } = parts(value);
    const target = new Date(Date.UTC(year, month - 1 + amount, 1));
    const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
    target.setUTCDate(Math.min(day, lastDay));
    return fromUtc(target);
}

export function startOfMonth(value: DateOnly): DateOnly {
    const { year, month } = parts(value);
    return `${year}-${pad(month)}-01`;
}

export function startOfWeek(value: DateOnly): DateOnly {
    const date = utcDate(value);
    return addDays(value, -date.getUTCDay());
}

export function monthGridDates(anchor: DateOnly): DateOnly[] {
    const start = startOfWeek(startOfMonth(anchor));
    return Array.from({ length: 42 }, (_, index) => addDays(start, index));
}

export function weekDates(anchor: DateOnly): DateOnly[] {
    const start = startOfWeek(anchor);
    return Array.from({ length: 7 }, (_, index) => addDays(start, index));
}

export function sameMonth(left: DateOnly, right: DateOnly): boolean {
    return left.slice(0, 7) === right.slice(0, 7);
}

export function dateWithin(date: DateOnly, start: DateOnly, end: DateOnly): boolean {
    return date >= start && date <= end;
}

export function formatDate(value: DateOnly, options: Intl.DateTimeFormatOptions): string {
    return new Intl.DateTimeFormat('en-PH', { ...options, timeZone: 'UTC' }).format(utcDate(value));
}

export function formatTime(value?: string | null): string {
    if (!value) return '';
    const [hour, minute] = value.split(':').map(Number);
    const date = new Date(Date.UTC(2000, 0, 1, hour, minute));
    return new Intl.DateTimeFormat('en-PH', { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' }).format(date);
}

export function minutesFromTime(value?: string | null): number {
    if (!value) return 0;
    const [hour, minute] = value.split(':').map(Number);
    return (hour * 60) + minute;
}

export function shiftAnchor(view: CalendarView, anchor: DateOnly, direction: -1 | 1): DateOnly {
    if (view === 'month') return addMonths(anchor, direction);
    if (view === 'week') return addDays(anchor, direction * 7);
    if (view === 'schedule') return addDays(anchor, direction * 30);
    return addDays(anchor, direction);
}

export function calendarTitle(view: CalendarView, anchor: DateOnly): string {
    if (view === 'month') return formatDate(anchor, { month: 'long', year: 'numeric' });
    if (view === 'day') return formatDate(anchor, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    const end = addDays(startOfWeek(anchor), view === 'week' ? 6 : 30);
    const start = view === 'week' ? startOfWeek(anchor) : anchor;
    return `${formatDate(start, { month: 'short', day: 'numeric' })} – ${formatDate(end, { month: 'short', day: 'numeric', year: 'numeric' })}`;
}

export function currentCalendarTime(timezone: string): { date: DateOnly; minutes: number } {
    const values = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
        timeZone: timezone,
        year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    }).formatToParts(new Date()).filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]));
    return {
        date: `${values.year}-${values.month}-${values.day}`,
        minutes: (Number(values.hour) * 60) + Number(values.minute),
    };
}
