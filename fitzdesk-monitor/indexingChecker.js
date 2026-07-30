/**
 * FitzDesk Indexing Checker
 *
 * Comprueba qué artículos publicados están indexados en Google usando la
 * URL Inspection API de Search Console (de solo lectura: inspecciona el
 * estado, no puede forzar la indexación de una URL concreta).
 *
 * IMPORTANTE — por qué no hay "solicitar indexación" real:
 * La API de Indexación de Google (indexing.googleapis.com) está restringida
 * por los términos de servicio de Google a contenido tipo JobPosting o
 * BroadcastEvent (livestream) — usarla para artículos de blog normales
 * incumple esos términos. La única vía oficial para forzar la indexación de
 * una página normal es el botón "Solicitar indexación" de la interfaz de
 * Search Console (manual, sin API). El antiguo endpoint de ping de sitemaps
 * (google.com/ping?sitemap=) está además deprecado desde 2023 y devuelve 404.
 * Por eso `--fix` reenvía el sitemap vía el método real y soportado
 * `sitemaps.submit` de la propia Search Console API (no la API de
 * Indexación) — es la señal más fuerte que se puede dar a Google por API sin
 * incumplir sus normas — y deja un enlace directo a la herramienta de
 * inspección de Search Console para cada URL no indexada, para que la
 * solicitud manual (la única que realmente fuerza el rastreo) sea de un clic.
 *
 * Modos:
 *   node indexingChecker.js          # comprueba todos los artículos publicados
 *   node indexingChecker.js --fix    # comprueba + reenvía el sitemap si hay pendientes
 */

import 'dotenv/config';
import { google } from 'googleapis';
import matter from 'gray-matter';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname   = dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = resolve(__dirname, '../src/content/articulos');
const SITE_URL     = 'https://fitzdesk.com';
const SITEMAP_URL  = `${SITE_URL}/sitemap-index.xml`;
// Propiedad de Search Console: dominio verificado por DNS (ver CLAUDE.md),
// por eso el formato es "sc-domain:" y no una propiedad de prefijo de URL.
const SC_SITE_URL = process.env.SEARCH_CONSOLE_SITE_URL ?? 'sc-domain:fitzdesk.com';

function logInfo(msg)  { console.log(`ℹ️  ${msg}`); }
function logOk(msg)    { console.log(`✅ ${msg}`); }
function logWarn(msg)  { console.warn(`⚠️  ${msg}`); }
function logError(msg) { console.error(`❌ ${msg}`); }

// ─── Credenciales ─────────────────────────────────────────────────────────────

function loadCredentials() {
  if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    try {
      const json = Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_KEY, 'base64').toString('utf-8');
      return JSON.parse(json);
    } catch (e) {
      throw new Error(`GOOGLE_SERVICE_ACCOUNT_KEY no es un JSON base64 válido: ${e.message}`);
    }
  }

  const localPath = join(__dirname, 'google-credentials.json');
  if (existsSync(localPath)) {
    return JSON.parse(readFileSync(localPath, 'utf-8'));
  }

  return null;
}

async function getSearchConsoleClient() {
  const credentials = loadCredentials();
  if (!credentials) {
    throw new Error(
      'Sin credenciales de Google. Define GOOGLE_SERVICE_ACCOUNT_KEY (JSON de la cuenta ' +
      'de servicio en base64) o crea fitzdesk-monitor/google-credentials.json.\n' +
      '   Recuerda además añadir el email de la cuenta de servicio como usuario en ' +
      'Search Console → Configuración → Usuarios y permisos para la propiedad ' +
      `"${SC_SITE_URL}" — sin ese paso la API devuelve error de permisos aunque las ` +
      'credenciales sean correctas.'
    );
  }

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/webmasters'],
  });

  return google.searchconsole({ version: 'v1', auth });
}

// ─── Artículos publicados ─────────────────────────────────────────────────────

function loadPublishedArticles() {
  const files = readdirSync(CONTENT_DIR).filter(f => f.endsWith('.md') && !f.startsWith('borrador-'));

  return files
    .map(file => {
      const raw = readFileSync(join(CONTENT_DIR, file), 'utf-8');
      const { data } = matter(raw);
      if (data.borrador === true) return null; // por si algún borrador no lleva el prefijo
      const slug = data.slug ?? file.replace('.md', '');
      return { slug, titulo: data.title ?? slug, url: `${SITE_URL}/articulo/${slug}/` };
    })
    .filter(Boolean);
}

// ─── Inspección de una URL ────────────────────────────────────────────────────

const ESTADOS = {
  INDEXADA:    { emoji: '✅', label: 'Indexada' },
  RASTREADA:   { emoji: '⏳', label: 'Rastreada pero no indexada' },
  DESCUBIERTA: { emoji: '❌', label: 'Descubierta pero no indexada' },
  ERROR:       { emoji: '🔴', label: 'Error' },
};

function classify(indexStatusResult) {
  if (!indexStatusResult) return { ...ESTADOS.ERROR, coverageState: 'Sin resultado de inspección' };

  const { verdict, coverageState, lastCrawlTime, robotsTxtState, indexingState } = indexStatusResult;

  if (robotsTxtState === 'DISALLOWED' || indexingState === 'BLOCKED_BY_META_TAG') {
    return { ...ESTADOS.ERROR, coverageState: coverageState ?? 'Bloqueada para rastreo/indexación', lastCrawlTime };
  }
  if (verdict === 'PASS') {
    return { ...ESTADOS.INDEXADA, coverageState, lastCrawlTime };
  }
  if (coverageState?.toLowerCase().includes('crawled') && coverageState?.toLowerCase().includes('not indexed')) {
    return { ...ESTADOS.RASTREADA, coverageState, lastCrawlTime };
  }
  if (coverageState?.toLowerCase().includes('discovered')) {
    return { ...ESTADOS.DESCUBIERTA, coverageState, lastCrawlTime };
  }
  return { ...ESTADOS.ERROR, coverageState: coverageState ?? `verdict: ${verdict ?? 'desconocido'}`, lastCrawlTime };
}

