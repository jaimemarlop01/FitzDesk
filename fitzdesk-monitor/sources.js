/**
 * Fuentes RSS a monitorizar.
 * Para añadir Google Alerts: crea una alerta en https://www.google.com/alerts,
 * selecciona "Feed RSS" como destino y pega la URL aquí.
 */
export const SOURCES = [
  {
    name: 'Xataka',
    url: 'https://feeds.weblogssl.com/xataka2',
    enabled: true,
  },
  {
    name: 'Genbeta',
    url: 'https://feeds.weblogssl.com/genbeta',
    enabled: true,
  },
  // PcComponentes bloquea scraping externo (403) — desactivado
  // { name: 'PcComponentes', url: 'https://www.pccomponentes.com/rss', enabled: false },

  // Google Alerts — añade tus feeds RSS aquí:
  // { name: 'Alert: teclado mecánico', url: 'https://www.google.com/alerts/feeds/TU_ID/...', enabled: true },
];

// ─────────────────────────────────────────────
// FILTRADO DE DOS CAPAS
// ─────────────────────────────────────────────

/**
 * Capa 1A — Tipo de producto (debe aparecer al menos uno)
 */
export const KEYWORDS_PRODUCTO = [
  'ratón', 'raton', 'mouse',
  'teclado', 'keyboard', 'mecánico', 'mecanico',
  'monitor', 'pantalla',
  'portátil', 'portatil', 'laptop', 'notebook',
  'auriculares', 'headset', 'headphones',
  'webcam', 'cámara web', 'camara web',
  'hub usb', 'hub-usb', 'dock', 'docking',
  'alfombrilla', 'mousepad', 'mouse pad',
  'soporte portátil', 'soporte portatil', 'laptop stand',
  'silla ergonómica', 'silla ergonomica', 'silla de oficina',
  'escritorio', 'standing desk', 'mesa elevable',
  'setup teletrabajo', 'home office setup',
];

/**
 * Capa 1B — Contexto de teletrabajo (debe aparecer al menos uno)
 */
export const KEYWORDS_CONTEXTO = [
  'teletrabajo', 'trabajo en casa', 'trabajo remoto', 'trabajo desde casa',
  'home office', 'remote work', 'oficina en casa',
  'productividad', 'productivity',
  'trabajo', 'office', 'escritorio', 'desk',
  'profesional', 'professional',
  'ergonómico', 'ergonomico', 'ergonomía', 'ergonomia',
];

/**
 * Lista combinada para compatibilidad con código existente.
 * La capa 1 estricta requiere coincidencia en AMBOS grupos.
 */
export const KEYWORDS = [...KEYWORDS_PRODUCTO, ...KEYWORDS_CONTEXTO];

/**
 * Comprueba si un item supera el filtro estricto de Capa 1.
 * Requiere al menos 1 keyword de PRODUCTO y 1 de CONTEXTO.
 */
export function passesStrictFilter(item) {
  const text = `${item.title ?? ''} ${item.contentSnippet ?? ''} ${item.content ?? ''}`.toLowerCase();
  const hasProducto = KEYWORDS_PRODUCTO.some(kw => text.includes(kw.toLowerCase()));
  const hasContexto = KEYWORDS_CONTEXTO.some(kw => text.includes(kw.toLowerCase()));
  return hasProducto && hasContexto;
}
