/**
 * githubPublisher.js
 * Crea o actualiza borradores en la rama 'borradores' via API REST de GitHub.
 * Se usa cuando GITHUB_TOKEN está configurado (Railway/producción).
 * Si no está configurado, el caller cae al guardado local.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { logInfo, logWarn, logError } from './notifier.js';

const GITHUB_TOKEN             = process.env.GITHUB_TOKEN;
const GITHUB_OWNER             = process.env.GITHUB_OWNER             ?? 'jaimemarlop01';
const GITHUB_REPO              = process.env.GITHUB_REPO              ?? 'FitzDesk';
const GITHUB_BRANCH            = process.env.GITHUB_BRANCH            ?? 'main';
const GITHUB_BRANCH_BORRADORES = process.env.GITHUB_BRANCH_BORRADORES ?? 'borradores';

const CONTENT_DIR = 'src/content/articulos';
const API_BASE    = 'https://api.github.com';

function githubHeaders() {
  return {
    'Authorization':        `Bearer ${GITHUB_TOKEN}`,
    'Accept':               'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type':         'application/json',
  };
}

// Advertencia detectada en la revisión de seguridad PCDays (2026-06-25):
// ninguna llamada fetch() de este archivo tenía timeout propio — un fallo de
// red puntual podía dejar el job colgado hasta el límite del runner de
// GitHub Actions, en vez de fallar rápido y notificar. ghFetch() centraliza
// un timeout razonable para todas las llamadas a la API de GitHub de este
// módulo (mismo patrón que ya usa pcdays-cleanup.js para su propio fetch).
const GH_TIMEOUT_MS = 15000;
function ghFetch(url, opts = {}) {
  return fetch(url, { ...opts, signal: AbortSignal.timeout(GH_TIMEOUT_MS) });
}

/**
 * Asegura que la rama borradores existe.
 * Si no existe, la crea a partir de GITHUB_BRANCH (main).
 */
async function ensureBranchExists() {
  const refUrl = `${API_BASE}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/git/ref/heads/${GITHUB_BRANCH_BORRADORES}`;
  const res = await ghFetch(refUrl, { headers: githubHeaders() });

  if (res.ok) return; // ya existe

  if (res.status !== 404) {
    const body = await res.text();
    throw new Error(`Error comprobando rama ${GITHUB_BRANCH_BORRADORES}: ${res.status} ${body}`);
  }

  // Obtener SHA de main para crear la rama desde ahí
  const mainRes = await ghFetch(
    `${API_BASE}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/git/ref/heads/${GITHUB_BRANCH}`,
    { headers: githubHeaders() },
  );
  if (!mainRes.ok) {
    const body = await mainRes.text();
    throw new Error(`Error obteniendo SHA de ${GITHUB_BRANCH}: ${mainRes.status} ${body}`);
  }
  const { object: { sha } } = await mainRes.json();

  const createRes = await ghFetch(`${API_BASE}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/git/refs`, {
    method:  'POST',
    headers: githubHeaders(),
    body:    JSON.stringify({ ref: `refs/heads/${GITHUB_BRANCH_BORRADORES}`, sha }),
  });
  if (!createRes.ok) {
    const body = await createRes.text();
    throw new Error(`Error creando rama ${GITHUB_BRANCH_BORRADORES}: ${createRes.status} ${body}`);
  }
  logInfo(`✅ Rama '${GITHUB_BRANCH_BORRADORES}' creada a partir de ${GITHUB_BRANCH}`);
}

/**
 * SHA del archivo en la rama borradores (null si no existe).
 */
