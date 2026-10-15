import { Link } from '@inertiajs/react';
import { CalendarDays } from 'lucide-react';
import PageFrame from '../../components/PageFrame';
import PageHeader from '../../components/PageHeader';
import { calendarAnchor } from '../../compat/uiContracts';
import ScheduleCalendar from '../../components/dashboard/ScheduleCalendar';
import AppLayout from '../../layouts/AppLayout';

type CalendarEvent = {
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

type Calendar = { view: 'month' | 'week' | 'day' | 'schedule'; anchor_date: string; today: string; range_start: string; range_end: string; timezone: string };

const formatDate = (value: string, timezone?: string) => Number.isNaN(Date.parse(value)) ? 'Date unavailable' : new Date(value).toLocaleString([], {
    timeZone: timezone, month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
});
const humanize = (value: string) => value.replaceAll('_', ' ').replace(/\b\w/g, letter => letter.toUpperCase());

export default function Index({ events = [], calendar }: { events: CalendarEvent[]; calendar: Calendar }) {
    const view = ['month', 'week', 'day', 'schedule'].includes(calendar?.view) ? calendar.view : 'month';
    const anchor = calendarAnchor(calendar?.anchor_date, calendar?.today);
    const safeEvents = Array.isArray(events) ? events : [];
    return <AppLayout workspaceRefinement title="Calendar">
        <PageFrame width="standard">
            <PageHeader
                eyebrow="Shared municipal calendar"
                title="Events, deadlines & schedules"
                description="A single operational view of visible office events, routed-work deadlines, and schedules available within your current access."
                icon={CalendarDays}
            />

            <section aria-label="Calendar range" className="municipal-panel p-4 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div><div className="text-base font-semibold">{safeEvents.length} visible event{safeEvents.length === 1 ? '' : 's'} in this range</div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">{calendar?.range_start ? formatDate(calendar.range_start) : 'Range unavailable'} – {calendar?.range_end ? formatDate(calendar.range_end) : 'Range unavailable'} · {calendar?.timezone ?? 'Local time'}</div></div>
                    <nav aria-label="Calendar views" className="flex flex-wrap gap-3">{(['month', 'week', 'day', 'schedule'] as const).map((option) => <Link key={option} href={`/calendar?view=${option}${anchor ? `&date=${encodeURIComponent(anchor)}` : ''}`} aria-current={view === option ? 'page' : undefined} className={`inline-flex items-center rounded-lg px-4 py-3 text-sm font-semibold capitalize ${view === option ? 'bg-[#0b2852] text-white' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'}`}>{option}</Link>)}</nav>
                </div>
            </section>

            <ScheduleCalendar key={anchor} events={safeEvents} anchor={anchor} timezone={calendar?.timezone || 'Asia/Manila'} rangeStart={calendar?.range_start} rangeEnd={calendar?.range_end} />

            <section aria-label="Calendar schedule" className="municipal-panel overflow-hidden">
                <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-700 sm:px-5 sm:py-4"><h2 className="font-bold text-slate-950 dark:text-slate-100">Schedule</h2></div>
                <div className="divide-y divide-slate-100 dark:divide-slate-700">
                    {safeEvents.map((event) => <article key={event.id} className="flex min-w-0 flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className={`rounded-full px-2.5 py-1 text-sm font-bold uppercase sm:text-sm ${event.priority === 'urgent' ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300' : event.priority === 'high' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300' : 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'}`}>{humanize(event.priority)}</span>
                                <span className="break-words text-sm font-semibold uppercase tracking-wide text-slate-600 sm:text-sm">{humanize(event.event_type)}</span>
                                {event.status !== 'scheduled' && <span className="text-sm font-semibold uppercase text-emerald-700 dark:text-emerald-300 sm:text-sm">{humanize(event.status)}</span>}
                            </div>
                            <div className="mt-2 break-words font-bold text-slate-950 dark:text-slate-100">{event.title}</div>
                            <div className="mt-1 break-words text-sm text-slate-500 dark:text-slate-400 sm:text-base">{formatDate(event.starts_at, calendar?.timezone)}{event.department ? ` · ${event.department.short_name || event.department.name}` : ''}</div>
                            {event.ends_at && <div className="mt-2 text-base">Ends {formatDate(event.ends_at, calendar?.timezone)}</div>}
                            {event.all_day && <div className="mt-2 text-base">All day</div>}
                            {event.location && <div className="mt-2 text-base">Location: {event.location}</div>}
                            {event.description && <div className="mt-1 break-words text-sm leading-6 text-slate-600 sm:text-sm">{event.description}</div>}
                        </div>
                        {event.action_url && <Link href={event.action_url} className="shrink-0 rounded-xl border border-slate-300 px-4 py-2 text-center text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800">Open</Link>}
                    </article>)}
                    {safeEvents.length === 0 && <div className="municipal-empty m-4 text-base">No calendar events are visible in this range.</div>}
                </div>
            </section>
        </PageFrame>
    </AppLayout>;
}
