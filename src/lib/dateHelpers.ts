// Helpers de fecha compartidos (formato YYYY-MM-DD).
// Se evalúan en cada llamada para no quedar obsoletos al cruzar la medianoche.

export function toDateStr(d: Date): string {
  return d.toISOString().split('T')[0];
}

export function todayStr(): string {
  return toDateStr(new Date());
}

export function nDaysAgoStr(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return toDateStr(d);
}

export function yesterdayStr(): string {
  return nDaysAgoStr(1);
}

export function weekStartStr(): string {
  return nDaysAgoStr(6);
}
