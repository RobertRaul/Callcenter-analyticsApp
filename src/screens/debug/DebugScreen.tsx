import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  TouchableOpacity, Share,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import logger from '../../lib/logger';

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'all';

const LEVEL_COLORS: Record<string, string> = {
  debug: '#718096',
  info:  '#60a5fa',
  warn:  '#fbbf24',
  error: '#f87171',
};

const LEVEL_BG: Record<string, string> = {
  debug: '#1a1a1a',
  info:  '#0d1a35',
  warn:  '#2a1c08',
  error: '#2d1515',
};

export default function DebugScreen() {
  const navigation = useNavigation();
  const [filter, setFilter] = useState<LogLevel>('all');
  const [, forceUpdate] = useState(0);

  const refresh = useCallback(() => forceUpdate(n => n + 1), []);

  const entries = logger.getHistory()
    .filter(e => filter === 'all' || e.level === filter)
    .reverse(); // más reciente primero

  const handleExport = async () => {
    const text = logger.getHistory()
      .map(e => `[${e.timestamp}] [${e.level.toUpperCase()}] [${e.context}] ${e.message}${e.data ? '\n  ' + JSON.stringify(e.data) : ''}`)
      .join('\n');
    await Share.share({ message: text, title: 'Call Center Analytics — Logs' });
  };

  const FILTERS: { key: LogLevel; label: string }[] = [
    { key:'all',   label:'Todo'  },
    { key:'error', label:'Error' },
    { key:'warn',  label:'Warn'  },
    { key:'info',  label:'Info'  },
    { key:'debug', label:'Debug' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.iconBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={[styles.iconBtnText, { fontSize: 26, lineHeight: 26 }]}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Consola de logs</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={refresh} style={styles.iconBtn}>
            <Text style={styles.iconBtnText}>↺</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleExport} style={styles.iconBtn}>
            <Text style={styles.iconBtnText}>⬆</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => { logger.clearHistory(); refresh(); }}
            style={styles.iconBtn}
          >
            <Text style={styles.iconBtnText}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Filtros */}
      <View style={styles.filterRow}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f.key}
            style={[
              styles.filterChip,
              filter === f.key && {
                backgroundColor: f.key === 'all' ? '#1e3a6e' : LEVEL_BG[f.key] ?? '#1e3a6e',
                borderColor: f.key === 'all' ? '#4f6ef7' : LEVEL_COLORS[f.key] ?? '#4f6ef7',
              },
            ]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[
              styles.filterText,
              filter === f.key && {
                color: f.key === 'all' ? '#60a5fa' : LEVEL_COLORS[f.key] ?? '#60a5fa',
                fontWeight: '600',
              },
            ]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
        <Text style={styles.count}>{entries.length} entradas</Text>
      </View>

      {/* Lista de logs */}
      <FlatList
        data={entries}
        keyExtractor={(_, i) => String(i)}
        renderItem={({ item }) => (
          <View style={[styles.entry, { backgroundColor: LEVEL_BG[item.level] ?? '#1a1a1a' }]}>
            <View style={styles.entryHeader}>
              <Text style={[styles.entryLevel, { color: LEVEL_COLORS[item.level] }]}>
                {item.level.toUpperCase()}
              </Text>
              <Text style={styles.entryContext}>{item.context}</Text>
              <Text style={styles.entryTime}>{item.timestamp}</Text>
            </View>
            <Text style={styles.entryMsg}>{item.message}</Text>
            {item.data !== undefined && (
              <Text style={styles.entryData}>
                {JSON.stringify(item.data, null, 2)}
              </Text>
            )}
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Sin logs registrados</Text>
          </View>
        }
        contentContainerStyle={{ padding: 8, paddingBottom: 40 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, backgroundColor:'#0f1225' },
  header: {
    flexDirection:'row', justifyContent:'space-between', alignItems:'center',
    paddingHorizontal:16, paddingTop:56, paddingBottom:12,
    backgroundColor:'#1a1f36', borderBottomWidth:0.5, borderBottomColor:'#2d3561',
  },
  headerLeft: { flexDirection:'row', alignItems:'center', gap:8 },
  title: { color:'#e2e8f0', fontSize:18, fontWeight:'600' },
  headerActions: { flexDirection:'row', gap:6 },
  iconBtn: {
    width:34, height:34, borderRadius:8,
    backgroundColor:'#2d3561', justifyContent:'center', alignItems:'center',
  },
  iconBtnText: { color:'#a0aec0', fontSize:16 },
  filterRow: {
    flexDirection:'row', alignItems:'center', flexWrap:'wrap',
    paddingHorizontal:10, paddingVertical:8, gap:6,
    borderBottomWidth:0.5, borderBottomColor:'#2d3561',
  },
  filterChip: {
    paddingHorizontal:10, paddingVertical:4,
    borderRadius:20, borderWidth:0.5,
    borderColor:'#2d3561', backgroundColor:'#1a1f36',
  },
  filterText: { color:'#718096', fontSize:11 },
  count: { color:'#4a5568', fontSize:11, marginLeft:'auto' },
  entry: {
    borderRadius:8, padding:10, marginBottom:6,
    borderWidth:0.5, borderColor:'#2d3561',
  },
  entryHeader: { flexDirection:'row', alignItems:'center', gap:8, marginBottom:4 },
  entryLevel: { fontSize:10, fontWeight:'700', minWidth:40 },
  entryContext: { color:'#a0aec0', fontSize:10, fontWeight:'500', flex:1 },
  entryTime: { color:'#4a5568', fontSize:10 },
  entryMsg: { color:'#e2e8f0', fontSize:12, lineHeight:18 },
  entryData: {
    color:'#718096', fontSize:10, fontFamily:'monospace',
    marginTop:4, lineHeight:16,
  },
  empty: { padding:40, alignItems:'center' },
  emptyText: { color:'#4a5568', fontSize:14 },
});
