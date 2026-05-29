import apiClient from '../lib/apiClient';
import logger from '../lib/logger';

export interface Call {
  callid: string;
  calldate: string;
  queuename: string;
  agent: string;
  agent_full: string;
  phone_number: string;
  status: string;
  disposition: string;
  wait_time: number;
  talk_time: number;
  total_time: number;
  has_recording: boolean;
  wait_time_formatted: string;
  talk_time_formatted: string;
  total_time_formatted: string;
  // Aliases
  src: string;
  dst: string;
  queue: string;
  billsec: number;
  duration: number;
}

export interface CallsListResponse {
  calls: Call[];
  total: number;
  showing: number;
}

export const STATUS_MAP: Record<string, { label: string; type: 'answered' | 'missed' | 'active' }> = {
  ANSWERED:  { label: 'En llamada',   type: 'active'   },
  COMPLETED: { label: 'Respondida',   type: 'answered' },
  ABANDONED: { label: 'Abandonada',   type: 'missed'   },
  TIMEOUT:   { label: 'Sin respuesta',type: 'missed'   },
  FULL:      { label: 'Cola llena',   type: 'missed'   },
};

export const FILTER_GROUPS = [
  { label: 'Respondidas', apiValues: ['COMPLETED'], type: 'answered' as const },
  { label: 'No contestó', apiValues: ['ABANDONED', 'TIMEOUT', 'FULL'], type: 'missed' as const },
];

export interface CallsFilters {
  start_date?: string;
  end_date?: string;
  limit?: number;
  queue?: string;
  agent?: string;
  status?: string;
}

export interface RecordingCheck {
  callid: string;
  has_recording: boolean;
  date?: string;
}

function mapCall(c: Record<string, unknown>): Call {
  const status     = String(c.status ?? 'UNKNOWN').toUpperCase();
  const cfg        = STATUS_MAP[status];
  const disposition = cfg?.type === 'answered' || cfg?.type === 'active' ? 'ANSWERED' : 'NO ANSWER';

  return {
    callid:               String(c.callid    ?? ''),
    calldate:             String(c.calldate  ?? c.enter_time ?? ''),
    queuename:            String(c.queuename ?? c.queue      ?? ''),
    agent:                String(c.agent     ?? ''),
    agent_full:           String(c.agent_full ?? c.agent    ?? ''),
    phone_number:         String(c.phone_number ?? c.src    ?? ''),
    status,
    disposition,
    wait_time:            Number(c.wait_time  ?? 0),
    talk_time:            Number(c.talk_time  ?? 0),
    total_time:           Number(c.total_time ?? 0),
    has_recording:        Boolean(c.has_recording),
    wait_time_formatted:  String(c.wait_time_formatted  ?? ''),
    talk_time_formatted:  String(c.talk_time_formatted  ?? ''),
    total_time_formatted: String(c.total_time_formatted ?? ''),
    src:      String(c.phone_number ?? c.src  ?? ''),
    dst:      String(c.agent_full   ?? c.agent ?? ''),
    queue:    String(c.queuename    ?? c.queue ?? ''),
    billsec:  Number(c.talk_time    ?? 0),
    duration: Number(c.total_time   ?? 0),
  };
}

export const callsApi = {
  getList: async (filters: CallsFilters = {}): Promise<CallsListResponse> => {
    const params: Record<string, unknown> = {
      start_date: filters.start_date,
      end_date:   filters.end_date,
      limit:      filters.limit ?? 200,
    };
    if (filters.queue)  params.queue  = filters.queue;
    if (filters.agent)  params.agent  = filters.agent;
    if (filters.status) params.status = filters.status;

    const { data } = await apiClient.get('/calls/list', { params });
    const inner = data?.data ?? data;
    const raw   = Array.isArray(inner?.calls) ? inner.calls
      : (Array.isArray(inner) ? inner : []);

    const calls = raw
      .filter((c: unknown) => c != null && typeof c === 'object')
      .map((c: unknown) => mapCall(c as Record<string, unknown>));

    logger.debug('callsApi', `getList → ${calls.length} llamadas (total: ${inner?.total ?? '?'})`);
    return { calls, total: Number(inner?.total ?? calls.length), showing: calls.length };
  },

  // Verificar grabación — respuesta real: { success, data: { callid, has_recording, date } }
  checkRecording: async (callid: string, date?: string): Promise<RecordingCheck> => {
    const params = date ? { date } : {};
    try {
      const { data } = await apiClient.get(`/recordings/check/${callid}`, { params });
      const inner = data?.data ?? data;
      logger.debug('callsApi', `checkRecording ${callid}: has_recording=${inner?.has_recording}`);
      return {
        callid:        String(inner?.callid ?? callid),
        has_recording: Boolean(inner?.has_recording),
        date:          inner?.date ? String(inner.date) : date,
      };
    } catch (e) {
      logger.warn('callsApi', `checkRecording error para ${callid}`, e);
      return { callid, has_recording: false };
    }
  },
};
