import 'dotenv/config';
import Parser from 'rss-parser';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import cron from 'node-cron';

import { SOURCES, KEYWORDS } from './sources.js';
import { isProcessed, markProcessed, getCacheStats } from './cache.js';
import { generateDraft } from './analyzer.js';
import { logInfo, logSuccess, logWarn, logError, notifyDraft, notifySummary } from './notifier.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const parser = new Parser({ timeout: 10000 });

const CONTENT_PATH = resolve(
  __dirname,
  process.env.ASTRO_CONTENT_PATH ?? '../FitzDesk/src/content/articulos'
);
const HOURS = parseInt(process.env.CHECK_INTERVAL_HOURS ?? '24', 10);

// ─────────────────────────────────────────────
// Relevancia
// ─────────────────────────────────────────────
function isRelevant(item) {
  const text = `${item.title ?? ''} ${item.contentSnippet ?? ''} ${item.content ?? ''}`.toLowerCase();
  return KEYWORDS.some(kw => text.includes(kw.toLowerCase()));
}

function itemId(item) {
  return item.guid ?? item.link ?? item.title ?? String(Date.now());
}

function isRecent(item, hours = 24) {
  const date = item.pubDate ? new Date(item.pubDate) : null;
  if (!date || isNaN(date)) return true; // si no hay fecha, incluir
  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
  return date > cutoff;
}

// ─────────────────────────────────────────────
// Guardar borrador
// ─────────────────────────────────────────────
function saveDraft(filename, content) {
  if (!existsSync(CONTENT_PATH)) {
    mkdirSync(CONTENT_PATH, { recursive: true });
  }
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

  let totalNew = 0;
  let totalDrafts = 0;
  const errors = [];

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

    for (const item of recentItems) {
      const id = itemId(item);

      if (isProcessed(id)) continue;

      if (!isRelevant(item)) {
        markProcessed(id);
        continue;
      }

      totalNew++;
      logInfo(`  → Relevante: "${item.title}"`);

      if (!process.env.GROQ_API_KEY) {
        logWarn('GROQ_API_KEY no configurada — saltando generación de borrador');
        markProcessed(id);
        continue;
      }

      try {
        const result = await generateDraft({
          title: item.title ?? 'Sin título',
          description: item.contentSnippet ?? item.content ?? '',
          link: item.link ?? '',
          source: source.name,
        });

        if (result) {
          const filename = `borrador-${result.slug}.md`;
          const filePath = saveDraft(filename, result.content);
          markProcessed(id);
          totalDrafts++;
          await notifyDraft({
            title: item.title,
            slug: result.slug,
            source: source.name,
            filePath,
            categoria: result.categoria,
            description: item.contentSnippet ?? item.content ?? '',
          });
        } else {
          markProcessed(id);
        }
      } catch (err) {
        logError(`Error generando borrador para "${item.title}": ${err.message}`);
        markProcessed(id);
      }

      // Pausa entre llamadas a la API para no superar rate limits
      await new Promise(r => setTimeout(r, 1500));
    }
  }

  const summary = `━━━ Resumen: ${totalNew} novedades relevantes encontradas, ${totalDrafts} borradores generados${errors.length ? ` (${errors.length} fuentes con error)` : ''} ━━━`;
  logSuccess(summary);
  await notifySummary({ totalNew, totalDrafts, errors });
  return { totalNew, totalDrafts };
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

logInfo(`FitzDesk Monitor iniciado — modo: ${isDaemon ? 'daemon' : 'una vez'}`);
logInfo(`Ruta de contenido: ${CONTENT_PATH}`);

if (isOnce) {
  runCheck().catch(err => {
    logError(`Error crítico: ${err.message}`);
    process.exit(1);
  });
}

if (isDaemon) {
  const cronExpr = `0 */${HOURS} * * *`;
  logInfo(`Programado con cron: "${cronExpr}" (cada ${HOURS} horas)`);
  cron.schedule(cronExpr, () => {
    runCheck().catch(err => logError(`Error en ciclo programado: ${err.message}`));
  });
}
