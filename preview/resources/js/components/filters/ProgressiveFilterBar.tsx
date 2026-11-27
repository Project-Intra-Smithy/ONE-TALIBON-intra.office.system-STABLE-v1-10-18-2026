import { SlidersHorizontal, X } from 'lucide-react';
import { type ReactNode, useEffect, useId, useState } from 'react';

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
    const hasAdvanced = Boolean(advanced);

    useEffect(() => {
        if (!expanded) return;
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setExpanded(false);
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [expanded]);

    return (
        <div className="municipal-panel p-4 text-[var(--ink-primary)] sm:p-5">
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
                            aria-controls={panelId}
                            aria-expanded={expanded}
                            aria-haspopup="dialog"
                            onClick={() => setExpanded((value) => !value)}
                            className="municipal-secondary-button px-3 text-xs"
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
                        <span key={filter} className="rounded-md border border-[var(--status-info-border)] bg-[var(--status-info-bg)] px-2.5 py-1 text-xs font-semibold text-[var(--status-info-fg)]">
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
                        className="absolute inset-0 bg-black/50 md:hidden"
                        aria-label="Close filters"
                        onClick={() => setExpanded(false)}
                    />
                    <div
                        role="dialog"
                        aria-label={title}
                        className="relative z-10 max-h-[82vh] w-full overflow-y-auto rounded-t-xl bg-[var(--surface-elevated)] p-4 text-[var(--ink-primary)] shadow-2xl md:max-h-none md:rounded-xl md:border md:border-[var(--border-default)] md:bg-[var(--surface-recessed)] md:p-4 md:shadow-none"
                    >
                        <div className="mb-4 flex items-center justify-between md:hidden">
                            <div>
                                <div className="text-xs font-bold uppercase tracking-wider text-[var(--brand-ink)]">Filters</div>
                                <div className="mt-0.5 text-sm font-bold text-[var(--ink-primary)]">{title}</div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setExpanded(false)}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border-control)] text-[var(--ink-secondary)] hover:bg-[var(--surface-hover)]"
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