async function getFileSha(path) {
  const url = `${API_BASE}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}?ref=${GITHUB_BRANCH_BORRADORES}`;
  const res = await ghFetch(url, { headers: githubHeaders() });
  if (res.status === 404) return null;
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Error obteniendo SHA de ${path}: ${res.status} ${body}`);
  }
  const data = await res.json();
  return data.sha ?? null;
}

/**
 * Crea o actualiza un borrador en la rama borradores del repositorio GitHub.
 *
 * @param {string} slug    - Slug del artículo (sin 'borrador-' ni '.md')
 * @param {string} content - Contenido completo del archivo Markdown
 * @returns {string} URL del archivo en GitHub (rama borradores)
 */
export async function createDraft(slug, content) {
  if (!GITHUB_TOKEN) {
    throw new Error('GITHUB_TOKEN no configurado — usa guardado local');
  }

  await ensureBranchExists();

  const filename = `borrador-${slug}.md`;
  const filePath = `${CONTENT_DIR}/${filename}`;
  const url      = `${API_BASE}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filePath}`;

  const contentB64 = Buffer.from(content, 'utf-8').toString('base64');
  const sha        = await getFileSha(filePath);

  const body = {
    message: `borrador: ${slug.replace(/-/g, ' ')}`,
    content: contentB64,
    branch:  GITHUB_BRANCH_BORRADORES,
    ...(sha ? { sha } : {}),
  };

  const res = await ghFetch(url, {
    method:  'PUT',
    headers: githubHeaders(),
    body:    JSON.stringify(body),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`GitHub API ${res.status}: ${errBody}`);
  }

  const data   = await res.json();
  const action = sha ? 'actualizado' : 'creado';
  logInfo(`✅ Borrador ${action} en rama '${GITHUB_BRANCH_BORRADORES}': ${filePath}`);

  return (
    data.content?.html_url ??
    `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/blob/${GITHUB_BRANCH_BORRADORES}/${filePath}`
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Persistencia del caché en GitHub
// ─────────────────────────────────────────────────────────────────────────────

const CACHE_GITHUB_PATH = 'fitzdesk-monitor/data/cache.json';

/**
 * Descarga un archivo de datos desde la rama borradores y lo escribe en
 * localPath. Genérico — usado tanto para cache.json como para cualquier
 * otro archivo de estado del monitor que necesite persistir entre
 * ejecuciones en CI (p. ej. el contador diario de ofertas publicadas).
 * Devuelve true si se descargó, false si no existe todavía en GitHub.
 */
export async function downloadDataFile(remotePath, localPath) {
  if (!GITHUB_TOKEN) return false;
  try {
    const url = `${API_BASE}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${remotePath}?ref=${GITHUB_BRANCH_BORRADORES}`;
    const res = await ghFetch(url, { headers: githubHeaders() });
    if (res.status === 404) return false;
    if (!res.ok) return false;
    const data = await res.json();
    const content = Buffer.from(data.content, 'base64').toString('utf-8');
    const dir = dirname(localPath);
    if (dir && !existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(localPath, content, 'utf-8');
    return true;
  } catch (err) {
    logWarn(`⚠️ No se pudo descargar ${remotePath} desde GitHub: ${err.message}`);
    return false;
  }
}

/** Sube un archivo de datos local a la rama borradores en GitHub. */
export async function uploadDataFile(remotePath, localPath, commitMessage) {
  if (!GITHUB_TOKEN) return;
  try {
    if (!existsSync(localPath)) return;
    const content = readFileSync(localPath, 'utf-8');
    const contentB64 = Buffer.from(content, 'utf-8').toString('base64');

    const shaRes = await ghFetch(
      `${API_BASE}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${remotePath}?ref=${GITHUB_BRANCH_BORRADORES}`,
      { headers: githubHeaders() },
    );
    const sha = shaRes.ok ? (await shaRes.json()).sha : null;

    const res = await ghFetch(
      `${API_BASE}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${remotePath}`,
      {
        method: 'PUT',
        headers: githubHeaders(),
        body: JSON.stringify({
          message: commitMessage,
          content: contentB64,
          branch:  GITHUB_BRANCH_BORRADORES,
          ...(sha ? { sha } : {}),
        }),
      },
    );
    if (!res.ok) logWarn(`⚠️ No se pudo subir ${remotePath} a GitHub: ${res.status}`);
  } catch (err) {
    logWarn(`⚠️ Error subiendo ${remotePath} a GitHub: ${err.message}`);
  }
}

/**
 * Descarga cache.json desde la rama borradores y lo escribe en localPath.
 * Devuelve true si se descargó, false si no existe todavía en GitHub.
 */
export async function downloadCache(localPath) {
  const ok = await downloadDataFile(CACHE_GITHUB_PATH, localPath);
  if (ok) {
    try {
      const entries = JSON.parse(readFileSync(localPath, 'utf-8')).entries?.length ?? 0;
      logInfo(`✅ Caché descargado desde GitHub (${entries} entradas)`);
    } catch { /* informativo, no crítico */ }
  }
  return ok;
}

/**
 * Sube cache.json local a la rama borradores en GitHub.
 */
export async function uploadCache(localPath) {
  await uploadDataFile(CACHE_GITHUB_PATH, localPath, 'chore: actualizar caché del monitor');
  if (existsSync(localPath)) {
    try {
      const entries = JSON.parse(readFileSync(localPath, 'utf-8')).entries?.length ?? 0;
      logInfo(`✅ Caché subido a GitHub (${entries} entradas)`);
    } catch { /* informativo, no crítico */ }
  }
}

/** true si el publisher está disponible (GITHUB_TOKEN configurado) */
export const isAvailable = () => Boolean(GITHUB_TOKEN);

// ─────────────────────────────────────────────────────────────────────────────
// Publicación directa en main (ofertas PCDays — sin pasar por el calendario)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Publica un artículo directamente en `main`, sin prefijo "borrador-" y sin
 * pasar por la rama `borradores` ni el calendario. Pensado solo para ofertas
 * de alta confianza durante PCDays (ver TAREA 1 — modo PCDays, CLAUDE.md).
 * No dispara el deploy por sí mismo — usa dispatchWorkflow() después.
 */
export async function publishDirectly(slug, content, imagePath = null, imageBuffer = null) {
  if (!GITHUB_TOKEN) throw new Error('GITHUB_TOKEN no configurado — no se puede publicar directamente');

  const filePath = `${CONTENT_DIR}/${slug}.md`;
  const contentB64 = Buffer.from(content, 'utf-8').toString('base64');
  const sha = await getFileShaOnBranch(filePath, GITHUB_BRANCH);

  const res = await ghFetch(`${API_BASE}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filePath}`, {
    method:  'PUT',
    headers: githubHeaders(),
    body: JSON.stringify({
      message: `feat: publicar oferta ${slug.replace(/-/g, ' ')}`,
      content: contentB64,
      branch:  GITHUB_BRANCH,
      ...(sha ? { sha } : {}),
    }),
  });
  if (!res.ok) throw new Error(`GitHub API ${res.status}: ${await res.text()}`);

  if (imagePath && imageBuffer) {
    const imgSha = await getFileShaOnBranch(imagePath, GITHUB_BRANCH);
    const imgRes = await ghFetch(`${API_BASE}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${imagePath}`, {
      method:  'PUT',
      headers: githubHeaders(),
      body: JSON.stringify({
        message: `feat: imagen para oferta ${slug.replace(/-/g, ' ')}`,
        content: imageBuffer.toString('base64'),
        branch:  GITHUB_BRANCH,
        ...(imgSha ? { sha: imgSha } : {}),
      }),
    });
    if (!imgRes.ok) logWarn(`No se pudo subir la imagen de ${slug}: ${imgRes.status}`);
  }

  logInfo(`✅ Oferta publicada directamente en ${GITHUB_BRANCH}: ${filePath}`);
  return `https://fitzdesk.com/articulo/${slug}/`;
}

