#!/usr/bin/env node
/**
 * FitzDesk Instagram Image Generator
 * Genera un carrusel de 4 slides (1080x1350, formato vertical 4:5) para
 * Instagram, renderizando plantillas HTML con Puppeteer:
 *   1. Gancho visual — imagen del producto + título + puntuación + precio
 *   2. Lo mejor — pros del análisis
 *   3. Lo mejorable — contras del análisis
 *   4. Veredicto de Fitz — frase de cierre + puntuación final
 *
 * Los pros, contras y veredicto se intentan leer primero del frontmatter,
 * luego se parsean directamente de las secciones Markdown "## Lo mejor" /
 * "## Lo mejorable" / "## Fitz recomienda" del cuerpo del artículo (rápido
 * y gratuito), y solo si eso falla se generan/condensan con Groq.
 *
 * Uso:
 *   node instagramImageGenerator.js --slug [slug]
 */

import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import matter from 'gray-matter';
import puppeteer from 'puppeteer';
import { callGroq } from './socialContent.js';

const __dirname    = path.dirname(fileURLToPath(import.meta.url));
const ARTICLES_DIR = path.join(__dirname, '..', 'src', 'content', 'articulos');
const PUBLIC_DIR    = path.join(__dirname, '..', 'public');
const OUTPUT_DIR    = path.join(PUBLIC_DIR, 'images', 'redes');

const WIDTH  = 1080;
const HEIGHT = 1350;

function logInfo(msg)  { console.log(`ℹ️  ${msg}`); }
function logOk(msg)    { console.log(`✅ ${msg}`); }
function logWarn(msg)  { console.warn(`⚠️  ${msg}`); }
function logError(msg) { console.error(`❌ ${msg}`); }

// ─── Cargar datos del artículo ─────────────────────────────────────────────────

