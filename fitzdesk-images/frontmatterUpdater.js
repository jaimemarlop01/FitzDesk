import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';
import { logInfo } from './logger.js';

const __dirname  = dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = resolve(__dirname, '../src/content/articulos');

/**
 * Actualiza el campo `imagen` del frontmatter de un artículo.
 * Usa sustitución quirúrgica de la línea para no reformatear el YAML entero.
 *
 * @param {string} slug     - Slug del artículo (nombre del .md sin extensión)
 * @param {string} imgPath  - Nueva ruta de imagen (p.ej. /images/articulos/slug.webp)
 */
export function updateFrontmatter(slug, imgPath) {
  const filePath = join(CONTENT_DIR, `${slug}.md`);

  if (!existsSync(filePath)) {
    logInfo(`⚠  Artículo no encontrado: ${filePath}`);
    return false;
  }

  const raw = readFileSync(filePath, 'utf-8');

  // Verificar que el campo imagen existe
  const { data } = matter(raw);
  const previous = data.imagen ?? '(sin imagen)';

  // Sustitución quirúrgica de la línea imagen: "..."
  // Evita reformatear todo el YAML con matter.stringify
  let updated;
  if (/^imagen:/m.test(raw)) {
    updated = raw.replace(/^imagen:.*$/m, `imagen: "${imgPath}"`);
  } else {
    // Si no existe el campo, lo insertamos tras el campo fecha
    updated = raw.replace(/^(fecha:.*)/m, `$1\nimagen: "${imgPath}"`);
  }

  if (updated === raw) {
    logInfo(`Sin cambios en frontmatter: ${slug}`);
    return false;
  }

  writeFileSync(filePath, updated, 'utf-8');
  logInfo(`Frontmatter actualizado: ${previous} → ${imgPath}`);
  return true;
}
