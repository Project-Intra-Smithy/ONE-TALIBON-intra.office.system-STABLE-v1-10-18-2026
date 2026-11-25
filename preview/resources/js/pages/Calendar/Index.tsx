import { Link, router } from '@inertiajs/react';
import { CalendarDays, ChevronLeft, ChevronRight, Clock, ExternalLink, MapPin } from 'lucide-react';
import { useId, useMemo, useState } from 'react';
import { calendarAnchor } from '../../compat/uiContracts';
import { dateKey, monthDays } from '../../components/dashboard/schedulePresentation';
import { DateInput, Dialog, EmptyState, PageHeader, StatusBadge, toneForWorkState } from '../../components/ui';
import WorkspaceUnavailable from '../../components/WorkspaceUnavailable';
import AppLayout from '../../layouts/AppLayout';
import { formatDatePH, formatDateTimePH, humanizeSlug } from '../../lib/format';

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

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const VIEWS: Array<{ key: Calendar['view']; label: string }> = [
    { key: 'month', label: 'Month' },
    { key: 'week', label: 'Week' },
    { key: 'day', label: 'Day' },
    { key: 'schedule', label: 'Schedule' },
];

function shiftAnchor(anchorDate: string, view: Calendar['view'], direction: -1 | 1): string {
    const base = new Date(`${anchorDate}T00:00:00Z`);
    if (Number.isNaN(base.getTime())) return anchorDate;
    if (view === 'month') base.setUTCMonth(base.getUTCMonth() + direction);
    else if (view === 'week') base.setUTCDate(base.getUTCDate() + direction * 7);
    else if (view === 'schedule') base.setUTCDate(base.getUTCDate() + direction * 14);
    else base.setUTCDate(base.getUTCDate() + direction);
    return base.toISOString().slice(0, 10);
}

function weekRange(anchorDate: string): string[] {
    const base = new Date(`${anchorDate}T00:00:00Z`);
    const day = base.getUTCDay();
    const start = new Date(base);
    start.setUTCDate(base.getUTCDate() - day);
    return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(start);
        d.setUTCDate(start.getUTCDate() + i);
        return d.toISOString().slice(0, 10);
    });
}

function eventOnDay(event: CalendarEvent, day: string, timezone: string): boolean {
    const start = dateKey(event.starts_at, timezone);
    const end = dateKey(event.ends_at ?? event.starts_at, timezone);
    return Boolean(start && end && start <= day && end >= day);
}

function formatTime(value: string, timezone: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat('en-PH', { timeZone: timezone, hour: 'numeric', minute: '2-digit' }).format(date);
}

function formatCompactTime(value: string, timezone: string): string {
    const full = formatTime(value, timezone);
    if (!full) return '';
    return full.replace(':00', '').replace(/\s?AM/i, 'a').replace(/\s?PM/i, 'p');
}

