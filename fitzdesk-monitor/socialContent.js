/**
 * FitzDesk Social Content
 * Lógica compartida de carga de artículo y generación de captions con Groq
 * (con fallback a plantilla fija), usada tanto por socialPublisher.js como
 * por socialReviewer.js. Vive en un módulo aparte para evitar una
 * dependencia circular entre ambos (el reviewer necesita poder generar el
 * mismo contenido que el publisher para su modo de prueba en solitario).
 */

import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import Groq from 'groq-sdk';

const __dirname    = path.dirname(fileURLToPath(import.meta.url));
const ARTICLES_DIR = path.join(__dirname, '..', 'src', 'content', 'articulos');

export const SITE_URL = 'https://fitzdesk.com';

const groqClient = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

export function logInfo(msg)  { console.log(`ℹ️  ${msg}`); }
export function logOk(msg)    { console.log(`✅ ${msg}`); }
export function logWarn(msg)  { console.warn(`⚠️  ${msg}`); }
export function logError(msg) { console.error(`❌ ${msg}`); }

// ─── Cargar artículo publicado ────────────────────────────────────────────────

export function loadArticle(slug) {
  const filePath = path.join(ARTICLES_DIR, `${slug}.md`);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Artículo no encontrado: ${slug}.md`);
  }
  const { data, content } = matter(fs.readFileSync(filePath, 'utf8'));
  return {
    title:       data.title ?? slug,
    descripcion: data.descripcion ?? '',
    categoria:   data.categoria ?? 'setups',
    puntuacion:  typeof data.puntuacion === 'number' ? data.puntuacion : null,
    precio:      data.precio ?? null,
    content:     content?.trim() ?? '',
  };
}

export function imageUrlFor(slug) {
  return `${SITE_URL}/images/articulos/${slug}.webp`;
}

// ─── Plantillas fijas (fallback si Groq falla) ─────────────────────────────────

export function buildInstagramCaption({ title, descripcion, categoria }) {
  const caption = [
    title,
    '',
    descripcion,
    '',
    `#${categoria} #teletrabajo #homeoffice #productividad #perifericos`,
  ].join('\n');
  return caption.slice(0, 2200);
}

export function buildFacebookCaption({ title, descripcion }, slug) {
  return [
    title,
    '',
    descripcion,
    '',
    '🔗 Lee el análisis completo:',
    `${SITE_URL}/articulo/${slug}`,
  ].join('\n');
}

export function buildPinterestDescription({ title, descripcion, categoria }) {
  return [
    title,
    '',
    descripcion,
    '',
    `#${categoria} #teletrabajo #homeoffice #setup #productividad #perifericos #trabajoremoto #officesetup #desksetup`,
  ].join('\n');
}

// ─── Captions generados con IA (Groq) — con fallback a plantilla fija ─────────

function buildInstagramPrompt({ title, descripcion, categoria, puntuacion, precio, content }) {
  return `Eres Fitz, la ardilla mascota de FitzDesk (web de análisis de periféricos y setups para teletrabajo, tono cercano y con personalidad pero profesional). Escribe el caption de Instagram para promocionar este artículo ya publicado.

ARTÍCULO
Título: ${title}
Categoría: ${categoria}
Descripción: ${descripcion}
${puntuacion !== null ? `Puntuación: ${puntuacion}/10` : ''}
${precio ? `Precio: ${precio}` : ''}

CONTENIDO DEL ANÁLISIS
${content}

Escribe el caption final siguiendo EXACTAMENTE esta estructura (sin etiquetas como "1." ni explicaciones, solo el texto final con líneas en blanco entre bloques):

1. Primera línea: un gancho (pregunta o afirmación) que pare el scroll, relacionado con el producto.
2. 2-3 líneas cortas con los beneficios más relevantes — tradúcelos a beneficio real para el lector, sin specs en crudo (nada de cifras técnicas sueltas tal cual).
3. El veredicto de Fitz en una sola frase con personalidad.
4. Exactamente esta línea de CTA: "Análisis completo en fitzdesk.com 🐿️"
5. Máximo 5 hashtags relevantes en español, en minúsculas, separados por espacios.

Español de España, sin emojis excesivos (máximo 2-3 en todo el texto). No inventes datos que no estén en el contenido del análisis.`;
}

function buildFacebookPrompt({ title, descripcion, categoria, puntuacion, precio, content }) {
  return `Eres Fitz, la ardilla mascota de FitzDesk (web de análisis de periféricos y setups para teletrabajo, tono cercano y con personalidad pero profesional). Escribe el texto del post de Facebook para este artículo ya publicado. No incluyas ningún enlace ni URL — se añade automáticamente después de tu texto.

ARTÍCULO
Título: ${title}
Categoría: ${categoria}
Descripción: ${descripcion}
${puntuacion !== null ? `Puntuación: ${puntuacion}/10` : ''}
${precio ? `Precio: ${precio}` : ''}

CONTENIDO DEL ANÁLISIS
${content}

Escribe el texto final siguiendo EXACTAMENTE esta estructura (sin etiquetas como "1." ni explicaciones, solo el texto final con líneas en blanco entre bloques):

1. Párrafo gancho (2-3 líneas) explicando por qué este producto es relevante para alguien que teletrabaja.
2. 3-4 puntos clave del análisis, cada uno en su propia línea empezando por "•".
3. Una pregunta dirigida a la audiencia para generar comentarios, relacionada con el tema del artículo (ej: "¿Usáis teclado Bluetooth o preferís cable?").
4. Máximo 2 hashtags al final, solo si aportan algo real.

No incluyas ningún enlace ni URL en tu respuesta (el enlace al artículo se añade automáticamente después y genera su propia vista previa). No inventes datos que no estén en el contenido del análisis. Español de España.`;
}

