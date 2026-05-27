// Garantiza barra final independientemente de cómo Vite exponga BASE_URL
const RAW = import.meta.env.BASE_URL; // '/FitzDesk' o '/FitzDesk/'
export const base = RAW.endsWith('/') ? RAW : RAW + '/'; // siempre '/FitzDesk/'

export function u(path: string): string {
  if (path === '/') return base;
  const clean = path.startsWith('/') ? path.slice(1) : path;
  return base + clean;
}
