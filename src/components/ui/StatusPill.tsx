import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, Radius } from '../../theme/theme';
import { useTheme } from '../../theme/ThemeContext';

type AgentStatus = 'available' | 'on_call' | 'paused' | 'offline';

const STATUS_LIGHT: Record<AgentStatus, { label: string; color: string; bg: string }> = {
  available: { label: 'Disponible', color: Colors.success,   bg: Colors.successLight  },
  on_call:   { label: 'En llamada', color: Colors.primary,   bg: Colors.primaryLight  },
  paused:    { label: 'Pausa',      color: Colors.secondary, bg: Colors.secondaryLight},
  offline:   { label: 'Fuera',      color: '#718096',        bg: '#F7FAFC'            },
};

const STATUS_DARK: Record<AgentStatus, { label: string; color: string; bg: string }> = {
  available: { label: 'Disponible', color: '#4CAF50', bg: '#0D2010' },
  on_call:   { label: 'En llamada', color: '#60B4E0', bg: '#0D2030' },
  paused:    { label: 'Pausa',      color: '#E0B840', bg: '#201800' },
  offline:   { label: 'Fuera',      color: '#6E7681', bg: '#1C2333' },
};

export const STATUS_CONFIG_LIGHT = STATUS_LIGHT;
export const STATUS_CONFIG_DARK  = STATUS_DARK;

interface StatusPillProps {
  status: AgentStatus;
  showDot?: boolean;
}

export default function StatusPill({ status, showDot = true }: StatusPillProps) {
  const { isDark } = useTheme();
  const cfg = isDark ? STATUS_DARK[status] : STATUS_LIGHT[status];

  return (
    <View style={[styles.pill, { backgroundColor: cfg.bg }]}>
      {showDot && <View style={[styles.dot, { backgroundColor: cfg.color }]} />}
      <Text style={[styles.text, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    gap: Spacing.xs,
  },
  dot: {
    width: 6, height: 6, borderRadius: 3,
  },
  text: {
    fontSize: Typography.xs,
    fontWeight: Typography.semibold,
  },
});
