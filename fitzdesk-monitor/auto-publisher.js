#!/usr/bin/env node
/**
 * auto-publisher.js — usado por .github/workflows/publicar-automatico.yml
 *
 * --check   Lee el calendario y determina si hay publicación para hoy.
 *           Escribe outputs en GITHUB_OUTPUT y termina.
 *
 * --process Lee el borrador ya presente en el workspace, valida imagen,
 *           elimina borrador:true, corrige ruta de imagen y renombra el archivo.
 */

import fs   from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const CALENDAR_PATH = path.join(__dirname, 'data', 'calendario-publicaciones.json');
const ARTICLES_DIR  = path.join(__dirname, '..', 'src', 'content', 'articulos');
const IMAGES_DIR    = path.join(__dirname, '..', 'public', 'images', 'articulos');

const mode = process.argv[2];

// Escribe en GITHUB_OUTPUT usando heredoc para tolerar caracteres especiales
function setOutput(name, value) {
  const outputFile = process.env.GITHUB_OUTPUT;
  if (outputFile) {
    fs.appendFileSync(outputFile, `${name}<<GHEOF\n${String(value)}\nGHEOF\n`);
  } else {
    console.log(`[OUTPUT] ${name}=${value}`);
  }
}

// Fecha de hoy en zona Europe/Madrid (YYYY-MM-DD)
function getMadridDate(override) {
  if (override) return override.trim();
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Madrid' });
}

// Devuelve el slug publicado (sin prefijo borrador-)
function publishedSlug(draftSlug) {
  return draftSlug.startsWith('borrador-') ? draftSlug.slice('borrador-'.length) : draftSlug;
}

// ─── MODO --check ─────────────────────────────────────────────────────────────

if (mode === '--check') {
  const today = getMadridDate(process.env.FECHA_OVERRIDE);
  console.log(`Comprobando calendario para: ${today}`);

  if (!fs.existsSync(CALENDAR_PATH)) {
    console.log(`Calendario no encontrado en ${CALENDAR_PATH} — nada que publicar`);
    setOutput('status', 'skip');
    process.exit(0);
  }

  const calendar = JSON.parse(fs.readFileSync(CALENDAR_PATH, 'utf8'));
  const entry    = (calendar.publicaciones || []).find(p => p.fecha === today);

  if (!entry) {
    console.log(`Sin publicación programada para ${today}`);
    setOutput('status', 'skip');
    process.exit(0);
  }

  const pubSlug = publishedSlug(entry.slug);
  console.log(`Publicación encontrada: ${entry.slug} → ${pubSlug}`);

  setOutput('status',         'ready');
  setOutput('draft_slug',     entry.slug);
  setOutput('published_slug', pubSlug);
  setOutput('image_filename', `${pubSlug}.webp`);
  setOutput('titulo',         entry.titulo);
  setOutput('fecha',          entry.fecha);
  process.exit(0);
}

// ─── MODO --process ───────────────────────────────────────────────────────────

if (mode === '--process') {
  const draftSlug = process.env.DRAFT_SLUG;
  const pubSlug   = process.env.PUBLISHED_SLUG;

  if (!draftSlug || !pubSlug) {
    const msg = 'Error interno: faltan DRAFT_SLUG o PUBLISHED_SLUG en el entorno';
    console.error(msg);
    setOutput('ok',        'false');
    setOutput('error_msg', msg);
    process.exit(1);
  }

  const draftFile     = path.join(ARTICLES_DIR, `${draftSlug}.md`);
  const publishedFile = path.join(ARTICLES_DIR, `${pubSlug}.md`);
  const imageFile     = path.join(IMAGES_DIR,   `${pubSlug}.webp`);

  // 1. El archivo borrador debe existir (fue checked-out desde develop)
  if (!fs.existsSync(draftFile)) {
    const msg = `Borrador no encontrado: ${draftSlug}.md`;
    console.error(msg);
    setOutput('ok',        'false');
    setOutput('error_msg', msg);
    process.exit(1);
  }

  let content = fs.readFileSync(draftFile, 'utf8');

  // 2. Debe tener borrador: true
  if (!/^borrador:\s*true/m.test(content)) {
    const msg = `${draftSlug}.md no contiene borrador: true — ¿ya fue publicado?`;
    console.error(msg);
    setOutput('ok',        'false');
    setOutput('error_msg', msg);
    process.exit(1);
  }

  // 3. La imagen debe existir
  if (!fs.existsSync(imageFile)) {
    const msg = `Imagen no encontrada: ${pubSlug}.webp — ejecuta imageCollector.js --slug ${pubSlug} antes de publicar`;
    console.error(msg);
    setOutput('ok',        'false');
    setOutput('error_msg', msg);
    process.exit(1);
  }

  // 4. Bloquear si el frontmatter tiene imagen_placeholder: true
  // Los artículos con placeholder honesto (icono genérico) deben tener
  // este campo para que no se publiquen sin foto real del producto.
  if (/^imagen_placeholder:\s*true/m.test(content)) {
    const msg = `Imagen placeholder pendiente de sustitución en ${pubSlug} — añade una foto real del producto y elimina imagen_placeholder: true del frontmatter`;
    console.error(msg);
    setOutput('ok',        'false');
    setOutput('error_msg', msg);
    process.exit(1);
  }

  // 5. Eliminar borrador: true del frontmatter
  content = content.replace(/^borrador:\s*true[ \t]*\n?/m, '');

  // 6. Corregir ruta de imagen si apunta al nombre con prefijo borrador-
  content = content.replace(
    /^(imagen:\s*["']?\/images\/articulos\/)borrador-/m,
    '$1'
  );

  // 7. Escribir el archivo publicado y eliminar el draft si el nombre cambió
  fs.writeFileSync(publishedFile, content, 'utf8');
  if (draftFile !== publishedFile) {
    fs.unlinkSync(draftFile);
    console.log(`Renombrado: ${draftSlug}.md → ${pubSlug}.md`);
  } else {
    console.log(`Actualizado en su lugar: ${pubSlug}.md`);
  }

  console.log('✅ Borrador procesado correctamente');
  setOutput('ok', 'true');
  process.exit(0);
}

console.error(`Modo desconocido: ${mode}. Usa --check o --process`);
process.exit(1);
