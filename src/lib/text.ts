// Utilidades de texto compartidas.

// Iniciales (hasta 2) en mayúscula a partir de un nombre. Robusto ante null/vacío.
export function getInitials(name: string): string {
  return (name ?? '').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || '??';
}
