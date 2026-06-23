/**
 * Configuración de las guías de compra de FitzDesk.
 *
 * Cada guía tiene dos sistemas de imagen:
 *   - layout + productos → generateGuideImages.js  (compositor Sharp, sin API)
 *   - dallePrompt        → generateDalleImages.js  (DALL-E 3, requiere OPENAI_API_KEY)
 *
 * El sistema real usado en producción es el compositor (fotos de producto reales,
 * sin IA) — dallePrompt queda como alternativa no usada hasta ahora.
 *
 * Layouts disponibles: 'three-products' | 'comparison' | 'three-products-premium' | 'dual-monitor'
 */
export const GUIDES = [
  {
    slug:   'doble-monitor-teletrabajo-merece-la-pena',
    titulo: 'Doble monitor en teletrabajo: ¿merece la pena?',
    layout: 'dual-monitor',
    total:  '~808€',
    productos: [
      { imagen: 'dell-s2722qc-analisis.webp', precio: '329€' },
      { imagen: 'lg-27un880.webp',             precio: '479€' },
    ],
  },
  {
    slug:   'mejor-setup-teletrabajo-500-euros-2026',
    titulo: 'El mejor setup para teletrabajo por menos de 500€',
    layout: 'three-products',
    total:  '~277€',
    productos: [
      { imagen: 'benq-gw2780-analisis.webp',            rol: 'principal',  precio: '149€' },
      { imagen: 'keychron-v1-analisis.webp',             rol: 'secundario', precio: '79€'  },
      { imagen: 'logitech-mx-anywhere-3s-analisis.webp', rol: 'secundario', precio: '49€'  },
    ],
    dallePrompt: `Cartoon 2D digital illustration, clean flat design style. A neat and minimal home office desk setup viewed from a slight front angle. On the wooden desk: a 27-inch monitor showing a simple productivity dashboard, a compact mechanical keyboard with brown keycaps, and a small wireless mouse to the right side. The desk is clean and organized, with soft warm lighting from above. In the bottom-left corner, a small cute cartoon squirrel with orange fur, large round glasses, a tiny red bow tie, a small red hair crest, and a big fluffy brownish-red tail. The squirrel is giving a thumbs up with a satisfied expression. The overall scene transmits 'affordable but complete workspace'. Background: very light gray (#F9FAFB), no clutter, minimalist style. Color palette: warm whites, light wood tones, with subtle orange accents. No text in the image. Professional and clean illustration.`,
  },
  {
    slug:   'raton-ergonomico-vs-estandar-teletrabajo',
    titulo: 'Ratón ergonómico vs ratón estándar: ¿cuál necesitas?',
    layout: 'comparison',
    productos: [
      {
        imagen:    'logitech-lift-vertical-analisis.webp',
        etiqueta:  'Vertical / Ergonómico',
        labelBg:   '#DBEAFE',
        labelText: '#1E40AF',
      },
      {
        imagen:    'logitech-mx-master-3s-analisis.webp',
        etiqueta:  'Estándar / Productividad',
        labelBg:   '#FEF3C7',
        labelText: '#92400E',
      },
    ],
    dallePrompt: `Cartoon 2D digital illustration, clean flat design style. Split screen comparison image divided exactly in half vertically by a thin white line. LEFT SIDE: soft blue background (#DBEAFE), showing a vertical ergonomic mouse (tall, upright design like Logitech Lift) placed on a small pedestal, viewed from the front. Label area below the mouse (no text, just space). RIGHT SIDE: warm amber background (#FEF3C7), showing a standard horizontal wireless mouse (premium shape like MX Master) placed on a small pedestal, viewed from the front. Label area below the mouse (no text, just space). CENTER: Standing exactly on the dividing line, a small cute cartoon squirrel referee with orange fur, large round glasses, wearing a black and white vertical striped referee shirt, red bow tie visible above the collar, small red hair crest, big fluffy brownish-red tail. The squirrel has both arms raised outward in a referee pose, with a funny serious expression like judging a competition. The two mice are perfectly symmetrical on each side. Clean, flat, professional cartoon style. No text in the image.`,
  },
  {
    slug:   'setup-teletrabajo-profesional-2026',
    titulo: 'Setup de teletrabajo profesional 2026',
    layout: 'three-products-premium',
    productos: [
      { imagen: 'lg-27up850n-analisis.webp',          rol: 'principal',  precio: '399€' },
      { imagen: 'keychron-k8-pro-analisis.webp',       rol: 'secundario', precio: '109€' },
      { imagen: 'logitech-mx-master-3s-analisis.webp', rol: 'secundario', precio: '99€'  },
    ],
    dallePrompt: `Cartoon 2D digital illustration, clean flat design style. A premium and aspirational home office desk setup viewed from a slight elevated front angle. On a wide dark walnut desk: a large 27-inch 4K monitor as the centerpiece showing a clean workspace, a premium full-size mechanical keyboard with dark keycaps centered in front of the monitor, a premium ergonomic wireless mouse to the right, and a minimalist USB-C hub to the left side. The setup looks immaculate, high-end, and aspirational. Soft premium lighting, subtle depth shadows. In the bottom-right corner, a small cute cartoon squirrel with orange fur, large round glasses, a tiny red bow tie, small red hair crest, and a big fluffy brownish-red tail. The squirrel is wearing a small black blazer over the bow tie, pointing upward with one finger as if saying 'this is the best', with a confident and proud expression. Background: very light gray (#F9FAFB), ultra clean and minimal. Color palette: dark wood tones, dark peripherals, with warm premium lighting. No text in the image. Premium, aspirational, professional illustration.`,
  },
];
