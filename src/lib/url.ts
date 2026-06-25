// Garantiza barra final independientemente de cómo Vite exponga BASE_URL
const RAW = import.meta.env.BASE_URL; // '/FitzDesk' o '/FitzDesk/'
export const base = RAW.endsWith('/') ? RAW : RAW + '/'; // siempre '/FitzDesk/'

export function u(path: string): string {
  if (path === '/') return base;
  const clean = path.startsWith('/') ? path.slice(1) : path;
  // GitHub Pages siempre devuelve 200 en la versión con barra final y 301
  // en la versión sin barra (confirmado en vivo el 2026-06-25 contra varias
  // páginas reales) — sin esto, cada enlace interno del sitio pasaba por una
  // redirección innecesaria antes de llegar a la página real.
  const withSlash = clean.endsWith('/') ? clean : `${clean}/`;
  return base + withSlash;
}
