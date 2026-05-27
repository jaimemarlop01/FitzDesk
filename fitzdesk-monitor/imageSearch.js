import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join, resolve, dirname, extname } from 'path';
import { fileURLToPath } from 'url';
import { logInfo, logWarn } from './notifier.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const IMAGES_PATH = resolve(
  __dirname,
  process.env.ASTRO_IMAGES_PATH ?? '../public/images/borradores'
);

// ─────────────────────────────────────────────
// Extraer URL de imagen del item RSS / artículo
// ─────────────────────────────────────────────

function extractRssImage(item) {
  // enclosure (podcasts/imágenes adjuntas)
  if (item.enclosure?.url && item.enclosure?.type?.startsWith('image/')) {
    return item.enclosure.url;
  }
  // media:content (Yahoo Media RSS)
  const mediaContent = item['media:content'];
  if (mediaContent) {
    const url = Array.isArray(mediaContent)
      ? mediaContent[0]?.['$']?.url
      : mediaContent?.['$']?.url;
    if (url) return url;
  }
  // media:thumbnail
  const mediaThumbnail = item['media:thumbnail'];
  if (mediaThumbnail) {
    const url = Array.isArray(mediaThumbnail)
      ? mediaThumbnail[0]?.['$']?.url
      : mediaThumbnail?.['$']?.url;
    if (url) return url;
  }
  return null;
}

async function fetchOgImage(url) {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(6000),
      headers: { 'User-Agent': 'FitzDesk-Monitor/1.0' },
    });
    if (!res.ok) return null;
    const html = await res.text();
    // og:image
    const og = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i)
              || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
    if (og?.[1]) return og[1];
    // twitter:image
    const tw = html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i)
              || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:image["']/i);
    if (tw?.[1]) return tw[1];
  } catch {
    // timeout o error de red — ignorar
  }
  return null;
}

// ─────────────────────────────────────────────
// Encontrar la mejor URL de imagen disponible
// ─────────────────────────────────────────────

export async function findProductImage(item) {
  // 1. RSS enclosure / media:*
  const rssImg = extractRssImage(item);
  if (rssImg) {
    logInfo(`  Imagen RSS encontrada: ${rssImg.slice(0, 70)}`);
    return rssImg;
  }

  // 2. og:image del artículo original
  if (item.link) {
    const ogImg = await fetchOgImage(item.link);
    if (ogImg) {
      logInfo(`  Imagen og:image encontrada: ${ogImg.slice(0, 70)}`);
      return ogImg;
    }
  }

  return null;
}

// ─────────────────────────────────────────────
// Descargar imagen y guardar en /public/images/borradores/
// ─────────────────────────────────────────────

export async function downloadProductImage(imageUrl, slug) {
  if (!imageUrl) return null;

  try {
    const res = await fetch(imageUrl, {
      signal: AbortSignal.timeout(10000),
      headers: { 'User-Agent': 'FitzDesk-Monitor/1.0' },
    });
    if (!res.ok) return null;

    const contentType = res.headers.get('content-type') ?? '';
    const ext = contentType.includes('png') ? 'png'
              : contentType.includes('webp') ? 'webp'
              : contentType.includes('gif') ? 'gif'
              : 'jpg';

    const filename = `${slug}.${ext}`;
    const filePath = join(IMAGES_PATH, filename);

    if (!existsSync(IMAGES_PATH)) {
      mkdirSync(IMAGES_PATH, { recursive: true });
    }

    const buffer = await res.arrayBuffer();
    writeFileSync(filePath, Buffer.from(buffer));

    logInfo(`  Imagen guardada: /images/borradores/${filename}`);
    return { localPath: `/images/borradores/${filename}`, remoteUrl: imageUrl };
  } catch (err) {
    logWarn(`  No se pudo descargar la imagen: ${err.message}`);
    return null;
  }
}
