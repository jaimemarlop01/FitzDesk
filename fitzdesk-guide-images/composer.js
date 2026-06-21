import { loadImage } from '@napi-rs/canvas';
import { readFileSync, existsSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  CONTENT_H, BRAND, BG, DARK,
  drawShadow, drawPriceTag, drawTotalBadge, drawPremiumBadge,
  drawVsSeparator, drawCompLabel,
} from './textRenderer.js';

const __dirname  = dirname(fileURLToPath(import.meta.url));
const IMAGES_DIR = resolve(__dirname, '../public/images/articulos');

// Carga una imagen de producto como objeto Image de canvas
async function loadProduct(filename) {
  const filepath = join(IMAGES_DIR, filename);
  if (!existsSync(filepath)) {
    console.warn(`   ⚠️  Imagen no encontrada: ${filename}`);
    return null;
  }
  const buffer = readFileSync(filepath);
  return loadImage(buffer);
}

// Calcula posición y tamaño para ajuste "contain" dentro de un slot
function contain(img, slotW, slotH) {
  const scale = Math.min(slotW / img.width, slotH / img.height);
  const w = Math.round(img.width  * scale);
  const h = Math.round(img.height * scale);
  return {
    w, h,
    dx: Math.round((slotW - w) / 2),
    dy: Math.round((slotH - h) / 2),
  };
}

// Dibuja un producto en su slot con sombra y, opcionalmente, shadow blur
function drawProduct(ctx, img, slotX, slotY, slotW, slotH, shadowBlur = 18) {
  if (!img) {
    // Placeholder gris si la imagen no se encontró
    ctx.fillStyle = '#E5E7EB';
    ctx.fillRect(slotX, slotY, slotW, slotH);
    ctx.fillStyle = '#9CA3AF';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Imagen no disponible', slotX + slotW / 2, slotY + slotH / 2);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    return;
  }

  const { w, h, dx, dy } = contain(img, slotW, slotH);
  const imgX = slotX + dx;
  const imgY = slotY + dy;

  drawShadow(ctx, imgX, imgY, w, h, shadowBlur);
  ctx.drawImage(img, imgX, imgY, w, h);
}

// ─── Layout 1: Setup 500€ (monitor grande + teclado + ratón) ─────────────────

export async function layoutThreeProducts(ctx, guide) {
  const [prod0, prod1, prod2] = guide.productos;

  const [monitor, teclado, raton] = await Promise.all([
    loadProduct(prod0.imagen),
    loadProduct(prod1.imagen),
    loadProduct(prod2.imagen),
  ]);

  // Slots
  const MON  = { x: 15,  y: 75,  w: 588, h: 420 };
  const TEC  = { x: 630, y: 45,  w: 375, h: 188 };
  const RAT  = { x: 655, y: 258, w: 300, h: 198 };

  // Relleno blanco bajo productos (para que las sombras queden bien)
  ctx.fillStyle = BG;
  ctx.fillRect(MON.x, MON.y, MON.w, MON.h);
  ctx.fillRect(TEC.x, TEC.y, TEC.w, TEC.h);
  ctx.fillRect(RAT.x, RAT.y, RAT.w, RAT.h);

  drawProduct(ctx, monitor, MON.x, MON.y, MON.w, MON.h, 20);
  drawProduct(ctx, teclado, TEC.x, TEC.y, TEC.w, TEC.h, 15);
  drawProduct(ctx, raton,   RAT.x, RAT.y, RAT.w, RAT.h, 15);

  // Etiquetas de precio (light)
  const monCX = MON.x + MON.w / 2;
  const tecCX = TEC.x + TEC.w / 2;
  const ratCX = RAT.x + RAT.w / 2;

  drawPriceTag(ctx, prod0.precio, monCX, MON.y + MON.h + 8);
  drawPriceTag(ctx, prod1.precio, tecCX, TEC.y + TEC.h + 8);
  drawPriceTag(ctx, prod2.precio, ratCX, RAT.y + RAT.h + 8);

  // Total badge (naranja, esquina inferior derecha)
  if (guide.total) {
    drawTotalBadge(ctx, `Total: ${guide.total}`, 1185, CONTENT_H - 40);
  }
}

// ─── Layout 2: Comparativa (dos productos enfrentados) ───────────────────────

