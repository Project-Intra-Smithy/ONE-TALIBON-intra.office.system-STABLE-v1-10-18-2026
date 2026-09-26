import { SlidersHorizontal, X } from 'lucide-react';
import { type ReactNode, useEffect, useId, useRef, useState } from 'react';

type Props = {
    primary: ReactNode;
    common?: ReactNode;
    advanced?: ReactNode;
    actions?: ReactNode;
    activeFilters?: string[];
    title?: string;
};

export default function ProgressiveFilterBar({
    primary,
    common,
    advanced,
    actions,
    activeFilters = [],
    title = 'Additional filters',
}: Props) {
    const [expanded, setExpanded] = useState(false);
    const panelId = useId();
    const panelRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const hasAdvanced = Boolean(advanced);

    useEffect(() => {
        if (!expanded) return;
        const media = window.matchMedia('(max-width: 767px)');
        const previousFocus = document.activeElement as HTMLElement | null;
        const previousOverflow = document.body.style.overflow;
        const focusable = () => Array.from(panelRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex="0"]') || []).filter((element) => element.getClientRects().length > 0);
        const syncMode = () => {
            document.body.style.overflow = media.matches ? 'hidden' : previousOverflow;
            if (media.matches) (focusable()[0] || panelRef.current)?.focus();
        };
        syncMode();
        media.addEventListener('change', syncMode);
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') { setExpanded(false); triggerRef.current?.focus(); }
            if (!media.matches || event.key !== 'Tab') return;
            const elements = focusable();
            const first = elements[0]; const last = elements[elements.length - 1];
            if (!first) { event.preventDefault(); panelRef.current?.focus(); return; }
            if (event.shiftKey && (document.activeElement === first || !panelRef.current?.contains(document.activeElement))) { event.preventDefault(); last.focus(); }
            else if (!event.shiftKey && (document.activeElement === last || !panelRef.current?.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => {
            document.body.style.overflow = previousOverflow;
            media.removeEventListener('change', syncMode);
            window.removeEventListener('keydown', onKeyDown);
            previousFocus?.focus();
        };
    }, [expanded]);

    return (
        <div className="municipal-panel p-3 sm:p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end">
                <div className="min-w-0 flex-1 lg:min-w-60">{primary}</div>

                {common && (
                    <div className="grid gap-2 sm:grid-cols-2 lg:flex lg:shrink-0 lg:items-end">
                        {common}
                    </div>
                )}

                <div className="flex flex-wrap items-center gap-2 lg:shrink-0 lg:justify-end">
                    {hasAdvanced && (
                        <button
                            type="button"
                            ref={triggerRef}
                            aria-controls={panelId}
                            aria-expanded={expanded}
                            aria-haspopup="dialog"
                            onClick={() => setExpanded((value) => !value)}
                            className="municipal-action municipal-action--secondary"
                        >
                            <SlidersHorizontal size={15} aria-hidden="true" />
                            Filters{activeFilters.length > 0 ? ` ${activeFilters.length}` : ''}
                        </button>
                    )}
                    {actions}
                </div>
            </div>

            {activeFilters.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5" aria-label="Active filters">
                    {activeFilters.map((filter) => (
                        <span key={filter} className="municipal-filter-chip">
                            {filter}
                        </span>
                    ))}
                </div>
            )}

            {hasAdvanced && (
                <div
                    id={panelId}
                    className={expanded
                        ? 'fixed inset-0 z-50 flex items-end md:static md:z-auto md:mt-3 md:block'
                        : 'hidden'}
                >
                    <button
                        type="button"
                        className="absolute inset-0 bg-slate-950/45 md:hidden"
                        aria-label="Close filters"
                        onClick={() => setExpanded(false)}
                    />
                    <div
                        ref={panelRef}
                        tabIndex={-1}
                        role="dialog"
                        aria-label={title}
                        className="municipal-filter-panel"
                    >
                        <div className="mb-4 flex items-center justify-between md:hidden">
                            <div>
                                <div className="text-xs font-bold uppercase tracking-wider text-[var(--municipal-brand)]">Filters</div>
                                <div className="mt-0.5 text-sm font-bold text-[var(--municipal-text)]">{title}</div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setExpanded(false)}
                                className="municipal-action municipal-action--secondary municipal-action--icon"
                                aria-label="Close filters"
                            >
                                <X size={16} aria-hidden="true" />
                            </button>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{advanced}</div>
                    </div>
                </div>
            )}
        </div>
    );
}
