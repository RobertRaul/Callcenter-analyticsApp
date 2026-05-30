import { formatDuration } from '../format';
import { getInitials } from '../text';
import { normalizeAgentStatus } from '../apiHelpers';
import { todayStr, toDateStr, nDaysAgoStr } from '../dateHelpers';

describe('formatDuration', () => {
  it('usa el fallback configurable cuando no hay valor', () => {
    expect(formatDuration(0)).toBe('—');
    expect(formatDuration(0, { empty: '0s' })).toBe('0s');
    expect(formatDuration(-5, { empty: '0s' })).toBe('0s');
  });

  it('formatea segundos y minutos', () => {
    expect(formatDuration(45)).toBe('45s');
    expect(formatDuration(90)).toBe('1m 30s');
    expect(formatDuration(3661)).toBe('61m 1s');
  });

  it('redondea el total y evita el borde "1m 60s"', () => {
    expect(formatDuration(119.6)).toBe('2m 0s');
  });
});

describe('getInitials', () => {
  it('toma hasta 2 iniciales en mayúscula', () => {
    expect(getInitials('Juan Perez')).toBe('JP');
    expect(getInitials('maria elena rojas')).toBe('ME');
    expect(getInitials('Ana')).toBe('A');
  });

  it('cae a "??" ante nombre vacío o nulo', () => {
    expect(getInitials('')).toBe('??');
    // @ts-expect-error — robustez en runtime
    expect(getInitials(null)).toBe('??');
  });
});

describe('normalizeAgentStatus (unión de mapeos)', () => {
  it('disponibles, incluyendo ABANDON/EXITEMPTY/IDLE (antes divergentes)', () => {
    ['AVAILABLE', 'FREE', 'IDLE', 'COMPLETEAGENT', 'COMPLETECALLER', 'ABANDON', 'EXITEMPTY']
      .forEach(s => expect(normalizeAgentStatus(s)).toBe('available'));
  });

  it('en llamada, incluyendo CONNECT/RINGING/IN_CALL', () => {
    ['IN_CALL', 'INCALL', 'BUSY', 'ON_CALL', 'CONNECT', 'RINGING']
      .forEach(s => expect(normalizeAgentStatus(s)).toBe('on_call'));
  });

  it('en pausa, incluyendo BREAK', () => {
    ['PAUSED', 'PAUSE', 'BREAK'].forEach(s => expect(normalizeAgentStatus(s)).toBe('paused'));
  });

  it('offline ante desconocido/vacío', () => {
    expect(normalizeAgentStatus('XYZ')).toBe('offline');
    expect(normalizeAgentStatus('')).toBe('offline');
  });
});

describe('dateHelpers', () => {
  it('devuelve formato YYYY-MM-DD', () => {
    expect(todayStr()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(nDaysAgoStr(7)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('toDateStr es consistente con una fecha dada', () => {
    expect(toDateStr(new Date('2026-05-29T10:00:00Z'))).toBe('2026-05-29');
  });
});
