/**
 * FitzDesk Guide Images — DALL-E 3 Generator
 *
 * Genera ilustraciones cartoon para las 3 guías de compra usando DALL-E 3.
 * Requiere OPENAI_API_KEY en fitzdesk-guide-images/.env
 *
 * Uso:
 *   node generateDalleImages.js                                    # las 3 guías
 *   node generateDalleImages.js --guide mejor-setup-...-2026      # solo una
 */

import 'dotenv/config';
import sharp from 'sharp';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

import { GUIDES } from './guides.js';
import { generateWithDalle } from './dalleGenerator.js';

const __dirname   = dirname(fileURLToPath(import.meta.url));
const OUT_DIR     = resolve(__dirname, '../public/images/articulos');
const CONTENT_DIR = resolve(__dirname, '../src/content/articulos');

// ─── Frontmatter ─────────────────────────────────────────────────────────────

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
    console.log('   ✓ Frontmatter actualizado');
  }
}

// ─── Procesado con Sharp ──────────────────────────────────────────────────────

async function saveImages(buffer, slug) {
  const mainPath  = join(OUT_DIR, `${slug}.webp`);
  const thumbPath = join(OUT_DIR, `${slug}-thumb.webp`);

  console.log('   🔧 Procesando con Sharp (WebP + thumbnail)...');

  // Imagen principal 1200×675 (cover centrado desde 1792×1024)
  await sharp(buffer)
    .resize(1200, 675, { fit: 'cover', position: 'centre' })
    .webp({ quality: 90 })
    .toFile(mainPath);

  // Thumbnail 400×225
  await sharp(buffer)
    .resize(400, 225, { fit: 'cover', position: 'centre' })
    .webp({ quality: 85 })
    .toFile(thumbPath);

  console.log(`   ✓ Guardada en /public/images/articulos/${slug}.webp`);
  console.log(`   ✓ Thumbnail:  /public/images/articulos/${slug}-thumb.webp`);
}

// ─── Generar una guía ─────────────────────────────────────────────────────────

async function generateGuide(guide) {
  console.log(`\n🎨 Generando imagen para: ${guide.titulo}...`);

  if (!guide.dallePrompt) {
    console.warn(`   ⚠️  Sin dallePrompt en guides.js para "${guide.slug}"`);
    return false;
  }

  const buffer = await generateWithDalle(guide.dallePrompt, guide.slug);
  await saveImages(buffer, guide.slug);
  updateFrontmatter(guide.slug, `/images/articulos/${guide.slug}.webp`);

  return true;
}

// ─── Entrada principal ────────────────────────────────────────────────────────

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

  for (let i = 0; i < guides.length; i++) {
    try {
      const success = await generateGuide(guides[i]);
      if (success) ok++;
    } catch (e) {
      console.error(`   ❌ Error: ${e.message}`);
    }

    // Pausa entre llamadas a la API
    if (i < guides.length - 1) {
      console.log('\n   ⏸️  Pausa de 3 segundos...');
      await new Promise(r => setTimeout(r, 3000));
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const cost    = (ok * 0.08).toFixed(2); // HD 1792×1024 ≈ $0.08/imagen

  console.log(`\n${'─'.repeat(42)}`);
  console.log('RESUMEN FINAL:');
  console.log(`   Imágenes generadas:        ${ok}/${guides.length}`);
  console.log(`   Thumbnails generados:      ${ok}/${guides.length}`);
  console.log(`   Frontmatters actualizados: ${ok}/${guides.length}`);
  console.log(`   Coste aproximado API:      ~$${cost}`);
  console.log(`   Tiempo total:              ${elapsed}s`);
  console.log('─'.repeat(42));
  console.log('\n💡 Recuerda hacer: npm run build (en FitzDesk/) para ver los cambios.');
}

main().catch(e => {
  console.error('Error crítico:', e.message);
  process.exit(1);
});
