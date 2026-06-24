#!/usr/bin/env node
/**
 * FitzDesk Social Publisher
 * Publica el artículo recién publicado en Instagram (carrusel de 4 slides)
 * y Facebook, usando imágenes optimizadas por red en vez de la imagen
 * original del artículo (se generan bajo demanda si no existen) y captions
 * generados con Groq adaptados al formato de cada red (con fallback a
 * plantilla fija si la IA falla). Pinterest está preparado en el código
 * pero desactivado (PINTEREST_ENABLED = false) hasta conseguir la
 * aprobación del scope pins:write en la API de Pinterest.
 *
 * Instagram: instagramImageGenerator.js genera 4 slides (Puppeteer, PNG
 * 1080x1350) — gancho visual, lo mejor, lo mejorable, veredicto de Fitz —
 * publicados como carrusel vía Graph API.
 * Facebook: socialImageGenerator.js (Sharp, WEBP 1200x630) — su función
 * generateInstagramImage() (Sharp, imagen única) quedó sustituida por el
 * carrusel y ya no se usa aquí, aunque sigue disponible en el archivo.
 *
 * Uso:
 *   node socialPublisher.js --slug [slug]                       # publicación real (ambas redes)
 *   node socialPublisher.js --slug [slug] --only facebook        # solo Facebook (reintentos sin duplicar Instagram)
 *   node socialPublisher.js --slug [slug] --only instagram       # solo Instagram
 *   node socialPublisher.js --test --slug [slug]                # modo test, no publica nada
 */

import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import Groq from 'groq-sdk';
import { generateFacebookImage } from './socialImageGenerator.js';
import { generateInstagramCarousel } from './instagramImageGenerator.js';

const __dirname    = path.dirname(fileURLToPath(import.meta.url));
const ARTICLES_DIR = path.join(__dirname, '..', 'src', 'content', 'articulos');
const REDES_DIR     = path.join(__dirname, '..', 'public', 'images', 'redes');
const SITE_URL      = 'https://fitzdesk.com';

const INSTAGRAM_SLIDE_COUNT = 4;

// Pinterest preparado pero desactivado — activar cuando se apruebe el scope
// pins:write en la API de Pinterest
const PINTEREST_ENABLED = false;

const groqClient = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

function logInfo(msg)  { console.log(`ℹ️  ${msg}`); }
function logOk(msg)    { console.log(`✅ ${msg}`); }
function logWarn(msg)  { console.warn(`⚠️  ${msg}`); }
function logError(msg) { console.error(`❌ ${msg}`); }

// ─── Cargar artículo publicado ────────────────────────────────────────────────

function loadArticle(slug) {
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

function imageUrlFor(slug) {
  return `${SITE_URL}/images/articulos/${slug}.webp`;
}

// Imagen de Facebook (Sharp/WEBP 1200x630) — generada una sola vez por
// artículo y reutilizada en reintentos. Si no existe en disco, se genera
// bajo demanda antes de publicar.
function facebookImagePath(slug) {
  return path.join(REDES_DIR, `${slug}-facebook.webp`);
}

function facebookImageUrlFor(slug) {
  return `${SITE_URL}/images/redes/${slug}-facebook.webp`;
}

async function ensureFacebookImage(slug) {
  if (fs.existsSync(facebookImagePath(slug))) return;
  logInfo('Imagen de Facebook no encontrada — generándola...');
  await generateFacebookImage(slug);
}

// Carrusel de Instagram (Puppeteer/PNG 1080x1350 x4 slides) — mismo criterio
// de generación bajo demanda que la imagen de Facebook.
function instagramSlidePath(slug, n) {
  return path.join(REDES_DIR, `${slug}-instagram-${n}.png`);
}

function instagramSlideUrlFor(slug, n) {
  return `${SITE_URL}/images/redes/${slug}-instagram-${n}.png`;
}

async function ensureInstagramCarousel(slug) {
  const allExist = Array.from({ length: INSTAGRAM_SLIDE_COUNT }, (_, i) => i + 1)
    .every(n => fs.existsSync(instagramSlidePath(slug, n)));
  if (allExist) return;
  logInfo('Carrusel de Instagram no encontrado — generando los 4 slides...');
  await generateInstagramCarousel(slug);
}

// ─── Construir contenido por red ──────────────────────────────────────────────

function buildInstagramCaption({ title, descripcion, categoria }) {
  const caption = [
    title,
    '',
    descripcion,
    '',
    `#${categoria} #teletrabajo #homeoffice #setup #productividad #perifericos`,
  ].join('\n');
  return caption.slice(0, 2200);
}

function buildFacebookCaption({ title, descripcion }, slug) {
  return [
    title,
    '',
    descripcion,
    '',
    '🔗 Lee el análisis completo:',
    `${SITE_URL}/articulo/${slug}`,
  ].join('\n');
}

function buildPinterestDescription({ title, descripcion, categoria }) {
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
// suelto en medio de palabras en español (bug conocido del modelo, visto
// también en borradores generados por analyzer.js) — se eliminan como red
// de seguridad antes de publicar nada en redes sociales.
function stripStrayCjk(text) {
  return text.replace(/[一-鿿㐀-䶿豈-﫿]/g, '');
}

async function callGroq(prompt) {
  if (!groqClient) throw new Error('GROQ_API_KEY no configurada');
  const completion = await groqClient.chat.completions.create({
    model:      'llama-3.3-70b-versatile',
    max_tokens: 600,
    messages:   [{ role: 'user', content: prompt }],
  });
  const text = completion.choices[0]?.message?.content?.trim();
  if (!text) throw new Error('Groq no devolvió contenido');
  return stripStrayCjk(text);
}

async function getInstagramCaption(article) {
  try {
    const text = await callGroq(buildInstagramPrompt(article));
    return text.slice(0, 2200);
  } catch (e) {
    logWarn(`Groq falló generando el caption de Instagram (${e.message}) — usando plantilla de respaldo`);
    return buildInstagramCaption(article);
  }
}

async function getFacebookCaption(article, slug) {
  try {
    const text = await callGroq(buildFacebookPrompt(article));
    return `${text}\n\n${SITE_URL}/articulo/${slug}`;
  } catch (e) {
    logWarn(`Groq falló generando el texto de Facebook (${e.message}) — usando plantilla de respaldo`);
    return buildFacebookCaption(article, slug);
  }
}

// ─── Discord (notificación de error) ──────────────────────────────────────────

async function notifyDiscordError(message) {
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
        embeds: [{ title: 'FitzDesk — Social Publisher', description: message.slice(0, 4000), color: 15548997 }],
      }),
    });
  } catch (e) {
    logError(`No se pudo notificar el fallo a Discord: ${e.message}`);
  }
}

