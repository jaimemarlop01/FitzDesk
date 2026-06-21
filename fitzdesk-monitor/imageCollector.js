/**
 * FitzDesk Image Collector
 * Busca y descarga la mejor imagen disponible para artículos publicados y borradores.
 *
 * Modos:
 *   node imageCollector.js                   # todos (publicados + borradores)
 *   node imageCollector.js --publicados       # solo artículos publicados
 *   node imageCollector.js --borradores       # solo borradores
 *   node imageCollector.js --slug [slug]      # uno específico (sin .md)
 *   node imageCollector.js --slug [slug] --query "[texto de búsqueda manual]"
 *                                             # sobrescribe el título como término de búsqueda
 */

import 'dotenv/config';
import sharp from 'sharp';
import matter from 'gray-matter';
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname   = dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = resolve(__dirname, '../src/content/articulos');
const IMAGES_DIR  = resolve(__dirname, '../public/images/articulos');
const UA = 'Mozilla/5.0 (compatible; FitzDesk-ImageCollector/1.0)';

function logWarn(msg) { console.warn(`⚠️  ${msg}`); }

// ─── Fabricantes ──────────────────────────────────────────────────────────────

const BRAND_SEARCH_URL = {
  logitech:    q => `https://www.logitech.com/es-es/search?q=${encodeURIComponent(q)}`,
  keychron:    q => `https://www.keychron.com/search?q=${encodeURIComponent(q)}`,
  benq:        q => `https://www.benq.com/es-es/search/?q=${encodeURIComponent(q)}`,
  dell:        q => `https://www.dell.com/es-es/search/${encodeURIComponent(q)}/All`,
  lg:          q => `https://www.lg.com/es/search/?search=${encodeURIComponent(q)}`,
  asus:        q => `https://www.asus.com/es/search?q=${encodeURIComponent(q)}`,
  lenovo:      q => `https://www.lenovo.com/es/es/searchui/pages/?q=${encodeURIComponent(q)}`,
  corsair:     q => `https://www.corsair.com/es/es/s/${encodeURIComponent(q)}`,
  razer:       q => `https://www.razer.com/es-es/search?q=${encodeURIComponent(q)}`,
  samsung:     q => `https://www.samsung.com/es/search/?searchvalue=${encodeURIComponent(q)}`,
  steelseries: q => `https://es.steelseries.com/search#q=${encodeURIComponent(q)}`,
  sandisk:     q => `https://www.westerndigital.com/es-es/search#q=${encodeURIComponent(q)}`,
  adata:       q => `https://www.adata.com/es/search/product?q=${encodeURIComponent(q)}`,
};

const KEYWORDS_MARCA = [
  'logitech', 'keychron', 'benq', 'steelseries', 'corsair', 'razer',
  'jabra', 'bose', 'lg', 'dell', 'samsung', 'asus', 'lenovo',
  'microsoft', 'apple', 'hp', 'adata', 'sandisk', 'seagate',
  'western digital', 'crucial', 'kingston',
];

function detectBrand(text) {
  const t = text.toLowerCase();
  return KEYWORDS_MARCA.find(m => t.includes(m)) ?? null;
}

// ─── HTTP helper: extrae og:image / twitter:image de un HTML ─────────────────

async function fetchOgImage(url, timeout = 7000) {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(timeout),
      headers: { 'User-Agent': UA },
    });
    if (!res.ok) return null;
    const html = await res.text();
    const og = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i)
              ?? html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i)
              ?? html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i)
              ?? html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:image["']/i);
    const imgUrl = og?.[1];
    // Evitar iconos y logos pequeños
    if (imgUrl && !imgUrl.includes('favicon') && !imgUrl.includes('logo') && imgUrl.length > 10) {
      return imgUrl;
    }
  } catch {}
  return null;
}

// ─── FUENTE 1: PcComponentes (página del producto via enlace_afiliado) ────────

async function tryPcComponentes(enlaceAfiliado) {
  if (!enlaceAfiliado || enlaceAfiliado === 'https://www.pccomponentes.com') return null;
  return fetchOgImage(enlaceAfiliado);
}

// ─── FUENTE 2: Página del fabricante ─────────────────────────────────────────

async function tryManufacturer(productName) {
  const brand = detectBrand(productName);
  if (!brand || !BRAND_SEARCH_URL[brand]) return null;
  const searchUrl = BRAND_SEARCH_URL[brand](productName);
  return fetchOgImage(searchUrl, 8000);
}

// ─── FUENTE 3: Bing Image Search API ─────────────────────────────────────────