export default function CalendarIndex({ events, calendar }: { events: CalendarEvent[]; calendar: Calendar }) {
    if (!calendar || !Array.isArray(events)) {
        return <WorkspaceUnavailable title="Calendar" />;
    }

    const [activeView, setActiveView] = useState<Calendar['view']>(calendar.view || 'month');
    const [anchor, setAnchor] = useState<string>(calendarAnchor(calendar.anchor_date, calendar.today) || calendar.today || '2026-11-14');
    const [mobileSelectedDay, setMobileSelectedDay] = useState<string>(calendarAnchor(calendar.anchor_date, calendar.today) || calendar.today || '2026-11-14');
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
    const jumpId = useId();
    const tz = calendar.timezone || 'Asia/Manila';

    const updateNavigation = (nextView: Calendar['view'], nextDate: string) => {
        setActiveView(nextView);
        setAnchor(nextDate);
        router.get('/calendar', { view: nextView, date: nextDate }, { preserveState: true, preserveScroll: true, replace: true });
    };

    const gridDays = useMemo(() => monthDays(anchor), [anchor]);
    const currentMonthPrefix = anchor.slice(0, 7);
    const weekDays = useMemo(() => weekRange(anchor), [anchor]);

    const periodHeading = useMemo(() => {
        const d = new Date(`${anchor}T00:00:00Z`);
        if (Number.isNaN(d.getTime())) return anchor;
        if (activeView === 'day') {
            return d.toLocaleDateString('en-PH', { timeZone: 'UTC', weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
        }
        return d.toLocaleDateString('en-PH', { timeZone: 'UTC', month: 'long', year: 'numeric' });
    }, [anchor, activeView]);

    const sortedEvents = useMemo(
        () => [...events].sort((a, b) => Date.parse(a.starts_at) - Date.parse(b.starts_at)),
        [events],
    );

    return (
        <AppLayout title="Calendar">
            <div className="mx-auto max-w-[1440px] space-y-4 px-4 py-5 sm:px-6">
                <PageHeader
                    title="Municipal Calendar"
                    subtitle={`${events.length} visible event${events.length === 1 ? '' : 's'} · ${tz}`}
                    actions={
                        <div role="tablist" aria-label="Calendar view mode" className="inline-flex rounded-lg border border-[var(--border-default)] bg-[var(--surface-recessed)] p-1">
                            {VIEWS.map(({ key, label }) => (
                                <button
                                    key={key}
                                    type="button"
                                    role="tab"
                                    aria-selected={activeView === key}
                                    onClick={() => updateNavigation(key, anchor)}
                                    className={`min-h-10 rounded-md px-3.5 text-sm font-semibold transition-colors ${
                                        activeView === key
                                            ? 'bg-[var(--brand-primary)] text-white'
                                            : 'text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]'
                                    }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    }
                />

                {/* Single unified date navigation toolbar — eliminates duplicate date pickers */}
                <div className="tcds-card flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => updateNavigation(activeView, calendar.today)}
                            className="municipal-secondary-button"
                        >
                            Today
                        </button>
                        <div className="inline-flex rounded-lg border border-[var(--border-control)]">
                            <button
                                type="button"
                                aria-label={`Previous ${activeView}`}
                                onClick={() => updateNavigation(activeView, shiftAnchor(anchor, activeView, -1))}
                                className="flex h-11 w-11 items-center justify-center rounded-l-lg text-[var(--ink-primary)] hover:bg-[var(--surface-hover)]"
                            >
                                <ChevronLeft size={18} aria-hidden="true" />
                            </button>
                            <button
                                type="button"
                                aria-label={`Next ${activeView}`}
                                onClick={() => updateNavigation(activeView, shiftAnchor(anchor, activeView, 1))}
                                className="flex h-11 w-11 items-center justify-center rounded-r-lg border-l border-[var(--border-control)] text-[var(--ink-primary)] hover:bg-[var(--surface-hover)]"
                            >
                                <ChevronRight size={18} aria-hidden="true" />
                            </button>
                        </div>
                        <h2 className="ml-1 text-lg font-extrabold tracking-tight text-[var(--ink-primary)]">
                            {periodHeading}
                        </h2>
                    </div>

                    <div className="flex items-center gap-2">
                        <label htmlFor={jumpId} className="whitespace-nowrap text-sm font-semibold text-[var(--ink-secondary)]">
                            Jump to date
                        </label>
                        <DateInput
                            id={jumpId}
                            value={anchor}
                            onChange={(next) => next && updateNavigation(activeView, next)}
                            className="w-48"
                        />
                    </div>
                </div>

                {/* REAL 7-Column Month Grid — full pills on sm+, compact dot grid + Selected Day Agenda on < sm phones */}
                {activeView === 'month' && (
                    <div className="space-y-4">
                        <section aria-label="Monthly calendar grid" className="tcds-card overflow-hidden">
                            <div className="grid grid-cols-7 border-b border-[var(--border-default)] bg-[var(--surface-recessed)]">
                                {WEEKDAYS.map((day) => (
                                    <div key={day} className="px-1 py-2.5 text-center text-xs font-bold uppercase tracking-wider text-[var(--ink-secondary)] sm:px-2">
                                        {day}
                                    </div>
                                ))}
                            </div>
                            <div className="grid grid-cols-7 divide-x divide-y divide-[var(--border-default)]">
                                {gridDays.map((day) => {
                                    const inMonth = day.startsWith(currentMonthPrefix);
                                    const isToday = day === calendar.today;
                                    const isMobileSelected = day === mobileSelectedDay;
                                    const dayEvents = sortedEvents.filter((ev) => eventOnDay(ev, day, tz));
                                    const dayNum = Number(day.slice(8, 10));
                                    return (
                                        <div
                                            key={day}
                                            className={`min-h-14 p-1 sm:min-h-28 sm:p-2 ${
                                                inMonth ? 'bg-[var(--surface-card)]' : 'bg-[var(--surface-recessed)]/60 opacity-65'
                                            } ${isMobileSelected ? 'ring-1 ring-inset ring-[var(--brand-ink)] sm:ring-0' : ''}`}
                                        >
                                            {/* Mobile tap cell: date badge + event dots */}
                                            <button
                                                type="button"
                                                onClick={() => setMobileSelectedDay(day)}
                                                aria-label={`Select ${day} (${dayEvents.length} event${dayEvents.length === 1 ? '' : 's'})`}
                                                aria-pressed={isMobileSelected}
                                                className="flex min-h-11 w-full flex-col items-center justify-center gap-1 rounded-md sm:hidden"
                                            >
                                                <span
                                                    className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                                                        isToday
                                                            ? 'bg-[var(--brand-primary)] text-white'
                                                            : isMobileSelected
                                                              ? 'bg-[var(--brand-soft)] text-[var(--brand-ink)]'
                                                              : 'text-[var(--ink-primary)]'
                                                    }`}
                                                >
                                                    {dayNum}
                                                </span>
                                                <span className="flex h-2 items-center gap-0.5" aria-hidden="true">
                                                    {dayEvents.slice(0, 3).map((ev) => (
                                                        <span
                                                            key={ev.id}
                                                            className={`h-1.5 w-1.5 rounded-full ${
                                                                ev.event_type === 'deadline'
                                                                    ? 'bg-[var(--status-warn-bar)]'
                                                                    : 'bg-[var(--brand-ink)]'
                                                            }`}
                                                        />
                                                    ))}
                                                </span>
                                            </button>

                                            {/* Desktop / Tablet sm+ cell */}
                                            <div className="hidden items-center justify-between sm:flex">
                                                <button
                                                    type="button"
                                                    onClick={() => updateNavigation('day', day)}
                                                    aria-label={`View day ${day}`}
                                                    className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                                                        isToday
                                                            ? 'bg-[var(--brand-primary)] text-white'
                                                            : 'text-[var(--ink-primary)] hover:bg-[var(--surface-hover)]'
                                                    }`}
                                                >
                                                    {dayNum}
                                                </button>
                                            </div>
                                            <div className="mt-1.5 hidden space-y-1 sm:block">
                                                {dayEvents.slice(0, 3).map((ev) => (
                                                    <button
                                                        key={ev.id}
                                                        type="button"
                                                        title={ev.all_day ? ev.title : `${formatTime(ev.starts_at, tz)} · ${ev.title}`}
                                                        onClick={() => setSelectedEvent(ev)}
                                                        className={`block w-full truncate rounded-md border px-1.5 py-1 text-left text-xs font-semibold transition-colors ${
                                                            ev.event_type === 'deadline'
                                                                ? 'border-[var(--status-warn-border)] bg-[var(--status-warn-bg)] text-[var(--status-warn-fg)]'
                                                                : 'border-[var(--brand-soft-border)] bg-[var(--brand-soft)] text-[var(--ink-primary)]'
                                                        } hover:border-[var(--brand-primary)]`}
                                                    >
                                                        {!ev.all_day && <span className="mr-1 font-mono text-xs font-medium opacity-75">{formatCompactTime(ev.starts_at, tz)}</span>}
                                                        {ev.title}
                                                    </button>
                                                ))}
                                                {dayEvents.length > 3 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => updateNavigation('day', day)}
                                                        className="block w-full text-left text-xs font-semibold text-[var(--brand-ink)] hover:underline"
                                                    >
                                                        +{dayEvents.length - 3} more
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>

                        {/* Mobile Selected Day Agenda Card (replaces unreadable 1-character phone pills) */}
                        <section aria-label="Selected day agenda" className="tcds-card p-4 sm:hidden">
                            <div className="flex items-center justify-between gap-2 border-b border-[var(--border-default)] pb-2.5">
                                <h2 className="text-sm font-bold text-[var(--ink-primary)]">
                                    {formatDatePH(`${mobileSelectedDay}T12:00:00+08:00`)}
                                </h2>
                                <span className="text-xs font-semibold text-[var(--ink-secondary)]">
                                    {sortedEvents.filter((ev) => eventOnDay(ev, mobileSelectedDay, tz)).length} events
                                </span>
                            </div>
                            <div className="mt-3 space-y-2">
                                {sortedEvents.filter((ev) => eventOnDay(ev, mobileSelectedDay, tz)).map((ev) => (
                                    <button
                                        key={ev.id}
                                        type="button"
                                        onClick={() => setSelectedEvent(ev)}
                                        className="flex min-h-12 w-full items-center justify-between gap-3 rounded-lg border border-[var(--border-default)] bg-[var(--surface-recessed)] px-3 py-2.5 text-left transition-colors hover:border-[var(--brand-primary)]"
                                    >
                                        <div className="min-w-0">
                                            <div className="truncate text-sm font-semibold text-[var(--ink-primary)]">{ev.title}</div>
                                            <div className="mt-0.5 text-xs text-[var(--ink-secondary)]">
                                                {ev.all_day ? 'All day' : formatTime(ev.starts_at, tz)}
                                                {ev.department?.name ? ` · ${ev.department.name}` : ''}
                                            </div>
                                        </div>
                                        <StatusBadge tone={ev.event_type === 'deadline' ? 'warn' : 'ok'}>
                                            {humanizeSlug(ev.event_type)}
                                        </StatusBadge>
                                    </button>
                                ))}
                                {sortedEvents.filter((ev) => eventOnDay(ev, mobileSelectedDay, tz)).length === 0 && (
                                    <p className="py-2 text-center text-xs text-[var(--ink-secondary)]">
                                        No municipal events scheduled for this date.
                                    </p>
                                )}
                            </div>
                        </section>
                    </div>
                )}

                {activeView === 'week' && (
                    <section aria-label="Weekly schedule" className="grid grid-cols-1 gap-3 md:grid-cols-7">
                        {weekDays.map((day) => {
                            const dayEvents = sortedEvents.filter((ev) => eventOnDay(ev, day, tz));
                            const isToday = day === calendar.today;
                            const label = new Date(`${day}T00:00:00Z`).toLocaleDateString('en-PH', { timeZone: 'UTC', weekday: 'short', month: 'short', day: 'numeric' });
                            return (
                                <div key={day} className={`tcds-card p-3 ${isToday ? 'border-[var(--brand-primary)]' : ''}`}>
                                    <div className={`mb-2 text-xs font-bold uppercase ${isToday ? 'text-[var(--brand-ink)]' : 'text-[var(--ink-secondary)]'}`}>
                                        {label}
                                    </div>
                                    {dayEvents.length === 0 ? (
                                        <p className="text-xs text-[var(--ink-secondary)]">No events</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {dayEvents.map((ev) => (
                                                <button
                                                    key={ev.id}
                                                    type="button"
                                                    onClick={() => setSelectedEvent(ev)}
                                                    className="block w-full rounded-lg border border-[var(--border-default)] bg-[var(--surface-recessed)] p-2 text-left text-xs hover:border-[var(--brand-primary)]"
                                                >
                                                    <div className="font-bold text-[var(--ink-primary)]">{ev.title}</div>
                                                    <div className="mt-0.5 text-[var(--ink-secondary)]">{ev.all_day ? 'All day' : formatTime(ev.starts_at, tz)}</div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </section>
                )}

                {activeView === 'day' && (
                    <section aria-label="Daily schedule" className="space-y-3">
                        {(() => {
                            const dayEvents = sortedEvents.filter((ev) => eventOnDay(ev, anchor, tz));
                            if (dayEvents.length === 0) {
                                return (
                                    <EmptyState
                                        icon={<CalendarDays size={24} aria-hidden="true" />}
                                        title="No events scheduled for this day"
                                        description={`There are no authorized municipal meetings or deadlines on ${formatDatePH(anchor)}.`}
                                    />
                                );
                            }
                            return dayEvents.map((ev) => (
                                <div key={ev.id} className="tcds-card flex flex-wrap items-center justify-between gap-3 p-4">
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <StatusBadge tone={toneForWorkState(ev.event_type === 'deadline' ? 'due_soon' : 'active')}>
                                                {humanizeSlug(ev.event_type)}
                                            </StatusBadge>
                                            <span className="text-xs font-semibold text-[var(--ink-secondary)]">
                                                {ev.all_day ? 'All day' : formatTime(ev.starts_at, tz)}
                                            </span>
                                        </div>
                                        <h3 className="mt-1 text-base font-bold text-[var(--ink-primary)]">{ev.title}</h3>
                                        {ev.location && <p className="mt-0.5 text-sm text-[var(--ink-secondary)]">{ev.location}</p>}
                                    </div>
                                    <button type="button" onClick={() => setSelectedEvent(ev)} className="municipal-secondary-button">
                                        Details
                                    </button>
                                </div>
                            ));
                        })()}
                    </section>
                )}

                {activeView === 'schedule' && (
                    <section aria-label="Upcoming schedule agenda" className="tcds-card overflow-hidden">
                        {sortedEvents.length === 0 ? (
                            <p className="p-6 text-sm text-[var(--ink-secondary)]">No upcoming scheduled events.</p>
                        ) : (
                            <ul className="divide-y divide-[var(--border-default)]">
                                {sortedEvents.map((ev) => (
                                    <li key={ev.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-5">
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <StatusBadge tone={ev.event_type === 'deadline' ? 'warn' : 'ok'}>
                                                    {humanizeSlug(ev.event_type)}
                                                </StatusBadge>
                                                <span className="text-xs font-semibold text-[var(--ink-secondary)]">
                                                    {ev.all_day ? formatDatePH(ev.starts_at) : formatDateTimePH(ev.starts_at)}
                                                </span>
                                            </div>
                                            <div className="mt-1 text-sm font-bold text-[var(--ink-primary)]">{ev.title}</div>
                                            {ev.location && <div className="text-xs text-[var(--ink-secondary)]">{ev.location}</div>}
                                        </div>
                                        <button type="button" onClick={() => setSelectedEvent(ev)} className="municipal-secondary-button">
                                            Details
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>
                )}

                {/* Native top-layer Event Details Dialog */}
                <Dialog
                    open={Boolean(selectedEvent)}
                    onClose={() => setSelectedEvent(null)}
                    title={selectedEvent?.title || 'Event Details'}
                    description={selectedEvent ? humanizeSlug(selectedEvent.event_type) : undefined}
                    footer={
                        selectedEvent?.action_url && selectedEvent.action_url !== '/calendar' ? (
                            <Link href={selectedEvent.action_url} className="municipal-primary-button">
                                <span>Open related workspace</span>
                                <ExternalLink size={15} aria-hidden="true" />
                            </Link>
                        ) : undefined
                    }
                >
                    {selectedEvent && (
                        <div className="space-y-3 text-sm">
                            <div className="flex items-center gap-2 text-[var(--ink-primary)]">
                                <Clock size={16} aria-hidden="true" className="shrink-0 text-[var(--brand-ink)]" />
                                <span>{selectedEvent.all_day ? `${formatDatePH(selectedEvent.starts_at)} · All day` : formatDateTimePH(selectedEvent.starts_at)}</span>
                            </div>
                            {selectedEvent.location && (
                                <div className="flex items-center gap-2 text-[var(--ink-primary)]">
                                    <MapPin size={16} aria-hidden="true" className="shrink-0 text-[var(--brand-ink)]" />
                                    <span>{selectedEvent.location}</span>
                                </div>
                            )}
                            {selectedEvent.department && (
                                <p className="text-xs font-semibold text-[var(--ink-secondary)]">
                                    Office: {selectedEvent.department.name}
                                </p>
                            )}
                            {selectedEvent.description && (
                                <p className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-recessed)] p-3 text-sm leading-6 text-[var(--ink-secondary)]">
                                    {selectedEvent.description}
                                </p>
                            )}
                        </div>
                    )}
                </Dialog>
            </div>
        </AppLayout>
    );
}
