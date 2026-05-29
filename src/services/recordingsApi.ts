import apiClient from '../lib/apiClient';
import logger from '../lib/logger';
import { STATUS_MAP } from './callsApi';

export interface RecordingCheck {
  callid: string;
  has_recording: boolean;
  date?: string;
}

// Verificar grabación — respuesta real:
// { success, data: { callid, has_recording, date } }
export async function checkRecording(callid: string, date?: string): Promise<RecordingCheck> {
  const params = date ? { date } : {};
  try {
    const { data } = await apiClient.get(`/recordings/check/${callid}`, { params });
    const inner = data?.data ?? data;
    logger.debug('callsApi', `checkRecording ${callid}:`, {
      has_recording: inner?.has_recording,
      date: inner?.date,
    });
    return {
      callid:        String(inner?.callid ?? callid),
      has_recording: Boolean(inner?.has_recording),
      date:          inner?.date ? String(inner.date) : date,
    };
  } catch (e) {
    logger.warn('callsApi', `checkRecording error para ${callid}`, e);
    return { callid, has_recording: false };
  }
}
