#!/usr/bin/env node
/**
 * FitzDesk Social Image Generator
 * Genera, a partir de la imagen original de un artículo, versiones
 * optimizadas para Instagram (1080x1080) y Facebook (1200x630) con una
 * franja naranja de marca y el título superpuesto. Usa Sharp + un overlay
 * SVG para el texto (sin canvas) y la fuente del sistema disponible.
 *
 * Uso:
 *   node socialImageGenerator.js --slug [slug]
 */

import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import sharp from 'sharp';
import matter from 'gray-matter';

const __dirname    = path.dirname(fileURLToPath(import.meta.url));
const ARTICLES_DIR = path.join(__dirname, '..', 'src', 'content', 'articulos');
const PUBLIC_DIR    = path.join(__dirname, '..', 'public');
const OUTPUT_DIR    = path.join(PUBLIC_DIR, 'images', 'redes');

const BRAND_COLOR  = '#F97316';
const TITLE_MAX_LEN = 60;

const VARIANTS = {
  instagram: { width: 1080, height: 1080, bandHeight: 180, logoFontSize: 42, titleFontSize: 28 },
  facebook:  { width: 1200, height: 630,  bandHeight: 120, logoFontSize: 30, titleFontSize: 20 },
};

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
  const title       = data.title ?? slug;
  const imagenField = data.imagen ?? `/images/articulos/${slug}.webp`;
  const imagePath   = path.join(PUBLIC_DIR, imagenField.replace(/^\//, ''));

  if (!fs.existsSync(imagePath)) {
    throw new Error(`Imagen original no encontrada: ${imagePath}`);
  }

  return { title, imagePath };
}

function truncateTitle(title) {
  if (title.length <= TITLE_MAX_LEN) return title;
  return `${title.slice(0, TITLE_MAX_LEN)}...`;
}

function escapeXml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// ─── Overlay SVG (franja de marca + logo + título) ─────────────────────────────

function buildOverlaySvg({ width, height, bandHeight, logoFontSize, titleFontSize, title }) {
  const bandY        = height - bandHeight;
  const textY         = height - bandHeight / 2;
  const escapedTitle = escapeXml(truncateTitle(title));

  return `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="${bandY}" width="${width}" height="${bandHeight}" fill="${BRAND_COLOR}" />
      <text x="40" y="${textY}" font-family="Arial, sans-serif" font-size="${logoFontSize}"
            font-weight="bold" fill="#FFFFFF" dominant-baseline="middle">FitzDesk</text>
      <text x="${width - 40}" y="${textY}" font-family="Arial, sans-serif" font-size="${titleFontSize}"
            font-weight="bold" fill="#FFFFFF" text-anchor="end" dominant-baseline="middle">${escapedTitle}</text>
    </svg>
  `;
}

// ─── Composición con Sharp ──────────────────────────────────────────────────────

async function composeSocialImage(slug, network) {
  const variant = VARIANTS[network];
  if (!variant) throw new Error(`Red no soportada: ${network}`);

  const { title, imagePath } = loadArticleData(slug);
  const { width, height, bandHeight, logoFontSize, titleFontSize } = variant;

  const baseBuffer = await sharp(imagePath)
    .resize(width, height, { fit: 'cover', position: 'centre' })
    .toBuffer();

  const overlay = Buffer.from(
    buildOverlaySvg({ width, height, bandHeight, logoFontSize, titleFontSize, title })
  );

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const outputPath = path.join(OUTPUT_DIR, `${slug}-${network}.webp`);

  await sharp(baseBuffer)
    .composite([{ input: overlay, top: 0, left: 0 }])
    .webp({ quality: 85 })
    .toFile(outputPath);

  return outputPath;
}

export async function generateInstagramImage(slug) {
  return composeSocialImage(slug, 'instagram');
}

export async function generateFacebookImage(slug) {
  return composeSocialImage(slug, 'facebook');
}

export async function generateSocialImages(slug) {
  const instagram = await generateInstagramImage(slug);
  const facebook  = await generateFacebookImage(slug);
  return { instagram, facebook };
}

// ─── CLI ────────────────────────────────────────────────────────────────────────

async function main() {
  const args    = process.argv.slice(2);
  const slugIdx = args.indexOf('--slug');
  const slug    = slugIdx !== -1 ? args[slugIdx + 1] : null;

  if (!slug) {
    console.error('Uso: node socialImageGenerator.js --slug [slug]');
    process.exit(1);
  }

  logInfo(`Generando imágenes de redes sociales para ${slug}...`);
  try {
    const { instagram, facebook } = await generateSocialImages(slug);
    logOk(`Instagram (1080x1080): ${instagram}`);
    logOk(`Facebook (1200x630): ${facebook}`);
  } catch (e) {
    logError(e.message);
    process.exit(1);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
