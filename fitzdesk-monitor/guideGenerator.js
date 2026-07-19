/**
 * FitzDesk Guide Generator
 * Genera un artículo de guía de setup usando Groq (Prompt 3).
 *
 * Uso: node guideGenerator.js --config guia-ejemplo.json
 */

import 'dotenv/config';
import Groq from 'groq-sdk';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname   = dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = resolve(__dirname, '../src/content/articulos');

if (!process.env.GROQ_API_KEY) {
  console.error('ERROR: GROQ_API_KEY no definida');
  process.exit(1);
}
const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

function today() { return new Date().toISOString().slice(0, 10); }

import { slugify } from './utils/slugify.js';

async function generateGuia(config) {
  const { titulo, presupuesto, perfil, productos } = config;
  const slug = slugify(titulo);
  const total = productos.reduce((sum, p) => sum + parseFloat(p.precio), 0).toFixed(2);

  const productosStr = productos.map((p, i) =>
    `Producto ${i + 1} — ${p.categoria}:\n- Nombre: ${p.nombre}\n- Precio: ${p.precio}€\n- Enlace: ${p.enlace}\n- Por qué está en el setup: ${p.justificacion}`
  ).join('\n\n');

  const tablaResumen = productos.map(p =>
    `| ${p.nombre} | ${p.categoria} | ${p.precio}€ | [Ver en PcComponentes](${p.enlace}) |`
  ).join('\n');

  const enlacePrincipal = productos[0]?.enlace ?? 'https://www.pccomponentes.com';

  const prompt = `Eres el redactor principal de FitzDesk, una web española de análisis de periféricos y setups para teletrabajo y productividad. Tono: cercano, honesto y técnico. Audiencia: trabajadores en remoto.

PRINCIPIOS OBLIGATORIOS:
- VERACIDAD: Nunca inventes pruebas. Usa "Según sus especificaciones...", "Sobre el papel...", "Cabe esperar que..."
- INDEPENDENCIA: No ocultes defectos importantes
- SIN ABSOLUTOS: No uses "El mejor del mercado"
- Idioma: español de España

Escribe una guía de setup completo para FitzDesk.

DATOS DE LA GUÍA:
- Título: ${titulo}
- Presupuesto total: ${presupuesto}€ (suma real: ${total}€)
- Perfil de usuario: ${perfil}

Productos del setup:
${productosStr}

Genera el artículo completo en Markdown con este frontmatter EXACTO:

---
title: "${titulo}"
categoria: "setups"
fecha: "${today()}"
descripcion: "[descripción SEO, máximo 150 caracteres]"
imagen: "/images/articulos/${slug}.webp"
precio: "Desde ${presupuesto}€"
presupuesto: "${presupuesto}€"
enlace_afiliado: "${enlacePrincipal}"
tiempo_lectura: "10 min"
tipo: "guia"
instagram_slide2_titulo: "[título del slide 2, máximo 5 palabras, describe cuándo/para quién SÍ aplica]"
instagram_slide2_items:
  - "[punto clave 1 — máximo 8 palabras]"
  - "[punto clave 2 — máximo 8 palabras]"
  - "[punto clave 3 — máximo 8 palabras]"
  - "[punto clave 4 — máximo 8 palabras]"
instagram_slide3_titulo: "[título del slide 3, máximo 5 palabras, describe cuándo NO aplica o alternativa]"
instagram_slide3_items:
  - "[punto clave 1 — máximo 8 palabras]"
  - "[punto clave 2 — máximo 8 palabras]"
  - "[punto clave 3 — máximo 8 palabras]"
instagram_veredicto: "[consejo final de Fitz, máximo 18 palabras, sin marcas ni modelos concretos, sin emojis, primera persona]"
borrador: true
---

INSTRUCCIONES PARA LOS CAMPOS DE INSTAGRAM EN EL FRONTMATTER:
- instagram_slide2_titulo / instagram_slide2_items: Los puntos más relevantes de la guía o los argumentos a favor de la opción A si es una comparativa. El título debe resumir el eje del slide (ej: "Cuándo merece la pena", "Para trabajo intensivo"). Máximo 4 items, máximo 8 palabras cada uno.
- instagram_slide3_titulo / instagram_slide3_items: Los casos en que este setup/producto NO aplica, o los argumentos de la opción B si es comparativa. Máximo 3 items, máximo 8 palabras cada uno.
- instagram_veredicto: Una sola frase en primera persona (voz de Fitz), sin nombrar marcas ni modelos concretos, sin emojis. Ejemplo: "Para quien trabaja desde casa con varios dispositivos, este setup lo cambia todo."

ESTRUCTURA OBLIGATORIA DEL CUERPO:

## Introducción
2 párrafos. Describe al lector ideal y el problema que resuelve este setup. Explica la filosofía (precio, comodidad, rendimiento...). Menciona el presupuesto total desde el principio.

## Resumen del setup
Tabla obligatoria siempre al principio del cuerpo:

| Producto | Categoría | Precio | Enlace |
|---|---|---|---|
${tablaResumen}
| **TOTAL** | | **${total}€** | |

## Por qué hemos elegido cada producto
${productos.map(p => `### ${p.nombre}\n2-3 párrafos explicando por qué este producto encaja en este setup y no otro de su categoría. Qué aporta al conjunto.`).join('\n\n')}

## Cómo encajan todos juntos
1-2 párrafos sobre la experiencia del setup completo: coherencia, compatibilidad, flujo de trabajo, comodidad general.

## Posibles mejoras futuras

### Mejora 1: [nombre]
Qué producto añadirías o sustituirías, qué aporta, cuándo merece la pena (presupuesto orientativo).

### Mejora 2: [nombre]
Mismo formato.

### Mejora 3: [nombre]
Mismo formato.

## Alternativas si el presupuesto no llega
2-3 productos alternativos más económicos para cada componente principal. Una frase explicando el sacrificio que supone cada sustitución.

## 🐿️ Fitz recomienda este setup
Veredicto de Fitz en primera persona sobre el setup completo. Qué le gusta del conjunto, cuál es el componente estrella y a quién se lo recomendaría sin dudarlo. Máximo 4 frases, tono directo. Sin puntuación numérica.

## Conclusión
1 párrafo. Recuerda el presupuesto total y el perfil ideal. Llamada a la acción natural. Enlaza a los análisis individuales.

> ⚠️ **Aviso de afiliado**: Si compras a través de nuestros enlaces podemos recibir una pequeña comisión sin coste adicional para ti. Esto nos ayuda a seguir publicando análisis honestos e independientes.

PARÁMETROS: 1.000-1.400 palabras. Tabla de resumen obligatoria siempre al principio. Sección de mejoras y alternativas obligatorias.`;

  const completion = await client.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    max_tokens: 3200,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = completion.choices[0]?.message?.content ?? '';
  return { content, slug, total };
}

async function main() {
  const configArg = process.argv[process.argv.indexOf('--config') + 1];
  if (!configArg) {
    console.error('Uso: node guideGenerator.js --config guia.json');
    process.exit(1);
  }
  if (!existsSync(configArg)) {
    console.error(`Archivo no encontrado: ${configArg}`);
    process.exit(1);
  }

  const config = JSON.parse(readFileSync(configArg, 'utf-8'));

  console.log('\nFitzDesk Guide Generator');
  console.log('━'.repeat(48));
  console.log(`Título     : ${config.titulo}`);
  console.log(`Presupuesto: ${config.presupuesto}€`);
  console.log(`Productos  : ${config.productos.length}`);
  config.productos.forEach(p => console.log(`  · ${p.nombre} — ${p.precio}€`));
  console.log('━'.repeat(48));
  console.log('Generando guía con Groq...\n');

  const { content, slug, total } = await generateGuia(config);

  if (!content) {
    console.error('Groq no devolvió contenido.');
    process.exit(1);
  }

  if (!existsSync(CONTENT_DIR)) mkdirSync(CONTENT_DIR, { recursive: true });

  const filename = `${slug}.md`;
  const filepath = join(CONTENT_DIR, filename);
  writeFileSync(filepath, content, 'utf-8');

  console.log(`✅ Guía guardada: src/content/articulos/${filename}`);
  console.log(`   Total del setup: ${total}€`);
  console.log('\n💡 Pendiente antes de publicar:');
  console.log(`   1. Revisar y ajustar el contenido generado`);
  console.log(`   2. Añadir imagen: public/images/articulos/${slug}.webp`);
  console.log(`   3. Verificar precios actuales en PcComponentes`);
  console.log(`   4. Eliminar borrador: true del frontmatter`);
  console.log(`   5. Ejecutar npm run build en FitzDesk/`);
}

main().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
