import { personalTasks } from './departmentHeadFixtures';
import type { RoleKey } from './fixtures';

type FetchLike = typeof fetch;
type TaskState = 'open' | 'in_progress' | 'completed';

const readableRoles = new Set<RoleKey>(['employee', 'department_head']);
const taskState = (status: string): TaskState => status === 'completed' ? 'completed' : status === 'open' ? 'open' : 'in_progress';
const taskRows = personalTasks.map((task) => ({
    id: task.id,
    kind: 'individual',
    title: task.title,
    instructions: `${task.reference} · Synthetic read-only evaluation task.`,
    state: taskState(task.status),
    owning_department_id: 1,
    due_at: task.dueAt ?? null,
    completed_at: task.status === 'completed' ? '2026-11-14T16:00:00+08:00' : null,
    created_at: '2026-11-01T09:00:00+08:00',
    updated_at: '2026-11-14T16:00:00+08:00',
}));

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'X-Request-ID': 'SYNTHETIC-TASK-READ' },
});

function requestParts(input: RequestInfo | URL, init?: RequestInit) {
    const request = input instanceof Request ? input : null;
    const url = new URL(request ? request.url : String(input), window.location.origin);
    return { url, method: (init?.method || request?.method || 'GET').toUpperCase() };
}

export function createSyntheticTaskFetch(getRole: () => RoleKey, upstream: FetchLike = window.fetch.bind(window)): FetchLike {
    return (async (input: RequestInfo | URL, init?: RequestInit) => {
        const { url, method } = requestParts(input, init);
        if (url.origin !== window.location.origin || !/^\/tasks(?:\/\d+|\/\d+\/(?:start|complete))?$/.test(url.pathname)) {
            return upstream(input, init);
        }
        if (!readableRoles.has(getRole())) return json({ message: 'Synthetic Task access is unavailable for this role.' }, 403);
        if (method !== 'GET') return json({ message: 'Synthetic Tasks are read-only; no change was saved.' }, 405);

        const detail = url.pathname.match(/^\/tasks\/(\d+)$/);
        if (detail) {
            const item = taskRows.find((task) => task.id === Number(detail[1]));
            return item ? json({ data: item }) : json({ message: 'Synthetic Task not found.' }, 404);
        }
        if (url.pathname !== '/tasks') return upstream(input, init);
        if ([...url.searchParams.keys()].some((key) => !['page', 'per_page', 'state'].includes(key))) {
            return json({ message: 'Unsupported synthetic Task query.' }, 422);
        }
        const page = Number(url.searchParams.get('page') || 1);
        const perPage = Number(url.searchParams.get('per_page') || 10);
        const state = url.searchParams.get('state');
        if (!Number.isInteger(page) || page < 1 || !Number.isInteger(perPage) || perPage < 1 || perPage > 20 || (state && !['open', 'in_progress', 'completed'].includes(state))) {
            return json({ message: 'Invalid synthetic Task query.' }, 422);
        }
        const filtered = state ? taskRows.filter((task) => task.state === state) : taskRows;
        const start = (page - 1) * perPage;
        return json({ data: filtered.slice(start, start + perPage), meta: { page, per_page: perPage, total: filtered.length, last_page: Math.max(1, Math.ceil(filtered.length / perPage)) } });
    }) as FetchLike;
}

export function installSyntheticTaskReadAdapter(getRole: () => RoleKey) {
    const upstream = window.fetch.bind(window);
    window.fetch = createSyntheticTaskFetch(getRole, upstream);
    return () => { window.fetch = upstream; };
}
