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

/**
 * Asegura que la rama borradores existe.
 * Si no existe, la crea a partir de GITHUB_BRANCH (main).
 */
async function ensureBranchExists() {
  const refUrl = `${API_BASE}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/git/ref/heads/${GITHUB_BRANCH_BORRADORES}`;
  const res = await fetch(refUrl, { headers: githubHeaders() });

  if (res.ok) return; // ya existe

  if (res.status !== 404) {
    const body = await res.text();
    throw new Error(`Error comprobando rama ${GITHUB_BRANCH_BORRADORES}: ${res.status} ${body}`);
  }

  // Obtener SHA de main para crear la rama desde ahí
  const mainRes = await fetch(
    `${API_BASE}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/git/ref/heads/${GITHUB_BRANCH}`,
    { headers: githubHeaders() },
  );
  if (!mainRes.ok) {
    const body = await mainRes.text();
    throw new Error(`Error obteniendo SHA de ${GITHUB_BRANCH}: ${mainRes.status} ${body}`);
  }
  const { object: { sha } } = await mainRes.json();

  const createRes = await fetch(`${API_BASE}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/git/refs`, {
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
  const res = await fetch(url, { headers: githubHeaders() });
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

  const res = await fetch(url, {
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
 * Descarga cache.json desde la rama borradores y lo escribe en localPath.
 * Devuelve true si se descargó, false si no existe todavía en GitHub.
 */
export async function downloadCache(localPath) {
  if (!GITHUB_TOKEN) return false;
  try {
    const url = `${API_BASE}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${CACHE_GITHUB_PATH}?ref=${GITHUB_BRANCH_BORRADORES}`;
    const res = await fetch(url, { headers: githubHeaders() });
    if (res.status === 404) return false;
    if (!res.ok) return false;
    const data = await res.json();
    const content = Buffer.from(data.content, 'base64').toString('utf-8');
    const dir = dirname(localPath);
    if (dir && !existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(localPath, content, 'utf-8');
    logInfo(`✅ Caché descargado desde GitHub (${JSON.parse(content).entries?.length ?? 0} entradas)`);
    return true;
  } catch (err) {
    logWarn(`⚠️ No se pudo descargar caché desde GitHub: ${err.message}`);
    return false;
  }
}

/**
 * Sube cache.json local a la rama borradores en GitHub.
 */
export async function uploadCache(localPath) {
  if (!GITHUB_TOKEN) return;
  try {
    if (!existsSync(localPath)) return;
    const content = readFileSync(localPath, 'utf-8');
    const contentB64 = Buffer.from(content, 'utf-8').toString('base64');

    // Obtener SHA actual si existe
    const shaRes = await fetch(
      `${API_BASE}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${CACHE_GITHUB_PATH}?ref=${GITHUB_BRANCH_BORRADORES}`,
      { headers: githubHeaders() },
    );
    const sha = shaRes.ok ? (await shaRes.json()).sha : null;

    const body = {
      message: 'chore: actualizar caché del monitor',
      content: contentB64,
      branch:  GITHUB_BRANCH_BORRADORES,
      ...(sha ? { sha } : {}),
    };

    const res = await fetch(
      `${API_BASE}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${CACHE_GITHUB_PATH}`,
      { method: 'PUT', headers: githubHeaders(), body: JSON.stringify(body) },
    );
    if (res.ok) {
      const entries = JSON.parse(content).entries?.length ?? 0;
      logInfo(`✅ Caché subido a GitHub (${entries} entradas)`);
    } else {
      logWarn(`⚠️ No se pudo subir caché a GitHub: ${res.status}`);
    }
  } catch (err) {
    logWarn(`⚠️ Error subiendo caché a GitHub: ${err.message}`);
  }
}

/** true si el publisher está disponible (GITHUB_TOKEN configurado) */
export const isAvailable = () => Boolean(GITHUB_TOKEN);
