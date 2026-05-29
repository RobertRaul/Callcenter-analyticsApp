import { useQuery } from '@tanstack/react-query';
import { analisisApi } from '../services/analisisApi';

const TODAY      = new Date().toISOString().split('T')[0];
const WEEK_START = (() => { const d = new Date(); d.setDate(d.getDate() - 6); return d.toISOString().split('T')[0]; })();

export function useRanking(startDate = TODAY, endDate = TODAY) {
  return useQuery({
    queryKey: ['analisis', 'ranking', startDate, endDate],
    queryFn:  () => analisisApi.getRanking({ start_date: startDate, end_date: endDate }),
    staleTime: 5 * 60_000,
  });
}

export function useSla(startDate = TODAY, endDate = TODAY) {
  return useQuery({
    queryKey: ['analisis', 'sla', startDate, endDate],
    queryFn:  () => analisisApi.getSla({ start_date: startDate, end_date: endDate }),
    staleTime: 5 * 60_000,
  });
}

export function usePatrones(startDate = TODAY, endDate = TODAY) {
  return useQuery({
    queryKey: ['analisis', 'patrones', startDate, endDate],
    queryFn:  () => analisisApi.getPatrones({ start_date: startDate, end_date: endDate }),
    staleTime: 5 * 60_000,
  });
}

export function useHeatmap(startDate = WEEK_START, endDate = TODAY) {
  return useQuery({
    queryKey: ['analisis', 'heatmap', startDate, endDate],
    queryFn:  () => analisisApi.getHeatmap({ start_date: startDate, end_date: endDate }),
    staleTime: 10 * 60_000,
  });
}

export function useAbandono(startDate = TODAY, endDate = TODAY) {
  return useQuery({
    queryKey: ['analisis', 'abandono', startDate, endDate],
    queryFn:  () => analisisApi.getAbandono({ start_date: startDate, end_date: endDate }),
    staleTime: 5 * 60_000,
  });
}
