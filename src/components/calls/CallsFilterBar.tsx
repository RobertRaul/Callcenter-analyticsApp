import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Modal, ScrollView, TextInput,
} from 'react-native';
import { CallsFilters } from '../../services/callsApi';

interface CallsFilterBarProps {
  filters: CallsFilters;
  onFiltersChange: (f: CallsFilters) => void;
  queues: string[];
  totalResults?: number;
}

const DISPOSITIONS = ['Todas', 'ANSWERED', 'NO ANSWER', 'BUSY', 'FAILED'];

const DISP_LABELS: Record<string, string> = {
  'Todas': 'Todas',
  ANSWERED: 'Respondidas',
  'NO ANSWER': 'No contestó',
  BUSY: 'Ocupado',
  FAILED: 'Fallidas',
};

const QUICK_DATES = [
  { label: 'Hoy',       days: 0  },
  { label: '7 días',    days: 7  },
  { label: '30 días',   days: 30 },
  { label: 'Este mes',  days: -1 }, // especial
];

function toDateStr(d: Date): string {
  return d.toISOString().split('T')[0];
}

function getQuickRange(days: number): { start_date: string; end_date: string } {
  const today = new Date();
  const end   = toDateStr(today);
  if (days === 0) return { start_date: end, end_date: end };
  if (days === -1) {
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    return { start_date: toDateStr(start), end_date: end };
  }
  const start = new Date(today);
  start.setDate(start.getDate() - days);
  return { start_date: toDateStr(start), end_date: end };
}

