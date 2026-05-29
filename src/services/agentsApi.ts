import apiClient from '../lib/apiClient';
import logger from '../lib/logger';
import { unwrapResponse, extractArray } from '../lib/apiHelpers';

export interface RealtimeAgent {
  agent: string;
  name?: string;
  status: 'available' | 'on_call' | 'paused' | 'offline';
  queue?: string;
  duration?: number;
  last_event?: string;
}

export interface AgentStatistics {
  agent: string;
  name?: string;
  total_calls: number;
  answered_calls: number;
  avg_duration: number;
  avg_wait_time: number;
  occupancy_rate?: number;
}

export interface AgentPerformanceByQueue {
  queue: string;
  total_calls: number;
  answered_calls: number;
  avg_duration: number;
  avg_wait_time: number;
}

export interface AgentHourlyPerformance {
  hour: number;
  total_calls: number;
  answered_calls: number;
  avg_duration: number;
}

export interface AgentCallHistory {
  callid: string;
  src: string;
  dst: string;
  queue: string;
  duration: number;
  billsec: number;
  disposition: string;
  calldate: string;
  wait_time?: number;
}

export interface AgentsFilters {
  start_date?: string;
  end_date?: string;
  queue?: string;
  agent?: string;
}

function normalizeStatus(raw: string): RealtimeAgent['status'] {
  const s = (raw ?? '').toUpperCase();
  if (s === 'AVAILABLE' || s === 'FREE')                              return 'available';
  if (s === 'BUSY' || s === 'INCALL' || s === 'ON_CALL')             return 'on_call';
  if (s === 'PAUSED' || s === 'PAUSE')                               return 'paused';
  if (['COMPLETEAGENT','COMPLETECALLER','ABANDON','EXITEMPTY'].includes(s)) return 'available';
  return 'offline';
}

