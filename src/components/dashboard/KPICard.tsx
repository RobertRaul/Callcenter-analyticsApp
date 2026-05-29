import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface KPICardProps {
  label: string;
  value: string | number;
  sub?: string;
  accent?: 'blue' | 'green' | 'red' | 'amber' | 'purple';
  onPress?: () => void;
}

const ACCENTS = {
  blue:   { bg: '#0d1a35', border: '#1e3a6e', text: '#60a5fa', label: '#3b82f6' },
  green:  { bg: '#0d2018', border: '#1a4731', text: '#4ade80', label: '#22c55e' },
  red:    { bg: '#2d1515', border: '#5a2020', text: '#f87171', label: '#ef4444' },
  amber:  { bg: '#2a1c08', border: '#5c3a0e', text: '#fbbf24', label: '#f59e0b' },
  purple: { bg: '#1a1235', border: '#3b2a72', text: '#a78bfa', label: '#8b5cf6' },
};

export default function KPICard({ label, value, sub, accent = 'blue', onPress }: KPICardProps) {
  const colors = ACCENTS[accent];
  const Wrapper = onPress ? TouchableOpacity : View;

  return (
    <Wrapper
      style={[styles.card, { backgroundColor: colors.bg, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[styles.label, { color: colors.label }]}>{label}</Text>
      <Text style={[styles.value, { color: colors.text }]}>{value}</Text>
      {sub && <Text style={styles.sub}>{sub}</Text>}
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 0.5,
    padding: 14,
    minWidth: 140,
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  value: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 2,
  },
  sub: {
    fontSize: 12,
    color: '#718096',
    marginTop: 2,
  },
});
