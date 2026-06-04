/**
 * githubPublisher.js
 * Crea o actualiza borradores directamente en GitHub via API REST.
 * Se usa cuando GITHUB_TOKEN está configurado (Railway/producción).
 * Si no está configurado, el caller cae al guardado local.
 */

import { logInfo, logWarn, logError } from './notifier.js';

const GITHUB_TOKEN  = process.env.GITHUB_TOKEN;
const GITHUB_OWNER  = process.env.GITHUB_OWNER  ?? 'jaimemarlop01';
const GITHUB_REPO   = process.env.GITHUB_REPO   ?? 'FitzDesk';
const GITHUB_BRANCH = process.env.GITHUB_BRANCH ?? 'main';

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
 * Obtiene el SHA de un archivo existente en GitHub (necesario para actualizarlo).
 * Devuelve null si el archivo no existe.
 */
async function getFileSha(path) {
  const url = `${API_BASE}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}?ref=${GITHUB_BRANCH}`;
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
 * Crea o actualiza un borrador en el repositorio GitHub.
 *
 * @param {string} slug  - Slug del artículo (sin 'borrador-' ni '.md')
 * @param {string} content - Contenido completo del archivo Markdown
 * @returns {string} URL del archivo en GitHub
 */
export async function createDraft(slug, content) {
  if (!GITHUB_TOKEN) {
    throw new Error('GITHUB_TOKEN no configurado — usa guardado local');
  }

  const filename = `borrador-${slug}.md`;
  const filePath = `${CONTENT_DIR}/${filename}`;
  const url      = `${API_BASE}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filePath}`;

  // Codificar contenido en base64
  const contentB64 = Buffer.from(content, 'utf-8').toString('base64');

  // Intentar obtener SHA si el archivo ya existe (necesario para update)
  const sha = await getFileSha(filePath);

  const body = {
    message: `borrador: ${slug.replace(/-/g, ' ')}`,
    content: contentB64,
    branch:  GITHUB_BRANCH,
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

  const data = await res.json();
  const action = sha ? 'actualizado' : 'creado';
  logInfo(`✅ Borrador ${action} en GitHub: ${filePath}`);
  logInfo(`✅ GitHub Actions desplegará automáticamente en ~2 minutos`);

  return data.content?.html_url
    ?? `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/blob/${GITHUB_BRANCH}/${filePath}`;
}

/** true si el publisher está disponible (GITHUB_TOKEN configurado) */
export const isAvailable = () => Boolean(GITHUB_TOKEN);
