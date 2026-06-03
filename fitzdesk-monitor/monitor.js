import 'dotenv/config';
import Parser from 'rss-parser';
import { writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import cron from 'node-cron';

import { SOURCES, KEYWORDS_MARCA, passesStrictFilter } from './sources.js';
import { isProcessed, isProcessedByUrl, isProcessedByTitleHash, markProcessed, getCacheStats, normalizeUrl, hashTitle } from './cache.js';
import { generateDraft, searchPcComponentes } from './analyzer.js';
import { logInfo, logSuccess, logWarn, logError, notifyDraft, notifySummary, notifyDailySummary } from './notifier.js';
import { findProductImage, downloadProductImage } from './imageSearch.js';
import { findAndDownloadImage } from './imageCollector.js';
import { verifyWithGemini } from './reviewer.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const parser = new Parser({
  timeout: 10000,
  headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FitzDesk-Monitor/1.0; RSS reader)' },
  customFields: {
    item: [
      ['media:content', 'media:content', { keepArray: false }],
      ['media:thumbnail', 'media:thumbnail', { keepArray: false }],
    ],
  },
});

const CONTENT_PATH = resolve(
  __dirname,
  process.env.ASTRO_CONTENT_PATH ?? '../src/content/articulos'
);
const HOURS = parseInt(process.env.CHECK_INTERVAL_HOURS ?? '24', 10);

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function itemId(item) {
  return item.guid ?? item.link ?? item.title ?? String(Date.now());
}

function isRecent(item, hours = 24) {
  const date = item.pubDate ? new Date(item.pubDate) : null;
  if (!date || isNaN(date)) return true;
  return date > new Date(Date.now() - hours * 60 * 60 * 1000);
}

function saveDraft(filename, content) {
  if (!existsSync(CONTENT_PATH)) mkdirSync(CONTENT_PATH, { recursive: true });
  const filePath = join(CONTENT_PATH, filename);
  writeFileSync(filePath, content, 'utf-8');
  return filePath;
}

/** Detecta qué marca de KEYWORDS_MARCA aparece en un texto */
function detectBrand(text) {
  const t = text.toLowerCase();
  return KEYWORDS_MARCA.find(m => t.includes(m)) ?? null;
}

/**
 * Busca en src/content/articulos/ si ya existe un artículo publicado
 * cuyo slug comparte ≥2 palabras significativas con el slug del borrador.
 */
function findExistingArticle(slug) {
  try {
    const words = slug.split('-').filter(w => w.length > 3);
    const files = readdirSync(CONTENT_PATH);
    for (const file of files) {
      if (file.startsWith('borrador-')) continue;
      const matches = words.filter(w => file.includes(w));
      if (matches.length >= 2) return file;
    }
  } catch {}
  return null;
}

/** Añade aviso de posible duplicado al inicio del cuerpo del borrador */
function addDuplicateWarning(content, existingFile) {
  const warning = `\n> ⚠️ **POSIBLE DUPLICADO**: Ya existe un artículo sobre este producto. Revisa antes de publicar: \`${existingFile}\`\n`;
  // Insertar después del bloque frontmatter (después del segundo ---)
  const openEnd   = content.indexOf('\n', 3);
  const closeIdx  = content.indexOf('\n---\n', openEnd);
  if (closeIdx === -1) return warning + content;
  const insertPos = closeIdx + 5;
  return content.slice(0, insertPos) + warning + content.slice(insertPos);
}

// ─────────────────────────────────────────────
// Ciclo principal
// ─────────────────────────────────────────────

