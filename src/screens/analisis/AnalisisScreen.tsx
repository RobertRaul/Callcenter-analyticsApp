import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import {
  useRanking, useSla, usePatrones, useHeatmap, useAbandono,
} from '../../hooks/useAnalisis';
import { useTheme } from '../../theme/ThemeContext';
import { Colors, Typography, Spacing, Radius } from '../../theme/theme';
import AppHeader from '../../components/ui/AppHeader';
import Card from '../../components/ui/Card';
import { Divider } from '../../components/ui/misc';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtSec(s: number): string {
  if (!s || s <= 0) return '0s';
  const m = Math.floor(s / 60);
  const sec = Math.round(s % 60);
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
}

function fmtPct(n: number): string {
  return `${Math.round(n * 10) / 10}%`;
}

// ─── Tab Ranking ─────────────────────────────────────────────────────────────

const BADGE_COLORS = {
  gold:   { color: '#C9960A', bg: '#FDF3DC', darkColor: '#E0B840', darkBg: '#201800' },
  silver: { color: '#718096', bg: '#EDF2F7', darkColor: '#A0AEC0', darkBg: '#1C2333' },
  bronze: { color: '#C05621', bg: '#FEEBCB', darkColor: '#ED8936', darkBg: '#1A0E00' },
  star:   { color: Colors.primary, bg: Colors.primaryLight, darkColor: '#60B4E0', darkBg: '#0D2030' },
};

function RankingTab() {
  const { colors, isDark } = useTheme();
  const { data, isLoading } = useRanking();

  if (isLoading) return <LoadingSection />;
  if (!data) return null;

  return (
    <ScrollView contentContainerStyle={styles.tabContent}>
      {/* Stats generales */}
      <Card>
        <View style={styles.statsRow}>
          <StatBox label="Agentes" value={String(data.total_agents)} colors={colors} />
          <StatBox label="Total llamadas" value={String(data.statistics.total_calls)} colors={colors} />
          <StatBox label="Prom. por agente" value={`${Math.round(data.statistics.average_calls_per_agent)}`} colors={colors} />
        </View>
      </Card>

      {/* Ranking */}
      <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>Ranking de agentes</Text>
      <Card noPadding>
        {data.ranking.map((agent, i) => {
          const bcfg = BADGE_COLORS[agent.badge] ?? BADGE_COLORS.star;
          const color = isDark ? bcfg.darkColor : bcfg.color;
          const bg    = isDark ? bcfg.darkBg    : bcfg.bg;
          return (
            <View key={agent.agent}>
              <View style={styles.rankRow}>
                {/* Posición */}
                <View style={[styles.rankPos, { backgroundColor: bg }]}>
                  <Text style={[styles.rankPosText, { color }]}>#{agent.rank}</Text>
                </View>
                {/* Info */}
                <View style={styles.rankInfo}>
                  <Text style={[styles.rankName, { color: colors.text }]}>{agent.agent_full}</Text>
                  <Text style={[styles.rankBadge, { color }]}>{agent.badge_label}</Text>
                </View>
                {/* Métricas */}
                <View style={styles.rankMetrics}>
                  <Text style={[styles.rankMain, { color }]}>{agent.total_calls}</Text>
                  <Text style={[styles.rankSub, { color: colors.textTertiary }]}>llamadas</Text>
                  <Text style={[styles.rankVsAvg, {
                    color: agent.vs_average >= 0 ? Colors.success : Colors.error,
                  }]}>
                    {agent.vs_average >= 0 ? '+' : ''}{Math.round(agent.vs_average)}%
                  </Text>
                </View>
              </View>
              {/* Barra de tiempo */}
              <View style={[styles.rankBar, { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md }]}>
                <View style={styles.rankBarRow}>
                  <Text style={[styles.rankBarLabel, { color: colors.textTertiary }]}>
                    Tiempo total: {agent.total_talk_time_formatted}
                  </Text>
                  <Text style={[styles.rankBarLabel, { color: colors.textTertiary }]}>
                    TMO: {fmtSec(agent.avg_talk_time)}
                  </Text>
                </View>
              </View>
              {i < data.ranking.length - 1 && <Divider />}
            </View>
          );
        })}
      </Card>
    </ScrollView>
  );
}