async function inspectUrl(searchconsole, inspectionUrl) {
  try {
    const res = await searchconsole.urlInspection.index.inspect({
      requestBody: { inspectionUrl, siteUrl: SC_SITE_URL },
    });
    const estado = classify(res.data.inspectionResult?.indexStatusResult);
    // El enlace real de inspección lo genera la propia API (con un id opaco
    // que Google asigna en cada inspección) — no se puede construir a mano
    // con la URL del artículo como parámetro. Bug detectado el 2026-06-25:
    // una versión anterior intentaba construirlo así y siempre daba 404.
    estado.inspectionResultLink = res.data.inspectionResult?.inspectionResultLink ?? null;
    return estado;
  } catch (e) {
    const detail = e.response?.data?.error?.message ?? e.message;
    return { ...ESTADOS.ERROR, coverageState: `Error de API: ${detail}`, inspectionResultLink: null };
  }
}

// ─── Reenvío del sitemap (--fix) ──────────────────────────────────────────────

async function resubmitSitemap(searchconsole) {
  try {
    await searchconsole.sitemaps.submit({ siteUrl: SC_SITE_URL, feedpath: SITEMAP_URL });
    logOk(`Sitemap reenviado a Search Console: ${SITEMAP_URL}`);
    return true;
  } catch (e) {
    const detail = e.response?.data?.error?.message ?? e.message;
    logError(`No se pudo reenviar el sitemap: ${detail}`);
    return false;
  }
}

// No existe forma de construir a mano un enlace que abra directamente la
// inspección de una URL concreta — el id de esa vista lo genera Google en
// cada inspección real (ver inspectUrl). Si la API no lo devolvió, la única
// vía fiable es entrar a la herramienta y pegar la URL manualmente.
const MANUAL_TOOL_URL = 'https://search.google.com/search-console/inspect';

function manualActionFor(estado, url) {
  if (estado.inspectionResultLink) return estado.inspectionResultLink;
  return `${MANUAL_TOOL_URL} (selecciona la propiedad y pega esta URL: ${url})`;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const fix = process.argv.includes('--fix');

  console.log('\nFitzDesk Indexing Checker');
  console.log('━'.repeat(60));

  const searchconsole = await getSearchConsoleClient();
  const articles = loadPublishedArticles();
  logInfo(`Artículos publicados a comprobar: ${articles.length}\n`);

  const results = [];

  for (const article of articles) {
    const estado = await inspectUrl(searchconsole, article.url);
    results.push({ ...article, estado });
    console.log(`  ${estado.emoji} ${article.slug} — ${estado.label}`);
    // Cortesía con la API — la cuota de inspección de URL es limitada por minuto.
    await new Promise(r => setTimeout(r, 600));
  }

  const indexadas    = results.filter(r => r.estado.label === ESTADOS.INDEXADA.label);
  const rastreadas   = results.filter(r => r.estado.label === ESTADOS.RASTREADA.label);
  const descubiertas = results.filter(r => r.estado.label === ESTADOS.DESCUBIERTA.label);
  const errores      = results.filter(r => r.estado.label === ESTADOS.ERROR.label);
  const noIndexadas  = [...rastreadas, ...descubiertas, ...errores];

  console.log(`\n${'━'.repeat(60)}`);
  console.log('RESUMEN');
  console.log(`  Total comprobados              : ${results.length}`);
  console.log(`  ✅ Indexados                    : ${indexadas.length}`);
  console.log(`  ⏳ Rastreados, no indexados     : ${rastreadas.length}`);
  console.log(`  ❌ Descubiertos, no indexados   : ${descubiertas.length}`);
  console.log(`  🔴 Con error                    : ${errores.length}`);
  console.log('━'.repeat(60));

  if (noIndexadas.length > 0) {
    console.log('\nArtículos NO indexados:\n');
    for (const r of noIndexadas) {
      console.log(`  ${r.estado.emoji} ${r.titulo}`);
      console.log(`     URL: ${r.url}`);
      console.log(`     Estado Google: ${r.estado.coverageState}`);
      console.log(`     Última inspección: ${r.estado.lastCrawlTime ?? 'sin datos de rastreo todavía'}`);
      console.log(`     Solicitar indexación manual: ${manualActionFor(r.estado, r.url)}`);
      console.log('');
    }
  }

  if (fix) {
    console.log(`${'━'.repeat(60)}`);
    if (noIndexadas.length === 0) {
      logOk('Todo indexado — no hace falta reenviar el sitemap.');
    } else {
      logInfo('Reenviando el sitemap como señal de actualización a Google...');
      await resubmitSitemap(searchconsole);
      logWarn(
        `El reenvío del sitemap NO garantiza una indexación inmediata. Para forzar de ` +
        `verdad cada URL pendiente, usa los enlaces de "Solicitar indexación manual" ` +
        `de arriba en la interfaz de Search Console (límite de Google: unas pocas ` +
        `solicitudes manuales al día por propiedad).`
      );
    }
  }
}

main().catch(e => {
  logError(e.message);
  process.exit(1);
});
