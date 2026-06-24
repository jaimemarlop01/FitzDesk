#!/usr/bin/env node
/**
 * FitzDesk Instagram Image Generator
 * Renderiza una plantilla HTML (imagen de fondo + degradado + logo + badge
 * de categoría + título + puntuación + precio) y la captura con Puppeteer
 * como PNG a 1080x1350 — formato vertical 4:5, el recomendado por Instagram
 * para maximizar espacio en el feed.
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

const __dirname    = path.dirname(fileURLToPath(import.meta.url));
const ARTICLES_DIR = path.join(__dirname, '..', 'src', 'content', 'articulos');
const PUBLIC_DIR    = path.join(__dirname, '..', 'public');
const OUTPUT_DIR    = path.join(PUBLIC_DIR, 'images', 'redes');

const WIDTH  = 1080;
const HEIGHT = 1350;

function logInfo(msg)  { console.log(`ℹ️  ${msg}`); }
function logOk(msg)    { console.log(`✅ ${msg}`); }
function logError(msg) { console.error(`❌ ${msg}`); }

// ─── Cargar datos del artículo ─────────────────────────────────────────────────

function loadArticleData(slug) {
  const filePath = path.join(ARTICLES_DIR, `${slug}.md`);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Artículo no encontrado: ${slug}.md`);
  }
  const { data } = matter(fs.readFileSync(filePath, 'utf8'));

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

// ─── Plantilla HTML ─────────────────────────────────────────────────────────────

function buildHtml({ title, categoria, puntuacion, precio, imagePath }) {
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
<meta charset="UTF-8" />
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: ${WIDTH}px;
    height: ${HEIGHT}px;
    font-family: -apple-system, 'Segoe UI', Arial, sans-serif;
    overflow: hidden;
  }
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
  .logo-text {
    color: #FFFFFF;
    font-size: 28px;
    font-weight: 700;
  }
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
  .bottom {
    position: absolute;
    left: 0; right: 0; bottom: 0;
    padding: 0 56px 64px;
  }
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
  .meta-row {
    margin-top: 28px;
    display: flex;
    align-items: baseline;
    gap: 28px;
  }
  .score {
    font-size: 64px;
    font-weight: 800;
  }
  .score-max {
    font-size: 32px;
    font-weight: 600;
    opacity: 0.85;
  }
  .price {
    color: #F97316;
    font-size: 38px;
    font-weight: 700;
  }
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

// ─── Captura con Puppeteer ──────────────────────────────────────────────────────

export async function generateInstagramImage(slug) {
  const articleData = loadArticleData(slug);
  const html = buildHtml(articleData);

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const outputPath = path.join(OUTPUT_DIR, `${slug}-instagram.png`);

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: WIDTH, height: HEIGHT });
    await page.setContent(html, { waitUntil: 'load' });
    await page.screenshot({ path: outputPath, type: 'png' });
  } finally {
    await browser.close();
  }

  return outputPath;
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

  logInfo(`Generando imagen de Instagram para ${slug}...`);
  try {
    const outputPath = await generateInstagramImage(slug);
    logOk(`Imagen generada (1080x1350): ${outputPath}`);
  } catch (e) {
    logError(e.message);
    process.exit(1);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