// ─── Tab SLA ──────────────────────────────────────────────────────────────────

function SlaTab() {
  const { colors } = useTheme();
  const { data, isLoading } = useSla();

  if (isLoading) return <LoadingSection />;
  if (!data) return null;

  const { overall, sla_by_queue, recommendations } = data;
  const slaColor = overall.sla_compliance >= overall.target ? Colors.success
    : overall.sla_compliance >= overall.target * 0.85 ? Colors.warning
    : Colors.error;

  return (
    <ScrollView contentContainerStyle={styles.tabContent}>
      {/* SLA General */}
      <Card>
        <Text style={[styles.sectionLabel, { color: colors.textTertiary, marginTop: 0 }]}>SLA General</Text>
        <View style={styles.slaCircleRow}>
          <View style={styles.slaCircleWrap}>
            <View style={[styles.slaCircle, { borderColor: slaColor }]}>
              <Text style={[styles.slaCircleValue, { color: slaColor }]}>
                {fmtPct(overall.sla_compliance)}
              </Text>
              <Text style={[styles.slaCircleSub, { color: colors.textTertiary }]}>cumplimiento</Text>
            </View>
          </View>
          <View style={styles.slaStats}>
            <SlaStatRow label="Meta" value={`${overall.target}%`} colors={colors} />
            <SlaStatRow label="Llamadas totales" value={String(overall.total_calls)} colors={colors} />
            <SlaStatRow label="Dentro del SLA" value={String(overall.calls_within_sla)} colors={colors} />
            <SlaStatRow
              label="Umbral"
              value={`${data.period.sla_threshold_seconds}s`}
              colors={colors}
            />
          </View>
        </View>
        {/* Barra SLA */}
        <View style={[styles.slaTrack, { backgroundColor: colors.surfaceAlt }]}>
          <View style={[styles.slaFill, {
            width: `${Math.min(overall.sla_compliance, 100)}%` as any,
            backgroundColor: slaColor,
          }]} />
          <View style={[styles.slaMark, { left: `${overall.target}%` as any, backgroundColor: colors.borderStrong }]} />
        </View>
        <Text style={[styles.slaTrackLabel, { color: colors.textDisabled }]}>
          Meta: {overall.target}% · Actual: {fmtPct(overall.sla_compliance)}
        </Text>
      </Card>

      {/* Por cola */}
      <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>Por cola</Text>
      <Card noPadding>
        {sla_by_queue.map((q, i) => {
          const qColor = q.sla_compliance >= 80 ? Colors.success : Colors.error;
          return (
            <View key={q.queue_name}>
              <View style={styles.slaQueueRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.slaQueueName, { color: colors.text }]}>Cola {q.queue_name}</Text>
                  <Text style={[styles.slaQueueSub, { color: colors.textTertiary }]}>
                    {q.answered_calls}/{q.total_calls} respondidas · Espera: {fmtSec(q.avg_wait_time)}
                  </Text>
                </View>
                <View style={[styles.slaBadge, { backgroundColor: qColor + '15' }]}>
                  <Text style={[styles.slaBadgeText, { color: qColor }]}>
                    {fmtPct(q.sla_compliance)}
                  </Text>
                  <Text style={[styles.slaStatusLabel, { color: qColor }]}>{q.status_label}</Text>
                </View>
              </View>
              {i < sla_by_queue.length - 1 && <Divider />}
            </View>
          );
        })}
      </Card>

      {/* Recomendaciones */}
      {recommendations.length > 0 && (
        <>
          <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>Recomendaciones</Text>
          {recommendations.map((r, i) => (
            <Card key={i} style={{ marginBottom: Spacing.sm }}>
              <View style={[styles.recIcon, {
                backgroundColor: r.priority === 'high' ? Colors.error + '15' : Colors.warning + '15',
              }]}>
                <Text style={{ color: r.priority === 'high' ? Colors.error : Colors.warning, fontSize: 14 }}>⚠</Text>
              </View>
              <Text style={[styles.recTitle, { color: colors.text }]}>{r.message}</Text>
              <Text style={[styles.recDetail, { color: colors.textSecondary }]}>{r.detail}</Text>
              {r.action && <Text style={[styles.recAction, { color: Colors.primary }]}>{r.action}</Text>}
            </Card>
          ))}
        </>
      )}
    </ScrollView>
  );
}

