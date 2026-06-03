import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { createHash } from 'crypto';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname   = dirname(fileURLToPath(import.meta.url));
const DATA_DIR    = join(__dirname, 'data');
const CACHE_FILE  = join(DATA_DIR, 'cache.json');
const MAX_ENTRIES = 500;

// ─── Normalización de URL ─────────────────────────────────────────────────────

export function normalizeUrl(rawUrl) {
  if (!rawUrl) return '';
  try {
    const u = new URL(rawUrl);
    u.search = '';
    u.hash   = '';
    return u.toString();
  } catch {
    return rawUrl;
  }
}

// ─── Hash de título ───────────────────────────────────────────────────────────

const STOPWORDS = new Set([
  'el','la','los','las','un','una','unos','unas',
  'de','del','en','a','al','con','por','para','sin','sobre','entre',
  'su','sus','se','lo','le','les','me','te','nos',
  'es','son','fue','era','ser','estar','hay',
  'que','y','o','e','ni','pero','sino','aunque','si','ya',
  'este','esta','estos','estas','ese','esa','aquel',
  'más','muy','también','todo','todos','toda','todas',
  'nuevo','nueva','nuevos','nuevas','mejor','gran','grandes',
]);

export function hashTitle(rawTitle) {
  if (!rawTitle) return '';
  const clean = rawTitle
    .toLowerCase()
    .replace(/<[^>]+>/g, ' ')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(w => w.length > 1 && !STOPWORDS.has(w))
    .join(' ')
    .trim();
  return createHash('md5').update(clean).digest('hex');
}

// ─── Caché en memoria (cargado una vez al arrancar) ───────────────────────────

function initCache() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  if (!existsSync(CACHE_FILE)) return { entries: [] };
  try {
    const data = JSON.parse(readFileSync(CACHE_FILE, 'utf-8'));
    // Compatibilidad con formato antiguo ({processed: string[]})
    if (Array.isArray(data.processed)) {
      return { entries: data.processed.map(id => ({ id, url: '', titleHash: '', ts: 0 })) };
    }
    return Array.isArray(data.entries) ? data : { entries: [] };
  } catch {
    return { entries: [] };
  }
}

const _cache = initCache();

function persist() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  if (_cache.entries.length > MAX_ENTRIES) {
    _cache.entries = _cache.entries.slice(-MAX_ENTRIES);
  }
  writeFileSync(CACHE_FILE, JSON.stringify(_cache, null, 2), 'utf-8');
}

// ─── API pública ──────────────────────────────────────────────────────────────

export function isProcessed(id) {
  return _cache.entries.some(e => e.id === id);
}

export function isProcessedByUrl(url) {
  const norm = normalizeUrl(url);
  return norm ? _cache.entries.some(e => e.url === norm) : false;
}

export function isProcessedByTitleHash(hash) {
  return hash ? _cache.entries.some(e => e.titleHash === hash) : false;
}

/** Marca un id como procesado. Acepta url y titleHash opcionales para deduplicación futura. */
export function markProcessed(id, { url = '', titleHash = '' } = {}) {
  if (_cache.entries.some(e => e.id === id)) return;
  _cache.entries.push({ id, url: normalizeUrl(url), titleHash, ts: Date.now() });
  persist();
}

export function getCacheStats() {
  return { total: _cache.entries.length };
}