// Groq (llama-3.3-70b-versatile) mezcla ocasionalmente algún carácter CJK
// suelto en medio de palabras en español (bug conocido del modelo) — se
// eliminan como red de seguridad antes de publicar nada en redes sociales.
export function stripStrayCjk(text) {
  return text.replace(/[一-鿿㐀-䶿豈-﫿]/g, '');
}

// Errores de red transitorios (no de la API de Groq en sí) que merece la
// pena reintentar con una conexión nueva. "Premature close" es la firma
// clásica de un socket keep-alive que el servidor ya cerró pero el cliente
// reutiliza — bug conocido del fetch de Node, frecuente en runners de corta
// vida como GitHub Actions. Detectado el 2026-06-25: bloqueó la publicación
// de un artículo entero porque CADA llamada a Groq de esa ejecución falló
// con el mismo error, sin ningún reintento.
const ERRORES_RED_TRANSITORIOS = ['premature close', 'econnreset', 'fetch failed', 'socket hang up'];

function esErrorDeRedTransitorio(mensaje) {
  const m = mensaje.toLowerCase();
  return ERRORES_RED_TRANSITORIOS.some(p => m.includes(p));
}

export async function callGroq(prompt, maxTokens = 600, intentos = 3) {
  if (!groqClient) throw new Error('GROQ_API_KEY no configurada');

  let ultimoError;
  for (let intento = 1; intento <= intentos; intento++) {
    try {
      const completion = await groqClient.chat.completions.create({
        model:      'llama-3.3-70b-versatile',
        max_tokens: maxTokens,
        messages:   [{ role: 'user', content: prompt }],
      });
      const text = completion.choices[0]?.message?.content?.trim();
      if (!text) throw new Error('Groq no devolvió contenido');
      return stripStrayCjk(text);
    } catch (e) {
      ultimoError = e;
      const reintentar = intento < intentos && esErrorDeRedTransitorio(e.message ?? '');
      if (!reintentar) throw e;
      logWarn(`Groq: error de red transitorio (intento ${intento}/${intentos}, reintentando): ${e.message}`);
      await new Promise(r => setTimeout(r, 500 * intento));
    }
  }
  throw ultimoError;
}

export async function getInstagramCaption(article) {
  try {
    const text = await callGroq(buildInstagramPrompt(article));
    return text.slice(0, 2200);
  } catch (e) {
    logWarn(`Groq falló generando el caption de Instagram (${e.message}) — usando plantilla de respaldo`);
    return buildInstagramCaption(article);
  }
}

export async function getFacebookCaption(article, slug) {
  try {
    const text = await callGroq(buildFacebookPrompt(article));
    return `${text}\n\n${SITE_URL}/articulo/${slug}`;
  } catch (e) {
    logWarn(`Groq falló generando el texto de Facebook (${e.message}) — usando plantilla de respaldo`);
    return buildFacebookCaption(article, slug);
  }
}

// ─── Discord (notificaciones) ───────────────────────────────────────────────────

export async function notifyDiscordError(message, title = 'FitzDesk — Social Publisher') {
  const webhook = process.env.DISCORD_WEBHOOK_URL;
  if (!webhook) {
    logWarn('DISCORD_WEBHOOK_URL no configurada — no se puede notificar el error a Discord');
    return;
  }
  try {
    await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: '⚠️ Publicación en redes sociales fallida',
        embeds: [{ title, description: message.slice(0, 4000), color: 15548997 }],
      }),
    });
  } catch (e) {
    logError(`No se pudo notificar el fallo a Discord: ${e.message}`);
  }
}

// statusLines: [{ name: 'Instagram', value: '✅ id: 123' }, ...] — se notifica
// en cuanto al menos una red haya publicado correctamente, mostrando también
// el estado de las que fallaron u omitieron para que el mensaje sea completo.
export async function notifyDiscordSuccess({ title, slug, statusLines }) {
  const webhook = process.env.DISCORD_WEBHOOK_URL;
  if (!webhook) {
    logWarn('DISCORD_WEBHOOK_URL no configurada — no se puede notificar el éxito a Discord');
    return;
  }
  try {
    await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embeds: [{
          title:       '✅ Publicado en redes sociales',
          description: `**${title}**\n${SITE_URL}/articulo/${slug}`,
          color:       5763719,
          fields:      statusLines.map(({ name, value }) => ({ name, value, inline: true })),
        }],
      }),
    });
  } catch (e) {
    logError(`No se pudo notificar el éxito a Discord: ${e.message}`);
  }
}
