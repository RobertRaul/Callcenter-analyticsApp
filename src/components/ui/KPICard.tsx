import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Colors, Typography, Spacing, Radius } from '../../theme/theme';

type Variant = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'neutral';

interface KPICardProps {
  label: string;
  value: string | number;
  sub?: string;
  variant?: Variant;
  onPress?: () => void;
  trend?: { value: number; label?: string };
}

const VARIANTS: Record<Variant, { text: string; bg: string; border: string }> = {
  primary:   { text: Colors.primary,       bg: Colors.primaryLight,   border: Colors.primary   + '30' },
  secondary: { text: Colors.secondary,     bg: Colors.secondaryLight, border: Colors.secondary + '30' },
  success:   { text: Colors.success,       bg: Colors.successLight,   border: Colors.success   + '30' },
  warning:   { text: Colors.warning,       bg: Colors.warningLight,   border: Colors.warning   + '30' },
  error:     { text: Colors.error,         bg: Colors.errorLight,     border: Colors.error     + '30' },
  neutral:   { text: '#4A5568',            bg: '#F7FAFC',             border: '#E2E8F0'               },
};

const VARIANTS_DARK: Record<Variant, { text: string; bg: string; border: string }> = {
  primary:   { text: '#60B4E0', bg: '#0D2030', border: '#1E4060' },
  secondary: { text: '#E0B840', bg: '#201800', border: '#403000' },
  success:   { text: '#4CAF50', bg: '#0D2010', border: '#1E4020' },
  warning:   { text: '#E0B840', bg: '#201800', border: '#403000' },
  error:     { text: '#EF5350', bg: '#200D0D', border: '#401010' },
  neutral:   { text: '#8B949E', bg: '#1C2333', border: '#30363D' },
};

export default function KPICard({ label, value, sub, variant = 'primary', onPress, trend }: KPICardProps) {
  const { isDark } = useTheme();
  const cfg = isDark ? VARIANTS_DARK[variant] : VARIANTS[variant];
  const Wrapper = onPress ? TouchableOpacity : View;

  return (
    <Wrapper
      style={[styles.card, { backgroundColor: cfg.bg, borderColor: cfg.border }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[styles.label, { color: cfg.text }]}>{label}</Text>
      <Text style={[styles.value, { color: cfg.text }]}>{value}</Text>
      {sub && <Text style={[styles.sub, { color: cfg.text + 'AA' }]}>{sub}</Text>}
      {trend && (
        <View style={styles.trendRow}>
          <Text style={[styles.trendText, { color: trend.value >= 0 ? Colors.success : Colors.error }]}>
            {trend.value >= 0 ? '▲' : '▼'} {Math.abs(trend.value)}%
          </Text>
          {trend.label && (
            <Text style={[styles.trendLabel, { color: cfg.text + '88' }]}> {trend.label}</Text>
          )}
        </View>
      )}
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: Radius.lg,
    borderWidth: 0.5,
    padding: Spacing.lg,
    minWidth: 140,
  },
  label: {
    fontSize: Typography.xs,
    fontWeight: Typography.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: Spacing.sm,
  },
  value: {
    fontSize: Typography.xxxl,
    fontWeight: Typography.bold,
    marginBottom: 2,
    letterSpacing: -0.5,
  },
  sub: {
    fontSize: Typography.xs,
    marginTop: 2,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  trendText: {
    fontSize: Typography.xs,
    fontWeight: Typography.semibold,
  },
  trendLabel: {
    fontSize: Typography.xs,
  },
});