export async function layoutComparison(ctx, guide) {
  const [prodL, prodR] = guide.productos;

  const [left, right] = await Promise.all([
    loadProduct(prodL.imagen),
    loadProduct(prodR.imagen),
  ]);

  const cx = 600; // Centro de separación
  const SLOT_W = 480, SLOT_H = 390;
  const SLOT_Y = (CONTENT_H - SLOT_H) / 2;

  const LEFT  = { x: cx - SLOT_W - 30, y: SLOT_Y };
  const RIGHT = { x: cx + 30,          y: SLOT_Y };

  ctx.fillStyle = BG;
  ctx.fillRect(LEFT.x,  LEFT.y,  SLOT_W, SLOT_H);
  ctx.fillRect(RIGHT.x, RIGHT.y, SLOT_W, SLOT_H);

  drawProduct(ctx, left,  LEFT.x,  LEFT.y,  SLOT_W, SLOT_H, 20);
  drawProduct(ctx, right, RIGHT.x, RIGHT.y, SLOT_W, SLOT_H, 20);

  drawVsSeparator(ctx);

  // Etiquetas de categoría bajo cada producto
  const labelY = LEFT.y + SLOT_H + 12;
  drawCompLabel(ctx, prodL.etiqueta, LEFT.x  + SLOT_W / 2, labelY, prodL.labelBg, prodL.labelText);
  drawCompLabel(ctx, prodR.etiqueta, RIGHT.x + SLOT_W / 2, labelY, prodR.labelBg, prodR.labelText);
}

// ─── Layout 4: Doble monitor (dos pantallas juntas, no enfrentadas) ──────────

export async function layoutDualMonitor(ctx, guide) {
  const [prodL, prodR] = guide.productos;

  const [left, right] = await Promise.all([
    loadProduct(prodL.imagen),
    loadProduct(prodR.imagen),
  ]);

  const cx = 600;
  const SLOT_W = 480, SLOT_H = 390;
  const SLOT_Y = (CONTENT_H - SLOT_H) / 2;
  const GAP = 40;

  const LEFT  = { x: cx - SLOT_W - GAP / 2, y: SLOT_Y };
  const RIGHT = { x: cx + GAP / 2,          y: SLOT_Y };

  ctx.fillStyle = BG;
  ctx.fillRect(LEFT.x,  LEFT.y,  SLOT_W, SLOT_H);
  ctx.fillRect(RIGHT.x, RIGHT.y, SLOT_W, SLOT_H);

  drawProduct(ctx, left,  LEFT.x,  LEFT.y,  SLOT_W, SLOT_H, 20);
  drawProduct(ctx, right, RIGHT.x, RIGHT.y, SLOT_W, SLOT_H, 20);

  // Símbolo "+" en el centro (no "VS"): transmite combinación, no enfrentamiento
  const plusCY = CONTENT_H / 2;
  ctx.fillStyle = BRAND;
  ctx.beginPath();
  ctx.arc(cx, plusCY, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'white';
  ctx.font = 'bold 22px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('+', cx, plusCY);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';

  // Etiquetas de precio bajo cada monitor
  const leftCX  = LEFT.x  + SLOT_W / 2;
  const rightCX = RIGHT.x + SLOT_W / 2;
  drawPriceTag(ctx, prodL.precio, leftCX,  LEFT.y  + SLOT_H + 8);
  drawPriceTag(ctx, prodR.precio, rightCX, RIGHT.y + SLOT_H + 8);

  // Total badge (naranja, esquina inferior derecha)
  if (guide.total) {
    drawTotalBadge(ctx, `Total: ${guide.total}`, 1185, CONTENT_H - 40);
  }
}

// ─── Layout 3: Setup profesional premium ─────────────────────────────────────

export async function layoutThreeProductsPremium(ctx, guide) {
  const [prod0, prod1, prod2] = guide.productos;

  const [monitor, teclado, raton] = await Promise.all([
    loadProduct(prod0.imagen),
    loadProduct(prod1.imagen),
    loadProduct(prod2.imagen),
  ]);

  // Monitor más grande y dominante que en el layout 1
  const MON = { x: 12,  y: 35,  w: 710, h: 475 };
  const TEC = { x: 740, y: 42,  w: 385, h: 178 };
  const RAT = { x: 755, y: 248, w: 380, h: 195 };

  ctx.fillStyle = BG;
  ctx.fillRect(MON.x, MON.y, MON.w, MON.h);
  ctx.fillRect(TEC.x, TEC.y, TEC.w, TEC.h);
  ctx.fillRect(RAT.x, RAT.y, RAT.w, RAT.h);

  // Sombra premium más pronunciada en el monitor
  drawProduct(ctx, monitor, MON.x, MON.y, MON.w, MON.h, 30);
  drawProduct(ctx, teclado, TEC.x, TEC.y, TEC.w, TEC.h, 15);
  drawProduct(ctx, raton,   RAT.x, RAT.y, RAT.w, RAT.h, 15);

  // Badge "⭐ Setup Profesional" sobre el monitor
  drawPremiumBadge(ctx, '⭐ Setup Profesional', MON.x + 12, MON.y + 12);

  // Etiquetas de precio oscuras (premium)
  const monCX = MON.x + MON.w / 2;
  const tecCX = TEC.x + TEC.w / 2;
  const ratCX = RAT.x + RAT.w / 2;

  drawPriceTag(ctx, prod0.precio, monCX, MON.y + MON.h + 8, true);
  drawPriceTag(ctx, prod1.precio, tecCX, TEC.y + TEC.h + 8, true);
  drawPriceTag(ctx, prod2.precio, ratCX, RAT.y + RAT.h + 8, true);
}
