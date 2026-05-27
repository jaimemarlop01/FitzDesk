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

  const prompt = `Eres el redactor principal de FitzDesk, una web española de análisis de periféricos
y setups de teletrabajo. Tu voz es cercana, honesta y técnica a la vez.

Basándote en esta noticia detectada automáticamente:
- Título: ${title}
- Descripción: ${description}
- Fuente: ${source}
- URL original: ${link}

Genera un borrador de análisis en Markdown con este frontmatter exacto al inicio:

---
title: "[título SEO optimizado del artículo, máximo 70 caracteres]"
categoria: "${categoria}"
fecha: "${today()}"
descripcion: "[descripción SEO de máximo 150 caracteres]"
imagen: "/images/${slug}.jpg"
puntuacion: 0
precio: "pendiente"
enlace_afiliado: "https://www.pccomponentes.com"
borrador: true
tiempo_lectura: "7 min"
fitzQuote: "pendiente de completar"
---

<!--
⚠️  BORRADOR AUTOMÁTICO — Revisar antes de publicar
📋  Datos pendientes de completar:
    - [ ] Precio real actual en PcComponentes
    - [ ] Enlace de afiliado exacto al producto
    - [ ] Imagen real del producto (reemplazar /images/${slug}.jpg)
    - [ ] Puntuación (0-10) basada en análisis real
    - [ ] Especificaciones técnicas detalladas
    - [ ] FitzQuote personalizado
    - [ ] Revisión y edición del contenido generado
-->

Incluye estas secciones en el cuerpo del artículo, marcando con [COMPLETAR: descripción]
donde falte información específica del producto:

## Introducción (2 párrafos sobre relevancia para trabajadores remotos)

## Características técnicas principales
(Basarte en lo conocido, marcar specs detalladas con [COMPLETAR])

## Experiencia de uso esperada
(Basarte en la categoría y tipo de producto)

## Lo mejor
- [4-5 puntos fuertes conocidos o esperados]

## Lo mejorable
- [2-3 puntos débiles realistas]

## ¿Para quién es ideal?
(Perfil de usuario que se beneficia más)

## Conclusión
(Párrafo de cierre orientado a la acción)

> **Aviso de afiliado**: Si compras a través de nuestros enlaces podemos recibir una comisión sin coste adicional para ti.

Escribe en español de España. Extensión: 600-800 palabras en el cuerpo.
Recuerda que es un BORRADOR que necesita revisión humana.`;

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
