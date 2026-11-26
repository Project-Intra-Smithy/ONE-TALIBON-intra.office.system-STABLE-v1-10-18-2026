export const humanize = (value: string) => value
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

export const formatDate = (value?: string | null) => {
    if (!value) return 'Not recorded';

    const date = new Date(value);
    return Number.isNaN(date.getTime())
        ? 'Not recorded'
        : date.toLocaleString('en-PH', {
            timeZone: 'Asia/Manila',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
        });
};

export const formatDateOnly = (value?: string | null) => {
    if (!value) return 'Not recorded';
    const date = new Date(value);
    return Number.isNaN(date.getTime())
        ? 'Not recorded'
        : date.toLocaleDateString('en-PH', { timeZone: 'Asia/Manila', month: 'short', day: 'numeric', year: 'numeric' });
};

export const formatTime = (value?: string | null) => {
    if (!value) return 'Not recorded';
    const date = new Date(value);
    return Number.isNaN(date.getTime())
        ? 'Not recorded'
        : date.toLocaleTimeString('en-PH', { timeZone: 'Asia/Manila', hour: 'numeric', minute: '2-digit' });
};

export const dueTone = {
    on_track: 'bg-[var(--status-neutral-bg)] text-[var(--status-neutral-fg)]',
    due_soon: 'bg-[var(--status-warn-bg)] text-[var(--status-warn-fg)]',
    overdue: 'bg-[var(--status-danger-bg)] text-[var(--status-danger-fg)]',
    completed: 'bg-[var(--status-ok-bg)] text-[var(--status-ok-fg)]',
} as const;