export default function CallsFilterBar({
  filters, onFiltersChange, queues, totalResults,
}: CallsFilterBarProps) {
  const [showModal, setShowModal] = useState(false);
  const [localFilters, setLocalFilters] = useState<CallsFilters>(filters);

  const activeCount = [
    filters.disposition,
    filters.queue,
    filters.start_date,
    filters.agent,
  ].filter(Boolean).length;

  const applyFilters = () => {
    onFiltersChange(localFilters);
    setShowModal(false);
  };

  const clearFilters = () => {
    const clean: CallsFilters = {};
    setLocalFilters(clean);
    onFiltersChange(clean);
    setShowModal(false);
  };

  return (
    <>
      {/* Barra rápida */}
      <View style={styles.bar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickScroll}>
          {QUICK_DATES.map(q => {
            const range = getQuickRange(q.days);
            const isActive =
              filters.start_date === range.start_date &&
              filters.end_date   === range.end_date;
            return (
              <TouchableOpacity
                key={q.label}
                style={[styles.chip, isActive && styles.chipActive]}
                onPress={() => onFiltersChange({ ...filters, ...range })}
              >
                <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                  {q.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <TouchableOpacity
          style={[styles.filterBtn, activeCount > 0 && styles.filterBtnActive]}
          onPress={() => { setLocalFilters(filters); setShowModal(true); }}
        >
          <Text style={styles.filterIcon}>⊞</Text>
          {activeCount > 0 && (
            <View style={styles.badge}><Text style={styles.badgeText}>{activeCount}</Text></View>
          )}
        </TouchableOpacity>
      </View>

      {totalResults !== undefined && (
        <Text style={styles.resultsText}>{totalResults} llamadas encontradas</Text>
      )}

      {/* Modal de filtros avanzados */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Filtros</Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Disposición */}
              <Text style={styles.filterLabel}>Resultado</Text>
              <View style={styles.chipRow}>
                {DISPOSITIONS.map(d => {
                  const val = d === 'Todas' ? undefined : d;
                  const isActive = (localFilters.disposition ?? undefined) === val;
                  return (
                    <TouchableOpacity
                      key={d}
                      style={[styles.chip, isActive && styles.chipActive]}
                      onPress={() => setLocalFilters(p => ({ ...p, disposition: val }))}
                    >
                      <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                        {DISP_LABELS[d]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Cola */}
              {queues.length > 0 && (
                <>
                  <Text style={styles.filterLabel}>Cola</Text>
                  <View style={styles.chipRow}>
                    <TouchableOpacity
                      style={[styles.chip, !localFilters.queue && styles.chipActive]}
                      onPress={() => setLocalFilters(p => ({ ...p, queue: undefined }))}
                    >
                      <Text style={[styles.chipText, !localFilters.queue && styles.chipTextActive]}>
                        Todas
                      </Text>
                    </TouchableOpacity>
                    {queues.map(q => (
                      <TouchableOpacity
                        key={q}
                        style={[styles.chip, localFilters.queue === q && styles.chipActive]}
                        onPress={() => setLocalFilters(p => ({ ...p, queue: q }))}
                      >
                        <Text style={[styles.chipText, localFilters.queue === q && styles.chipTextActive]}>
                          {q}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              {/* Agente */}
              <Text style={styles.filterLabel}>Agente</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Buscar por agente..."
                placeholderTextColor="#4a5568"
                value={localFilters.agent ?? ''}
                onChangeText={v => setLocalFilters(p => ({ ...p, agent: v || undefined }))}
                autoCapitalize="none"
              />

              {/* Fechas */}
              <Text style={styles.filterLabel}>Fecha desde</Text>
              <TextInput
                style={styles.textInput}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#4a5568"
                value={localFilters.start_date ?? ''}
                onChangeText={v => setLocalFilters(p => ({ ...p, start_date: v || undefined }))}
              />
              <Text style={styles.filterLabel}>Fecha hasta</Text>
              <TextInput
                style={styles.textInput}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#4a5568"
                value={localFilters.end_date ?? ''}
                onChangeText={v => setLocalFilters(p => ({ ...p, end_date: v || undefined }))}
              />
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.clearBtn} onPress={clearFilters}>
                <Text style={styles.clearText}>Limpiar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.applyBtn} onPress={applyFilters}>
                <Text style={styles.applyText}>Aplicar filtros</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 8,
    borderBottomWidth: 0.5, borderBottomColor: '#2d3561',
    gap: 8,
  },
  quickScroll: { flex: 1 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, borderWidth: 0.5,
    borderColor: '#2d3561', backgroundColor: '#1a1f36',
    marginRight: 6,
  },
  chipActive: { backgroundColor: '#1e3a6e', borderColor: '#4f6ef7' },
  chipText: { color: '#718096', fontSize: 12 },
  chipTextActive: { color: '#60a5fa', fontWeight: '600' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  filterBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#1a1f36', borderWidth: 0.5, borderColor: '#2d3561',
    justifyContent: 'center', alignItems: 'center',
  },
  filterBtnActive: { backgroundColor: '#1e3a6e', borderColor: '#4f6ef7' },
  filterIcon: { fontSize: 18, color: '#a0aec0' },
  badge: {
    position: 'absolute', top: -4, right: -4,
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: '#4f6ef7',
    justifyContent: 'center', alignItems: 'center',
  },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '700' },
  resultsText: {
    color: '#4a5568', fontSize: 11,
    paddingHorizontal: 16, paddingVertical: 6,
  },
  modalOverlay: {
    flex: 1, justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalSheet: {
    backgroundColor: '#1a1f36',
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 20, maxHeight: '85%',
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: '#2d3561', alignSelf: 'center', marginBottom: 16,
  },
  modalTitle: { color: '#e2e8f0', fontSize: 17, fontWeight: '600', marginBottom: 20 },
  filterLabel: { color: '#a0aec0', fontSize: 12, fontWeight: '500', marginBottom: 10 },
  textInput: {
    backgroundColor: '#0f1225', borderWidth: 0.5, borderColor: '#2d3561',
    borderRadius: 8, paddingHorizontal: 14, paddingVertical: 11,
    color: '#e2e8f0', fontSize: 14, marginBottom: 16,
  },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  clearBtn: {
    flex: 1, paddingVertical: 13, borderRadius: 10,
    borderWidth: 0.5, borderColor: '#2d3561',
    alignItems: 'center',
  },
  clearText: { color: '#718096', fontSize: 14 },
  applyBtn: {
    flex: 2, paddingVertical: 13, borderRadius: 10,
    backgroundColor: '#4f6ef7', alignItems: 'center',
  },
  applyText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