// ─── Instagram ────────────────────────────────────────────────────────────────

// Tras crear el contenedor, Instagram tarda unos segundos en descargar y
// procesar la imagen antes de poder publicarlo — publicar antes de tiempo
// falla con "Media ID is not available" (código 9007). Se espera a que
// status_code pase a FINISHED, con un máximo de ~20s.
async function waitForContainerReady(containerId, accessToken, { retries = 10, delayMs = 2000 } = {}) {
  for (let i = 0; i < retries; i++) {
    const res  = await fetch(`https://graph.facebook.com/v25.0/${containerId}?fields=status_code&access_token=${accessToken}`);
    const data = await res.json();
    if (data.status_code === 'FINISHED') return;
    if (data.status_code === 'ERROR') {
      throw new Error(`Contenedor de Instagram en estado ERROR: ${JSON.stringify(data)}`);
    }
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }
  throw new Error('El contenedor de Instagram no estuvo listo a tiempo (timeout esperando status_code=FINISHED)');
}

// Crea un contenedor individual marcado como is_carousel_item — no se
// publica por separado, solo se referencia luego desde el contenedor de
// carrusel (children).
async function createCarouselItem(igAccountId, accessToken, imageUrl) {
  const res  = await fetch(`https://graph.facebook.com/v25.0/${igAccountId}/media`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ image_url: imageUrl, is_carousel_item: true, access_token: accessToken }),
  });
  const data = await res.json();
  if (!res.ok || !data.id) {
    throw new Error(`Error creando item de carrusel: ${JSON.stringify(data)}`);
  }
  return data.id;
}

async function publishInstagram(article, slug) {
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  const igAccountId = process.env.INSTAGRAM_ACCOUNT_ID;
  if (!accessToken) throw new Error('INSTAGRAM_ACCESS_TOKEN no configurado');
  if (!igAccountId) throw new Error('INSTAGRAM_ACCOUNT_ID no configurado');

  const caption = await getInstagramCaption(article);

  await ensureInstagramCarousel(slug);

  // Paso 1 — crear un contenedor por cada slide del carrusel y esperar a
  // que cada uno esté listo antes de seguir
  const itemIds = [];
  for (let n = 1; n <= INSTAGRAM_SLIDE_COUNT; n++) {
    const itemId = await createCarouselItem(igAccountId, accessToken, instagramSlideUrlFor(slug, n));
    await waitForContainerReady(itemId, accessToken);
    itemIds.push(itemId);
  }

  // Paso 2 — crear el contenedor de carrusel con los 4 IDs y el caption
  const carouselRes  = await fetch(`https://graph.facebook.com/v25.0/${igAccountId}/media`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ media_type: 'CAROUSEL', children: itemIds, caption, access_token: accessToken }),
  });
  const carouselData = await carouselRes.json();
  if (!carouselRes.ok || !carouselData.id) {
    throw new Error(`Error creando contenedor de carrusel: ${JSON.stringify(carouselData)}`);
  }
  await waitForContainerReady(carouselData.id, accessToken);

  // Paso 3 — publicar el carrusel
  const publishRes  = await fetch(`https://graph.facebook.com/v25.0/${igAccountId}/media_publish`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ creation_id: carouselData.id, access_token: accessToken }),
  });
  const publishData = await publishRes.json();
  if (!publishRes.ok || !publishData.id) {
    throw new Error(`Error publicando el carrusel de Instagram: ${JSON.stringify(publishData)}`);
  }

  return publishData.id;
}

