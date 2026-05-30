/// <reference types="jest" />
import { callsApi, STATUS_MAP, FILTER_GROUPS } from '../callsApi';

// Mockeamos el cliente HTTP para probar el mapeo sin red real.
jest.mock('../../lib/apiClient', () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));

import apiClient from '../../lib/apiClient';
const mockGet = (apiClient as unknown as { get: jest.Mock }).get;

describe('callsApi.getList — mapeo de llamadas', () => {
  beforeEach(() => mockGet.mockReset());

  it('normaliza una llamada respondida con sus alias', async () => {
    mockGet.mockResolvedValueOnce({
      data: {
        data: {
          total: 1,
          calls: [
            {
              callid: 'c1',
              calldate: '2026-05-29T10:00:00',
              queuename: 'Soporte',
              agent: 'a1',
              agent_full: 'Agente Uno',
              phone_number: '999111222',
              status: 'completed',
              wait_time: 5,
              talk_time: 60,
              total_time: 65,
              has_recording: true,
            },
          ],
        },
      },
    });

    const res = await callsApi.getList({ start_date: '2026-05-29', end_date: '2026-05-29' });

    expect(res.total).toBe(1);
    expect(res.showing).toBe(1);
    const call = res.calls[0];
    expect(call.status).toBe('COMPLETED');
    expect(call.disposition).toBe('ANSWERED');
    // Alias derivados
    expect(call.src).toBe('999111222');
    expect(call.billsec).toBe(60);
    expect(call.duration).toBe(65);
    expect(call.queue).toBe('Soporte');
  });

  it('marca como "NO ANSWER" las llamadas abandonadas', async () => {
    mockGet.mockResolvedValueOnce({
      data: { calls: [{ callid: 'c2', status: 'abandoned', phone_number: '900', talk_time: 0, total_time: 12 }] },
    });

    const res = await callsApi.getList();
    expect(res.calls[0].status).toBe('ABANDONED');
    expect(res.calls[0].disposition).toBe('NO ANSWER');
  });

  it('soporta respuesta como array plano y descarta entradas nulas', async () => {
    mockGet.mockResolvedValueOnce({
      data: [{ callid: 'c3', status: 'completed' }, null, undefined],
    });

    const res = await callsApi.getList();
    expect(res.calls).toHaveLength(1);
    expect(res.calls[0].callid).toBe('c3');
  });

  it('devuelve lista vacía si la respuesta no trae llamadas', async () => {
    mockGet.mockResolvedValueOnce({ data: { data: {} } });
    const res = await callsApi.getList();
    expect(res.calls).toEqual([]);
    expect(res.total).toBe(0);
  });
});

describe('Catálogos de estado', () => {
  it('cada grupo de filtro referencia estados válidos de STATUS_MAP', () => {
    FILTER_GROUPS.forEach((group) => {
      group.apiValues.forEach((value) => {
        expect(STATUS_MAP[value]).toBeDefined();
        expect(STATUS_MAP[value].type).toBe(group.type);
      });
    });
  });
});
