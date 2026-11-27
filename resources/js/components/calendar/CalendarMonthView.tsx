import type { Calendar, CalendarEvent } from '../../pages/Calendar/Index';
import { dateKey, monthDays } from '../dashboard/schedulePresentation';
import { StatusBadge } from '../ui';
import { formatDatePH, humanizeSlug } from '../../lib/format';
const WEEKDAYS=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
function eventOnDay(event:CalendarEvent,day:string,timezone:string){const start=dateKey(event.starts_at,timezone),end=dateKey(event.ends_at??event.starts_at,timezone);return Boolean(start&&end&&start<=day&&end>=day);}
function formatTime(value:string,timezone:string){const date=new Date(value);return Number.isNaN(date.getTime())?'':new Intl.DateTimeFormat('en-PH',{timeZone:timezone,hour:'numeric',minute:'2-digit'}).format(date);}
function formatCompactTime(value:string,timezone:string){return formatTime(value,timezone).replace(':00','').replace(/\s?AM/i,'a').replace(/\s?PM/i,'p');}
export default function CalendarMonthView({events,calendar,anchor,selectedDay:mobileSelectedDay,onSelectDay:setMobileSelectedDay,onSelectEvent:setSelectedEvent,onNavigate:updateNavigation}:{
events:CalendarEvent[];calendar:Calendar;anchor:string;selectedDay:string;onSelectDay:(day:string)=>void;onSelectEvent:(event:CalendarEvent)=>void;onNavigate:(view:Calendar['view'],day:string)=>void;
}){
const gridDays=monthDays(anchor),currentMonthPrefix=anchor.slice(0,7),tz=calendar.timezone||'Asia/Manila';
const sortedEvents=[...events].sort((a,b)=>Date.parse(a.starts_at)-Date.parse(b.starts_at));
const firstWeekday=gridDays.length?new Date(gridDays[0]+'T00:00:00Z').getUTCDay():0;
return (
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
                                {Array.from({ length: firstWeekday }, (_, index) => <div key={`padding-${index}`} aria-hidden="true" className="min-h-14 bg-[var(--surface-recessed)] sm:min-h-28" />)}
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
                );
}
