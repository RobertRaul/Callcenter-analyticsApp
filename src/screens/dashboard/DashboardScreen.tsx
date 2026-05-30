import React, { useCallback } from 'react';
import {
  View, Text, ScrollView, RefreshControl,
  StyleSheet, TouchableOpacity,
} from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../stores/authStore';
import { useDashboardSummary, useDashboardEjecutivo } from '../../hooks/useDashboard';
import { normalizeAgentStatus } from '../../services/dashboardApi';
import { useTheme } from '../../theme/ThemeContext';
import { Colors, Typography, Spacing, Radius } from '../../theme/theme';
import AppHeader from '../../components/ui/AppHeader';
import Card from '../../components/ui/Card';
import KPICard from '../../components/ui/KPICard';
import StatusPill from '../../components/ui/StatusPill';
import { LoadingView, SectionHeader, Divider } from '../../components/ui/misc';
import { formatDuration } from '../../lib/format';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtSec = (s: number): string => formatDuration(s, { empty: '0s' });

function fmtPct(n: number): string {
  return `${Math.round(n)}%`;
}

function TrendBadge({ value, label }: { value: number; label: string }) {
  const isPos = value >= 0;
  const color = isPos ? Colors.success : Colors.error;
  return (
    <View style={[tb.wrap, { backgroundColor: color + '15' }]}>
      <Text style={[tb.text, { color }]}>{isPos ? '▲' : '▼'} {Math.abs(Math.round(value * 10) / 10)}%</Text>
      <Text style={[tb.label, { color: color + 'AA' }]}> {label}</Text>
    </View>
  );
}
const tb = StyleSheet.create({
  wrap:  { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full },
  text:  { fontSize: Typography.xs, fontWeight: '600' },
  label: { fontSize: Typography.xs },
});

// ─── Nivel de servicio ────────────────────────────────────────────────────────

