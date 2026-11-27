import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useId, useMemo, useRef, useState } from 'react';

export type DatePreset = {
    label: string;
    value: string;
};

type DateInputProps = {
    id?: string;
    name?: string;
    value: string;
    onChange: (nextValue: string) => void;
    min?: string;
    max?: string;
    required?: boolean;
    disabled?: boolean;
    ariaDescribedBy?: string;
    ariaInvalid?: boolean;
    presets?: 'deadline' | 'range_start' | 'range_end' | DatePreset[];
    className?: string;
    compact?: boolean;
};

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

/** Returns today's calendar date (YYYY-MM-DD) in Philippine Standard Time (Asia/Manila). */
export function todayManilaISO(): string {
    return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Manila',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(new Date());
}

/** Pure calendar-day addition using UTC integers so timezones never shift the date. */
export function addCalendarDays(isoDate: string, deltaDays: number): string {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
    if (!match) return isoDate;
    const d = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]) + deltaDays));
    return d.toISOString().slice(0, 10);
}

function parseIsoParts(iso: string): { year: number; month: number; day: number } | null {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
    if (!match) return null;
    return { year: Number(match[1]), month: Number(match[2]) - 1, day: Number(match[3]) };
}

function formatIsoParts(year: number, month: number, day: number): string {
    const d = new Date(Date.UTC(year, month, day));
    return d.toISOString().slice(0, 10);
}

function buildMonthGrid(year: number, month: number): Array<{ iso: string; day: number; inMonth: boolean }> {
    const firstWeekday = new Date(Date.UTC(year, month, 1)).getUTCDay();
    const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    const cells: Array<{ iso: string; day: number; inMonth: boolean }> = [];

    for (let i = firstWeekday - 1; i >= 0; i -= 1) {
        const d = new Date(Date.UTC(year, month, -i));
        cells.push({ iso: d.toISOString().slice(0, 10), day: d.getUTCDate(), inMonth: false });
    }
    for (let day = 1; day <= daysInMonth; day += 1) {
        cells.push({ iso: formatIsoParts(year, month, day), day, inMonth: true });
    }
    while (cells.length < 42) {
        const nextIdx = cells.length - firstWeekday - daysInMonth + 1;
        const d = new Date(Date.UTC(year, month + 1, nextIdx));
        cells.push({ iso: d.toISOString().slice(0, 10), day: d.getUTCDate(), inMonth: false });
    }
    return cells;
}

function resolvePresets(presets: DateInputProps['presets'], today: string): DatePreset[] {
    if (!presets) return [];
    if (Array.isArray(presets)) return presets;
    if (presets === 'deadline') {
        return [
            { label: 'Today', value: today },
            { label: 'Tomorrow', value: addCalendarDays(today, 1) },
            { label: '+3 days', value: addCalendarDays(today, 3) },
            { label: '+1 week', value: addCalendarDays(today, 7) },
            { label: '+2 weeks', value: addCalendarDays(today, 14) },
        ];
    }
    if (presets === 'range_start') {
        const startOfMonth = `${today.slice(0, 8)}01`;
        return [
            { label: 'Today', value: today },
            { label: 'Last 7d', value: addCalendarDays(today, -7) },
            { label: 'Last 30d', value: addCalendarDays(today, -30) },
            { label: 'This month', value: startOfMonth },
        ];
    }
    return [
        { label: 'Today', value: today },
        { label: '+7 days', value: addCalendarDays(today, 7) },
    ];
}

/**
 * TCDS ergonomic date field: keeps native <input type="date"> for keyboard/autofill/validation,
 * paired with an always-visible 44px Calendar toggle button opening a top-layer Popover API
 * month picker (Light + Dark) and optional one-click date preset chips.
 */
