import { LayoutDashboard } from 'lucide-react';
import type { ScopeGroup } from './types';

export default function WorkScopeTabs({ groups, currentView, onSelect }: {
    groups: ScopeGroup[];
    currentView: string;
    onSelect: (view: string) => void;
}) {
    return (
        <nav className="municipal-panel flex min-w-0 items-center gap-2 overflow-x-auto p-2" aria-label="Task workspace views">
            <button
                type="button"
                onClick={() => onSelect('overview')}
                aria-current={currentView === 'overview' ? 'page' : undefined}
                className={`inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-md px-3 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--municipal-focus)] ${currentView === 'overview' ? 'bg-[var(--municipal-brand)] text-white' : 'text-[var(--municipal-brand)] hover:bg-[var(--municipal-hover)]'}`}
            >
                <LayoutDashboard size={14} aria-hidden="true" />
                Overview
            </button>

            {groups.map((group) => (
                <div key={group.key} className="flex shrink-0 items-center gap-1 border-l border-[var(--municipal-border)] pl-2">
                    <span className="px-1 text-[10px] font-bold uppercase tracking-wide text-[var(--municipal-muted)]">{group.label}</span>
                    {group.views.map((view) => {
                        const active = view.key === currentView;
                        return (
                            <button
                                key={view.key}
                                type="button"
                                onClick={() => onSelect(view.key)}
                                aria-current={active ? 'page' : undefined}
                                className={`inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-md px-2.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--municipal-focus)] ${active ? 'bg-[var(--municipal-selected-bg)] text-[var(--municipal-brand)] ring-1 ring-inset ring-[var(--municipal-selected-border)]' : 'text-[var(--municipal-text)] hover:bg-[var(--municipal-hover)]'}`}
                            >
                                <span>{view.label}</span>
                                <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${active ? 'bg-white/70' : 'bg-[var(--municipal-surface-subtle)] text-[var(--municipal-muted)]'}`}>{view.count}</span>
                            </button>
                        );
                    })}
                </div>
            ))}
        </nav>
    );
}
