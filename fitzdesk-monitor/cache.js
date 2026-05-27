import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CACHE_FILE = join(__dirname, 'cache.json');

function loadCache() {
  if (!existsSync(CACHE_FILE)) return { processed: [] };
  try {
    return JSON.parse(readFileSync(CACHE_FILE, 'utf-8'));
  } catch {
    return { processed: [] };
  }
}

function saveCache(data) {
  writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

export function isProcessed(id) {
  const cache = loadCache();
  return cache.processed.includes(id);
}

export function markProcessed(id) {
  const cache = loadCache();
  if (!cache.processed.includes(id)) {
    cache.processed.push(id);
    // Mantener solo los últimos 1000 para no crecer indefinidamente
    if (cache.processed.length > 1000) {
      cache.processed = cache.processed.slice(-1000);
    }
    saveCache(cache);
  }
}

export function getCacheStats() {
  const cache = loadCache();
  return { total: cache.processed.length };
}
