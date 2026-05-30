import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView,
} from 'react-native';
import {
  format, parseISO, addMonths, subDays,
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameDay, isAfter, isWithinInterval, isSameMonth,
} from 'date-fns';
import { es } from 'date-fns/locale/es';
import { useTheme } from '../../theme/ThemeContext';
import { Colors, Typography, Spacing, Radius } from '../../theme/theme';

type Mode = 'range' | 'single';

interface DateFilterProps {
  start: string;                 // YYYY-MM-DD
  end: string;                   // YYYY-MM-DD
  onChange: (start: string, end: string) => void;
  mode?: Mode;                   // 'range' (def) | 'single'
}

const fmt = (d: Date) => format(d, 'yyyy-MM-dd');
const short = (s: string) => format(parseISO(s), 'd MMM', { locale: es });

function presets() {
  const t = new Date();
  return {
    today:     [fmt(t), fmt(t)] as [string, string],
    yesterday: [fmt(subDays(t, 1)), fmt(subDays(t, 1))] as [string, string],
    week:      [fmt(subDays(t, 6)), fmt(t)] as [string, string],
    month:     [fmt(subDays(t, 29)), fmt(t)] as [string, string],
  };
}

const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

export default function DateFilter({ start, end, onChange, mode = 'range' }: DateFilterProps) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState<Date>(parseISO(start || fmt(new Date())));
  const [pStart, setPStart] = useState(start);
  const [pEnd, setPEnd] = useState(end);

  const P = presets();
  const isPreset = (r: [string, string]) => start === r[0] && end === r[1];

  const PRESETS: { key: keyof ReturnType<typeof presets>; label: string }[] = mode === 'single'
    ? [{ key: 'today', label: 'Hoy' }, { key: 'yesterday', label: 'Ayer' }]
    : [
        { key: 'today', label: 'Hoy' },
        { key: 'yesterday', label: 'Ayer' },
        { key: 'week', label: '7 días' },
        { key: 'month', label: '30 días' },
      ];

  function openModal() {
    setPStart(start);
    setPEnd(end);
    setViewMonth(parseISO(start || fmt(new Date())));
    setOpen(true);
  }

  function pressDay(day: Date) {
    const s = fmt(day);
    if (mode === 'single') { setPStart(s); setPEnd(s); return; }
    // range
    if (!pStart || (pStart && pEnd)) { setPStart(s); setPEnd(''); return; }
    if (pStart && !pEnd) {
      if (isAfter(parseISO(s), parseISO(pStart))) setPEnd(s);
      else { setPStart(s); setPEnd(''); }
    }
  }

  function apply() {
    const s = pStart || fmt(new Date());
    const e = pEnd || s;
    onChange(s, e);
    setOpen(false);
  }

  // Grid del mes visible (lunes a domingo)
  const gridStart = startOfWeek(startOfMonth(viewMonth), { weekStartsOn: 1 });
  const gridEnd = endOfWeek(endOfMonth(viewMonth), { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const selStart = pStart ? parseISO(pStart) : null;
  const selEnd = pEnd ? parseISO(pEnd) : null;

  function dayState(d: Date) {
    if (selStart && selEnd) {
      const inRange = isWithinInterval(d, { start: selStart, end: selEnd });
      const isEdge = isSameDay(d, selStart) || isSameDay(d, selEnd);
      return { inRange, isEdge };
    }
    if (selStart) return { inRange: false, isEdge: isSameDay(d, selStart) };
    return { inRange: false, isEdge: false };
  }

  const pillLabel = start === end ? short(start) : `${short(start)} – ${short(end)}`;

  return (
    <View style={[s.bar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips}>
        {PRESETS.map(p => {
          const active = isPreset(P[p.key]);
          return (
            <TouchableOpacity
              key={p.key}
              style={[s.chip, { borderColor: colors.border, backgroundColor: colors.surfaceAlt },
                active && { backgroundColor: Colors.primary + '15', borderColor: Colors.primary + '40' }]}
              onPress={() => onChange(P[p.key][0], P[p.key][1])}
            >
              <Text style={[s.chipText, { color: active ? Colors.primary : colors.textSecondary }, active && { fontWeight: '600' }]}>
                {p.label}
              </Text>
            </TouchableOpacity>
          );
        })}
        <TouchableOpacity
          style={[s.calChip, { backgroundColor: Colors.primary + '12', borderColor: Colors.primary + '30' }]}
          onPress={openModal}
        >
          <Text style={[s.calIcon, { color: Colors.primary }]}>📅</Text>
          <Text style={[s.calText, { color: Colors.primary }]} numberOfLines={1}>{pillLabel}</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal calendario */}
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={() => setOpen(false)}>
          <TouchableOpacity activeOpacity={1} style={[s.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {/* Header mes */}
            <View style={s.calHeader}>
              <TouchableOpacity onPress={() => setViewMonth(addMonths(viewMonth, -1))} style={s.navBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={[s.navIcon, { color: colors.textSecondary }]}>‹</Text>
              </TouchableOpacity>
              <Text style={[s.monthLabel, { color: colors.text }]}>
                {format(viewMonth, 'MMMM yyyy', { locale: es })}
              </Text>
              <TouchableOpacity onPress={() => setViewMonth(addMonths(viewMonth, 1))} style={s.navBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={[s.navIcon, { color: colors.textSecondary }]}>›</Text>
              </TouchableOpacity>
            </View>

            {/* Días de la semana */}
            <View style={s.weekRow}>
              {WEEKDAYS.map((w, i) => (
                <Text key={i} style={[s.weekday, { color: colors.textTertiary }]}>{w}</Text>
              ))}
            </View>

            {/* Grilla */}
            <View style={s.grid}>
              {days.map((d, i) => {
                const { inRange, isEdge } = dayState(d);
                const dim = !isSameMonth(d, viewMonth);
                const isToday = isSameDay(d, new Date());
                return (
                  <TouchableOpacity
                    key={i}
                    style={[s.cell,
                      inRange && { backgroundColor: Colors.primary + '18' },
                      isEdge && { backgroundColor: Colors.primary },
                    ]}
                    onPress={() => pressDay(d)}
                  >
                    <Text style={[s.cellText,
                      { color: dim ? colors.textDisabled : colors.text },
                      isToday && !isEdge && { color: Colors.primary, fontWeight: '700' },
                      isEdge && { color: '#FFF', fontWeight: '700' },
                    ]}>
                      {format(d, 'd')}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Atajos */}
            <View style={s.shortcuts}>
              {(['today', 'yesterday', 'week', 'month'] as const).map(k => (
                <TouchableOpacity key={k}
                  style={[s.scBtn, { borderColor: colors.border }]}
                  onPress={() => { setPStart(P[k][0]); setPEnd(P[k][1]); setViewMonth(parseISO(P[k][1])); }}
                >
                  <Text style={[s.scText, { color: colors.textSecondary }]}>
                    {k === 'today' ? 'Hoy' : k === 'yesterday' ? 'Ayer' : k === 'week' ? '7 días' : '30 días'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Acciones */}
            <View style={s.actions}>
              <TouchableOpacity style={[s.btnCancel, { borderColor: colors.border }]} onPress={() => setOpen(false)}>
                <Text style={[s.btnCancelText, { color: colors.textSecondary }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.btnApply, { backgroundColor: Colors.primary }]} onPress={apply}>
                <Text style={s.btnApplyText}>Aplicar</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  bar:        { borderBottomWidth: 0.5 },
  chips:      { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  chip:       { paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.full, borderWidth: 0.5 },
  chipText:   { fontSize: Typography.xs },
  calChip:    { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.full, borderWidth: 0.5 },
  calIcon:    { fontSize: 12 },
  calText:    { fontSize: Typography.xs, fontWeight: '600', maxWidth: 130 },
  overlay:    { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.45)', padding: Spacing.xl },
  sheet:      { width: '100%', maxWidth: 360, borderRadius: Radius.lg, borderWidth: 0.5, padding: Spacing.lg },
  calHeader:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md },
  navBtn:     { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  navIcon:    { fontSize: 26 },
  monthLabel: { fontSize: Typography.base, fontWeight: '600', textTransform: 'capitalize' },
  weekRow:    { flexDirection: 'row', marginBottom: Spacing.xs },
  weekday:    { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '600' },
  grid:       { flexDirection: 'row', flexWrap: 'wrap' },
  cell:       { width: `${100 / 7}%` as any, aspectRatio: 1, justifyContent: 'center', alignItems: 'center', borderRadius: Radius.md },
  cellText:   { fontSize: Typography.sm },
  shortcuts:  { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginTop: Spacing.md },
  scBtn:      { paddingHorizontal: 10, paddingVertical: 5, borderRadius: Radius.full, borderWidth: 0.5 },
  scText:     { fontSize: Typography.xs },
  actions:    { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.lg },
  btnCancel:  { flex: 1, paddingVertical: 11, borderRadius: Radius.md, borderWidth: 0.5, alignItems: 'center' },
  btnCancelText: { fontSize: Typography.base },
  btnApply:   { flex: 1, paddingVertical: 11, borderRadius: Radius.md, alignItems: 'center' },
  btnApplyText: { color: '#FFF', fontSize: Typography.base, fontWeight: '600' },
});
