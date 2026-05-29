import React, { useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  TouchableOpacity, Alert,
} from 'react-native';
import { useAlertsStore, AppAlert } from '../../stores/alertsStore';
import { AlertType } from '../../services/notificationsService';
import { useTheme } from '../../theme/ThemeContext';
import { Colors, Typography, Spacing, Radius } from '../../theme/theme';
import AppHeader from '../../components/ui/AppHeader';
import { EmptyState } from '../../components/ui/misc';

const ALERT_CONFIG: Record<AlertType, {
  icon: string; label: string;
  colorLight: string; colorDark: string;
  bgLight: string;   bgDark: string;
}> = {
  queue_overflow: {
    icon: '⚠', label: 'Cola saturada',
    colorLight: Colors.warning,  colorDark: '#E0B840',
    bgLight:    Colors.warningLight, bgDark: '#201800',
  },
  agent_not_responding: {
    icon: '◈', label: 'Agente sin responder',
    colorLight: Colors.error,   colorDark: '#EF5350',
    bgLight:    Colors.errorLight,   bgDark: '#200D0D',
  },
  abandon_rate_high: {
    icon: '↘', label: 'Abandono alto',
    colorLight: Colors.error,   colorDark: '#EF5350',
    bgLight:    Colors.errorLight,   bgDark: '#200D0D',
  },
  call_abandoned: {
    icon: '↗', label: 'Llamada perdida',
    colorLight: Colors.warning,  colorDark: '#E0B840',
    bgLight:    Colors.warningLight, bgDark: '#201800',
  },
  sla_breach: {
    icon: '◆', label: 'SLA incumplido',
    colorLight: Colors.error,   colorDark: '#EF5350',
    bgLight:    Colors.errorLight,   bgDark: '#200D0D',
  },
};

function formatRelative(date: Date): string {
  const diff = Date.now() - date.getTime();
  const m    = Math.floor(diff / 60_000);
  const h    = Math.floor(m / 60);
  if (m < 1)  return 'Ahora';
  if (m < 60) return `Hace ${m}m`;
  if (h < 24) return `Hace ${h}h`;
  return date.toLocaleDateString('es-PE', { day:'2-digit', month:'short' });
}

function AlertItem({ alert, onPress, onLongPress }: {
  alert: AppAlert;
  onPress: (a: AppAlert) => void;
  onLongPress: (a: AppAlert) => void;
}) {
  const { colors, isDark } = useTheme();
  const cfg   = ALERT_CONFIG[alert.type] ?? ALERT_CONFIG.queue_overflow;
  const color = isDark ? cfg.colorDark : cfg.colorLight;
  const bg    = isDark ? cfg.bgDark    : cfg.bgLight;

  return (
    <TouchableOpacity
      style={[
        styles.alertRow,
        { backgroundColor: colors.surface, borderBottomColor: colors.divider },
        !alert.read && { borderLeftWidth: 3, borderLeftColor: color },
      ]}
      onPress={() => onPress(alert)}
      onLongPress={() => onLongPress(alert)}
      activeOpacity={0.75}
    >
      <View style={[styles.alertIcon, { backgroundColor: bg }]}>
        <Text style={[styles.alertIconText, { color }]}>{cfg.icon}</Text>
      </View>
      <View style={styles.alertContent}>
        <View style={styles.alertTop}>
          <Text style={[styles.alertTitle, { color: colors.text },
            !alert.read && { fontWeight: '600' },
          ]} numberOfLines={1}>
            {alert.title}
          </Text>
          <Text style={[styles.alertTime, { color: colors.textDisabled }]}>
            {formatRelative(alert.createdAt)}
          </Text>
        </View>
        <Text style={[styles.alertMsg, { color: colors.textSecondary }]} numberOfLines={2}>
          {alert.message}
        </Text>
        <View style={[styles.typeBadge, { backgroundColor: bg }]}>
          <Text style={[styles.typeBadgeText, { color }]}>{cfg.label}</Text>
        </View>
      </View>
      {!alert.read && (
        <View style={[styles.unreadDot, { backgroundColor: color }]} />
      )}
    </TouchableOpacity>
  );
}

