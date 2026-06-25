import 'dotenv/config';
import Parser from 'rss-parser';
import { writeFileSync, readFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import cron from 'node-cron';

import { SOURCES, KEYWORDS_MARCA, passesStrictFilter, diagnoseFilter, detectOferta } from './sources.js';
import { isProcessed, isProcessedByUrl, isProcessedByTitleHash, markProcessed, getCacheStats, normalizeUrl, hashTitle, reloadFromDisk } from './cache.js';
import { generateDraft, searchPcComponentes } from './analyzer.js';
import { buildOfertaDraft } from './offerGenerator.js';
import { createDraft as githubCreateDraft, isAvailable as githubAvailable, downloadCache, uploadCache } from './githubPublisher.js';
import { logInfo, logSuccess, logWarn, logError, notifyDraft, notifySummary, notifyDailySummary, notifyPublicationReminder, notifyLaunchReminder, notifyOferta } from './notifier.js';
import { findProductImage, downloadProductImage } from './imageSearch.js';
import { findAndDownloadImage } from './imageCollector.js';
import { verifyWithGemini } from './reviewer.js';
import { getTokensUsed, isTokenLimitReached, addTokens, DAILY_LIMIT } from './tokenTracker.js';

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
const CACHE_FILE    = join(__dirname, 'data', 'cache.json');
const CALENDAR_FILE = join(__dirname, 'data', 'calendario-publicaciones.json');
const LAUNCHES_FILE = join(__dirname, 'data', 'lanzamientos-pendientes.json');
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
 * Decide si un artículo descartado merece revisión manual.
 * Retorna un string con la sugerencia, o null si no es dudoso.
 */
function isDudoso(itemTitle, diagnosis) {
  if (diagnosis.pass) return null;
  const title = itemTitle.toLowerCase();

  // Descartado por "gaming" pero el título sugiere contexto de trabajo
  if (diagnosis.layer === 1 && diagnosis.reason.includes('"gaming"')) {
    const workHints = ['no gaming', 'para trabajo', 'productividad', 'teletrabajo', 'oficina'];
    const found = workHints.find(h => title.includes(h));
    if (found) return `Descartado por "gaming" pero título dice "${found}" — ¿añadir excepción?`;
  }

  // Auriculares o sillas descartados por Capa 1
  if (diagnosis.layer === 1) {
    const workCats = [
      { kw: 'auricular', label: 'auriculares' },
      { kw: 'headset',   label: 'auriculares' },
      { kw: 'headphone', label: 'auriculares' },
      { kw: 'silla',     label: 'silla de trabajo' },
      { kw: 'chair',     label: 'silla de trabajo' },
    ];
    const cat = workCats.find(c => title.includes(c.kw));
    if (cat) return `${cat.label} descartado por Capa 1 — podría ser válido para teletrabajo`;
  }

  // Marca reconocida descartada por Capa 1
  if (diagnosis.layer === 1) {
    const watchBrands = ['logitech', 'keychron', 'lg ', ' lg,', 'dell', 'asus', 'lenovo', 'corsair'];
    const brand = watchBrands.find(b => title.includes(b));
    if (brand) return `marca "${brand.trim()}" descartada por Capa 1 — revisar manualmente`;
  }

  return null;
}

/**
 * Busca si ya existe un artículo publicado cuyo slug comparte ≥2 palabras
 * significativas con el slug del borrador.
 * En Railway usa la API de GitHub; en local usa el sistema de archivos.
 */
async function findExistingArticle(slug) {
  const words = slug.split('-').filter(w => w.length > 3);
  let files = [];

  if (githubAvailable()) {
    try {
      const owner  = process.env.GITHUB_OWNER  ?? 'jaimemarlop01';
      const repo   = process.env.GITHUB_REPO   ?? 'FitzDesk';
      const branch = process.env.GITHUB_BRANCH ?? 'main';
      const url    = `https://api.github.com/repos/${owner}/${repo}/contents/src/content/articulos?ref=${branch}`;
      const res    = await fetch(url, {
        headers: {
          'Authorization':        `Bearer ${process.env.GITHUB_TOKEN}`,
          'Accept':               'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      });
      if (res.ok) {
        const data = await res.json();
        files = Array.isArray(data) ? data.map(f => f.name) : [];
      }
    } catch { /* si falla, files queda vacío → sin detección de duplicados */ }
  } else {
    try { files = readdirSync(CONTENT_PATH); } catch { /* no hay acceso local */ }
  }

  for (const file of files) {
    if (file.startsWith('borrador-') || !file.endsWith('.md')) continue;
    const matches = words.filter(w => file.includes(w));
    if (matches.length >= 2) return file;
  }
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
// Recordatorios de publicación
// ─────────────────────────────────────────────

async function checkPublicationReminders() {
  if (!existsSync(CALENDAR_FILE)) {
    logInfo('No hay calendario de publicaciones generado. Ejecuta el agente planificar-publicaciones en Claude Code.');
    return;
  }

  let calendar;
  try {
    calendar = JSON.parse(readFileSync(CALENDAR_FILE, 'utf-8'));
  } catch (err) {
    logWarn(`Error leyendo calendario-publicaciones.json: ${err.message}`);
    return;
  }

  const publicaciones = calendar.publicaciones ?? [];
  if (publicaciones.length === 0) {
    logInfo('No hay calendario de publicaciones generado. Ejecuta el agente planificar-publicaciones en Claude Code.');
    return;
  }

  const now  = new Date();
  const today = now.toISOString().slice(0, 10); // YYYY-MM-DD
  const hour  = now.getHours();
  const day   = now.getDay(); // 0=Dom 1=Lun 2=Mar 3=Mié 4=Jue 5=Vie 6=Sáb

  // Solo martes (2), miércoles (3), jueves (4)
  if (![2, 3, 4].includes(day)) return;

  // Solo entre las 9:00 y las 9:59
  if (hour !== 9) return;

  const pub = publicaciones.find(p => p.fecha === today && !p.enviado);
  if (!pub) return;

  await notifyPublicationReminder(pub);

  pub.enviado = true;
  writeFileSync(CALENDAR_FILE, JSON.stringify(calendar, null, 2), 'utf-8');
}

// ─────────────────────────────────────────────
// Seguimiento de lanzamientos pendientes
// ─────────────────────────────────────────────

async function checkLaunchReminders() {
  if (!existsSync(LAUNCHES_FILE)) return;

  let data;
  try {
    data = JSON.parse(readFileSync(LAUNCHES_FILE, 'utf-8'));
  } catch (err) {
    logWarn(`Error leyendo lanzamientos-pendientes.json: ${err.message}`);
    return;
  }

  const lanzamientos = data.lanzamientos ?? [];
  if (lanzamientos.length === 0) return;

  const today = new Date().toISOString().slice(0, 10);
  let changed = false;

  for (const item of lanzamientos) {
    if (item.publicado) continue;
    if (today < item.fecha_seguimiento) continue;

    // No volver a notificar hasta 7 días después de la última notificación
    if (item.notificado && item.fecha_ultima_notificacion) {
      const lastNotif = new Date(item.fecha_ultima_notificacion);
      const daysSince = (Date.now() - lastNotif.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince < 7) continue;
    }

    await notifyLaunchReminder(item);
    item.notificado = true;
    item.fecha_ultima_notificacion = today;
    // Programar próxima revisión en 7 días
    const next = new Date(today);
    next.setDate(next.getDate() + 7);
    item.fecha_seguimiento = next.toISOString().slice(0, 10);
    changed = true;
  }

  if (changed) {
    writeFileSync(LAUNCHES_FILE, JSON.stringify(data, null, 2), 'utf-8');
  }
}

// ─────────────────────────────────────────────
// Ciclo principal
// ─────────────────────────────────────────────

async function runCheck() {
  // Sincronizar caché desde GitHub (Railway tiene disco efímero)
  if (githubAvailable()) {
    const downloaded = await downloadCache(CACHE_FILE);
    if (downloaded) reloadFromDisk();
  }

  logInfo('━━━ Iniciando comprobación de novedades ━━━');
  logInfo(`Tokens Groq hoy: ${getTokensUsed()}/${DAILY_LIMIT} usados`);
  logInfo(`Fuentes: ${SOURCES.filter(s => s.enabled).length} | Caché: ${getCacheStats().total} entradas`);

  let totalScanned    = 0;
  let totalRelevant   = 0;
  let totalDrafts     = 0;
  let totalOfertas    = 0;
  let totalDiscard    = 0;
  let totalCached     = 0;
  let discardLayer1   = 0;
  let discardLayer2   = 0;
  let discardLayer3   = 0;
  let tokenLimitReached = false;
  let pendingSkipped  = 0;
  const errors      = [];
  const productos   = []; // [{brand, title, categoria}]
  const dudosos     = []; // [{title, reason, hint}]
  const draftTitles = []; // titulares de borradores generados en este ciclo

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
      if (isProcessed(id)) { totalCached++; continue; }

      // ── Deduplicación: URL normalizada ya procesada ──
      if (itemUrl && isProcessedByUrl(itemUrl)) {
        logInfo(`  ⟳ Duplicado ignorado: "${itemTitle}" (URL ya procesada)`);
        markProcessed(id, { url: itemUrl, titleHash });
        totalCached++;
        continue;
      }

      // ── Deduplicación: hash de título ya procesado ──
      if (isProcessedByTitleHash(titleHash)) {
        logInfo(`  ⟳ Artículo actualizado ignorado: "${itemTitle}" (mismo contenido, URL diferente)`);
        markProcessed(id, { url: itemUrl, titleHash });
        totalCached++;
        totalDiscard++;
        continue;
      }

      // ── Capas 1-3: filtro estricto con diagnóstico ──
      const diag = diagnoseFilter(item);
      if (!diag.pass) {
        if (diag.layer === 1)      discardLayer1++;
        else if (diag.layer === 2) discardLayer2++;
        else if (diag.layer === 3) discardLayer3++;

        const hint = isDudoso(itemTitle, diag);
        if (hint) dudosos.push({ title: itemTitle, reason: diag.reason, hint });

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

      // ── Control de tokens diarios ──
      if (tokenLimitReached || isTokenLimitReached()) {
        tokenLimitReached = true;
        pendingSkipped++;
        continue; // NO markProcessed — se reintentará en el próximo ciclo
      }

      // ── Capa de detección de ofertas (independiente del análisis normal) ──
      // Reutiliza el producto/categoría ya extraídos por Gemini en vez de
      // duplicar esa extracción — si el item es una oferta, se genera un
      // borrador corto de tipo "oferta" en vez del análisis completo.
      const oferta = detectOferta(item);
      if (oferta.isOferta) {
        logInfo(`  🔥 Oferta detectada: ${oferta.motivo}`);
        try {
          const draft = await buildOfertaDraft({
            producto:        review.producto ?? itemTitle,
            categoria:       review.categoria ?? 'general',
            precio_oferta:   `${oferta.precio}€`,
            descuento:       oferta.descuentoEstimado != null ? `${oferta.descuentoEstimado}%` : undefined,
            fuente:          oferta.fuente,
            enlace_afiliado: '',
            informacion:     item.contentSnippet ?? item.content ?? '',
          });

          const filePath = saveDraft(draft.filename, draft.content);
          addTokens(draft.tokensUsed);

          markProcessed(id, { url: itemUrl, titleHash });
          totalOfertas++;
          draftTitles.push(`🔥 ${itemTitle}`);

          await notifyOferta({
            titulo:               review.producto ?? itemTitle,
            slug:                 draft.slug,
            precio_oferta:        `${oferta.precio}€`,
            descuento:            oferta.descuentoEstimado != null ? `${oferta.descuentoEstimado}%` : undefined,
            fuente:               oferta.fuente,
            analisis_relacionado: draft.related?.slug,
            filePath,
          });
        } catch (ofertaErr) {
          logWarn(`  ✗ Error generando borrador de oferta: ${ofertaErr.message}`);
          markProcessed(id, { url: itemUrl, titleHash });
        }
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

          // ── Aviso de posible duplicado ──
          const existingFile  = await findExistingArticle(result.slug);
          if (existingFile) {
            logWarn(`  ⚠️ POSIBLE DUPLICADO: ya existe ${existingFile}`);
            result.content = addDuplicateWarning(result.content, existingFile);
          }

          addTokens(result.tokensUsed);

          const filename = `borrador-${result.slug}.md`;
          let filePath;
          let usedGitHub = false;

          if (githubAvailable()) {
            // ── Producción (Railway): escribir directo en GitHub ──
            try {
              filePath   = await githubCreateDraft(result.slug, result.content);
              usedGitHub = true;
            } catch (ghErr) {
              logWarn(`⚠️ Error al crear en GitHub: ${ghErr.message} — guardando localmente`);
              filePath = saveDraft(filename, result.content);
            }
          } else {
            // ── Local (desarrollo): escribir en sistema de archivos ──
            filePath = saveDraft(filename, result.content);
          }

          markProcessed(id, { url: itemUrl, titleHash });
          totalDrafts++;
          draftTitles.push(itemTitle);

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
            usedGitHub,
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

  if (pendingSkipped > 0) {
    logWarn(`Límite diario de tokens alcanzado (70.000). Quedan ${pendingSkipped} noticias sin procesar para mañana.`);
  }

  const summary = `━━━ Resumen: ${totalScanned} escaneados, ${totalRelevant} relevantes, ${totalDrafts} borradores, ${totalOfertas} ofertas, ${totalDiscard} descartados${errors.length ? ` (${errors.length} fuentes con error)` : ''} ━━━`;
  logSuccess(summary);

  // Persistir caché en GitHub para que sobreviva reinicios de Railway
  if (githubAvailable()) await uploadCache(CACHE_FILE);

  await notifyDailySummary({ totalScanned, totalRelevant, totalDrafts, totalOfertas, totalDiscard, totalCached, discardLayer1, discardLayer2, discardLayer3, dudosos, draftTitles, errors, productos });
  return { totalScanned, totalRelevant, totalDrafts, totalOfertas, totalDiscard, totalCached, discardLayer1, discardLayer2, discardLayer3, dudosos, draftTitles, errors, productos };
}

// ─────────────────────────────────────────────
// Entrada principal
// ─────────────────────────────────────────────

const args = process.argv.slice(2);
const isDaemon = args.includes('--daemon');
const isTest   = args.includes('--test');
const isOnce   = args.includes('--once') || (!isDaemon && !isTest);

if (isTest) {
  logInfo(`Tokens Groq hoy: ${getTokensUsed()}/${DAILY_LIMIT} usados`);

  // ── Verificar calendario ──
  logInfo('🧪 Verificando sistema de recordatorios de publicación...');
  if (existsSync(CALENDAR_FILE)) {
    try {
      const cal = JSON.parse(readFileSync(CALENDAR_FILE, 'utf-8'));
      const pendientes = (cal.publicaciones ?? []).filter(p => !p.enviado).length;
      logInfo(`✅ Calendario cargado — generado: ${cal.generado} — ${pendientes} publicaciones pendientes`);
    } catch (err) {
      logWarn(`⚠️ calendario-publicaciones.json existe pero no se puede leer: ${err.message}`);
    }
  } else {
    logInfo('ℹ️  No hay calendario de publicaciones. Ejecuta el agente planificar-publicaciones en Claude Code.');
  }

  // ── Dry-run: escanear feeds y diagnosticar descartes ──
  console.log('\n━━━ ESCANEANDO FEEDS — DRY RUN (sin guardar caché ni generar borradores) ━━━\n');

  const rejected = [];
  const passed   = [];
  let totalScanned = 0;
  let totalCached  = 0;

  for (const source of SOURCES.filter(s => s.enabled)) {
    logInfo(`Leyendo feed: ${source.name}`);
    let feed;
    try {
      feed = await parser.parseURL(source.url);
    } catch (err) {
      logWarn(`  No se pudo leer ${source.name}: ${err.message}`);
      continue;
    }

    const recentItems = feed.items.filter(item => isRecent(item, HOURS));
    logInfo(`  ${recentItems.length} artículos en las últimas ${HOURS}h`);
    totalScanned += recentItems.length;

    for (const item of recentItems) {
      const id        = itemId(item);
      const itemUrl   = item.link ?? '';
      const itemTitle = item.title ?? '(sin título)';
      const titleHash = hashTitle(itemTitle);

      // Ya en caché — no es un candidato nuevo
      if (isProcessed(id) || (itemUrl && isProcessedByUrl(itemUrl)) || isProcessedByTitleHash(titleHash)) {
        totalCached++;
        continue;
      }

      const diag = diagnoseFilter(item);
      if (!diag.pass) {
        const hint = isDudoso(itemTitle, diag);
        rejected.push({ title: itemTitle, source: source.name, layer: diag.layer, reason: diag.reason, hint });
      } else {
        passed.push({ title: itemTitle, source: source.name, reason: diag.reason });
      }
    }
  }

  // ── Imprimir descartados ──
  const layerLabel = { 1: 'Descarte obligatorio', 2: 'Sin producto físico', 3: 'Sin marca reconocida' };
  console.log(`━━━ ARTÍCULOS DESCARTADOS POR FILTRO (${rejected.length}) ━━━\n`);
  rejected.forEach((item, i) => {
    const num = String(i + 1).padStart(2, ' ');
    console.log(`${num}. [Capa ${item.layer} — ${layerLabel[item.layer]}]`);
    console.log(`    Titular : "${item.title}"`);
    console.log(`    Motivo  : ${item.reason}`);
    console.log(`    Fuente  : ${item.source}\n`);
  });

  // ── Imprimir los que pasarían ──
  if (passed.length > 0) {
    console.log(`━━━ PASARÍAN EL FILTRO (${passed.length}) ━━━\n`);
    passed.forEach((item, i) => {
      const num = String(i + 1).padStart(2, ' ');
      console.log(` ${num}. "${item.title}"`);
      console.log(`     ${item.reason}`);
      console.log(`     Fuente: ${item.source}\n`);
    });
  }

  // ── Casos dudosos ──
  const testDudosos = rejected.filter(r => r.hint);
  if (testDudosos.length > 0) {
    console.log(`━━━ CASOS DUDOSOS — REVISAR (${testDudosos.length}) ━━━\n`);
    testDudosos.forEach((item, i) => {
      console.log(` ${i + 1}. ⚠️ "${item.title}"`);
      console.log(`    ${item.hint}`);
      console.log(`    Fuente: ${item.source}\n`);
    });
  }

  console.log(`━━━ RESUMEN ━━━`);
  console.log(`Escaneados : ${totalScanned}`);
  console.log(`En caché   : ${totalCached} (ya procesados en ciclos anteriores)`);
  console.log(`Descartados: ${rejected.length}  (Capa 1: ${rejected.filter(r=>r.layer===1).length} · Capa 2: ${rejected.filter(r=>r.layer===2).length} · Capa 3: ${rejected.filter(r=>r.layer===3).length})`);
  console.log(`Dudosos    : ${testDudosos.length}`);
  console.log(`Pasarían   : ${passed.length}`);

  // ── Test precio PcComponentes ──
  const testIdx = args.indexOf('--test');
  const testProduct = (args[testIdx + 1] && !args[testIdx + 1].startsWith('--'))
    ? args[testIdx + 1]
    : 'Logitech MX Master 3S';

  console.log(`\n━━━ TEST PRECIO PcComponentes — "${testProduct}" ━━━`);
  const pcResult = await searchPcComponentes(testProduct);
  console.log(`precio: "${pcResult.precio}"`);
  console.log(`enlace_afiliado: "${pcResult.url}"`);
  if (pcResult.found) console.log('precio_encontrado_automaticamente: true');

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
  runCheck()
    .then(() => process.exit(0))
    .catch(err => {
      logError(`Error crítico: ${err.message}`);
      process.exit(1);
    });
}

if (isDaemon) {
  // Comprobación inmediata al arrancar para que Railway no considere el proceso inactivo
  logInfo('Ejecutando comprobación inicial antes de programar el cron...');
  runCheck().catch(err => logError(`Error en comprobación inicial: ${err.message}`));

  // Recordatorio de publicación al arrancar (por si arranca entre las 9 y las 10)
  checkPublicationReminders().catch(err => logError(`Error en recordatorio de publicación: ${err.message}`));
  checkLaunchReminders().catch(err => logError(`Error en seguimiento de lanzamientos: ${err.message}`));

  const cronExpr = `0 */${HOURS} * * *`;
  logInfo(`Comprobación programada: "${cronExpr}" (cada ${HOURS} horas)`);
  cron.schedule(cronExpr, () => {
    runCheck().catch(err => logError(`Error en ciclo programado: ${err.message}`));
  });

  // Resumen diario a las 9:00 AM — incluye recordatorio de publicación
  const dailyHour = parseInt(process.env.DAILY_SUMMARY_HOUR ?? '9', 10);
  logInfo(`Resumen diario programado a las ${dailyHour}:00`);
  cron.schedule(`0 ${dailyHour} * * *`, async () => {
    logInfo('Enviando resumen diario a Discord...');
    try {
      await runCheck();
    } catch (err) {
      logError(`Error en resumen diario: ${err.message}`);
    }
    // Recordatorio de publicación (si hoy toca y está en el calendario)
    checkPublicationReminders().catch(err => logError(`Error en recordatorio de publicación: ${err.message}`));
    // Seguimiento de lanzamientos pendientes
    checkLaunchReminders().catch(err => logError(`Error en seguimiento de lanzamientos: ${err.message}`));
  });

  // Keep-alive: log cada 30 minutos para que Railway sepa que el proceso sigue vivo
  cron.schedule('*/30 * * * *', () => {
    logInfo(`Monitor activo — ${new Date().toLocaleString('es-ES')}`);
  });
}
