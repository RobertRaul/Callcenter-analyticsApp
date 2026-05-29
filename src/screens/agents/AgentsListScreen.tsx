import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  TouchableOpacity, ActivityIndicator,
  RefreshControl, TextInput,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AgentsStackParamList } from '../../navigation/AgentsNavigator';
import { useRealtimeAgents, useAgentStatistics } from '../../hooks/useAgents';
import { RealtimeAgent } from '../../services/agentsApi';
import { useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../../theme/ThemeContext';
import { Colors, Typography, Spacing, Radius } from '../../theme/theme';
import AppHeader from '../../components/ui/AppHeader';
import StatusPill, { STATUS_CONFIG_LIGHT, STATUS_CONFIG_DARK } from '../../components/ui/StatusPill';
import { Divider } from '../../components/ui/misc';

type Props = NativeStackScreenProps<AgentsStackParamList, 'AgentsList'>;
type StatusFilter = 'all' | 'available' | 'on_call' | 'paused' | 'offline';

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key:'all',       label:'Todos'      },
  { key:'available', label:'Disponible' },
  { key:'on_call',   label:'En llamada' },
  { key:'paused',    label:'Pausa'      },
  { key:'offline',   label:'Fuera'      },
];

function todayStr() { return new Date().toISOString().split('T')[0]; }

function formatDuration(s: number): string {
  if (!s) return '—';
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
}

function getInitials(name: string): string {
  return (name ?? '').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || '??';
}

