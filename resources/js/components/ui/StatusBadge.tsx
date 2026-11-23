import type { ReactNode } from 'react';

export type BadgeTone = 'danger' | 'warn' | 'ok' | 'info' | 'neutral' | 'gold';

const toneClasses: Record<BadgeTone, string> = {
    danger: 'bg-[var(--status-danger-bg)] text-[var(--status-danger-fg)] border-[var(--status-danger-border)]',
    warn: 'bg-[var(--status-warn-bg)] text-[var(--status-warn-fg)] border-[var(--status-warn-border)]',
    ok: 'bg-[var(--status-ok-bg)] text-[var(--status-ok-fg)] border-[var(--status-ok-border)]',
    info: 'bg-[var(--status-info-bg)] text-[var(--status-info-fg)] border-[var(--status-info-border)]',
    neutral: 'bg-[var(--status-neutral-bg)] text-[var(--status-neutral-fg)] border-[var(--status-neutral-border)]',
    gold: 'bg-[var(--accent-gold-soft)] text-[var(--accent-gold-ink)] border-[var(--accent-gold)]/40',
};

export function StatusBadge({
    tone = 'neutral',
    children,
    className = '',
}: {
    tone?: BadgeTone;
    children: ReactNode;
    className?: string;
}) {
    return (
        <span
            className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-semibold leading-5 ${toneClasses[tone]} ${className}`}
        >
            {children}
        </span>
    );
}

export function toneForWorkState(state?: string | null): BadgeTone {
    const normalized = (state || '').toLowerCase();
    if (['overdue', 'urgent', 'rejected', 'denied', 'returned'].includes(normalized)) return 'danger';
    if (['high', 'priority', 'due_soon', 'for_review', 'needs_action', 'pending'].includes(normalized)) return 'warn';
    if (['completed', 'approved', 'active', 'acknowledged', 'good'].includes(normalized)) return 'ok';
    if (['in_progress', 'routed'].includes(normalized)) return 'info';
    return 'neutral';
}
