import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AgentsStackParamList } from '../../navigation/AgentsNavigator';
import { useAgentDetail, useAgentStatistics } from '../../hooks/useAgents';
import { STATUS_CONFIG } from '../../components/agents/AgentCard';
import AgentHourlyChart from '../../components/agents/AgentHourlyChart';
import DateFilter from '../../components/ui/DateFilter';
import { todayStr } from '../../lib/dateHelpers';
import { formatDuration } from '../../lib/format';
import { getInitials } from '../../lib/text';

type Props = NativeStackScreenProps<AgentsStackParamList, 'AgentDetail'>;

type Tab = 'resumen' | 'colas' | 'historial';

function formatDate(d: string): string {
  return new Date(d).toLocaleString('es-PE', {
    day:'2-digit', month:'short',
    hour:'2-digit', minute:'2-digit',
  });
}

function StatRow({ label, value, color }: { label:string; value:string; color?:string }) {
  return (
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, color ? { color } : {}]}>{value}</Text>
    </View>
  );
}

function OccupancyBar({ value }: { value: number }) {
  const pct = Math.min(Math.max(value, 0), 100);
  const color = pct > 90 ? '#f87171' : pct > 75 ? '#fbbf24' : '#4ade80';
  return (
    <View style={styles.occWrap}>
      <View style={styles.occTrack}>
        <View style={[styles.occFill, { width:`${pct}%` as any, backgroundColor:color }]} />
      </View>
      <Text style={[styles.occPct, { color }]}>{Math.round(pct)}%</Text>
    </View>
  );
}

