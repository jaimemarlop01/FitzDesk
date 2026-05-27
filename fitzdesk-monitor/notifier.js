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
  auriculares:'🎧',
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

export async function notifyDraft({ title, slug, source, filePath, categoria, description, imageUrl, articleUrl }) {
  const msg = `BORRADOR GENERADO — "${title}" (fuente: ${source}) → ${filePath}`;
  logSuccess(msg);

  const emoji    = CATEGORY_EMOJI[categoria] ?? '📝';
  const catLabel = categoria
    ? categoria.charAt(0).toUpperCase() + categoria.slice(1)
    : 'General';

  const embed = {
    title: '🐿️ Fitz ha detectado una novedad',
    color: 0xF97316,
    fields: [
      { name: '📦 Producto',    value: title.slice(0, 200),                          inline: false },
      { name: `${emoji} Categoría`, value: catLabel,                                 inline: true  },
      { name: '📡 Fuente',     value: articleUrl ? `[${source}](${articleUrl})` : source, inline: true },
      { name: '📝 Borrador',   value: `\`borrador-${slug}.md\``,                     inline: false },
      {
        name: '✅ Siguientes pasos',
        value: [
          '1. Completar precio y enlace de afiliado',
          '2. Revisar y editar el contenido generado',
          '3. Quitar `borrador: true` del frontmatter',
          '4. Renombrar el archivo (quitar prefijo `borrador-`)',
          '5. Ejecutar `npm run build` para publicar',
        ].join('\n'),
        inline: false,
      },
    ],
    footer: { text: `FitzDesk Monitor • ${timestamp()}` },
  };

  // Añadir imagen si se encontró una
  if (imageUrl) {
    embed.image = { url: imageUrl };
  }

  await discordPost({ embeds: [embed] });
}

// ─────────────────────────────────────────────
// Resumen al final de cada ejecución
// ─────────────────────────────────────────────

export async function notifySummary({ totalNew, totalDrafts, errors, totalDiscard = 0 }) {
  if (!process.env.DISCORD_WEBHOOK_URL) return;
  if (totalNew === 0 && errors.length === 0) return;

  const hasErrors = errors.length > 0;
  const color = hasErrors ? 0xEF4444 : totalDrafts > 0 ? 0x22C55E : 0x6B7280;
  const emoji = hasErrors ? '⚠️' : totalDrafts > 0 ? '✅' : 'ℹ️';

  const fields = [
    { name: '✅ Relevantes',         value: String(totalNew),     inline: true },
    { name: '📝 Borradores',         value: String(totalDrafts),  inline: true },
    { name: '🗑️ Descartados',        value: String(totalDiscard), inline: true },
  ];

  if (hasErrors) {
    fields.push({
      name:  `⚡ Fuentes con error (${errors.length})`,
      value: errors.map(e => `• ${e}`).join('\n'),
      inline: false,
    });
  }

  await discordPost({
    embeds: [{
      title: `${emoji} FitzDesk Monitor — Resumen`,
      color,
      fields,
      footer: { text: `FitzDesk Monitor • ${timestamp()}` },
    }],
  });
}

// ─────────────────────────────────────────────
// Resumen diario (se envía siempre a las 9 AM)
// ─────────────────────────────────────────────

export async function notifyDailySummary({ totalScanned, totalRelevant, totalDrafts, totalDiscard, errors, productos }) {
  if (!process.env.DISCORD_WEBHOOK_URL) return;

  const hasProducts = productos && productos.length > 0;

  await discordPost({
    embeds: [{
      title: '📊 Resumen diario de FitzDesk Monitor',
      color: 0xF97316,
      description: 'Aquí tienes el resumen de las últimas 24 horas',
      fields: [
        { name: '🔍 Artículos analizados', value: String(totalScanned ?? 0),  inline: true },
        { name: '✅ Relevantes',           value: String(totalRelevant ?? 0), inline: true },
        { name: '📝 Borradores generados', value: String(totalDrafts ?? 0),  inline: true },
        { name: '🗑️ Descartados',          value: String(totalDiscard ?? 0), inline: true },
        { name: '⚡ Fuentes con error',    value: String(errors?.length ?? 0), inline: true },
        ...(hasProducts ? [{
          name:   '📦 Productos detectados',
          value:  productos.slice(0, 10).join(', '),
          inline: false,
        }] : []),
      ],
      footer: { text: 'FitzDesk Monitor • Resumen diario' },
      timestamp: new Date().toISOString(),
    }],
  });
}
