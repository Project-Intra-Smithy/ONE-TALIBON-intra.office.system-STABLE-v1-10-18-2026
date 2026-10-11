export type Audience = 'all' | 'departments' | 'employees';

export function allowedMemoAudiences(value: unknown): Audience[] {
    return Array.isArray(value)
        ? value.filter((item): item is Audience => item === 'all' || item === 'departments' || item === 'employees')
        : [];
}

export function calendarAnchor(value: unknown, fallback: unknown): string | null {
    const valid = (date: unknown): date is string => typeof date === 'string'
        && /^\d{4}-\d{2}-\d{2}$/.test(date)
        && !Number.isNaN(Date.parse(`${date}T00:00:00Z`))
        && new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) === date;
    return valid(value) ? value : valid(fallback) ? fallback : null;
}

export function correspondenceOverviewCount(overview: unknown, key: string): number {
    if (!overview || typeof overview !== 'object') return 0;
    const counts = (overview as { counts?: Record<string, unknown> }).counts;
    const value = counts?.[key];
    return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : 0;
}
