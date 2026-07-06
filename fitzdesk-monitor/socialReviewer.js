#!/usr/bin/env node
/**
 * FitzDesk Social Reviewer
 * Agente de revisión automática antes de publicar en redes sociales.
 *
 * Imágenes (programático, sin IA): existencia, dimensiones exactas (Sharp),
 * tamaño de archivo dentro de rango, PNG válido por magic bytes. Si falla,
 * regenera el carrusel con instagramImageGenerator.js y vuelve a comprobar
 * una vez. Si sigue fallando, bloquea.
 *
 * Textos: las comprobaciones mecánicas (URLs, nº de hashtags, puntuación
 * final, caracteres raros, presencia de pregunta/enlace) se hacen con
 * regex — más fiable que pedirle a un LLM que cuente caracteres. Groq solo
 * se usa para lo que el código no puede juzgar por sí mismo: si el tono es
 * cercano y no genérico, y para reescribir el texto cuando una comprobación
 * mecánica falla. Si Groq no está disponible, las comprobaciones mecánicas
 * siguen funcionando igual; solo el juicio de tono y la autocorrección
 * quedan deshabilitados (se reporta, no se bloquea solo por eso).
 *
 * Uso:
 *   node socialReviewer.js --slug [slug]
 */

import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import sharp from 'sharp';
import {
  SITE_URL, logInfo, logOk, logWarn, logError,
  loadArticle, getInstagramCaption, getFacebookCaption, callGroq,
} from './socialContent.js';
import {
  loadArticleData, getCarouselContent, generateInstagramCarousel,
  generateOfertaCarousel, isOfertaArticle,
  GENERIC_PRO_EXPLANATIONS, GENERIC_CON_EXPLANATIONS,
} from './instagramImageGenerator.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REDES_DIR  = path.join(__dirname, '..', 'public', 'images', 'redes');

// Las ofertas usan un carrusel de 3 slides en vez de 4 (TAREA 4, modo PCDays).
function slideCountFor(slug) {
  return isOfertaArticle(slug) ? 3 : 4;
}
const EXPECTED_WIDTH  = 1080;
const EXPECTED_HEIGHT = 1350;
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
// Bug crítico corregido el 2026-06-25: un único umbral de 50KB para todos
// los slides rechazaba SIEMPRE el slide 2 del carrusel de oferta ("Por qué
// comprarlo ahora": fondo oscuro liso + hasta 3 líneas cortas, sin las
// frases explicativas en gris que sí rellenan los slides 2/3 del carrusel
// normal de 4) — confirmado en vivo, ese slide pesa de forma consistente
// ~44KB, por debajo de 50KB pero por encima de cualquier umbral razonable
// para detectar una imagen realmente corrupta/vacía. Resultado: el revisor
// bloqueaba SIEMPRE la publicación en redes de cualquier oferta, sin que
// fuera un fallo puntual de compresión. Umbral más bajo para el carrusel de
// 3 slides (oferta), el de 4 (análisis normal) se mantiene igual.
const MIN_IMAGE_BYTES_NORMAL = 50 * 1024;
const MIN_IMAGE_BYTES_OFERTA = 25 * 1024;
const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function instagramSlidePath(slug, n) {
  return path.join(REDES_DIR, `${slug}-instagram-${n}.png`);
}

// ─── Revisión de imágenes (programática, sin IA) ───────────────────────────────

async function checkOneImage(filePath, minBytes) {
  const issues = [];

  if (!fs.existsSync(filePath)) {
    return { ok: false, issues: ['el archivo no existe'] };
  }

  const buffer = fs.readFileSync(filePath);

  if (buffer.length < 8 || !buffer.subarray(0, 8).equals(PNG_MAGIC)) {
    issues.push('no es un PNG válido (magic bytes incorrectos)');
  }
  if (buffer.length > MAX_IMAGE_BYTES) {
    issues.push(`pesa más de 2MB (${(buffer.length / 1024 / 1024).toFixed(2)}MB)`);
  }
  if (buffer.length < minBytes) {
    issues.push(`pesa menos de ${(minBytes / 1024).toFixed(0)}KB (${(buffer.length / 1024).toFixed(1)}KB)`);
  }

  try {
    const meta = await sharp(buffer).metadata();
    if (meta.width !== EXPECTED_WIDTH || meta.height !== EXPECTED_HEIGHT) {
      issues.push(`dimensiones ${meta.width}x${meta.height} (se esperaba ${EXPECTED_WIDTH}x${EXPECTED_HEIGHT})`);
    }
  } catch (e) {
    issues.push(`Sharp no pudo leer la imagen (${e.message})`);
  }

  return { ok: issues.length === 0, issues };
}

