// Formateo compartido de valores para UI.

// Segundos → "Xm Ys" (o "Ys"). `empty` es lo que se muestra cuando no hay valor.
// Redondea el total una sola vez para evitar el caso borde "1m 60s".
export function formatDuration(s: number, { empty = '—' }: { empty?: string } = {}): string {
  if (!s || s <= 0) return empty;
  const total = Math.round(s);
  const m = Math.floor(total / 60);
  const sec = total % 60;
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
}
