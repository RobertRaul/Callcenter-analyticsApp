import { useQuery } from '@tanstack/react-query';
import { analisisApi } from '../services/analisisApi';
import { todayStr, weekStartStr } from '../lib/dateHelpers';

export function useRanking(startDate = todayStr(), endDate = todayStr()) {
  return useQuery({
    queryKey: ['analisis', 'ranking', startDate, endDate],
    queryFn:  () => analisisApi.getRanking({ start_date: startDate, end_date: endDate }),
    staleTime: 5 * 60_000,
  });
}

export function useSla(startDate = todayStr(), endDate = todayStr()) {
  return useQuery({
    queryKey: ['analisis', 'sla', startDate, endDate],
    queryFn:  () => analisisApi.getSla({ start_date: startDate, end_date: endDate }),
    staleTime: 5 * 60_000,
  });
}

export function usePatrones(startDate = todayStr(), endDate = todayStr()) {
  return useQuery({
    queryKey: ['analisis', 'patrones', startDate, endDate],
    queryFn:  () => analisisApi.getPatrones({ start_date: startDate, end_date: endDate }),
    staleTime: 5 * 60_000,
  });
}

export function useHeatmap(startDate = weekStartStr(), endDate = todayStr()) {
  return useQuery({
    queryKey: ['analisis', 'heatmap', startDate, endDate],
    queryFn:  () => analisisApi.getHeatmap({ start_date: startDate, end_date: endDate }),
    staleTime: 10 * 60_000,
  });
}

export function useAbandono(startDate = todayStr(), endDate = todayStr()) {
  return useQuery({
    queryKey: ['analisis', 'abandono', startDate, endDate],
    queryFn:  () => analisisApi.getAbandono({ start_date: startDate, end_date: endDate }),
    staleTime: 5 * 60_000,
  });
}