function ServiceLevelBar({ value, target = 80 }: { value: number; target?: number }) {
  const { colors } = useTheme();
  const pct   = Math.min(Math.max(value, 0), 100);
  const color = pct >= target ? Colors.success : pct >= target * 0.85 ? Colors.warning : Colors.error;
  return (
    <Card style={{ marginBottom: Spacing.md }}>
      <View style={sl.row}>
        <View>
          <Text style={[sl.label, { color: colors.textSecondary }]}>Nivel de servicio</Text>
          <Text style={[sl.value, { color }]}>{fmtPct(pct)}</Text>
        </View>
        <View style={[sl.tag, { backgroundColor: color + '15' }]}>
          <View style={[sl.dot, { backgroundColor: color }]} />
          <Text style={[sl.tagText, { color }]}>
            {pct >= target ? 'Cumplido' : pct >= target * 0.85 ? 'En riesgo' : 'Crítico'}
          </Text>
        </View>
      </View>
      <View style={[sl.track, { backgroundColor: colors.surfaceAlt }]}>
        <View style={[sl.mark, { left: `${target}%` as any, backgroundColor: colors.borderStrong }]} />
        <View style={[sl.fill, { width: `${pct}%` as any, backgroundColor: color }]} />
      </View>
      <View style={sl.foot}>
        <Text style={[sl.ft, { color: colors.textTertiary }]}>Objetivo: {target}%</Text>
        <Text style={[sl.ft, { color: colors.textTertiary }]}>SLA actual: {fmtPct(pct)}</Text>
      </View>
    </Card>
  );
}
const sl = StyleSheet.create({
  row:    { flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start', marginBottom: Spacing.md },
  label:  { fontSize: Typography.xs, fontWeight:'500', marginBottom:4 },
  value:  { fontSize:32, fontWeight:'700', letterSpacing:-1 },
  tag:    { flexDirection:'row', alignItems:'center', gap:5, paddingHorizontal:10, paddingVertical:5, borderRadius: Radius.full },
  dot:    { width:6, height:6, borderRadius:3 },
  tagText:{ fontSize: Typography.xs, fontWeight:'600' },
  track:  { height:5, borderRadius:3, overflow:'hidden', position:'relative', marginBottom:6 },
  mark:   { position:'absolute', top:-2, bottom:-2, width:1.5, zIndex:1 },
  fill:   { height:'100%', borderRadius:3 },
  foot:   { flexDirection:'row', justifyContent:'space-between' },
  ft:     { fontSize: Typography.xs },
});

// ─── Gráfica horaria ──────────────────────────────────────────────────────────

function HourlyBars({ data }: { data: Array<{ hour: number; total_calls: number; answered_calls: number; missed_calls: number }> }) {
  const { colors } = useTheme();
  if (!data.length) return null;
  const max = Math.max(...data.map(d => d.total_calls), 1);
  const currentHour = new Date().getHours();
  return (
    <Card noPadding style={{ marginBottom: Spacing.md }}>
      <View style={{ padding: Spacing.lg, paddingBottom: Spacing.sm }}>
        <Text style={[hb.title, { color: colors.textSecondary }]}>Llamadas durante el día — por hora</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={hb.chart}>
        {data.map(item => {
          const hTotal = Math.max((item.total_calls    / max) * 56, 2);
          const hAns   = Math.max((item.answered_calls / max) * 56, 1);
          const hMiss  = Math.max((item.missed_calls   / max) * 56, item.missed_calls > 0 ? 1 : 0);
          const isNow  = item.hour === currentHour;
          return (
            <View key={item.hour} style={hb.group}>
              {/* Número encima */}
              {item.total_calls > 0 && (
                <Text style={[hb.count, { color: colors.textDisabled }]}>{item.total_calls}</Text>
              )}
              <View style={hb.stack}>
                {/* Barra respondidas (verde) */}
                <View style={[hb.bar, { height: hAns, backgroundColor: isNow ? Colors.success : Colors.success + '80' }]} />
                {/* Barra perdidas (rojo) encima */}
                {item.missed_calls > 0 && (
                  <View style={[hb.barTop, { height: hMiss, backgroundColor: Colors.error + '90' }]} />
                )}
              </View>
              <Text style={[hb.lbl, { color: isNow ? Colors.primary : colors.textDisabled, fontWeight: isNow ? '600' : '400' }]}>
                {String(item.hour).padStart(2, '0')}h
              </Text>
            </View>
          );
        })}
      </ScrollView>
      <View style={[hb.legend, { borderTopColor: colors.divider }]}>
        <View style={hb.li}><View style={[hb.ld, { backgroundColor: Colors.success + '80' }]} /><Text style={[hb.lt, { color: colors.textTertiary }]}>Respondidas</Text></View>
        <View style={hb.li}><View style={[hb.ld, { backgroundColor: Colors.error + '90' }]} /><Text style={[hb.lt, { color: colors.textTertiary }]}>No contestadas</Text></View>
      </View>
    </Card>
  );
}
const hb = StyleSheet.create({
  title:  { fontSize: Typography.xs, fontWeight:'500' },
  chart:  { flexDirection:'row', alignItems:'flex-end', gap:6, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm, minHeight:80 },
  group:  { alignItems:'center', minWidth:28 },
  count:  { fontSize:8, marginBottom:2 },
  stack:  { width:14, position:'relative', justifyContent:'flex-end' },
  bar:    { width:14, borderRadius:3, minHeight:2 },
  barTop: { position:'absolute', bottom:0, left:0, width:14, borderRadius:3 },
  lbl:    { fontSize:8, marginTop:4 },
  legend: { flexDirection:'row', gap: Spacing.lg, padding: Spacing.lg, paddingTop: Spacing.sm, borderTopWidth:0.5 },
  li:     { flexDirection:'row', alignItems:'center', gap:5 },
  ld:     { width:8, height:8, borderRadius:4 },
  lt:     { fontSize: Typography.xs },
});

// ─── Pantalla principal ───────────────────────────────────────────────────────

export default function DashboardScreen() {
  const { user }       = useAuthStore();
  const { colors }     = useTheme();
  const queryClient    = useQueryClient();
  const [now, setNow]  = React.useState(new Date());

  React.useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const summary    = useDashboardSummary();
  const ejecutivo  = useDashboardEjecutivo();

  const isRefreshing = summary.isFetching || ejecutivo.isFetching;

  const onRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  }, [queryClient]);

  if (summary.isLoading) {
    return <LoadingView message="Cargando dashboard…" />;
  }

  const s   = summary.data;
  const ej  = ejecutivo.data;
  const hoy = s?.today;

  // KPIs del día
  const total         = hoy?.total_calls      ?? 0;
  const answered      = hoy?.answered_calls   ?? 0;
  const abandoned     = hoy?.abandoned_calls  ?? 0;
  const answerRate    = hoy?.answer_rate       ?? 0;
  const avgWait       = hoy?.avg_wait_time     ?? 0;
  const avgDuration   = hoy?.avg_duration      ?? 0;
  const maxWait       = hoy?.max_wait_time     ?? 0;
  const abandonRate   = total > 0 ? (abandoned / total) * 100 : 0;

  // Tendencias vs ayer
  const trends        = ej?.trends;
  const topAgent      = ej?.top_agent;
  const peakHour      = ej?.peak_hour;

  // Semana
  const week          = s?.week;

  // Agentes
  const agentsList    = (s?.agents ?? []).map(a => ({
    ...a,
    statusNorm: normalizeAgentStatus(a.status),
  }));
  const available = agentsList.filter(a => a.statusNorm === 'available').length;
  const onCall    = agentsList.filter(a => a.statusNorm === 'on_call').length;

  // Colas
  const queuesList = s?.queues ?? [];

  // Gráfica horaria desde ejecutivo
  const hourly = ej?.hourly_distribution ?? [];

  const timeStr  = now.toLocaleTimeString('es-PE', { hour:'2-digit', minute:'2-digit', second:'2-digit' });
  const greeting = user?.full_name?.split(' ')[0] ?? user?.username ?? '';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader
        title="Dashboard"
        subtitle={timeStr}
        showThemeToggle
        rightAction={
          <View style={[styles.liveBadge, { backgroundColor: Colors.success + '15' }]}>
            <View style={[styles.liveDot, { backgroundColor: Colors.success }]} />
            <Text style={[styles.liveText, { color: Colors.success }]}>Vivo</Text>
          </View>
        }
      />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={Colors.primary} colors={[Colors.primary]} />
        }
      >
        <Text style={[styles.greeting, { color: colors.textSecondary }]}>
          Buenos días, {greeting}
        </Text>

        {/* Nivel de servicio — usando answer_rate como proxy de SLA */}
        <ServiceLevelBar value={answerRate} target={80} />

        {/* KPIs principales — fila 1 */}
        <View style={styles.kpiRow}>
          <KPICard
            label="Llamadas hoy"
            value={total}
            sub={`${answered} respondidas`}
            variant="primary"
            trend={trends ? { value: Math.round(trends.calls * 10) / 10, label: 'vs ayer' } : undefined}
          />
          <KPICard
            label="Tasa respuesta"
            value={`${Math.round(answerRate)}%`}
            sub={`${abandoned} abandonadas`}
            variant={answerRate >= 80 ? 'success' : answerRate >= 65 ? 'warning' : 'error'}
            trend={trends ? { value: Math.round(trends.answer_rate * 10) / 10, label: 'vs ayer' } : undefined}
          />
        </View>

        {/* KPIs fila 2 */}
        <View style={[styles.kpiRow, { marginBottom: Spacing.lg }]}>
          <KPICard
            label="Espera prom."
            value={fmtSec(avgWait)}
            sub={`Máx: ${fmtSec(maxWait)}`}
            variant={avgWait > 60 ? 'error' : avgWait > 30 ? 'warning' : 'success'}
          />
          <KPICard
            label="Duración prom."
            value={fmtSec(avgDuration)}
            sub="Tiempo de llamada"
            variant="secondary"
          />
        </View>

        {/* Semana */}
        {week && (
          <>
            <SectionHeader title="Resumen semanal" />
            <Card>
              <View style={styles.weekGrid}>
                <WeekStat label="Total" value={String(week.total_calls)} colors={colors} />
                <WeekStat label="Respondidas" value={`${week.answered_calls}`} sub={`${Math.round(week.answer_rate)}%`} accent={Colors.success} colors={colors} />
                <WeekStat label="Abandonadas" value={String(week.abandoned_calls)} accent={Colors.error} colors={colors} />
                <WeekStat label="Espera prom." value={fmtSec(week.avg_wait_time)} colors={colors} />
              </View>
            </Card>
          </>
        )}

        {/* Top agente + Hora pico */}
        {(topAgent || peakHour) && (
          <View style={styles.kpiRow}>
            {topAgent && (
              <Card style={{ flex:1, marginBottom:0 }}>
                <Text style={[styles.miniLabel, { color: colors.textTertiary }]}>AGENTE ESTRELLA</Text>
                <Text style={[styles.miniValue, { color: Colors.secondary }]} numberOfLines={1}>
                  {topAgent.agent_full}
                </Text>
                <Text style={[styles.miniSub, { color: colors.textSecondary }]}>
                  {topAgent.completed_calls} llamadas · {topAgent.total_talk_time_formatted}
                </Text>
              </Card>
            )}
            {peakHour && (
              <Card style={{ flex:1, marginBottom:0 }}>
                <Text style={[styles.miniLabel, { color: colors.textTertiary }]}>HORA PICO</Text>
                <Text style={[styles.miniValue, { color: Colors.primary }]}>
                  {String(peakHour.hour).padStart(2,'0')}:00h
                </Text>
                <Text style={[styles.miniSub, { color: colors.textSecondary }]}>
                  {peakHour.total_calls} llamadas · {peakHour.answered_calls} atendidas
                </Text>
              </Card>
            )}
          </View>
        )}

        {/* Agentes en tiempo real */}
        <SectionHeader
          title="Agentes en tiempo real"
          right={
            <View style={styles.agentSum}>
              <Text style={{ color: Colors.success, fontSize: Typography.sm, fontWeight:'600' }}>{available}</Text>
              <Text style={{ color: colors.textTertiary, fontSize: Typography.sm }}> disp. · </Text>
              <Text style={{ color: Colors.primary, fontSize: Typography.sm, fontWeight:'600' }}>{onCall}</Text>
              <Text style={{ color: colors.textTertiary, fontSize: Typography.sm }}> llamada</Text>
            </View>
          }
        />

        <Card noPadding>
          {agentsList.length === 0 ? (
            <View style={styles.emptyCell}>
              <Text style={[styles.emptyText, { color: colors.textDisabled }]}>Sin datos de agentes</Text>
            </View>
          ) : (
            agentsList.map((agent, i) => (
              <View key={`${agent.agent}-${i}`}>
                <View style={styles.agentRow}>
                  <View style={[styles.agentAv, { backgroundColor: Colors.primary + '15' }]}>
                    <Text style={[styles.agentInit, { color: Colors.primary }]}>
                      {agent.agent.slice(0, 2).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.agentInfo}>
                    <Text style={[styles.agentName, { color: colors.text }]}>{agent.agent}</Text>
                    <Text style={[styles.agentQ, { color: colors.textTertiary }]}>Cola {agent.queue}</Text>
                  </View>
                  <StatusPill status={agent.statusNorm} />
                </View>
                {i < agentsList.length - 1 && <Divider indent={60} />}
              </View>
            ))
          )}
        </Card>

        {/* Colas en tiempo real */}
        {queuesList.length > 0 && (
          <>
            <SectionHeader title="Colas activas" />
            <Card noPadding>
              {queuesList.map((q, i) => (
                <View key={`${q.queue_name}-${i}`}>
                  <View style={styles.queueRow}>
                    <View style={{ flex:1 }}>
                      <Text style={[styles.queueName, { color: colors.text }]}>Cola {q.queue_name}</Text>
                      <Text style={[styles.queueStat, { color: colors.textTertiary }]}>
                        <Text style={{ color: Colors.success }}>{q.available_agents}</Text> agentes ·{' '}
                        SLA 5min: <Text style={{ color: q.service_level_5min >= 80 ? Colors.success : Colors.error }}>
                          {Math.round(q.service_level_5min)}%
                        </Text>
                      </Text>
                    </View>
                    {q.calls_waiting > 0 && (
                      <View style={[styles.waitBadge, { backgroundColor: Colors.error + '15' }]}>
                        <Text style={[styles.waitText, { color: Colors.error }]}>{q.calls_waiting} espera</Text>
                      </View>
                    )}
                  </View>
                  {i < queuesList.length - 1 && <Divider indent={Spacing.lg} />}
                </View>
              ))}
            </Card>
          </>
        )}

        {/* Gráfica horaria */}
        {hourly.length > 0 && <HourlyBars data={hourly} />}

        <Text style={[styles.note, { color: colors.textDisabled }]}>
          Actualiza cada 30s · Desliza para refrescar
        </Text>
      </ScrollView>
    </View>
  );
}

