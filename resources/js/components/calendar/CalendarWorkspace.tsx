import { router } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import CalendarCanvas from './CalendarCanvas';
import CalendarEventPopover from './CalendarEventPopover';
import CalendarSidebar from './CalendarSidebar';
import CalendarToolbar from './CalendarToolbar';
import type { CalendarBucket, CalendarEvent, CalendarFilters, CalendarMeta, CalendarView, DateOnly } from './calendarTypes';

type EventSelection = { event: CalendarEvent; origin: HTMLElement } | null;

export default function CalendarWorkspace({ events, calendar }: { events: CalendarEvent[]; calendar: CalendarMeta }) {
    const [filters, setFilters] = useState<CalendarFilters>({ municipality: true, office: true, personal: true });
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [selection, setSelection] = useState<EventSelection>(null);
    const visibleEvents = useMemo(() => events.filter((event) => filters[event.calendar_bucket]), [events, filters]);

    const navigate = (date: DateOnly, view: CalendarView = calendar.view, replace = false) => {
        setSidebarOpen(false); setSelection(null);
        router.get('/calendar', { view, date }, { preserveState: true, preserveScroll: true, replace, only: ['events', 'calendar'] });
    };
    const toggle = (bucket: CalendarBucket) => setFilters((current) => ({ ...current, [bucket]: !current[bucket] }));

    return <div className="-mx-3 h-[calc(100dvh-7.75rem)] min-h-0 overflow-hidden border-y border-[var(--municipal-border)] bg-[var(--municipal-surface)] text-[var(--municipal-text)] sm:mx-auto sm:max-w-[1700px] sm:rounded-xl sm:border sm:shadow-sm">
        <div className="flex h-full min-h-0 flex-col"><CalendarToolbar calendar={calendar} onNavigate={(date) => navigate(date)} onView={(view) => navigate(calendar.anchor_date, view, true)} onOpenSidebar={() => setSidebarOpen(true)} />
            <div className="relative flex min-h-0 flex-1"><div className="hidden h-full border-r border-[var(--municipal-border)] lg:block"><CalendarSidebar calendar={calendar} events={events} filters={filters} onToggle={toggle} onSelectDate={(date) => navigate(date)} /></div><main className="min-h-0 min-w-0 flex-1 overflow-hidden bg-[var(--municipal-surface)]"><CalendarCanvas events={visibleEvents} calendar={calendar} onDateSelect={(date) => navigate(date)} onEventOpen={(event, origin) => setSelection({ event, origin })} /></main>
                {sidebarOpen && <div className="absolute inset-0 z-30 flex lg:hidden"><button type="button" className="absolute inset-0 bg-slate-950/35" onClick={() => setSidebarOpen(false)} aria-label="Close calendars"/><div className="relative z-10 h-full border-r border-[var(--municipal-border)] shadow-xl"><CalendarSidebar calendar={calendar} events={events} filters={filters} onToggle={toggle} onSelectDate={(date) => navigate(date)} /></div></div>}
            </div>
        </div><CalendarEventPopover event={selection?.event ?? null} origin={selection?.origin ?? null} onClose={() => setSelection(null)} />
    </div>;
}
