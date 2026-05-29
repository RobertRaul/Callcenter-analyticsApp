import Constants from 'expo-constants';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import logger from '../lib/logger';

export type AlertType =
  | 'queue_overflow'
  | 'agent_not_responding'
  | 'abandon_rate_high'
  | 'call_abandoned'
  | 'sla_breach';

export interface PushAlert {
  type:  AlertType;
  title: string;
  body:  string;
  data?: Record<string, unknown>;
}

const PUSH_TOKEN_KEY = 'cc_push_token';

// Detectar Expo Go ANTES de cualquier import de expo-notifications
export function isExpoGo(): boolean {
  return Constants.executionEnvironment === 'storeClient';
}

// Inicializar handler de notificaciones — solo en builds nativos
export function initNotificationHandler(): void {
  if (isExpoGo()) return;
  try {
    // Import dinámico para evitar que el módulo se cargue en Expo Go
    const Notifications = require('expo-notifications');
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge:  true,
      }),
    });
  } catch {}
}

export async function registerForPushNotifications(): Promise<string | null> {
  if (isExpoGo()) {
    logger.info('Notifications', 'Expo Go — push remoto no disponible, alertas locales activas');
    return null;
  }

  try {
    const Device        = require('expo-device');
    const Notifications = require('expo-notifications');

    if (!Device.isDevice) return null;

    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;

    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      logger.warn('Notifications', 'Permisos denegados');
      return null;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('critical', {
        name:             'Alertas críticas',
        importance:       Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor:       '#2196C9',
        sound:            'default',
      });
      await Notifications.setNotificationChannelAsync('info', {
        name:       'Información',
        importance: Notifications.AndroidImportance.DEFAULT,
        sound:      'default',
      });
    }

    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    const token     = tokenData.data;

    await SecureStore.setItemAsync(PUSH_TOKEN_KEY, token);
    logger.info('Notifications', `Token obtenido: ${token.slice(0, 30)}...`);
    return token;
  } catch (err) {
    logger.error('Notifications', 'Error registrando notificaciones', err);
    return null;
  }
}

// Notificación local — en Expo Go usamos una alternativa simple sin expo-notifications
export async function sendLocalNotification(alert: PushAlert): Promise<void> {
  if (isExpoGo()) {
    // En Expo Go no podemos enviar notificaciones del sistema
    // Solo guardamos en el store local (useAlerts lo hace directamente)
    logger.info('Notifications', `[Local] ${alert.title}: ${alert.body}`);
    return;
  }

  try {
    const Notifications = require('expo-notifications');
    await Notifications.scheduleNotificationAsync({
      content: {
        title: alert.title,
        body:  alert.body,
        data:  { type: alert.type, ...alert.data },
        sound: 'default',
        badge: 1,
      },
      trigger: null,
    });
  } catch (err) {
    logger.error('Notifications', 'Error enviando notificación local', err);
  }
}

export async function addNotificationListeners(
  onReceived: (notification: unknown) => void,
  onResponse: (response: unknown) => void,
): Promise<(() => void) | null> {
  if (isExpoGo()) return null;

  try {
    const Notifications = require('expo-notifications');
    const sub1 = Notifications.addNotificationReceivedListener(onReceived);
    const sub2 = Notifications.addNotificationResponseReceivedListener(onResponse);
    return () => { sub1.remove(); sub2.remove(); };
  } catch {
    return null;
  }
}

export async function clearBadge(): Promise<void> {
  if (isExpoGo()) return;
  try {
    const Notifications = require('expo-notifications');
    await Notifications.setBadgeCountAsync(0);
  } catch {}
}
