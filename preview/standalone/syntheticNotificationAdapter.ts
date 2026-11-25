import { department, departmentWorkRequests } from './departmentHeadFixtures';
import type { RoleKey } from './fixtures';

type FetchLike = typeof fetch;

const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json', 'X-Request-ID': 'SYNTHETIC-NOTIFICATIONS' },
    });

export function createSyntheticNotificationFetch(
    getRole: () => RoleKey,
    upstream: FetchLike = window.fetch.bind(window),
): FetchLike {
    return (async (input: RequestInfo | URL, init?: RequestInit) => {
        const request = input instanceof Request ? input : null;
        const url = new URL(request ? request.url : String(input), window.location.origin);
        const method = (init?.method || request?.method || 'GET').toUpperCase();

        if (url.origin !== window.location.origin) {
            return upstream(input, init);
        }

        if (url.pathname === '/employees/presence' && method === 'POST') {
            return new Response(null, { status: 204 });
        }

        const MESSAGES_KEY = 'ot.synthetic.messages.v1';
        const seededGeneral = [
            {
                publicId: 'syn-msg-1',
                cursor: 1,
                channel: 'General',
                body: 'Good morning offices — updated 2026 Talibon CLUP & Base planning map plates are now published under Planning Maps for all LGU staff.',
                createdAt: '2026-11-14T08:15:00+08:00',
                isMine: false,
                sender: { name: 'Amihan Rivera', office: 'MPDO · Planning Officer II' },
            },
            {
                publicId: 'syn-msg-2',
                cursor: 2,
                channel: 'General',
                body: 'Noted from MEO. We are cross-checking the National Road corridor pins for Q4 AIP infrastructure reporting.',
                createdAt: '2026-11-14T08:22:00+08:00',
                isMine: false,
                sender: { name: 'Emilio Employee', office: 'MEO · Administrative Aide' },
            },
            {
                publicId: 'syn-msg-3',
                cursor: 3,
                channel: 'General',
                body: 'Thanks both — please attach barangay inspection photos directly to WR-SYN-2026-001 before Friday noon.',
                createdAt: '2026-11-14T08:28:00+08:00',
                isMine: true,
                sender: { name: 'Daniel Department Head', office: 'MPDO' },
            },
        ];

        type StoredMessage = (typeof seededGeneral)[number];
        const loadLocalMessages = (): StoredMessage[] => {
            try {
                const raw = window.localStorage.getItem(MESSAGES_KEY);
                const parsed = raw ? JSON.parse(raw) : [];
                return Array.isArray(parsed) ? (parsed as StoredMessage[]) : [];
            } catch {
                return [];
            }
        };

        if (url.pathname === '/messages/feed' && method === 'GET') {
            const channel = url.searchParams.get('channel') || 'General';
            const after = Number(url.searchParams.get('after') || '0');
            const all = [...seededGeneral, ...loadLocalMessages()].filter((msg) => msg.channel === channel && msg.cursor > after);
            return json({ data: all });
        }

        if (url.pathname === '/messages/feed' && method === 'POST') {
            let payload: { channel?: string; body?: string } = {};
            try {
                const rawBody = typeof init?.body === 'string' ? init.body : request ? await request.text() : '{}';
                payload = JSON.parse(rawBody || '{}') as { channel?: string; body?: string };
            } catch {
                return json({ message: 'Invalid message payload.' }, 422);
            }
            const channel = (payload.channel || 'General').trim();
            const body = (payload.body || '').trim();
            if (!body) return json({ message: 'Message body is required.' }, 422);

            const role = getRole();
            const senderMap: Record<RoleKey, { name: string; office: string }> = {
                employee: { name: 'Emilio Employee', office: 'MEO' },
                mpdc_designated_staff: { name: 'Amihan Rivera', office: 'MPDO' },
                department_head: { name: 'Daniel Department Head', office: 'MPDO' },
                executive_oversight: { name: 'Maria Executive', office: "Mayor's Office" },
                hr: { name: 'Helen HR Officer', office: 'HRMO' },
                system_administration: { name: 'Alex Administrator', office: 'MISO' },
            };
            const existing = loadLocalMessages();
            const nextCursor = Math.max(3, ...existing.map((m) => m.cursor)) + 1;
            const created: StoredMessage = {
                publicId: `syn-msg-${nextCursor}-${Date.now()}`,
                cursor: nextCursor,
                channel,
                body,
                createdAt: new Date().toISOString(),
                isMine: true,
                sender: senderMap[role] ?? senderMap.department_head,
            };
            try {
                window.localStorage.setItem(MESSAGES_KEY, JSON.stringify([...existing, created]));
            } catch {
                // Keep live response even if storage quota is full
            }
            return json({ data: created }, 201);
        }

        if (url.pathname === '/mayor-office/live' && method === 'GET') {
            const deptRef = { name: department.name, short_name: department.shortName };
            const toLiveTx = (row: (typeof departmentWorkRequests)[number]) => ({
                id: row.id,
                reference_no: row.reference,
                title: row.title,
                status: row.status,
                priority: row.priority,
                due_at: row.dueAt ?? null,
                origin_department: deptRef,
                current_department: deptRef,
            });
            const queue = departmentWorkRequests.slice(0, 5).map(toLiveTx);
            const overdue = departmentWorkRequests.filter((row) => row.dueState === 'overdue').map(toLiveTx);
            return json({
                queue,
                overdue,
                returned: [],
                bottlenecks: [{ current_department_id: department.id, open_count: 17, current_department: deptRef }],
                stats: {
                    forApproval: 2,
                    forReview: 3,
                    highPriority: 4,
                    total: queue.length,
                    municipalityOpen: 41,
                    municipalityOverdue: overdue.length,
                    returnedOrInfoRequested: 0,
                },
            });
        }

        const txLive = url.pathname.match(/^\/transactions\/(\d+)\/live$/);
        if (txLive && method === 'GET') {
            const item = departmentWorkRequests.find((row) => row.id === Number(txLive[1])) ?? departmentWorkRequests[0];
            return json({
                events: [],
                transaction: {
                    status: item.status,
                    current_department: {
                        id: department.id,
                        code: department.code,
                        name: department.name,
                        short_name: department.shortName,
                    },
                    assigned_employee: item.assignedEmployee
                        ? {
                              id: item.assignedEmployee.id,
                              employee_number: item.assignedEmployee.employee_number,
                              full_name: item.assignedEmployee.full_name,
                              position_title: item.assignedEmployee.position_title,
                          }
                        : null,
                    received_at: item.receivedAt ?? null,
                    due_at: item.dueAt ?? null,
                    completed_at: null,
                },
                accountability: {
                    dueState: item.dueState,
                    timeInCurrentOffice: '4 hours',
                    receivedAt: item.receivedAt ?? null,
                    dueAt: item.dueAt ?? null,
                    completedAt: null,
                },
                permissions: { canTransition: false, canMayorDecision: false, canAssign: false },
                assignableEmployees: [],
            });
        }

        if (url.pathname === '/notifications/feed' && method === 'GET') {
            const role = getRole();
            const isHead = role === 'department_head';
            const notifications = [
                {
                    key: 'syn-wr-1',
                    type: 'transaction',
                    title: isHead ? 'Needs Head Action' : 'Work Request Updated',
                    message: 'WR-SYN-2026-001 — Review planning evidence for Head action 01',
                    url: '/transactions/1',
                    created_at: '2026-11-14T08:45:00+08:00',
                    urgent: true,
                },
                {
                    key: 'syn-memo-1',
                    type: 'memorandum',
                    title: 'Official Memorandum',
                    message: 'MEMO-SYN-2026-001 — Records handling & retention reminder',
                    url: '/memoranda/1',
                    created_at: '2026-11-14T08:15:00+08:00',
                    urgent: false,
                },
                {
                    key: 'syn-corr-1',
                    type: 'correspondence',
                    title: 'Incoming Correspondence',
                    message: 'COR-SYN-2026-001 — Routed municipal coordination letter',
                    url: '/correspondence/1',
                    created_at: '2026-11-13T16:30:00+08:00',
                    urgent: false,
                },
            ];

            return json({
                pendingMemo: null,
                unreadMemoCount: 2,
                unreadPlatformNotificationCount: notifications.length,
                notifications,
                notificationCount: notifications.length,
            });
        }

        return upstream(input, init);
    }) as FetchLike;
}

export function installSyntheticNotificationAdapter(getRole: () => RoleKey) {
    const upstream = window.fetch.bind(window);
    window.fetch = createSyntheticNotificationFetch(getRole, upstream);
    return () => {
        window.fetch = upstream;
    };
}
