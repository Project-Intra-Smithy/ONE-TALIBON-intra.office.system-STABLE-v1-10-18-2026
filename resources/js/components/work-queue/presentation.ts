export const humanizeWorkValue = (value: string) =>
    value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

export const formatWorkDate = (value?: string | null, fallback = 'Not set') => {
    if (!value) return fallback;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? fallback : date.toLocaleDateString();
};

export const formatWorkDateTime = (value?: string | null, fallback = 'Not recorded') => {
    if (!value) return fallback;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? fallback : date.toLocaleString();
};

export const workRelativeTime = (value?: string | null, now = Date.now()) => {
    if (!value) return null;
    const time = new Date(value).getTime();
    if (Number.isNaN(time)) return null;

    const seconds = Math.max(0, Math.floor((now - time) / 1000));
    if (seconds < 10) return 'just now';
    if (seconds < 60) return `${seconds}s ago`;

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    if (days < 14) return `${days}d ago`;

    return null;
};

export const workStatusTone = (status: string) => {
    switch (status) {
        case 'approved':
        case 'completed':
        case 'resolved':
            return 'employee-tone-success';
        case 'submitted':
        case 'assigned':
        case 'in_progress':
        case 'for_approval':
            return 'employee-tone-info';
        case 'for_review':
        case 'information_requested':
        case 'returned':
            return 'employee-tone-warning';
        case 'disapproved':
        case 'rejected':
        case 'escalated':
            return 'employee-tone-danger';
        case 'closed':
        default:
            return 'employee-tone-neutral';
    }
};

export const workDueTone = {
    on_track: 'employee-tone-neutral',
    due_soon: 'employee-tone-warning',
    overdue: 'employee-tone-danger',
    completed: 'employee-tone-success',
} as const;

export const workDueLabel = {
    on_track: 'On track',
    due_soon: 'Due soon',
    overdue: 'Overdue',
    completed: 'Completed',
} as const;
