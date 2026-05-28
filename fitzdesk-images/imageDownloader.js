/**
 * FitzDesk Image Downloader
 * Uso: node imageDownloader.js [--single <slug>]
 */

import { existsSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

import { PRODUCTS } from './products.js';
import { processImage, copyImages } from './imageProcessor.js';
import { updateFrontmatter } from './frontmatterUpdater.js';
import { logOk, logWarn, logErr, logInfo, logSection, printSummary } from './logger.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR   = resolve(__dirname, '../public/images/articulos');

const BROWSER_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const TIMEOUT_MS = 12000;

// ─────────────────────────────────────────────
// Utilidades HTTP
// ─────────────────────────────────────────────

function buildHeaders(referer) {
  return {
    'User-Agent':      BROWSER_UA,
    'Accept':          'image/webp,image/avif,image/png,image/jpeg,image/*,*/*;q=0.8',
    'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
    'Cache-Control':   'no-cache',
    ...(referer ? { Referer: referer } : {}),
  };
}

async function fetchWithTimeout(url, headers) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { headers, signal: ctrl.signal });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

function detectExtension(contentType = '', url = '') {
  if (contentType.includes('png'))  return '.png';
  if (contentType.includes('webp')) return '.webp';
  if (contentType.includes('gif'))  return '.gif';
  if (url.endsWith('.png'))  return '.png';
  if (url.endsWith('.webp')) return '.webp';
  if (url.endsWith('.gif'))  return '.gif';
  return '.jpg';
}

// ─────────────────────────────────────────────
// Extracción de og:image de una página HTML
// ─────────────────────────────────────────────

async function extractOgImage(pageUrl, referer) {
  logInfo(`Extrayendo og:image de ${pageUrl}`);
  try {
    const res = await fetchWithTimeout(pageUrl, {
      ...buildHeaders(referer),
      Accept: 'text/html,application/xhtml+xml,*/*;q=0.8',
    });
    if (!res.ok) return null;
    const html = await res.text();

    const patterns = [
      /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
      /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i,
    ];
    for (const p of patterns) {
      const m = html.match(p);
      if (m?.[1] && m[1].startsWith('http')) return m[1];
    }
  } catch (e) {
    logInfo(`Error al cargar página: ${e.message}`);
  }
  return null;
}

// ─────────────────────────────────────────────
// Descargar imagen de una URL
// ─────────────────────────────────────────────

async function downloadImageUrl(url, referer) {
  logInfo(`Descargando: ${url.slice(0, 80)}`);
  try {
    const res = await fetchWithTimeout(url, buildHeaders(referer));
    if (!res.ok) {
      logInfo(`HTTP ${res.status} en ${url.slice(0, 60)}`);
      return null;
    }
    const ct = res.headers.get('content-type') ?? '';
    if (!ct.includes('image') && !ct.includes('octet-stream')) {
      logInfo(`Tipo no esperado: ${ct}`);
      return null;
    }
    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length < 2000) {
      logInfo(`Imagen demasiado pequeña (${buffer.length} bytes), descartada`);
      return null;
    }
    const ext = detectExtension(ct, url);
    return { buffer, ext };
  } catch (e) {
    logInfo(`Error: ${e.message}`);
    return null;
  }
}

// ─────────────────────────────────────────────
// Procesar un producto individual
// ─────────────────────────────────────────────

async function handleProduct(product) {
  logSection(product.name);

  // ── CASO: alias de otro producto ──
  if (product.aliasOf) {
    logInfo(`Alias de: ${product.aliasOf}`);
    copyImages(product.aliasOf, product.slug, OUT_DIR);
    updateFrontmatter(product.slug, `/images/articulos/${product.slug}.webp`);
    logOk(product.slug, `alias de ${product.aliasOf}`);
    return;
  }

  let downloaded = null;
  let source = '';

  // ── INTENTO 1: URL oficial del fabricante ──
  if (product.officialUrl) {
    downloaded = await downloadImageUrl(product.officialUrl, product.referer);
    if (downloaded) source = 'URL oficial';
  }

  // ── INTENTO 2: og:image de la página del fabricante ──
  if (!downloaded && product.fallbackUrl) {
    const ogUrl = await extractOgImage(product.fallbackUrl, product.referer);
    if (ogUrl) {
      downloaded = await downloadImageUrl(ogUrl, product.referer);
      if (downloaded) source = `og:image de ${new URL(product.fallbackUrl).hostname}`;
    }
  }

  // ── Sin imagen: registrar para descarga manual ──
  if (!downloaded) {
    logWarn(product.slug, `Buscar en press kit de ${product.brand ?? 'fabricante'}`);
    return;
  }

  // ── Procesar y guardar ──
  try {
    const paths = await processImage(downloaded.buffer, product.slug, OUT_DIR, downloaded.ext);
    updateFrontmatter(product.slug, paths.main);
    logOk(product.slug, source);
  } catch (e) {
    logErr(product.slug, `Error al procesar imagen: ${e.message}`);
  }
}

// ─────────────────────────────────────────────
// Entrada principal
// ─────────────────────────────────────────────

async function main() {
  const startTime = Date.now();

  // Crear directorio de salida
  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });
  logInfo(`Directorio de imágenes: ${OUT_DIR}`);

  // Filtrar por --single si se especifica
  const singleIdx = process.argv.indexOf('--single');
  const singleSlug = singleIdx !== -1 ? process.argv[singleIdx + 1] : null;

  let products = PRODUCTS;
  if (singleSlug) {
    products = PRODUCTS.filter(p => p.slug === singleSlug);
    if (products.length === 0) {
      console.error(`❌ Slug no encontrado en products.js: ${singleSlug}`);
      process.exit(1);
    }
  }

  // Procesar primero los productos con imagen propia, luego los alias
  const withImage = products.filter(p => !p.aliasOf);
  const aliases   = products.filter(p =>  p.aliasOf);

  for (const p of withImage) {
    await handleProduct(p);
    await new Promise(r => setTimeout(r, 800)); // pausa entre descargas
  }

  for (const p of aliases) {
    await handleProduct(p);
  }

  printSummary(startTime);
}

main().catch(err => {
  console.error('Error crítico:', err);
  process.exit(1);
});
