/// <reference types="jest" />
import { normalizeAgentStatus } from '../dashboardApi';

// No tocamos la red: solo probamos la función pura de normalización.
jest.mock('../../lib/apiClient', () => ({ __esModule: true, default: { get: jest.fn() } }));

describe('normalizeAgentStatus', () => {
  it('mapea estados de disponibilidad', () => {
    ['AVAILABLE', 'FREE', 'IDLE', 'COMPLETEAGENT', 'COMPLETECALLER'].forEach((s) => {
      expect(normalizeAgentStatus(s)).toBe('available');
    });
  });

  it('mapea estados de llamada en curso', () => {
    ['IN_CALL', 'INCALL', 'BUSY', 'ON_CALL', 'CONNECT', 'RINGING'].forEach((s) => {
      expect(normalizeAgentStatus(s)).toBe('on_call');
    });
  });

  it('mapea estados en pausa', () => {
    ['PAUSED', 'PAUSE', 'BREAK'].forEach((s) => {
      expect(normalizeAgentStatus(s)).toBe('paused');
    });
  });

  it('es insensible a mayúsculas/minúsculas', () => {
    expect(normalizeAgentStatus('available')).toBe('available');
    expect(normalizeAgentStatus('In_Call')).toBe('on_call');
  });

  it('cae a "offline" ante valores desconocidos, vacíos o nulos', () => {
    expect(normalizeAgentStatus('CUALQUIER_COSA')).toBe('offline');
    expect(normalizeAgentStatus('')).toBe('offline');
    // @ts-expect-error — probamos robustez ante null en runtime
    expect(normalizeAgentStatus(null)).toBe('offline');
  });
});
