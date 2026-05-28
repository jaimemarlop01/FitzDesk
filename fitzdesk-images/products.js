/**
 * Lista de productos con sus fuentes de imagen.
 *
 * officialUrl   — URL directa a la imagen del fabricante (intento 1)
 * fallbackUrl   — Página del producto para extraer og:image (intento 2)
 * referer       — Referer HTTP para evitar bloqueos de CDN
 * aliasOf       — Slug del que copiar la imagen (para guías/comparativas)
 */
export const PRODUCTS = [

  // ── RATONES ─────────────────────────────────────────────────────────
  {
    slug:        'logitech-mx-master-3s-analisis',
    name:        'Logitech MX Master 3S',
    brand:       'Logitech',
    officialUrl: 'https://resource.logitech.com/content/dam/logitech/en/products/mice/mx-master-3s/gallery/mx-master-3s-top-view-graphite.png',
    fallbackUrl: 'https://www.logitech.com/en-us/products/mice/mx-master-3s.910-006556.html',
    referer:     'https://www.logitech.com/',
  },
  {
    slug:        'logitech-lift-vertical-analisis',
    name:        'Logitech Lift Vertical',
    brand:       'Logitech',
    officialUrl: 'https://resource.logitech.com/content/dam/logitech/en/products/mice/lift-vertical/gallery/lift-vertical-top-view-off-white.png',
    fallbackUrl: 'https://www.logitech.com/en-us/products/mice/lift-vertical-ergonomic-mouse.html',
    referer:     'https://www.logitech.com/',
  },
  {
    slug:        'logitech-mx-anywhere-3s-analisis',
    name:        'Logitech MX Anywhere 3S',
    brand:       'Logitech',
    officialUrl: 'https://resource.logitech.com/content/dam/logitech/en/products/mice/mx-anywhere-3s/gallery/mx-anywhere-3s-top-view-graphite.png',
    fallbackUrl: 'https://www.logitech.com/en-us/products/mice/mx-anywhere-3s.html',
    referer:     'https://www.logitech.com/',
  },

  // ── TECLADOS ─────────────────────────────────────────────────────────
  {
    slug:        'keychron-k8-pro-analisis',
    name:        'Keychron K8 Pro',
    brand:       'Keychron',
    officialUrl: 'https://cdn.shopify.com/s/files/1/0059/0630/1017/files/keychron-k8-pro-QMK-tenkeyless-wireless-mechanical-keyboard-with-hot-swappable-keychron-K-pro-switch.jpg',
    fallbackUrl: 'https://www.keychron.com/products/keychron-k8-pro-qmk-via-wireless-mechanical-keyboard',
    referer:     'https://www.keychron.com/',
  },
  {
    slug:        'logitech-mx-keys-s-analisis',
    name:        'Logitech MX Keys S',
    brand:       'Logitech',
    officialUrl: 'https://resource.logitech.com/content/dam/logitech/en/products/keyboards/mx-keys-s/gallery/mx-keys-s-top-view-graphite.png',
    fallbackUrl: 'https://www.logitech.com/en-us/products/keyboards/mx-keys-s.html',
    referer:     'https://www.logitech.com/',
  },
  {
    slug:        'keychron-v1-analisis',
    name:        'Keychron V1',
    brand:       'Keychron',
    officialUrl: 'https://cdn.shopify.com/s/files/1/0059/0630/1017/files/keychron-v1-QMK-custom-mechanical-keyboard.jpg',
    fallbackUrl: 'https://www.keychron.com/products/keychron-v1-qmk-via-custom-mechanical-keyboard',
    referer:     'https://www.keychron.com/',
  },

  // ── MONITORES ────────────────────────────────────────────────────────
  {
    slug:        'lg-27up850n-analisis',
    name:        'LG 27UP850N-W',
    brand:       'LG',
    officialUrl: null, // URL de descarga autenticada, usar fallback
    fallbackUrl: 'https://www.lg.com/es/monitores/lg-27up850n-w',
    referer:     'https://www.lg.com/',
  },
  {
    slug:        'dell-s2722qc-analisis',
    name:        'Dell S2722QC',
    brand:       'Dell',
    officialUrl: null, // URL original era .psd (Photoshop), usar fallback
    fallbackUrl: 'https://www.dell.com/es-es/shop/dell-27-4k-usb-c-monitor-s2722qc/apd/210-bbyz/monitors-monitor-accessories',
    referer:     'https://www.dell.com/',
  },
  {
    slug:        'benq-gw2780-analisis',
    name:        'BenQ GW2780',
    brand:       'BenQ',
    officialUrl: 'https://image.benq.com/is/image/benqco/gw2780-pdp-image1?$ResponsiveImage$',
    fallbackUrl: 'https://www.benq.com/es-es/monitor/stylish/gw2780/',
    referer:     'https://www.benq.com/',
  },

  // ── PORTÁTILES ──────────────────────────────────────────────────────
  {
    slug:        'lg-gram-14-2025-analisis',
    name:        'LG Gram 14 2025',
    brand:       'LG',
    officialUrl: null, // URL placeholder inválida, usar fallback
    fallbackUrl: 'https://www.lg.com/es/portatiles/gram/',
    referer:     'https://www.lg.com/',
  },
  {
    slug:        'asus-vivobook-15-oled-analisis',
    name:        'ASUS Vivobook 15 OLED',
    brand:       'ASUS',
    officialUrl: 'https://dlcdnwebimgs.asus.com/gain/vivobook-15-oled-k513/img/kv.jpg',
    fallbackUrl: 'https://www.asus.com/es/laptops/for-home/vivobook/vivobook-15-oled/',
    referer:     'https://www.asus.com/',
  },
  {
    slug:        'lenovo-thinkpad-e14-gen6-analisis',
    name:        'Lenovo ThinkPad E14 Gen 6',
    brand:       'Lenovo',
    officialUrl: 'https://p1-ofp.static.pub/medias/bWFzdGVyfHJvb3R8/ThinkPad-E14-Gen6.png',
    fallbackUrl: 'https://www.lenovo.com/es/es/laptops/thinkpad/thinkpad-e-series/',
    referer:     'https://www.lenovo.com/',
  },

  // ── GUÍAS (usan imagen de otro producto) ─────────────────────────────
  {
    slug:    'mejor-setup-teletrabajo-500-euros-2026',
    name:    'Setup Teletrabajo 500€',
    brand:   null,
    aliasOf: 'benq-gw2780-analisis',
  },
  {
    slug:    'raton-ergonomico-vs-estandar-teletrabajo',
    name:    'Ratón Ergonómico vs Estándar',
    brand:   null,
    aliasOf: 'logitech-lift-vertical-analisis',
  },
  {
    slug:    'setup-teletrabajo-profesional-2026',
    name:    'Setup Profesional 2026',
    brand:   null,
    aliasOf: 'lg-27up850n-analisis',
  },

  // ── ARTÍCULOS EXTRA (fuera de los 15 principales) ────────────────────
  {
    slug:    'logitech-mx-master-3s',
    name:    'Logitech MX Master 3S (bis)',
    brand:   null,
    aliasOf: 'logitech-mx-master-3s-analisis',
  },
  {
    slug:        'keychron-k2-v2',
    name:        'Keychron K2 V2',
    brand:       'Keychron',
    officialUrl: 'https://cdn.shopify.com/s/files/1/0059/0630/1017/files/Keychron-K2-wireless-mechanical-keyboard-brown-switch.jpg',
    fallbackUrl: 'https://www.keychron.com/products/keychron-k2-wireless-mechanical-keyboard',
    referer:     'https://www.keychron.com/',
  },
  {
    slug:        'lg-27un880',
    name:        'LG 27UN880',
    brand:       'LG',
    officialUrl: null,
    fallbackUrl: 'https://www.lg.com/es/monitores/',
    referer:     'https://www.lg.com/',
  },
];