// ─── Facebook ─────────────────────────────────────────────────────────────────

async function publishFacebook(article, slug) {
  const accessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
  const pageId       = process.env.FACEBOOK_PAGE_ID;
  if (!accessToken || !pageId) throw new Error('FACEBOOK_PAGE_ACCESS_TOKEN o FACEBOOK_PAGE_ID no configurados');

  const caption = await getFacebookCaption(article, slug);

  await ensureFacebookImage(slug);

  const res  = await fetch(`https://graph.facebook.com/v25.0/${pageId}/feed`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({
      message:      caption,
      link:         `${SITE_URL}/articulo/${slug}`,
      picture:      facebookImageUrlFor(slug),
      access_token: accessToken,
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.id) throw new Error(`Error publicando en Facebook: ${JSON.stringify(data)}`);
  return data.id;
}

// ─── Pinterest (preparado, desactivado) ───────────────────────────────────────

async function publishPinterest(article, slug) {
  const accessToken = process.env.PINTEREST_ACCESS_TOKEN;
  const boardId       = process.env.PINTEREST_BOARD_ID;
  if (!accessToken || !boardId) throw new Error('PINTEREST_ACCESS_TOKEN o PINTEREST_BOARD_ID no configurados');

  const res  = await fetch('https://api.pinterest.com/v5/pins', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
    body:    JSON.stringify({
      board_id:     boardId,
      media_source: { source_type: 'image_url', url: imageUrlFor(slug) },
      title:        article.title,
      description:  buildPinterestDescription(article),
      link:         `${SITE_URL}/articulo/${slug}`,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Error publicando en Pinterest: ${JSON.stringify(data)}`);
  return data.id;
}

// ─── Modo test ────────────────────────────────────────────────────────────────

function printBlock(title, text) {
  console.log(`\n${title}`);
  console.log('   ' + '─'.repeat(50));
  console.log(text.split('\n').map(l => '   ' + l).join('\n'));
  console.log('   ' + '─'.repeat(50));
}

async function runTest(article, slug, runInstagram, runFacebook) {
  console.log('\n━━━ FitzDesk Social Publisher — MODO TEST (no publica nada) ━━━');

  console.log('\n📦 Secrets disponibles (solo presencia, nunca el valor):');
  const secretChecks = [
    ['GROQ_API_KEY',               process.env.GROQ_API_KEY],
    ['INSTAGRAM_ACCESS_TOKEN',      process.env.INSTAGRAM_ACCESS_TOKEN],
    ['INSTAGRAM_ACCOUNT_ID',       process.env.INSTAGRAM_ACCOUNT_ID],
    ['INSTAGRAM_APP_ID',           process.env.INSTAGRAM_APP_ID],
    ['INSTAGRAM_APP_SECRET',       process.env.INSTAGRAM_APP_SECRET],
    ['FACEBOOK_PAGE_ACCESS_TOKEN', process.env.FACEBOOK_PAGE_ACCESS_TOKEN],
    ['FACEBOOK_PAGE_ID',           process.env.FACEBOOK_PAGE_ID],
    ['PINTEREST_ACCESS_TOKEN',     process.env.PINTEREST_ACCESS_TOKEN],
    ['PINTEREST_BOARD_ID',         process.env.PINTEREST_BOARD_ID],
    ['DISCORD_WEBHOOK_URL',        process.env.DISCORD_WEBHOOK_URL],
  ];
  for (const [name, value] of secretChecks) {
    console.log(`   ${value ? '✅' : '❌'} ${name}`);
  }

  console.log('\n📸 Imágenes que se usarían (se generan bajo demanda si no existen):');
  for (let n = 1; n <= INSTAGRAM_SLIDE_COUNT; n++) {
    const exists = fs.existsSync(instagramSlidePath(slug, n));
    console.log(`   ${exists ? '✅ ya existe' : '⏳ se generaría'} — Instagram slide ${n}: ${instagramSlideUrlFor(slug, n)}`);
  }
  const fbExists = fs.existsSync(facebookImagePath(slug));
  console.log(`   ${fbExists ? '✅ ya existe' : '⏳ se generaría'} — Facebook: ${facebookImageUrlFor(slug)}`);

  if (runInstagram) {
    const caption = await getInstagramCaption(article);
    printBlock('📷 Instagram — caption que se publicaría (IA con fallback a plantilla):', caption);
  } else {
    console.log('\n📷 Instagram — omitido (--only facebook)');
  }

  if (runFacebook) {
    const caption = await getFacebookCaption(article, slug);
    printBlock('📘 Facebook — texto que se publicaría (IA con fallback a plantilla):', caption);
  } else {
    console.log('\n📘 Facebook — omitido (--only instagram)');
  }

  console.log(`\n📌 Pinterest — ${PINTEREST_ENABLED ? 'ACTIVADO' : 'DESACTIVADO (PINTEREST_ENABLED = false)'}`);
  if (PINTEREST_ENABLED) {
    printBlock('Pinterest — descripción que se publicaría:', buildPinterestDescription(article));
  }

  console.log('\n✅ Modo test completado — no se ha publicado nada real.\n');
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const args    = process.argv.slice(2);
  const isTest  = args.includes('--test');
  const slugIdx = args.indexOf('--slug');
  const slug    = slugIdx !== -1 ? args[slugIdx + 1] : null;
  const onlyIdx = args.indexOf('--only');
  const only    = onlyIdx !== -1 ? args[onlyIdx + 1] : null;

  if (only && only !== 'instagram' && only !== 'facebook') {
    console.error('--only debe ser "instagram" o "facebook"');
    process.exit(1);
  }

  if (!slug) {
    console.error('Uso: node socialPublisher.js [--test] [--only instagram|facebook] --slug [slug]');
    process.exit(1);
  }

  const runInstagram = !only || only === 'instagram';
  const runFacebook  = !only || only === 'facebook';

  let article;
  try {
    article = loadArticle(slug);
  } catch (e) {
    console.error(`❌ ${e.message}`);
    process.exit(1);
  }

  if (isTest) {
    await runTest(article, slug, runInstagram, runFacebook);
    return;
  }

  console.log(`\n━━━ FitzDesk Social Publisher — ${slug} ━━━\n`);

  const results = { instagram: null, facebook: null, pinterest: null };
  const errors  = [];

  // Instagram — si falla, loguear y continuar con Facebook
  if (runInstagram) {
    try {
      results.instagram = await publishInstagram(article, slug);
      logOk(`Instagram publicado — id: ${results.instagram}`);
    } catch (e) {
      logError(`Instagram: ${e.message}`);
      errors.push(`Instagram: ${e.message}`);
    }
  } else {
    logInfo('Instagram omitido (--only facebook)');
  }

  // Facebook — si falla, loguear claramente
  if (runFacebook) {
    try {
      results.facebook = await publishFacebook(article, slug);
      logOk(`Facebook publicado — id: ${results.facebook}`);
    } catch (e) {
      logError(`Facebook: ${e.message}`);
      errors.push(`Facebook: ${e.message}`);
    }
  } else {
    logInfo('Facebook omitido (--only instagram)');
  }

  if (PINTEREST_ENABLED) {
    try {
      results.pinterest = await publishPinterest(article, slug);
      logOk(`Pinterest publicado — id: ${results.pinterest}`);
    } catch (e) {
      logError(`Pinterest: ${e.message}`);
      errors.push(`Pinterest: ${e.message}`);
    }
  } else {
    logInfo('Pinterest desactivado (PINTEREST_ENABLED = false) — omitido');
  }

  // Si todas las redes intentadas fallaron, notificar a Discord — nunca fallar en silencio
  const anySucceeded = (runInstagram && results.instagram) || (runFacebook && results.facebook);
  if (!anySucceeded) {
    const failedNetworks = [];
    if (runInstagram && !results.instagram) failedNetworks.push('Instagram');
    if (runFacebook && !results.facebook) failedNetworks.push('Facebook');
    await notifyDiscordError(
      `${failedNetworks.join(' y ')} fallaron al publicar "${article.title}" (${slug}):\n${errors.join('\n')}`
    );
  }

  console.log('\n━━━ Resumen ━━━');
  console.log(`Instagram : ${runInstagram ? (results.instagram ? '✅' : '❌') : '⏭️  omitido'}`);
  console.log(`Facebook  : ${runFacebook  ? (results.facebook  ? '✅' : '❌') : '⏭️  omitido'}`);
  console.log(`Pinterest : ${PINTEREST_ENABLED ? (results.pinterest ? '✅' : '❌') : '⏭️  desactivado'}`);
}

main().catch(e => {
  console.error('Error crítico:', e.message);
  process.exit(1);
});
