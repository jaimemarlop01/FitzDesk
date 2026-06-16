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
  {
    name: 'Hardzone',
    url: 'https://hardzone.es/feed',
    enabled: true,
  },
  {
    name: 'El Chapuzas Informático',
    url: 'https://elchapuzasinformatico.com/feed/',
    enabled: true,
  },
  // PcComponentes bloquea scraping externo (403) — desactivado
  // { name: 'PcComponentes', url: 'https://www.pccomponentes.com/rss', enabled: false },

  // Google Alerts
  { name: 'Alert: nuevo ratón teletrabajo 2026',       url: 'https://www.google.com/alerts/feeds/07327459440318242948/6619462226204092208',   enabled: true },
  { name: 'Alert: nuevo teclado mecánico 2026',        url: 'https://www.google.com/alerts/feeds/07327459440318242948/92159700337889665',    enabled: true },
  { name: 'Alert: monitor USB-C teletrabajo',          url: 'https://www.google.com/alerts/feeds/07327459440318242948/15939236646229242629', enabled: true },
  { name: 'Alert: portátil ultrabook 2026',            url: 'https://www.google.com/alerts/feeds/07327459440318242948/92159700337890514',    enabled: true },
  { name: 'Alert: Logitech nuevo lanzamiento',         url: 'https://www.google.com/alerts/feeds/07327459440318242948/16253851313461134755', enabled: true },
  { name: 'Alert: Keychron nuevo modelo',              url: 'https://www.google.com/alerts/feeds/07327459440318242948/15939236646229244074', enabled: true },
  { name: 'Alert: periféricos productividad',          url: 'https://www.google.com/alerts/feeds/07327459440318242948/92159700337893097',    enabled: true },
  { name: 'Alert: Dell nuevo monitor 2026',            url: 'https://www.google.es/alerts/feeds/07327459440318242948/12175609179661096621',  enabled: true },
  { name: 'Alert: LG nuevo monitor portátil 2026',     url: 'https://www.google.es/alerts/feeds/07327459440318242948/12175609179661097176',  enabled: true },
];

// ─────────────────────────────────────────────
// FILTRADO DE TRES CAPAS
// ─────────────────────────────────────────────

/**
 * Regla 1 — Descarte obligatorio.
 * Si el texto contiene alguna de estas palabras, se descarta sin importar nada más.
 *
 * Nota editorial: "gaming" NO está en esta lista — productos de origen gaming
 * pueden ser válidos para teletrabajo (ratones de precisión, teclados mecánicos,
 * monitores de alta resolución, portátiles potentes). Solo se descartan los
 * artículos sobre ocio puro: videojuegos, consolas, mandos, etc.
 */
export const KEYWORDS_DESCARTE = [
  'gemini', 'chatgpt', 'inteligencia artificial', 'ia generativa',
  'modelo de lenguaje', 'openai',
  'videojuego', 'juego pc', 'mmorpg', 'fps', 'rpg',
  'xbox', 'playstation', 'ps5', 'nintendo', 'consola',
  'steam deck', 'rog ally', 'legion go',
  'game', 'juego',
  'smartphone', 'móvil', 'movil', 'teléfono', 'telefono', 'tablet',
  'drone', 'vehículo', 'vehiculo', 'coche',
  'economía', 'economia', 'bolsa', 'inversión', 'inversion',
  'salud', 'medicina',
];

/**
 * Regla 2 — Producto físico (debe aparecer al menos uno).
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
  'soporte monitor', 'soporte portátil', 'soporte portatil', 'laptop stand',
  'silla ergonómica', 'silla ergonomica', 'silla de oficina',
  'setup escritorio', 'standing desk', 'mesa elevable',
  'setup teletrabajo', 'home office setup',
  'ssd externo', 'ssd portatil', 'ssd portátil',
  'disco duro externo', 'almacenamiento externo',
  'usb-c ssd', 'nvme externo', 'pendrive', 'unidad externa',
];

/**
 * Regla 3 — Marca de hardware (debe aparecer al menos una).
 */