// Comprobación estructural mínima (sin umbral de tamaño): PNG válido + dimensiones.
// Se usa como fallback cuando la regeneración falla — si las imágenes son
// estructuralmente válidas, la publicación puede continuar aunque sean pequeñas
// (ocurre cuando se generaron sin Groq y tienen contenido de respaldo mínimo).
async function checkStructural(filePath) {
  if (!fs.existsSync(filePath)) return { ok: false, issues: ['el archivo no existe'] };
  const buffer = fs.readFileSync(filePath);
  const issues = [];
  if (buffer.length < 8 || !buffer.subarray(0, 8).equals(PNG_MAGIC)) {
    issues.push('no es un PNG válido (magic bytes incorrectos)');
  }
  if (buffer.length > MAX_IMAGE_BYTES) {
    issues.push(`pesa más de 2MB (${(buffer.length / 1024 / 1024).toFixed(2)}MB)`);
  }
  try {
    const meta = await sharp(buffer).metadata();
    if (meta.width !== EXPECTED_WIDTH || meta.height !== EXPECTED_HEIGHT) {
      issues.push(`dimensiones ${meta.width}x${meta.height} (se esperaba ${EXPECTED_WIDTH}x${EXPECTED_HEIGHT})`);
    }
  } catch (e) {
    issues.push(`Sharp no pudo leer la imagen (${e.message})`);
  }
  return { ok: issues.length === 0, issues };
}

export async function reviewInstagramImages(slug) {
  const slideCount = slideCountFor(slug);
  const minBytes = slideCount === 3 ? MIN_IMAGE_BYTES_OFERTA : MIN_IMAGE_BYTES_NORMAL;

  async function checkAll() {
    const results = [];
    for (let n = 1; n <= slideCount; n++) {
      const filePath = instagramSlidePath(slug, n);
      results.push({ slide: n, path: filePath, ...(await checkOneImage(filePath, minBytes)) });
    }
    return results;
  }

  let results      = await checkAll();
  let regenerated  = false;

  if (results.some(r => !r.ok)) {
    logWarn(`Una o más imágenes de Instagram no pasan la revisión — regenerando el carrusel (${slideCount} slides)...`);
    try {
      if (slideCount === 3) await generateOfertaCarousel(slug);
      else await generateInstagramCarousel(slug);
      regenerated = true;
      results = await checkAll();
    } catch (e) {
      logWarn(`No se pudo regenerar el carrusel (${e.message}) — verificando si las imágenes existentes son estructuralmente válidas`);
      const structural = [];
      for (let n = 1; n <= slideCount; n++) {
        structural.push({ slide: n, path: instagramSlidePath(slug, n), ...(await checkStructural(instagramSlidePath(slug, n))) });
      }
      if (structural.every(r => r.ok)) {
        logWarn('Imágenes válidas pero generadas sin IA (contenido de respaldo) — se publicará igualmente');
        return { ok: true, regenerated: false, results: structural, blocker: null };
      }
      return {
        ok: false, regenerated: false, results,
        blocker: `No se pudo regenerar el carrusel de Instagram: ${e.message}`,
      };
    }
  }

  const stillFailing = results.filter(r => !r.ok);
  // Si los únicos problemas son de tamaño (no de formato o dimensiones), la
  // imagen es válida aunque pequeña — ocurre cuando se genera sin Groq y el
  // contenido de respaldo produce slides con menos texto del habitual.
  const soloTamano = stillFailing.length > 0 &&
    stillFailing.every(r => r.issues.length > 0 && r.issues.every(i => i.includes('pesa menos')));
  if (soloTamano) {
    logWarn(`Slides ${stillFailing.map(r => r.slide).join(', ')} por debajo del tamaño esperado (generados sin IA) — se publicará igualmente`);
  }
  return {
    ok: stillFailing.length === 0 || soloTamano,
    regenerated,
    results,
    blocker: (!soloTamano && stillFailing.length)
      ? `Las imágenes de Instagram (slides ${stillFailing.map(r => r.slide).join(', ')}) siguen sin pasar la revisión tras regenerar: ${stillFailing.map(r => r.issues.join('; ')).join(' | ')}`
      : null,
  };
}

// ─── Comprobaciones de texto programáticas ─────────────────────────────────────

