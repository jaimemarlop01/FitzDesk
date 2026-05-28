// ─── Constantes de marca ────────────────────────────────────────────────────
export const W          = 1200;
export const H          = 675;
export const BAND_H     = 80;
export const CONTENT_H  = H - BAND_H;
export const BRAND      = '#F97316';
export const BG         = '#F9FAFB';
export const DARK       = '#1F2937';
export const DOT_COLOR  = '#E5E7EB';

// ─── Helpers ────────────────────────────────────────────────────────────────

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ─── Fondo + textura ────────────────────────────────────────────────────────

export function drawBackground(ctx) {
  // Base
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);

  // Textura de puntos en el área de contenido
  ctx.fillStyle = DOT_COLOR;
  for (let dx = 15; dx < W; dx += 22) {
    for (let dy = 15; dy < CONTENT_H; dy += 22) {
      ctx.beginPath();
      ctx.arc(dx, dy, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Degradados en esquinas para dar profundidad
  const corners = [
    [0, 0], [W, 0], [0, CONTENT_H], [W, CONTENT_H],
  ];
  for (const [cx, cy] of corners) {
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 320);
    g.addColorStop(0, 'rgba(255,255,255,0.65)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, CONTENT_H);
  }
}

// ─── Banda naranja inferior ──────────────────────────────────────────────────

export function drawBottomBand(ctx, titulo) {
  ctx.fillStyle = BRAND;
  ctx.fillRect(0, CONTENT_H, W, BAND_H);

  // Ajustar tamaño de fuente si el título es muy largo
  let fontSize = 26;
  ctx.font = `bold ${fontSize}px Arial`;
  while (ctx.measureText(titulo).width > W - 100 && fontSize > 14) {
    fontSize -= 1;
    ctx.font = `bold ${fontSize}px Arial`;
  }

  ctx.fillStyle = 'white';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(titulo, W / 2, CONTENT_H + BAND_H / 2);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}

// ─── Sello FITZ (esquina superior derecha) ───────────────────────────────────

export function drawFitzSeal(ctx) {
  const cx = W - 55, cy = 55, r = 42;

  ctx.fillStyle = BRAND;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'white';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 17px Arial';
  ctx.fillText('FITZ', cx, cy - 8);
  ctx.font = '10px Arial';
  ctx.fillText('lo recomienda', cx, cy + 9);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}

// ─── Logo FitzDesk (esquina superior izquierda) ───────────────────────────────

export function drawFitzLogo(ctx) {
  // Punto naranja
  ctx.fillStyle = BRAND;
  ctx.beginPath();
  ctx.arc(22, 30, 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = DARK;
  ctx.font = 'bold 20px Arial';
  ctx.textBaseline = 'middle';
  ctx.fillText('FitzDesk', 32, 30);
  ctx.textBaseline = 'alphabetic';
}

// ─── Sombra bajo producto ────────────────────────────────────────────────────

export function drawShadow(ctx, x, y, w, h, blur = 18) {
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.10)';
  ctx.shadowBlur = blur;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 5;
  ctx.fillStyle = 'white';
  ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
  ctx.restore();
}

// ─── Etiqueta de precio (light o dark) ───────────────────────────────────────

export function drawPriceTag(ctx, price, centerX, y, dark = false) {
  const FONT = 'bold 13px Arial';
  ctx.font = FONT;
  const tw = ctx.measureText(price).width;
  const padX = 10, padY = 5;
  const bw = tw + padX * 2;
  const bh = 24;
  const bx = centerX - bw / 2;

  if (dark) {
    ctx.fillStyle = DARK;
    roundRect(ctx, bx, y, bw, bh, 4);
    ctx.fill();
    ctx.fillStyle = 'white';
  } else {
    ctx.fillStyle = 'white';
    roundRect(ctx, bx, y, bw, bh, 4);
    ctx.fill();
    ctx.strokeStyle = DOT_COLOR;
    ctx.lineWidth = 1;
    roundRect(ctx, bx, y, bw, bh, 4);
    ctx.stroke();
    ctx.fillStyle = DARK;
  }

  ctx.font = FONT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(price, centerX, y + bh / 2);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}

// ─── Badge "Total: ~XXX€" ─────────────────────────────────────────────────────

export function drawTotalBadge(ctx, text, x, y) {
  ctx.font = 'bold 14px Arial';
  const tw = ctx.measureText(text).width;
  const bw = tw + 20, bh = 28;

  ctx.fillStyle = BRAND;
  roundRect(ctx, x - bw, y, bw, bh, 5);
  ctx.fill();

  ctx.fillStyle = 'white';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x - 10, y + bh / 2);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}

// ─── Badge premium (fondo oscuro) ────────────────────────────────────────────

export function drawPremiumBadge(ctx, text, x, y) {
  ctx.font = 'bold 13px Arial';
  const tw = ctx.measureText(text).width;
  const bw = tw + 18, bh = 26;

  ctx.fillStyle = DARK;
  roundRect(ctx, x, y, bw, bh, 4);
  ctx.fill();

  ctx.fillStyle = 'white';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + 9, y + bh / 2);
  ctx.textBaseline = 'alphabetic';
}

// ─── Separador VS (guía comparativa) ─────────────────────────────────────────

export function drawVsSeparator(ctx) {
  const cx = W / 2;

  // Línea vertical
  ctx.strokeStyle = DOT_COLOR;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx, 55);
  ctx.lineTo(cx, CONTENT_H - 55);
  ctx.stroke();

  // Círculo naranja con "VS"
  const cy = CONTENT_H / 2;
  const r  = 26;
  ctx.fillStyle = BRAND;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'white';
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('VS', cx, cy);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}

// ─── Etiqueta de categoría comparativa ───────────────────────────────────────

export function drawCompLabel(ctx, text, centerX, y, bg, fg) {
  ctx.font = 'bold 13px Arial';
  const tw = ctx.measureText(text).width;
  const bw = tw + 24, bh = 26;
  const bx = centerX - bw / 2;

  ctx.fillStyle = bg;
  roundRect(ctx, bx, y, bw, bh, 4);
  ctx.fill();

  ctx.fillStyle = fg;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, centerX, y + bh / 2);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}