async function getFileShaOnBranch(path, branch) {
  const url = `${API_BASE}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}?ref=${branch}`;
  const res = await ghFetch(url, { headers: githubHeaders() });
  if (res.status === 404) return null;
  if (!res.ok) return null;
  const data = await res.json();
  return data.sha ?? null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Disparar y esperar workflows de GitHub Actions (deploy, redes sociales)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Dispara un workflow por workflow_dispatch sin esperar a que termine
 * ("fire and forget") — usado para la publicación en redes sociales tras
 * publicar una oferta: ese workflow ya notifica su propio resultado a
 * Discord, así que el monitor no necesita bloquearse esperándolo.
 */
export async function dispatchWorkflow(workflowFile, inputs = {}) {
  if (!GITHUB_TOKEN) throw new Error('GITHUB_TOKEN no configurado');
  const res = await ghFetch(
    `${API_BASE}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/actions/workflows/${workflowFile}/dispatches`,
    {
      method:  'POST',
      headers: githubHeaders(),
      body:    JSON.stringify({ ref: GITHUB_BRANCH, inputs }),
    },
  );
  if (!res.ok) throw new Error(`No se pudo disparar ${workflowFile}: ${res.status} ${await res.text()}`);
}

/**
 * Dispara un workflow y espera a que el run que arranque a partir de ahora
 * termine. Igual que el patrón "gh workflow run + gh run watch" ya usado en
 * publicar-en-redes.yml/publicar-automatico.yml, pero vía API REST porque
 * aquí no hay `gh` CLI disponible (proceso Node, no un step de bash).
 */
export async function dispatchWorkflowAndWait(workflowFile, inputs = {}, { timeoutMs = 5 * 60 * 1000, pollMs = 8000 } = {}) {
  const before = await latestRunId(workflowFile);
  await dispatchWorkflow(workflowFile, inputs);

  const start = Date.now();
  let runId = null;
  while (Date.now() - start < timeoutMs) {
    await new Promise(r => setTimeout(r, pollMs));
    const id = await latestRunId(workflowFile);
    if (id && id !== before) { runId = id; break; }
  }
  if (!runId) throw new Error(`${workflowFile} no arrancó a tiempo tras el dispatch`);

  while (Date.now() - start < timeoutMs) {
    const run = await getRun(runId);
    if (run.status === 'completed') {
      if (run.conclusion !== 'success') throw new Error(`${workflowFile} (run ${runId}) terminó con: ${run.conclusion}`);
      logInfo(`✅ ${workflowFile} (run ${runId}) completado con éxito`);
      return run;
    }
    await new Promise(r => setTimeout(r, pollMs));
  }
  throw new Error(`${workflowFile} (run ${runId}) no terminó a tiempo`);
}

async function latestRunId(workflowFile) {
  const res = await ghFetch(
    `${API_BASE}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/actions/workflows/${workflowFile}/runs?per_page=1`,
    { headers: githubHeaders() },
  );
  if (!res.ok) return null;
  const data = await res.json();
  return data.workflow_runs?.[0]?.id ?? null;
}

async function getRun(runId) {
  const res = await ghFetch(`${API_BASE}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/actions/runs/${runId}`, { headers: githubHeaders() });
  if (!res.ok) throw new Error(`No se pudo consultar el run ${runId}: ${res.status}`);
  return res.json();
}
