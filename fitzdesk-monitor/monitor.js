import 'dotenv/config';
import Parser from 'rss-parser';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import cron from 'node-cron';

import { SOURCES, passesStrictFilter } from './sources.js';
import { isProcessed, markProcessed, getCacheStats } from './cache.js';
import { generateDraft } from './analyzer.js';
import { logInfo, logSuccess, logWarn, logError, notifyDraft, notifySummary, notifyDailySummary } from './notifier.js';
import { findProductImage, downloadProductImage } from './imageSearch.js';
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
  const errors      = [];
  const productos   = [];

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
      const id = itemId(item);
      if (isProcessed(id)) continue;

      // ── Capa 1: filtro estricto por palabras clave ──
      if (!passesStrictFilter(item)) {
        markProcessed(id);
        totalDiscard++;
        continue;
      }

      logInfo(`  → Candidato: "${item.title}"`);

      // ── Capa 2: verificación con Gemini ──
      const review = await verifyWithGemini({
        title: item.title ?? '',
        description: item.contentSnippet ?? item.content ?? '',
      });

      if (!review.relevante) {
        logInfo(`  ✗ Descartado por Gemini: ${review.motivo}`);
        markProcessed(id);
        totalDiscard++;
        continue;
      }

      totalRelevant++;
      logInfo(`  ✓ Relevante: "${item.title}" [${review.categoria ?? '?'}]`);
      if (review.producto) productos.push(review.producto);

      if (!process.env.GROQ_API_KEY) {
        logWarn('GROQ_API_KEY no configurada — saltando generación de borrador');
        markProcessed(id);
        continue;
      }

      // ── Buscar imagen del producto ──
      const imageUrl = await findProductImage(item);

      try {
        const result = await generateDraft({
          title:       item.title ?? 'Sin título',
          description: item.contentSnippet ?? item.content ?? '',
          link:        item.link ?? '',
          source:      source.name,
          categoria:   review.categoria ?? null,
        });

        if (result) {
          // Descargar imagen y actualizar frontmatter
          let localImagePath = null;
          if (imageUrl) {
            const img = await downloadProductImage(imageUrl, result.slug);
            if (img) {
              localImagePath = img.localPath;
              result.content = result.content.replace(
                /imagen: "\/images\/[^"]+"/,
                `imagen: "${img.localPath}"`
              );
            }
          }

          const filename = `borrador-${result.slug}.md`;
          const filePath = saveDraft(filename, result.content);
          markProcessed(id);
          totalDrafts++;

          await notifyDraft({
            title:       item.title,
            slug:        result.slug,
            source:      source.name,
            filePath,
            categoria:   result.categoria,
            description: item.contentSnippet ?? item.content ?? '',
            imageUrl,        // URL remota para el embed de Discord
            articleUrl:  item.link,
          });
        } else {
          markProcessed(id);
        }
      } catch (err) {
        logError(`Error generando borrador para "${item.title}": ${err.message}`);
        markProcessed(id);
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
const isOnce   = args.includes('--once') || !isDaemon;

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
