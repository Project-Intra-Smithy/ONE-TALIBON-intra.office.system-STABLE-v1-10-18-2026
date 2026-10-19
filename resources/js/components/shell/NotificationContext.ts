import { createContext, useContext } from 'react';
import type { LiveNotification } from '../../types';

export const NotificationContext = createContext<LiveNotification[]>([]);
export const usePortalNotifications = () => useContext(NotificationContext);

export type NotificationState = 'loading' | 'current' | 'unavailable' | 'expired';
export const NotificationStateContext = createContext<NotificationState>('loading');
export const useNotificationState = () => useContext(NotificationStateContext);