// ─── Tab Patrones ─────────────────────────────────────────────────────────────

function PatronesTab() {
  const { colors } = useTheme();
  const { data, isLoading } = usePatrones();

  if (isLoading) return <LoadingSection />;
  if (!data) return null;

  const maxCalls = Math.max(...(data.hourly_data ?? []).map(h => h.total_calls), 1);

  return (
    <ScrollView contentContainerStyle={styles.tabContent}>
      {/* Stats */}
      <Card>
        <View style={styles.statsRow}>
          <StatBox label="Prom/hora" value={`${Math.round(data.statistics.avg_calls_per_hour)}`} colors={colors} />
          <StatBox label="Horas activas" value={String(data.statistics.total_hours_analyzed)} colors={colors} />
          <StatBox label="Horas pico" value={String(data.statistics.high_activity_hours)} colors={colors} />
        </View>
      </Card>

      {/* Horas pico */}
      <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>Top 3 horas pico</Text>
      <Card noPadding>
        {data.peak_hours.slice(0, 3).map((h, i) => (
          <View key={h.hour}>
            <View style={styles.peakRow}>
              <View style={[styles.peakHourBadge, { backgroundColor: Colors.primary + '15' }]}>
                <Text style={[styles.peakHourText, { color: Colors.primary }]}>
                  {String(h.hour).padStart(2, '0')}:00
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.peakCalls, { color: colors.text }]}>{h.total_calls} llamadas</Text>
                <Text style={[styles.peakSub, { color: colors.textTertiary }]}>
                  {h.answered_calls} respondidas · {h.missed_calls} perdidas
                </Text>
              </View>
              <Text style={[styles.peakWait, { color: colors.textSecondary }]}>
                {fmtSec(h.avg_wait_time)}
              </Text>
            </View>
            {i < 2 && <Divider indent={Spacing.lg} />}
          </View>
        ))}
      </Card>

      {/* Gráfica de barras horaria */}
      <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>Distribución por hora</Text>
      <Card noPadding>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.barsScroll}>
          {data.hourly_data.map(h => {
            const hAns  = Math.max((h.answered_calls / maxCalls) * 60, h.answered_calls > 0 ? 2 : 0);
            const hMiss = Math.max((h.missed_calls   / maxCalls) * 60, h.missed_calls   > 0 ? 2 : 0);
            return (
              <View key={h.hour} style={styles.barGroup}>
                {h.total_calls > 0 && (
                  <Text style={[styles.barCount, { color: colors.textDisabled }]}>{h.total_calls}</Text>
                )}
                <View style={styles.barStack}>
                  <View style={[styles.barFill, { height: hAns,  backgroundColor: Colors.success + '80' }]} />
                  {h.missed_calls > 0 && (
                    <View style={[styles.barTop, { height: hMiss, backgroundColor: Colors.error + '90' }]} />
                  )}
                </View>
                <Text style={[styles.barHour, { color: colors.textDisabled }]}>
                  {String(h.hour).padStart(2, '0')}
                </Text>
              </View>
            );
          })}
        </ScrollView>
      </Card>

      {/* Recomendaciones */}
      {data.recommendations.length > 0 && (
        <>
          <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>Recomendaciones</Text>
          {data.recommendations.map((r, i) => (
            <Card key={i} style={{ marginBottom: Spacing.sm }}>
              <Text style={[styles.recTitle, { color: colors.text }]}>{r.message}</Text>
              <Text style={[styles.recDetail, { color: colors.textSecondary }]}>{r.detail}</Text>
            </Card>
          ))}
        </>
      )}
    </ScrollView>
  );
}

// ─── Tab Mapa de Calor ────────────────────────────────────────────────────────

const SHOW_HOURS = [6,7,8,9,10,11,12,13,14,15,16,17,18,19,20];