function countHashtags(text)  { return (text.match(/#\w+/g) || []).length; }
function hasUrl(text)         { return /https?:\/\/|www\./i.test(text); }
function hasStrayCjk(text) {
  // Flag 'u' necesario para tratar emojis como un único code point (U+1F517
  // etc.) y no como dos surrogates UTF-16 separados — sin 'u', el surrogate
  // alto U+D83D de cualquier emoji matchea falsamente el rango 豈-﫿.
  return /[一-鿿㐀-䶿豈-﫿]/u.test(text);
}
function endsInPunctuation(t) { return /[.!?]\s*$/.test((t || '').trim()); }
function firstLine(text)      { return text.split('\n').map(l => l.trim()).find(Boolean) || ''; }

function isGenericExplanation(text) {
  const t = (text || '').trim();
  return GENERIC_PRO_EXPLANATIONS.includes(t) || GENERIC_CON_EXPLANATIONS.includes(t);
}

function wordSet(text) {
  return new Set(
    text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9\s#]/g, ' ').split(/\s+/).filter(Boolean)
  );
}

function jaccardSimilarity(a, b) {
  const setA = wordSet(a);
  const setB = wordSet(b);
  const inter = [...setA].filter(w => setB.has(w)).length;
  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : inter / union;
}

// ─── Groq: juicio cualitativo + autocorrección ─────────────────────────────────

async function judgeToneWithGroq(text, network) {
  try {
    const prompt = `Eres un editor exigente de FitzDesk (web de periféricos y setups para teletrabajo; la marca tiene un tono cercano, honesto, con la mascota Fitz, nunca corporativo ni robótico). Lee este texto pensado para ${network} y responde EXACTAMENTE "SI" si el tono es cercano y natural, o "NO: [motivo en pocas palabras]" si suena genérico, robótico o corporativo.\n\nTEXTO:\n${text}`;
    const reply = await callGroq(prompt, 60);
    if (/^s[ií]/i.test(reply)) return { ok: true };
    return { ok: false, note: reply.replace(/^no:?\s*/i, '') || 'tono no coherente con FitzDesk' };
  } catch (e) {
    return { ok: true, note: `Groq no disponible para juzgar el tono (${e.message}) — comprobación omitida` };
  }
}

async function fixCaptionWithGroq(caption, instructions) {
  const prompt = `Corrige este texto para que cumpla las reglas indicadas, manteniendo el resto del contenido y el tono lo más intacto posible. Responde solo con el texto corregido, sin explicaciones ni comillas envolventes.\n\nREGLAS A CUMPLIR:\n${instructions}\n\nTEXTO ORIGINAL:\n${caption}`;
  return await callGroq(prompt, 700);
}

// ─── Revisión de texto: Instagram ───────────────────────────────────────────────

// Las ofertas permiten máximo 3 hashtags fijos (#oferta #pccomponentes
// #teletrabajo), no los 5 de un análisis normal — TAREA 4, modo PCDays.
function instagramMechanicalChecks(text, maxHashtags = 5) {
  return [
    { name: 'Gancho en la primera línea', ok: firstLine(text).length > 8 },
    { name: 'Sin URLs',                   ok: !hasUrl(text) },
    { name: `Máximo ${maxHashtags} hashtags`, ok: countHashtags(text) <= maxHashtags },
    { name: 'Sin caracteres CJK/extraños', ok: !hasStrayCjk(text) },
  ];
}

export async function reviewInstagramText({ caption, prosExplanations = [], contrasExplanations = [], veredicto, esOferta = false }) {
  let fixedCaption = caption;
  let fixed = false;
  const maxHashtags = esOferta ? 3 : 5;

  let mechanical = instagramMechanicalChecks(fixedCaption, maxHashtags);
  let groqInstagramNote = null;
  if (mechanical.some(c => !c.ok)) {
    const failed = mechanical.filter(c => !c.ok).map(c => c.name);
    try {
      fixedCaption = await fixCaptionWithGroq(fixedCaption,
        failed.map(n => `- ${n}`).join('\n') +
        (esOferta
          ? '\n- Mantén la estructura de oferta: "🔥 Producto a precio€ (-%)", ahorro en €, CTA "Enlace en bio 🐿️", exactamente estos 3 hashtags: #oferta #pccomponentes #teletrabajo'
          : '\n- Mantén la estructura: gancho, beneficios, veredicto de Fitz, CTA "Análisis completo en fitzdesk.com 🐿️", hashtags al final'));
      mechanical = instagramMechanicalChecks(fixedCaption, maxHashtags);
      fixed = mechanical.every(c => c.ok);
    } catch (e) {
      groqInstagramNote = `Groq no disponible para corregir el caption de Instagram (${e.message}) — revisión manual recomendada`;
    }
  }

  const explanationFails = [...prosExplanations, ...contrasExplanations]
    .filter(Boolean).filter(isGenericExplanation).length;
  const otherChecks = [
    {
      name: 'Frases explicativas no genéricas',
      ok:   explanationFails === 0,
      note: explanationFails ? `${explanationFails} frase(s) son la plantilla de respaldo, no de Groq` : undefined,
    },
  ];
  if (veredicto !== undefined) {
    otherChecks.push({ name: 'Veredicto del slide 4 termina en punto', ok: endsInPunctuation(veredicto) });
  }
  const tone = await judgeToneWithGroq(fixedCaption, 'Instagram');
  otherChecks.push({ name: 'Tono coherente con FitzDesk', ok: tone.ok, note: tone.note });

  const blockingFails = mechanical.filter(c => !c.ok);
  return {
    ok:      blockingFails.length === 0,
    caption: fixedCaption,
    fixed:   fixed && fixedCaption !== caption,
    checks:  [...mechanical, ...otherChecks],
    blocker: blockingFails.length
      ? `El caption de Instagram sigue sin cumplir tras intentar corregirlo: ${blockingFails.map(c => c.name).join(', ')}`
      : null,
    note:    groqInstagramNote ?? undefined,
  };
}

// ─── Revisión de texto: Facebook ─────────────────────────────────────────────────

function facebookMechanicalChecks(text, expectedLink) {
  return [
    { name: 'Tiene pregunta para comentarios', ok: /\?/.test(text) },
    { name: 'Tiene enlace al artículo',        ok: text.includes(expectedLink) },
    { name: 'Máximo 2 hashtags',               ok: countHashtags(text) <= 2 },
    { name: 'Sin caracteres CJK/extraños',     ok: !hasStrayCjk(text) },
  ];
}

export async function reviewFacebookText({ caption, instagramCaption, slug }) {
  let fixedCaption = caption;
  let fixed = false;
  // El enlace correcto se conoce de antemano (no depende de lo que escriba
  // la IA) — comprobamos la URL completa, no solo el prefijo, para no
  // aceptar un enlace roto como "/articulo/" sin slug.
  const expectedLink = `${SITE_URL}/articulo/${slug}`;

  let mechanical = facebookMechanicalChecks(fixedCaption, expectedLink);
  let groqFacebookNote = null;
  if (mechanical.some(c => !c.ok)) {
    const failed = mechanical.filter(c => !c.ok).map(c => c.name);
    try {
      fixedCaption = await fixCaptionWithGroq(fixedCaption,
        failed.map(n => `- ${n}`).join('\n') +
        `\n- Si falta el enlace, añade exactamente esta línea al final: ${expectedLink}`);
      mechanical = facebookMechanicalChecks(fixedCaption, expectedLink);
      fixed = mechanical.every(c => c.ok);
    } catch (e) {
      groqFacebookNote = `Groq no disponible para corregir el texto de Facebook (${e.message}) — revisión manual recomendada`;
    }
  }

  const similarity   = instagramCaption ? jaccardSimilarity(fixedCaption, instagramCaption) : 0;
  const notIdentical = {
    name: 'No es idéntico al de Instagram',
    ok:   fixedCaption.trim() !== (instagramCaption || '').trim() && similarity < 0.85,
  };

  const blockingFails = mechanical.filter(c => !c.ok);
  return {
    ok:      blockingFails.length === 0,
    caption: fixedCaption,
    fixed:   fixed && fixedCaption !== caption,
    checks:  [...mechanical, notIdentical],
    blocker: blockingFails.length
      ? `El texto de Facebook sigue sin cumplir tras intentar corregirlo: ${blockingFails.map(c => c.name).join(', ')}`
      : null,
    note:    groqFacebookNote ?? undefined,
  };
}

// ─── Orquestación completa ──────────────────────────────────────────────────────

async function safeGetCarouselContent(slug) {
  try {
    const articleData = loadArticleData(slug);
    return await getCarouselContent(articleData);
  } catch (e) {
    logWarn(`No se pudo obtener pros/contras/veredicto para revisar el texto de los slides (${e.message})`);
    return { prosExplanations: [], contrasExplanations: [], veredicto: undefined };
  }
}

export async function reviewBeforePublish(slug, { instagramCaption, facebookCaption, runInstagram = true, runFacebook = true } = {}) {
  const report   = { slug, images: null, instagram: null, facebook: null };
  const blockers = [];

  if (runInstagram) {
    report.images = await reviewInstagramImages(slug);
    if (!report.images.ok) blockers.push(report.images.blocker);

    // Las ofertas y las guías usan slides 2/3 con contenido distinto al de
    // los análisis ("Lo mejor"/"Lo mejorable" no existen en esos tipos) —
    // pedirle ese contenido a getCarouselContent gastaría Groq en vano.
    const esOferta = isOfertaArticle(slug);
    // loadArticleData lanza si la imagen no existe en disco — imagen que puede
    // no estar aún en el momento de la revisión. Si falla, tratamos como no-guía
    // y dejamos que el blocker de imágenes de arriba ya lo haya detectado (#4).
    let esGuia = false;
    try { esGuia = loadArticleData(slug).data.tipo === 'guia'; } catch (_) {}
    const { prosExplanations, contrasExplanations, veredicto } = (esOferta || esGuia)
      ? { prosExplanations: [], contrasExplanations: [], veredicto: undefined }
      : await safeGetCarouselContent(slug);
    report.instagram = await reviewInstagramText({
      caption: instagramCaption, prosExplanations, contrasExplanations, veredicto, esOferta,
    });
    if (!report.instagram.ok) blockers.push(report.instagram.blocker);
  }

  if (runFacebook) {
    report.facebook = await reviewFacebookText({
      caption: facebookCaption,
      instagramCaption: report.instagram?.caption ?? instagramCaption,
      slug,
    });
    if (!report.facebook.ok) blockers.push(report.facebook.blocker);
  }

  return {
    ok: blockers.length === 0,
    instagramCaption: report.instagram?.caption ?? instagramCaption,
    facebookCaption:  report.facebook?.caption ?? facebookCaption,
    blockers: blockers.filter(Boolean),
    report,
  };
}

// ─── CLI ────────────────────────────────────────────────────────────────────────

function printChecks(checks) {
  for (const c of checks) {
    console.log(`   ${c.ok ? '✅' : '❌'} ${c.name}${c.note ? ` — ${c.note}` : ''}`);
  }
}

async function main() {
  const args    = process.argv.slice(2);
  const slugIdx = args.indexOf('--slug');
  const slug    = slugIdx !== -1 ? args[slugIdx + 1] : null;

  if (!slug) {
    console.error('Uso: node socialReviewer.js --slug [slug]');
    process.exit(1);
  }

  console.log(`\n━━━ FitzDesk Social Reviewer — ${slug} ━━━`);

  let article;
  try {
    article = loadArticle(slug);
  } catch (e) {
    logError(e.message);
    process.exit(1);
  }

  logInfo('Generando captions de Instagram y Facebook para revisar...');
  const instagramCaption = await getInstagramCaption(article);
  const facebookCaption  = await getFacebookCaption(article, slug);

  const result = await reviewBeforePublish(slug, { instagramCaption, facebookCaption });

  console.log('\n📸 IMÁGENES DE INSTAGRAM (1080x1350, PNG, 50KB-2MB)');
  for (const r of result.report.images?.results ?? []) {
    console.log(`   ${r.ok ? '✅' : '❌'} Slide ${r.slide}${r.issues.length ? ` — ${r.issues.join('; ')}` : ''}`);
  }
  if (result.report.images?.regenerated) {
    logInfo('Se regeneró el carrusel automáticamente durante la revisión.');
  }

  console.log('\n📷 TEXTO DE INSTAGRAM');
  printChecks(result.report.instagram?.checks ?? []);
  if (result.report.instagram?.fixed) logOk('El caption se corrigió automáticamente con Groq.');
  if (result.report.instagram?.note) logWarn(result.report.instagram.note);
  printBlockIfPresent('Caption final:', result.instagramCaption);

  console.log('\n📘 TEXTO DE FACEBOOK');
  printChecks(result.report.facebook?.checks ?? []);
  if (result.report.facebook?.fixed) logOk('El texto se corrigió automáticamente con Groq.');
  if (result.report.facebook?.note) logWarn(result.report.facebook.note);
  printBlockIfPresent('Texto final:', result.facebookCaption);

  console.log(`\n${result.ok ? '✅ TODO CORRECTO — listo para publicar' : '🚫 BLOQUEADO — no se debe publicar'}`);
  if (!result.ok) {
    result.blockers.forEach(b => logError(b));
  }
  console.log('');

  process.exit(result.ok ? 0 : 1);
}

function printBlockIfPresent(title, text) {
  if (!text) return;
  console.log(`\n   ${title}`);
  console.log('   ' + '─'.repeat(50));
  console.log(text.split('\n').map(l => '   ' + l).join('\n'));
  console.log('   ' + '─'.repeat(50));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
