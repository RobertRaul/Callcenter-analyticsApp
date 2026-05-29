import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ServiceLevelGaugeProps {
  value: number;   // 0–100
  target?: number; // default 80
}

export default function ServiceLevelGauge({ value, target = 80 }: ServiceLevelGaugeProps) {
  const pct = Math.min(Math.max(value, 0), 100);
  const isGood = pct >= target;
  const isWarn = pct >= target * 0.85 && pct < target;

  const color = isGood ? '#4ade80' : isWarn ? '#fbbf24' : '#f87171';
  const bg    = isGood ? '#0d2018' : isWarn ? '#2a1c08' : '#2d1515';
  const border= isGood ? '#1a4731' : isWarn ? '#5c3a0e' : '#5a2020';

  return (
    <View style={[styles.container, { backgroundColor: bg, borderColor: border }]}>
      <Text style={styles.label}>Nivel de servicio</Text>
      <Text style={[styles.value, { color }]}>{Math.round(pct)}%</Text>
      {/* Barra de progreso */}
      <View style={styles.track}>
        {/* Línea de objetivo */}
        <View style={[styles.targetLine, { left: `${target}%` as any }]} />
        {/* Relleno */}
        <View style={[styles.fill, { width: `${pct}%` as any, backgroundColor: color }]} />
      </View>
      <View style={styles.footer}>
        <Text style={styles.footerText}>Objetivo: {target}%</Text>
        <Text style={[styles.footerStatus, { color }]}>
          {isGood ? '▲ Cumplido' : isWarn ? '◆ En riesgo' : '▼ Crítico'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 14, borderWidth: 0.5,
    padding: 16, marginBottom: 16,
  },
  label: { color: '#a0aec0', fontSize: 12, fontWeight: '500', marginBottom: 4 },
  value: { fontSize: 36, fontWeight: '700', marginBottom: 12 },
  track: {
    height: 6, backgroundColor: '#2d3561',
    borderRadius: 3, overflow: 'hidden',
    position: 'relative', marginBottom: 8,
  },
  fill: { height: '100%', borderRadius: 3 },
  targetLine: {
    position: 'absolute', top: -2, bottom: -2,
    width: 1.5, backgroundColor: '#718096', zIndex: 1,
  },
  footer: { flexDirection: 'row', justifyContent: 'space-between' },
  footerText: { color: '#718096', fontSize: 11 },
  footerStatus: { fontSize: 11, fontWeight: '600' },
});
