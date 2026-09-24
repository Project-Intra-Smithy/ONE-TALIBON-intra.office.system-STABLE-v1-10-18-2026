export type CalendarView = 'month' | 'week' | 'day' | 'schedule';
export type CalendarBucket = 'municipality' | 'office' | 'personal';
export type CalendarFilters = Record<CalendarBucket, boolean>;
export type DateOnly = string;

export type CalendarDepartment = {
    code: string;
    name: string;
    short_name?: string | null;
};

export type CalendarEvent = {
    id: number;
    event_key: string;
    event_type: string;
    title: string;
    description?: string | null;
    priority: string;
    starts_at: string;
    ends_at?: string | null;
    all_day: boolean;
    start_date: DateOnly;
    end_date?: DateOnly | null;
    start_time?: string | null;
    end_time?: string | null;
    location?: string | null;
    action_url?: string | null;
    status: string;
    department?: CalendarDepartment | null;
    calendar_bucket: CalendarBucket;
};

export type CalendarMeta = {
    view: CalendarView;
    anchor_date: DateOnly;
    today: DateOnly;
    range_start: string;
    range_end: string;
    timezone: string;
};

export type EventOpenHandler = (event: CalendarEvent, trigger: HTMLElement) => void;
