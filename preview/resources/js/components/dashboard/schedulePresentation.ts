export function dateKey(value: string, timezone = 'Asia/Manila'): string | null {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        const date = new Date(`${value}T00:00:00Z`);
        return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value ? value : null;
    }
    const date = new Date(value);
    if (!Number.isFinite(date.getTime())) return null;
    try {
        const parts = new Intl.DateTimeFormat('en-US', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
        return ['year', 'month', 'day'].map(type => parts.find(part => part.type === type)?.value).join('-');
    } catch { return null; }
}

export function monthDays(anchor: string): string[] {
    const date = new Date(`${anchor.slice(0, 7)}-01T00:00:00Z`);
    if (!Number.isFinite(date.getTime())) return [];
    const count = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
    return Array.from({ length: count }, (_, index) => `${anchor.slice(0, 7)}-${String(index + 1).padStart(2, '0')}`);
}

export function intervalPosition(start: string, end: string | null | undefined, rangeStart: string, rangeEnd: string) {
    const [a, b, lo, hi] = [start, end ?? '', rangeStart, rangeEnd].map(Date.parse);
    if (![a, b, lo, hi].every(Number.isFinite) || b < a || hi <= lo || b < lo || a > hi) return null;
    return { left: (Math.max(a, lo) - lo) / (hi - lo) * 100, width: (Math.min(b, hi) - Math.max(a, lo)) / (hi - lo) * 100 };
}