export default function AgentDetailScreen({ route, navigation }: Props) {
  const { agent } = route.params;
  const [activeTab, setActiveTab] = useState<Tab>('resumen');

  const [start, setStart] = useState(todayStr());
  const [end, setEnd]     = useState(todayStr());
  const filters  = { start_date: start, end_date: end };

  const { byQueue, hourly, history } = useAgentDetail(agent.agent, filters);
  const { data: allStats = [] } = useAgentStatistics(filters);
  const stats = allStats.find(s => s.agent === agent.agent);

  const cfg = STATUS_CONFIG[agent.status] ?? STATUS_CONFIG.offline;
  const displayName = agent.name ?? agent.agent;
  const initials = getInitials(displayName);

  const TABS: { key: Tab; label: string }[] = [
    { key:'resumen',  label:'Resumen'  },
    { key:'colas',    label:'Por cola' },
    { key:'historial',label:'Historial'},
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalle del agente</Text>
        <View style={{ width:40 }} />
      </View>

      <DateFilter start={start} end={end} onChange={(s, e) => { setStart(s); setEnd(e); }} />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Perfil */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.agentName}>{displayName}</Text>
          <Text style={styles.agentId}>ID: {agent.agent}</Text>
          {agent.queue && <Text style={styles.agentQueue}>{agent.queue}</Text>}
          <View style={[styles.statusBadge, { backgroundColor:cfg.bg, borderColor:cfg.border }]}>
            <View style={[styles.statusDot, { backgroundColor:cfg.color }]} />
            <Text style={[styles.statusText, { color:cfg.color }]}>{cfg.label}</Text>
            {agent.duration !== undefined && agent.duration > 0 && (
              <Text style={[styles.statusDuration, { color:cfg.color }]}>
                · {formatDuration(agent.duration)}
              </Text>
            )}
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          {TABS.map(t => (
            <TouchableOpacity
              key={t.key}
              style={[styles.tab, activeTab === t.key && styles.tabActive]}
              onPress={() => setActiveTab(t.key)}
            >
              <Text style={[styles.tabText, activeTab === t.key && styles.tabTextActive]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── RESUMEN ── */}
        {activeTab === 'resumen' && (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Métricas de hoy</Text>
              {stats ? (
                <>
                  <StatRow label="Llamadas respondidas" value={String(stats.answered_calls)} />
                  <StatRow label="Total llamadas"        value={String(stats.total_calls)} />
                  <StatRow label="Tiempo medio (TMO)"    value={formatDuration(stats.avg_duration)} />
                  <StatRow label="Espera promedio"       value={formatDuration(stats.avg_wait_time)} />
                  {stats.occupancy_rate !== undefined && (
                    <View style={styles.statRow}>
                      <Text style={styles.statLabel}>Ocupación</Text>
                      <OccupancyBar value={stats.occupancy_rate} />
                    </View>
                  )}
                </>
              ) : (
                <Text style={styles.noData}>Sin estadísticas disponibles hoy</Text>
              )}
            </View>

            {/* Gráfica horaria */}
            {hourly.isLoading ? (
              <ActivityIndicator color="#4f6ef7" style={{ marginVertical:16 }} />
            ) : (hourly.data?.length ?? 0) > 0 ? (
              <AgentHourlyChart data={hourly.data!} />
            ) : null}
          </>
        )}

        {/* ── POR COLA ── */}
        {activeTab === 'colas' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Rendimiento por cola</Text>
            {byQueue.isLoading ? (
              <ActivityIndicator color="#4f6ef7" style={{ marginVertical:16 }} />
            ) : (byQueue.data?.length ?? 0) > 0 ? (
              byQueue.data!.map((q, i) => (
                <View key={`${q.queue}-${i}`} style={styles.queueBlock}>
                  <Text style={styles.queueName}>{q.queue}</Text>
                  <View style={styles.queueStats}>
                    <MiniStat label="Total"    value={String(q.total_calls)} />
                    <MiniStat label="Resp."    value={String(q.answered_calls)} accent />
                    <MiniStat label="TMO"      value={formatDuration(q.avg_duration)} />
                    <MiniStat label="Espera"   value={formatDuration(q.avg_wait_time)} />
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.noData}>Sin datos por cola</Text>
            )}
          </View>
        )}

        {/* ── HISTORIAL ── */}
        {activeTab === 'historial' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Últimas llamadas hoy</Text>
            {history.isLoading ? (
              <ActivityIndicator color="#4f6ef7" style={{ marginVertical:16 }} />
            ) : (history.data?.length ?? 0) > 0 ? (
              history.data!.slice(0, 20).map((call, i) => (
                <View key={`${call.callid}-${i}`} style={styles.histRow}>
                  <View style={styles.histLeft}>
                    <Text style={styles.histPhone}>{call.src}</Text>
                    <Text style={styles.histDate}>{formatDate(call.calldate)}</Text>
                  </View>
                  <View style={styles.histRight}>
                    <Text style={[
                      styles.histDisp,
                      { color: call.disposition === 'ANSWERED' ? '#4ade80' : '#f87171' },
                    ]}>
                      {call.disposition}
                    </Text>
                    <Text style={styles.histDur}>{formatDuration(call.billsec || call.duration)}</Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.noData}>Sin llamadas registradas hoy</Text>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function MiniStat({ label, value, accent }: { label:string; value:string; accent?:boolean }) {
  return (
    <View style={styles.miniStat}>
      <Text style={styles.miniLabel}>{label}</Text>
      <Text style={[styles.miniValue, accent && { color:'#60a5fa' }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, backgroundColor:'#0f1225' },
  header: {
    flexDirection:'row', alignItems:'center', justifyContent:'space-between',
    paddingHorizontal:16, paddingTop:56, paddingBottom:12,
    backgroundColor:'#1a1f36', borderBottomWidth:0.5, borderBottomColor:'#2d3561',
  },
  backBtn: { width:40, height:40, justifyContent:'center' },
  backIcon: { color:'#4f6ef7', fontSize:28, lineHeight:32 },
  headerTitle: { color:'#e2e8f0', fontSize:16, fontWeight:'600' },
  content: { padding:16, paddingBottom:40 },
  profileCard: {
    backgroundColor:'#1a1f36', borderRadius:14,
    borderWidth:0.5, borderColor:'#2d3561',
    padding:20, alignItems:'center', marginBottom:14,
  },
  avatar: {
    width:64, height:64, borderRadius:32,
    backgroundColor:'#4f6ef7',
    justifyContent:'center', alignItems:'center', marginBottom:10,
  },
  avatarText: { color:'#fff', fontSize:22, fontWeight:'700' },
  agentName: { color:'#e2e8f0', fontSize:18, fontWeight:'600', marginBottom:2 },
  agentId:   { color:'#4a5568', fontSize:11, marginBottom:2 },
  agentQueue:{ color:'#718096', fontSize:12, marginBottom:8 },
  statusBadge: {
    flexDirection:'row', alignItems:'center', gap:6,
    paddingHorizontal:14, paddingVertical:6,
    borderRadius:20, borderWidth:0.5,
  },
  statusDot: { width:8, height:8, borderRadius:4 },
  statusText: { fontSize:13, fontWeight:'600' },
  statusDuration: { fontSize:12 },
  tabs: {
    flexDirection:'row', backgroundColor:'#1a1f36',
    borderRadius:10, padding:3, marginBottom:14,
    borderWidth:0.5, borderColor:'#2d3561',
  },
  tab: { flex:1, paddingVertical:8, alignItems:'center', borderRadius:8 },
  tabActive: { backgroundColor:'#2d3561' },
  tabText: { color:'#718096', fontSize:13 },
  tabTextActive: { color:'#e2e8f0', fontWeight:'600' },
  card: {
    backgroundColor:'#1a1f36', borderRadius:14,
    borderWidth:0.5, borderColor:'#2d3561',
    padding:14, marginBottom:12,
  },
  cardTitle: {
    color:'#a0aec0', fontSize:11, fontWeight:'500',
    textTransform:'uppercase', letterSpacing:0.5, marginBottom:12,
  },
  statRow: {
    flexDirection:'row', justifyContent:'space-between', alignItems:'center',
    paddingVertical:10, borderBottomWidth:0.5, borderBottomColor:'#2d3561',
  },
  statLabel: { color:'#718096', fontSize:13 },
  statValue: { color:'#e2e8f0', fontSize:13, fontWeight:'500' },
  occWrap: { flexDirection:'row', alignItems:'center', gap:8, flex:1, justifyContent:'flex-end' },
  occTrack: {
    width:80, height:4, backgroundColor:'#2d3561',
    borderRadius:2, overflow:'hidden',
  },
  occFill: { height:'100%', borderRadius:2 },
  occPct: { fontSize:12, fontWeight:'600', minWidth:34, textAlign:'right' },
  noData: { color:'#4a5568', fontSize:13, textAlign:'center', paddingVertical:16 },
  queueBlock: {
    paddingVertical:12,
    borderBottomWidth:0.5, borderBottomColor:'#2d3561',
  },
  queueName: { color:'#e2e8f0', fontSize:13, fontWeight:'600', marginBottom:8 },
  queueStats: { flexDirection:'row', gap:10 },
  miniStat: {
    flex:1, backgroundColor:'#0f1225',
    borderRadius:8, padding:8, alignItems:'center',
    borderWidth:0.5, borderColor:'#2d3561',
  },
  miniLabel: { color:'#4a5568', fontSize:9, marginBottom:3 },
  miniValue: { color:'#a0aec0', fontSize:13, fontWeight:'600' },
  histRow: {
    flexDirection:'row', justifyContent:'space-between',
    paddingVertical:9, borderBottomWidth:0.5, borderBottomColor:'#2d3561',
  },
  histLeft: { gap:2 },
  histPhone: { color:'#e2e8f0', fontSize:13, fontWeight:'500' },
  histDate:  { color:'#4a5568', fontSize:10 },
  histRight: { alignItems:'flex-end', gap:2 },
  histDisp:  { fontSize:11, fontWeight:'600' },
  histDur:   { color:'#718096', fontSize:10 },
});
