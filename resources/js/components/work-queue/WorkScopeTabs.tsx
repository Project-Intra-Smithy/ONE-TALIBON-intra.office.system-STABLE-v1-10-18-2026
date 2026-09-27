import { ChevronLeft } from 'lucide-react';
import type { ScopeGroup } from './types';

export default function WorkScopeTabs({ groups, currentView, onSelect }: {
    groups: ScopeGroup[];
    currentView: string;
    onSelect: (view: string) => void;
}) {
    if (currentView === 'overview') return null;

    const currentGroup = groups.find((group) => group.views.some((view) => view.key === currentView));
    const current = currentGroup?.views.find((view) => view.key === currentView);

    return (
        <nav
            className="municipal-panel flex min-w-0 flex-wrap items-center gap-2 px-2.5 py-1.5"
            aria-label="Task workspace navigation"
        >
            <button
                type="button"
                onClick={() => onSelect('overview')}
                className="inline-flex min-h-9 shrink-0 items-center gap-1 rounded-md px-2 text-[11px] font-bold text-[var(--municipal-brand)] hover:bg-[var(--municipal-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--municipal-focus)]"
            >
                <ChevronLeft size={13} aria-hidden="true" />
                Overview
            </button>

            <span className="text-[10px] text-[var(--municipal-border-strong)]" aria-hidden="true">/</span>
            <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-[var(--municipal-muted)]">
                {currentGroup?.label || 'Work'}
            </span>
            <span className="text-[10px] text-[var(--municipal-border-strong)]" aria-hidden="true">/</span>

            <label className="min-w-[180px] flex-1 sm:max-w-[320px]">
                <span className="sr-only">Switch task view</span>
                <select
                    value={currentView}
                    onChange={(event) => onSelect(event.target.value)}
                    className="min-h-9 w-full rounded-md border border-[var(--municipal-border)] bg-[var(--municipal-surface)] px-2.5 text-[11px] font-semibold text-[var(--municipal-text)] outline-none focus:border-[var(--municipal-focus)] focus:ring-2 focus:ring-[var(--municipal-focus)]/20"
                    aria-label="Switch task view"
                >
                    {groups.map((group) => (
                        <optgroup key={group.key} label={group.label}>
                            {group.views.map((view) => (
                                <option key={view.key} value={view.key}>
                                    {view.label} ({view.count})
                                </option>
                            ))}
                        </optgroup>
                    ))}
                </select>
            </label>

            {current ? (
                <span className="ml-auto text-[10px] text-[var(--municipal-muted)]">
                    <strong className="text-[var(--municipal-text)]">{current.count}</strong> item{current.count === 1 ? '' : 's'}
                </span>
            ) : null}
        </nav>
    );
}