export const KEYWORDS_MARCA = [
  'logitech', 'keychron', 'benq', 'steelseries', 'corsair', 'razer',
  'jabra', 'sony wh', 'bose',
  'lg', 'dell', 'samsung', 'asus', 'lenovo',
  'microsoft surface', 'apple macbook',
  'hp',
  'adata', 'samsung t9', 'sandisk', 'seagate',
  'western digital', 'wd', 'crucial', 'kingston',
];

/**
 * Contexto de teletrabajo — se mantiene como referencia pero ya no es obligatorio.
 */
export const KEYWORDS_CONTEXTO = [
  'teletrabajo', 'trabajo en casa', 'trabajo remoto', 'trabajo desde casa',
  'home office', 'remote work', 'oficina en casa',
  'productividad', 'productivity',
  'trabajo', 'office', 'escritorio', 'desk',
  'profesional', 'professional',
  'ergonómico', 'ergonomico', 'ergonomía', 'ergonomia',
];

export const KEYWORDS = [...KEYWORDS_PRODUCTO, ...KEYWORDS_CONTEXTO];

// Helper genérico: límites de palabra para términos cortos (≤4 chars) para
// evitar falsos positivos ("lg" en "algo", "hp" en "https", "app" en "apple").
function hasWord(text, kw) {
  if (kw.length <= 4) {
    return new RegExp('\\b' + kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i').test(text);
  }
  return text.includes(kw);
}

// Helper exclusivo para KEYWORDS_DESCARTE: siempre aplica límites de palabra
// sin importar longitud, para evitar que "tablet" coincida en "tablets" o
// "movil" active el filtro en nombres de producto como "Logitech Mobi Fold".
function hasWordDescarte(text, kw) {
  const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp('\\b' + escaped + '\\b', 'i').test(text);
}

/**
 * Comprueba si un item supera el filtro estricto.
 *
 * Regla 1: descarte obligatorio — si contiene alguna palabra de KEYWORDS_DESCARTE → false
 * Regla 2: debe mencionar al menos 1 producto físico de KEYWORDS_PRODUCTO
 * Regla 3: debe mencionar al menos 1 marca de KEYWORDS_MARCA
 * Solo si cumple 2 y 3 simultáneamente → true
 */
export function passesStrictFilter(item) {
  const text = `${item.title ?? ''} ${item.contentSnippet ?? ''} ${item.content ?? ''}`.toLowerCase();

  if (KEYWORDS_DESCARTE.some(kw => hasWordDescarte(text, kw))) return false;

  const hasProducto = KEYWORDS_PRODUCTO.some(kw => hasWord(text, kw));
  const hasMarca    = KEYWORDS_MARCA.some(kw => hasWord(text, kw));

  return hasProducto && hasMarca;
}

/**
 * Diagnostica por qué un item pasa o es descartado.
 * Retorna: { pass: boolean, layer: 0|1|2|3, reason: string }
 *   layer 0 → pasa todos los filtros
 *   layer 1 → descartado por palabra prohibida (KEYWORDS_DESCARTE)
 *   layer 2 → no menciona ningún producto físico (KEYWORDS_PRODUCTO)
 *   layer 3 → menciona producto pero no marca reconocida (KEYWORDS_MARCA)
 */
export function diagnoseFilter(item) {
  const text = `${item.title ?? ''} ${item.contentSnippet ?? ''} ${item.content ?? ''}`.toLowerCase();

  const matchedDescarte = KEYWORDS_DESCARTE.find(kw => hasWordDescarte(text, kw));
  if (matchedDescarte) {
    return { pass: false, layer: 1, reason: `Palabra de descarte: "${matchedDescarte}"` };
  }

  const matchedProducto = KEYWORDS_PRODUCTO.find(kw => hasWord(text, kw));
  if (!matchedProducto) {
    return { pass: false, layer: 2, reason: 'Sin producto físico reconocido (ratón, teclado, monitor, portátil, SSD…)' };
  }

  const matchedMarca = KEYWORDS_MARCA.find(kw => hasWord(text, kw));
  if (!matchedMarca) {
    return { pass: false, layer: 3, reason: `Producto detectado ("${matchedProducto}") pero sin marca reconocida` };
  }

  return { pass: true, layer: 0, reason: `Producto: "${matchedProducto}" · Marca: "${matchedMarca}"` };
}
