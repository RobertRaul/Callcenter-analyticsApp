import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Call, STATUS_MAP } from '../../services/callsApi';
import { useTheme } from '../../theme/ThemeContext';
import { Colors, Typography, Spacing, Radius } from '../../theme/theme';

interface CallItemProps {
  call: Call;
  onPress: (call: Call) => void;
}

const TYPE_CONFIG = {
  answered: {
    icon:  '↙',
    light: { color: Colors.success, bg: Colors.successLight },
    dark:  { color: '#4CAF50',      bg: '#0D2010'           },
  },
  active: {
    icon:  '◉',
    light: { color: Colors.primary, bg: Colors.primaryLight },
    dark:  { color: '#60B4E0',      bg: '#0D2030'           },
  },
  missed: {
    icon:  '↗',
    light: { color: Colors.error,   bg: Colors.errorLight   },
    dark:  { color: '#EF5350',      bg: '#200D0D'           },
  },
};

function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleString('es-PE', {
      day:'2-digit', month:'short',
      hour:'2-digit', minute:'2-digit',
    });
  } catch { return dateStr; }
}

export default function CallItem({ call, onPress }: CallItemProps) {
  const { isDark, colors } = useTheme();

  const statusInfo = STATUS_MAP[call.status] ?? { label: call.status, type: 'missed' as const };
  const typeCfg    = TYPE_CONFIG[statusInfo.type];
  const colorCfg   = isDark ? typeCfg.dark : typeCfg.light;

  return (
    <TouchableOpacity
      style={[styles.row, { borderBottomColor: colors.divider }]}
      onPress={() => onPress(call)}
      activeOpacity={0.7}
    >
      <View style={[styles.iconCircle, { backgroundColor: colorCfg.bg }]}>
        <Text style={[styles.icon, { color: colorCfg.color }]}>{typeCfg.icon}</Text>
      </View>
      <View style={styles.info}>
        <View style={styles.topRow}>
          <Text style={[styles.number, { color: colors.text }]}>{call.phone_number || '—'}</Text>
          <Text style={[styles.date, { color: colors.textTertiary }]}>{formatDate(call.calldate)}</Text>
        </View>
        <View style={styles.midRow}>
          <Text style={[styles.queue, { color: colors.textSecondary }]} numberOfLines={1}>
            {call.agent_full || call.agent || `Cola ${call.queuename}`}
          </Text>
          <View style={styles.badges}>
            {call.has_recording && (
              <View style={[styles.recBadge, { backgroundColor: Colors.error + '15' }]}>
                <Text style={[styles.recText, { color: Colors.error }]}>⏺ REC</Text>
              </View>
            )}
            <Text style={[styles.statusText, { color: colorCfg.color }]}>{statusInfo.label}</Text>
            <Text style={[styles.duration, { color: colors.textTertiary }]}>
              {call.talk_time_formatted || '0m 0s'}
            </Text>
          </View>
        </View>
        {call.wait_time > 0 && call.wait_time_formatted && (
          <Text style={[styles.wait, { color: colors.textDisabled }]}>
            Espera: {call.wait_time_formatted}
          </Text>
        )}
      </View>
      <Text style={[styles.chevron, { color: colors.textDisabled }]}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row:        { flexDirection:'row', alignItems:'center', paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg, borderBottomWidth:0.5, gap: Spacing.md },
  iconCircle: { width:38, height:38, borderRadius:19, justifyContent:'center', alignItems:'center' },
  icon:       { fontSize:16, fontWeight:'700' },
  info:       { flex:1 },
  topRow:     { flexDirection:'row', justifyContent:'space-between', marginBottom:3 },
  number:     { fontSize: Typography.base, fontWeight:'600' },
  date:       { fontSize: Typography.xs },
  midRow:     { flexDirection:'row', justifyContent:'space-between', alignItems:'center' },
  queue:      { fontSize: Typography.xs, flex:1 },
  badges:     { flexDirection:'row', alignItems:'center', gap: Spacing.sm },
  recBadge:   { paddingHorizontal:5, paddingVertical:1, borderRadius: Radius.sm },
  recText:    { fontSize:9, fontWeight:'600' },
  statusText: { fontSize: Typography.xs, fontWeight:'500' },
  duration:   { fontSize: Typography.xs },
  wait:       { fontSize:10, marginTop:2 },
  chevron:    { fontSize:20 },
});
