import { router } from '@inertiajs/react';
import { Search, X } from 'lucide-react';
import { type FormEvent, useEffect, useRef, useState } from 'react';

export default function RecordsSearch() {
    const [open, setOpen] = useState(false);
    const input = useRef<HTMLInputElement>(null);
    const panel = useRef<HTMLDivElement>(null);
    const trigger = useRef<HTMLButtonElement>(null);

    const closeAndRestoreFocus = () => {
        setOpen(false);
        window.requestAnimationFrame(() => trigger.current?.focus());
    };

    useEffect(() => {
        if (!open) return;
        input.current?.focus();

        const closeOnEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') closeAndRestoreFocus();
        };
        const closeOutside = (event: PointerEvent) => {
            if (!panel.current?.contains(event.target as Node)) setOpen(false);
        };

        document.addEventListener('keydown', closeOnEscape);
        document.addEventListener('pointerdown', closeOutside);
        return () => {
            document.removeEventListener('keydown', closeOnEscape);
            document.removeEventListener('pointerdown', closeOutside);
        };
    }, [open]);

    function searchRecords(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const query = String(data.get('search') || '').trim();
        setOpen(false);
        router.get('/records', query ? { search: query } : {});
    }

    return (
        <div ref={panel} className="relative hidden md:block">
            <button
                ref={trigger}
                type="button"
                onClick={() => setOpen((value) => !value)}
                className={`flex h-11 items-center gap-2 rounded-lg px-2.5 text-sm font-semibold transition-colors ${open ? 'bg-[var(--municipal-brand-soft)] text-[var(--municipal-brand)]' : 'text-[var(--municipal-muted)] hover:bg-[var(--municipal-hover)] hover:text-[var(--municipal-text)]'}`}
                aria-label="Search municipal records"
                aria-expanded={open}
                aria-haspopup="dialog"
                aria-controls="records-search-dialog"
                title="Search municipal records"
            >
                <Search size={17} aria-hidden="true" />
                <span className="hidden 2xl:inline">Search</span>
            </button>

            {open && (
                <div id="records-search-dialog" className="absolute right-0 top-11 z-50 w-[min(22rem,calc(100vw-2rem))] rounded-xl border border-[var(--municipal-border)] bg-[var(--municipal-surface)] p-3 text-[var(--municipal-text)] shadow-2xl" role="dialog" aria-label="Search municipal records">
                    <form onSubmit={searchRecords} role="search">
                        <div className="flex items-center justify-between gap-3 px-1 pb-2">
                            <div>
                                <div className="text-xs font-bold uppercase tracking-wide text-[var(--municipal-text)]">Records search</div>
                                <div className="text-xs leading-4 text-[var(--municipal-muted)]">Find municipal records without occupying the workspace header.</div>
                            </div>
                            <button type="button" onClick={closeAndRestoreFocus} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-[var(--municipal-muted)] hover:bg-[var(--municipal-hover)]" aria-label="Close records search"><X size={16} aria-hidden="true" /></button>
                        </div>
                        <label className="relative block">
                            <span className="sr-only">Search records</span>
                            <Search size={16} className="pointer-events-none absolute left-3 top-3 text-[var(--municipal-muted)]" aria-hidden="true" />
                            <input
                                ref={input}
                                type="search"
                                name="search"
                                placeholder="Reference, subject, office, keyword…"
                                autoComplete="off"
                                enterKeyHint="search"
                                spellCheck={false}
                                className="h-11 w-full rounded-lg border border-[var(--municipal-border-strong)] bg-[var(--municipal-surface)] pl-9 pr-3 text-sm text-[var(--municipal-text)] placeholder:text-[var(--municipal-muted)] focus:border-[var(--municipal-brand-active)]"
                            />
                        </label>
                    </form>
                </div>
            )}
        </div>
    );
}