export function loadArticleData(slug) {
  const filePath = path.join(ARTICLES_DIR, `${slug}.md`);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Artículo no encontrado: ${slug}.md`);
  }
  const { data, content } = matter(fs.readFileSync(filePath, 'utf8'));

  const imagenField = data.imagen ?? `/images/articulos/${slug}.webp`;
  const imagePath   = path.join(PUBLIC_DIR, imagenField.replace(/^\//, ''));
  if (!fs.existsSync(imagePath)) {
    throw new Error(`Imagen original no encontrada: ${imagePath}`);
  }

  return {
    title:      data.title ?? slug,
    categoria:  data.categoria ?? 'setups',
    tipo:       data.tipo ?? 'analisis',
    puntuacion: typeof data.puntuacion === 'number' ? data.puntuacion : null,
    precio:     data.precio ?? null,
    imagePath,
    content:    content?.trim() ?? '',
    data,
  };
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function imageToDataUri(imagePath) {
  const ext  = path.extname(imagePath).slice(1) || 'webp';
  const mime = ext === 'jpg' ? 'jpeg' : ext;
  const data = fs.readFileSync(imagePath).toString('base64');
  return `data:image/${mime};base64,${data}`;
}

// Mismo criterio de color que ScoreBox.astro, para coherencia visual con el sitio
function scoreColor(puntuacion) {
  if (puntuacion >= 9)   return '#16a34a';
  if (puntuacion >= 7.5) return '#F97316';
  return '#DC2626';
}

// ─── Extracción de pros / contras / veredicto ──────────────────────────────────

function extractSection(content, headingRegex) {
  const lines    = content.split('\n');
  const startIdx = lines.findIndex(l => headingRegex.test(l.trim()));
  if (startIdx === -1) return null;
  let endIdx = lines.length;
  for (let i = startIdx + 1; i < lines.length; i++) {
    if (/^##\s/.test(lines[i])) { endIdx = i; break; }
  }
  const section = lines.slice(startIdx + 1, endIdx).join('\n').trim();
  return section || null;
}

function parseBulletList(sectionText, maxItems) {
  if (!sectionText) return [];
  return sectionText
    .split('\n')
    .map(l => l.trim())
    .filter(l => /^[-*]\s+/.test(l))
    .map(l => l.replace(/^[-*]\s+/, '').replace(/\*\*/g, '').trim())
    .filter(Boolean)
    .slice(0, maxItems);
}

async function extractListWithGroq(content, { label, max }) {
  const prompt = `A partir de este análisis de producto, extrae ${max} ${label} concretos. Responde solo con la lista, una idea por línea, sin numeración ni guiones ni explicaciones, frases muy cortas (máximo 8 palabras cada una).\n\nCONTENIDO:\n${content}`;
  const text = await callGroq(prompt);
  return text.split('\n').map(l => l.replace(/^[-*\d.\s]+/, '').trim()).filter(Boolean).slice(0, max);
}

async function condenseVerdictWithGroq(sourceText) {
  const prompt = `Eres Fitz, la ardilla mascota de FitzDesk. A partir de este texto, escribe tu veredicto final en una frase corta y con personalidad, máximo 2 líneas (unas 16-18 palabras), sin emojis ni comillas. Responde solo con la frase final.\n\nTEXTO:\n${sourceText}`;
  return await callGroq(prompt, 100);
}

// Frases de respaldo si Groq no está disponible — genéricas pero coherentes
// con el tipo de punto (pro o contra), no con el texto exacto del ítem.
// Exportadas para que socialReviewer.js pueda detectar si una explicación
// es literalmente una de estas (señal de que Groq no se usó o falló).
export const GENERIC_PRO_EXPLANATIONS = [
  'Una ventaja que se nota en el uso diario',
  'Pensado para hacerte la vida más fácil',
  'Un punto a favor frente a otras opciones',
  'Justo lo que se le pide a un buen producto de trabajo',
];
export const GENERIC_CON_EXPLANATIONS = [
  'Algo a tener en cuenta antes de comprar',
  'No es decisivo, pero conviene saberlo',
  'El único pero que le encontramos',
];

function genericExplanation(kind, i) {
  const list = kind === 'pro' ? GENERIC_PRO_EXPLANATIONS : GENERIC_CON_EXPLANATIONS;
  return list[i % list.length];
}

async function explainItemsWithGroq(items, content) {
  const itemsList = items.map((item, i) => `${i + 1}. ${item}`).join('\n');
  const prompt = `Eres Fitz, la ardilla mascota de FitzDesk: cercana, honesta y nada robótica. Para cada uno de los siguientes puntos de un análisis de producto, escribe una frase que explique el IMPACTO REAL para alguien que teletrabaja — no una descripción técnica del punto.

Reglas:
- Máximo 8 palabras
- Tono cercano y humano, como si hablaras con un amigo
- Céntrate en lo que el usuario siente, gana o evita en su día a día — no repitas el dato técnico con otras palabras
- No repitas palabras del punto principal
- Sin comillas

Frases MALAS (mecánicas, solo repiten el punto con otras palabras):
- "Rueda menos fluida causa frustración"
- "Software complejo esfuerza configuración"

Frases BUENAS (impacto real, tono natural):
- "Olvídate de cargarlo durante semanas"
- "El cursor va exactamente donde quieres"
- "Conecta el portátil y el móvil a la vez"
- "Si eres zurdo, busca otra opción"
- "La rueda no se desliza tan suave como en el MX Master"
- "Configurarlo lleva más tiempo del que debería"

Responde con exactamente ${items.length} líneas, una por punto, en el mismo orden, sin numeración ni guiones ni explicaciones.

PUNTOS:
${itemsList}

CONTENIDO DEL ANÁLISIS:
${content}`;
  const text = await callGroq(prompt);
  return text.split('\n').map(l => l.replace(/^[-*\d.\s]+/, '').replace(/^["']|["']$/g, '').trim()).filter(Boolean);
}

async function getItemExplanations(items, content, kind) {
  try {
    const explanations = await explainItemsWithGroq(items, content);
    return items.map((_, i) => explanations[i] || genericExplanation(kind, i));
  } catch (e) {
    logWarn(`Groq falló generando explicaciones de "${kind}" (${e.message}) — usando frases genéricas`);
    return items.map((_, i) => genericExplanation(kind, i));
  }
}

export async function getCarouselContent({ data, content }) {
  // 1. Frontmatter (poco habitual en este esquema, pero se respeta si existe)
  let pros        = Array.isArray(data.lo_mejor) ? data.lo_mejor : [];
  let contras     = Array.isArray(data.lo_mejorable) ? data.lo_mejorable : [];
  let veredictoSrc = typeof data.fitzQuote === 'string' ? data.fitzQuote : null;

  // 2. Parseo directo de las secciones Markdown del cuerpo (fiable y gratuito)
  if (pros.length === 0) {
    pros = parseBulletList(extractSection(content, /^##\s*Lo mejor/i), 4);
  }
  if (contras.length === 0) {
    contras = parseBulletList(extractSection(content, /^##\s*Lo mejorable/i), 3);
  }
  if (!veredictoSrc) {
    veredictoSrc = extractSection(content, /^##.*Fitz recomienda/i);
  }

  // 3. Fallback a Groq solo si algo sigue sin estar disponible
  if (pros.length === 0) {
    try {
      pros = await extractListWithGroq(content, { label: 'puntos fuertes', max: 4 });
    } catch (e) {
      logWarn(`Groq falló extrayendo "Lo mejor" (${e.message})`);
    }
  }
  if (contras.length === 0) {
    try {
      contras = await extractListWithGroq(content, { label: 'puntos débiles', max: 3 });
    } catch (e) {
      logWarn(`Groq falló extrayendo "Lo mejorable" (${e.message})`);
    }
  }

  let veredicto;
  try {
    veredicto = await condenseVerdictWithGroq(veredictoSrc || content);
  } catch (e) {
    logWarn(`Groq falló condensando el veredicto (${e.message}) — usando primera frase disponible`);
    const raw = (veredictoSrc || content).replace(/\n+/g, ' ').trim();
    veredicto = raw.split(/(?<=[.?!])\s/)[0]?.slice(0, 140) || 'Análisis completo en fitzdesk.com';
  }

  // Las frases explicativas solo tienen sentido si hay pros/contras reales
  // (no para el placeholder de respaldo "Ver análisis completo...")
  const prosFallback    = pros.length === 0;
  const contrasFallback = contras.length === 0;
  pros    = pros.length    ? pros    : ['Ver análisis completo en fitzdesk.com'];
  contras = contras.length ? contras : ['Ver análisis completo en fitzdesk.com'];

  const prosExplanations    = prosFallback    ? pros.map(() => null)    : await getItemExplanations(pros, content, 'pro');
  const contrasExplanations = contrasFallback ? contras.map(() => null) : await getItemExplanations(contras, content, 'con');

  return { pros, contras, veredicto, prosExplanations, contrasExplanations };
}

// Slides 2 y 3 personalizados para artículos tipo "guia": en vez de
// "Lo mejor / Lo mejorable" (secciones que no existen en guías), Groq extrae
// dos grupos temáticos propios de la guía (e.g. "cuándo elegir 4K" /
// "cuándo basta el Full HD"). Fallback a secciones "Cuándo SÍ / NO" si Groq falla.
async function getGuideCarouselContent({ data, content }) {
  // Veredicto: igual que en análisis, desde la sección Fitz recomienda
  const fitzSection = extractSection(content, /^##.*Fitz recomienda/i);
  let veredicto;
  try {
    veredicto = await condenseVerdictWithGroq(fitzSection || content);
  } catch (e) {
    logWarn(`Groq falló condensando el veredicto de la guía (${e.message})`);
    const raw = (fitzSection || content).replace(/\n+/g, ' ').trim();
    veredicto = raw.split(/(?<=[.?!])\s/)[0]?.slice(0, 140) || 'Guía completa en fitzdesk.com';
  }

  // Slides 2 y 3: dos grupos temáticos del contenido de la guía
  const prompt = `Eres el asistente editorial de FitzDesk, web de análisis de periféricos y setups para teletrabajo.

Este artículo es una guía: "${data.title}".

Extrae DOS grupos de puntos clave para dos slides de Instagram.
Devuelve ÚNICAMENTE un JSON válido, sin markdown ni explicaciones, con esta estructura exacta:
{
  "slide2": {
    "heading": "título corto (máx. 5 palabras, sin emoji)",
    "icon": "un emoji",
    "items": ["punto clave (máx. 8 palabras)"]
  },
  "slide3": {
    "heading": "título corto (máx. 5 palabras, sin emoji)",
    "icon": "un emoji",
    "items": ["punto clave (máx. 8 palabras)"]
  }
}

Slide 2: argumentos/razones principales a favor del PRIMER concepto u opción de la guía.
Slide 3: argumentos/razones principales a favor del SEGUNDO concepto u opción de la guía.
Máximo 4 puntos por slide. Concretos y prácticos, no genéricos.

Artículo:
${content.slice(0, 3000)}`;

  let slide2, slide3;
  try {
    const raw = await callGroq(prompt, 400);
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON en respuesta');
    const parsed = JSON.parse(jsonMatch[0]);
    slide2 = parsed.slide2;
    slide3 = parsed.slide3;
    if (!slide2?.heading || !slide2?.items?.length || !slide3?.heading || !slide3?.items?.length) {
      throw new Error('JSON incompleto');
    }
  } catch (e) {
    logWarn(`Groq falló generando slides de guía (${e.message}) — usando secciones del artículo`);
    const siSection  = extractSection(content, /^##\s*Cu[aá]ndo\s+S[IÍ]/i);
    const noSection  = extractSection(content, /^##\s*Cu[aá]ndo\s+NO/i);
    const siBullets  = siSection ? parseBulletList(siSection, 4) : [];
    const noBullets  = noSection ? parseBulletList(noSection, 3) : [];
    slide2 = {
      heading: 'Cuándo merece la pena',
      icon: '✅',
      items: siBullets.length ? siBullets : ['Ver guía completa en fitzdesk.com'],
    };
    slide3 = {
      heading: 'Cuándo no es necesario',
      icon: '💡',
      items: noBullets.length ? noBullets : ['Ver guía completa en fitzdesk.com'],
    };
  }

  // Aplicar límites ANTES de getItemExplanations para que la llamada a Groq
  // pida exactamente las N explicaciones que se van a renderizar (#2).
  slide2.items = slide2.items.slice(0, 4);
  slide3.items = slide3.items.slice(0, 3);

  // kind: 'pro' para ambos slides — en una guía el slide3 representa un
  // concepto/opción válido, no un "contra", así el fallback genérico es neutro (#7).
  const slide2Explanations = await getItemExplanations(slide2.items, content, 'pro');
  const slide3Explanations = await getItemExplanations(slide3.items, content, 'pro');

  return {
    slide2: {
      heading: slide2.heading, headingColor: '#F97316',
      icon: slide2.icon || '✅', items: slide2.items, explanations: slide2Explanations,
    },
    slide3: {
      heading: slide3.heading, headingColor: '#FFFFFF',
      icon: slide3.icon || '💡', items: slide3.items, explanations: slide3Explanations,
    },
    veredicto,
  };
}

// ─── Plantillas HTML ────────────────────────────────────────────────────────────

function baseHead() {
  return `
<meta charset="UTF-8" />
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: ${WIDTH}px;
    height: ${HEIGHT}px;
    font-family: -apple-system, 'Segoe UI', Arial, sans-serif;
    overflow: hidden;
  }
