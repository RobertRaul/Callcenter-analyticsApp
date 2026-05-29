import { useQuery } from '@tanstack/react-query';
import { callsApi, CallsFilters } from '../services/callsApi';

export function useCallsList(filters: CallsFilters = {}) {
  return useQuery({
    queryKey: ['calls', 'list', filters],
    queryFn:  () => callsApi.getList(filters),
    staleTime: 60_000,
    retry: 1,
    enabled: !!(filters.start_date && filters.end_date),
  });
}

export function useRecordingCheck(callid: string, date?: string, enabled = true) {
  return useQuery({
    queryKey: ['recording', 'check', callid, date],
    queryFn:  () => callsApi.checkRecording(callid, date),
    enabled:  enabled && !!callid,
    staleTime: 5 * 60_000,
    retry: false,
  });
}
