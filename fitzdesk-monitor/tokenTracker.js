import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TOKEN_FILE = join(__dirname, 'data', 'tokens.json');

export const DAILY_LIMIT = 70000;

function today() {
  return new Date().toISOString().slice(0, 10);
}

function read() {
  if (!existsSync(TOKEN_FILE)) return { fecha: today(), tokens_usados: 0 };
  try {
    const data = JSON.parse(readFileSync(TOKEN_FILE, 'utf-8'));
    if (data.fecha !== today()) return { fecha: today(), tokens_usados: 0 };
    return data;
  } catch {
    return { fecha: today(), tokens_usados: 0 };
  }
}

function save(data) {
  const dir = join(__dirname, 'data');
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(TOKEN_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

export function getTokensUsed() {
  return read().tokens_usados;
}

export function isTokenLimitReached() {
  return read().tokens_usados >= DAILY_LIMIT;
}

/** Suma tokens al contador diario y persiste. Devuelve el total actualizado. */
export function addTokens(count) {
  const data = read();
  data.tokens_usados += count;
  save(data);
  return data.tokens_usados;
}