</style>`;
}

// Slide 1 — gancho visual (imagen + título + puntuación + precio)
function buildSlide1Html({ title, categoria, puntuacion, precio, imagePath, tipo }) {
  const backgroundUri = imageToDataUri(imagePath);
  const metaRow = puntuacion !== null
    ? `
      <div class="meta-row">
        <span class="score" style="color: ${scoreColor(puntuacion)}">${puntuacion}<span class="score-max">/10</span></span>
        ${precio ? `<span class="price">${escapeHtml(precio)}</span>` : ''}
      </div>`
    : tipo === 'lanzamiento'
      ? `<div class="launch-label">🚀 Próximo lanzamiento</div>`
      : '';

  return `
<!DOCTYPE html>
<html lang="es">
<head>
${baseHead()}
<style>
  .canvas {
    position: relative;
    width: ${WIDTH}px;
    height: ${HEIGHT}px;
    background-image: url('${backgroundUri}');
    background-size: cover;
    background-position: center;
  }
  .gradient {
    position: absolute;
    left: 0; right: 0; bottom: 0;
    height: 62%;
    background: linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.55) 45%, rgba(0,0,0,0.92) 100%);
  }
  .gradient-top {
    position: absolute;
    left: 0; right: 0; top: 0;
    height: 560px;
    background: linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 75%, rgba(0,0,0,0) 100%);
  }
  .logo {
    position: absolute;
    top: 48px; left: 48px;
    display: flex;
    align-items: center;
    gap: 10px;
    background: rgba(0,0,0,0.35);
    padding: 12px 22px;
    border-radius: 999px;
  }
  .logo-emoji { font-size: 30px; }
  .logo-text { color: #FFFFFF; font-size: 28px; font-weight: 700; }
  .badge {
    position: absolute;
    top: 48px; right: 48px;
    background: #F97316;
    color: #FFFFFF;
    font-size: 22px;
    font-weight: 700;
    letter-spacing: 0.05em;
    padding: 12px 26px;
    border-radius: 999px;
    text-transform: uppercase;
  }
  .bottom { position: absolute; left: 0; right: 0; bottom: 0; padding: 0 56px 64px; }
  .title {
    color: #FFFFFF;
    font-size: 58px;
    font-weight: 700;
    line-height: 1.18;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    overflow: hidden;
    text-shadow: 0 2px 10px rgba(0,0,0,0.4);
  }
  .meta-row { margin-top: 28px; display: flex; align-items: baseline; gap: 28px; }
  .score { font-size: 64px; font-weight: 800; }
  .score-max { font-size: 32px; font-weight: 600; opacity: 0.85; }
  .price { color: #F97316; font-size: 38px; font-weight: 700; }
  .launch-label {
    margin-top: 28px;
    display: inline-flex;
    align-items: center;
    gap: 12px;
    background: rgba(249,115,22,0.85);
    color: #FFFFFF;
    font-size: 34px;
    font-weight: 700;
    padding: 14px 28px;
    border-radius: 999px;
  }
</style>
</head>
<body>
  <div class="canvas">
    <div class="gradient-top"></div>
    <div class="gradient"></div>
    <div class="logo">
      <span class="logo-emoji">🐿️</span>
      <span class="logo-text">FitzDesk</span>
    </div>
    <div class="badge">${escapeHtml(categoria)}</div>
    <div class="bottom">
      <div class="title">${escapeHtml(title)}</div>
      ${metaRow}
    </div>
  </div>
</body>
</html>
  `;
}

// Slides 2 y 3 — listas (Lo mejor / Lo mejorable) sobre fondo oscuro
function buildListSlideHtml({ heading, headingColor, items, explanations, icon, slideNumber, totalSlides, showSwipeHint }) {
  const itemsHtml = items.map((item, i) => `
    <div class="list-item">
      <span class="list-icon">${icon}</span>
      <div class="list-text-wrap">
        <span class="list-text">${escapeHtml(item)}</span>
        ${explanations?.[i] ? `<span class="list-explanation">${escapeHtml(explanations[i])}</span>` : ''}
      </div>
    </div>`).join('');

  return `
<!DOCTYPE html>
<html lang="es">
<head>
${baseHead()}
<style>
  .canvas {
    position: relative;
    width: ${WIDTH}px;
    height: ${HEIGHT}px;
    background: #1F2937;
    padding: 64px;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  .slide-number {
    position: absolute;
    top: 48px; right: 48px;
    color: #9CA3AF;
    font-size: 24px;
    font-weight: 600;
  }
  .heading { color: ${headingColor}; font-size: 56px; font-weight: 800; margin-bottom: 72px; }
  .list-item { display: flex; align-items: flex-start; gap: 20px; margin-bottom: 44px; }
  .list-icon { font-size: 40px; line-height: 1.3; }
  .list-text-wrap { display: flex; flex-direction: column; gap: 8px; }
  .list-text { color: #FFFFFF; font-size: 38px; font-weight: 600; line-height: 1.3; }
  .list-explanation { color: #9CA3AF; font-size: 24px; font-weight: 500; line-height: 1.3; }
  .swipe-hint {
    position: absolute;
    bottom: 104px; left: 0; right: 0;
    text-align: center;
    color: #9CA3AF;
    font-size: 26px;
    font-weight: 600;
  }
  .logo-small {
    position: absolute;
    bottom: 48px; right: 48px;
    display: flex;
    align-items: center;
    gap: 8px;
    opacity: 0.8;
  }
  .logo-small-emoji { font-size: 22px; }
  .logo-small-text { color: #FFFFFF; font-size: 20px; font-weight: 700; }
</style>
</head>
<body>
  <div class="canvas">
    <div class="slide-number">${slideNumber}/${totalSlides}</div>
    <div class="heading">${escapeHtml(heading)}</div>
    ${itemsHtml}
    ${showSwipeHint ? '<div class="swipe-hint">Desliza →</div>' : ''}
    <div class="logo-small">
      <span class="logo-small-emoji">🐿️</span>
      <span class="logo-small-text">FitzDesk</span>
    </div>
  </div>
</body>
</html>
  `;
}

// Slide 4 — veredicto de Fitz, sobre fondo naranja
function buildVerdictSlideHtml({ veredicto, puntuacion, tipo, slideNumber, totalSlides }) {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
${baseHead()}
<style>
  .canvas {
    position: relative;
    width: ${WIDTH}px;
    height: ${HEIGHT}px;
    background: #F97316;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 0 80px;
  }
  .slide-number {
    position: absolute;
    top: 48px; right: 48px;
    color: #9CA3AF;
    font-size: 24px;
    font-weight: 600;
  }
  .icon { font-size: 140px; margin-bottom: 24px; }
  .subtitle {
    color: #FFFFFF;
    font-size: 32px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin-bottom: 40px;
    opacity: 0.9;
  }
  .verdict {
    color: #FFFFFF;
    font-size: 50px;
    font-weight: 700;
    line-height: 1.3;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    overflow: hidden;
    margin-bottom: 56px;
  }
  .score-final { color: #FFFFFF; font-size: 90px; font-weight: 800; margin-bottom: 32px; }
  .launch-soon {
    color: #FFFFFF;
    font-size: 42px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    opacity: 0.95;
    margin-bottom: 32px;
    border: 3px solid rgba(255,255,255,0.6);
    padding: 16px 40px;
    border-radius: 999px;
  }
  .site { color: #FFFFFF; font-size: 30px; font-weight: 600; opacity: 0.9; }
</style>
</head>
<body>
  <div class="canvas">
    <div class="slide-number">${slideNumber}/${totalSlides}</div>
    <div class="icon">🐿️</div>
    <div class="subtitle">Veredicto de Fitz</div>
    <div class="verdict">${escapeHtml(veredicto)}</div>
    ${puntuacion !== null
      ? `<div class="score-final">${puntuacion}/10</div>`
      : tipo === 'lanzamiento'
        ? `<div class="launch-soon">🚀 Próximamente</div>`
        : ''}
    <div class="site">fitzdesk.com</div>
  </div>
</body>
</html>
  `;
}

// ─── Plantillas para ofertas (carrusel de 3 slides, TAREA 4 PCDays) ────────────

// Slide 1 — gancho de oferta: imagen + badge rojo "🔥 OFERTA" + precio
// tachado/precio de oferta + % de descuento, en vez del badge de categoría
// y la puntuación que usa el slide 1 normal (las ofertas no llevan nota).
function buildOfertaSlide1Html({ title, imagePath, precioOferta, precioNormal, descuento }) {
  const backgroundUri = imageToDataUri(imagePath);
  return `
<!DOCTYPE html>
<html lang="es">
<head>
${baseHead()}
<style>
  .canvas {
    position: relative;
    width: ${WIDTH}px;
    height: ${HEIGHT}px;
    background-image: url('${backgroundUri}');
    background-size: cover;
    background-position: center;
  }
  .gradient {
    position: absolute;
    left: 0; right: 0; bottom: 0;
    height: 62%;
    background: linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.55) 45%, rgba(0,0,0,0.92) 100%);
  }
  .gradient-top {
    position: absolute;
    left: 0; right: 0; top: 0;
    height: 560px;
    background: linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 75%, rgba(0,0,0,0) 100%);
  }
  .logo {
    position: absolute;
    top: 48px; left: 48px;
    display: flex;
    align-items: center;
    gap: 10px;
    background: rgba(0,0,0,0.35);
    padding: 12px 22px;
    border-radius: 999px;
  }
  .logo-emoji { font-size: 30px; }
  .logo-text { color: #FFFFFF; font-size: 28px; font-weight: 700; }
  .badge-oferta {
    position: absolute;
    top: 48px; right: 48px;
    background: #DC2626;
    color: #FFFFFF;
    font-size: 26px;
    font-weight: 800;
    letter-spacing: 0.05em;
    padding: 14px 28px;
    border-radius: 999px;
    text-transform: uppercase;
  }
  .bottom { position: absolute; left: 0; right: 0; bottom: 0; padding: 0 56px 64px; }
  .title {
    color: #FFFFFF;
    font-size: 50px;
    font-weight: 700;
    line-height: 1.18;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    overflow: hidden;
    text-shadow: 0 2px 10px rgba(0,0,0,0.4);
    margin-bottom: 28px;
  }
  .price-row { display: flex; align-items: baseline; gap: 24px; flex-wrap: wrap; }
  .price-old { color: #D1D5DB; font-size: 34px; font-weight: 600; text-decoration: line-through; }
  .price-new { color: #FFFFFF; font-size: 72px; font-weight: 800; }
  .descuento {
    color: #FFFFFF;
    background: #DC2626;
    font-size: 34px;
    font-weight: 800;
    padding: 6px 20px;
    border-radius: 12px;
  }
</style>
</head>
<body>
  <div class="canvas">
    <div class="gradient-top"></div>
    <div class="gradient"></div>
    <div class="logo">
      <span class="logo-emoji">🐿️</span>
      <span class="logo-text">FitzDesk</span>
    </div>
    <div class="badge-oferta">🔥 OFERTA</div>
    <div class="bottom">
      <div class="title">${escapeHtml(title)}</div>
      <div class="price-row">
        ${precioNormal ? `<span class="price-old">${escapeHtml(precioNormal)}</span>` : ''}
        <span class="price-new">${escapeHtml(precioOferta)}</span>
        ${descuento ? `<span class="descuento">-${escapeHtml(String(descuento).replace(/^-/, ''))}</span>` : ''}
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

// Slide 2 — por qué comprarlo ahora: fondo oscuro, hasta 3 razones, y una
// cuenta atrás visual solo si se conoce una fecha de fin real (nunca se
// inventa una fecha — si no se conoce, el slide se queda sin ese bloque).
function buildOfertaSlide2Html({ razones, fechaFin }) {
  const itemsHtml = razones.map((r, i) => `
    <div class="razon-item">
      <span class="razon-num">${i + 1}</span>
      <span class="razon-text">${escapeHtml(r)}</span>
    </div>`).join('');

  const countdownHtml = fechaFin ? `<div class="countdown">⏳ Termina el ${escapeHtml(fechaFin)}</div>` : '';

  return `
<!DOCTYPE html>
<html lang="es">
<head>
${baseHead()}
<style>
  .canvas {
    position: relative;
    width: ${WIDTH}px;
    height: ${HEIGHT}px;
    background: #1F2937;
    padding: 64px;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  .slide-number { position: absolute; top: 48px; right: 48px; color: #9CA3AF; font-size: 24px; font-weight: 600; }
  .heading { color: #DC2626; font-size: 52px; font-weight: 800; margin-bottom: 64px; }
  .razon-item { display: flex; align-items: flex-start; gap: 22px; margin-bottom: 48px; }
  .razon-num {
    background: #F97316; color: #FFFFFF; font-size: 30px; font-weight: 800;
    width: 52px; height: 52px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .razon-text { color: #FFFFFF; font-size: 36px; font-weight: 600; line-height: 1.3; padding-top: 4px; }
  .countdown {
    margin-top: 24px; color: #FBBF24; font-size: 30px; font-weight: 700;
    background: rgba(251,191,36,0.12); padding: 16px 24px; border-radius: 12px; text-align: center;
  }
  .logo-small { position: absolute; bottom: 48px; right: 48px; display: flex; align-items: center; gap: 8px; opacity: 0.8; }
  .logo-small-emoji { font-size: 22px; }
  .logo-small-text { color: #FFFFFF; font-size: 20px; font-weight: 700; }
</style>
</head>
<body>
  <div class="canvas">
    <div class="slide-number">2/3</div>
    <div class="heading">🔥 Por qué comprarlo ahora</div>
    ${itemsHtml}
    ${countdownHtml}
    <div class="logo-small">
      <span class="logo-small-emoji">🐿️</span>
      <span class="logo-small-text">FitzDesk</span>
    </div>
  </div>
</body>
</html>
  `;
}

// Slide 3 — veredicto de Fitz con urgencia, fondo naranja, CTA a fitzdesk.com
function buildOfertaSlide3Html({ veredicto }) {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
${baseHead()}
<style>
  .canvas {
    position: relative;
    width: ${WIDTH}px;
    height: ${HEIGHT}px;
    background: #F97316;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 0 80px;
  }
  .slide-number { position: absolute; top: 48px; right: 48px; color: rgba(255,255,255,0.7); font-size: 24px; font-weight: 600; }
  .icon { font-size: 140px; margin-bottom: 24px; }
  .subtitle {
    color: #FFFFFF; font-size: 32px; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.08em; margin-bottom: 40px; opacity: 0.9;
  }
  .verdict {
    color: #FFFFFF; font-size: 48px; font-weight: 700; line-height: 1.3;
    display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2;
    overflow: hidden; margin-bottom: 56px;
  }
  .cta {
    color: #F97316; background: #FFFFFF; font-size: 34px; font-weight: 800;
    padding: 18px 40px; border-radius: 999px; margin-bottom: 24px;
  }
  .site { color: #FFFFFF; font-size: 26px; font-weight: 600; opacity: 0.9; }
</style>
</head>
<body>
  <div class="canvas">
    <div class="slide-number">3/3</div>
    <div class="icon">🐿️</div>
    <div class="subtitle">Veredicto de Fitz</div>
    <div class="verdict">${escapeHtml(veredicto)}</div>
    <div class="cta">No la dejes escapar 🔥</div>
    <div class="site">fitzdesk.com</div>
  </div>
</body>
</html>
  `;
}

// ─── Captura con Puppeteer ──────────────────────────────────────────────────────

// Reduce el font-size de selector progresivamente mientras el texto
// desborde su caja (scrollHeight > clientHeight, la forma estándar de
// detectar recorte con -webkit-line-clamp activo). Si al llegar a minSize
// sigue sin caber en normalLines, amplía a maxLines antes de rendirse (la
// elipsis de line-clamp se encarga del resto si aun así desborda).
async function autofitLineClamp(page, selector, { startSize, minSize, normalLines, maxLines, step = 2 }) {
  await page.evaluate((sel, startSize, minSize, normalLines, maxLines, step) => {
    const el = document.querySelector(sel);
    let fontSize = startSize;
    el.style.fontSize = `${fontSize}px`;
    el.style.webkitLineClamp = String(normalLines);

    const overflowing = () => el.scrollHeight > el.clientHeight + 1;

    while (overflowing() && fontSize > minSize) {
      fontSize = Math.max(minSize, fontSize - step);
      el.style.fontSize = `${fontSize}px`;
    }

    if (overflowing() && maxLines > normalLines) {
      el.style.webkitLineClamp = String(maxLines);
    }
  }, selector, startSize, minSize, normalLines, maxLines, step);
}

// Para el veredicto: igual que arriba, pero si al máximo de líneas y
// tamaño mínimo todavía desborda, recorta el TEXTO por frase completa
// (nunca a mitad de palabra) probando frase a frase hasta la última que
// quepa, en vez de dejar que line-clamp corte en cualquier punto.
async function autofitVerdict(page, selector, originalText, options) {
  await autofitLineClamp(page, selector, options);

  const stillOverflowing = await page.evaluate(sel => {
    const el = document.querySelector(sel);
    return el.scrollHeight > el.clientHeight + 1;
  }, selector);
  if (!stillOverflowing) return;

  const sentences = originalText.match(/[^.!?]+[.!?]+(\s|$)/g)?.map(s => s.trim()).filter(Boolean)
    || [originalText];

  let truncated = '';
  for (const sentence of sentences) {
    const candidate = truncated ? `${truncated} ${sentence}` : sentence;
    await page.evaluate((sel, val) => { document.querySelector(sel).textContent = val; }, selector, candidate);
    const fits = await page.evaluate(sel => {
      const el = document.querySelector(sel);
      return el.scrollHeight <= el.clientHeight + 1;
    }, selector);
    if (!fits) break;
    truncated = candidate;
  }

  // El bucle puede haber dejado puesto en el DOM el último candidato que
  // NO cupo (se prueba antes de saber si encaja) — hay que volver a fijar
  // explícitamente el último texto que sí encajó. Si ni siquiera la
  // primera frase cabe, se muestra igualmente (mejor desbordar ligeramente
  // que dejar el slide vacío).
  const finalText = truncated || sentences[0];
  await page.evaluate((sel, val) => { document.querySelector(sel).textContent = val; }, selector, finalText);
}

async function captureHtml(browser, html, outputPath, afterRender) {
  const page = await browser.newPage();
  try {
    await page.setViewport({ width: WIDTH, height: HEIGHT });
    await page.setContent(html, { waitUntil: 'load' });
    if (afterRender) await afterRender(page);
    await page.screenshot({ path: outputPath, type: 'png' });
  } finally {
    await page.close();
  }
}

const TOTAL_SLIDES = 4;

export async function generateInstagramCarousel(slug) {
  const articleData = loadArticleData(slug);
  const { data } = articleData;

  let slide2Cfg, slide3Cfg, veredicto;

  if (data.tipo === 'guia') {
    const guideContent = await getGuideCarouselContent(articleData);
    slide2Cfg = { ...guideContent.slide2, slideNumber: 2, totalSlides: TOTAL_SLIDES, showSwipeHint: true };
    slide3Cfg = { ...guideContent.slide3, slideNumber: 3, totalSlides: TOTAL_SLIDES, showSwipeHint: true };
    veredicto = guideContent.veredicto;
  } else {
    const { pros, contras, veredicto: v, prosExplanations, contrasExplanations } = await getCarouselContent(articleData);
    slide2Cfg = { heading: '✅ Lo mejor', headingColor: '#F97316', items: pros, explanations: prosExplanations, icon: '✅', slideNumber: 2, totalSlides: TOTAL_SLIDES, showSwipeHint: true };
    slide3Cfg = { heading: '⚠️ Lo mejorable', headingColor: '#FFFFFF', items: contras, explanations: contrasExplanations, icon: '⚠️', slideNumber: 3, totalSlides: TOTAL_SLIDES, showSwipeHint: true };
    veredicto = v;
  }

  const slides = [
    {
      html: buildSlide1Html(articleData),
      afterRender: page => autofitLineClamp(page, '.title', {
        startSize: 58, minSize: 36, normalLines: 2, maxLines: 3, step: 2,
      }),
    },
    { html: buildListSlideHtml(slide2Cfg) },
    { html: buildListSlideHtml(slide3Cfg) },
    {
      html: buildVerdictSlideHtml({ veredicto, puntuacion: articleData.puntuacion, tipo: articleData.tipo, slideNumber: 4, totalSlides: TOTAL_SLIDES }),
      afterRender: page => autofitVerdict(page, '.verdict', veredicto, {
        startSize: 50, minSize: 28, normalLines: 2, maxLines: 3, step: 2,
      }),
    },
  ];

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const outputPaths = slides.map((_, i) => path.join(OUTPUT_DIR, `${slug}-instagram-${i + 1}.png`));

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  try {
    for (let i = 0; i < slides.length; i++) {
      await captureHtml(browser, slides[i].html, outputPaths[i], slides[i].afterRender);
    }
  } finally {
    await browser.close();
  }

  return outputPaths;
}

const OFERTA_TOTAL_SLIDES = 3;

/**
 * Carrusel de 3 slides para artículos `tipo: "oferta"` (TAREA 4, modo
 * PCDays) — gancho de oferta, razones para comprar ahora, veredicto con
 * urgencia. Reutiliza el mismo método de captura y autofit que el carrusel
 * de 4 slides normal, pero con plantillas y contenido propios de oferta.
 */
export async function generateOfertaCarousel(slug) {
  const articleData = loadArticleData(slug);
  const { data, content } = articleData;

  const razones = parseBulletList(extractSection(content, /^##\s*¿Por qué es buena oferta\?/i), 3);
  const razonesFinal = razones.length ? razones : ['Precio rebajado por tiempo limitado'];

  let veredictoSrc = extractSection(content, /^##.*Fitz dice/i);
  let veredicto;
  try {
    veredicto = await condenseVerdictWithGroq(veredictoSrc || content);
  } catch (e) {
    logWarn(`Groq falló condensando el veredicto de oferta (${e.message}) — usando primera frase disponible`);
    const raw = (veredictoSrc || content).replace(/\n+/g, ' ').trim();
    veredicto = raw.split(/(?<=[.?!])\s/)[0]?.slice(0, 140) || 'Oferta limitada — no la dejes escapar.';
  }

  const slides = [
    {
      html: buildOfertaSlide1Html({
        title:        articleData.title,
        imagePath:    articleData.imagePath,
        precioOferta: data.precio_oferta ?? data.precio ?? 'Ver precio',
        precioNormal: data.precio_normal ?? null,
        descuento:    data.descuento ?? null,
      }),
      afterRender: page => autofitLineClamp(page, '.title', {
        startSize: 50, minSize: 32, normalLines: 2, maxLines: 3, step: 2,
      }),
    },
    {
      // Sin fecha de fin conocida en el frontmatter de oferta (no se inventa)
      html: buildOfertaSlide2Html({ razones: razonesFinal, fechaFin: null }),
    },
    {
      html: buildOfertaSlide3Html({ veredicto }),
      afterRender: page => autofitVerdict(page, '.verdict', veredicto, {
        startSize: 48, minSize: 28, normalLines: 2, maxLines: 3, step: 2,
      }),
    },
  ];

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const outputPaths = slides.map((_, i) => path.join(OUTPUT_DIR, `${slug}-instagram-${i + 1}.png`));

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  try {
    for (let i = 0; i < slides.length; i++) {
      await captureHtml(browser, slides[i].html, outputPaths[i], slides[i].afterRender);
    }
  } finally {
    await browser.close();
  }

  return outputPaths;
}

/** true si el artículo es de tipo "oferta" — decide qué carrusel generar. */
export function isOfertaArticle(slug) {
  const filePath = path.join(ARTICLES_DIR, `${slug}.md`);
  if (!fs.existsSync(filePath)) return false;
  const { data } = matter(fs.readFileSync(filePath, 'utf8'));
  return data.tipo === 'oferta';
}

// ─── CLI ────────────────────────────────────────────────────────────────────────

async function main() {
  const args    = process.argv.slice(2);
  const slugIdx = args.indexOf('--slug');
  const slug    = slugIdx !== -1 ? args[slugIdx + 1] : null;

  if (!slug) {
    console.error('Uso: node instagramImageGenerator.js --slug [slug]');
    process.exit(1);
  }

  const esOferta = isOfertaArticle(slug);
  logInfo(`Generando carrusel de Instagram (${esOferta ? '3' : '4'} slides${esOferta ? ', oferta' : ''}) para ${slug}...`);
  try {
    const outputPaths = esOferta ? await generateOfertaCarousel(slug) : await generateInstagramCarousel(slug);
    outputPaths.forEach((p, i) => logOk(`Slide ${i + 1}: ${p}`));
  } catch (e) {
    logError(e.message);
    process.exit(1);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