function HeatmapTab() {
  const { colors, isDark } = useTheme();
  const { data, isLoading } = useHeatmap();

  if (isLoading) return <LoadingSection />;
  if (!data) return null;

  const max       = data.statistics.max_calls || 1;
  const highThresh = data.statistics.high_demand_threshold;

  function cellColor(calls: number): string {
    if (calls === 0) return isDark ? '#1C2333' : '#F0F4F8';
    const intensity = calls / max;
    if (intensity >= 0.7) return isDark ? '#7B0000' : '#FEB2B2';
    if (intensity >= 0.4) return isDark ? '#C05621' : '#FEEBC8';
    if (intensity >= 0.2) return isDark ? '#276749' : '#C6F6D5';
    return isDark ? '#1A365D' : '#BEE3F8';
  }

  function cellTextColor(calls: number): string {
    const intensity = calls / max;
    if (intensity >= 0.4) return isDark ? '#FFF' : '#1A202C';
    return colors.textTertiary;
  }

  return (
    <ScrollView contentContainerStyle={styles.tabContent}>
      {/* Leyenda */}
      <Card>
        <View style={styles.heatLegendRow}>
          <Text style={[styles.heatLegendTitle, { color: colors.textSecondary }]}>
            Semana: {data.insights.busiest_day} más activo · {data.insights.quietest_day} más tranquilo
          </Text>
        </View>
        <View style={styles.heatLegend}>
          {[
            { label:'Sin llamadas', color: isDark ? '#1C2333' : '#F0F4F8' },
            { label:'Bajo',         color: isDark ? '#1A365D' : '#BEE3F8' },
            { label:'Medio',        color: isDark ? '#276749' : '#C6F6D5' },
            { label:'Alto',         color: isDark ? '#C05621' : '#FEEBC8' },
            { label:'Crítico',      color: isDark ? '#7B0000' : '#FEB2B2' },
          ].map(item => (
            <View key={item.label} style={styles.heatLegendItem}>
              <View style={[styles.heatLegendDot, { backgroundColor: item.color, borderColor: colors.border }]} />
              <Text style={[styles.heatLegendLabel, { color: colors.textTertiary }]}>{item.label}</Text>
            </View>
          ))}
        </View>
      </Card>

      {/* Mapa — solo horas laborales */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          {/* Cabecera horas */}
          <View style={styles.heatHeaderRow}>
            <View style={styles.heatDayLabel} />
            {SHOW_HOURS.map(h => (
              <View key={h} style={styles.heatCell}>
                <Text style={[styles.heatHourText, { color: colors.textDisabled }]}>
                  {String(h).padStart(2,'0')}
                </Text>
              </View>
            ))}
          </View>
          {/* Filas por día */}
          {data.heatmap_matrix.map(day => (
            <View key={day.day} style={styles.heatRow}>
              <View style={styles.heatDayLabel}>
                <Text style={[styles.heatDayText, { color: colors.textSecondary }]}>
                  {day.day.slice(0, 3)}
                </Text>
              </View>
              {SHOW_HOURS.map(h => {
                const hourData = day.hours.find(hd => hd.hour === h);
                const calls    = hourData?.total_calls ?? 0;
                return (
                  <View key={h} style={[styles.heatCell, { backgroundColor: cellColor(calls) }]}>
                    {calls > 0 && (
                      <Text style={[styles.heatCellText, { color: cellTextColor(calls) }]}>
                        {calls}
                      </Text>
                    )}
                  </View>
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>
    </ScrollView>
  );
}

// ─── Tab Abandono ─────────────────────────────────────────────────────────────

function AbandonoTab() {
  const { colors } = useTheme();
  const { data, isLoading } = useAbandono();

  if (isLoading) return <LoadingSection />;
  if (!data) return null;

  const { summary, top_abandonment_hours, queue_abandonment, recommendations } = data;
  const rateColor = summary.abandonment_rate < 10 ? Colors.success
    : summary.abandonment_rate < 20 ? Colors.warning
    : Colors.error;

  return (
    <ScrollView contentContainerStyle={styles.tabContent}>
      {/* Resumen */}
      <Card>
        <View style={styles.statsRow}>
          <StatBox label="Total llamadas" value={String(summary.total_calls)} colors={colors} />
          <StatBox label="Abandonadas" value={String(summary.total_abandoned)} accent={rateColor} colors={colors} />
          <StatBox label="Tasa" value={fmtPct(summary.abandonment_rate)} accent={rateColor} colors={colors} />
        </View>
        <View style={[styles.abanTrack, { backgroundColor: colors.surfaceAlt }]}>
          <View style={[styles.abanFill, {
            width: `${Math.min(summary.abandonment_rate, 100)}%` as any,
            backgroundColor: rateColor,
          }]} />
        </View>
        <Text style={[styles.abanMeta, { color: colors.textDisabled }]}>
          Meta recomendada: &lt;10% · Espera promedio: {fmtSec(summary.avg_wait_time)}
        </Text>
      </Card>

      {/* Top horas con más abandono */}
      <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>Peores horas</Text>
      <Card noPadding>
        {top_abandonment_hours.slice(0, 5).map((h, i) => {
          const rate = Math.min(h.abandonment_rate, 100);
          const c    = rate >= 50 ? Colors.error : Colors.warning;
          return (
            <View key={h.hour}>
              <View style={styles.abanRow}>
                <View style={[styles.abanHourBadge, { backgroundColor: c + '15' }]}>
                  <Text style={[styles.abanHourText, { color: c }]}>
                    {String(h.hour).padStart(2,'0')}:00
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.abanCalls, { color: colors.text }]}>
                    {h.abandoned_calls} abandonadas de {h.total_calls}
                  </Text>
                  <View style={[styles.abanBarMini, { backgroundColor: colors.surfaceAlt }]}>
                    <View style={[styles.abanBarFill, {
                      width: `${Math.min(rate, 100)}%` as any,
                      backgroundColor: c,
                    }]} />
                  </View>
                </View>
                <Text style={[styles.abanRate, { color: c }]}>{fmtPct(rate)}</Text>
              </View>
              {i < top_abandonment_hours.slice(0,5).length - 1 && <Divider indent={Spacing.lg} />}
            </View>
          );
        })}
      </Card>

      {/* Por cola */}
      <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>Por cola</Text>
      <Card noPadding>
        {queue_abandonment.map((q, i) => (
          <View key={q.queue_name}>
            <View style={styles.slaQueueRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.slaQueueName, { color: colors.text }]}>Cola {q.queue_name}</Text>
                <Text style={[styles.slaQueueSub, { color: colors.textTertiary }]}>
                  {q.abandoned_calls} abandonadas · Espera: {fmtSec(q.avg_wait_time)}
                </Text>
              </View>
              <Text style={[styles.abanRate, {
                color: q.abandonment_rate < 10 ? Colors.success : Colors.error,
              }]}>{fmtPct(q.abandonment_rate)}</Text>
            </View>
            {i < queue_abandonment.length - 1 && <Divider />}
          </View>
        ))}
      </Card>

      {/* Recomendaciones */}
      {recommendations.length > 0 && (
        <>
          <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>Recomendaciones</Text>
          {recommendations.map((r, i) => (
            <Card key={i} style={{ marginBottom: Spacing.sm }}>
              <Text style={[styles.recTitle, { color: colors.text }]}>{r.message}</Text>
              <Text style={[styles.recDetail, { color: colors.textSecondary }]}>{r.detail}</Text>
              {r.action && <Text style={[styles.recAction, { color: Colors.primary }]}>{r.action}</Text>}
            </Card>
          ))}
        </>
      )}
    </ScrollView>
  );
}

// ─── Componentes auxiliares ───────────────────────────────────────────────────

function LoadingSection() {
  return (
    <View style={styles.loadingWrap}>
      <ActivityIndicator color={Colors.primary} />
    </View>
  );
}

function StatBox({ label, value, accent, colors }: {
  label: string; value: string; accent?: string; colors: any;
}) {
  return (
    <View style={styles.statBox}>
      <Text style={[styles.statValue, { color: accent ?? colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textTertiary }]}>{label}</Text>
    </View>
  );
}

function SlaStatRow({ label, value, colors }: { label: string; value: string; colors: any }) {
  return (
    <View style={styles.slaStatRow}>
      <Text style={[styles.slaStatLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.slaStatValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

// ─── Pantalla principal ───────────────────────────────────────────────────────

const TABS = [
  { key: 'ranking',  label: 'Ranking' },
  { key: 'sla',      label: 'SLA'     },
  { key: 'patrones', label: 'Patrones'},
  { key: 'heatmap',  label: 'Calor'   },
  { key: 'abandono', label: 'Abandono'},
];

export default function AnalisisScreen() {
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('ranking');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['analisis'] });
    setRefreshing(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader title="Análisis" subtitle="MACSA Clínica de Salud" showThemeToggle />

      {/* Tabs */}
      <ScrollView
        horizontal showsHorizontalScrollIndicator={false}
        style={[styles.tabBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}
        contentContainerStyle={styles.tabBarContent}
      >
        {TABS.map(tab => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tabBtn,
                isActive && { borderBottomColor: Colors.primary, borderBottomWidth: 2 },
              ]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[styles.tabBtnText,
                { color: isActive ? Colors.primary : colors.textSecondary },
                isActive && { fontWeight: '600' },
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Contenido del tab activo */}
      {activeTab === 'ranking'  && <RankingTab  />}
      {activeTab === 'sla'      && <SlaTab      />}
      {activeTab === 'patrones' && <PatronesTab />}
      {activeTab === 'heatmap'  && <HeatmapTab  />}
      {activeTab === 'abandono' && <AbandonoTab />}
    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container:      { flex: 1 },
  tabBar:         { maxHeight: 48, borderBottomWidth: 0.5 },
  tabBarContent:  { paddingHorizontal: Spacing.sm },
  tabBtn:         { paddingHorizontal: Spacing.lg, paddingVertical: 14, marginBottom: -0.5 },
  tabBtnText:     { fontSize: Typography.sm },
  tabContent:     { padding: Spacing.lg, paddingBottom: 40 },
  loadingWrap:    { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  sectionLabel:   { fontSize: Typography.xs, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: Spacing.sm, marginTop: Spacing.md },
  statsRow:       { flexDirection: 'row', justifyContent: 'space-around' },
  statBox:        { alignItems: 'center', gap: 4 },
  statValue:      { fontSize: 22, fontWeight: '700' },
  statLabel:      { fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  // Ranking
  rankRow:        { flexDirection: 'row', alignItems: 'center', padding: Spacing.lg, gap: Spacing.md },
  rankPos:        { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  rankPosText:    { fontSize: Typography.sm, fontWeight: '700' },
  rankInfo:       { flex: 1 },
  rankName:       { fontSize: Typography.base, fontWeight: '500' },
  rankBadge:      { fontSize: Typography.xs, marginTop: 2 },
  rankMetrics:    { alignItems: 'flex-end' },
  rankMain:       { fontSize: 20, fontWeight: '700' },
  rankSub:        { fontSize: 9 },
  rankVsAvg:      { fontSize: Typography.xs, fontWeight: '600', marginTop: 2 },
  rankBar:        {},
  rankBarRow:     { flexDirection: 'row', justifyContent: 'space-between' },
  rankBarLabel:   { fontSize: 10 },
  // SLA
  slaCircleRow:   { flexDirection: 'row', alignItems: 'center', gap: Spacing.xl, marginBottom: Spacing.md },
  slaCircleWrap:  { alignItems: 'center' },
  slaCircle:      { width: 90, height: 90, borderRadius: 45, borderWidth: 6, justifyContent: 'center', alignItems: 'center' },
  slaCircleValue: { fontSize: 18, fontWeight: '700' },
  slaCircleSub:   { fontSize: 9 },
  slaStats:       { flex: 1 },
  slaStatRow:     { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  slaStatLabel:   { fontSize: Typography.xs },
  slaStatValue:   { fontSize: Typography.xs, fontWeight: '600' },
  slaTrack:       { height: 6, borderRadius: 3, overflow: 'hidden', position: 'relative', marginTop: Spacing.md },
  slaFill:        { height: '100%', borderRadius: 3, position: 'absolute', left: 0, top: 0 },
  slaMark:        { position: 'absolute', top: -2, bottom: -2, width: 2, zIndex: 1 },
  slaTrackLabel:  { fontSize: 10, marginTop: 4, textAlign: 'right' },
  slaQueueRow:    { flexDirection: 'row', alignItems: 'center', padding: Spacing.lg, gap: Spacing.md },
  slaQueueName:   { fontSize: Typography.base, fontWeight: '500', marginBottom: 2 },
  slaQueueSub:    { fontSize: Typography.xs },
  slaBadge:       { alignItems: 'center', paddingHorizontal: Spacing.sm, paddingVertical: Spacing.sm, borderRadius: Radius.md },
  slaBadgeText:   { fontSize: 16, fontWeight: '700' },
  slaStatusLabel: { fontSize: 9, fontWeight: '500', marginTop: 2 },
  // Recomendaciones
  recIcon:        { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.sm },
  recTitle:       { fontSize: Typography.base, fontWeight: '500', marginBottom: 4 },
  recDetail:      { fontSize: Typography.sm, lineHeight: 18 },
  recAction:      { fontSize: Typography.sm, fontWeight: '500', marginTop: Spacing.xs },
  // Patrones
  peakRow:        { flexDirection: 'row', alignItems: 'center', padding: Spacing.lg, gap: Spacing.md },
  peakHourBadge:  { paddingHorizontal: Spacing.sm, paddingVertical: 5, borderRadius: Radius.md, alignItems: 'center' },
  peakHourText:   { fontSize: Typography.sm, fontWeight: '600' },
  peakCalls:      { fontSize: Typography.base, fontWeight: '500' },
  peakSub:        { fontSize: Typography.xs, marginTop: 2 },
  peakWait:       { fontSize: Typography.xs },
  barsScroll:     { flexDirection: 'row', alignItems: 'flex-end', gap: 5, padding: Spacing.md, minHeight: 90 },
  barGroup:       { alignItems: 'center', width: 24 },
  barCount:       { fontSize: 8, marginBottom: 2 },
  barStack:       { width: 14, position: 'relative', justifyContent: 'flex-end' },
  barFill:        { width: 14, borderRadius: 3, minHeight: 2 },
  barTop:         { position: 'absolute', bottom: 0, left: 0, width: 14, borderRadius: 3 },
  barHour:        { fontSize: 8, marginTop: 4 },
  // Heatmap
  heatLegendRow:  { marginBottom: Spacing.sm },
  heatLegendTitle:{ fontSize: Typography.xs, marginBottom: Spacing.sm },
  heatLegend:     { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  heatLegendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  heatLegendDot:  { width: 12, height: 12, borderRadius: 3, borderWidth: 0.5 },
  heatLegendLabel:{ fontSize: 10 },
  heatHeaderRow:  { flexDirection: 'row', paddingLeft: Spacing.lg },
  heatRow:        { flexDirection: 'row', alignItems: 'center', paddingLeft: Spacing.lg },
  heatDayLabel:   { width: 36, justifyContent: 'center' },
  heatDayText:    { fontSize: 11, fontWeight: '500' },
  heatCell:       { width: 32, height: 32, margin: 1, borderRadius: 4, justifyContent: 'center', alignItems: 'center' },
  heatHourText:   { fontSize: 9 },
  heatCellText:   { fontSize: 9, fontWeight: '600' },
  // Abandono
  abanTrack:      { height: 6, borderRadius: 3, overflow: 'hidden', marginTop: Spacing.md },
  abanFill:       { height: '100%', borderRadius: 3 },
  abanMeta:       { fontSize: 10, marginTop: 4 },
  abanRow:        { flexDirection: 'row', alignItems: 'center', padding: Spacing.lg, gap: Spacing.md },
  abanHourBadge:  { paddingHorizontal: Spacing.sm, paddingVertical: 5, borderRadius: Radius.md },
  abanHourText:   { fontSize: Typography.sm, fontWeight: '600' },
  abanCalls:      { fontSize: Typography.sm, fontWeight: '500', marginBottom: 4 },
  abanBarMini:    { height: 4, borderRadius: 2, overflow: 'hidden' },
  abanBarFill:    { height: '100%', borderRadius: 2 },
  abanRate:       { fontSize: Typography.sm, fontWeight: '700', minWidth: 45, textAlign: 'right' },
});