function WeekStat({ label, value, sub, accent, colors }: {
  label: string; value: string; sub?: string; accent?: string; colors: any;
}) {
  return (
    <View style={ws.item}>
      <Text style={[ws.label, { color: colors.textTertiary }]}>{label}</Text>
      <Text style={[ws.value, { color: accent ?? colors.text }]}>{value}</Text>
      {sub && <Text style={[ws.sub, { color: accent ? accent + 'AA' : colors.textSecondary }]}>{sub}</Text>}
    </View>
  );
}
const ws = StyleSheet.create({
  item:  { flex:1, alignItems:'center' },
  label: { fontSize:9, fontWeight:'500', textTransform:'uppercase', letterSpacing:.5, marginBottom:4 },
  value: { fontSize:20, fontWeight:'700' },
  sub:   { fontSize:10, marginTop:1 },
});

const styles = StyleSheet.create({
  container:   { flex:1 },
  content:     { padding: Spacing.lg, paddingBottom:32 },
  greeting:    { fontSize: Typography.sm, marginBottom: Spacing.lg },
  kpiRow:      { flexDirection:'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  liveBadge:   { flexDirection:'row', alignItems:'center', gap:4, paddingHorizontal:8, paddingVertical:3, borderRadius: Radius.full },
  liveDot:     { width:5, height:5, borderRadius:3 },
  liveText:    { fontSize:10, fontWeight:'600' },
  weekGrid:    { flexDirection:'row', justifyContent:'space-between' },
  miniLabel:   { fontSize:9, fontWeight:'600', textTransform:'uppercase', letterSpacing:.5, marginBottom:4 },
  miniValue:   { fontSize:18, fontWeight:'700', marginBottom:2 },
  miniSub:     { fontSize:11 },
  agentSum:    { flexDirection:'row', alignItems:'center' },
  agentRow:    { flexDirection:'row', alignItems:'center', padding: Spacing.lg, gap: Spacing.md },
  agentAv:     { width:36, height:36, borderRadius:18, justifyContent:'center', alignItems:'center' },
  agentInit:   { fontSize: Typography.sm, fontWeight:'600' },
  agentInfo:   { flex:1 },
  agentName:   { fontSize: Typography.base, fontWeight:'500' },
  agentQ:      { fontSize: Typography.xs, marginTop:1 },
  emptyCell:   { padding: Spacing.xxl, alignItems:'center' },
  emptyText:   { fontSize: Typography.sm },
  queueRow:    { flexDirection:'row', justifyContent:'space-between', alignItems:'center', padding: Spacing.lg },
  queueName:   { fontSize: Typography.base, fontWeight:'500', marginBottom:3 },
  queueStat:   { fontSize: Typography.xs },
  waitBadge:   { paddingHorizontal:8, paddingVertical:3, borderRadius: Radius.full },
  waitText:    { fontSize: Typography.xs, fontWeight:'600' },
  note:        { fontSize: Typography.xs, textAlign:'center', marginTop: Spacing.md },
});
