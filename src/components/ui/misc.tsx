import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Colors, Typography, Spacing } from '../../theme/theme';

// ─── SectionHeader ────────────────────────────────────────────────────────────
export function SectionHeader({ title, right }: { title: string; right?: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={sh.row}>
      <Text style={[sh.title, { color: colors.textSecondary }]}>{title.toUpperCase()}</Text>
      {right}
    </View>
  );
}
const sh = StyleSheet.create({
  row:   { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom: Spacing.sm, marginTop: Spacing.md },
  title: { fontSize: Typography.xs, fontWeight:'600' as const, letterSpacing: 0.8 },
});
export default SectionHeader;

// ─── Divider ─────────────────────────────────────────────────────────────────
export function Divider({ indent }: { indent?: number }) {
  const { colors } = useTheme();
  return <View style={[dv.line, { backgroundColor: colors.divider, marginLeft: indent ?? 0 }]} />;
}
const dv = StyleSheet.create({ line: { height: 0.5 } });

// ─── EmptyState ───────────────────────────────────────────────────────────────
export function EmptyState({ icon, title, subtitle }: { icon: string; title: string; subtitle?: string }) {
  const { colors } = useTheme();
  return (
    <View style={es.container}>
      <Text style={[es.icon, { color: colors.textDisabled }]}>{icon}</Text>
      <Text style={[es.title, { color: colors.textSecondary }]}>{title}</Text>
      {subtitle && <Text style={[es.sub, { color: colors.textTertiary }]}>{subtitle}</Text>}
    </View>
  );
}
const es = StyleSheet.create({
  container: { flex:1, alignItems:'center', justifyContent:'center', padding: Spacing.xxxl, gap: Spacing.sm },
  icon:      { fontSize: 36, marginBottom: Spacing.sm },
  title:     { fontSize: Typography.md, fontWeight:'500' as const, textAlign:'center' },
  sub:       { fontSize: Typography.sm, textAlign:'center', lineHeight: 20 },
});

// ─── LoadingView ──────────────────────────────────────────────────────────────
export function LoadingView({ message }: { message?: string }) {
  const { colors } = useTheme();
  return (
    <View style={lv.container}>
      <ActivityIndicator color={Colors.primary} size="large" />
      {message && <Text style={[lv.text, { color: colors.textSecondary }]}>{message}</Text>}
    </View>
  );
}
const lv = StyleSheet.create({
  container: { flex:1, alignItems:'center', justifyContent:'center', gap: Spacing.md },
  text:      { fontSize: Typography.sm },
});