export default function AgentsListScreen({ navigation }: Props) {
  const { colors, isDark } = useTheme();   // ← useTheme correcto
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');

  const { data: agents = [], isLoading, isRefetching } = useRealtimeAgents();
  const { data: stats = [] } = useAgentStatistics({ start_date: todayStr(), end_date: todayStr() });

  const statsMap = Object.fromEntries(stats.map(s => [s.agent, s]));

  const counts = agents.reduce((acc, a) => {
    acc[a.status] = (acc[a.status] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const filtered = agents.filter(a => {
    const matchStatus = statusFilter === 'all' || a.status === statusFilter;
    const term = search.toLowerCase();
    const matchSearch = !term ||
      (a.name ?? a.agent).toLowerCase().includes(term) ||
      (a.queue ?? '').toLowerCase().includes(term);
    return matchStatus && matchSearch;
  });

  const ORDER: Record<string, number> = { on_call:0, available:1, paused:2, offline:3 };
  const sorted = [...filtered].sort((a, b) => (ORDER[a.status] ?? 4) - (ORDER[b.status] ?? 4));

  const onRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['agents'] });
  }, [queryClient]);

  const handleAgentPress = useCallback((agent: RealtimeAgent) => {
    navigation.navigate('AgentDetail', { agent });
  }, [navigation]);

  // Tarjetas de resumen de estado
  const StatusCard = ({ statusKey }: { statusKey: string }) => {
    const cfg = isDark ? STATUS_CONFIG_DARK[statusKey as any] : STATUS_CONFIG_LIGHT[statusKey as any];
    if (!cfg) return null;
    return (
      <View style={[styles.summaryCard, { backgroundColor: cfg.bg }]}>
        <Text style={[styles.summaryCount, { color: cfg.color }]}>{counts[statusKey] ?? 0}</Text>
        <Text style={[styles.summaryLabel, { color: cfg.color }]}>{cfg.label}</Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader
        title="Agentes"
        subtitle={`${agents.length} total · ${counts.available ?? 0} disponibles`}
        showThemeToggle
        rightAction={
          <View style={[styles.liveBadge, { backgroundColor: Colors.success + '15' }]}>
            <View style={[styles.liveDot, { backgroundColor: Colors.success }]} />
            <Text style={[styles.liveText, { color: Colors.success }]}>Vivo</Text>
          </View>
        }
      />

      {/* Tarjetas de resumen */}
      <View style={[styles.summaryRow, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <StatusCard statusKey="available" />
        <StatusCard statusKey="on_call"   />
        <StatusCard statusKey="paused"    />
        <StatusCard statusKey="offline"   />
      </View>

      {/* Buscador */}
      <View style={[styles.searchBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.searchIcon, { color: colors.textTertiary }]}>⌕</Text>
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Buscar agente o cola..."
          placeholderTextColor={colors.textDisabled}
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
          clearButtonMode="while-editing"
        />
      </View>

      {/* Filtros por estado */}
      <View style={[styles.filterRow, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        {STATUS_FILTERS.map(f => {
          const isActive = statusFilter === f.key;
          const count = f.key === 'all' ? agents.length : (counts[f.key] ?? 0);
          return (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterChip,
                { borderColor: colors.border, backgroundColor: colors.surfaceAlt },
                isActive && { backgroundColor: Colors.primary + '15', borderColor: Colors.primary + '40' },
              ]}
              onPress={() => setStatusFilter(f.key)}
            >
              <Text style={[styles.filterText,
                { color: colors.textSecondary },
                isActive && { color: Colors.primary, fontWeight:'600' },
              ]}>{f.label}</Text>
              <View style={[styles.countBadge,
                { backgroundColor: colors.surfaceAlt },
                isActive && { backgroundColor: Colors.primary + '20' },
              ]}>
                <Text style={[styles.countText,
                  { color: colors.textDisabled },
                  isActive && { color: Colors.primary },
                ]}>{count}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Lista */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} size="large" />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Cargando agentes…</Text>
        </View>
      ) : (
        <FlatList
          data={sorted}
          keyExtractor={(item, i) => `${item.agent}-${i}`}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={onRefresh} tintColor={Colors.primary} colors={[Colors.primary]} />
          }
          renderItem={({ item, index }) => {
            const agentStats = statsMap[item.agent];
            return (
              <View>
                <TouchableOpacity
                  style={[styles.agentRow, { backgroundColor: colors.surface }]}
                  onPress={() => handleAgentPress(item)}
                  activeOpacity={0.75}
                >
                  {/* Avatar */}
                  <View style={[styles.avatarWrap]}>
                    <View style={[styles.avatar, { backgroundColor: Colors.primary + '15' }]}>
                      <Text style={[styles.avatarText, { color: Colors.primary }]}>
                        {getInitials(item.name ?? item.agent)}
                      </Text>
                    </View>
                    <View style={[styles.statusDot, {
                      backgroundColor: isDark
                        ? STATUS_CONFIG_DARK[item.status]?.color
                        : STATUS_CONFIG_LIGHT[item.status]?.color,
                      borderColor: colors.surface,
                    }]} />
                  </View>

                  {/* Info */}
                  <View style={styles.agentInfo}>
                    <Text style={[styles.agentName, { color: colors.text }]}>
                      {item.name ?? item.agent}
                    </Text>
                    {item.queue ? (
                      <Text style={[styles.agentQueue, { color: colors.textTertiary }]}>{item.queue}</Text>
                    ) : null}
                    {/* Métricas rápidas */}
                    {agentStats && (
                      <View style={styles.metricsRow}>
                        <MetricPill label="Llamadas" value={String(agentStats.answered_calls)} colors={colors} />
                        <MetricPill label="TMO" value={formatDuration(agentStats.avg_duration)} colors={colors} />
                      </View>
                    )}
                  </View>

                  <View style={styles.agentRight}>
                    <StatusPill status={item.status} />
                    <Text style={[styles.chevron, { color: colors.textDisabled }]}>›</Text>
                  </View>
                </TouchableOpacity>
                {index < sorted.length - 1 && <Divider indent={72} />}
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={[styles.emptyIcon, { color: colors.textDisabled }]}>◈</Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {search ? 'Sin agentes con ese criterio' : 'Sin agentes en este estado'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

function MetricPill({ label, value, colors }: { label: string; value: string; colors: any }) {
  return (
    <View style={[mp.pill, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
      <Text style={[mp.label, { color: colors.textDisabled }]}>{label}</Text>
      <Text style={[mp.value, { color: colors.textSecondary }]}>{value}</Text>
    </View>
  );
}

const mp = StyleSheet.create({
  pill:  { flexDirection:'row', gap:4, alignItems:'center', paddingHorizontal:6, paddingVertical:2, borderRadius: Radius.sm, borderWidth:0.5 },
  label: { fontSize:9 },
  value: { fontSize:10, fontWeight:'600' },
});

const styles = StyleSheet.create({
  container:    { flex:1 },
  liveBadge:    { flexDirection:'row', alignItems:'center', gap:4, paddingHorizontal:8, paddingVertical:3, borderRadius: Radius.full },
  liveDot:      { width:5, height:5, borderRadius:3 },
  liveText:     { fontSize:10, fontWeight:'600' },
  summaryRow:   { flexDirection:'row', gap: Spacing.sm, padding: Spacing.md, borderBottomWidth:0.5 },
  summaryCard:  { flex:1, borderRadius: Radius.md, padding: Spacing.sm, alignItems:'center' },
  summaryCount: { fontSize:20, fontWeight:'700' },
  summaryLabel: { fontSize:9, fontWeight:'500', marginTop:1 },
  searchBar:    { flexDirection:'row', alignItems:'center', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderBottomWidth:0.5, gap: Spacing.sm },
  searchIcon:   { fontSize:18 },
  searchInput:  { flex:1, fontSize: Typography.base, paddingVertical:0 },
  filterRow:    { flexDirection:'row', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, gap: Spacing.sm, flexWrap:'wrap', borderBottomWidth:0.5 },
  filterChip:   { flexDirection:'row', alignItems:'center', gap:5, paddingHorizontal:10, paddingVertical:5, borderRadius: Radius.full, borderWidth:0.5 },
  filterText:   { fontSize: Typography.xs },
  countBadge:   { borderRadius: Radius.full, paddingHorizontal:5, paddingVertical:1 },
  countText:    { fontSize:9, fontWeight:'600' },
  center:       { flex:1, justifyContent:'center', alignItems:'center', gap: Spacing.md },
  loadingText:  { fontSize: Typography.sm },
  listContent:  { paddingBottom:32 },
  agentRow:     { flexDirection:'row', alignItems:'center', paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg, gap: Spacing.md },
  avatarWrap:   { position:'relative' },
  avatar:       { width:40, height:40, borderRadius:20, justifyContent:'center', alignItems:'center' },
  avatarText:   { fontSize: Typography.base, fontWeight:'600' },
  statusDot:    { position:'absolute', bottom:0, right:0, width:12, height:12, borderRadius:6, borderWidth:2 },
  agentInfo:    { flex:1 },
  agentName:    { fontSize: Typography.base, fontWeight:'500', marginBottom:1 },
  agentQueue:   { fontSize: Typography.xs, marginBottom:4 },
  metricsRow:   { flexDirection:'row', gap: Spacing.sm },
  agentRight:   { flexDirection:'row', alignItems:'center', gap: Spacing.sm },
  chevron:      { fontSize:20 },
  empty:        { alignItems:'center', gap: Spacing.md, paddingTop:60 },
  emptyIcon:    { fontSize:36 },
  emptyText:    { fontSize: Typography.base },
});