async function tryBing(query) {
  const key = process.env.BING_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch(
      `https://api.bing.microsoft.com/v7.0/images/search?q=${encodeURIComponent(query + ' product official')}&count=5&minWidth=800&imageType=Photo`,
      {
        headers: { 'Ocp-Apim-Subscription-Key': key },
        signal: AbortSignal.timeout(8000),
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.value?.[0]?.contentUrl ?? null;
  } catch {
    return null;
  }
}

// ─── FUENTE 4: DuckDuckGo (vqd token) ────────────────────────────────────────

async function tryDuckDuckGo(query) {
  try {
    const q = encodeURIComponent(query + ' product photo official');
    // Paso 1: obtener token vqd
    const searchRes = await fetch(
      `https://duckduckgo.com/?q=${q}&iar=images&iax=images&ia=images`,
      { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(8000) }
    );
    if (!searchRes.ok) return null;
    const html   = await searchRes.text();
    const match  = html.match(/vqd=["']?([^"'&\s]+)["']?/);
    if (!match) return null;
    const vqd = match[1];

    // Paso 2: obtener resultados de imágenes
    const imgRes = await fetch(
      `https://duckduckgo.com/i.js?q=${q}&vqd=${vqd}&o=json&p=1&s=0&u=bing&f=,,,,,&l=es-es`,
      {
        headers: { 'User-Agent': UA, 'Referer': 'https://duckduckgo.com' },
        signal: AbortSignal.timeout(8000),
      }
    );
    if (!imgRes.ok) return null;
    const data = await imgRes.json();
    const results = data.results ?? [];
    // Preferir imágenes ≥ 800px de ancho
    const good = results.find(r => r.width >= 800 && r.image);
    return good?.image ?? results[0]?.image ?? null;
  } catch {
    return null;
  }
}

// ─── Descargar imagen como buffer ────────────────────────────────────────────

async function downloadBuffer(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': UA },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const arr = await res.arrayBuffer();
  return Buffer.from(arr);
}

// ─── Procesar y guardar imagen con Sharp ──────────────────────────────────────

async function processAndSave(buffer, slug) {
  if (!existsSync(IMAGES_DIR)) mkdirSync(IMAGES_DIR, { recursive: true });

  const mainPath  = join(IMAGES_DIR, `${slug}.webp`);
  const thumbPath = join(IMAGES_DIR, `${slug}-thumb.webp`);
  const bg        = { r: 255, g: 255, b: 255, alpha: 1 };

  await sharp(buffer)
    .flatten({ background: bg })
    .resize(1200, 675, { fit: 'contain', background: bg })
    .webp({ quality: 90 })
    .toFile(mainPath);

  await sharp(buffer)
    .flatten({ background: bg })
    .resize(400, 225, { fit: 'contain', background: bg })
    .webp({ quality: 85 })
    .toFile(thumbPath);

  return {
    main:  `/images/articulos/${slug}.webp`,
    thumb: `/images/articulos/${slug}-thumb.webp`,
  };
}

// ─── Buscar la mejor imagen disponible ───────────────────────────────────────

/**
 * Exportable: usado también por monitor.js como fallback.
 * @returns {{ url, method } | null}
 */
export async function findImageUrl(productName, enlaceAfiliado = '') {
  let url, method;

  url = await tryPcComponentes(enlaceAfiliado);
  if (url) return { url, method: 'PcComponentes' };

  url = await tryManufacturer(productName);
  if (url) return { url, method: 'fabricante' };

  url = await tryBing(productName);
  if (url) return { url, method: 'Bing' };

  url = await tryDuckDuckGo(productName);
  if (url) return { url, method: 'DuckDuckGo' };

  return null;
}

/**
 * Busca, descarga y procesa la imagen de un producto.
 * Devuelve las rutas locales o null si no se encontró imagen.
 */
export async function findAndDownloadImage(productName, slug, enlaceAfiliado = '') {
  const found = await findImageUrl(productName, enlaceAfiliado);
  if (!found) return null;

  try {
    const buffer = await downloadBuffer(found.url);
    const paths  = await processAndSave(buffer, slug);
    return { ...paths, method: found.method, remoteUrl: found.url };
  } catch (e) {
    logWarn(`Error procesando imagen de ${found.method}: ${e.message}`);
    return null;
  }
}

// ─── Actualizar frontmatter del artículo ──────────────────────────────────────

function setField(content, field, value) {
  const re = new RegExp(`^${field}:.*$`, 'm');
  if (re.test(content)) return content.replace(re, `${field}: "${value}"`);
  const closeIdx = content.indexOf('\n---', 4);
  if (closeIdx === -1) return content;
  return content.slice(0, closeIdx) + `\n${field}: "${value}"` + content.slice(closeIdx);
}

function updateFrontmatter(filePath, paths) {
  let content = readFileSync(filePath, 'utf-8');
  content = setField(content, 'imagen', paths.main);
  content = setField(content, 'imagen_thumb', paths.thumb);
  writeFileSync(filePath, content, 'utf-8');
}

// ─── Comprobar si un artículo necesita imagen ─────────────────────────────────

function needsImage(filePath, parsedData) {
  const img = parsedData.imagen ?? '';
  if (!img || img === 'pendiente' || img.startsWith('http')) return true;
  // Comprobar si el archivo existe en disco
  const diskPath = resolve(__dirname, '..', 'public', img.replace(/^\//, ''));
  return !existsSync(diskPath);
}

// ─── Cargar artículos según modo ──────────────────────────────────────────────

function loadArticles(mode, targetSlug) {
  const files = readdirSync(CONTENT_DIR).filter(f => f.endsWith('.md'));

  if (targetSlug) {
    const candidates = [`${targetSlug}.md`, `borrador-${targetSlug}.md`];
    return files
      .filter(f => candidates.includes(f))
      .map(f => ({ file: f, path: join(CONTENT_DIR, f) }));
  }

  return files
    .filter(f => {
      const isBorrador = f.startsWith('borrador-');
      if (mode === 'publicados') return !isBorrador;
      if (mode === 'borradores') return isBorrador;
      return true;
    })
    .map(f => ({ file: f, path: join(CONTENT_DIR, f) }));
}

// ─── Estadísticas ─────────────────────────────────────────────────────────────

const stats = { total: 0, pccomponentes: 0, fabricante: 0, bing: 0, duckduckgo: 0, manual: 0, skip: 0 };

// ─── Procesar un artículo ────────────────────────────────────────────────────

async function processArticle({ file, path: filePath }, queryOverride = null) {
  const raw    = readFileSync(filePath, 'utf-8');
  const parsed = matter(raw);
  const data   = parsed.data;

  // Slug para la imagen: usar el campo imagen si existe, si no derivar del nombre de archivo
  let slug;
  if (data.imagen && data.imagen.startsWith('/images/')) {
    slug = data.imagen.replace('/images/articulos/', '').replace('.webp', '');
  } else {
    slug = file.replace('.md', '');
  }

  const productName    = queryOverride ?? data.title ?? slug;
  const enlaceAfiliado = data.enlace_afiliado ?? '';

  if (!needsImage(filePath, data)) {
    console.log(`  ⏭  ${slug} — imagen OK, omitido`);
    stats.skip++;
    return;
  }

  stats.total++;
  console.log(`\n  🔍 ${productName}`);
  console.log(`     Slug: ${slug}`);

  const result = await findAndDownloadImage(productName, slug, enlaceAfiliado);

  if (result) {
    updateFrontmatter(filePath, result);
    console.log(`  ✅ ${productName}`);
    console.log(`     → ${result.main} (via ${result.method})`);
    stats[result.method === 'PcComponentes' ? 'pccomponentes'
         : result.method === 'fabricante' ? 'fabricante'
         : result.method === 'Bing' ? 'bing'
         : 'duckduckgo']++;
  } else {
    console.log(`  ⚠️  ${productName} — sin imagen (búsqueda manual)`);
    stats.manual++;
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const args       = process.argv.slice(2);
  const slugIdx    = args.indexOf('--slug');
  const targetSlug = slugIdx !== -1 ? args[slugIdx + 1] : null;
  const queryIdx   = args.indexOf('--query');
  const queryOverride = queryIdx !== -1 ? args[queryIdx + 1] : null;
  const mode       = args.includes('--publicados') ? 'publicados'
                   : args.includes('--borradores')  ? 'borradores'
                   : 'todos';

  if (queryOverride && !targetSlug) {
    console.error('ERROR: --query solo se puede usar junto a --slug');
    process.exit(1);
  }

  console.log(`\nFitzDesk Image Collector — modo: ${targetSlug ? `slug:${targetSlug}` : mode}`);
  if (queryOverride) console.log(`Query manual: "${queryOverride}"`);
  console.log('━'.repeat(52));
  if (!process.env.BING_API_KEY) {
    console.log('ℹ️  BING_API_KEY no configurada — se omite intento 3 (Bing)');
  }
  console.log('');

  const articles = loadArticles(mode, targetSlug);
  console.log(`Artículos a comprobar: ${articles.length}\n`);

  const t0 = Date.now();
  for (const article of articles) {
    try {
      await processArticle(article, queryOverride);
    } catch (e) {
      console.error(`  ❌ ${article.file}: ${e.message}`);
    }
    // Pausa entre peticiones para no saturar servidores
    await new Promise(r => setTimeout(r, 800));
  }

  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`\n${'━'.repeat(52)}`);
  console.log(`RESUMEN (${elapsed}s)`);
  console.log(`  Imágenes procesadas : ${stats.total - stats.manual}/${stats.total}`);
  console.log(`  Via PcComponentes   : ${stats.pccomponentes}`);
  console.log(`  Via fabricante      : ${stats.fabricante}`);
  console.log(`  Via Bing            : ${stats.bing}`);
  console.log(`  Via DuckDuckGo      : ${stats.duckduckgo}`);
  console.log(`  Búsqueda manual     : ${stats.manual}`);
  console.log(`  Ya tenían imagen    : ${stats.skip}`);
  console.log('━'.repeat(52));
}

// Solo ejecutar main() cuando el script se lanza directamente.
// Si se importa como módulo (monitor.js), no ejecutar nada.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch(e => {
    console.error('Error:', e.message);
    process.exit(1);
  });
}
