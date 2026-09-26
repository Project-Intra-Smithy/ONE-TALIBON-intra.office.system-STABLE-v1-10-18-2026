import { CalendarRange, ChevronLeft, ChevronRight } from 'lucide-react';
import { calendarTitle, shiftAnchor } from './calendarDate';
import type { CalendarMeta, CalendarView, DateOnly } from './calendarTypes';

export default function CalendarToolbar({ calendar, onNavigate, onView, onOpenSidebar }: { calendar: CalendarMeta; onNavigate: (date: DateOnly) => void; onView: (view: CalendarView) => void; onOpenSidebar: () => void }) {
    return (
        <header className="flex shrink-0 flex-wrap items-center gap-2 border-b border-[var(--municipal-border)] bg-[var(--municipal-surface)] px-3 py-2 sm:px-4">
            <button type="button" onClick={() => onNavigate(calendar.today)} className="min-h-11 rounded-lg border border-[var(--municipal-border-strong)] px-3 py-2 text-sm font-semibold hover:bg-[var(--municipal-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--municipal-focus)]">Today</button>
            <div className="flex items-center">
                <button type="button" onClick={() => onNavigate(shiftAnchor(calendar.view, calendar.anchor_date, -1))} className="min-h-11 min-w-11 rounded-lg p-2 hover:bg-[var(--municipal-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--municipal-focus)]" aria-label="Previous period"><ChevronLeft size={20} /></button>
                <button type="button" onClick={() => onNavigate(shiftAnchor(calendar.view, calendar.anchor_date, 1))} className="min-h-11 min-w-11 rounded-lg p-2 hover:bg-[var(--municipal-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--municipal-focus)]" aria-label="Next period"><ChevronRight size={20} /></button>
            </div>
            <h1 className="min-w-0 flex-1 truncate px-1 text-base font-semibold sm:text-lg">{calendarTitle(calendar.view, calendar.anchor_date)}</h1>
            <button type="button" onClick={onOpenSidebar} className="rounded-lg p-2 hover:bg-[var(--municipal-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--municipal-focus)] 2xl:hidden" aria-label="Open calendars"><CalendarRange size={20} /></button>
            <div className="hidden flex-wrap gap-1 sm:flex" aria-label="Calendar views">{(['month', 'week', 'day', 'schedule'] as CalendarView[]).map((view) => <button key={view} type="button" onClick={() => onView(view)} aria-pressed={calendar.view === view} className={`min-h-11 rounded-lg px-3 text-sm font-semibold ${calendar.view === view ? 'bg-[var(--municipal-brand)] text-[var(--municipal-surface)]' : 'hover:bg-[var(--municipal-hover)]'}`}>{view === 'schedule' ? 'List' : view.charAt(0).toUpperCase() + view.slice(1)}</button>)}</div>
            <label className="sr-only" htmlFor="calendar-view">Calendar view</label>
            <select id="calendar-view" value={calendar.view} onChange={(event) => onView(event.target.value as CalendarView)} className="sm:hidden rounded-lg border border-[var(--municipal-border-strong)] bg-[var(--municipal-surface)] px-3 py-2 text-sm font-semibold text-[var(--municipal-text)] focus:border-[var(--municipal-focus)] focus:outline-none">
                <option value="month">Month</option><option value="week">Week</option><option value="day">Day</option><option value="schedule">List</option>
            </select>
        </header>
    );
}
