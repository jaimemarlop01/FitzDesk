import Groq from 'groq-sdk';
import { logInfo, logWarn } from './notifier.js';

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

  if (!content) {
    logWarn(`Groq no devolvió contenido para "${title}"`);
    return null;
  }

  return { content, slug, categoria };
}
