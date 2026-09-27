import { CalendarRange, ChevronLeft, ChevronRight } from 'lucide-react';
import { calendarTitle, shiftAnchor } from './calendarDate';
import type { CalendarMeta, CalendarView, DateOnly } from './calendarTypes';

export default function CalendarToolbar({ calendar, onNavigate, onView, onOpenSidebar }: { calendar: CalendarMeta; onNavigate: (date: DateOnly) => void; onView: (view: CalendarView) => void; onOpenSidebar: () => void }) {
    return (
        <header className="flex shrink-0 flex-wrap items-center gap-0.5 border-b border-[var(--municipal-border)] bg-[var(--municipal-surface)] px-2 py-1 sm:px-2.5">
            <button type="button" onClick={() => onNavigate(calendar.today)} className="min-h-8 rounded-md border border-[var(--municipal-border-strong)] px-2 text-[10px] font-semibold hover:bg-[var(--municipal-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--municipal-focus)]">Today</button>
            <div className="flex items-center">
                <button type="button" onClick={() => onNavigate(shiftAnchor(calendar.view, calendar.anchor_date, -1))} className="min-h-8 min-w-8 rounded-md p-1 hover:bg-[var(--municipal-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--municipal-focus)]" aria-label="Previous period"><ChevronLeft size={17} /></button>
                <button type="button" onClick={() => onNavigate(shiftAnchor(calendar.view, calendar.anchor_date, 1))} className="min-h-8 min-w-8 rounded-md p-1 hover:bg-[var(--municipal-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--municipal-focus)]" aria-label="Next period"><ChevronRight size={17} /></button>
            </div>
            <h1 className="min-w-0 flex-1 truncate px-1.5 text-[13px] font-semibold sm:text-sm">{calendarTitle(calendar.view, calendar.anchor_date)}</h1>
            <button type="button" onClick={onOpenSidebar} className="min-h-8 min-w-8 rounded-md p-1.5 hover:bg-[var(--municipal-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--municipal-focus)] 2xl:hidden" aria-label="Open calendars"><CalendarRange size={17} /></button>
            <div className="hidden flex-wrap gap-0.5 sm:flex" aria-label="Calendar views">{(['month', 'week', 'day', 'schedule'] as CalendarView[]).map((view) => <button key={view} type="button" onClick={() => onView(view)} aria-pressed={calendar.view === view} className={`min-h-8 rounded-md px-2 text-[10px] font-semibold ${calendar.view === view ? 'bg-[var(--municipal-brand)] text-[var(--municipal-brand-contrast)]' : 'hover:bg-[var(--municipal-hover)]'}`}>{view === 'schedule' ? 'List' : view.charAt(0).toUpperCase() + view.slice(1)}</button>)}</div>
            <label className="sr-only" htmlFor="calendar-view">Calendar view</label>
            <select id="calendar-view" value={calendar.view} onChange={(event) => onView(event.target.value as CalendarView)} className="min-h-8 rounded-md border border-[var(--municipal-border-strong)] bg-[var(--municipal-surface)] px-2 text-[10px] font-semibold text-[var(--municipal-text)] focus:border-[var(--municipal-focus)] focus:outline-none sm:hidden">
                <option value="month">Month</option><option value="week">Week</option><option value="day">Day</option><option value="schedule">List</option>
            </select>
        </header>
    );
}
