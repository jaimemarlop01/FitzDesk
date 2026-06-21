import Groq from 'groq-sdk';
import { parse as parseHtml } from 'node-html-parser';
import { logInfo, logWarn } from './notifier.js';

if (!process.env.GROQ_API_KEY) {
  console.error('ERROR: GROQ_API_KEY no definida');
  process.exit(1);
}
const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 80);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function detectCategory(text) {
  const t = text.toLowerCase();
  if (/ratón|raton|mouse|logitech mx|lift vertical|mx anywhere/.test(t)) return 'ratones';
  if (/teclado|keyboard|mecánico|mecanico|keychron|corsair k|razer hunt/.test(t)) return 'teclados';
  if (/monitor|pantalla|display|benq|dell s\d|lg \d+u/.test(t)) return 'monitores';
  if (/portátil|portatil|laptop|notebook|macbook|thinkpad|gram/.test(t)) return 'portatiles';
  return 'setups';
}

export async function searchPcComponentes(productName) {
  const query = encodeURIComponent(productName);
  const searchUrl = `https://www.pccomponentes.com/buscador/?query=${query}`;

  try {
    const res = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept-Language': 'es-ES,es;q=0.9',
        'Accept': 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      logWarn(`⚠️ PcComponentes respondió ${res.status} → usando enlace de búsqueda`);
      return { found: false, precio: 'Ver en PcComponentes', url: searchUrl };
    }

    const html = await res.text();
    const root = parseHtml(html);

    let precio = null;
    let url = null;

    const card = root.querySelector('[class*="product-card"]');
    if (card) {
      const priceEl = card.querySelector('[class*="product-card__price"],[class*="price"],[data-price]');
      const anchor  = card.querySelector('a[href]');
      const rawPrice = priceEl?.text?.trim() ?? '';
      const href     = anchor?.getAttribute('href') ?? '';
      if (rawPrice) precio = rawPrice.replace(/\s+/g, ' ').trim();
      if (href) url = href.startsWith('http') ? href : `https://www.pccomponentes.com${href}`;
    }

    if (precio && url) {
      logInfo(`✅ Precio encontrado: ${precio} → ${url}`);
      return { found: true, precio, url };
    }

    logWarn(`⚠️ Precio no encontrado → usando enlace de búsqueda`);
    return { found: false, precio: 'Ver en PcComponentes', url: searchUrl };

  } catch (err) {
    logWarn(`⚠️ Error buscando en PcComponentes: ${err.message} → usando enlace de búsqueda`);
    return { found: false, precio: 'Ver en PcComponentes', url: searchUrl };
  }
}

function injectPcData(content, pcResult) {
  const { precio, url, found } = pcResult;
  const precioDisplay = found ? precio : 'Ver en PcComponentes';

  let updated = content
    .replace(/^precio:\s*"[^"]*"/m, `precio: "${precioDisplay}"`)
    .replace(/^enlace_afiliado:\s*"[^"]*"/m, `enlace_afiliado: "${url}"`);

  if (found) {
    updated = updated.replace(
      /^(enlace_afiliado:\s*"[^"]*")$/m,
      `$1\nprecio_encontrado_automaticamente: true`,
    );
  }

  // Insertar nota de precio después del cierre del frontmatter
  const fmEnd = updated.indexOf('\n---\n');
  if (fmEnd !== -1) {
    const note = [
      `> 💰 **Precio detectado automáticamente**: ${precioDisplay}`,
      `> 🔗 **Enlace PcComponentes**: ${url}`,
      `> ⚠️ Verifica el precio antes de publicar ya que puede haber cambiado desde la generación del borrador.`,
      '',
    ].join('\n');
    updated = updated.slice(0, fmEnd + 5) + note + updated.slice(fmEnd + 5);
  }

  return updated;
}

