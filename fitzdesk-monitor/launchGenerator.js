/**
 * FitzDesk Launch Generator
 * Genera un artículo de adelanto sobre un próximo lanzamiento usando Groq (Prompt 5).
 *
 * Uso: node launchGenerator.js --config lanzamiento-ejemplo.json
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

function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 60);
}

function currentYear() { return new Date().getFullYear(); }

async function generateLanzamiento(config) {
  const { nombre, fabricante, categoria, fecha_lanzamiento, precio_previsto, fuente, informacion } = config;
  const slug = `${slugify(nombre)}-lanzamiento-${currentYear()}`;

  const prompt = `Eres el redactor principal de FitzDesk, una web española de análisis de periféricos y setups para teletrabajo y productividad. Tono: cercano, honesto y técnico. Audiencia: trabajadores en remoto.

PRINCIPIOS OBLIGATORIOS:
- VERACIDAD: Nunca inventes pruebas. Distingue siempre entre información confirmada y especulativa
- Si algo no está confirmado, indícalo: "Según fuentes no oficiales..." o "Se espera que..."
- SIN ABSOLUTOS: No uses "El mejor del mercado"
- Idioma: español de España

Escribe un artículo de adelanto sobre un próximo lanzamiento para FitzDesk. El producto aún no está disponible en PcComponentes.

DATOS DEL PRODUCTO:
- Nombre: ${nombre}
- Fabricante: ${fabricante}
- Categoría: ${categoria}
- Fecha de lanzamiento prevista: ${fecha_lanzamiento}
- Precio previsto: ${precio_previsto ? precio_previsto + '€' : 'por confirmar'}
- Fuente de la noticia: ${fuente}
- Información disponible: ${informacion}

Genera el artículo completo en Markdown con este frontmatter EXACTO:

---
title: "${nombre}: todo lo que sabemos del nuevo ${categoria.slice(0, -1)} de ${fabricante}"
categoria: "${categoria}"
fecha: "${today()}"
descripcion: "[descripción SEO sobre el lanzamiento, máximo 150 caracteres]"
imagen: "/images/articulos/${slug}.webp"
precio: "${precio_previsto ? precio_previsto + '€' : 'Por confirmar'}"
disponible: false
fecha_lanzamiento: "${fecha_lanzamiento}"
enlace_afiliado: ""
tiempo_lectura: "6 min"
tipo: "lanzamiento"
borrador: true
---

ESTRUCTURA OBLIGATORIA DEL CUERPO:

## Aviso importante
> 📅 **Producto no disponible aún**: Este artículo recoge toda la información conocida sobre ${nombre} antes de su lanzamiento oficial. Lo actualizaremos con el análisis completo y precio real en cuanto llegue a PcComponentes.

## Introducción
2 párrafos. Por qué este producto es relevante para el lector de FitzDesk. Qué lo hace interesante respecto a lo que hay ahora. Genera expectativa sin prometer más de lo que se sabe.

## Qué se sabe hasta ahora
Todo lo conocido basado en fuentes oficiales. Especificaciones confirmadas explicadas en términos de uso real. Si algo no está confirmado, indícalo claramente.

## Por qué nos parece interesante para teletrabajo
2-3 párrafos analizando si las características anunciadas encajan con las necesidades de un trabajador remoto. Comparación breve con productos similares ya disponibles.

## Precio y disponibilidad
Precio oficial anunciado o estimación razonada. Dónde se podrá comprar en España. Fecha de lanzamiento confirmada o estimada.

## ¿Vale la pena esperar?
Recomendación honesta: ¿merece la pena esperar o es mejor comprar una alternativa ahora?
- Perfil para quien sí vale la pena esperar
- Perfil para quien es mejor no esperar

## 🐿️ Fitz opina
3 frases en primera persona: qué le parece interesante, qué duda tiene, si lo esperaría o compraría una alternativa ahora. Sin puntuación numérica. Termina con: "Lo seguiremos de cerca."

## Conclusión
1 párrafo resumiendo el interés del producto. Invita al lector a volver cuando esté disponible.

> 📬 **¿Quieres saber cuándo lo analizamos?** Guarda esta página o síguenos para recibir el análisis completo en cuanto llegue a PcComponentes.

PARÁMETROS: 600-900 palabras. Distingue siempre entre información confirmada y especulativa. Sin enlace de afiliado. Sin puntuación numérica. Tono de anticipación sin hype exagerado.`;

  const completion = await client.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = completion.choices[0]?.message?.content ?? '';
  return { content, slug };
}

async function main() {
  const configArg = process.argv[process.argv.indexOf('--config') + 1];
  if (!configArg) {
    console.error('Uso: node launchGenerator.js --config lanzamiento.json');
    process.exit(1);
  }
  if (!existsSync(configArg)) {
    console.error(`Archivo no encontrado: ${configArg}`);
    process.exit(1);
  }

  const config = JSON.parse(readFileSync(configArg, 'utf-8'));

  console.log('\nFitzDesk Launch Generator');
  console.log('━'.repeat(48));
  console.log(`Producto   : ${config.nombre}`);
  console.log(`Fabricante : ${config.fabricante}`);
  console.log(`Categoría  : ${config.categoria}`);
  console.log(`Lanzamiento: ${config.fecha_lanzamiento}`);
  console.log(`Precio est.: ${config.precio_previsto ? config.precio_previsto + '€' : 'por confirmar'}`);
  console.log('━'.repeat(48));
  console.log('Generando artículo de lanzamiento con Groq...\n');

  const { content, slug } = await generateLanzamiento(config);

  if (!content) {
    console.error('Groq no devolvió contenido.');
    process.exit(1);
  }

  if (!existsSync(CONTENT_DIR)) mkdirSync(CONTENT_DIR, { recursive: true });

  const filename = `${slug}.md`;
  const filepath = join(CONTENT_DIR, filename);
  writeFileSync(filepath, content, 'utf-8');

  console.log(`✅ Artículo de lanzamiento guardado: src/content/articulos/${filename}`);
  console.log('\n💡 Pendiente antes de publicar:');
  console.log(`   1. Revisar y ajustar el contenido generado`);
  console.log(`   2. Añadir imagen: public/images/articulos/${slug}.webp`);
  console.log(`   3. Cuando llegue a PcComponentes: usar articleUpdater.js --precio para actualizarlo`);
  console.log(`   4. Eliminar borrador: true del frontmatter`);
  console.log(`   5. Ejecutar npm run build en FitzDesk/`);
}

main().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
