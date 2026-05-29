import { useEffect, useRef } from 'react';
import { useDashboardSummary } from './useDashboard';
import { sendLocalNotification, AlertType } from '../services/notificationsService';
import { useAlertsStore } from '../stores/alertsStore';
import { useAuthStore } from '../stores/authStore';
import logger from '../lib/logger';

const THRESHOLDS = {
  queueOverflow:   3,
  abandonRateHigh: 20,
};

const COOLDOWN_MS: Record<AlertType, number> = {
  queue_overflow:       5  * 60_000,
  agent_not_responding: 10 * 60_000,
  abandon_rate_high:    15 * 60_000,
  call_abandoned:       2  * 60_000,
  sla_breach:           10 * 60_000,
};

export function useAlerts() {
  const { isAuthenticated }  = useAuthStore();
  const { data: summary }    = useDashboardSummary();
  const addAlert             = useAlertsStore(s => s.addAlert);
  const lastAlertTime        = useRef<Partial<Record<AlertType, number>>>({});
  const prevAbandoned        = useRef<number>(0);

  function canAlert(type: AlertType): boolean {
    return Date.now() - (lastAlertTime.current[type] ?? 0) > COOLDOWN_MS[type];
  }

  function markAlerted(type: AlertType) {
    lastAlertTime.current[type] = Date.now();
  }

  function fireAlert(type: AlertType, title: string, message: string, data?: Record<string, unknown>) {
    if (!canAlert(type)) return;
    logger.warn('Alerts', `${type}: ${message}`);
    // Guardar en store (visible en AlertsScreen)
    addAlert({ type, title, message, data });
    // Enviar notificación del sistema (en Expo Go solo loguea)
    sendLocalNotification({ type, title, body: message, data });
    markAlerted(type);
  }

  useEffect(() => {
    if (!isAuthenticated || !summary) return;

    const today  = summary.today;
    const queues = summary.queues ?? [];

    // ── Cola saturada ─────────────────────────────────────────────────────
    queues.forEach(q => {
      if (q.calls_waiting >= THRESHOLDS.queueOverflow) {
        fireAlert(
          'queue_overflow',
          '⚠️ Cola saturada',
          `Cola ${q.queue_name}: ${q.calls_waiting} llamadas esperando. Agentes: ${q.available_agents}`,
          { queue: q.queue_name, waiting: q.calls_waiting }
        );
      }
    });

    if (!today) return;

    // ── Tasa de abandono alta ─────────────────────────────────────────────
    const abandonRate = today.total_calls > 0
      ? (today.abandoned_calls / today.total_calls) * 100
      : 0;

    if (abandonRate >= THRESHOLDS.abandonRateHigh) {
      fireAlert(
        'abandon_rate_high',
        '📉 Abandono alto',
        `${abandonRate.toFixed(1)}% de abandono hoy (${today.abandoned_calls} llamadas perdidas)`,
        { abandon_rate: abandonRate }
      );
    }

    // ── Nueva llamada abandonada ──────────────────────────────────────────
    const currentAbandoned = today.abandoned_calls;
    if (prevAbandoned.current > 0 && currentAbandoned > prevAbandoned.current) {
      fireAlert(
        'call_abandoned',
        '📵 Llamada perdida',
        `Una llamada fue abandonada sin ser atendida`,
        { total_abandoned: currentAbandoned }
      );
    }
    prevAbandoned.current = currentAbandoned;

  }, [summary, isAuthenticated]);
}
