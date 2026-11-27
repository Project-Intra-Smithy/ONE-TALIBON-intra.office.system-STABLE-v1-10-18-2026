import CalendarMonthView from '../../components/calendar/CalendarMonthView';
import CalendarToolbar from '../../components/calendar/CalendarDateToolbar';
import CalendarEventDetails from '../../components/calendar/CalendarEventDetails';
import { Link, router } from '@inertiajs/react';
import {
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    Clock,
    ExternalLink,
    MapPin,
    Tag,
    X,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import PageFrame from '../../components/PageFrame';
import PageHeader from '../../components/PageHeader';
import { calendarAnchor } from '../../compat/uiContracts';
import { dateKey, monthDays } from '../../components/dashboard/schedulePresentation';
import AppLayout from '../../layouts/AppLayout';
import WorkspaceUnavailable from '../../components/WorkspaceUnavailable';

export type CalendarEvent = {
    id: number;
    event_key: string;
    event_type: string;
    title: string;
    description?: string | null;
    priority: string;
    starts_at: string;
    ends_at?: string | null;
    all_day: boolean;
    location?: string | null;
    action_url?: string | null;
    status: string;
    department?: { code: string; name: string; short_name?: string | null } | null;
};

export type Calendar = {
    view: 'month' | 'week' | 'day' | 'schedule';
    anchor_date: string;
    today: string;
    range_start: string;
    range_end: string;
    timezone: string;
};

const formatDate = (value: string, timezone?: string) =>
    Number.isNaN(Date.parse(value))
        ? 'Date unavailable'
        : new Date(value).toLocaleString([], {
              timeZone: timezone,
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
          });

const formatTimeOnly = (value: string, timezone?: string) =>
    Number.isNaN(Date.parse(value))
        ? ''
        : new Date(value).toLocaleTimeString([], {
              timeZone: timezone,
              hour: 'numeric',
              minute: '2-digit',
          });

const humanize = (value: string) =>
    value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

const dateOnly = (value: string, timezone: string) => dateKey(value, timezone);

const dateSequence = (start: string, end: string) => {
    const dates: string[] = [];
    const cursor = new Date(`${start}T00:00:00Z`);
    const last = new Date(`${end}T00:00:00Z`);

    while (!Number.isNaN(cursor.getTime()) && cursor <= last && dates.length < 42) {
        dates.push(cursor.toISOString().slice(0, 10));
        cursor.setUTCDate(cursor.getUTCDate() + 1);
    }

    return dates;
};

const eventOccursOn = (event: CalendarEvent, day: string, timezone: string) => {
    const start = dateOnly(event.starts_at, timezone);
    const end = dateOnly(event.ends_at ?? event.starts_at, timezone);
    return Boolean(start && end && start <= day && end >= day);
};

const dateHeading = (day: string, options: Intl.DateTimeFormatOptions) =>
    new Date(`${day}T00:00:00Z`).toLocaleDateString('en-US', { ...options, timeZone: 'UTC' });

function EventButton({
    event,
    timezone,
    onOpen,
    chipClass,
    compact = false,
}: {
    event: CalendarEvent;
    timezone: string;
    onOpen: (event: CalendarEvent) => void;
    chipClass: string;
    compact?: boolean;
}) {
    return <div className={`aj-calendar-event rounded-lg border px-3 py-2 ${chipClass}`}>
        <button
            type="button"
            onClick={() => onOpen(event)}
            className="w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
            aria-label={`Open ${event.title} details`}
        >
            <span className={`${compact ? 'text-xs' : 'text-sm'} block font-bold`}>{event.title}</span>
            <span className="mt-0.5 block text-xs opacity-80">
                {event.all_day ? 'All day' : formatTimeOnly(event.starts_at, timezone)}
                {event.location ? ` • ${event.location}` : ''}
            </span>
        </button>
        {event.action_url && !compact && <Link
            href={event.action_url}
            className="mt-2 inline-flex min-h-[36px] items-center gap-1 text-xs font-bold underline decoration-transparent underline-offset-2 hover:decoration-current focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
        >
            Open <ExternalLink size={13} aria-hidden="true" />
        </Link>}
    </div>;
}

export default function CalendarIndex({
    events,
    calendar,
}: {
    events: CalendarEvent[];
    calendar: Calendar;
}) {
    if (!Array.isArray(events) || !calendar) return <WorkspaceUnavailable title="Calendar" />;

    return <CalendarWorkspace events={events} calendar={calendar} />;
}

function CalendarWorkspace({ events, calendar }: { events: CalendarEvent[]; calendar: Calendar }) {
    const view = ['month', 'week', 'day', 'schedule'].includes(calendar?.view)
        ? calendar.view
        : 'month';
    const timezone = calendar?.timezone || 'Asia/Manila';
    const anchor = calendarAnchor(calendar?.anchor_date, calendar?.today) ?? calendar?.today ?? new Date().toISOString().slice(0, 10);
    const today = calendar?.today ?? new Date().toISOString().slice(0, 10);
    const safeEvents = Array.isArray(events) ? events : [];

    const [selectedDate, setSelectedDate] = useState<string>(anchor);
    const [activeEvent, setActiveEvent] = useState<CalendarEvent | null>(null);


    useEffect(() => {
        setSelectedDate(anchor);
    }, [anchor]);


    const navigateTo = (newView: string, newDate: string) => {
        router.get(`/calendar?view=${newView}&date=${encodeURIComponent(newDate)}`, {}, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const navigatePeriod = (direction: -1 | 1) => {
        const currentDate = new Date(`${selectedDate}T00:00:00Z`);
        if (Number.isNaN(currentDate.getTime())) return;

        if (view === 'month') {
            currentDate.setUTCDate(1);
            currentDate.setUTCMonth(currentDate.getUTCMonth() + direction);
        } else if (view === 'schedule') {
            currentDate.setUTCDate(currentDate.getUTCDate() + direction * 31);
        } else if (view === 'week') {
            currentDate.setUTCDate(currentDate.getUTCDate() + direction * 7);
        } else if (view === 'day') {
            currentDate.setUTCDate(currentDate.getUTCDate() + direction);
        }

        const nextDateStr = currentDate.toISOString().slice(0, 10);
        setSelectedDate(nextDateStr);
        navigateTo(view, nextDateStr);
    };

    const daysInMonth = monthDays(selectedDate);
    const firstWeekday = daysInMonth.length
        ? new Date(`${daysInMonth[0]}T00:00:00Z`).getUTCDay()
        : 0;

    const monthTitle = daysInMonth.length
        ? new Date(`${daysInMonth[0]}T00:00:00Z`).toLocaleDateString('en-US', {
              month: 'long',
              year: 'numeric',
              timeZone: 'UTC',
          })
        : 'Calendar';

    const rangeStart = dateOnly(calendar.range_start, timezone) ?? anchor;
    const rangeEnd = dateOnly(calendar.range_end, timezone) ?? anchor;
    const rangeDays = dateSequence(rangeStart, rangeEnd);
    const periodTitle = view === 'month'
        ? monthTitle
        : view === 'day'
          ? dateHeading(anchor, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
          : `${dateHeading(rangeStart, { month: 'short', day: 'numeric', year: 'numeric' })} – ${dateHeading(rangeEnd, { month: 'short', day: 'numeric', year: 'numeric' })}`;
    const periodName = view === 'month' ? 'calendar month' : view === 'schedule' ? 'schedule window' : view;

    // Group events by YYYY-MM-DD
    const eventsByDate = new Map<string, CalendarEvent[]>();
    for (const event of safeEvents) {
        const startKey = dateKey(event.starts_at, timezone);
        if (startKey) {
            const list = eventsByDate.get(startKey) ?? [];
            list.push(event);
            eventsByDate.set(startKey, list);
        }
    }

    const selectedDayEvents = eventsByDate.get(selectedDate) ?? [];

    const getPriorityBadgeClass = (priority: string) => {
        switch (priority) {
            case 'urgent':
                return 'bg-rose-100 text-rose-900 border-rose-300 dark:bg-rose-950/60 dark:text-rose-200';
            case 'high':
                return 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-200';
            default:
                return 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-200';
        }
    };

    const getEventChipClass = (priority: string) => {
        switch (priority) {
            case 'urgent':
                return 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-200';
            case 'high':
                return 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-200';
            default:
                return 'bg-emerald-50 text-[#145a43] border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-200';
        }
    };

    return (
        <AppLayout workspaceRefinement title="Calendar">
            <PageFrame width="wide" density="comfortable" className="aj-calendar mx-auto max-w-[1440px] px-4 py-5 sm:px-6">
                <PageHeader
                    eyebrow="Shared municipal calendar"
                    title="Events, deadlines & schedules"
                    description="A single operational view of visible office events, routed-work deadlines, and schedules available within your current access."
                    icon={CalendarDays}
                />

                {/* Range summary */}
                <section aria-label="Calendar range" className="municipal-panel hidden p-4 sm:block sm:p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <div className="text-base font-semibold">
                                {safeEvents.length} visible event{safeEvents.length === 1 ? '' : 's'} in this range
                            </div>
                            <div className="text-sm text-slate-500 dark:text-slate-400">
                                {calendar?.range_start ? formatDate(calendar.range_start, timezone) : 'Range unavailable'} —{' '}
                                {calendar?.range_end ? formatDate(calendar.range_end, timezone) : 'Range unavailable'} •{' '}
                                {timezone}
                            </div>
                        </div>
                        <nav aria-label="Calendar views" className="flex flex-wrap gap-2">
                            {(['month', 'week', 'day', 'schedule'] as const).map((option) => (
                                <Link
                                    key={option}
                                    href={`/calendar?view=${option}${anchor ? `&date=${encodeURIComponent(anchor)}` : ''}`}
                                    aria-current={view === option ? 'page' : undefined}
                                    className={`inline-flex min-h-[44px] items-center rounded-lg px-4 py-2 text-sm font-semibold capitalize transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 ${
                                        view === option
                                            ? 'bg-[#145a43] text-white shadow-sm'
                                            : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:bg-[var(--surface-card)] dark:text-slate-200'
                                    }`}
                                >
                                    {option}
                                </Link>
                            ))}
                        </nav>
                    </div>
                </section>

                {/* Google Calendar-Style Workspace */}
                <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-[var(--surface-card)]">
                    <CalendarToolbar view={periodName} title={periodTitle} date={selectedDate} onDate={date => { setSelectedDate(date); navigateTo(view, date); }} onToday={() => { setSelectedDate(today); navigateTo(view, today); }} onPrevious={() => navigatePeriod(-1)} onNext={() => navigatePeriod(1)} />

                    {/* View: Month View Grid (Desktop) / Compact List (Mobile) */}
                    {view === 'month' && <CalendarMonthView events={safeEvents} calendar={calendar} anchor={selectedDate} selectedDay={selectedDate} onSelectDay={setSelectedDate} onSelectEvent={setActiveEvent} onNavigate={navigateTo} />}

                    {view === 'week' && (
                        <section aria-label={`Week of ${rangeStart}`} data-calendar-view="week" className="overflow-x-auto p-3 sm:p-5">
                            <div className="grid min-w-[760px] grid-cols-7 divide-x divide-slate-200 rounded-xl border border-slate-200 dark:divide-slate-700 dark:border-slate-700">
                                {rangeDays.map((day) => {
                                    const dayEvents = safeEvents.filter((event) => eventOccursOn(event, day, timezone));
                                    const allDay = dayEvents.filter((event) => event.all_day);
                                    const timed = dayEvents.filter((event) => !event.all_day);
                                    return <section key={day} aria-label={`${day}, ${dayEvents.length} events`} className={day === today ? 'bg-emerald-50/60 dark:bg-emerald-950/20' : ''}>
                                        <button type="button" onClick={() => navigateTo('day', day)} className="min-h-[64px] w-full border-b border-slate-200 px-2 py-3 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-700 dark:border-slate-700">
                                            <span className="block text-xs font-bold uppercase text-slate-500">{dateHeading(day, { weekday: 'short' })}</span>
                                            <span className="mt-1 block text-lg font-extrabold text-slate-900 dark:text-white">{dateHeading(day, { day: 'numeric' })}</span>
                                        </button>
                                        <div className="min-h-[260px] space-y-3 p-2">
                                            {allDay.length > 0 && <div aria-label="All-day events" className="space-y-1 border-b border-slate-200 pb-2 dark:border-slate-700">
                                                {allDay.map((event) => <EventButton key={event.id} event={event} timezone={timezone} compact onOpen={setActiveEvent} chipClass={getEventChipClass(event.priority)} />)}
                                            </div>}
                                            <div aria-label="Timed events" className="space-y-1.5">
                                                {timed.map((event) => <EventButton key={event.id} event={event} timezone={timezone} compact onOpen={setActiveEvent} chipClass={getEventChipClass(event.priority)} />)}
                                            </div>
                                            {dayEvents.length === 0 && <p className="py-5 text-center text-xs text-slate-400">No events</p>}
                                        </div>
                                    </section>;
                                })}
                            </div>
                        </section>
                    )}

                    {view === 'day' && (
                        <section aria-label={`Day agenda for ${anchor}`} data-calendar-view="day" className="p-4 sm:p-6">
                            {(() => {
                                const dayEvents = safeEvents.filter((event) => eventOccursOn(event, anchor, timezone));
                                const allDay = dayEvents.filter((event) => event.all_day);
                                const timed = dayEvents.filter((event) => !event.all_day);
                                return <div className="space-y-5">
                                    <div>
                                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">All-day events</h3>
                                        <div className="mt-2 space-y-2">{allDay.length ? allDay.map((event) => <EventButton key={event.id} event={event} timezone={timezone} onOpen={setActiveEvent} chipClass={getEventChipClass(event.priority)} />) : <p className="text-sm text-slate-500">No all-day events.</p>}</div>
                                    </div>
                                    <div>
                                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Timed agenda</h3>
                                        <div className="mt-2 divide-y divide-slate-200 border-y border-slate-200 dark:divide-slate-700 dark:border-slate-700">{timed.length ? timed.map((event) => <div key={event.id} className="grid grid-cols-[6rem_1fr] gap-3 py-3 sm:grid-cols-[8rem_1fr]"><time className="text-sm font-bold text-[#145a43] dark:text-emerald-300">{formatTimeOnly(event.starts_at, timezone)}</time><EventButton event={event} timezone={timezone} onOpen={setActiveEvent} chipClass={getEventChipClass(event.priority)} /></div>) : <p className="py-6 text-center text-sm text-slate-500">No timed events.</p>}</div>
                                    </div>
                                </div>;
                            })()}
                        </section>
                    )}

                    {view === 'schedule' && (
                        <section aria-label={`${rangeStart} through ${rangeEnd} schedule`} data-calendar-view="schedule" className="p-4 sm:p-6">
                            <div className="space-y-6">
                                {rangeDays.filter((day) => safeEvents.some((event) => eventOccursOn(event, day, timezone))).map((day) => {
                                    const dayEvents = safeEvents.filter((event) => eventOccursOn(event, day, timezone));
                                    return <section key={day} aria-labelledby={`schedule-${day}`} className="grid gap-3 sm:grid-cols-[11rem_1fr]">
                                        <h3 id={`schedule-${day}`} className="text-sm font-extrabold text-slate-900 dark:text-white">{dateHeading(day, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</h3>
                                        <div className="space-y-2">{dayEvents.map((event) => <EventButton key={event.id} event={event} timezone={timezone} onOpen={setActiveEvent} chipClass={getEventChipClass(event.priority)} />)}</div>
                                    </section>;
                                })}
                                {!safeEvents.length && <p className="py-8 text-center text-base text-slate-500">No calendar events are visible in this 31-day schedule.</p>}
                            </div>
                        </section>
                    )}
                </div>

                {/* Selected Day Agenda Drawer / Section (for Month view) */}
                {view === 'month' && (
                    <section aria-label={`Events on ${selectedDate}`} className="municipal-panel p-4 sm:p-5">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3 dark:border-slate-700">
                            <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                Events on {selectedDate} ({selectedDayEvents.length})
                            </h3>
                            <span className="text-xs font-semibold text-[var(--ink-secondary)]">
                                Click an event for complete details
                            </span>
                        </div>

                        <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-700">
                            {selectedDayEvents.length > 0 ? (
                                selectedDayEvents.map((event) => (
                                    <div
                                        key={event.id}
                                        tabIndex={0}
                                        role="button"
                                        onClick={() => setActiveEvent(event)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault();
                                                setActiveEvent(event);
                                            }
                                        }}
                                        className="group flex flex-col justify-between gap-2 py-3.5 sm:flex-row sm:items-center cursor-pointer transition-colors hover:bg-slate-50 px-2 rounded-lg dark:hover:bg-slate-800/40"
                                    >
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span
                                                    className={`rounded-full border px-2.5 py-0.5 text-xs font-bold uppercase ${getPriorityBadgeClass(
                                                        event.priority
                                                    )}`}
                                                >
                                                    {humanize(event.priority)}
                                                </span>
                                                <span className="text-xs font-semibold uppercase text-slate-500">
                                                    {humanize(event.event_type)}
                                                </span>
                                            </div>
                                            <div className="mt-1.5 font-bold text-slate-900 group-hover:text-[#145a43] dark:text-white dark:group-hover:text-emerald-300">
                                                {event.title}
                                            </div>
                                            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                {formatDate(event.starts_at, timezone)}
                                                {event.location ? ` • ${event.location}` : ''}
                                            </div>
                                        </div>
                                        {event.action_url && (
                                            <Link
                                                href={event.action_url}
                                                onClick={(e) => e.stopPropagation()}
                                                className="inline-flex min-h-[40px] items-center gap-1.5 self-start rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 sm:self-center dark:border-slate-600 dark:bg-[var(--surface-card)] dark:text-slate-200"
                                            >
                                                Open <ExternalLink size={13} aria-hidden="true" />
                                            </Link>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <p className="py-4 text-sm text-slate-500 dark:text-slate-400">
                                    No events scheduled on this date.
                                </p>
                            )}
                        </div>
                    </section>
                )}

                {/* Canonical Schedule List Section (Preserved for tests & full overview) */}
                <section aria-label="Calendar schedule" className="municipal-panel overflow-hidden">
                    <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-700 sm:px-5 sm:py-4">
                        <h2 className="font-bold text-slate-950 dark:text-slate-100">Schedule</h2>
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-slate-700">
                        {safeEvents.map((event) => (
                            <article
                                key={event.id}
                                className="flex min-w-0 flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"
                            >
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span
                                            className={`rounded-full border px-2.5 py-1 text-xs font-bold uppercase ${getPriorityBadgeClass(
                                                event.priority
                                            )}`}
                                        >
                                            {humanize(event.priority)}
                                        </span>
                                        <span className="break-words text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                                            {humanize(event.event_type)}
                                        </span>
                                        {event.status !== 'scheduled' && (
                                            <span className="text-xs font-semibold uppercase text-emerald-700 dark:text-emerald-300">
                                                {humanize(event.status)}
                                            </span>
                                        )}
                                    </div>
                                    <div className="mt-2 break-words font-bold text-slate-950 dark:text-slate-100">
                                        {event.title}
                                    </div>
                                    <div className="mt-1 break-words text-sm text-slate-500 dark:text-slate-400 sm:text-base">
                                        {formatDate(event.starts_at, timezone)}
                                        {event.department
                                            ? ` • ${event.department.short_name || event.department.name}`
                                            : ''}
                                    </div>
                                    {event.ends_at && (
                                        <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                                            Ends {formatDate(event.ends_at, timezone)}
                                        </div>
                                    )}
                                    {event.all_day && <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">All day</div>}
                                    {event.location && (
                                        <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                                            Location: {event.location}
                                        </div>
                                    )}
                                    {event.description && (
                                        <div className="mt-1 break-words text-sm leading-6 text-slate-600 dark:text-slate-300">
                                            {event.description}
                                        </div>
                                    )}
                                </div>
                                {event.action_url && (
                                    <Link
                                        href={event.action_url}
                                        className="shrink-0 rounded-xl border border-slate-300 px-4 py-2 text-center text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                                    >
                                        Open
                                    </Link>
                                )}
                            </article>
                        ))}
                        {safeEvents.length === 0 && (
                            <div className="municipal-empty m-4 text-base">
                                No calendar events are visible in this range.
                            </div>
                        )}
                    </div>
                </section>
            </PageFrame>

            <CalendarEventDetails event={activeEvent} timezone={timezone} onClose={() => setActiveEvent(null)} />
        </AppLayout>
    );
}
