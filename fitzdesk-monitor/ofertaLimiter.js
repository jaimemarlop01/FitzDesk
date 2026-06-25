/**
 * FitzDesk Oferta Limiter
 * Cuenta cuántas ofertas se han publicado automáticamente hoy, persistido
 * entre ejecuciones del monitor en CI (vía la misma rama `borradores` que
 * ya usa cache.json, a través de githubPublisher.js downloadDataFile/
 * uploadDataFile). Sin esto, cada ejecución de monitor.js en GitHub Actions
 * partiría de un checkout limpio y el límite diario nunca se respetaría
 * entre ejecuciones distintas (crítico en modo --pcdays, que corre cada 2h).
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { downloadDataFile, uploadDataFile, isAvailable as githubAvailable } from './githubPublisher.js';

const __dirname  = dirname(fileURLToPath(import.meta.url));
const LOCAL_FILE  = join(__dirname, 'data', 'ofertas-publicadas-hoy.json');
const REMOTE_PATH = 'fitzdesk-monitor/data/ofertas-publicadas-hoy.json';

function today() {
  return new Date().toISOString().slice(0, 10);
}

function read() {
  if (!existsSync(LOCAL_FILE)) return { fecha: today(), count: 0, slugs: [] };
  try {
    const data = JSON.parse(readFileSync(LOCAL_FILE, 'utf-8'));
    if (data.fecha !== today()) return { fecha: today(), count: 0, slugs: [] };
    return data;
  } catch {
    return { fecha: today(), count: 0, slugs: [] };
  }
}

function save(data) {
  const dir = dirname(LOCAL_FILE);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(LOCAL_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

/** Sincroniza el contador local con el de GitHub — llamar al empezar runCheck(). */
export async function syncFromRemote() {
  if (githubAvailable()) await downloadDataFile(REMOTE_PATH, LOCAL_FILE);
}

/** Sube el contador actualizado a GitHub — llamar al terminar runCheck(). */
export async function syncToRemote() {
  if (githubAvailable()) await uploadDataFile(REMOTE_PATH, LOCAL_FILE, 'chore: actualizar contador diario de ofertas publicadas');
}

export function getTodayCount() {
  return read().count;
}

export function isLimitReached(maxPerDay) {
  return read().count >= maxPerDay;
}

/**
 * Registra una oferta publicada hoy. Devuelve el nuevo total.
 *
 * Mitigación de condición de carrera (revisión de seguridad PCDays,
 * 2026-06-25): si dos ejecuciones del monitor se solapan en el tiempo (poco
 * probable pero no descartable con el cron cada 2h del modo --pcdays más
 * disparos manuales, y dado que `publishDirectly`+`dispatchWorkflowAndWait`
 * mantienen el proceso vivo varios minutos por cada oferta publicada,
 * ampliando la ventana de solape), `syncFromRemote()` al inicio de
 * runCheck() ya no es suficiente — cada llamada vuelve a sincronizar contra
 * GitHub justo antes de incrementar, para que la ventana de solape real sea
 * solo la de esta función, no la de todo el ciclo de ofertas. No es un lock
 * atómico de verdad (seguiría siendo posible perder un incremento si dos
 * llamadas leen el mismo valor en el mismo instante), pero reduce el riesgo
 * de forma significativa sin la complejidad de un mecanismo de bloqueo
 * distribuido — aceptado como mitigación razonable, no como garantía total.
 */
export async function recordPublished(slug) {
  await syncFromRemote();
  const data = read();
  data.count += 1;
  data.slugs.push(slug);
  save(data);
  await syncToRemote();
  return data.count;
}
