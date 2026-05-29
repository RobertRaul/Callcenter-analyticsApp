import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { HourlyDistribution } from '../../services/dashboardApi';

interface HourlyChartProps {
  data: HourlyDistribution[];
}

export default function HourlyChart({ data }: HourlyChartProps) {
  if (!data.length) return null;

  const maxTotal = Math.max(...data.map(d => d.total), 1);
  const currentHour = new Date().getHours();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Distribución horaria — hoy</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chart}>
        {data.map(item => {
          const heightTotal    = Math.max((item.total / maxTotal) * 80, 2);
          const heightAnswered = Math.max((item.answered / maxTotal) * 80, 1);
          const isNow = item.hour === currentHour;

          return (
            <View key={item.hour} style={styles.barGroup}>
              {/* Barra total (fondo) */}
              <View style={styles.barTrack}>
                <View style={[
                  styles.barBg,
                  { height: heightTotal },
                  isNow && styles.barNowBg,
                ]} />
                {/* Barra respondidas (encima) */}
                <View style={[
                  styles.barFg,
                  { height: heightAnswered },
                  isNow && styles.barNowFg,
                ]} />
              </View>
              <Text style={[styles.hourLabel, isNow && styles.hourLabelNow]}>
                {String(item.hour).padStart(2, '0')}
              </Text>
              {isNow && <View style={styles.nowDot} />}
            </View>
          );
        })}
      </ScrollView>

      {/* Leyenda */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#2d3561' }]} />
          <Text style={styles.legendText}>Total</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#4f6ef7' }]} />
          <Text style={styles.legendText}>Respondidas</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#60a5fa' }]} />
          <Text style={styles.legendText}>Hora actual</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1f36',
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: '#2d3561',
    padding: 16,
    marginBottom: 16,
  },
  title: { color: '#a0aec0', fontSize: 12, fontWeight: '500', marginBottom: 16 },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingBottom: 4,
    gap: 4,
    minHeight: 100,
  },
  barGroup: { alignItems: 'center', width: 22 },
  barTrack: {
    width: 14,
    height: 80,
    justifyContent: 'flex-end',
    position: 'relative',
  },
  barBg: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#2d3561',
    borderRadius: 3,
  },
  barFg: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#4f6ef7',
    borderRadius: 3,
  },
  barNowBg: { backgroundColor: '#1e3a6e' },
  barNowFg: { backgroundColor: '#60a5fa' },
  hourLabel: { color: '#4a5568', fontSize: 9, marginTop: 4 },
  hourLabelNow: { color: '#60a5fa', fontWeight: '700' },
  nowDot: {
    width: 4, height: 4, borderRadius: 2,
    backgroundColor: '#60a5fa', marginTop: 2,
  },
  legend: { flexDirection: 'row', gap: 16, marginTop: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { color: '#718096', fontSize: 11 },
});