export async function generateDraft({ title, description, link, source }) {
  logInfo(`Generando borrador para: "${title}"`);

  const slug = slugify(title);
  const categoria = detectCategory(title + ' ' + description);

  const prompt = `Eres el redactor principal de FitzDesk, una web española de análisis de periféricos y setups para teletrabajo y productividad. Tono: cercano, honesto y técnico. Audiencia: trabajadores remotos que quieren mejorar su setup sin ser expertos en hardware.

PRINCIPIOS EDITORIALES OBLIGATORIOS:
- VERACIDAD: Nunca inventes pruebas. Usa "Según sus especificaciones...", "Sobre el papel...", "Cabe esperar que..."
- INDEPENDENCIA: No ocultes defectos importantes
- SIN ABSOLUTOS: No uses "El mejor del mercado". Usa "Destaca dentro de su categoría"
- Idioma: español de España

Basándote en esta noticia detectada automáticamente:
- Título: ${title}
- Descripción: ${description}
- Fuente: ${source}
- URL original: ${link}

Genera un borrador de análisis en Markdown con este frontmatter exacto:

---
title: "[título SEO, máximo 70 caracteres]"
categoria: "${categoria}"
fecha: "${today()}"
descripcion: "[descripción SEO, máximo 150 caracteres]"
imagen: "/images/articulos/${slug}.webp"
puntuacion: [estimación del 1 al 10 basada en lo conocido]
precio: "pendiente"
enlace_afiliado: "https://www.pccomponentes.com"
tiempo_lectura: "7 min"
tipo: "analisis"
keyword_principal: "[keyword principal del producto]"
keywords_secundarias:
  - "[keyword 2]"
  - "[keyword 3]"
  - "[keyword 4]"
fitzQuote: "[veredicto corto de Fitz en 2-3 frases, terminando con 'Mi nota: X/10']"
borrador: true
---

<!--
⚠️  BORRADOR AUTOMÁTICO — Revisar antes de publicar
📋  Pendiente:
    - [ ] Precio real en PcComponentes
    - [ ] Enlace de afiliado exacto
    - [ ] Imagen real del producto
    - [ ] Verificar puntuación con análisis real
    - [ ] Especificaciones técnicas detalladas
    - [ ] Eliminar borrador: true al publicar
-->

Escribe el cuerpo del artículo con estas secciones. Marca con [COMPLETAR: descripción] donde falte información concreta:

## Introducción
2 párrafos. Por qué este producto es relevante para el trabajador remoto. A quién va dirigido. Sin adelantar la conclusión.

## Características técnicas explicadas
Las 4-5 specs más importantes. Traduce cada spec a un beneficio real de uso. Nunca copies fichas técnicas literalmente.

## Experiencia de uso esperada
Basada únicamente en especificaciones. Usa "cabe esperar que..." o "por sus características...". 2-3 escenarios reales de uso en teletrabajo.

## Lo mejor
- **ventaja en negrita** + frase de explicación (4-5 puntos)

## Lo mejorable
- 2-3 puntos débiles honestos

## ¿Para quién es ideal?
**Perfil A (sí):** usuario que sacará el máximo partido. Sé específico (horas de uso, necesidades concretas).
**Perfil B (no):** usuario que debería buscar otra opción.

## Preguntas frecuentes

**¿Merece la pena comprarlo?**
Respuesta directa en 2-3 líneas.

**¿Cuál es su principal ventaja respecto a la competencia?**
La ventaja más diferencial en 2-3 líneas.

**¿Qué alternativa existe en el mismo rango de precio?**
Nombra 1 alternativa concreta.

## 🐿️ Fitz recomienda
Veredicto en primera persona. Exactamente 3 frases: punto fuerte clave + punto débil más importante + frase de cierre con recomendación. Termina con: "Mi nota: X/10"

## Conclusión
1 párrafo de cierre orientado a la acción. Sin ser agresivo.

> ⚠️ **Aviso de afiliado**: Si compras a través de nuestros enlaces podemos recibir una pequeña comisión sin coste adicional para ti. Esto nos ayuda a seguir publicando análisis honestos e independientes.

Extensión: 900-1.100 palabras en el cuerpo. Español de España.`;

  const completion = await client.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = completion.choices[0]?.message?.content ?? '';
  const tokensUsed = completion.usage?.total_tokens ?? 0;

  if (!content) {
    logWarn(`Groq no devolvió contenido para "${title}"`);
    return null;
  }

  // Forzar borrador: true — la IA genera el frontmatter como texto libre y
  // puede desviarse del ejemplo del prompt (p. ej. escribir "false")
  const normalizedContent = /^borrador:\s*(true|false)\s*$/m.test(content)
    ? content.replace(/^borrador:\s*(true|false)\s*$/m, 'borrador: true')
    : content.replace(/\n---\n/, '\nborrador: true\n---\n');

  // Buscar precio real en PcComponentes
  logInfo(`  🔍 Buscando precio en PcComponentes para: "${title}"`);
  const pcResult = await searchPcComponentes(title);
  const enrichedContent = injectPcData(normalizedContent, pcResult);

  return {
    content: enrichedContent,
    slug,
    categoria,
    pcPrice:     pcResult.precio,
    pcUrl:       pcResult.url,
    pcFound:     pcResult.found,
    tokensUsed,
  };
}
