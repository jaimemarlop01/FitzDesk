#!/usr/bin/env node
/**
 * FitzDesk Social Publisher
 * Publica el artículo recién publicado en Instagram (carrusel de 4 slides
 * para análisis normales, 3 para ofertas — ver slideCountFor()) y Facebook,
 * usando imágenes optimizadas por red en vez de la imagen
 * original del artículo (se generan bajo demanda si no existen) y captions
 * generados con Groq adaptados al formato de cada red (con fallback a
 * plantilla fija si la IA falla). Antes de publicar, socialReviewer.js
 * revisa imágenes y textos — si encuentra un fallo corregible, lo corrige
 * y sigue; si encuentra un fallo no corregible, bloquea la publicación y
 * se notifica por Discord. Pinterest está preparado en el código pero
 * desactivado (PINTEREST_ENABLED = false) hasta conseguir la aprobación
 * del scope pins:write en la API de Pinterest.
 *
 * Instagram: instagramImageGenerator.js genera 4 slides para análisis (o 3
 * para ofertas) (Puppeteer, PNG 1080x1350) — gancho visual, lo mejor, lo
 * mejorable, veredicto de Fitz (o gancho de oferta, por qué comprarlo
 * ahora, veredicto urgente) — publicados como carrusel vía Graph API.
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
import { generateInstagramCarousel, generateOfertaCarousel, isOfertaArticle } from './instagramImageGenerator.js';
import {
  SITE_URL, logInfo, logOk, logWarn, logError,
  loadArticle, imageUrlFor, buildPinterestDescription,
  getInstagramCaption, getFacebookCaption, notifyDiscordError, notifyDiscordSuccess,
} from './socialContent.js';
import { reviewBeforePublish } from './socialReviewer.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REDES_DIR  = path.join(__dirname, '..', 'public', 'images', 'redes');

// Las ofertas usan un carrusel de 3 slides (gancho de oferta, razones,
// veredicto con urgencia) en vez de los 4 slides del carrusel normal
// (gancho, lo mejor, lo mejorable, veredicto) — TAREA 4, modo PCDays.
function slideCountFor(slug) {
  return isOfertaArticle(slug) ? 3 : 4;
}

// Pinterest preparado pero desactivado — activar cuando se apruebe el scope
// pins:write en la API de Pinterest
const PINTEREST_ENABLED = false;

// Facebook desactivado — los posts publicados vía API (token del Usuario del
// Sistema) no son visibles para usuarios no-administradores. Se publica a mano
// pegando la URL en Facebook, que genera la preview del artículo a partir de
// og:image/og:title/og:description. Activar cuando se resuelva el bug del token.
const FACEBOOK_ENABLED = false;

// Carrusel de Instagram (Puppeteer/PNG 1080x1350) — mismo criterio de
// generación bajo demanda que la imagen de Facebook.
function instagramSlidePath(slug, n) {
  return path.join(REDES_DIR, `${slug}-instagram-${n}.png`);
}

function instagramSlideUrlFor(slug, n) {
  return `${SITE_URL}/images/redes/${slug}-instagram-${n}.png`;
}

async function ensureInstagramCarousel(slug) {
  const slideCount = slideCountFor(slug);
  const allExist = Array.from({ length: slideCount }, (_, i) => i + 1)
    .every(n => fs.existsSync(instagramSlidePath(slug, n)));
  if (allExist) return;
  logInfo(`Carrusel de Instagram no encontrado — generando los ${slideCount} slides...`);
  if (slideCount === 3) await generateOfertaCarousel(slug);
  else await generateInstagramCarousel(slug);
}

// ─── Instagram ────────────────────────────────────────────────────────────────

// Tras crear el contenedor, Instagram tarda unos segundos en descargar y
// procesar la imagen antes de poder publicarlo — publicar antes de tiempo
// falla con "Media ID is not available" (código 9007). Se espera a que
// status_code pase a FINISHED, con un máximo de ~20s.
async function waitForContainerReady(containerId, accessToken, { retries = 10, delayMs = 2000 } = {}) {
  for (let i = 0; i < retries; i++) {
    const res  = await fetch(`https://graph.facebook.com/v25.0/${containerId}?fields=status_code&access_token=${accessToken}`, { signal: AbortSignal.timeout(15000) });
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
    signal:  AbortSignal.timeout(15000),
  });
  const data = await res.json();
  if (!res.ok || !data.id) {
    throw new Error(`Error creando item de carrusel: ${JSON.stringify(data)}`);
  }
  return data.id;
}

// El caption ya viene generado (y revisado/corregido) desde fuera — esta
// función ya no llama a Groq directamente, solo publica.
async function publishInstagram(slug, caption) {
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  const igAccountId = process.env.INSTAGRAM_ACCOUNT_ID;
  if (!accessToken) throw new Error('INSTAGRAM_ACCESS_TOKEN no configurado');
  if (!igAccountId) throw new Error('INSTAGRAM_ACCOUNT_ID no configurado');

  await ensureInstagramCarousel(slug);

  // Paso 1 — crear un contenedor por cada slide del carrusel y esperar a
  // que cada uno esté listo antes de seguir
  const itemIds = [];
  for (let n = 1; n <= slideCountFor(slug); n++) {
    const itemId = await createCarouselItem(igAccountId, accessToken, instagramSlideUrlFor(slug, n));
    await waitForContainerReady(itemId, accessToken);
    itemIds.push(itemId);
  }

  // Paso 2 — crear el contenedor de carrusel con los IDs (4 o 3 según slideCountFor) y el caption
  const carouselRes  = await fetch(`https://graph.facebook.com/v25.0/${igAccountId}/media`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ media_type: 'CAROUSEL', children: itemIds, caption, access_token: accessToken }),
    signal:  AbortSignal.timeout(15000),
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
    signal:  AbortSignal.timeout(15000),
  });
  const publishData = await publishRes.json();
  if (!publishRes.ok || !publishData.id) {
    throw new Error(`Error publicando el carrusel de Instagram: ${JSON.stringify(publishData)}`);
  }

  return publishData.id;
}

// ─── Facebook ─────────────────────────────────────────────────────────────────

async function publishFacebook(slug, caption) {
  const accessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
  const pageId       = process.env.FACEBOOK_PAGE_ID;
  if (!accessToken || !pageId) throw new Error('FACEBOOK_PAGE_ACCESS_TOKEN o FACEBOOK_PAGE_ID no configurados');

  // Sin parámetro "picture": Meta rechaza sobreescribir picture/name/
  // description en /feed salvo que el dominio esté verificado como propio
  // en Business Manager (error #100 "Only owners of the URL...", detectado
  // el 2026-06-25). FitzDesk ya tiene og:image/og:title/og:description
  // correctos en cada artículo (BaseLayout.astro), así que Facebook genera
  // la vista previa solo a partir del "link" sin necesitar el override.
  const res  = await fetch(`https://graph.facebook.com/v25.0/${pageId}/feed`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    signal:  AbortSignal.timeout(15000),
    body:    JSON.stringify({
      message:      caption,
      link:         `${SITE_URL}/articulo/${slug}`,
      published:    true,
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
    signal:  AbortSignal.timeout(15000),
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

  console.log('\n📸 Imágenes de Instagram (se generan bajo demanda si no existen; deben quedar publicadas en producción antes de llamar a la API de Meta):');
  for (let n = 1; n <= slideCountFor(slug); n++) {
    const exists = fs.existsSync(instagramSlidePath(slug, n));
    console.log(`   ${exists ? '✅ ya existe' : '⏳ se generaría'} — Instagram slide ${n}: ${instagramSlideUrlFor(slug, n)}`);
  }
  console.log('   Facebook ya no usa una imagen propia — Meta genera la vista previa a partir del og:image del artículo.');

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
    console.log(`\n📘 Facebook — ${FACEBOOK_ENABLED ? 'omitido (--only instagram)' : 'DESACTIVADO (FACEBOOK_ENABLED = false) — se publica a mano'}`);
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
  const runFacebook  = FACEBOOK_ENABLED && (!only || only === 'facebook');

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

  // Generar el contenido y las imágenes ANTES de revisar, para que el
  // reviewer compruebe exactamente lo que se va a publicar.
  let instagramCaption = runInstagram ? await getInstagramCaption(article) : null;
  let facebookCaption  = runFacebook  ? await getFacebookCaption(article, slug) : null;
  if (runInstagram) await ensureInstagramCarousel(slug);

  logInfo('Revisando imágenes y textos antes de publicar...');
  const review = await reviewBeforePublish(slug, {
    instagramCaption, facebookCaption, runInstagram, runFacebook,
  });
  instagramCaption = review.instagramCaption;
  facebookCaption  = review.facebookCaption;

  if (!review.ok) {
    logError('La revisión automática bloqueó la publicación:');
    review.blockers.forEach(b => logError(`  - ${b}`));
    await notifyDiscordError(
      `La revisión automática bloqueó la publicación de "${article.title}" (${slug}):\n${review.blockers.join('\n')}`,
      'FitzDesk — Social Reviewer',
    );
    console.log('\n━━━ Resumen ━━━');
    console.log(`Instagram : ${runInstagram ? '🚫 bloqueado por revisión' : '⏭️  omitido'}`);
    console.log(`Facebook  : ${runFacebook  ? '🚫 bloqueado por revisión' : '⏭️  omitido'}`);
    return;
  }
  logOk('Revisión completada — listo para publicar');

  // Instagram — si falla, loguear y continuar con Facebook
  if (runInstagram) {
    try {
      results.instagram = await publishInstagram(slug, instagramCaption);
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
      results.facebook = await publishFacebook(slug, facebookCaption);
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

  // Si todas las redes intentadas fallaron, notificar a Discord — nunca fallar
  // en silencio. Si al menos una se publicó, notificar también el éxito (con
  // el estado de cada red, incluida la que haya fallado) — antes no se
  // avisaba de nada cuando todo iba bien, solo se veía en los logs.
  const anySucceeded = (runInstagram && results.instagram) || (runFacebook && results.facebook);
  const statusLines  = [];
  if (runInstagram) {
    statusLines.push({
      name:  'Instagram',
      value: results.instagram ? `✅ id: ${results.instagram}` : `❌ ${errors.find(e => e.startsWith('Instagram:')) ?? 'fallo desconocido'}`,
    });
  }
  if (runFacebook) {
    statusLines.push({
      name:  'Facebook',
      value: results.facebook ? `✅ id: ${results.facebook}` : `❌ ${errors.find(e => e.startsWith('Facebook:')) ?? 'fallo desconocido'}`,
    });
  }

  if (!anySucceeded) {
    const failedNetworks = [];
    if (runInstagram && !results.instagram) failedNetworks.push('Instagram');
    if (runFacebook && !results.facebook) failedNetworks.push('Facebook');
    await notifyDiscordError(
      `${failedNetworks.join(' y ')} fallaron al publicar "${article.title}" (${slug}):\n${errors.join('\n')}`
    );
  } else {
    await notifyDiscordSuccess({ title: article.title, slug, statusLines });
  }

  console.log('\n━━━ Resumen ━━━');
  console.log(`Instagram : ${runInstagram ? (results.instagram ? '✅' : '❌') : '⏭️  omitido'}`);
  console.log(`Facebook  : ${FACEBOOK_ENABLED ? (runFacebook ? (results.facebook ? '✅' : '❌') : '⏭️  omitido') : '⏭️  desactivado (manual)'}`);
  console.log(`Pinterest : ${PINTEREST_ENABLED ? (results.pinterest ? '✅' : '❌') : '⏭️  desactivado'}`);
}

// Solo ejecutar main() al lanzar el script directamente — sin esta guarda,
// importar cualquier función de este módulo desde otro script dispara el
// CLI sin querer (mismo bug encontrado y corregido en offerGenerator.js el
// 2026-06-25).
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch(e => {
    console.error('Error crítico:', e.message);
    process.exit(1);
  });
}
