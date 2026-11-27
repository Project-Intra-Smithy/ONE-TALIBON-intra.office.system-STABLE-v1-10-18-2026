import { personalTasks } from './departmentHeadFixtures';
import type { RoleKey } from './fixtures';
import type { IndividualTask } from '../resources/js/components/tasks/taskReadApi';

type FetchLike = typeof fetch;
type TaskState = 'open' | 'in_progress' | 'completed';

const readableRoles = new Set<RoleKey>(['employee', 'department_head']);
const taskState = (status: string): TaskState => status === 'completed' ? 'completed' : status === 'open' ? 'open' : 'in_progress';
const taskRows: IndividualTask[] = personalTasks.map((task) => ({
    id: task.id,
    kind: 'individual',
    title: task.title,
    instructions: `${task.reference} · Synthetic evaluation task.`,
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
    const rowsByRole = new Map<RoleKey, typeof taskRows>();
    return (async (input: RequestInfo | URL, init?: RequestInit) => {
        const { url, method } = requestParts(input, init);
        if (url.origin !== window.location.origin || !/^\/tasks(?:\/\d+|\/\d+\/(?:start|complete))?$/.test(url.pathname)) {
            return upstream(input, init);
        }
        if (!readableRoles.has(getRole())) return json({ message: 'Synthetic Task access is unavailable for this role.' }, 403);
        const role = getRole();
        let rows = rowsByRole.get(role);
        if (!rows) { rows = taskRows.map(task => ({ ...task })); rowsByRole.set(role, rows); }
        if (method !== 'GET') {
            if (method !== 'POST') return json({ message: 'Unsupported preview Task action.' }, 405);
            const now = new Date().toISOString();
            if (url.pathname === '/tasks') {
                let payload: unknown;
                try { payload = JSON.parse(typeof init?.body === 'string' ? init.body : ''); }
                catch { return json({ message: 'Invalid preview form.' }, 422); }
                if (!payload || typeof payload !== 'object' || Array.isArray(payload) ||
                    Object.keys(payload).some(key => key !== 'title') ||
                    !('title' in payload) || typeof payload.title !== 'string' ||
                    !payload.title.trim() || payload.title.trim().length > 255) {
                    return json({ message: 'Enter a preview Task title (1–255 characters).' }, 422);
                }
                const task = { id: Math.max(0, ...rows.map(item => item.id)) + 1,
                    kind: 'individual' as const, title: payload.title.trim(), instructions: 'SAMPLE local simulation; no municipal record saved.',
                    state: 'open' as TaskState, owning_department_id: 1, due_at: null,
                    completed_at: null, created_at: now, updated_at: now };
                rows.unshift(task);
                return json({ data: task }, 201);
            }
            const action = url.pathname.match(/^\/tasks\/(\d+)\/(start|complete)$/);
            const task = action ? rows.find(item => item.id === Number(action[1])) : null;
            if (!task) return json({ message: 'Preview Task not found.' }, 404);
            if ((action![2] === 'start' && task.state !== 'open') ||
                (action![2] === 'complete' && task.state !== 'in_progress')) {
                return json({ message: 'Invalid preview Task transition.' }, 409);
            }
            task.state = action![2] === 'start' ? 'in_progress' : 'completed';
            task.updated_at = now;
            task.completed_at = task.state === 'completed' ? now : null;
            return json({ data: task });
        }

        const detail = url.pathname.match(/^\/tasks\/(\d+)$/);
        if (detail) {
            const item = rows.find((task) => task.id === Number(detail[1]));
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
        const filtered = state ? rows.filter((task) => task.state === state) : rows;
        const start = (page - 1) * perPage;
        return json({ data: filtered.slice(start, start + perPage), meta: { page, per_page: perPage, total: filtered.length, last_page: Math.max(1, Math.ceil(filtered.length / perPage)) } });
    }) as FetchLike;
}

export function installSyntheticTaskReadAdapter(getRole: () => RoleKey) {
    const upstream = window.fetch.bind(window);
    window.fetch = createSyntheticTaskFetch(getRole, upstream);
    return () => { window.fetch = upstream; };
}
