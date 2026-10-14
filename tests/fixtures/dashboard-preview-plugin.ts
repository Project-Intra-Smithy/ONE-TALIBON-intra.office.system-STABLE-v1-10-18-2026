import type { Plugin } from 'vite';

// Only Vite serve mounts these synthetic responses. No proxy, session or backend.
export function dashboardPreviewPlugin(): Plugin {
    return {
        name: 'synthetic-dashboard-preview',
        apply: 'serve',
        configureServer(server) {
            server.middlewares.use((req, res, next) => {
                const url = new URL(req.url ?? '/', 'http://localhost');
                if (!url.pathname.startsWith('/__dashboard-preview/')) return next();
                res.setHeader('Content-Type', 'application/json');
                res.setHeader('Cache-Control', 'no-store');
                if (req.method !== 'GET') { res.statusCode = 405; res.end('{}'); return; }
                if (url.pathname === '/__dashboard-preview/ready') { res.end(JSON.stringify({ preview: 'synthetic-dashboard-only' })); return; }
                if (url.pathname === '/__dashboard-preview/tasks') {
                    res.end(JSON.stringify({ data: [], meta: { page: 1, per_page: 10, total: 0, last_page: 1 } })); return;
                }
                if (url.pathname === '/__dashboard-preview/notifications/feed') {
                    res.end(JSON.stringify({ notifications: [], unreadMemoCount: 0, pendingMemo: null, unreadPlatformNotificationCount: 0, notificationCount: 0 })); return;
                }
                res.statusCode = 404; res.end('{}');
            });
        },
    };
}
