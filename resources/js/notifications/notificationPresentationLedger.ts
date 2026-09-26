import type { LiveNotification } from '../types';

const STORAGE_PREFIX = 'talibon.notification-presentation.v1';
const MAX_PRESENTED_KEYS = 512;
const RECENT_NOTIFICATION_WINDOW_MS = 15_000;
const FUTURE_CLOCK_SKEW_MS = 5_000;

type StoredLedger = {
    version: 1;
    keys: string[];
};

type PresentationLedger = {
    initialized: boolean;
    keys: Set<string>;
    storageAvailable: boolean;
};

export type NotificationPresentationResult = {
    baselineEstablished: boolean;
    alertableNotifications: LiveNotification[];
};

const ledgers = new Map<string, PresentationLedger>();

function ledgerNamespace(userId: number): string {
    return String(userId);
}

function storageKey(userId: number): string {
    return `${STORAGE_PREFIX}.${userId}`;
}

function loadLedger(userId: number): PresentationLedger {
    const namespace = ledgerNamespace(userId);
    const cached = ledgers.get(namespace);
    if (cached) return cached;

    let storageAvailable = typeof window !== 'undefined';
    let initialized = false;
    const keys = new Set<string>();

    if (storageAvailable) {
        let raw: string | null = null;
        try {
            raw = window.sessionStorage.getItem(storageKey(userId));
        } catch {
            storageAvailable = false;
        }

        if (raw !== null) {
            try {
                const parsed = JSON.parse(raw) as Partial<StoredLedger>;
                if (parsed.version === 1 && Array.isArray(parsed.keys)) {
                    parsed.keys
                        .filter((key): key is string => typeof key === 'string' && key.length > 0)
                        .forEach((key) => keys.add(key));
                    initialized = true;
                }
            } catch {
                try { window.sessionStorage.removeItem(storageKey(userId)); }
                catch { storageAvailable = false; }
            }
        }
    }

    const ledger = { initialized, keys, storageAvailable };
    ledgers.set(namespace, ledger);

    return ledger;
}

function rememberKeys(ledger: PresentationLedger, notificationKeys: string[]): void {
    notificationKeys.forEach((key) => ledger.keys.add(key));

    while (ledger.keys.size > MAX_PRESENTED_KEYS) {
        const oldestKey = ledger.keys.values().next().value;
        if (typeof oldestKey !== 'string') break;
        ledger.keys.delete(oldestKey);
    }
}

function persistLedger(userId: number, ledger: PresentationLedger): void {
    if (!ledger.storageAvailable || typeof window === 'undefined') return;

    const payload: StoredLedger = {
        version: 1,
        keys: [...ledger.keys],
    };

    try {
        window.sessionStorage.setItem(storageKey(userId), JSON.stringify(payload));
    } catch {
        ledger.storageAvailable = false;
    }
}

function isRecent(notification: LiveNotification, now: number): boolean {
    if (!notification.created_at) return false;
    const createdAt = new Date(notification.created_at).getTime();
    if (Number.isNaN(createdAt)) return false;

    const age = now - createdAt;
    return age >= -FUTURE_CLOCK_SKEW_MS && age <= RECENT_NOTIFICATION_WINDOW_MS;
}

export function consumeTransactionNotificationFeed(
    userId: number,
    notifications: LiveNotification[],
    now = Date.now(),
): NotificationPresentationResult {
    const workflowNotifications = notifications.filter((notification) => notification.type === 'transaction');
    const ledger = loadLedger(userId);

    if (!ledger.initialized) {
        ledger.initialized = true;
        rememberKeys(ledger, workflowNotifications.map((notification) => notification.key));
        persistLedger(userId, ledger);

        return {
            baselineEstablished: true,
            alertableNotifications: ledger.storageAvailable
                ? workflowNotifications.filter((notification) => isRecent(notification, now))
                : [],
        };
    }

    const alertableNotifications = workflowNotifications.filter(
        (notification) => !ledger.keys.has(notification.key),
    );

    rememberKeys(ledger, workflowNotifications.map((notification) => notification.key));
    persistLedger(userId, ledger);

    return {
        baselineEstablished: false,
        alertableNotifications,
    };
}