export const agentsApi = {
  getRealtime: async (): Promise<RealtimeAgent[]> => {
    const { data } = await apiClient.get('/agents/realtime');
    const inner = unwrapResponse(data, 'agentsApi.getRealtime');
    const raw = extractArray<Record<string, unknown>>(inner, ['agents', 'data', 'items'], 'agentsApi.getRealtime');
    return raw.map(a => ({
      agent:      String(a.agent      ?? a.name      ?? ''),
      name:       String(a.agent_full ?? a.agent     ?? a.name ?? ''),
      status:     normalizeStatus(String(a.status ?? 'offline')),
      queue:      String(a.queue      ?? a.queue_name ?? ''),
      duration:   a.duration != null ? Number(a.duration) : undefined,
      last_event: a.last_event ? String(a.last_event) : undefined,
    }));
  },

  getList: async (): Promise<RealtimeAgent[]> => {
    const { data } = await apiClient.get('/agents/list');
    const inner = unwrapResponse(data, 'agentsApi.getList');
    const raw = extractArray<Record<string, unknown>>(inner, ['agents', 'data', 'items'], 'agentsApi.getList');
    return raw.map(a => ({
      agent:  String(a.agent ?? a.name ?? a.id ?? ''),
      name:   String(a.agent_full ?? a.agent ?? a.name ?? ''),
      status: normalizeStatus(String(a.status ?? 'offline')),
      queue:  String(a.queue ?? ''),
    }));
  },

  getStatistics: async (filters: AgentsFilters = {}): Promise<AgentStatistics[]> => {
    const { data } = await apiClient.get('/agents/statistics', { params: filters });
    const inner = unwrapResponse(data, 'agentsApi.getStatistics');
    const raw = extractArray<Record<string, unknown>>(inner, ['agents', 'data', 'items'], 'agentsApi.getStatistics');
    return raw.map(a => ({
      agent:          String(a.agent ?? a.agent_name ?? ''),
      name:           String(a.agent_full ?? a.agent ?? ''),
      total_calls:    Number(a.total_calls ?? 0),
      answered_calls: Number(a.answered_calls ?? a.completed_calls ?? 0),
      avg_duration:   Number(a.avg_duration ?? a.avg_talk_time ?? 0),
      avg_wait_time:  Number(a.avg_wait_time ?? 0),
      occupancy_rate: a.occupancy_rate != null ? Number(a.occupancy_rate) : undefined,
    }));
  },

  getPerformanceByQueue: async (agent: string, filters: AgentsFilters = {}): Promise<AgentPerformanceByQueue[]> => {
    const { data } = await apiClient.get(`/agents/${encodeURIComponent(agent)}/performance-by-queue`, { params: filters });
    const inner = unwrapResponse(data, 'agentsApi.getPerformanceByQueue');
    const raw = extractArray<Record<string, unknown>>(inner, ['queues', 'data', 'items'], 'agentsApi.getPerformanceByQueue');
    return raw.map(q => ({
      queue:          String(q.queue ?? q.queue_name ?? ''),
      total_calls:    Number(q.total_calls ?? 0),
      answered_calls: Number(q.answered_calls ?? 0),
      avg_duration:   Number(q.avg_duration ?? q.avg_talk_time ?? 0),
      avg_wait_time:  Number(q.avg_wait_time ?? 0),
    }));
  },

  getHourlyPerformance: async (filters: AgentsFilters = {}): Promise<AgentHourlyPerformance[]> => {
    const { data } = await apiClient.get('/agents/hourly-performance', { params: filters });
    const inner = unwrapResponse(data, 'agentsApi.getHourlyPerformance');
    const raw = extractArray<Record<string, unknown>>(inner, ['hours', 'data', 'items'], 'agentsApi.getHourlyPerformance');
    return raw.map(h => ({
      hour:           Number(h.hour),
      total_calls:    Number(h.total_calls ?? 0),
      answered_calls: Number(h.answered_calls ?? 0),
      avg_duration:   Number(h.avg_duration ?? h.avg_talk_time ?? 0),
    }));
  },

  getCallHistory: async (agent: string, filters: AgentsFilters = {}): Promise<AgentCallHistory[]> => {
    const { data } = await apiClient.get(`/agents/${encodeURIComponent(agent)}/call-history`, { params: filters });
    const inner = unwrapResponse(data, 'agentsApi.getCallHistory');
    const raw = extractArray<Record<string, unknown>>(inner, ['calls', 'data', 'items'], 'agentsApi.getCallHistory');
    return raw.map((c, i) => ({
      callid:      String(c.callid ?? c.id ?? `h-${i}`),
      src:         String(c.phone_number ?? c.src ?? c.caller ?? ''),
      dst:         String(c.agent_full ?? c.agent ?? c.dst ?? ''),
      queue:       String(c.queuename ?? c.queue ?? ''),
      duration:    Number(c.total_time ?? c.duration ?? 0),
      billsec:     Number(c.talk_time  ?? c.billsec  ?? 0),
      disposition: String(c.status === 'COMPLETED' ? 'ANSWERED' : c.status ?? c.disposition ?? 'UNKNOWN'),
      calldate:    String(c.calldate ?? c.enter_time ?? c.created_at ?? ''),
      wait_time:   c.wait_time != null ? Number(c.wait_time) : undefined,
    }));
  },

  getComparison: async (filters: AgentsFilters = {}) => {
    const { data } = await apiClient.get('/agents/comparison', { params: filters });
    const inner = unwrapResponse(data, 'agentsApi.getComparison');
    return extractArray(inner, ['agents', 'data', 'items'], 'agentsApi.getComparison');
  },

  getRanking: async (filters: AgentsFilters = {}) => {
    const { data } = await apiClient.get('/analisis/ranking-agentes', { params: filters });
    const inner = unwrapResponse(data, 'agentsApi.getRanking');
    return extractArray(inner, ['agents', 'ranking', 'data', 'items'], 'agentsApi.getRanking');
  },
};