async function runCheck() {
  logInfo('━━━ Iniciando comprobación de novedades ━━━');
  logInfo(`Fuentes: ${SOURCES.filter(s => s.enabled).length} | Caché: ${getCacheStats().total} entradas`);

  let totalScanned  = 0;
  let totalRelevant = 0;
  let totalDrafts   = 0;
  let totalDiscard  = 0;
  const errors    = [];
  const productos = []; // [{brand, title, categoria}]

  for (const source of SOURCES.filter(s => s.enabled)) {
    logInfo(`Leyendo feed: ${source.name}`);
    let feed;

    try {
      feed = await parser.parseURL(source.url);
    } catch (err) {
      logWarn(`No se pudo leer ${source.name}: ${err.message}`);
      errors.push(source.name);
      continue;
    }

    const recentItems = feed.items.filter(item => isRecent(item, HOURS));
    logInfo(`  ${recentItems.length} artículos en las últimas ${HOURS}h`);
    totalScanned += recentItems.length;

    for (const item of recentItems) {
      const id        = itemId(item);
      const itemUrl   = item.link ?? '';
      const itemTitle = item.title ?? '';
      const titleHash = hashTitle(itemTitle);

      // ── Deduplicación: GUID/link ya procesado ──
      if (isProcessed(id)) continue;

      // ── Deduplicación: URL normalizada ya procesada (CAMBIO 2) ──
      if (itemUrl && isProcessedByUrl(itemUrl)) {
        logInfo(`  ⟳ Duplicado ignorado: "${itemTitle}" (URL ya procesada)`);
        markProcessed(id, { url: itemUrl, titleHash });
        continue;
      }

      // ── Deduplicación: hash de título ya procesado (CAMBIO 6) ──
      if (isProcessedByTitleHash(titleHash)) {
        logInfo(`  ⟳ Artículo actualizado ignorado: "${itemTitle}" (mismo contenido, URL diferente)`);
        markProcessed(id, { url: itemUrl, titleHash });
        totalDiscard++;
        continue;
      }

      // ── Capa 1: filtro estricto por palabras clave ──
      if (!passesStrictFilter(item)) {
        markProcessed(id, { url: itemUrl, titleHash });
        totalDiscard++;
        continue;
      }

      logInfo(`  → Candidato: "${itemTitle}"`);

      // ── Capa 2: verificación con Gemini ──
      const review = await verifyWithGemini({
        title:       itemTitle,
        description: item.contentSnippet ?? item.content ?? '',
      });

      if (!review.relevante) {
        logInfo(`  ✗ Descartado por Gemini: ${review.motivo}`);
        markProcessed(id, { url: itemUrl, titleHash });
        totalDiscard++;
        continue;
      }

      totalRelevant++;
      logInfo(`  ✓ Relevante: "${itemTitle}" [${review.categoria ?? '?'}]`);

      if (review.producto) {
        productos.push({
          brand:    detectBrand(review.producto) ?? detectBrand(itemTitle),
          title:    itemTitle,
          categoria: review.categoria ?? 'general',
        });
      }

      if (!process.env.GROQ_API_KEY) {
        logWarn('GROQ_API_KEY no configurada — saltando generación de borrador');
        markProcessed(id, { url: itemUrl, titleHash });
        continue;
      }

      // ── Buscar imagen del producto ──
      const imageUrl = await findProductImage(item);

      try {
        const result = await generateDraft({
          title:       itemTitle,
          description: item.contentSnippet ?? item.content ?? '',
          link:        itemUrl,
          source:      source.name,
          categoria:   review.categoria ?? null,
        });

        if (result) {
          // ── Descargar imagen: RSS → fallback imageCollector ──
          let imagePath = null;
          if (imageUrl) {
            const img = await downloadProductImage(imageUrl, result.slug);
            imagePath = img?.localPath ?? null;
          }
          if (!imagePath) {
            logInfo(`  🔍 Sin imagen RSS — buscando via imageCollector...`);
            const collected = await findAndDownloadImage(itemTitle, result.slug, '');
            if (collected) {
              imagePath = collected.main;
              logInfo(`  📸 Imagen obtenida via ${collected.method}`);
            }
          }
          if (imagePath) {
            result.content = result.content.replace(
              /imagen: "\/images\/[^"]+"/,
              `imagen: "${imagePath}"`
            );
          }

          // ── Aviso de posible duplicado (CAMBIO 3) ──
          const existingFile  = findExistingArticle(result.slug);
          if (existingFile) {
            logWarn(`  ⚠️ POSIBLE DUPLICADO: ya existe ${existingFile}`);
            result.content = addDuplicateWarning(result.content, existingFile);
          }

          const filename = `borrador-${result.slug}.md`;
          const filePath = saveDraft(filename, result.content);
          markProcessed(id, { url: itemUrl, titleHash });
          totalDrafts++;

          await notifyDraft({
            title:             itemTitle,
            slug:              result.slug,
            source:            source.name,
            filePath,
            categoria:         result.categoria,
            description:       item.contentSnippet ?? item.content ?? '',
            imageUrl,
            articleUrl:        itemUrl,
            possibleDuplicate: existingFile,
            pcPrice:           result.pcPrice,
            pcUrl:             result.pcUrl,
          });
        } else {
          markProcessed(id, { url: itemUrl, titleHash });
        }
      } catch (err) {
        logError(`Error generando borrador para "${itemTitle}": ${err.message}`);
        markProcessed(id, { url: itemUrl, titleHash });
      }

      // Pausa entre llamadas a la API
      await new Promise(r => setTimeout(r, 1500));
    }
  }

  const summary = `━━━ Resumen: ${totalScanned} escaneados, ${totalRelevant} relevantes, ${totalDrafts} borradores, ${totalDiscard} descartados${errors.length ? ` (${errors.length} fuentes con error)` : ''} ━━━`;
  logSuccess(summary);
  await notifySummary({ totalNew: totalRelevant, totalDrafts, errors, totalDiscard });
  return { totalScanned, totalRelevant, totalDrafts, totalDiscard, errors, productos };
}