export default function AlertsScreen() {
  const { colors }      = useTheme();
  const { alerts, unreadCount, markRead, markAllRead, clearAll, addAlert } = useAlertsStore();

  // ── Botón de prueba para verificar que el sistema funciona ────────────────
  const handleTest = useCallback(() => {
    Alert.alert(
      'Prueba de alertas',
      'Elige el tipo de alerta a simular:',
      [
        {
          text: '⚠️ Cola saturada',
          onPress: () => addAlert({
            type:    'queue_overflow',
            title:   '⚠️ Cola saturada',
            message: 'Cola 1: 5 llamadas esperando. Agentes disponibles: 1',
            data:    { queue: '1', waiting: 5, test: true },
          }),
        },
        {
          text: '📉 Abandono alto',
          onPress: () => addAlert({
            type:    'abandon_rate_high',
            title:   '📉 Abandono alto',
            message: '22.5% de abandono hoy (18 llamadas perdidas)',
            data:    { abandon_rate: 22.5, test: true },
          }),
        },
        {
          text: '📵 Llamada perdida',
          onPress: () => addAlert({
            type:    'call_abandoned',
            title:   '📵 Llamada perdida',
            message: 'Una llamada fue abandonada sin ser atendida',
            data:    { test: true },
          }),
        },
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  }, [addAlert]);

  const handlePress = useCallback((alert: AppAlert) => {
    markRead(alert.id);
  }, [markRead]);

  const handleLongPress = useCallback((alert: AppAlert) => {
    Alert.alert(
      alert.title,
      alert.message,
      [
        { text: 'Marcar como leída', onPress: () => markRead(alert.id) },
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  }, [markRead]);

  const handleClearAll = useCallback(() => {
    Alert.alert(
      'Limpiar alertas',
      '¿Eliminar todas las alertas del historial?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Limpiar', style: 'destructive', onPress: clearAll },
      ]
    );
  }, [clearAll]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader
        title="Alertas"
        subtitle={unreadCount > 0 ? `${unreadCount} sin leer` : 'Al día'}
        showThemeToggle
        rightAction={
          alerts.length > 0 ? (
            <TouchableOpacity
              onPress={unreadCount > 0 ? markAllRead : handleClearAll}
              hitSlop={{ top:8, bottom:8, left:8, right:8 }}
            >
              <Text style={[styles.actionBtn, { color: Colors.primary }]}>
                {unreadCount > 0 ? 'Leer todo' : 'Limpiar'}
              </Text>
            </TouchableOpacity>
          ) : undefined
        }
      />

      {/* Botón de prueba — solo en desarrollo */}
      {__DEV__ && (
        <TouchableOpacity
          style={[styles.testBtn, {
            backgroundColor: Colors.secondary + '15',
            borderColor: Colors.secondary + '40',
          }]}
          onPress={handleTest}
        >
          <Text style={[styles.testBtnText, { color: Colors.secondary }]}>
            ◈ Simular alerta (modo dev)
          </Text>
        </TouchableOpacity>
      )}

      <FlatList
        data={alerts}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <AlertItem
            alert={item}
            onPress={handlePress}
            onLongPress={handleLongPress}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <EmptyState
              icon="◬"
              title="Sin alertas"
              subtitle={
                __DEV__
                  ? 'Usa el botón de arriba para simular una alerta.\nEn producción se generan automáticamente.'
                  : 'Las alertas críticas del call center aparecerán aquí automáticamente'
              }
            />
          </View>
        }
        contentContainerStyle={alerts.length === 0 ? styles.emptyContainer : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1 },
  actionBtn:    { fontSize: Typography.sm, fontWeight: '600' },
  testBtn: {
    margin: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 0.5,
    alignItems: 'center',
  },
  testBtnText:  { fontSize: Typography.sm, fontWeight: '500' },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.lg,
    borderBottomWidth: 0.5,
    gap: Spacing.md,
  },
  alertIcon: {
    width: 40, height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  alertIconText:  { fontSize: 18 },
  alertContent:   { flex: 1 },
  alertTop:       { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  alertTitle:     { fontSize: Typography.base, flex: 1 },
  alertTime:      { fontSize: Typography.xs, marginLeft: Spacing.sm },
  alertMsg:       { fontSize: Typography.sm, lineHeight: 18, marginBottom: Spacing.xs },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: Radius.full,
  },
  typeBadgeText:  { fontSize: 10, fontWeight: '500' },
  unreadDot: {
    width: 8, height: 8,
    borderRadius: 4,
    marginTop: 6,
    flexShrink: 0,
  },
  emptyContainer: { flex: 1 },
  emptyWrap:      { flex: 1 },
});
