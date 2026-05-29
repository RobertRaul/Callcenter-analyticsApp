import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, PanResponder, LayoutChangeEvent,
} from 'react-native';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
// ← Usar legacy API para compatibilidad con Expo SDK 54
import * as FileSystem from 'expo-file-system/legacy';
import * as SecureStore from 'expo-secure-store';
import { TOKEN_KEY, BASE_URL } from '../../lib/apiClient';
import { useTheme } from '../../theme/ThemeContext';
import { Colors, Typography, Spacing, Radius } from '../../theme/theme';
import logger from '../../lib/logger';

interface AudioPlayerProps {
  callid: string;
  date: string;
  duration?: number;
}

type LoadState = 'idle' | 'downloading' | 'ready' | 'error';

function formatTime(s: number): string {
  if (!s || s < 0 || !isFinite(s)) return '0:00';
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
}

export default function AudioPlayer({ callid, date, duration: expectedDuration }: AudioPlayerProps) {
  const { colors, isDark } = useTheme();
  const [loadState, setLoadState]           = useState<LoadState>('idle');
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [localUri, setLocalUri]             = useState<string | null>(null);
  const [error, setError]                   = useState<string | null>(null);
  const [trackWidth, setTrackWidth]         = useState(0);
  const downloadRef = useRef<FileSystem.DownloadResumable | null>(null);

  const cacheDir  = FileSystem.cacheDirectory ?? '';
  const localPath = `${cacheDir}rec_${callid.replace(/\./g, '_')}.wav`;
  const streamUrl = `${BASE_URL}/recordings/stream/${callid}?date=${date}`;

  useEffect(() => {
    return () => {
      try { downloadRef.current?.cancelAsync(); } catch {}
    };
  }, []);

  const player = useAudioPlayer(localUri ? { uri: localUri } : null);
  const status = useAudioPlayerStatus(player);

  // Auto-play cuando carga
  useEffect(() => {
    if (localUri && status.isLoaded && loadState === 'ready') {
      try { player.play(); } catch {}
    }
  }, [status.isLoaded, localUri, loadState]);

  const startDownload = useCallback(async () => {
    setError(null);
    setLoadState('downloading');
    setDownloadProgress(0);

    try {
      // Verificar caché
      const info = await FileSystem.getInfoAsync(localPath);
      if (info.exists && 'size' in info && (info.size ?? 0) > 1000) {
        logger.debug('AudioPlayer', `Usando caché: ${localPath}`);
        setLocalUri(localPath);
        setLoadState('ready');
        return;
      }

      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      const headers: Record<string, string> = token
        ? { Authorization: `Bearer ${token}` }
        : {};

      logger.debug('AudioPlayer', `Descargando WAV: ${streamUrl}`);

      const download = FileSystem.createDownloadResumable(
        streamUrl,
        localPath,
        { headers },
        (prog) => {
          if (prog.totalBytesExpectedToWrite > 0) {
            setDownloadProgress(
              Math.round((prog.totalBytesWritten / prog.totalBytesExpectedToWrite) * 100)
            );
          }
        }
      );

      downloadRef.current = download;
      const result = await download.downloadAsync();

      if (!result?.uri) throw new Error('Descarga incompleta');

      logger.debug('AudioPlayer', `Listo: ${result.uri} (${Math.round((result as any).headers?.['content-length'] / 1024 ?? 0)}KB)`);
      setLocalUri(result.uri);
      setLoadState('ready');

    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      logger.error('AudioPlayer', 'Error de descarga', { msg });

      // Limpiar archivo parcial
      try { await FileSystem.deleteAsync(localPath, { idempotent: true }); } catch {}

      if (!msg.includes('cancel') && !msg.includes('Cancel')) {
        setError('No se pudo descargar la grabación');
        setLoadState('error');
      } else {
        setLoadState('idle');
      }
    }
  }, [streamUrl, localPath]);

  const togglePlay = useCallback(() => {
    if (loadState === 'idle' || loadState === 'error') {
      startDownload();
      return;
    }
    if (loadState === 'ready') {
      try {
        if (status.playing) player.pause();
        else player.play();
      } catch {}
    }
  }, [loadState, status.playing, player, startDownload]);

  const rewind = useCallback(() => {
    if (loadState !== 'ready') return;
    try { player.seekTo(Math.max(0, (status.currentTime ?? 0) - 10)); } catch {}
  }, [loadState, status.currentTime, player]);

  const forward = useCallback(() => {
    if (loadState !== 'ready') return;
    const total = status.duration ?? expectedDuration ?? 0;
    try { player.seekTo(Math.min(total, (status.currentTime ?? 0) + 10)); } catch {}
  }, [loadState, status.currentTime, status.duration, player, expectedDuration]);

  const seekByPct = useCallback((pct: number) => {
    if (loadState !== 'ready') return;
    const total = status.duration ?? expectedDuration ?? 0;
    if (total > 0) try { player.seekTo(pct * total); } catch {}
  }, [loadState, status.duration, player, expectedDuration]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        if (trackWidth > 0)
          seekByPct(Math.max(0, Math.min(1, e.nativeEvent.locationX / trackWidth)));
      },
      onPanResponderMove: (e) => {
        if (trackWidth > 0)
          seekByPct(Math.max(0, Math.min(1, e.nativeEvent.locationX / trackWidth)));
      },
    })
  ).current;

  const currentTime = status.currentTime ?? 0;
  const totalTime   = status.duration    ?? expectedDuration ?? 0;
  const progress    = totalTime > 0 ? Math.min(currentTime / totalTime, 1) : 0;

  return (
    <View style={[styles.player, {
      backgroundColor: isDark ? '#0D1117' : '#F8FAFC',
      borderColor: colors.border,
    }]}>

      {/* Barra de progreso */}
      <View
        style={[styles.trackBg, { backgroundColor: colors.surfaceAlt }]}
        onLayout={(e: LayoutChangeEvent) => setTrackWidth(e.nativeEvent.layout.width)}
        {...(loadState === 'ready' ? panResponder.panHandlers : {})}
      >
        {/* Descarga */}
        {loadState === 'downloading' && downloadProgress > 0 && (
          <View style={[styles.trackFill, {
            width: `${downloadProgress}%` as any,
            backgroundColor: Colors.primary + '50',
          }]} />
        )}
        {/* Reproducción */}
        {loadState === 'ready' && (
          <>
            <View style={[styles.trackFill, {
              width: `${Math.round(progress * 100)}%` as any,
              backgroundColor: Colors.primary,
            }]} />
            {progress > 0 && (
              <View style={[styles.thumb, {
                left: `${Math.round(progress * 100)}%` as any,
                backgroundColor: Colors.primary,
              }]} />
            )}
          </>
        )}
      </View>

      {/* Tiempos */}
      <View style={styles.times}>
        <Text style={[styles.timeText, { color: colors.textTertiary }]}>
          {formatTime(currentTime)}
        </Text>
        <Text style={[styles.timeText, { color: colors.textTertiary }]}>
          {totalTime > 0 ? formatTime(totalTime)
            : expectedDuration ? formatTime(expectedDuration)
            : '--:--'}
        </Text>
      </View>

      {/* Controles */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.ctrlBtn}
          onPress={rewind}
          disabled={loadState !== 'ready'}
          hitSlop={{ top:8, bottom:8, left:8, right:8 }}
        >
          <Text style={[styles.ctrlIcon, {
            color: loadState === 'ready' ? colors.textSecondary : colors.textDisabled,
          }]}>⟵</Text>
          <Text style={[styles.ctrlLabel, { color: colors.textDisabled }]}>10s</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.playBtn, {
            backgroundColor: loadState === 'error' ? Colors.error : Colors.primary,
            opacity: loadState === 'downloading' ? 0.75 : 1,
          }]}
          onPress={togglePlay}
          disabled={loadState === 'downloading'}
          activeOpacity={0.85}
        >
          {loadState === 'downloading' ? (
            <View style={styles.progressWrap}>
              <ActivityIndicator color="#FFF" size="small" />
              {downloadProgress > 0 && (
                <Text style={styles.progressPct}>{downloadProgress}%</Text>
              )}
            </View>
          ) : (
            <Text style={styles.playIcon}>
              {loadState === 'ready' && status.playing ? '⏸' : '▶'}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.ctrlBtn}
          onPress={forward}
          disabled={loadState !== 'ready'}
          hitSlop={{ top:8, bottom:8, left:8, right:8 }}
        >
          <Text style={[styles.ctrlIcon, {
            color: loadState === 'ready' ? colors.textSecondary : colors.textDisabled,
          }]}>⟶</Text>
          <Text style={[styles.ctrlLabel, { color: colors.textDisabled }]}>10s</Text>
        </TouchableOpacity>
      </View>

      {/* Estado */}
      {loadState === 'idle' && (
        <Text style={[styles.hint, { color: colors.textDisabled }]}>
          Toca ▶ para reproducir la grabación
        </Text>
      )}
      {loadState === 'downloading' && (
        <Text style={[styles.hint, { color: Colors.primary }]}>
          Descargando… {downloadProgress > 0 ? `${downloadProgress}%` : ''}
        </Text>
      )}
      {loadState === 'error' && error && (
        <TouchableOpacity onPress={() => { setLoadState('idle'); setError(null); }}>
          <Text style={[styles.hint, { color: Colors.error }]}>
            {error} · Toca para reintentar
          </Text>
        </TouchableOpacity>
      )}

      <Text style={[styles.format, { color: colors.textDisabled }]}>WAV · Asterisk</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  player: {
    borderRadius: Radius.md, borderWidth: 0.5,
    padding: Spacing.lg, marginTop: Spacing.md, gap: Spacing.sm,
  },
  trackBg: {
    height: 6, borderRadius: 3,
    position: 'relative', overflow: 'visible',
    marginBottom: Spacing.xs,
  },
  trackFill: {
    height: '100%', borderRadius: 3,
    position: 'absolute', left: 0, top: 0,
  },
  thumb: {
    width: 16, height: 16, borderRadius: 8,
    position: 'absolute', top: -5, marginLeft: -8,
  },
  times:        { flexDirection:'row', justifyContent:'space-between' },
  timeText:     { fontSize: Typography.xs },
  controls: {
    flexDirection:'row', justifyContent:'center',
    alignItems:'center', gap:32, marginTop: Spacing.sm,
  },
  ctrlBtn:      { alignItems:'center', gap:2, minWidth:40 },
  ctrlIcon:     { fontSize:22 },
  ctrlLabel:    { fontSize:9 },
  playBtn: {
    width:54, height:54, borderRadius:27,
    justifyContent:'center', alignItems:'center',
  },
  progressWrap: { alignItems:'center', gap:2 },
  progressPct:  { fontSize:9, color:'#FFF', fontWeight:'600' },
  playIcon:     { fontSize:22, color:'#FFF' },
  hint:         { fontSize: Typography.xs, textAlign:'center', marginTop: Spacing.xs },
  format:       { fontSize:9, textAlign:'center', opacity:0.4 },
});
