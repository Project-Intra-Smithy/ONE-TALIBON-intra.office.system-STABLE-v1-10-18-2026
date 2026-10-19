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
import { useState, useId, useEffect, useRef } from 'react';
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

    const modalId = useId();
    const dialogRef = useRef<HTMLDialogElement>(null);

    useEffect(() => {
        setSelectedDate(anchor);
    }, [anchor]);

    useEffect(() => {
        if (!activeEvent) return;
        const trigger = document.activeElement as HTMLElement | null;
        dialogRef.current?.showModal();
        return () => trigger?.focus();
    }, [activeEvent]);

    const navigateTo = (newView: string, newDate: string) => {
        router.get(`/calendar?view=${newView}&date=${encodeURIComponent(newDate)}`, {}, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const navigatePeriod = (direction: -1 | 1) => {
        const currentDate = new Date(`${selectedDate}T00:00:00Z`);
        if (Number.isNaN(currentDate.getTime())) return;

        if (view === 'month' || view === 'schedule') {
            currentDate.setUTCDate(1);
            currentDate.setUTCMonth(currentDate.getUTCMonth() + direction);
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
            <PageFrame width="standard">
                <PageHeader
                    eyebrow="Shared municipal calendar"
                    title="Events, deadlines & schedules"
                    description="A single operational view of visible office events, routed-work deadlines, and schedules available within your current access."
                    icon={CalendarDays}
                />

                {/* Range summary */}
                <section aria-label="Calendar range" className="municipal-panel p-4 sm:p-5">
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
                                            : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:bg-[#142236] dark:text-slate-200'
                                    }`}
                                >
                                    {option}
                                </Link>
                            ))}
                        </nav>
                    </div>
                </section>

                {/* Google Calendar-Style Workspace */}
                <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-[#142236]">
                    {/* Google Calendar Toolbar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4 dark:border-slate-700 sm:px-6">
                        <div className="flex min-w-0 flex-wrap items-center gap-3">
                            <button
                                type="button"
                                onClick={() => {
                                    setSelectedDate(today);
                                    navigateTo(view, today);
                                }}
                                className="inline-flex shrink-0 whitespace-nowrap min-h-[44px] items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-800 shadow-sm transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 dark:border-slate-600 dark:bg-[#142236] dark:text-slate-100"
                            >
                                Today
                            </button>
                            <div className="inline-flex shrink-0 items-center rounded-lg border border-slate-300 bg-white dark:border-slate-600 dark:bg-[#142236]">
                                <button
                                    type="button"
                                    onClick={() => navigatePeriod(-1)}
                                    aria-label="Previous calendar month"
                                    className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 dark:text-slate-200"
                                >
                                    <ChevronLeft size={20} aria-hidden="true" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => navigatePeriod(1)}
                                    aria-label="Next calendar month"
                                    className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center border-l border-slate-200 text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 dark:border-slate-700 dark:text-slate-200"
                                >
                                    <ChevronRight size={20} aria-hidden="true" />
                                </button>
                            </div>
                            <h2 className="ml-2 text-xl font-bold tracking-tight text-slate-900 dark:text-white" aria-live="polite">
                                {monthTitle}
                            </h2>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                                <span className="sr-only sm:not-sr-only">Choose date</span>
                                <input
                                    type="date"
                                    aria-label="Choose date"
                                    value={selectedDate}
                                    onChange={(e) => {
                                        if (e.target.value) {
                                            setSelectedDate(e.target.value);
                                            navigateTo(view, e.target.value);
                                        }
                                    }}
                                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-800 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 dark:border-slate-600 dark:bg-[#142236] dark:text-slate-100"
                                />
                            </label>

                            <div className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                                {selectedDate === today ? (
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#145a43] dark:bg-emerald-950/40 dark:text-emerald-300">
                                        <span className="h-2 w-2 rounded-full bg-[#145a43]" /> Today
                                    </span>
                                ) : (
                                    <span>Selected: {selectedDate}</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* View: Month View Grid (Desktop) / Compact List (Mobile) */}
                    {view === 'month' && (
                        <div className="p-3 sm:p-5">
                            {/* Desktop 7-Column Grid */}
                            <div className="hidden sm:block">
                                <div className="grid grid-cols-7 border-b border-slate-200 text-center text-xs font-bold uppercase tracking-wider text-slate-500 dark:border-slate-700 dark:text-slate-400">
                                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                                        <div key={day} className="py-2.5">
                                            {day}
                                        </div>
                                    ))}
                                </div>
                                <div className="grid grid-cols-7 border-l border-t border-slate-200 dark:border-slate-700">
                                    {Array.from({ length: firstWeekday }, (_, i) => (
                                        <div
                                            key={`blank-${i}`}
                                            className="min-h-[105px] border-b border-r border-slate-200 bg-slate-50/50 p-2 dark:border-slate-700 dark:bg-slate-900/20"
                                        />
                                    ))}
                                    {daysInMonth.map((day) => {
                                        const dayEvents = eventsByDate.get(day) ?? [];
                                        const isToday = day === today;
                                        const isSelected = day === selectedDate;
                                        const dayNumber = Number(day.slice(-2));

                                        return (
                                            <div
                                                key={day}
                                                tabIndex={0}
                                                role="button"
                                                aria-label={`${day}, ${dayEvents.length} events`}
                                                onClick={() => setSelectedDate(day)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' || e.key === ' ') {
                                                        e.preventDefault();
                                                        setSelectedDate(day);
                                                    }
                                                }}
                                                className={`group min-h-[115px] border-b border-r border-slate-200 p-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-1 dark:border-slate-700 ${
                                                    isSelected
                                                        ? 'bg-emerald-50/60 ring-2 ring-inset ring-[#145a43] dark:bg-emerald-950/30'
                                                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span
                                                        className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                                                            isToday
                                                                ? 'bg-[#145a43] text-white'
                                                                : 'text-slate-800 dark:text-slate-200'
                                                        }`}
                                                    >
                                                        {dayNumber}
                                                    </span>
                                                    {dayEvents.length > 0 && (
                                                        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                                                            {dayEvents.length}
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="mt-1.5 space-y-1">
                                                    {dayEvents.slice(0, 3).map((event) => (
                                                        <button
                                                            type="button"
                                                            key={event.id}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setActiveEvent(event);
                                                            }}
                                                            className={`block w-full truncate rounded border px-1.5 py-0.5 text-left text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 ${getEventChipClass(
                                                                event.priority
                                                            )}`}
                                                        >
                                                            {event.starts_at && !event.all_day && (
                                                                <span className="mr-1 opacity-75">
                                                                    {formatTimeOnly(event.starts_at, timezone)}
                                                                </span>
                                                            )}
                                                            {event.title}
                                                        </button>
                                                    ))}
                                                    {dayEvents.length > 3 && (
                                                        <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                                                            +{dayEvents.length - 3} more
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Mobile Agenda / Date Picker (< 768px) */}
                            <div className="block sm:hidden">
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-200">
                                    Jump to date
                                    <input
                                        type="date"
                                        value={selectedDate}
                                        onChange={(e) => {
                                            const val = dateKey(e.target.value, timezone);
                                            if (val) setSelectedDate(val);
                                        }}
                                        className="mt-1 block min-h-[44px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 focus:border-[#145a43] focus:ring-2 focus:ring-[#145a43]/20 dark:border-slate-600 dark:bg-[#142236] dark:text-slate-100"
                                    />
                                </label>

                                <div className="mt-4">
                                    <div className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                                        Days with events in {monthTitle}
                                    </div>
                                    <div className="flex gap-2 overflow-x-auto pb-2">
                                        {daysInMonth.map((day) => {
                                            const count = (eventsByDate.get(day) ?? []).length;
                                            const isSelected = day === selectedDate;
                                            const isToday = day === today;
                                            const dayNum = Number(day.slice(-2));

                                            return (
                                                <button
                                                    type="button"
                                                    key={day}
                                                    aria-pressed={isSelected}
                                                    onClick={() => setSelectedDate(day)}
                                                    className={`inline-flex min-h-[50px] min-w-[50px] flex-col items-center justify-center rounded-xl border p-2 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 ${
                                                        isSelected
                                                            ? 'border-[#145a43] bg-[#145a43] text-white shadow-sm'
                                                            : 'border-slate-200 bg-white text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100'
                                                    }`}
                                                >
                                                    <span className="text-xs font-semibold">
                                                        {new Date(`${day}T00:00:00Z`).toLocaleDateString('en-US', {
                                                            weekday: 'narrow',
                                                            timeZone: 'UTC',
                                                        })}
                                                    </span>
                                                    <span className="text-base font-extrabold">{dayNum}</span>
                                                    {count > 0 && (
                                                        <span
                                                            className={`h-1.5 w-1.5 rounded-full ${
                                                                isSelected ? 'bg-emerald-300' : 'bg-[#145a43]'
                                                            }`}
                                                        />
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* View: Week / Day / Schedule View presentation */}
                    {view !== 'month' && (
                        <div className="p-4 sm:p-6">
                            <div className="space-y-3">
                                {safeEvents.length > 0 ? (
                                    safeEvents.map((event) => (
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
                                            className="flex flex-col justify-between gap-3 rounded-xl border border-slate-200 p-4 transition-colors hover:border-[#145a43] hover:bg-slate-50/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 sm:flex-row sm:items-center dark:border-slate-700 dark:bg-slate-800/40 dark:hover:bg-slate-800"
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
                                                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                                        {humanize(event.event_type)}
                                                    </span>
                                                    {event.all_day && (
                                                        <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                                                            All day
                                                        </span>
                                                    )}
                                                </div>
                                                <h3 className="mt-2 text-base font-bold text-slate-900 dark:text-white">
                                                    {event.title}
                                                </h3>
                                                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                                                    {formatDate(event.starts_at, timezone)}
                                                    {event.ends_at && ` – ${formatDate(event.ends_at, timezone)}`}
                                                    {event.location && ` • ${event.location}`}
                                                </p>
                                            </div>
                                            {event.action_url && (
                                                <Link
                                                    href={event.action_url}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-600 dark:bg-[#142236] dark:text-slate-200"
                                                >
                                                    Open <ExternalLink size={15} aria-hidden="true" />
                                                </Link>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <p className="py-8 text-center text-base text-slate-500">
                                        No calendar events are visible in this range.
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Selected Day Agenda Drawer / Section (for Month view) */}
                {view === 'month' && (
                    <section aria-label={`Events on ${selectedDate}`} className="municipal-panel p-4 sm:p-5">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3 dark:border-slate-700">
                            <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                Events on {selectedDate} ({selectedDayEvents.length})
                            </h3>
                            <span className="text-xs font-semibold text-slate-500">
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
                                                className="inline-flex min-h-[40px] items-center gap-1.5 self-start rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 sm:self-center dark:border-slate-600 dark:bg-[#142236] dark:text-slate-200"
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

            {/* Google Calendar-Style Event Details Dialog */}
            {activeEvent && (
                <dialog
                    ref={dialogRef}
                    onCancel={() => setActiveEvent(null)}
                    onKeyDown={(event) => {
                        if (event.key !== 'Tab') return;
                        const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), a[href]'));
                        const first = controls[0], last = controls[controls.length - 1];
                        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
                        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
                    }}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby={`${modalId}-title`}
                    className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-2xl border-0 bg-transparent p-0 backdrop:bg-slate-950/60"
                >
                    <div
                        className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-[#142236]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-start justify-between gap-3">
                            <span
                                className={`rounded-full border px-3 py-1 text-xs font-bold uppercase ${getPriorityBadgeClass(
                                    activeEvent.priority
                                )}`}
                            >
                                {humanize(activeEvent.priority)} • {humanize(activeEvent.event_type)}
                            </span>
                            <button
                                type="button"
                                onClick={() => setActiveEvent(null)}
                                aria-label="Close event details"
                                className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-800"
                            >
                                <X size={20} aria-hidden="true" />
                            </button>
                        </div>

                        <h2 id={`${modalId}-title`} className="mt-4 text-xl font-extrabold text-slate-900 dark:text-white">
                            {activeEvent.title}
                        </h2>

                        <div className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300">
                            <div className="flex items-center gap-2.5">
                                <Clock size={16} className="text-[#145a43] dark:text-emerald-400" aria-hidden="true" />
                                <span>
                                    {formatDate(activeEvent.starts_at, timezone)}
                                    {activeEvent.ends_at && ` to ${formatDate(activeEvent.ends_at, timezone)}`}
                                    {activeEvent.all_day && ' (All day)'}
                                </span>
                            </div>

                            {activeEvent.location && (
                                <div className="flex items-center gap-2.5">
                                    <MapPin size={16} className="text-[#145a43] dark:text-emerald-400" aria-hidden="true" />
                                    <span>{activeEvent.location}</span>
                                </div>
                            )}

                            {activeEvent.department && (
                                <div className="flex items-center gap-2.5">
                                    <Tag size={16} className="text-[#145a43] dark:text-emerald-400" aria-hidden="true" />
                                    <span>{activeEvent.department.name}</span>
                                </div>
                            )}

                            {activeEvent.description && (
                                <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-4 leading-relaxed dark:border-slate-700 dark:bg-slate-800/60">
                                    {activeEvent.description}
                                </div>
                            )}
                        </div>

                        <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-700">
                            <button
                                type="button"
                                onClick={() => setActiveEvent(null)}
                                className="inline-flex min-h-[44px] items-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200"
                            >
                                Close
                            </button>
                            {activeEvent.action_url && (
                                <Link
                                    href={activeEvent.action_url}
                                    className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-[#145a43] px-5 py-2 text-sm font-bold text-white shadow transition-colors hover:bg-[#0e4331]"
                                >
                                    Open Related Work <ExternalLink size={15} aria-hidden="true" />
                                </Link>
                            )}
                        </div>
                    </div>
                </dialog>
            )}
        </AppLayout>
    );
}
