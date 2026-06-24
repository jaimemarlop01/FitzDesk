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
import Groq from 'groq-sdk';

const __dirname    = path.dirname(fileURLToPath(import.meta.url));
const ARTICLES_DIR = path.join(__dirname, '..', 'src', 'content', 'articulos');
const PUBLIC_DIR    = path.join(__dirname, '..', 'public');
const OUTPUT_DIR    = path.join(PUBLIC_DIR, 'images', 'redes');

const WIDTH  = 1080;
const HEIGHT = 1350;

const groqClient = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

function logInfo(msg)  { console.log(`ℹ️  ${msg}`); }
function logOk(msg)    { console.log(`✅ ${msg}`); }
function logWarn(msg)  { console.warn(`⚠️  ${msg}`); }
function logError(msg) { console.error(`❌ ${msg}`); }

// ─── Cargar datos del artículo ─────────────────────────────────────────────────

function loadArticleData(slug) {
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

// Groq mezcla ocasionalmente algún carácter CJK suelto en español (bug
// conocido del modelo, ver socialPublisher.js) — misma red de seguridad.
function stripStrayCjk(text) {
  return text.replace(/[一-鿿㐀-䶿豈-﫿]/g, '');
}

async function callGroqText(prompt, maxTokens = 400) {
  if (!groqClient) throw new Error('GROQ_API_KEY no configurada');
  const completion = await groqClient.chat.completions.create({
    model:      'llama-3.3-70b-versatile',
    max_tokens: maxTokens,
    messages:   [{ role: 'user', content: prompt }],
  });
  const text = completion.choices[0]?.message?.content?.trim();
  if (!text) throw new Error('Groq no devolvió contenido');
  return stripStrayCjk(text);
}

async function extractListWithGroq(content, { label, max }) {
  const prompt = `A partir de este análisis de producto, extrae ${max} ${label} concretos. Responde solo con la lista, una idea por línea, sin numeración ni guiones ni explicaciones, frases muy cortas (máximo 8 palabras cada una).\n\nCONTENIDO:\n${content}`;
  const text = await callGroqText(prompt);
  return text.split('\n').map(l => l.replace(/^[-*\d.\s]+/, '').trim()).filter(Boolean).slice(0, max);
}

async function condenseVerdictWithGroq(sourceText) {
  const prompt = `Eres Fitz, la ardilla mascota de FitzDesk. A partir de este texto, escribe tu veredicto final en una frase corta y con personalidad, máximo 2 líneas (unas 16-18 palabras), sin emojis ni comillas. Responde solo con la frase final.\n\nTEXTO:\n${sourceText}`;
  return await callGroqText(prompt, 100);
}

async function getCarouselContent({ data, content }) {
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

  return {
    pros:    pros.length ? pros : ['Ver análisis completo en fitzdesk.com'],
    contras: contras.length ? contras : ['Ver análisis completo en fitzdesk.com'],
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
function buildSlide1Html({ title, categoria, puntuacion, precio, imagePath }) {
  const backgroundUri = imageToDataUri(imagePath);
  const metaRow = puntuacion !== null
    ? `
      <div class="meta-row">
        <span class="score" style="color: ${scoreColor(puntuacion)}">${puntuacion}<span class="score-max">/10</span></span>
        ${precio ? `<span class="price">${escapeHtml(precio)}</span>` : ''}
      </div>`
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
</style>
</head>
<body>
  <div class="canvas">
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
function buildListSlideHtml({ heading, headingColor, items, icon }) {
  const itemsHtml = items.map(item => `
    <div class="list-item">
      <span class="list-icon">${icon}</span>
      <span class="list-text">${escapeHtml(item)}</span>
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
    padding: 110px 64px;
    display: flex;
    flex-direction: column;
  }
  .heading { color: ${headingColor}; font-size: 56px; font-weight: 800; margin-bottom: 72px; }
  .list-item { display: flex; align-items: flex-start; gap: 20px; margin-bottom: 48px; }
  .list-icon { font-size: 40px; line-height: 1.3; }
  .list-text { color: #FFFFFF; font-size: 38px; font-weight: 600; line-height: 1.3; }
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
    <div class="heading">${escapeHtml(heading)}</div>
    ${itemsHtml}
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
function buildVerdictSlideHtml({ veredicto, puntuacion }) {
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
  .site { color: #FFFFFF; font-size: 30px; font-weight: 600; opacity: 0.9; }
</style>
</head>
<body>
  <div class="canvas">
    <div class="icon">🐿️</div>
    <div class="subtitle">Veredicto de Fitz</div>
    <div class="verdict">${escapeHtml(veredicto)}</div>
    ${puntuacion !== null ? `<div class="score-final">${puntuacion}/10</div>` : ''}
    <div class="site">fitzdesk.com</div>
  </div>
</body>
</html>
  `;
}

// ─── Captura con Puppeteer ──────────────────────────────────────────────────────

async function captureHtml(browser, html, outputPath) {
  const page = await browser.newPage();
  try {
    await page.setViewport({ width: WIDTH, height: HEIGHT });
    await page.setContent(html, { waitUntil: 'load' });
    await page.screenshot({ path: outputPath, type: 'png' });
  } finally {
    await page.close();
  }
}

export async function generateInstagramCarousel(slug) {
  const articleData = loadArticleData(slug);
  const { pros, contras, veredicto } = await getCarouselContent(articleData);

  const slidesHtml = [
    buildSlide1Html(articleData),
    buildListSlideHtml({ heading: '✅ Lo mejor', headingColor: '#F97316', items: pros, icon: '✅' }),
    buildListSlideHtml({ heading: '⚠️ Lo mejorable', headingColor: '#FFFFFF', items: contras, icon: '⚠️' }),
    buildVerdictSlideHtml({ veredicto, puntuacion: articleData.puntuacion }),
  ];

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const outputPaths = slidesHtml.map((_, i) => path.join(OUTPUT_DIR, `${slug}-instagram-${i + 1}.png`));

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  try {
    for (let i = 0; i < slidesHtml.length; i++) {
      await captureHtml(browser, slidesHtml[i], outputPaths[i]);
    }
  } finally {
    await browser.close();
  }

  return outputPaths;
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

  logInfo(`Generando carrusel de Instagram (4 slides) para ${slug}...`);
  try {
    const outputPaths = await generateInstagramCarousel(slug);
    outputPaths.forEach((p, i) => logOk(`Slide ${i + 1}: ${p}`));
  } catch (e) {
    logError(e.message);
    process.exit(1);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
