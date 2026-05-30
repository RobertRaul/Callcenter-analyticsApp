import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { RealtimeAgent, AgentStatistics } from '../../services/agentsApi';
import { formatDuration } from '../../lib/format';
import { getInitials } from '../../lib/text';

interface AgentCardProps {
  agent: RealtimeAgent;
  stats?: AgentStatistics;
  onPress: (agent: RealtimeAgent) => void;
}

export const STATUS_CONFIG = {
  available: { label: 'Disponible', color: '#4ade80', bg: '#0d2018', border: '#1a4731' },
  on_call:   { label: 'En llamada', color: '#60a5fa', bg: '#0d1a35', border: '#1e3a6e' },
  paused:    { label: 'Pausa',      color: '#fbbf24', bg: '#2a1c08', border: '#5c3a0e' },
  offline:   { label: 'Fuera',      color: '#718096', bg: '#1a1a1a', border: '#2d2d2d' },
};

export default function AgentCard({ agent, stats, onPress }: AgentCardProps) {
  const cfg = STATUS_CONFIG[agent.status] ?? STATUS_CONFIG.offline;
  const displayName = agent.name ?? agent.agent;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(agent)}
      activeOpacity={0.8}
    >
      {/* Avatar + status */}
      <View style={styles.left}>
        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(displayName)}</Text>
          </View>
          <View style={[styles.statusDot, { backgroundColor: cfg.color }]} />
        </View>
      </View>

      {/* Info */}
      <View style={styles.info}>
        <View style={styles.topRow}>
          <Text style={styles.name} numberOfLines={1}>{displayName}</Text>
          <View style={[styles.statusBadge, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
            <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
        </View>

        {agent.queue && (
          <Text style={styles.queue}>{agent.queue}</Text>
        )}

        {/* Métricas rápidas */}
        <View style={styles.metrics}>
          {stats && (
            <>
              <MetricPill label="Llamadas" value={String(stats.answered_calls ?? 0)} />
              <MetricPill label="TMO" value={formatDuration(stats.avg_duration)} />
              {stats.occupancy_rate !== undefined && (
                <MetricPill
                  label="Ocup."
                  value={`${Math.round(stats.occupancy_rate)}%`}
                  warn={stats.occupancy_rate > 85}
                />
              )}
            </>
          )}
          {agent.status === 'on_call' && agent.duration !== undefined && (
            <MetricPill label="Tiempo" value={formatDuration(agent.duration)} accent />
          )}
        </View>
      </View>

      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );
}

function MetricPill({ label, value, warn, accent }: {
  label: string; value: string; warn?: boolean; accent?: boolean;
}) {
  return (
    <View style={[
      styles.pill,
      warn   && styles.pillWarn,
      accent && styles.pillAccent,
    ]}>
      <Text style={[
        styles.pillLabel,
        warn   && styles.pillLabelWarn,
        accent && styles.pillLabelAccent,
      ]}>{label}</Text>
      <Text style={[
        styles.pillValue,
        warn   && styles.pillValueWarn,
        accent && styles.pillValueAccent,
      ]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1a1f36',
    borderRadius: 12, borderWidth: 0.5, borderColor: '#2d3561',
    padding: 14, marginBottom: 10, gap: 12,
  },
  left: { alignItems: 'center' },
  avatarWrap: { position: 'relative' },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#2d3561',
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { color: '#a0aec0', fontSize: 15, fontWeight: '600' },
  statusDot: {
    position: 'absolute', bottom: 0, right: 0,
    width: 12, height: 12, borderRadius: 6,
    borderWidth: 2, borderColor: '#1a1f36',
  },
  info: { flex: 1 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 },
  name: { color: '#e2e8f0', fontSize: 14, fontWeight: '600', flex: 1 },
  statusBadge: {
    paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: 10, borderWidth: 0.5,
  },
  statusText: { fontSize: 10, fontWeight: '600' },
  queue: { color: '#718096', fontSize: 11, marginBottom: 6 },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  pill: {
    flexDirection: 'row', gap: 3, alignItems: 'center',
    backgroundColor: '#0f1225', borderRadius: 6,
    paddingHorizontal: 7, paddingVertical: 3,
    borderWidth: 0.5, borderColor: '#2d3561',
  },
  pillWarn: { backgroundColor: '#2a1c08', borderColor: '#5c3a0e' },
  pillAccent: { backgroundColor: '#0d1a35', borderColor: '#1e3a6e' },
  pillLabel: { color: '#4a5568', fontSize: 10 },
  pillLabelWarn: { color: '#f59e0b' },
  pillLabelAccent: { color: '#3b82f6' },
  pillValue: { color: '#a0aec0', fontSize: 10, fontWeight: '600' },
  pillValueWarn: { color: '#fbbf24' },
  pillValueAccent: { color: '#60a5fa' },
  chevron: { color: '#4a5568', fontSize: 20 },
});
