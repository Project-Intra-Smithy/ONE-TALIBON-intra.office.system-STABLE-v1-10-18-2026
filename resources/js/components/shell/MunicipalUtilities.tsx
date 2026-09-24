import { Link, usePage } from '@inertiajs/react';
import { CalendarDays, CloudSun, Megaphone, MessageSquareText, PanelRightClose, X } from 'lucide-react';
import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { municipalAnnouncements } from '../../data/municipal/announcements';
import { municipalCalendarItems } from '../../data/municipal/meetingsCalendar';

type WeatherSummary = { temperature: number; label: string };

function localDateKey() {
    return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(new Date());
}

function calendarPreview() {
    const today = localDateKey();
    const upcoming = municipalCalendarItems.filter((item) => item.date >= today);
    return (upcoming.length > 0 ? upcoming : municipalCalendarItems.slice(-3)).slice(0, 3);
}

function announcementPreview() {
    return [...municipalAnnouncements].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 2);
}

function weatherLabel(code: number): string {
    if (code === 0) return 'Clear';
    if ([1, 2].includes(code)) return 'Partly cloudy';
    if (code === 3) return 'Cloudy';
    if ([45, 48].includes(code)) return 'Foggy';
    if (code >= 51 && code <= 57) return 'Light rain';
    if (code >= 61 && code <= 67) return 'Rain';
    if (code >= 80 && code <= 82) return 'Rain showers';
    if (code >= 95) return 'Thunderstorms';
    return 'Variable weather';
}

function DailyContext() {
    const [weather, setWeather] = useState<WeatherSummary | null>(null);
    const [weatherUnavailable, setWeatherUnavailable] = useState(false);
    const today = new Intl.DateTimeFormat('en-PH', {
        timeZone: 'Asia/Manila', weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
    }).format(new Date());

    useEffect(() => {
        const controller = new AbortController();
        let active = true;
        const timeout = window.setTimeout(() => controller.abort(), 4500);
        fetch('https://api.open-meteo.com/v1/forecast?latitude=10.1491&longitude=124.3248&current=temperature_2m,weather_code&timezone=Asia%2FManila', {
            signal: controller.signal, headers: { Accept: 'application/json' },
        })
            .then((response) => {
                if (!response.ok) throw new Error('Weather service unavailable');
                return response.json() as Promise<{ current?: { temperature_2m?: number; weather_code?: number } }>;
            })
            .then((payload) => {
                if (!active) return;
                const temperature = payload.current?.temperature_2m;
                const code = payload.current?.weather_code;
                if (typeof temperature !== 'number' || typeof code !== 'number') throw new Error('Weather data unavailable');
                setWeather({ temperature, label: weatherLabel(code) });
            })
            .catch(() => { if (active) setWeatherUnavailable(true); })
            .finally(() => window.clearTimeout(timeout));
        return () => { active = false; window.clearTimeout(timeout); controller.abort(); };
    }, []);

    return (
        <section className="rounded-lg border border-[var(--municipal-border)] bg-[var(--municipal-brand-soft)] px-3 py-2.5" aria-label="Today in Talibon">
            <div className="flex items-start gap-2.5">
                <CloudSun size={18} className="mt-0.5 shrink-0 text-[var(--municipal-brand)]" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                    <div className="text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--municipal-brand)]">Today in Talibon</div>
                    <div className="mt-0.5 text-xs font-semibold leading-4 text-[var(--municipal-text)]">{today}</div>
                    <div className="mt-1 text-[11px] leading-4 text-[var(--municipal-muted)]" aria-live="polite">
                        {weather ? `${Math.round(weather.temperature)}°C · ${weather.label}` : weatherUnavailable ? 'Weather unavailable · workspace unaffected' : 'Weather updates when available'}
                    </div>
                </div>
            </div>
        </section>
    );
}

