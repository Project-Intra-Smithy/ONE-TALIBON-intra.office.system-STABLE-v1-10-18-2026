import type { ScopeGroup } from './types';

const queueEmphasis: Record<string, string> = {
    needs_my_action: 'border-l-blue-700',
    due_soon: 'border-l-amber-500',
    overdue: 'border-l-rose-600',
    escalations: 'border-l-rose-600',
};

export default function WorkScopeTabs({ groups, currentView, onSelect }: {
    groups: ScopeGroup[];
    currentView: string;
    onSelect: (view: string) => void;
}) {
    return (
        <section
            className="municipal-panel space-y-4 p-3 text-[var(--ink-primary)] sm:p-5"
            aria-label="Work queues"
        >
            {groups.map((group) => (
                <div key={group.key}>
                    <div className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--ink-secondary)]">
                        {group.label}
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap" role="group" aria-label={`${group.label} queues`}>
                        {group.views.map((view) => {
                            const active = view.key === currentView;
                            const emphasis = queueEmphasis[view.key] || 'border-l-[var(--border-control)]';

                            return (
                                <button
                                    key={view.key}
                                    type="button"
                                    onClick={() => onSelect(view.key)}
                                    aria-pressed={active}
                                    aria-current={active ? 'page' : undefined}
                                    className={`min-w-0 rounded-lg border border-l-[3px] px-3 py-2.5 text-left transition sm:min-w-[132px] sm:flex-1 sm:basis-[132px] sm:max-w-[190px] ${emphasis} ${active ? 'border-[var(--brand-primary)] bg-[var(--brand-soft)] text-[var(--ink-primary)]' : 'border-[var(--border-default)] bg-[var(--surface-card)] text-[var(--ink-secondary)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)]'}`}
                                >
                                    <div className="text-xs font-bold leading-4">{view.label}</div>
                                    <div className={`mt-0.5 text-xs ${active ? 'text-[var(--brand-ink)]' : 'text-[var(--ink-secondary)]'}`}>
                                        {view.count} item{view.count === 1 ? '' : 's'}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            ))}
        </section>
    );
}
