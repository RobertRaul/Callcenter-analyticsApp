import { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import {
  registerForPushNotifications,
  addNotificationListeners,
  clearBadge,
  isExpoGo,
} from '../services/notificationsService';
import { useAuthStore } from '../stores/authStore';
import logger from '../lib/logger';

export function useNotifications() {
  const { isAuthenticated } = useAuthStore();
  const navigation          = useNavigation<any>();

  useEffect(() => {
    if (!isAuthenticated) return;

    registerForPushNotifications();
    clearBadge();

    if (isExpoGo()) {
      logger.info('Notifications',
        'Expo Go: alertas in-app activas ✓ | Push remoto: requiere development build'
      );
      return;
    }

    // Solo en builds nativos — listeners de notificaciones push
    let cleanup: (() => void) | null = null;

    addNotificationListeners(
      (notification: unknown) => {
        const n   = notification as any;
        const type = n?.request?.content?.data?.type;
        logger.info('Notifications', `Recibida: ${type}`);
      },
      (response: unknown) => {
        const r    = response as any;
        const data = r?.notification?.request?.content?.data ?? {};
        const type = String(data?.type ?? '');
        logger.info('Notifications', `Tocada: ${type}`);
        clearBadge();

        switch (type) {
          case 'queue_overflow':
          case 'abandon_rate_high':
          case 'sla_breach':
            navigation.navigate('Tabs', { screen: 'Dashboard' });
            break;
          case 'call_abandoned':
            navigation.navigate('Tabs', { screen: 'Calls' });
            break;
          case 'agent_not_responding':
            navigation.navigate('Tabs', { screen: 'Agents' });
            break;
          default:
            navigation.navigate('Tabs', { screen: 'Alerts' });
        }
      }
    ).then(fn => { cleanup = fn; });

    return () => { cleanup?.(); };
  }, [isAuthenticated]);
}
