import { appendFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const LOG_DIR  = join(__dirname, 'logs');
const LOG_FILE = join(LOG_DIR, 'novedades.log');

// ─────────────────────────────────────────────
// Logging
// ─────────────────────────────────────────────

function ensureLogDir() {
  if (!existsSync(LOG_DIR)) mkdirSync(LOG_DIR, { recursive: true });
}

function timestamp() {
  return new Date().toISOString().replace('T', ' ').slice(0, 19);
}

function formatLog(level, message) {
  return `[${timestamp()}] [${level}] ${message}`;
}

export function logInfo(message) {
  const line = formatLog('INFO', message);
  console.log(`\x1b[36m${line}\x1b[0m`);
  ensureLogDir();
  appendFileSync(LOG_FILE, line + '\n', 'utf-8');
}

export function logSuccess(message) {
  const line = formatLog('OK  ', message);
  console.log(`\x1b[32m${line}\x1b[0m`);
  ensureLogDir();
  appendFileSync(LOG_FILE, line + '\n', 'utf-8');
}

export function logWarn(message) {
  const line = formatLog('WARN', message);
  console.warn(`\x1b[33m${line}\x1b[0m`);
  ensureLogDir();
  appendFileSync(LOG_FILE, line + '\n', 'utf-8');
}

export function logError(message) {
  const line = formatLog('ERR ', message);
  console.error(`\x1b[31m${line}\x1b[0m`);
  ensureLogDir();
  appendFileSync(LOG_FILE, line + '\n', 'utf-8');
}

// ─────────────────────────────────────────────
// Discord
// ─────────────────────────────────────────────

const CATEGORY_EMOJI = {
  ratones:    '🖱️',
  teclados:   '⌨️',
  monitores:  '🖥️',
  portatiles: '💻',
  setups:     '🏠',
  guias:      '📖',
};

async function discordPost(payload) {
  const url = process.env.DISCORD_WEBHOOK_URL;
  if (!url) return;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      logWarn(`Discord respondió ${res.status}: ${await res.text()}`);
    }
  } catch (e) {
    logWarn(`Error enviando notificación Discord: ${e.message}`);
  }
}

// ─────────────────────────────────────────────
// Notificación por borrador generado
// ─────────────────────────────────────────────

export async function notifyDraft({ title, slug, source, filePath, categoria, description }) {
  const msg = `BORRADOR GENERADO — "${title}" (fuente: ${source}) → ${filePath}`;
  logSuccess(msg);

  const emoji = CATEGORY_EMOJI[categoria] ?? '📝';
  const excerpt = description
    ? description.slice(0, 180) + (description.length > 180 ? '…' : '')
    : null;

  await discordPost({
    embeds: [{
      title: `${emoji} Nuevo borrador generado`,
      description: `**${title}**`,
      color: 0xF97316,  // naranja FitzDesk
      fields: [
        { name: 'Categoría', value: categoria ?? 'desconocida', inline: true },
        { name: 'Fuente',    value: source,                    inline: true },
        { name: 'Slug',      value: `\`${slug}\``,             inline: true },
        ...(excerpt ? [{ name: 'Extracto', value: excerpt, inline: false }] : []),
        {
          name: 'Próximos pasos',
          value: [
            '1. Abrir el archivo `borrador-' + slug + '.md`',
            '2. Completar precio, enlace de afiliado e imagen',
            '3. Revisar y editar el contenido generado',
            '4. Quitar `borrador: true` y renombrar el archivo',
            '5. Ejecutar `npm run build` para publicar',
          ].join('\n'),
          inline: false,
        },
      ],
      footer: { text: 'FitzDesk Monitor' },
      timestamp: new Date().toISOString(),
    }],
  });
}

// ─────────────────────────────────────────────
// Resumen al final de cada ejecución
// ─────────────────────────────────────────────

export async function notifySummary({ totalNew, totalDrafts, errors }) {
  if (!process.env.DISCORD_WEBHOOK_URL) return;

  // No enviar resumen si no encontramos nada y no hubo errores
  if (totalNew === 0 && errors.length === 0) return;

  const hasErrors = errors.length > 0;
  const color = hasErrors ? 0xEF4444 : totalDrafts > 0 ? 0x22C55E : 0x6B7280;
  const emoji = hasErrors ? '⚠️' : totalDrafts > 0 ? '✅' : 'ℹ️';

  const fields = [
    { name: 'Novedades detectadas', value: String(totalNew),    inline: true },
    { name: 'Borradores generados', value: String(totalDrafts), inline: true },
  ];

  if (hasErrors) {
    fields.push({
      name: `Fuentes con error (${errors.length})`,
      value: errors.map(e => `• ${e}`).join('\n'),
      inline: false,
    });
  }

  await discordPost({
    embeds: [{
      title: `${emoji} FitzDesk Monitor — Resumen de comprobación`,
      color,
      fields,
      footer: { text: 'FitzDesk Monitor' },
      timestamp: new Date().toISOString(),
    }],
  });
}
