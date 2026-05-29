import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CallsStackParamList } from '../../navigation/CallsNavigator';
import { useQuery } from '@tanstack/react-query';
import { callsApi } from '../../services/callsApi';
import AudioPlayer from '../../components/calls/AudioPlayer';
import { useTheme } from '../../theme/ThemeContext';
import { Colors, Typography, Spacing, Radius } from '../../theme/theme';
import AppHeader from '../../components/ui/AppHeader';
import Card from '../../components/ui/Card';
import { Divider } from '../../components/ui/misc';

type Props = NativeStackScreenProps<CallsStackParamList, 'CallDetail'>;

const STATUS_DISPLAY: Record<string, { label: string; color: string }> = {
  COMPLETED: { label: 'Completada',  color: Colors.success  },
  ANSWERED:  { label: 'En llamada',  color: Colors.primary  },
  ABANDONED: { label: 'Abandonada',  color: Colors.error    },
  TIMEOUT:   { label: 'Sin respuesta',color: Colors.warning  },
  FULL:      { label: 'Cola llena',  color: Colors.error    },
};

function InfoRow({ label, value, valueColor, last }: {
  label: string; value: string; valueColor?: string; last?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <View style={[ir.row, !last && { borderBottomColor: colors.divider, borderBottomWidth: 0.5 }]}>
      <Text style={[ir.label, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[ir.value, { color: valueColor ?? colors.text }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}
const ir = StyleSheet.create({
  row:   { flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingVertical: Spacing.md },
  label: { fontSize: Typography.base },
  value: { fontSize: Typography.base, fontWeight:'500', maxWidth:'55%', textAlign:'right' },
});

function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleString('es-PE', {
      weekday:'long', day:'2-digit', month:'long', year:'numeric',
      hour:'2-digit', minute:'2-digit',
    });
  } catch { return dateStr; }
}

// Extraer fecha YYYY-MM-DD del calldate para el parámetro ?date=
function extractDate(calldate: string): string {
  if (!calldate) return new Date().toISOString().split('T')[0];
  return calldate.split('T')[0];
}

export default function CallDetailScreen({ route, navigation }: Props) {
  const { call } = route.params;
  const { colors } = useTheme();

  const statusCfg = STATUS_DISPLAY[call.status] ?? { label: call.status, color: colors.textSecondary };
  const callDate  = extractDate(call.calldate);

  // Verificar si existe grabación — usar la fecha de la llamada
  const { data: recCheck, isLoading: checkingRec } = useQuery({
    queryKey: ['recording', 'check', call.callid, callDate],
    queryFn:  () => callsApi.checkRecording(call.callid, callDate),
    enabled:  !!call.callid,
    staleTime: 5 * 60_000,
    retry: false,
  });

  // has_recording puede venir de la llamada directamente o del check
  const hasRecording = recCheck?.has_recording ?? call.has_recording ?? false;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader
        title="Detalle de llamada"
        showBack
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.content}>

        {/* Número y estado */}
        <Card style={styles.heroCard}>
          <Text style={[styles.phoneNumber, { color: colors.text }]}>
            {call.phone_number || call.src || '—'}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: statusCfg.color + '18', borderColor: statusCfg.color + '40' }]}>
            <Text style={[styles.statusText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
          </View>
          <Text style={[styles.callDate, { color: colors.textTertiary }]}>
            {formatDate(call.calldate)}
          </Text>
        </Card>

        {/* Información de la llamada */}
        <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>
          Información de la llamada
        </Text>
        <Card noPadding>
          <View style={{ padding: Spacing.lg }}>
            <InfoRow label="Número origen"    value={call.phone_number || call.src || '—'} />
            <InfoRow label="Agente"           value={call.agent_full || call.agent || '—'} />
            <InfoRow label="Cola"             value={`Cola ${call.queuename || call.queue || '—'}`} />
            <InfoRow label="Duración"         value={call.talk_time_formatted || '0m 0s'} />
            <InfoRow label="Tiempo de espera" value={call.wait_time_formatted || '0s'}
              valueColor={(call.wait_time ?? 0) > 60 ? Colors.warning : undefined}
            />
            <InfoRow label="Tiempo total"     value={call.total_time_formatted || '0m 0s'} />
            <InfoRow
              label="Resultado"
              value={statusCfg.label}
              valueColor={statusCfg.color}
              last
            />
          </View>
        </Card>

        {/* Grabación */}
        <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>
          Grabación
        </Text>
        <Card>
          {checkingRec ? (
            <View style={styles.recRow}>
              <ActivityIndicator color={Colors.primary} size="small" />
              <Text style={[styles.recSubtext, { color: colors.textSecondary }]}>
                Verificando grabación…
              </Text>
            </View>
          ) : hasRecording ? (
            <>
              <View style={styles.recRow}>
                <View style={[styles.recIcon, { backgroundColor: Colors.error + '15' }]}>
                  <Text style={{ color: Colors.error, fontSize: 14 }}>⏺</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.recTitle, { color: colors.text }]}>
                    Grabación disponible
                  </Text>
                  <Text style={[styles.recSubtext, { color: colors.textTertiary }]}>
                    {call.talk_time > 0 ? call.talk_time_formatted : 'audio/wav'}
                  </Text>
                </View>
              </View>
              {/* Reproductor — sin token, con ?date= */}
              <AudioPlayer
                callid={call.callid}
                date={callDate}
                duration={call.talk_time ?? call.duration ?? 0}
              />
            </>
          ) : (
            <View style={styles.recRow}>
              <View style={[styles.recIcon, { backgroundColor: colors.surfaceAlt }]}>
                <Text style={{ color: colors.textDisabled, fontSize: 14 }}>○</Text>
              </View>
              <Text style={[styles.recSubtext, { color: colors.textDisabled }]}>
                Sin grabación disponible
              </Text>
            </View>
          )}
        </Card>

        {/* ID técnico */}
        <Text style={[styles.callId, { color: colors.textDisabled }]}>
          ID: {call.callid}
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1 },
  content:      { padding: Spacing.lg, paddingBottom: 40 },
  heroCard:     { alignItems:'center', marginBottom: Spacing.sm },
  phoneNumber:  { fontSize: Typography.xxxl, fontWeight: Typography.bold, marginBottom: Spacing.md, letterSpacing: -0.5 },
  statusBadge:  { paddingHorizontal: 16, paddingVertical: 5, borderRadius: Radius.full, borderWidth: 0.5, marginBottom: Spacing.sm },
  statusText:   { fontSize: Typography.sm, fontWeight: Typography.semibold },
  callDate:     { fontSize: Typography.xs, textAlign:'center', lineHeight: 18 },
  sectionLabel: { fontSize: Typography.xs, fontWeight: Typography.semibold, textTransform:'uppercase', letterSpacing: 0.8, marginBottom: Spacing.sm, marginTop: Spacing.sm },
  recRow:       { flexDirection:'row', alignItems:'center', gap: Spacing.md, marginBottom: Spacing.sm },
  recIcon:      { width:36, height:36, borderRadius:18, justifyContent:'center', alignItems:'center' },
  recTitle:     { fontSize: Typography.base, fontWeight: Typography.medium },
  recSubtext:   { fontSize: Typography.xs, marginTop: 1 },
  callId:       { fontSize: Typography.xs, textAlign:'center', marginTop: Spacing.md },
});
