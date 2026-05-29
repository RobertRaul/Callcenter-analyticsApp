import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { AgentHourlyPerformance } from '../../services/agentsApi';

interface Props { data: AgentHourlyPerformance[] }

export default function AgentHourlyChart({ data }: Props) {
  if (!data.length) return null;
  const maxVal = Math.max(...data.map(d => d.total_calls), 1);
  const currentHour = new Date().getHours();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Llamadas por hora</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chart}>
        {data.map(item => {
          const hTotal = Math.max((item.total_calls / maxVal) * 64, 2);
          const hAns   = Math.max((item.answered_calls / maxVal) * 64, 1);
          const isNow  = item.hour === currentHour;
          return (
            <View key={item.hour} style={styles.barGroup}>
              <View style={styles.barTrack}>
                <View style={[styles.barBg, { height: hTotal }, isNow && styles.barNowBg]} />
                <View style={[styles.barFg, { height: hAns  }, isNow && styles.barNowFg]} />
              </View>
              <Text style={[styles.lbl, isNow && styles.lblNow]}>
                {String(item.hour).padStart(2,'0')}
              </Text>
            </View>
          );
        })}
      </ScrollView>
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor:'#2d3561' }]} />
          <Text style={styles.legendText}>Total</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor:'#4f6ef7' }]} />
          <Text style={styles.legendText}>Respondidas</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor:'#1a1f36', borderRadius:12,
    borderWidth:0.5, borderColor:'#2d3561', padding:14, marginBottom:12,
  },
  title: { color:'#a0aec0', fontSize:11, fontWeight:'500', marginBottom:12 },
  chart: { flexDirection:'row', alignItems:'flex-end', gap:4, minHeight:80 },
  barGroup: { alignItems:'center', width:20 },
  barTrack: { width:12, height:64, justifyContent:'flex-end', position:'relative' },
  barBg: { position:'absolute', bottom:0, left:0, right:0, backgroundColor:'#2d3561', borderRadius:3 },
  barFg: { position:'absolute', bottom:0, left:0, right:0, backgroundColor:'#4f6ef7', borderRadius:3 },
  barNowBg: { backgroundColor:'#1e3a6e' },
  barNowFg: { backgroundColor:'#60a5fa' },
  lbl: { color:'#4a5568', fontSize:8, marginTop:4 },
  lblNow: { color:'#60a5fa', fontWeight:'700' },
  legend: { flexDirection:'row', gap:14, marginTop:10 },
  legendItem: { flexDirection:'row', alignItems:'center', gap:5 },
  dot: { width:7, height:7, borderRadius:4 },
  legendText: { color:'#718096', fontSize:10 },
});