export function MunicipalUtilityContent({ idPrefix }: { idPrefix: string }) {
    const calendar = calendarPreview();
    const announcements = announcementPreview();
    const calendarTitleId = `${idPrefix}-calendar-title`;
    const announcementsTitleId = `${idPrefix}-announcements-title`;

    return (
        <div className="space-y-3">
            <DailyContext />
            <section aria-labelledby={calendarTitleId}>
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2"><CalendarDays size={15} className="text-[var(--municipal-brand)]" aria-hidden="true" /><h2 id={calendarTitleId} className="text-[11px] font-bold uppercase tracking-wide text-[var(--municipal-text)]">Calendar</h2></div>
                    <Link href="/calendar" className="text-[11px] font-semibold text-[var(--municipal-brand)] hover:underline">Open</Link>
                </div>
                <div className="mt-1.5 space-y-1">
                    {calendar.map((item) => <div key={item.id} className="rounded-md border border-[var(--municipal-border)] bg-[var(--municipal-surface)] px-2.5 py-1.5"><div className="text-[9px] font-bold uppercase tracking-wide text-[var(--municipal-muted)]">{item.date} · {item.time}</div><div className="mt-0.5 line-clamp-2 text-[11px] font-semibold leading-4 text-[var(--municipal-text)]">{item.title}</div><div className="line-clamp-1 text-[10px] leading-4 text-[var(--municipal-muted)]">{item.office}</div></div>)}
                </div>
            </section>
            <section aria-labelledby={announcementsTitleId}>
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2"><Megaphone size={15} className="text-[var(--municipal-brand)]" aria-hidden="true" /><h2 id={announcementsTitleId} className="text-[11px] font-bold uppercase tracking-wide text-[var(--municipal-text)]">Announcements</h2></div>
                    <Link href="/announcements" className="text-[11px] font-semibold text-[var(--municipal-brand)] hover:underline">Open</Link>
                </div>
                <div className="mt-1.5 divide-y divide-[var(--municipal-border)] rounded-md border border-[var(--municipal-border)] bg-[var(--municipal-surface)]">
                    {announcements.map((item) => <div key={item.id} className="px-2.5 py-1.5"><div className="flex items-start justify-between gap-2"><div className="line-clamp-2 min-w-0 text-[11px] font-semibold leading-4 text-[var(--municipal-text)]">{item.title}</div>{item.priority !== 'Routine' && <span className="shrink-0 text-[9px] font-bold uppercase text-amber-700 dark:text-amber-300">{item.priority}</span>}</div><div className="line-clamp-1 text-[10px] leading-4 text-[var(--municipal-muted)]">{item.issuingOffice}</div></div>)}
                </div>
            </section>
        </div>
    );
}

export function QuickMessagesPanel() {
    const page = usePage();
    const messagesWorkspace = page.url === '/messages' || page.url.startsWith('/messages?');
    if (messagesWorkspace) return null;

    return (
        <Link href="/messages" className="fixed bottom-[max(0.75rem,env(safe-area-inset-bottom))] right-3 z-40 flex h-11 w-11 items-center justify-center gap-2 rounded-full bg-[var(--municipal-brand-deep)] text-sm font-semibold text-white shadow-lg shadow-slate-900/20 hover:bg-[var(--municipal-brand-active)] sm:bottom-4 sm:right-4 sm:w-auto sm:px-4" aria-label="Open Messages">
            <MessageSquareText size={17} aria-hidden="true" />
            <span className="hidden sm:inline">Messages</span>
        </Link>
    );
}

export function MunicipalUtilityRail() {
    return (
        <aside className="hidden border-l border-[var(--municipal-border)] bg-[var(--municipal-surface-subtle)] p-3 2xl:block" aria-label="Municipal utilities">
            <div className="sticky top-14 max-h-[calc(100vh-3.5rem)] overflow-y-auto overscroll-contain pb-20 pr-1">
                <div className="mb-2.5 flex items-center gap-2 text-[var(--municipal-text)]"><PanelRightClose size={16} aria-hidden="true" /><div><div className="text-[11px] font-bold uppercase tracking-wide">Municipal utilities</div><div className="text-[10px] text-[var(--municipal-muted)]">Schedule and notices</div></div></div>
                <MunicipalUtilityContent idPrefix="utility-rail" />
            </div>
        </aside>
    );
}

export function MunicipalUtilityDrawer({ onClose }: { onClose: () => void }) {
    const dialog = useRef<HTMLDialogElement>(null);
    const closeButton = useRef<HTMLButtonElement>(null);
    const onCloseRef = useRef(onClose);
    useEffect(() => { onCloseRef.current = onClose; }, [onClose]);
    useEffect(() => {
        const element = dialog.current;
        const previousFocus = document.activeElement as HTMLElement | null;
        const previousOverflow = document.body.style.overflow;
        element?.showModal();
        closeButton.current?.focus();
        document.body.style.overflow = 'hidden';
        return () => { element?.close(); document.body.style.overflow = previousOverflow; previousFocus?.focus({ preventScroll: true }); };
    }, []);
    const closeFromBackdrop = (event: MouseEvent<HTMLDialogElement>) => { if (event.target === event.currentTarget) onClose(); };

    return (
        <dialog ref={dialog} onCancel={(event) => { event.preventDefault(); onClose(); }} onClick={closeFromBackdrop} aria-labelledby="municipal-utilities-drawer-title" aria-modal="true" className="fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none border-0 bg-transparent p-0 text-[var(--municipal-text)] backdrop:bg-slate-950/55">
            <section className="ml-auto flex h-full w-[min(92vw,350px)] flex-col border-l border-[var(--municipal-border)] bg-[var(--municipal-surface-subtle)] shadow-2xl">
                <div className="flex items-center justify-between gap-3 border-b border-[var(--municipal-border)] px-3 py-2.5"><div><h2 id="municipal-utilities-drawer-title" className="text-sm font-bold text-[var(--municipal-text)]">Municipal utilities</h2><div className="text-xs text-[var(--municipal-muted)]">Calendar and notices</div></div><button ref={closeButton} type="button" onClick={onClose} className="flex h-11 w-11 items-center justify-center rounded-lg text-[var(--municipal-muted)] hover:bg-[var(--municipal-hover)]" aria-label="Close municipal utilities"><X size={18} /></button></div>
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 pb-20"><MunicipalUtilityContent idPrefix="utility-drawer" /></div>
            </section>
        </dialog>
    );
}
