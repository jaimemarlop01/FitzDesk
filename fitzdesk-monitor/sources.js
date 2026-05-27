/**
 * Fuentes RSS a monitorizar.
 * Añade o elimina fuentes según tus necesidades.
 * Google Alerts: crea alertas en https://www.google.com/alerts y copia la URL del feed RSS aquí.
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
    name: 'PcComponentes Novedades',
    url: 'https://www.pccomponentes.com/rss',
    enabled: true,
  },
  // Ejemplo de Google Alert — reemplaza la URL con la tuya:
  // {
  //   name: 'Google Alert — teclados mecánicos',
  //   url: 'https://www.google.com/alerts/feeds/YOUR_ALERT_ID/...',
  //   enabled: true,
  // },
];

/** Palabras clave para filtrar artículos relevantes para FitzDesk */
export const KEYWORDS = [
  'ratón', 'raton', 'mouse',
  'teclado', 'keyboard', 'mecánico', 'mecanico',
  'monitor', 'pantalla',
  'portátil', 'portatil', 'laptop',
  'periférico', 'periferico', 'setup', 'escritorio',
  'logitech', 'keychron', 'razer', 'corsair',
  'lg', 'dell', 'asus', 'lenovo', 'benq', 'samsung',
  'mx master', 'mx keys', 'mx anywhere',
  'hub usb', 'usb-c', 'thunderbolt',
  'ergonómico', 'ergonomico', 'teletrabajo',
];
