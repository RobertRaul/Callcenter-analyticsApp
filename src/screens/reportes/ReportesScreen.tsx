import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Alert, ActivityIndicator, Modal,
  TextInput, Platform,
} from 'react-native';
import {
  downloadReport, shareReport,
  ReportType, ReportFormat, DownloadProgress,
} from '../../services/reportesApi';
import { todayStr, yesterdayStr, nDaysAgoStr } from '../../lib/dateHelpers';
import { useTheme } from '../../theme/ThemeContext';
import { Colors, Typography, Spacing, Radius } from '../../theme/theme';
import AppHeader from '../../components/ui/AppHeader';
import Card from '../../components/ui/Card';
import { Divider } from '../../components/ui/misc';

// ─── Íconos SVG como componentes ─────────────────────────────────────────────
// Usamos Text con caracteres Unicode profesionales para compatibilidad
// Sin dependencias externas

function Icon({ name, size = 20, color }: { name: string; size?: number; color: string }) {
  const ICONS: Record<string, string> = {
    // Reportes
    general:   '📊',
    agents:    '👥',
    queues:    '📋',
    calls:     '📞',
    // Formatos
    excel:     '📗',
    pdf:       '📕',
    // Acciones
    download:  '⬇',
    share:     '↑',
    refresh:   '↺',
    calendar:  '📅',
    check:     '✓',
    error:     '⚠',
    // Navegación
    back:      '‹',
    close:     '✕',
    filter:    '⊟',
  };
  return (
    <Text style={{ fontSize: size, color, lineHeight: size + 4 }}>
      {ICONS[name] ?? '●'}
    </Text>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

type DatePreset = 'today' | 'yesterday' | 'week' | 'month' | 'custom';

function presetToRange(p: DatePreset): { start: string; end: string } {
  const end = todayStr();
  switch (p) {
    case 'today':     return { start: end,              end };
    case 'yesterday': return { start: yesterdayStr(),   end: yesterdayStr() };
    case 'week':      return { start: nDaysAgoStr(6),   end };
    case 'month':     return { start: nDaysAgoStr(29),  end };
    default:          return { start: end,              end };
  }
}

function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-PE', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  } catch { return dateStr; }
}

function isValidDate(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(new Date(s).getTime());
}

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface ReportState {
  progress: DownloadProgress;
  localPath: string | null;
}

const INIT: ReportState = { progress: { bytesWritten: 0, status: 'idle' }, localPath: null };

// ─── Configuración ─────────────────────────────────────────────────────────

const REPORT_TYPES: { key: ReportType; label: string; icon: string; desc: string }[] = [
  { key:'general', label:'General',  icon:'general', desc:'KPIs, llamadas, agentes y colas' },
  { key:'agents',  label:'Agentes',  icon:'agents',  desc:'Rendimiento y estadísticas por agente' },
  { key:'queues',  label:'Colas',    icon:'queues',  desc:'SLA y tiempos de espera por cola' },
  { key:'calls',   label:'Llamadas', icon:'calls',   desc:'Historial detallado de llamadas' },
];

const DATE_PRESETS: { key: DatePreset; label: string }[] = [
  { key:'today',     label:'Hoy'     },
  { key:'yesterday', label:'Ayer'    },
  { key:'week',      label:'7 días'  },
  { key:'month',     label:'30 días' },
  { key:'custom',    label:'Custom'  },
];

// ─── Modal selector de fecha ──────────────────────────────────────────────────

function DatePickerModal({
  visible, onClose, onApply, initialStart, initialEnd,
}: {
  visible: boolean;
  onClose: () => void;
  onApply: (start: string, end: string) => void;
  initialStart: string;
  initialEnd:   string;
}) {
  const { colors } = useTheme();
  const [start, setStart] = useState(initialStart);
  const [end,   setEnd]   = useState(initialEnd);
  const [errStart, setErrStart] = useState('');
  const [errEnd,   setErrEnd]   = useState('');

  const validate = () => {
    let ok = true;
    if (!isValidDate(start)) { setErrStart('Formato: YYYY-MM-DD'); ok = false; } else setErrStart('');
    if (!isValidDate(end))   { setErrEnd('Formato: YYYY-MM-DD');   ok = false; } else setErrEnd('');
    if (ok && start > end)   { setErrEnd('Fin debe ser ≥ inicio'); ok = false; }
    return ok;
  };

  const handleApply = () => {
    if (validate()) { onApply(start, end); onClose(); }
  };

  // Shortcuts rápidos dentro del modal
  const SHORTCUTS: { label: string; fn: () => void }[] = [
    { label: 'Hoy',       fn: () => { const t = todayStr();     setStart(t); setEnd(t); } },
    { label: 'Ayer',      fn: () => { const y = yesterdayStr(); setStart(y); setEnd(y); } },
    { label: '7 días',    fn: () => { setStart(nDaysAgoStr(6)); setEnd(todayStr()); } },
    { label: '30 días',   fn: () => { setStart(nDaysAgoStr(29));setEnd(todayStr()); } },
    { label: 'Este mes',  fn: () => {
      const now   = new Date();
      const first = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-01`;
      setStart(first); setEnd(todayStr());
    }},
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={dp.overlay}>
        <View style={[dp.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* Header */}
          <View style={[dp.header, { borderBottomColor: colors.border }]}>
            <Text style={[dp.title, { color: colors.text }]}>Seleccionar período</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top:8,bottom:8,left:8,right:8 }}>
              <Icon name="close" size={18} color={colors.textTertiary} />
            </TouchableOpacity>
          </View>

          {/* Shortcuts */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={dp.shortcuts}>
            {SHORTCUTS.map(s => (
              <TouchableOpacity
                key={s.label}
                style={[dp.shortcut, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
                onPress={s.fn}
              >
                <Text style={[dp.shortcutText, { color: colors.textSecondary }]}>{s.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Inputs */}
          <View style={dp.inputs}>
            <View style={dp.inputGroup}>
              <Text style={[dp.inputLabel, { color: colors.textSecondary }]}>Fecha inicio</Text>
              <TextInput
                style={[dp.input, {
                  backgroundColor: colors.background,
                  borderColor: errStart ? Colors.error : colors.border,
                  color: colors.text,
                }]}
                value={start}
                onChangeText={v => { setStart(v); setErrStart(''); }}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textDisabled}
                keyboardType="numeric"
                maxLength={10}
              />
              {errStart ? <Text style={dp.inputError}>{errStart}</Text> : null}
            </View>
            <View style={dp.inputSep}>
              <Text style={[dp.inputSepText, { color: colors.textTertiary }]}>→</Text>
            </View>
            <View style={dp.inputGroup}>
              <Text style={[dp.inputLabel, { color: colors.textSecondary }]}>Fecha fin</Text>
              <TextInput
                style={[dp.input, {
                  backgroundColor: colors.background,
                  borderColor: errEnd ? Colors.error : colors.border,
                  color: colors.text,
                }]}
                value={end}
                onChangeText={v => { setEnd(v); setErrEnd(''); }}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textDisabled}
                keyboardType="numeric"
                maxLength={10}
              />
              {errEnd ? <Text style={dp.inputError}>{errEnd}</Text> : null}
            </View>
          </View>

          {/* Preview */}
          {isValidDate(start) && isValidDate(end) && start <= end && (
            <View style={[dp.preview, { backgroundColor: Colors.primary + '10', borderColor: Colors.primary + '25' }]}>
              <Text style={[dp.previewText, { color: Colors.primary }]}>
                📅 {formatDisplayDate(start)} → {formatDisplayDate(end)}
              </Text>
            </View>
          )}

          {/* Botones */}
          <View style={dp.btns}>
            <TouchableOpacity
              style={[dp.btnCancel, { borderColor: colors.border }]}
              onPress={onClose}
            >
              <Text style={[dp.btnCancelText, { color: colors.textSecondary }]}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[dp.btnApply, { backgroundColor: Colors.primary }]}
              onPress={handleApply}
            >
              <Text style={dp.btnApplyText}>Aplicar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const dp = StyleSheet.create({
  overlay:       { flex:1, justifyContent:'flex-end', backgroundColor:'rgba(0,0,0,0.4)' },
  sheet:         { borderTopLeftRadius:20, borderTopRightRadius:20, borderTopWidth:0.5, padding: Spacing.xl, paddingBottom:40 },
  header:        { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom: Spacing.lg, paddingBottom: Spacing.md, borderBottomWidth:0.5 },
  title:         { fontSize: Typography.lg, fontWeight:'600' },
  shortcuts:     { marginBottom: Spacing.lg },
  shortcut:      { paddingHorizontal:12, paddingVertical:6, borderRadius: Radius.full, borderWidth:0.5, marginRight: Spacing.sm },
  shortcutText:  { fontSize: Typography.xs },
  inputs:        { flexDirection:'row', alignItems:'flex-start', gap: Spacing.sm, marginBottom: Spacing.md },
  inputGroup:    { flex:1 },
  inputLabel:    { fontSize: Typography.xs, fontWeight:'500', marginBottom: Spacing.xs },
  input:         { borderWidth:0.5, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical:10, fontSize: Typography.base },
  inputError:    { fontSize:10, color: Colors.error, marginTop:3 },
  inputSep:      { paddingTop:28, alignItems:'center', width:20 },
  inputSepText:  { fontSize: Typography.base },
  preview:       { borderRadius: Radius.md, borderWidth:0.5, padding: Spacing.md, marginBottom: Spacing.md, alignItems:'center' },
  previewText:   { fontSize: Typography.sm, fontWeight:'500' },
  btns:          { flexDirection:'row', gap: Spacing.md },
  btnCancel:     { flex:1, paddingVertical:12, borderRadius: Radius.md, borderWidth:0.5, alignItems:'center' },
  btnCancelText: { fontSize: Typography.base },
  btnApply:      { flex:1, paddingVertical:12, borderRadius: Radius.md, alignItems:'center' },
  btnApplyText:  { color:'#FFF', fontSize: Typography.base, fontWeight:'600' },
});

// ─── Tarjeta de formato ───────────────────────────────────────────────────────

function FormatCard({
  format, label, icon, desc, accent,
  state, onDownload, onShare, colors,
}: {
  format: ReportFormat; label: string; icon: string; desc: string;
  accent: string; state: ReportState;
  onDownload: () => void; onShare: () => void; colors: any;
}) {
  const { status, message, bytesWritten } = state.progress;
  const isLoading = status === 'downloading';
  const isDone    = status === 'done' && !!state.localPath;
  const isError   = status === 'error';

  return (
    <View style={[fc.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[fc.header, { backgroundColor: accent + '12' }]}>
        <Icon name={icon} size={26} color={accent} />
        <View style={{ flex:1 }}>
          <Text style={[fc.label, { color: accent }]}>{label}</Text>
          <Text style={[fc.ext, { color: accent + 'AA' }]}>
            .{format === 'excel' ? 'xlsx' : 'pdf'}
          </Text>
        </View>
        {isDone && (
          <View style={[fc.doneBadge, { backgroundColor: Colors.success + '20' }]}>
            <Text style={{ color: Colors.success, fontSize:10, fontWeight:'700' }}>✓ Listo</Text>
          </View>
        )}
      </View>

      <View style={fc.body}>
        <Text style={[fc.desc, { color: colors.textSecondary }]}>{desc}</Text>

        {isLoading && (
          <View style={fc.statusRow}>
            <ActivityIndicator size="small" color={accent} />
            <Text style={[fc.statusText, { color: accent }]}>{message ?? 'Generando…'}</Text>
          </View>
        )}
        {isDone && bytesWritten > 0 && (
          <Text style={[fc.statusText, { color: Colors.success }]}>
            {Math.round(bytesWritten / 1024)}KB descargados
          </Text>
        )}
        {isError && (
          <Text style={[fc.statusText, { color: Colors.error }]} numberOfLines={2}>
            ⚠ {message ?? 'Error al generar'}
          </Text>
        )}

        <View style={fc.btns}>
          {!isDone ? (
            <TouchableOpacity
              style={[fc.btnMain, { backgroundColor: accent }, isLoading && fc.btnDisabled]}
              onPress={onDownload}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              {isLoading
                ? <ActivityIndicator size="small" color="#FFF" />
                : <>
                    <Icon name="download" size={14} color="#FFF" />
                    <Text style={fc.btnMainText}>Descargar</Text>
                  </>
              }
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity
                style={[fc.btnSec, { borderColor: accent }]}
                onPress={onDownload}
                activeOpacity={0.85}
              >
                <Icon name="refresh" size={12} color={accent} />
                <Text style={[fc.btnSecText, { color: accent }]}>Regenerar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[fc.btnMain, { backgroundColor: accent }]}
                onPress={onShare}
                activeOpacity={0.85}
              >
                <Icon name="share" size={14} color="#FFF" />
                <Text style={fc.btnMainText}>Compartir</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </View>
  );
}

const fc = StyleSheet.create({
  card:       { flex:1, borderRadius: Radius.lg, borderWidth:0.5, overflow:'hidden' },
  header:     { flexDirection:'row', alignItems:'center', gap: Spacing.sm, padding: Spacing.md },
  label:      { fontSize: Typography.base, fontWeight:'700' },
  ext:        { fontSize: Typography.xs },
  doneBadge:  { paddingHorizontal:6, paddingVertical:2, borderRadius: Radius.full },
  body:       { padding: Spacing.md, gap: Spacing.sm },
  desc:       { fontSize: Typography.xs, lineHeight:16 },
  statusRow:  { flexDirection:'row', alignItems:'center', gap: Spacing.xs },
  statusText: { fontSize: Typography.xs },
  btns:       { flexDirection:'row', gap: Spacing.xs, marginTop: Spacing.xs },
  btnMain:    { flex:1, flexDirection:'row', paddingVertical:9, borderRadius: Radius.sm, alignItems:'center', justifyContent:'center', gap:5, minHeight:36 },
  btnMainText:{ color:'#FFF', fontSize: Typography.xs, fontWeight:'600' },
  btnSec:     { flex:1, flexDirection:'row', paddingVertical:9, borderRadius: Radius.sm, alignItems:'center', justifyContent:'center', gap:5, borderWidth:1 },
  btnSecText: { fontSize: Typography.xs, fontWeight:'600' },
  btnDisabled:{ opacity:0.6 },
});

// ─── Pantalla principal ───────────────────────────────────────────────────────

export default function ReportesScreen() {
  const { colors } = useTheme();
  const [activeType, setActiveType]     = useState<ReportType>('general');
  const [activePreset, setActivePreset] = useState<DatePreset>('today');
  const [customStart, setCustomStart]   = useState(todayStr());
  const [customEnd, setCustomEnd]       = useState(todayStr());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [states, setStates]             = useState<Record<string, ReportState>>({});

  // Calcular rango activo
  const dateRange = activePreset === 'custom'
    ? { start: customStart, end: customEnd }
    : presetToRange(activePreset);

  function getState(type: ReportType, fmt: ReportFormat): ReportState {
    return states[`${type}-${fmt}`] ?? INIT;
  }

  function setReportState(type: ReportType, fmt: ReportFormat, s: Partial<ReportState>) {
    setStates(prev => ({
      ...prev,
      [`${type}-${fmt}`]: { ...(prev[`${type}-${fmt}`] ?? INIT), ...s },
    }));
  }

  const handleDownload = useCallback(async (format: ReportFormat) => {
    setReportState(activeType, format, { progress:{ bytesWritten:0, status:'downloading' }, localPath:null });
    try {
      const path = await downloadReport(
        { type: activeType, format, start_date: dateRange.start, end_date: dateRange.end, limit: 500 },
        (p) => setReportState(activeType, format, { progress: p }),
      );
      setReportState(activeType, format, { progress:{ bytesWritten:0, status:'done' }, localPath: path });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al generar reporte';
      Alert.alert('Error al generar reporte', msg);
    }
  }, [activeType, dateRange]);

  const handleShare = useCallback(async (format: ReportFormat) => {
    const { localPath } = getState(activeType, format);
    if (!localPath) return;
    try { await shareReport(localPath, format); }
    catch { Alert.alert('Error', 'No se pudo compartir el archivo'); }
  }, [activeType, states]);

  const activeTypeCfg = REPORT_TYPES.find(r => r.key === activeType)!;

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      <AppHeader title="Reportes" subtitle="Exportar y compartir" showThemeToggle />

      <ScrollView contentContainerStyle={s.content}>

        {/* Tipo de reporte */}
        <Text style={[s.sLabel, { color: colors.textTertiary }]}>Tipo de reporte</Text>
        <Card noPadding>
          {REPORT_TYPES.map((rt, i) => (
            <View key={rt.key}>
              <TouchableOpacity
                style={s.typeRow}
                onPress={() => { setActiveType(rt.key); setStates({}); }}
                activeOpacity={0.75}
              >
                <View style={[s.typeIconWrap, {
                  backgroundColor: activeType === rt.key ? Colors.primary + '15' : colors.surfaceAlt,
                }]}>
                  <Icon name={rt.icon} size={20} color={activeType === rt.key ? Colors.primary : colors.textSecondary} />
                </View>
                <View style={{ flex:1 }}>
                  <Text style={[s.typeLabel, { color: colors.text }]}>{rt.label}</Text>
                  <Text style={[s.typeDesc,  { color: colors.textTertiary }]}>{rt.desc}</Text>
                </View>
                <View style={[s.radio, { borderColor: activeType === rt.key ? Colors.primary : colors.borderStrong }]}>
                  {activeType === rt.key && <View style={[s.radioDot, { backgroundColor: Colors.primary }]} />}
                </View>
              </TouchableOpacity>
              {i < REPORT_TYPES.length - 1 && <Divider indent={64} />}
            </View>
          ))}
        </Card>

        {/* Período */}
        <Text style={[s.sLabel, { color: colors.textTertiary }]}>Período</Text>
        <View style={s.presetRow}>
          {DATE_PRESETS.map(p => (
            <TouchableOpacity
              key={p.key}
              style={[s.preset,
                { borderColor: colors.border, backgroundColor: colors.surfaceAlt },
                activePreset === p.key && { backgroundColor: Colors.primary + '15', borderColor: Colors.primary + '40' },
              ]}
              onPress={() => {
                setActivePreset(p.key);
                setStates({});
                if (p.key === 'custom') setShowDatePicker(true);
              }}
            >
              {p.key === 'custom' && <Icon name="calendar" size={12} color={activePreset === p.key ? Colors.primary : colors.textSecondary} />}
              <Text style={[s.presetText,
                { color: colors.textSecondary },
                activePreset === p.key && { color: Colors.primary, fontWeight:'600' },
              ]}>{p.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Mostrar rango activo */}
        <TouchableOpacity
          style={[s.rangePill, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
          onPress={() => setShowDatePicker(true)}
        >
          <Icon name="calendar" size={14} color={Colors.primary} />
          <Text style={[s.rangePillText, { color: colors.textSecondary }]}>
            {dateRange.start === dateRange.end
              ? formatDisplayDate(dateRange.start)
              : `${formatDisplayDate(dateRange.start)} → ${formatDisplayDate(dateRange.end)}`
            }
          </Text>
          <Text style={[s.rangePillEdit, { color: Colors.primary }]}>Cambiar</Text>
        </TouchableOpacity>

        {/* Formatos de descarga */}
        <Text style={[s.sLabel, { color: colors.textTertiary }]}>
          Reporte {activeTypeCfg.label}
        </Text>
        <View style={s.formatRow}>
          <FormatCard
            format="excel" label="Excel" icon="excel"
            desc="Tablas detalladas con todos los datos"
            accent={Colors.success}
            state={getState(activeType, 'excel')}
            onDownload={() => handleDownload('excel')}
            onShare={() => handleShare('excel')}
            colors={colors}
          />
          <FormatCard
            format="pdf" label="PDF" icon="pdf"
            desc="Reporte ejecutivo para imprimir"
            accent={Colors.error}
            state={getState(activeType, 'pdf')}
            onDownload={() => handleDownload('pdf')}
            onShare={() => handleShare('pdf')}
            colors={colors}
          />
        </View>

        {/* Info */}
        <View style={[s.infoBox, { backgroundColor: Colors.primary + '08', borderColor: Colors.primary + '20' }]}>
          <Icon name="filter" size={14} color={Colors.primary} />
          <Text style={[s.infoText, { color: colors.textSecondary }]}>
            Los reportes se generan en el servidor con los datos más recientes del período seleccionado. Puedes compartirlos por WhatsApp, correo o Google Drive.
          </Text>
        </View>

      </ScrollView>

      {/* Modal de fechas personalizado */}
      <DatePickerModal
        visible={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        onApply={(start, end) => {
          setCustomStart(start);
          setCustomEnd(end);
          setActivePreset('custom');
          setStates({});
        }}
        initialStart={customStart}
        initialEnd={customEnd}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container:    { flex:1 },
  content:      { padding: Spacing.lg, paddingBottom: 40 },
  sLabel:       { fontSize: Typography.xs, fontWeight:'600', textTransform:'uppercase', letterSpacing:0.8, marginBottom: Spacing.sm, marginTop: Spacing.md },
  typeRow:      { flexDirection:'row', alignItems:'center', padding: Spacing.lg, gap: Spacing.md },
  typeIconWrap: { width:40, height:40, borderRadius:20, justifyContent:'center', alignItems:'center' },
  typeLabel:    { fontSize: Typography.base, fontWeight:'500', marginBottom:2 },
  typeDesc:     { fontSize: Typography.xs },
  radio:        { width:20, height:20, borderRadius:10, borderWidth:2, justifyContent:'center', alignItems:'center' },
  radioDot:     { width:10, height:10, borderRadius:5 },
  presetRow:    { flexDirection:'row', gap: Spacing.xs, marginBottom: Spacing.sm },
  preset:       { flex:1, flexDirection:'row', alignItems:'center', justifyContent:'center', paddingVertical:8, borderRadius: Radius.full, borderWidth:0.5, gap:3 },
  presetText:   { fontSize: Typography.xs },
  rangePill:    { flexDirection:'row', alignItems:'center', gap: Spacing.sm, borderRadius: Radius.md, borderWidth:0.5, padding: Spacing.md, marginBottom: Spacing.sm },
  rangePillText:{ flex:1, fontSize: Typography.sm },
  rangePillEdit:{ fontSize: Typography.xs, fontWeight:'600' },
  formatRow:    { flexDirection:'row', gap: Spacing.sm },
  infoBox:      { flexDirection:'row', gap: Spacing.sm, borderRadius: Radius.md, borderWidth:0.5, padding: Spacing.md, marginTop: Spacing.lg, alignItems:'flex-start' },
  infoText:     { flex:1, fontSize: Typography.xs, lineHeight:18 },
});
