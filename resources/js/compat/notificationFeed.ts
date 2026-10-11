import type { LiveNotification, NotificationFeed, PendingMemo } from '../types';

export const emptyNotificationFeed = (): NotificationFeed => ({
    pendingMemo: null,
    unreadMemoCount: 0,
    unreadPlatformNotificationCount: 0,
    notifications: [],
    notificationCount: 0,
});

const count = (value: unknown) => typeof value === 'number' && Number.isFinite(value)
    ? Math.max(0, Math.floor(value)) : 0;

export function parseNotificationFeed(value: unknown): NotificationFeed {
    if (!value || typeof value !== 'object') throw new Error('Invalid notification feed');
    const data = value as Record<string, unknown>;
    if (!Array.isArray(data.notifications)) throw new Error('Invalid notification list');
    const notifications: LiveNotification[] = data.notifications.filter((item): item is LiveNotification => {
        if (!item || typeof item !== 'object') return false;
        const row = item as Record<string, unknown>;
        return typeof row.key === 'string' && typeof row.title === 'string'
            && typeof row.message === 'string' && typeof row.url === 'string'
            && row.url.startsWith('/') && !row.url.startsWith('//');
    });
    const memo = data.pendingMemo;
    const pendingMemo: PendingMemo | null = memo && typeof memo === 'object'
        && typeof (memo as PendingMemo).id === 'number'
        && typeof (memo as PendingMemo).title === 'string'
        && typeof (memo as PendingMemo).memo_number === 'string'
        ? memo as PendingMemo : null;
    return {
        pendingMemo,
        unreadMemoCount: count(data.unreadMemoCount),
        unreadPlatformNotificationCount: count(data.unreadPlatformNotificationCount),
        notifications,
        notificationCount: count(data.notificationCount),
    };
}
