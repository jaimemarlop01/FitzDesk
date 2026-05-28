import sharp from 'sharp';
import { writeFileSync, copyFileSync, existsSync } from 'fs';
import { join, extname, basename } from 'path';
import { logInfo } from './logger.js';

const W  = 1200;
const H  = 675;
const TW = 400;
const TH = 225;

/**
 * Procesa un buffer de imagen descargada:
 * 1. Guarda el original como backup
 * 2. Genera [slug].webp a 1200×675
 * 3. Genera [slug]-thumb.webp a 400×225
 *
 * @param {Buffer} buffer    - Datos de la imagen descargada
 * @param {string} slug      - Slug del artículo
 * @param {string} outDir    - Directorio de destino (public/images/articulos)
 * @param {string} srcExt    - Extensión original detectada (.jpg/.png/.webp…)
 * @returns {{ main: string, thumb: string, original: string }}
 */
export async function processImage(buffer, slug, outDir, srcExt = '.jpg') {
  const originalPath = join(outDir, `${slug}-original${srcExt}`);
  const mainPath     = join(outDir, `${slug}.webp`);
  const thumbPath    = join(outDir, `${slug}-thumb.webp`);

  // Guardar original como backup
  writeFileSync(originalPath, buffer);

  const img = sharp(buffer);
  const meta = await img.metadata();
  logInfo(`Imagen original: ${meta.width}×${meta.height}px ${meta.format}`);

  // Imagen principal 1200×675 WebP
  await sharp(buffer)
    .resize(W, H, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .webp({ quality: 85 })
    .toFile(mainPath);

  // Thumbnail 400×225 WebP
  await sharp(buffer)
    .resize(TW, TH, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .webp({ quality: 80 })
    .toFile(thumbPath);

  logInfo(`Guardado: ${slug}.webp (${W}×${H}) + ${slug}-thumb.webp (${TW}×${TH})`);

  return {
    main:     `/images/articulos/${slug}.webp`,
    thumb:    `/images/articulos/${slug}-thumb.webp`,
    original: `/images/articulos/${slug}-original${srcExt}`,
  };
}

/**
 * Procesa un archivo de imagen ya descargado en disco.
 * Usado por: node imageProcessor.js --file [slug]
 */
export async function processFile(slug, outDir) {
  const extensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
  for (const ext of extensions) {
    const p = join(outDir, `${slug}-original${ext}`);
    if (existsSync(p)) {
      const { readFileSync } = await import('fs');
      const buffer = readFileSync(p);
      return processImage(buffer, slug, outDir, ext);
    }
  }
  throw new Error(`No se encontró ${slug}-original.[ext] en ${outDir}`);
}

/**
 * Copia las imágenes procesadas de un slug a otro (para guías/alias).
 */
export function copyImages(sourceSlug, targetSlug, outDir) {
  const exts = ['.webp', '-thumb.webp'];
  for (const suffix of exts) {
    const src = join(outDir, `${sourceSlug}${suffix}`);
    const dst = join(outDir, `${targetSlug}${suffix}`);
    if (existsSync(src)) {
      copyFileSync(src, dst);
      logInfo(`Copiado: ${sourceSlug}${suffix} → ${targetSlug}${suffix}`);
    }
  }
}

// ── CLI: node imageProcessor.js --file [slug] ──────────────────────────
if (process.argv[1].endsWith('imageProcessor.js')) {
  const fileIdx = process.argv.indexOf('--file');
  if (fileIdx !== -1) {
    const slug   = process.argv[fileIdx + 1];
    const outDir = new URL('../public/images/articulos', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
    processFile(slug, outDir)
      .then(paths => console.log('✅ Procesado:', paths))
      .catch(err  => { console.error('❌', err.message); process.exit(1); });
  }
}
