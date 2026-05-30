import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../services/dashboardApi';
import { todayStr } from '../lib/dateHelpers';

// Datos principales: today, yesterday, week, queues, agents
export function useDashboardSummary() {
  return useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn:  dashboardApi.getSummary,
    refetchInterval: 30_000,
    staleTime: 20_000,
  });
}

// KPIs detallados + hourly_distribution + top_agent + trends
export function useDashboardEjecutivo() {
  const today = todayStr();
  return useQuery({
    queryKey: ['dashboard', 'ejecutivo', today],
    queryFn:  () => dashboardApi.getEjecutivo(today),
    refetchInterval: 60_000,
    staleTime: 50_000,
    retry: 1,
  });
}

// Re-exports para compatibilidad con componentes anteriores
export function useRealtimeQueues() {
  const { data, ...rest } = useDashboardSummary();
  return { data: data?.queues ?? [], ...rest };
}

export function useRealtimeAgents() {
  const { data, ...rest } = useDashboardSummary();
  return { data: data?.agents ?? [], ...rest };
}

export function useHourlyDistribution() {
  const { data, ...rest } = useDashboardEjecutivo();
  return { data: data?.hourly_distribution ?? [], ...rest };
}
