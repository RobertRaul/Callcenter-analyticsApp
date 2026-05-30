import apiClient from '../lib/apiClient';
import logger from '../lib/logger';
import { todayStr, weekStartStr } from '../lib/dateHelpers';

function unwrap(raw: unknown): unknown {
  if (raw && typeof raw === 'object' && 'data' in (raw as any)) {
    return (raw as any).data;
  }
  return raw;
}

// ─── Tipos exactos ─────────────────────────────────────────────────────────

export interface RankingAgent {
  agent:                    string;
  agent_full:               string;
  total_calls:              number;
  completed_calls:          number;
  total_talk_time:          number;
  total_talk_time_formatted:string;
  avg_talk_time:            number;
  avg_wait_before_answer:   number;
  rank:                     number;
  badge:                    'gold' | 'silver' | 'bronze' | 'star';
  badge_label:              string;
  vs_average:               number;
}

export interface RankingData {
  ranking:    RankingAgent[];
  metric:     string;
  total_agents: number;
  statistics: { total_calls: number; average_calls_per_agent: number };
  period:     { start_date: string; end_date: string };
}

export interface SlaQueue {
  queue_name:     string;
  total_calls:    number;
  answered_calls: number;
  calls_within_sla: number;
  sla_compliance: number;
  avg_wait_time:  number;
  status:         string;
  status_label:   string;
  meets_target:   boolean;
}

export interface SlaRecommendation {
  type:     string;
  priority: string;
  icon:     string;
  message:  string;
  detail:   string;
  action?:  string;
}

export interface SlaData {
  period:      { start_date: string; end_date: string; sla_threshold_seconds: number };
  overall:     { total_calls: number; calls_within_sla: number; sla_compliance: number; meets_target: boolean; target: number };
  sla_by_queue: SlaQueue[];
  daily_trend: { date: string; total_calls: number; sla_compliance: number }[];
  insights:    { queues_meeting_target: number; total_queues: number };
  recommendations: SlaRecommendation[];
}

export interface HourlyPattern {
  hour:           number;
  total_calls:    number;
  answered_calls: number;
  missed_calls:   number;
  avg_duration:   number;
  avg_wait_time:  number;
}

export interface PatronesData {
  peak_hours:      HourlyPattern[];
  abandon_patterns:HourlyPattern[];
  hourly_data:     HourlyPattern[];
  statistics:      { avg_calls_per_hour: number; total_hours_analyzed: number; high_activity_hours: number };
  recommendations: { type: string; priority: string; message: string; detail: string }[];
}

export interface HeatmapDay {
  day:       string;
  day_index: number;
  hours:     { hour: number; total_calls: number; answered_calls: number; missed_calls: number }[];
}

export interface HeatmapData {
  period:         { start_date: string; end_date: string };
  heatmap_matrix: HeatmapDay[];
  statistics:     { max_calls: number; min_calls: number; avg_calls: number; high_demand_threshold: number };
  insights:       { busiest_day: string; quietest_day: string };
}

export interface AbandonoData {
  summary:              { total_calls: number; total_abandoned: number; abandonment_rate: number; avg_wait_time: number };
  hourly_abandonment:   { hour: number; total_calls: number; abandoned_calls: number; abandonment_rate: number; avg_wait_time: number }[];
  top_abandonment_hours:{ hour: number; total_calls: number; abandoned_calls: number; abandonment_rate: number }[];
  queue_abandonment:    { queue_name: string; total_calls: number; abandoned_calls: number; abandonment_rate: number; avg_wait_time: number }[];
  recommendations:      { type: string; priority: string; message: string; detail: string; action?: string }[];
}

// ─── API ──────────────────────────────────────────────────────────────────────

export const analisisApi = {
  getRanking: async (params?: { start_date?: string; end_date?: string; metric?: string }): Promise<RankingData> => {
    const p = { start_date: todayStr(), end_date: todayStr(), metric: 'total_calls', ...params };
    const { data } = await apiClient.get('/analisis/ranking-agentes', { params: p });
    const inner = unwrap(data) as RankingData;
    logger.debug('analisisApi', `ranking: ${inner?.ranking?.length} agentes`);
    return inner;
  },

  getSla: async (params?: { start_date?: string; end_date?: string; sla_threshold?: number }): Promise<SlaData> => {
    const p = { start_date: todayStr(), end_date: todayStr(), ...params };
    const { data } = await apiClient.get('/analisis/sla-cumplimiento', { params: p });
    const inner = unwrap(data) as SlaData;
    logger.debug('analisisApi', `sla: ${inner?.overall?.sla_compliance}%`);
    return inner;
  },

  getPatrones: async (params?: { start_date?: string; end_date?: string }): Promise<PatronesData> => {
    const p = { start_date: todayStr(), end_date: todayStr(), ...params };
    const { data } = await apiClient.get('/analisis/patrones-horarios', { params: p });
    return unwrap(data) as PatronesData;
  },

  getHeatmap: async (params?: { start_date?: string; end_date?: string }): Promise<HeatmapData> => {
    const p = { start_date: weekStartStr(), end_date: todayStr(), ...params };
    const { data } = await apiClient.get('/analisis/mapa-calor-semanal', { params: p });
    return unwrap(data) as HeatmapData;
  },

  getAbandono: async (params?: { start_date?: string; end_date?: string }): Promise<AbandonoData> => {
    const p = { start_date: todayStr(), end_date: todayStr(), ...params };
    const { data } = await apiClient.get('/analisis/analisis-abandono', { params: p });
    return unwrap(data) as AbandonoData;
  },
};
