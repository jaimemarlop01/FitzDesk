/**
 * FitzDesk Compare Generator
 * Genera un artículo de comparativa entre dos productos usando Groq (Prompt 2).
 *
 * Uso: node compareGenerator.js --config comparativa-ejemplo.json
 */

import 'dotenv/config';
import Groq from 'groq-sdk';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname   = dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = resolve(__dirname, '../src/content/articulos');
const client      = new Groq({ apiKey: process.env.GROQ_API_KEY });

function today() { return new Date().toISOString().slice(0, 10); }

function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 60);
}

async function generateComparativa(config) {
  const { producto_a, producto_b, dilema, categoria } = config;
  const slugA  = slugify(producto_a.nombre);
  const slugB  = slugify(producto_b.nombre);
  const slug   = `${slugA}-vs-${slugB}`.slice(0, 80);

  const prompt = `Eres el redactor principal de FitzDesk, una web española de análisis de periféricos y setups para teletrabajo y productividad. Tono: cercano, honesto y técnico. Audiencia: trabajadores en remoto.

PRINCIPIOS OBLIGATORIOS:
- VERACIDAD: Nunca inventes pruebas. Usa "Según sus especificaciones...", "Sobre el papel...", "Cabe esperar que..."
- INDEPENDENCIA: No ocultes defectos importantes
- SIN ABSOLUTOS: No uses "El mejor del mercado". Usa "Destaca dentro de su categoría"
- Idioma: español de España

Escribe una comparativa entre estos dos productos para FitzDesk.

PRODUCTO A:
- Nombre: ${producto_a.nombre}
- Precio: ${producto_a.precio}€
- Enlace PcComponentes: ${producto_a.enlace}
- Especificaciones clave: ${producto_a.specs}

PRODUCTO B:
- Nombre: ${producto_b.nombre}
- Precio: ${producto_b.precio}€
- Enlace PcComponentes: ${producto_b.enlace}
- Especificaciones clave: ${producto_b.specs}

Dilema del lector: ${dilema}

Genera el artículo completo en Markdown con este frontmatter EXACTO (no cambies los valores entre corchetes angulares):

---
title: "${producto_a.nombre} vs ${producto_b.nombre}: [frase de máx 40 chars que resume el dilema]"
categoria: "${categoria}"
fecha: "${today()}"
descripcion: "[descripción SEO, máximo 150 caracteres]"
imagen: "/images/articulos/${slug}.webp"
precio: "Desde ${producto_a.precio}€"
precio_a: "${producto_a.precio}€"
precio_b: "${producto_b.precio}€"
enlace_afiliado: "${producto_a.enlace}"
enlace_afiliado_a: "${producto_a.enlace}"
enlace_afiliado_b: "${producto_b.enlace}"
tiempo_lectura: "8 min"
tipo: "comparativa"
borrador: true
---

ESTRUCTURA OBLIGATORIA DEL CUERPO:

## Introducción
2 párrafos. Describe el dilema real del lector. Avanza que la respuesta depende del perfil de uso, no hay ganador universal.

## En qué se parecen
3-4 características que comparten ambos productos.

## En qué se diferencian
Tabla comparativa obligatoria con al menos 5 criterios más precio. Usa: ✅ ventaja / ⚠️ aceptable / ❌ limitación.

| Criterio | ${producto_a.nombre} | ${producto_b.nombre} |
|---|---|---|
| [criterio 1] | [valor] | [valor] |
...

Después desarrolla las 3 diferencias más importantes con subsecciones H3.

## Experiencia de uso comparada
1 párrafo por producto. Usa "cabe esperar que..." o "por sus características...".

## ¿Cuál elegir según tu situación?

### Elige ${producto_a.nombre} si...
3-4 situaciones concretas con perfil de usuario específico.

### Elige ${producto_b.nombre} si...
3-4 situaciones concretas con perfil de usuario específico.

## Ganador según el tipo de usuario

| Perfil | Recomendación |
|---|---|
| Mejor calidad-precio | [producto] |
| Mejor para teletrabajo intensivo | [producto] |
| Mejor para espacios reducidos | [producto] |
| Mejor para presupuesto ajustado | [producto] |
| Mejor para uso prolongado | [producto] |

## 🐿️ El veredicto de Fitz
3 frases en primera persona: cuál elegiría él y por qué, cuándo elegiría el otro, consejo final para el indeciso. Sin puntuación numérica.

## Conclusión
1 párrafo. No hay ganador universal. Llamada a la acción hacia los dos productos.

> ⚠️ **Aviso de afiliado**: Si compras a través de nuestros enlaces podemos recibir una pequeña comisión sin coste adicional para ti. Esto nos ayuda a seguir publicando análisis honestos e independientes.

PARÁMETROS: 800-1.100 palabras. Sin puntuación numérica en ningún momento. Tabla comparativa bien formateada.`;

  const completion = await client.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    max_tokens: 2800,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = completion.choices[0]?.message?.content ?? '';
  return { content, slug };
}

async function main() {
  const configArg = process.argv[process.argv.indexOf('--config') + 1];
  if (!configArg) {
    console.error('Uso: node compareGenerator.js --config comparativa.json');
    process.exit(1);
  }
  if (!existsSync(configArg)) {
    console.error(`Archivo no encontrado: ${configArg}`);
    process.exit(1);
  }

  const config = JSON.parse(readFileSync(configArg, 'utf-8'));
  const { producto_a, producto_b, categoria } = config;

  console.log('\nFitzDesk Compare Generator');
  console.log('━'.repeat(48));
  console.log(`Producto A : ${producto_a.nombre} — ${producto_a.precio}€`);
  console.log(`Producto B : ${producto_b.nombre} — ${producto_b.precio}€`);
  console.log(`Categoría  : ${categoria}`);
  console.log('━'.repeat(48));
  console.log('Generando comparativa con Groq...\n');

  const { content, slug } = await generateComparativa(config);

  if (!content) {
    console.error('Groq no devolvió contenido.');
    process.exit(1);
  }

  if (!existsSync(CONTENT_DIR)) mkdirSync(CONTENT_DIR, { recursive: true });

  const filename = `${slug}.md`;
  const filepath = join(CONTENT_DIR, filename);
  writeFileSync(filepath, content, 'utf-8');

  console.log(`✅ Comparativa guardada: src/content/articulos/${filename}`);
  console.log('\n💡 Pendiente antes de publicar:');
  console.log(`   1. Revisar y ajustar el contenido generado`);
  console.log(`   2. Añadir imagen: public/images/articulos/${slug}.webp`);
  console.log(`   3. Eliminar borrador: true del frontmatter`);
  console.log(`   4. Ejecutar npm run build en FitzDesk/`);
}

main().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
