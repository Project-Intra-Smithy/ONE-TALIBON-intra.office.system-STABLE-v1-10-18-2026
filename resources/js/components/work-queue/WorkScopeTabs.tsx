import type { ScopeGroup } from './types';

const queueEmphasis: Record<string, string> = {
    needs_my_action: 'border-l-[var(--municipal-success)]',
    due_soon: 'border-l-[var(--municipal-warning)]',
    overdue: 'border-l-[var(--municipal-danger)]',
    escalations: 'border-l-[var(--municipal-danger)]',
};

export default function WorkScopeTabs({ groups, currentView, onSelect }: {
    groups: ScopeGroup[];
    currentView: string;
    onSelect: (view: string) => void;
}) {
    return (
        <section className="municipal-panel space-y-2 p-2.5" aria-label="Work queues">
            {groups.map((group) => (
                <div key={group.key}>
                    <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[var(--municipal-muted)]">{group.label}</div>
                    <div className="flex flex-wrap gap-1.5" role="group" aria-label={`${group.label} queues`}>
                        {group.views.map((view) => {
                            const active = view.key === currentView;
                            const emphasis = queueEmphasis[view.key] || 'border-l-[var(--municipal-border-strong)]';
                            return (
                                <button
                                    key={view.key}
                                    type="button"
                                    onClick={() => onSelect(view.key)}
                                    aria-pressed={active}
                                    aria-current={active ? 'page' : undefined}
                                    className={`min-h-11 min-w-[128px] flex-1 basis-[128px] rounded-md border border-l-[3px] px-2.5 py-1.5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--municipal-focus)] ${emphasis} ${active ? 'border-[var(--municipal-selected-border)] bg-[var(--municipal-selected-bg)] text-[var(--municipal-text)]' : 'border-[var(--municipal-border)] bg-[var(--municipal-surface)] text-[var(--municipal-text)] hover:bg-[var(--municipal-hover)]'}`}
                                >
                                    <div className="text-xs font-bold leading-4">{view.label}</div>
                                    <div className="mt-0.5 text-[11px] text-[var(--municipal-muted)]">{view.count} item{view.count === 1 ? '' : 's'}</div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            ))}
        </section>
    );
}
