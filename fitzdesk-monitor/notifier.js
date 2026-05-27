import { appendFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const LOG_DIR  = join(__dirname, 'logs');
const LOG_FILE = join(LOG_DIR, 'novedades.log');

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

export async function notifyDraft({ title, slug, source, filePath }) {
  const msg = `BORRADOR GENERADO — "${title}" (fuente: ${source}) → ${filePath}`;
  logSuccess(msg);

  const discordUrl = process.env.DISCORD_WEBHOOK_URL;
  if (discordUrl) {
    try {
      await fetch(discordUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: null,
          embeds: [{
            title: '🐿️ FitzDesk — Nuevo borrador generado',
            description: `**${title}**\n\nFuente: ${source}\nSlug: \`${slug}\``,
            color: 0xF97316,
            footer: { text: 'FitzDesk Monitor' },
            timestamp: new Date().toISOString(),
          }],
        }),
      });
    } catch (e) {
      logWarn(`Error enviando notificación Discord: ${e.message}`);
    }
  }

  const slackUrl = process.env.SLACK_WEBHOOK_URL;
  if (slackUrl) {
    try {
      await fetch(slackUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `🐿️ *FitzDesk Monitor* — Nuevo borrador: *${title}*\nFuente: ${source}`,
        }),
      });
    } catch (e) {
      logWarn(`Error enviando notificación Slack: ${e.message}`);
    }
  }
}
