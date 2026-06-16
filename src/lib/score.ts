export function scoreColor(puntuacion: number | null | undefined): string {
  if (puntuacion == null || isNaN(Number(puntuacion))) return 'var(--color-primary)';
  if (puntuacion >= 9)   return 'var(--color-success)';
  if (puntuacion >= 7.5) return 'var(--color-primary)';
  return 'var(--color-error)';
}
