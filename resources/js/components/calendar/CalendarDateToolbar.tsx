import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useId } from 'react';
import { DateInput } from '../ui';

export default function CalendarDateToolbar({ view, title, date, onDate, onToday, onPrevious, onNext }: {
    view: string; title: string; date: string; onDate: (date: string) => void;
    onToday: () => void; onPrevious: () => void; onNext: () => void;
}) {
    const id = useId();
    return <div className="tcds-card flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
            <button type="button" onClick={onToday} className="municipal-secondary-button">Today</button>
            <div className="inline-flex rounded-lg border border-[var(--border-control)]">
                <button type="button" aria-label={`Previous ${view}`} onClick={onPrevious} className="flex h-11 w-11 items-center justify-center rounded-l-lg text-[var(--ink-primary)] hover:bg-[var(--surface-hover)]"><ChevronLeft size={18} aria-hidden="true" /></button>
                <button type="button" aria-label={`Next ${view}`} onClick={onNext} className="flex h-11 w-11 items-center justify-center rounded-r-lg border-l border-[var(--border-control)] text-[var(--ink-primary)] hover:bg-[var(--surface-hover)]"><ChevronRight size={18} aria-hidden="true" /></button>
            </div>
            <h2 aria-live="polite" className="ml-1 break-words text-lg font-extrabold tracking-tight text-[var(--ink-primary)]">{title}</h2>
        </div>
        <div className="flex min-w-0 flex-wrap items-center gap-2"><label htmlFor={id} className="text-sm font-semibold text-[var(--ink-secondary)]">Jump to date</label><DateInput id={id} value={date} onChange={next => next && onDate(next)} className="w-48 max-w-full" /></div>
    </div>;
}
