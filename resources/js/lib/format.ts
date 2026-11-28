const PH_LOCALE = 'en-PH';
const PH_TIMEZONE = 'Asia/Manila';

const SLUG_LABELS: Record<string, string> = {
    planning: 'Planning & Development',
    administrative: 'Administrative',
    finance: 'Finance & Budget',
    engineering: 'Engineering & Infrastructure',
    social_welfare: 'Social Welfare',
    health: 'Health Services',
    hr: 'Human Resources',
    general: 'General Municipal',
    work_request: 'Work Request',
    in_progress: 'In Progress',
    for_review: 'Pending Review',
    received: 'Queued',
    completed: 'Completed',
    overdue: 'Overdue',
    due_soon: 'Due Soon',
    on_track: 'On Track',
    unassigned: 'Unassigned',
    normal: 'Normal',
    high: 'High',
    urgent: 'Urgent',
    priority: 'High',
    memorandum: 'Memoranda',
    plan: 'Development Plans',
    report: 'Reports',
    minutes: 'Minutes',
    endorsement: 'Endorsements',
    evidence: 'Supporting Evidence',
    active: 'Active',
    restricted_metadata: 'Restricted Metadata',
    file_unavailable: 'File Unavailable',
    ordinance: 'Ordinance',
    resolution: 'Resolution',
    executive_order: 'Executive Order',
    office_order: 'Office Order',
    administrative_order: 'Administrative Order',
    circular: 'Circular',
};

/** Converts backend slugs (e.g. "for_review", "planning", "priority") into readable municipal copy. */
export function humanizeSlug(value?: string | null): string {
    if (!value) return '—';
    const normalized = value.trim().toLowerCase();
    if (SLUG_LABELS[normalized]) return SLUG_LABELS[normalized];
    return value
        .replace(/[_-]+/g, ' ')
        .replace(/\b\w/g, (ch) => ch.toUpperCase());
}

export function formatDatePH(value?: string | Date | null, options?: Intl.DateTimeFormatOptions): string {
    if (!value) return '—';
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return new Intl.DateTimeFormat(PH_LOCALE, {
        timeZone: PH_TIMEZONE,
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        ...options,
    }).format(date);
}

export function formatDateTimePH(value?: string | Date | null): string {
    if (!value) return '—';
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return new Intl.DateTimeFormat(PH_LOCALE, {
        timeZone: PH_TIMEZONE,
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    }).format(date);
}

export function formatCurrencyPHP(amount?: number | string | null): string {
    const num = typeof amount === 'string' ? Number(amount) : amount;
    if (num === null || num === undefined || !Number.isFinite(num)) return '₱0.00';
    return new Intl.NumberFormat(PH_LOCALE, {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 2,
    }).format(num);
}

export function relativeTimePH(value?: string | null): string {
    if (!value) return '';
    const time = new Date(value).getTime();
    if (Number.isNaN(time)) return '';
    const seconds = Math.max(0, Math.floor((Date.now() - time) / 1000));
    if (seconds < 15) return 'Just now';
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return formatDatePH(value);
}

export const formatPHP = formatCurrencyPHP;