export function DateInput({
    id,
    name,
    value,
    onChange,
    min,
    max,
    required,
    disabled,
    ariaDescribedBy,
    ariaInvalid,
    presets,
    className = '',
    compact = false,
}: DateInputProps) {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const popoverId = `${inputId}-calendar`;
    const popoverRef = useRef<HTMLDivElement>(null);
    const today = useMemo(() => todayManilaISO(), []);

    const initialParts = parseIsoParts(value) ?? parseIsoParts(today) ?? { year: 2026, month: 10, day: 14 };
    const [viewYear, setViewYear] = useState(initialParts.year);
    const [viewMonth, setViewMonth] = useState(initialParts.month);

    // Keep displayed month synced when value changes externally (e.g., preset click or reset)
    useEffect(() => {
        const parts = parseIsoParts(value);
        if (parts) {
            setViewYear(parts.year);
            setViewMonth(parts.month);
        }
    }, [value]);

    const cells = useMemo(() => buildMonthGrid(viewYear, viewMonth), [viewYear, viewMonth]);
    const presetItems = useMemo(() => resolvePresets(presets, today), [presets, today]);

    const isOutOfBounds = (iso: string) => Boolean((min && iso < min) || (max && iso > max));

    const selectDate = (iso: string) => {
        if (disabled || isOutOfBounds(iso)) return;
        onChange(iso);
        try {
            popoverRef.current?.hidePopover?.();
        } catch {
            // Fallback when popover is already closed
        }
    };

    const shiftMonth = (delta: number) => {
        const d = new Date(Date.UTC(viewYear, viewMonth + delta, 1));
        setViewYear(d.getUTCFullYear());
        setViewMonth(d.getUTCMonth());
    };

    return (
        <div className={`min-w-0 ${className}`}>
            <div className="relative flex items-center">
                <input
                    id={inputId}
                    name={name}
                    type="date"
                    value={value}
                    min={min}
                    max={max}
                    required={required}
                    disabled={disabled}
                    aria-describedby={ariaDescribedBy}
                    aria-invalid={ariaInvalid}
                    onChange={(event) => onChange(event.target.value)}
                    className={`tcds-input tcds-date-native pr-11 ${compact ? 'min-h-10 py-1.5 text-sm' : ''}`}
                />
                <button
                    type="button"
                    disabled={disabled}
                    aria-label="Open calendar date picker"
                    title="Choose date from calendar"
                    popoverTarget={popoverId}
                    className="absolute right-0.5 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-md text-[var(--ink-secondary)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--brand-ink)] disabled:pointer-events-none disabled:opacity-40"
                >
                    <CalendarDays size={17} aria-hidden="true" />
                </button>

                <div
                    ref={popoverRef}
                    id={popoverId}
                    data-placement="bottom-end"
                    aria-label="Calendar date picker"
                    popover="auto"
                    className="tcds-popover w-[18.5rem] p-3"
                >
                    <div className="flex items-center justify-between gap-2 pb-2">
                        <button
                            type="button"
                            onClick={() => shiftMonth(-1)}
                            aria-label="Previous month"
                            className="flex h-8 w-8 items-center justify-center rounded-md border border-[var(--border-default)] text-[var(--ink-primary)] hover:bg-[var(--surface-hover)]"
                        >
                            <ChevronLeft size={15} aria-hidden="true" />
                        </button>
                        <div className="text-sm font-bold text-[var(--ink-primary)]">
                            {MONTH_NAMES[viewMonth]} {viewYear}
                        </div>
                        <button
                            type="button"
                            onClick={() => shiftMonth(1)}
                            aria-label="Next month"
                            className="flex h-8 w-8 items-center justify-center rounded-md border border-[var(--border-default)] text-[var(--ink-primary)] hover:bg-[var(--surface-hover)]"
                        >
                            <ChevronRight size={15} aria-hidden="true" />
                        </button>
                    </div>

                    <div className="grid grid-cols-7 gap-0.5 pb-1 text-center">
                        {WEEKDAYS.map((day) => (
                            <div key={day} className="py-1 text-xs font-bold uppercase text-[var(--ink-secondary)]">
                                {day}
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 gap-0.5">
                        {cells.map((cell) => {
                            const selected = value === cell.iso;
                            const isToday = today === cell.iso;
                            const blocked = isOutOfBounds(cell.iso);
                            return (
                                <button
                                    key={cell.iso}
                                    type="button"
                                    disabled={blocked}
                                    aria-label={cell.iso}
                                    aria-pressed={selected}
                                    onClick={() => selectDate(cell.iso)}
                                    className={`flex h-9 w-9 items-center justify-center rounded-md text-xs font-semibold tabular-nums transition-colors ${
                                        selected
                                            ? 'bg-[var(--brand-primary)] font-bold text-white'
                                            : isToday
                                              ? 'border border-[var(--brand-primary)] bg-[var(--brand-soft)] font-bold text-[var(--brand-ink)]'
                                              : cell.inMonth
                                                ? 'text-[var(--ink-primary)] hover:bg-[var(--surface-hover)]'
                                                : 'text-[var(--ink-secondary)] opacity-55 hover:bg-[var(--surface-hover)]'
                                    } disabled:cursor-not-allowed disabled:opacity-30`}
                                >
                                    {cell.day}
                                </button>
                            );
                        })}
                    </div>

                    <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-[var(--border-default)] pt-2">
                        <button
                            type="button"
                            disabled={isOutOfBounds(today)}
                            onClick={() => selectDate(today)}
                            className="rounded-md px-2.5 py-1.5 text-xs font-bold text-[var(--brand-ink)] hover:bg-[var(--brand-soft)] disabled:opacity-40"
                        >
                            Today
                        </button>
                        {!required && value && (
                            <button
                                type="button"
                                onClick={() => {
                                    onChange('');
                                    try {
                                        popoverRef.current?.hidePopover?.();
                                    } catch {}
                                }}
                                className="rounded-md px-2.5 py-1.5 text-xs font-semibold text-[var(--ink-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--ink-primary)]"
                            >
                                Clear
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {presetItems.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label="Quick date presets">
                    {presetItems.map((preset) => {
                        const active = value === preset.value;
                        const blocked = isOutOfBounds(preset.value);
                        return (
                            <button
                                key={preset.label}
                                type="button"
                                disabled={disabled || blocked}
                                aria-pressed={active}
                                onClick={() => onChange(preset.value)}
                                className={`inline-flex min-h-8 items-center rounded-full border px-2.5 text-xs font-semibold transition-colors ${
                                    active
                                        ? 'border-[var(--brand-primary)] bg-[var(--brand-soft)] text-[var(--brand-ink)]'
                                        : 'border-[var(--border-control)] bg-[var(--surface-card)] text-[var(--ink-secondary)] hover:border-[var(--brand-primary)] hover:text-[var(--ink-primary)]'
                                } disabled:opacity-40`}
                            >
                                {preset.label}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

/** Quick preset helper for datetime-local fields (e.g. Health Vault expiration or legislative sessions). */
export function DateTimeInput({
    id,
    name,
    value,
    onChange,
    required,
    disabled,
    presets,
    className = '',
}: {
    id?: string;
    name?: string;
    value: string;
    onChange: (next: string) => void;
    required?: boolean;
    disabled?: boolean;
    presets?: Array<{ label: string; daysFromNow: number; time?: string }>;
    className?: string;
}) {
    const inputRef = useRef<HTMLInputElement>(null);
    const today = useMemo(() => todayManilaISO(), []);

    return (
        <div className={`min-w-0 ${className}`}>
            <div className="relative flex items-center">
                <input
                    ref={inputRef}
                    id={id}
                    name={name}
                    type="datetime-local"
                    value={value}
                    required={required}
                    disabled={disabled}
                    onChange={(event) => onChange(event.target.value)}
                    className="tcds-input tcds-date-native pr-11"
                />
                <button
                    type="button"
                    disabled={disabled}
                    aria-label="Open date and time picker"
                    title="Choose date and time"
                    onClick={() => {
                        const el = inputRef.current;
                        if (!el) return;
                        el.focus();
                        try {
                            el.showPicker?.();
                        } catch {
                            // Gracefully fall back to keyboard editing in restricted webviews
                        }
                    }}
                    className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-[var(--ink-secondary)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--brand-primary)] disabled:pointer-events-none disabled:opacity-40 hover:text-[var(--brand-ink)]"
                >
                    <CalendarDays size={17} aria-hidden="true" />
                </button>
            </div>
            {presets && presets.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label="Quick date presets">
                    {presets.map((preset) => {
                        const iso = `${addCalendarDays(today, preset.daysFromNow)}T${preset.time ?? '17:00'}`;
                        const active = value === iso;
                        return (
                            <button
                                key={preset.label}
                                type="button"
                                disabled={disabled}
                                aria-pressed={active}
                                onClick={() => onChange(iso)}
                                className={`inline-flex min-h-8 items-center rounded-full border px-2.5 text-xs font-semibold transition-colors ${
                                    active
                                        ? 'border-[var(--brand-primary)] bg-[var(--brand-soft)] text-[var(--brand-ink)]'
                                        : 'border-[var(--border-control)] bg-[var(--surface-card)] text-[var(--ink-secondary)] hover:border-[var(--brand-primary)] hover:text-[var(--ink-primary)]'
                                }`}
                            >
                                {preset.label}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
