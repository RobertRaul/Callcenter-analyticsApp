import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  ActivityIndicator, TextInput, TouchableOpacity,
  ScrollView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CallsStackParamList } from '../../navigation/CallsNavigator';
import { useCallsList } from '../../hooks/useCalls';
import { CallsFilters, Call, FILTER_GROUPS, STATUS_MAP } from '../../services/callsApi';
import { todayStr } from '../../lib/dateHelpers';
import CallItem from '../../components/calls/CallItem';
import DateFilter from '../../components/ui/DateFilter';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../lib/apiClient';
import { useTheme } from '../../theme/ThemeContext';
import { Colors, Typography, Spacing, Radius } from '../../theme/theme';
import AppHeader from '../../components/ui/AppHeader';

type Props = NativeStackScreenProps<CallsStackParamList, 'CallsList'>;

export default function CallsListScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const [dateRange, setDateRange]       = useState({ start_date: todayStr(), end_date: todayStr() });
  // filterGroup: null = todos, 'answered' = respondidas, 'missed' = no contestó
  const [filterGroup, setFilterGroup]   = useState<'answered' | 'missed' | null>(null);
  const [selectedQueue, setSelectedQueue] = useState<string | undefined>();
  const [search, setSearch]             = useState('');

  // El backend /calls/list solo filtra por start_date/end_date/queue/limit
  // (NO soporta filtrar por status), así que el filtro por grupo se aplica en cliente.
  const apiFilters: CallsFilters = {
    ...dateRange,
    queue: selectedQueue,
  };

  const { data, isLoading, refetch, isRefetching, error } = useCallsList(apiFilters);

  // Colas disponibles
  const { data: queuesData } = useQuery({
    queryKey: ['queues', 'list'],
    queryFn: async () => {
      const { data } = await apiClient.get('/queues/list');
      const inner = data?.data ?? data;
      const arr = Array.isArray(inner?.queues) ? inner.queues
        : Array.isArray(inner) ? inner : [];
      return arr.map((q: any) => String(q.name ?? q.queue_name ?? q)).filter(Boolean);
    },
    staleTime: 10 * 60_000,
  });

  // Filtro local por grupo (el backend no soporta filtrar por status)
  let allCalls = (data?.calls ?? []).filter(c => c?.callid);
  if (filterGroup === 'answered') {
    allCalls = allCalls.filter(c => c.status === 'COMPLETED' || c.status === 'ANSWERED');
  } else if (filterGroup === 'missed') {
    const missedStatuses = new Set(['ABANDONED', 'TIMEOUT', 'FULL']);
    allCalls = allCalls.filter(c => missedStatuses.has(c.status));
  }

  // Búsqueda local
  const filtered = search.trim()
    ? allCalls.filter(c =>
        c.phone_number.includes(search) ||
        c.agent_full.toLowerCase().includes(search.toLowerCase())
      )
    : allCalls;

  const handleCallPress = useCallback((call: Call) => {
    if (call?.callid) navigation.navigate('CallDetail', { call });
  }, [navigation]);

  const toggleGroup = (type: 'answered' | 'missed') => {
    setFilterGroup(prev => prev === type ? null : type);
  };

  const activeFiltersCount = [filterGroup, selectedQueue].filter(Boolean).length;

  // Contar por grupo para mostrar en chips
  const answeredCount = (data?.calls ?? []).filter(c => c.status === 'COMPLETED' || c.status === 'ANSWERED').length;
  const missedCount   = (data?.calls ?? []).filter(c => ['ABANDONED','TIMEOUT','FULL'].includes(c.status)).length;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader
        title="Llamadas"
        subtitle={`${filtered.length} registros`}
      />

      {/* Filtro de fechas */}
      <DateFilter
        start={dateRange.start_date}
        end={dateRange.end_date}
        onChange={(s, e) => setDateRange({ start_date: s, end_date: e })}
      />

      {/* Buscador */}
      <View style={[styles.searchBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.searchIcon, { color: colors.textTertiary }]}>⌕</Text>
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Buscar por número o agente..."
          placeholderTextColor={colors.textDisabled}
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
          clearButtonMode="while-editing"
        />
        {activeFiltersCount > 0 && (
          <TouchableOpacity
            onPress={() => { setFilterGroup(null); setSelectedQueue(undefined); }}
            style={[styles.clearBtn, { backgroundColor: Colors.error + '15' }]}
          >
            <Text style={[styles.clearBtnText, { color: Colors.error }]}>✕ Limpiar</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filtros */}
      <View style={[styles.filterBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>

          {/* Filtros de tipo (Respondidas / No contestó) */}
          {FILTER_GROUPS.map(fg => {
            const isActive = filterGroup === fg.type;
            const count    = fg.type === 'answered' ? answeredCount : missedCount;
            const color    = fg.type === 'answered' ? Colors.success : Colors.error;
            return (
              <TouchableOpacity
                key={fg.type}
                style={[styles.chip,
                  { borderColor: colors.border, backgroundColor: colors.surfaceAlt },
                  isActive && { backgroundColor: color + '15', borderColor: color + '40' },
                ]}
                onPress={() => toggleGroup(fg.type)}
              >
                <Text style={[styles.chipText,
                  { color: colors.textSecondary },
                  isActive && { color, fontWeight:'600' },
                ]}>
                  {fg.label}
                  {!isLoading && ` (${count})`}
                </Text>
              </TouchableOpacity>
            );
          })}

          {/* Colas */}
          {(queuesData ?? []).slice(0, 4).map((q: string) => (
            <TouchableOpacity
              key={q}
              style={[styles.chip,
                { borderColor: colors.border, backgroundColor: colors.surfaceAlt },
                selectedQueue === q && { backgroundColor: Colors.primary + '15', borderColor: Colors.primary + '40' },
              ]}
              onPress={() => setSelectedQueue(prev => prev === q ? undefined : q)}
            >
              <Text style={[styles.chipText,
                { color: colors.textSecondary },
                selectedQueue === q && { color: Colors.primary, fontWeight:'600' },
              ]}>Cola {q}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Error */}
      {error && (
        <View style={[styles.errBanner, { backgroundColor: Colors.errorLight }]}>
          <Text style={[styles.errText, { color: Colors.error }]}>
            Error al cargar. Tira hacia abajo para reintentar.
          </Text>
        </View>
      )}

      {/* Lista */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} size="large" />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Cargando llamadas…</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item, idx) => item?.callid ?? `idx-${idx}`}
          renderItem={({ item }) => item?.callid
            ? <CallItem call={item} onPress={handleCallPress} />
            : null
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={[styles.emptyIcon, { color: colors.textDisabled }]}>☎</Text>
              <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>
                Sin llamadas para este período
              </Text>
              {activeFiltersCount > 0 && (
                <TouchableOpacity onPress={() => { setFilterGroup(null); setSelectedQueue(undefined); }}>
                  <Text style={{ color: Colors.primary, fontSize: Typography.sm, marginTop: Spacing.sm }}>
                    Limpiar filtros
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          }
          onRefresh={refetch}
          refreshing={isRefetching}
          initialNumToRender={20}
          maxToRenderPerBatch={15}
          windowSize={10}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex:1 },
  searchBar:    { flexDirection:'row', alignItems:'center', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderBottomWidth:0.5, gap: Spacing.sm },
  searchIcon:   { fontSize:18 },
  searchInput:  { flex:1, fontSize: Typography.base, paddingVertical:0 },
  clearBtn:     { paddingHorizontal: Spacing.sm, paddingVertical:4, borderRadius: Radius.sm },
  clearBtnText: { fontSize: Typography.xs, fontWeight:'600' },
  filterBar:    { borderBottomWidth:0.5 },
  filterScroll: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, gap: Spacing.sm, flexDirection:'row' },
  chip:         { paddingHorizontal:12, paddingVertical:5, borderRadius: Radius.full, borderWidth:0.5 },
  chipText:     { fontSize: Typography.xs },
  sep:          { width:0.5, marginHorizontal: Spacing.xs },
  center:       { flex:1, justifyContent:'center', alignItems:'center', gap: Spacing.md },
  loadingText:  { fontSize: Typography.sm },
  errBanner:    { padding: Spacing.md, margin: Spacing.md, borderRadius: Radius.md },
  errText:      { fontSize: Typography.sm },
  empty:        { alignItems:'center', gap: Spacing.sm, paddingTop:60 },
  emptyIcon:    { fontSize:36 },
  emptyTitle:   { fontSize: Typography.base },
});
