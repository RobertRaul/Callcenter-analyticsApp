import apiClient from '../lib/apiClient';
import logger from '../lib/logger';
import { normalizeAgentStatus, type AgentStatus } from '../lib/apiHelpers';

// ─── Tipos exactos según respuestas reales ────────────────────────────────────

export interface DayStats {
  total_calls: number;
  answered_calls: number;
  abandoned_calls: number;
  total_duration: number;
  avg_duration: number;
  avg_wait_time: number;
  max_wait_time: number;
  answer_rate: number;
}

export interface QueueRealtime {
  queue_name: string;
  calls_waiting: number;
  available_agents: number;
  calls_completed_5min: number;
  calls_abandoned_5min: number;
  service_level_5min: number;
}

export interface AgentRealtime {
  agent: string;
  status: string;          // "AVAILABLE", "IN_CALL", "PAUSED", "OFFLINE"
  queue: string;
  last_activity: string;
  last_event: string;
}

export interface DashboardSummaryResponse {
  today:     DayStats;
  yesterday: DayStats;
  week:      DayStats;
  queues:    QueueRealtime[];
  agents:    AgentRealtime[];
  timestamp: string;
}

export interface HourlyItem {
  hour: number;
  total_calls: number;
  answered_calls: number;
  missed_calls: number;
  avg_duration: number;
  avg_wait_time: number;
}

export interface PeakHour extends HourlyItem {}

export interface TopAgent {
  agent: string;
  agent_full: string;
  total_calls: number;
  completed_calls: number;
  total_talk_time: number;
  total_talk_time_formatted: string;
  avg_talk_time: number;
  avg_wait_before_answer: number;
}

export interface DashboardEjecutivo {
  date: string;
  kpis: DayStats;
  peak_hour: PeakHour;
  top_agent: TopAgent;
  trends: { calls: number; answer_rate: number };
  hourly_distribution: HourlyItem[];
}

// Status de agente → normalizado (implementación canónica en lib/apiHelpers)
export { normalizeAgentStatus };
export type { AgentStatus };

// ─── API ──────────────────────────────────────────────────────────────────────

export const dashboardApi = {
  // GET /api/dashboard/summary
  // Respuesta: { success, data: { today, yesterday, week, queues, agents } }
  getSummary: async (): Promise<DashboardSummaryResponse> => {
    const { data } = await apiClient.get('/dashboard/summary');
    const inner = data?.data ?? data;
    logger.debug('dashboardApi', 'getSummary:', {
      total: inner?.today?.total_calls,
      answered: inner?.today?.answered_calls,
      agents: inner?.agents?.length,
    });
    return inner as DashboardSummaryResponse;
  },

  // GET /api/analisis/dashboard-ejecutivo
  // Respuesta: { success, data: { kpis, trends, peak_hour, top_agent, hourly_distribution } }
  getEjecutivo: async (targetDate?: string): Promise<DashboardEjecutivo> => {
    const params = targetDate ? { target_date: targetDate } : {};
    const { data } = await apiClient.get('/analisis/dashboard-ejecutivo', { params });
    const inner = data?.data ?? data;
    logger.debug('dashboardApi', 'getEjecutivo:', {
      total: inner?.kpis?.total_calls,
      hourly_count: inner?.hourly_distribution?.length,
    });
    return inner as DashboardEjecutivo;
  },
};
