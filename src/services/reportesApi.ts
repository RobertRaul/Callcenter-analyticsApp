import * as FileSystem from 'expo-file-system/legacy';
import * as SecureStore from 'expo-secure-store';
import * as Sharing from 'expo-sharing';
import { TOKEN_KEY } from '../lib/apiClient';
import logger from '../lib/logger';

const BASE_URL = 'http://192.168.11.3/api';

export type ReportType   = 'general' | 'agents' | 'queues' | 'calls';
export type ReportFormat = 'excel' | 'pdf';

export interface ReportParams {
  type:       ReportType;
  format:     ReportFormat;
  start_date: string;
  end_date:   string;
  limit?:     number;
}

export interface DownloadProgress {
  bytesWritten: number;
  status: 'idle' | 'downloading' | 'done' | 'error';
  message?: string;
}

const REPORT_LABELS: Record<ReportType, string> = {
  general: 'general',
  agents:  'agentes',
  queues:  'colas',
  calls:   'llamadas',
};

const EXT: Record<ReportFormat, string> = {
  excel: 'xlsx',
  pdf:   'pdf',
};

const MIME: Record<ReportFormat, string> = {
  excel: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  pdf:   'application/pdf',
};

// Convierte ArrayBuffer a base64 de forma segura en Android
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes   = new Uint8Array(buffer);
  const len     = bytes.length;
  const chars: string[] = [];

  // Procesar en chunks pequeños para evitar stack overflow en Android
  const CHUNK = 1024;
  for (let i = 0; i < len; i += CHUNK) {
    const chunk = bytes.subarray(i, Math.min(i + CHUNK, len));
    chars.push(String.fromCharCode.apply(null, chunk as unknown as number[]));
  }

  return btoa(chars.join(''));
}

export async function downloadReport(
  params: ReportParams,
  onProgress?: (p: DownloadProgress) => void,
): Promise<string> {
  const { type, format, start_date, end_date, limit } = params;

  let url = `${BASE_URL}/reports/export/${type}/${format}?start_date=${start_date}&end_date=${end_date}`;
  if (type === 'calls' && limit) url += `&limit=${limit}`;

  const filename  = `reporte_${REPORT_LABELS[type]}_${start_date}_${end_date}.${EXT[format]}`;
  const localPath = `${FileSystem.cacheDirectory}${filename}`;

  logger.debug('reportesApi', `POST ${url}`);

  // Limpiar caché previo
  try {
    const info = await FileSystem.getInfoAsync(localPath);
    if (info.exists) await FileSystem.deleteAsync(localPath, { idempotent: true });
  } catch {}

  onProgress?.({ bytesWritten: 0, status: 'downloading', message: 'Generando reporte en el servidor…' });

  const token = await SecureStore.getItemAsync(TOKEN_KEY);

  try {
    const response = await fetch(url, {
      method:  'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ chart_image: null }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      throw new Error(`Error ${response.status}: ${errText.slice(0, 150)}`);
    }

    onProgress?.({ bytesWritten: 0, status: 'downloading', message: 'Procesando archivo…' });

    const buffer  = await response.arrayBuffer();
    const sizeKB  = Math.round(buffer.byteLength / 1024);

    onProgress?.({ bytesWritten: buffer.byteLength, status: 'downloading', message: `Guardando ${sizeKB}KB…` });

    // Conversión segura a base64 para Android
    const base64 = arrayBufferToBase64(buffer);

    await FileSystem.writeAsStringAsync(localPath, base64, {
      encoding: FileSystem.EncodingType.Base64,
    });

    logger.debug('reportesApi', `Guardado: ${filename} (${sizeKB}KB)`);
    onProgress?.({ bytesWritten: buffer.byteLength, status: 'done', message: `${sizeKB}KB` });

    return localPath;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error desconocido';
    logger.error('reportesApi', 'Error en descarga', { msg });
    onProgress?.({ bytesWritten: 0, status: 'error', message: msg });
    throw err;
  }
}

export async function shareReport(localPath: string, format: ReportFormat): Promise<void> {
  const available = await Sharing.isAvailableAsync();
  if (!available) throw new Error('Compartir no disponible en este dispositivo');

  await Sharing.shareAsync(localPath, {
    mimeType:    MIME[format],
    dialogTitle: 'Compartir reporte MACSA',
    UTI:         format === 'pdf'
      ? 'com.adobe.pdf'
      : 'org.openxmlformats.spreadsheetml.sheet',
  });
}
