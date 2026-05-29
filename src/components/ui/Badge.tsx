// Badge.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, Radius } from '../../theme/theme';
import { useTheme } from '../../theme/ThemeContext';

type BadgeVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'neutral';

interface BadgeProps { label: string; variant?: BadgeVariant; }

const BADGE_LIGHT: Record<BadgeVariant, { color: string; bg: string }> = {
  primary:   { color: Colors.primary,   bg: Colors.primaryLight   },
  secondary: { color: Colors.secondary, bg: Colors.secondaryLight },
  success:   { color: Colors.success,   bg: Colors.successLight   },
  warning:   { color: Colors.warning,   bg: Colors.warningLight   },
  error:     { color: Colors.error,     bg: Colors.errorLight     },
  neutral:   { color: '#4A5568',        bg: '#EDF2F7'             },
};
const BADGE_DARK: Record<BadgeVariant, { color: string; bg: string }> = {
  primary:   { color: '#60B4E0', bg: '#0D2030' },
  secondary: { color: '#E0B840', bg: '#201800' },
  success:   { color: '#4CAF50', bg: '#0D2010' },
  warning:   { color: '#E0B840', bg: '#201800' },
  error:     { color: '#EF5350', bg: '#200D0D' },
  neutral:   { color: '#8B949E', bg: '#1C2333' },
};

export function Badge({ label, variant = 'neutral' }: BadgeProps) {
  const { isDark } = useTheme();
  const cfg = isDark ? BADGE_DARK[variant] : BADGE_LIGHT[variant];
  return (
    <View style={[bStyles.badge, { backgroundColor: cfg.bg }]}>
      <Text style={[bStyles.text, { color: cfg.color }]}>{label}</Text>
    </View>
  );
}
const bStyles = StyleSheet.create({
  badge: { paddingHorizontal: Spacing.sm + 2, paddingVertical: 3, borderRadius: Radius.full },
  text:  { fontSize: Typography.xs, fontWeight: '600' as const },
});
export default Badge;