// ─────────────────────────────────────────────
// Entrada principal
// ─────────────────────────────────────────────

const args = process.argv.slice(2);
const isDaemon = args.includes('--daemon');
const isTest   = args.includes('--test');
const isOnce   = args.includes('--once') || (!isDaemon && !isTest);

if (isTest) {
  const testIdx = args.indexOf('--test');
  const testProduct = (args[testIdx + 1] && !args[testIdx + 1].startsWith('--'))
    ? args[testIdx + 1]
    : 'Logitech MX Master 3S';

  logInfo(`🧪 TEST MODE — Buscando precio en PcComponentes para: "${testProduct}"`);
  const pcResult = await searchPcComponentes(testProduct);

  console.log('\n━━━ Resultado en frontmatter ━━━');
  console.log(`precio: "${pcResult.precio}"`);
  console.log(`enlace_afiliado: "${pcResult.url}"`);
  if (pcResult.found) console.log('precio_encontrado_automaticamente: true');

  console.log('\n━━━ Nota añadida al inicio del borrador ━━━');
  console.log(`> 💰 **Precio detectado automáticamente**: ${pcResult.precio}`);
  console.log(`> 🔗 **Enlace PcComponentes**: ${pcResult.url}`);
  console.log('> ⚠️ Verifica el precio antes de publicar ya que puede haber cambiado desde la generación del borrador.');

  process.exit(0);
}

if (!process.env.GROQ_API_KEY) {
  logWarn('GROQ_API_KEY no configurada. Los borradores no se generarán (solo detección).');
}
if (!process.env.GEMINI_API_KEY) {
  logWarn('GEMINI_API_KEY no configurada. Solo se usará el filtro de palabras clave (Capa 1).');
}

logInfo(`FitzDesk Monitor iniciado — modo: ${isDaemon ? 'daemon' : 'una vez'}`);
logInfo(`Ruta de contenido: ${CONTENT_PATH}`);

if (isOnce) {
  runCheck().catch(err => {
    logError(`Error crítico: ${err.message}`);
    process.exit(1);
  });
}

if (isDaemon) {
  // Comprobación inmediata al arrancar para que Railway no considere el proceso inactivo
  logInfo('Ejecutando comprobación inicial antes de programar el cron...');
  runCheck().catch(err => logError(`Error en comprobación inicial: ${err.message}`));

  const cronExpr = `0 */${HOURS} * * *`;
  logInfo(`Comprobación programada: "${cronExpr}" (cada ${HOURS} horas)`);
  cron.schedule(cronExpr, () => {
    runCheck().catch(err => logError(`Error en ciclo programado: ${err.message}`));
  });

  // Resumen diario a las 9:00 AM
  const dailyHour = parseInt(process.env.DAILY_SUMMARY_HOUR ?? '9', 10);
  logInfo(`Resumen diario programado a las ${dailyHour}:00`);
  cron.schedule(`0 ${dailyHour} * * *`, async () => {
    logInfo('Enviando resumen diario a Discord...');
    try {
      const result = await runCheck();
      await notifyDailySummary(result);
    } catch (err) {
      logError(`Error en resumen diario: ${err.message}`);
    }
  });

  // Keep-alive: log cada 30 minutos para que Railway sepa que el proceso sigue vivo
  cron.schedule('*/30 * * * *', () => {
    logInfo(`Monitor activo — ${new Date().toLocaleString('es-ES')}`);
  });
}
