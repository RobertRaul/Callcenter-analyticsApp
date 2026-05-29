import { useQuery } from '@tanstack/react-query';
import { agentsApi, AgentsFilters } from '../services/agentsApi';

const REALTIME_INTERVAL = 30_000;
const STATS_INTERVAL    = 60_000;

export function useRealtimeAgents() {
  return useQuery({
    queryKey: ['agents', 'realtime'],
    queryFn: agentsApi.getRealtime,
    refetchInterval: REALTIME_INTERVAL,
    staleTime: 20_000,
  });
}

export function useAgentStatistics(filters: AgentsFilters = {}) {
  return useQuery({
    queryKey: ['agents', 'statistics', filters],
    queryFn: () => agentsApi.getStatistics(filters),
    refetchInterval: STATS_INTERVAL,
    staleTime: 30_000,
  });
}

export function useAgentComparison(filters: AgentsFilters = {}) {
  return useQuery({
    queryKey: ['agents', 'comparison', filters],
    queryFn: () => agentsApi.getComparison(filters),
    staleTime: 60_000,
  });
}

export function useAgentDetail(agent: string, filters: AgentsFilters = {}) {
  const byQueue = useQuery({
    queryKey: ['agents', 'byQueue', agent, filters],
    queryFn: () => agentsApi.getPerformanceByQueue(agent, filters),
    enabled: !!agent,
    staleTime: 60_000,
  });

  const hourly = useQuery({
    queryKey: ['agents', 'hourly', agent, filters],
    queryFn: () => agentsApi.getHourlyPerformance({ ...filters, agent }),
    enabled: !!agent,
    staleTime: 60_000,
  });

  const history = useQuery({
    queryKey: ['agents', 'history', agent, filters],
    queryFn: () => agentsApi.getCallHistory(agent, filters),
    enabled: !!agent,
    staleTime: 60_000,
  });

  return { byQueue, hourly, history };
}

export function useAgentRanking(filters: AgentsFilters = {}) {
  return useQuery({
    queryKey: ['agents', 'ranking', filters],
    queryFn: () => agentsApi.getRanking(filters),
    staleTime: 2 * 60_000,
  });
}
