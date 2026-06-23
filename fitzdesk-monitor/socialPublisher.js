#!/usr/bin/env node
/**
 * FitzDesk Social Publisher
 * Publica el artículo recién publicado en Instagram y Facebook.
 * Pinterest está preparado en el código pero desactivado (PINTEREST_ENABLED = false)
 * hasta conseguir la aprobación del scope pins:write en la API de Pinterest.
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

const __dirname    = path.dirname(fileURLToPath(import.meta.url));
const ARTICLES_DIR = path.join(__dirname, '..', 'src', 'content', 'articulos');
const SITE_URL      = 'https://fitzdesk.com';

// Pinterest preparado pero desactivado — activar cuando se apruebe el scope
// pins:write en la API de Pinterest
const PINTEREST_ENABLED = false;

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
  const { data } = matter(fs.readFileSync(filePath, 'utf8'));
  return {
    title:       data.title ?? slug,
    descripcion: data.descripcion ?? '',
    categoria:   data.categoria ?? 'setups',
  };
}

function imageUrlFor(slug) {
  return `${SITE_URL}/images/articulos/${slug}.webp`;
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

async function publishInstagram(article, slug) {
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  const igAccountId = process.env.INSTAGRAM_ACCOUNT_ID;
  if (!accessToken) throw new Error('INSTAGRAM_ACCESS_TOKEN no configurado');
  if (!igAccountId) throw new Error('INSTAGRAM_ACCOUNT_ID no configurado');

  const caption  = buildInstagramCaption(article);
  const imageUrl = imageUrlFor(slug);

  // Paso 1 — crear contenedor
  const createRes  = await fetch(`https://graph.facebook.com/v25.0/${igAccountId}/media`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ image_url: imageUrl, caption, access_token: accessToken }),
  });
  const createData = await createRes.json();
  if (!createRes.ok || !createData.id) {
    throw new Error(`Error creando contenedor de Instagram: ${JSON.stringify(createData)}`);
  }

  // Paso 2 — publicar contenedor
  const publishRes  = await fetch(`https://graph.facebook.com/v25.0/${igAccountId}/media_publish`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ creation_id: createData.id, access_token: accessToken }),
  });
  const publishData = await publishRes.json();
  if (!publishRes.ok || !publishData.id) {
    throw new Error(`Error publicando en Instagram: ${JSON.stringify(publishData)}`);
  }

  return publishData.id;
}

// ─── Facebook ─────────────────────────────────────────────────────────────────

async function publishFacebook(article, slug) {
  const accessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
  const pageId       = process.env.FACEBOOK_PAGE_ID;
  if (!accessToken || !pageId) throw new Error('FACEBOOK_PAGE_ACCESS_TOKEN o FACEBOOK_PAGE_ID no configurados');

  // TODO temporal de depuración (2026-06-23) — quitar en cuanto se confirme el
  // origen del error de permisos. No imprime el token completo ni un prefijo
  // (el enmascarado automático de GitHub Actions solo oculta el valor exacto
  // del secreto, no subcadenas parciales — el repo es público, así que un
  // prefijo largo quedaría expuesto en un log visible para cualquiera).
  logInfo(`[debug] FACEBOOK_PAGE_ACCESS_TOKEN: longitud=${accessToken.length}, termina en "...${accessToken.slice(-4)}"`);

  const caption = buildFacebookCaption(article, slug);

  const res  = await fetch(`https://graph.facebook.com/v25.0/${pageId}/feed`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({
      message:      caption,
      link:         `${SITE_URL}/articulo/${slug}`,
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

function runTest(article, slug, runInstagram, runFacebook) {
  console.log('\n━━━ FitzDesk Social Publisher — MODO TEST (no publica nada) ━━━');

  console.log('\n📦 Secrets disponibles (solo presencia, nunca el valor):');
  const secretChecks = [
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

  console.log('\n📸 Imagen que se usaría:');
  console.log(`   ${imageUrlFor(slug)}`);

  if (runInstagram) {
    printBlock('📷 Instagram — caption que se publicaría:', buildInstagramCaption(article));
  } else {
    console.log('\n📷 Instagram — omitido (--only facebook)');
  }

  if (runFacebook) {
    printBlock('📘 Facebook — caption que se publicaría:', buildFacebookCaption(article, slug));
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
    runTest(article, slug, runInstagram, runFacebook);
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
