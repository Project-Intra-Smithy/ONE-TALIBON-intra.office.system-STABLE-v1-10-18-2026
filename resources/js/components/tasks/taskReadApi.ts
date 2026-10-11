/**
 * A01-C1 read-only JSON consumer for individual personal Tasks.
 * Backend authority: Talibon-Sales-Prototype@92778ba06d992c278177e0354014ab1b77dbea82
 * GET /tasks and GET /tasks/{id} only. No Inertia visits, CSRF exceptions, or writes.
 */
export type TaskState = 'open' | 'in_progress' | 'completed';
export const TASK_STATES: readonly TaskState[] = ['open', 'in_progress', 'completed'];
export type IndividualTask = {
    id: number;
    kind: 'individual';
    title: string;
    instructions: string | null;
    state: TaskState;
    owning_department_id: number | null;
    due_at: string | null;
    completed_at: string | null;
    created_at: string | null;
    updated_at: string | null;
};
export type TaskPage = {
    data: IndividualTask[];
    meta: { page: number; per_page: number; total: number; last_page: number };
};
export type ReadError = {
    status: number | null;
    code: string | null;
    message: string;
    requestId: string | null;
    nextUrl: string | null;
};
export type ReadResult<T> =
    | { ok: true; data: T }
    | { ok: false; error: ReadError };

const taskStates = new Set<string>(TASK_STATES);
const record = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);
const timestamp = (value: unknown): value is string | null =>
    value === null || (typeof value === 'string' && !Number.isNaN(Date.parse(value)));
const uint = (value: unknown) => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
export function isIndividualTask(value: unknown): value is IndividualTask {
    if (!record(value)) return false;
    return uint(value.id) && value.id > 0 && value.kind === 'individual' &&
        typeof value.title === 'string' && (typeof value.instructions === 'string' || value.instructions === null) &&
        typeof value.state === 'string' && taskStates.has(value.state) &&
        (value.owning_department_id === null || uint(value.owning_department_id)) &&
        timestamp(value.due_at) && timestamp(value.completed_at) &&
        timestamp(value.created_at) && timestamp(value.updated_at);
}
export function parseTaskPage(value: unknown): TaskPage | null {
    if (!record(value) || !Array.isArray(value.data) || !value.data.every(isIndividualTask) || !record(value.meta)) return null;
    const { page, per_page, total, last_page } = value.meta;
    if (!uint(page) || page < 1 || page > 10000 || !uint(per_page) || per_page < 1 || per_page > 50 ||
        !uint(total) || !uint(last_page) || last_page < 1 ||
        (total > 0 && last_page < Math.ceil(total / per_page)) ||
        value.data.length > per_page) return null;
    return { data: value.data, meta: {page, per_page, total, last_page} };
}
export function parseTaskDetail(value: unknown): IndividualTask | null {
    return record(value) && isIndividualTask(value.data) ? value.data : null;
}
export function safeMfaNextUrl(value: unknown): string | null {
    if (typeof value !== 'string' || !value.startsWith('/security/mfa/') ||
        value.startsWith('//') || value.includes('\\') || /[\u0000-\u001f]/.test(value)) return null;
    try {
        const u = new URL(value, 'https://portal.local');
        if (u.origin !== 'https://portal.local' || !u.pathname.startsWith('/security/mfa/')) return null;
        return u.pathname + u.search + u.hash;
    } catch { return null; }
}
function httpError(status: number | null, body: unknown, requestId: string | null): ReadError {
    const b = record(body) ? body : {};
    const code = typeof b.code === 'string' ? b.code : null;
    const nextUrl = status === 403 && code === 'MFA_REQUIRED' ? safeMfaNextUrl(b.next_url) : null;
    let message = 'Personal tasks could not be loaded. Check the connection and try again.';
    if (status === 401) message = code === 'ACCOUNT_INACTIVE'
        ? 'Your account is inactive. Sign in with an active account or contact your administrator.'
        : 'Your session is no longer authenticated. Sign in again.';
    else if (status === 403) message = code === 'MFA_REQUIRED'
        ? 'Multi-factor verification is required before viewing personal tasks.'
        : 'Your current employee or department access does not permit this Task request.';
    else if (status === 404) message = 'Task unavailable or inaccessible.';
    else if (status === 419) message = 'Your session or security token expired. Sign in again before continuing.';
    else if (status === 422) message = 'The Task request was rejected. Reset the filters and try again.';
    else if (status === 429) message = 'Too many Task requests. Try again after the service permits it.';
    else if (status === 500 || status === 503) message = 'The Task service is temporarily unavailable.';
    return { status, code, message, nextUrl, requestId };
}
async function readTaskJson<T>(url: string, signal: AbortSignal, parse: (body: unknown) => T | null): Promise<ReadResult<T>> {
    let response: Response;
    try {
        response = await fetch(url, {
            method: 'GET', credentials: 'same-origin',
            headers: { Accept: 'application/json' },
            signal,
        });
    } catch {
        if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
        return { ok: false, error: httpError(null, null, null) };
    }
    const requestId = response.headers.get('X-Request-ID');
    let body: unknown;
    const json = response.headers.get('content-type')?.toLowerCase().includes('application/json');
    if (json) {
        try { body = await response.json(); } catch { body = null; }
    } else body = null;
    if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
    if (!response.ok) return { ok: false, error: httpError(response.status, body, requestId) };
    const parsed = parse(body);
    if (!json || parsed === null) return { ok: false,
        error: { status: null, code: 'INVALID_RESPONSE', message: 'The Task service returned an unexpected response. No task data was displayed.', requestId, nextUrl: null } };
    return { ok: true, data: parsed };
}
export function getPersonalTasks(state: TaskState, page: number, signal: AbortSignal): Promise<ReadResult<TaskPage>> {
    if (!taskStates.has(state) || !Number.isSafeInteger(page) || page < 1 || page > 10000)
        throw new Error('Invalid C1 list query');
    const query = new URLSearchParams({ page: String(page), per_page: '10', state });
    return readTaskJson('/tasks?' + query.toString(), signal, parseTaskPage);
}
export function getPersonalTask(id: number, signal: AbortSignal): Promise<ReadResult<IndividualTask>> {
    if (!Number.isSafeInteger(id) || id < 1) throw new Error('Invalid numeric Task ID');
    return readTaskJson('/tasks/' + id, signal, parseTaskDetail);
}
