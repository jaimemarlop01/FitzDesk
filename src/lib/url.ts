// Garantiza barra final independientemente de cómo Vite exponga BASE_URL
const RAW = import.meta.env.BASE_URL; // '/FitzDesk' o '/FitzDesk/'
export const base = RAW.endsWith('/') ? RAW : RAW + '/'; // siempre '/FitzDesk/'

// Rutas de página (sin extensión de archivo) vs. recursos estáticos reales
// (imágenes, etc.) — un archivo como foo.webp no tiene "variante con barra"
// en GitHub Pages, solo las rutas de página (que en la build de Astro son
// siempre foo/index.html) la necesitan para evitar el 301.
const HAS_FILE_EXTENSION = /\.[a-z0-9]+$/i;

export function u(path: string): string {
  if (path === '/') return base;
  const clean = path.startsWith('/') ? path.slice(1) : path;

  if (HAS_FILE_EXTENSION.test(clean)) {
    return base + clean;
  }

  // GitHub Pages siempre devuelve 200 en la versión con barra final y 301
  // en la versión sin barra para rutas de página (confirmado en vivo el
  // 2026-06-25) — sin esto, cada enlace interno pasaba por una redirección
  // innecesaria antes de llegar a la página real. Bug relacionado, corregido
  // el mismo día: esta misma normalización rompía las URLs de imágenes
  // (".webp/" no existe como archivo) — de ahí el filtro de extensión arriba.
  const withSlash = clean.endsWith('/') ? clean : `${clean}/`;
  return base + withSlash;
}
