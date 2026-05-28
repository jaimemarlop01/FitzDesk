import { appendFileSync, mkdirSync, existsSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const LOG_FILE  = join(__dirname, 'download.log');

// Limpiar log anterior al iniciar
writeFileSync(LOG_FILE, `=== FitzDesk Images — ${new Date().toISOString()} ===\n\n`, 'utf-8');

const results = [];

function write(line) {
  appendFileSync(LOG_FILE, line + '\n', 'utf-8');
}

export function logOk(slug, detail) {
  const line = `✅ ${slug} — ${detail}`;
  console.log(`\x1b[32m${line}\x1b[0m`);
  write(line);
  results.push({ status: 'ok', slug, detail });
}

export function logWarn(slug, detail) {
  const line = `⚠️  ${slug} — descarga manual necesaria: ${detail}`;
  console.warn(`\x1b[33m${line}\x1b[0m`);
  write(line);
  results.push({ status: 'warn', slug, detail });
}

export function logErr(slug, detail) {
  const line = `❌ ${slug} — error: ${detail}`;
  console.error(`\x1b[31m${line}\x1b[0m`);
  write(line);
  results.push({ status: 'err', slug, detail });
}

export function logInfo(msg) {
  console.log(`   \x1b[36m${msg}\x1b[0m`);
  write(`   ${msg}`);
}

export function logSection(title) {
  const line = `\n── ${title} ──`;
  console.log(`\x1b[1m${line}\x1b[0m`);
  write(line);
}

export function printSummary(startTime) {
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const ok   = results.filter(r => r.status === 'ok').length;
  const warn = results.filter(r => r.status === 'warn').length;
  const err  = results.filter(r => r.status === 'err').length;

  const lines = [
    '',
    '━'.repeat(52),
    'RESUMEN FINAL',
    `✅ Descargadas automáticamente : ${ok}/${results.length}`,
    warn > 0 ? `⚠️  Descarga manual necesaria   : ${warn}/${results.length}` : null,
    err  > 0 ? `❌ Errores                      : ${err}/${results.length}` : null,
    `⏱  Tiempo total                : ${elapsed}s`,
    '━'.repeat(52),
  ].filter(Boolean);

  lines.forEach(l => {
    console.log(l);
    write(l);
  });

  if (warn > 0) {
    const manual = results.filter(r => r.status === 'warn');
    const section = '\nIMAGENES QUE NECESITAN DESCARGA MANUAL:';
    console.log(`\x1b[33m${section}\x1b[0m`);
    write(section);
    manual.forEach(r => {
      const line = `  • ${r.slug}: ${r.detail}`;
      console.log(`\x1b[33m${line}\x1b[0m`);
      write(line);
    });

    const links = `
PRESS KITS DE FABRICANTES:
  Logitech : https://pressroom.logitech.com
  Keychron : https://www.keychron.com/pages/press-media
  LG       : https://www.lg.com/es/press-releases
  Dell     : https://www.dell.com/es-es/dt/newsroom
  ASUS     : https://www.asus.com/es/press/
  Lenovo   : https://news.lenovo.com/press-kits/
  BenQ     : https://www.benq.com/es-es/news/press-release/

Guarda la imagen descargada en:
  FitzDesk/public/images/articulos/[slug]-original.[ext]

Luego procésala con:
  node imageProcessor.js --file [slug]`;
    console.log(`\x1b[33m${links}\x1b[0m`);
    write(links);
  }

  write(`\n=== FIN — ${new Date().toISOString()} ===`);
}

export { results };
