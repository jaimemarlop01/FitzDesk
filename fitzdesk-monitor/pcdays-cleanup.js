/**
 * FitzDesk PCDays Cleanup (TAREA 7)
 * Se ejecuta manualmente al terminar el evento PCDays:
 *   1. Busca todos los artículos PUBLICADOS con tipo: "oferta" y oferta_activa: true
 *   2. Intenta comprobar el precio actual en la tienda (enlace_afiliado)
 *   3. Si el precio subió, ejecuta articleUpdater.js --precio (que ya sabe
 *      detectar que una oferta ha terminado y marcar oferta_activa: false,
 *      ver la lógica de applyOfertaPrecioUpdate en articleUpdater.js)
 *   4. Notifica el informe final a Discord
 *
 * IMPORTANTE — limitación conocida: PcComponentes bloquea el scraping
 * automático con un reto de Cloudflare (403), confirmado repetidamente en
 * esta sesión (ver CLAUDE.md). Este script intenta leer el precio desde la
 * página de todos modos (puede funcionar para otras tiendas o si
 * Cloudflare no bloquea esa petición concreta), pero si no consigue un
 * precio fiable, NUNCA inventa uno — la oferta se reporta como "no se pudo
 * verificar" para que se compruebe a mano.
 *
 * Uso:
 *   node pcdays-cleanup.js
 */

import 'dotenv/config';
import matter from 'gray-matter';
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { logInfo, logSuccess, logWarn, logError, notifyPcdaysCleanupReport, notifyPcdaysModeStatus } from './notifier.js';

const __dirname   = dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = join(__dirname, '..', 'src', 'content', 'articulos');
const UA = 'Mozilla/5.0 (compatible; FitzDesk-PCDaysCleanup/1.0)';

function loadAllArticles() {
  return readdirSync(CONTENT_DIR)
    .filter(f => f.endsWith('.md'))
    .map(file => {
      const raw = readFileSync(join(CONTENT_DIR, file), 'utf-8');
      const { data } = matter(raw);
      return { file, data };
    });
}

function parsePrecioNum(str) {
  if (!str) return null;
  const n = parseFloat(String(str).replace(/[^\d,.]/g, '').replace(',', '.'));
  return isNaN(n) ? null : n;
}

/**
 * Intenta extraer un precio en € del HTML de la página del producto.
 * Best-effort: busca el primer patrón "NN,NN €" o "NN €" razonable. No hay
 * forma fiable de aislar "el precio actual" de cualquier HTML arbitrario de
 * cualquier tienda sin un scraper específico por tienda — se acepta esa
 * imprecisión a cambio de no bloquear el script en una tienda en concreto;
 * el resultado siempre puede contrastarse a mano con el campo "no
 * verificable" antes de creer ningún número.
 */
async function tryFetchCurrentPrice(url) {
  if (!url) return null;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(10000) });
    if (!res.ok) return null; // incluye el 403 de Cloudflare en PcComponentes
    const html = await res.text();
    const match = html.match(/(\d{1,4}(?:[.,]\d{2}))\s*€/);
    if (!match) return null;
    return `${match[1]}€`;
  } catch {
    return null;
  }
}

async function main() {
  logInfo('━━━ FitzDesk PCDays Cleanup ━━━');

  const all = loadAllArticles();
  const ofertaArticles = all.filter(a => a.data.tipo === 'oferta');
  const totalGeneradas = ofertaArticles.length;

  const activasPublicadas = ofertaArticles.filter(a => !a.data.borrador && a.data.oferta_activa === true);
  logInfo(`Artículos de oferta totales: ${totalGeneradas} · Publicados y activos a comprobar: ${activasPublicadas.length}`);

  const terminadas     = [];
  const siguenActivas  = [];
  const noVerificadas  = [];

  for (const { data } of activasPublicadas) {
    const slug   = data.slug ?? data.title;
    const titulo = data.title ?? slug;
    logInfo(`Comprobando "${titulo}"...`);

    const precioActual = await tryFetchCurrentPrice(data.enlace_afiliado);

    if (!precioActual) {
      logWarn(`  ❓ No se pudo verificar el precio actual (tienda bloqueada o sin coincidencia) — revisar a mano`);
      noVerificadas.push({ slug, titulo, precioAnterior: data.precio_oferta });
      continue;
    }

    const precioOfertaNum = parsePrecioNum(data.precio_oferta);
    const precioActualNum = parsePrecioNum(precioActual);
    const subioDePrecio = precioOfertaNum !== null && precioActualNum !== null && precioActualNum > precioOfertaNum * 1.03;

    if (!subioDePrecio) {
      logSuccess(`  🟢 Sigue al mismo precio aproximado (${precioActual}) — oferta sigue activa`);
      siguenActivas.push({ slug, titulo, precioAnterior: data.precio_oferta, precioActual });
      continue;
    }

    logInfo(`  📈 El precio ha subido a ${precioActual} (antes ${data.precio_oferta}) — actualizando con articleUpdater.js...`);
    try {
      execFileSync('node', ['articleUpdater.js', '--slug', slug, '--precio', precioActual], {
        cwd: __dirname, stdio: 'inherit',
      });
      terminadas.push({ slug, titulo, precioAnterior: data.precio_oferta, precioActual });
    } catch (e) {
      logError(`  ✗ articleUpdater.js falló para "${slug}": ${e.message}`);
      noVerificadas.push({ slug, titulo, precioAnterior: data.precio_oferta });
    }
  }

  await notifyPcdaysCleanupReport({ terminadas, siguenActivas, noVerificadas, totalGeneradas });
  await notifyPcdaysModeStatus(false);

  console.log(`\n${'━'.repeat(48)}`);
  console.log(`Total ofertas generadas durante el evento: ${totalGeneradas}`);
  console.log(`🔴 Terminadas (precio subió):    ${terminadas.length}`);
  console.log(`🟢 Siguen activas:               ${siguenActivas.length}`);
  console.log(`❓ No se pudo verificar:          ${noVerificadas.length}`);
  console.log('━'.repeat(48));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch(e => {
    logError(`Error: ${e.message}`);
    process.exit(1);
  });
}
