import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { RealtimeAgentStatus } from '../../services/dashboardApi';

const STATUS_CONFIG: Record<RealtimeAgentStatus['status'], { label: string; color: string; bg: string }> = {
  available: { label: 'Disponible', color: '#4ade80', bg: '#0d2018' },
  on_call:   { label: 'En llamada', color: '#60a5fa', bg: '#0d1a35' },
  paused:    { label: 'Pausa',      color: '#fbbf24', bg: '#2a1c08' },
  offline:   { label: 'Fuera',      color: '#718096', bg: '#1a1a1a' },
};

export default function AgentStatusBadge({ status }: { status: RealtimeAgentStatus['status'] }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.offline;
  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
      <View style={[styles.dot, { backgroundColor: cfg.color }]} />
      <Text style={[styles.text, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    gap: 5,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  text: { fontSize: 11, fontWeight: '500' },
});
