/**
 * FitzDesk Guide Image Generator
 * Uso: node generateGuideImages.js [--guide <slug>]
 */

import { createCanvas } from '@napi-rs/canvas';
import sharp from 'sharp';
import { existsSync, mkdirSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';
import { readFileSync, writeFileSync } from 'fs';

import { GUIDES } from './guides.js';
import {
  W, H, BAND_H,
  drawBackground, drawBottomBand, drawFitzSeal, drawFitzLogo,
} from './textRenderer.js';
import { layoutThreeProducts, layoutComparison, layoutThreeProductsPremium } from './composer.js';

const __dirname   = dirname(fileURLToPath(import.meta.url));
const OUT_DIR     = resolve(__dirname, '../public/images/articulos');
const CONTENT_DIR = resolve(__dirname, '../src/content/articulos');

// Actualiza el campo imagen: del frontmatter del artículo
function updateFrontmatter(slug, imgPath) {
  const filePath = join(CONTENT_DIR, `${slug}.md`);
  if (!existsSync(filePath)) {
    console.warn(`   ⚠️  Artículo no encontrado: ${slug}.md`);
    return;
  }
  const raw = readFileSync(filePath, 'utf-8');
  let updated;
  if (/^imagen:/m.test(raw)) {
    updated = raw.replace(/^imagen:.*$/m, `imagen: "${imgPath}"`);
  } else {
    updated = raw.replace(/^(fecha:.*)/m, `$1\nimagen: "${imgPath}"`);
  }
  if (updated !== raw) {
    writeFileSync(filePath, updated, 'utf-8');
    console.log(`   ✓ Frontmatter actualizado → ${imgPath}`);
  }
}

// Genera la imagen compuesta de una guía
async function generateGuide(guide) {
  console.log(`\n── ${guide.slug} ──`);

  const canvas = createCanvas(W, H);
  const ctx    = canvas.getContext('2d');

  // 1. Fondo con textura
  drawBackground(ctx);

  // 2. Layout de productos
  switch (guide.layout) {
    case 'three-products':
      await layoutThreeProducts(ctx, guide);
      break;
    case 'comparison':
      await layoutComparison(ctx, guide);
      break;
    case 'three-products-premium':
      await layoutThreeProductsPremium(ctx, guide);
      break;
    default:
      throw new Error(`Layout desconocido: ${guide.layout}`);
  }

  // 3. Elementos de marca (encima de los productos)
  drawFitzLogo(ctx);
  drawFitzSeal(ctx);
  drawBottomBand(ctx, guide.titulo);

  // 4. Exportar canvas → PNG → WebP
  const pngBuffer = canvas.toBuffer('image/png');

  const mainPath  = join(OUT_DIR, `${guide.slug}.webp`);
  const thumbPath = join(OUT_DIR, `${guide.slug}-thumb.webp`);

  await sharp(pngBuffer).webp({ quality: 90 }).toFile(mainPath);
  await sharp(pngBuffer).resize(400, 225).webp({ quality: 85 }).toFile(thumbPath);

  // 5. Actualizar frontmatter
  updateFrontmatter(guide.slug, `/images/articulos/${guide.slug}.webp`);

  console.log(`✅ ${guide.titulo}`);
  console.log(`   → ${mainPath}`);
  console.log(`   → ${thumbPath}`);
}

// ─── Entrada principal ───────────────────────────────────────────────────────

async function main() {
  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

  const singleIdx  = process.argv.indexOf('--guide');
  const singleSlug = singleIdx !== -1 ? process.argv[singleIdx + 1] : null;

  const guides = singleSlug
    ? GUIDES.filter(g => g.slug === singleSlug)
    : GUIDES;

  if (singleSlug && guides.length === 0) {
    console.error(`❌ Guía no encontrada: ${singleSlug}`);
    process.exit(1);
  }

  const startTime = Date.now();
  let ok = 0;

  for (const guide of guides) {
    try {
      await generateGuide(guide);
      ok++;
    } catch (e) {
      console.error(`❌ Error en ${guide.slug}: ${e.message}`);
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n${'━'.repeat(52)}`);
  console.log('RESUMEN FINAL');
  console.log(`✅ Imágenes generadas:        ${ok}/${guides.length}`);
  console.log(`✅ Thumbnails generados:      ${ok}/${guides.length}`);
  console.log(`✅ Frontmatters actualizados: ${ok}/${guides.length}`);
  console.log(`⏱  Tiempo total:              ${elapsed}s`);
  console.log('━'.repeat(52));
}

main().catch(e => {
  console.error('Error crítico:', e);
  process.exit(1);
});
