/**
 * FitzDesk Offer Generator
 * Genera un borrador de artículo de tipo "oferta" a partir de una oferta
 * detectada (ver detectOferta() en sources.js), usando Groq para el
 * contenido y notificando a Discord al terminar.
 *
 * Uso:
 *   node offerGenerator.js --config oferta.json
 *
 * Formato del JSON de configuración:
 *   {
 *     "producto": "Logitech MX Master 3S",
 *     "categoria": "ratones",
 *     "precio_oferta": "79,99€",
 *     "precio_normal": "99,99€",
 *     "descuento": "20%",
 *     "fuente": "PcComponentes",
 *     "enlace_afiliado": "https://www.pccomponentes.com/...",
 *     "informacion": "texto/contexto adicional de la noticia detectada"
 *   }
 */

import 'dotenv/config';
import Groq from 'groq-sdk';
import matter from 'gray-matter';
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { notifyOferta } from './notifier.js';

const __dirname   = dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = resolve(__dirname, '../src/content/articulos');

if (!process.env.GROQ_API_KEY) {
  console.error('ERROR: GROQ_API_KEY no definida');
  process.exit(1);
}
const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

function today() { return new Date().toISOString().slice(0, 10); }

// Mismo algoritmo de slugify ya usado en analyzer.js, compareGenerator.js,
// guideGenerator.js y launchGenerator.js (duplicado conocido, ver CLAUDE.md).
function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 60);
}

// ─── Buscar si ya existe un análisis del producto en FitzDesk ────────────────

function findRelatedAnalysis(productoNombre) {
  const files = readdirSync(CONTENT_DIR).filter(f => f.endsWith('.md'));
  const needle = productoNombre.toLowerCase();

  for (const file of files) {
    const raw = readFileSync(join(CONTENT_DIR, file), 'utf-8');
    const { data } = matter(raw);
    if (data.borrador === true) continue;
    if (data.tipo && data.tipo !== 'analisis') continue;
    const title = (data.title ?? '').toLowerCase();
    if (title.includes(needle) || needle.includes(title.split(':')[0]?.trim() ?? '')) {
      return { slug: data.slug ?? file.replace(/^borrador-/, '').replace('.md', ''), title: data.title };
    }
  }
  return null;
}

// ─── Generar el contenido con Groq ────────────────────────────────────────────

async function generateOfertaContent(config, related) {
  const { producto, categoria, precio_oferta, precio_normal, descuento, fuente, informacion } = config;

  const prompt = `Eres el redactor principal de FitzDesk, una web española de análisis de periféricos y setups para teletrabajo y productividad. Tono: cercano, honesto, nunca agresivo ni de urgencia artificial ("¡última oportunidad!", "¡corre!"). Audiencia: trabajadores en remoto. Idioma: español de España.

Escribe el CUERPO (sin frontmatter, eso se añade aparte) de un artículo corto sobre esta oferta:

PRODUCTO: ${producto}
CATEGORÍA: ${categoria}
PRECIO DE OFERTA: ${precio_oferta}
PRECIO NORMAL: ${precio_normal ?? 'no disponible'}
DESCUENTO: ${descuento ?? 'no especificado, no inventes un porcentaje'}
TIENDA: ${fuente ?? 'no especificada'}
${related ? `YA EXISTE UN ANÁLISIS EN FITZDESK: "${related.title}" (slug: ${related.slug}) — enlaza a él con [texto](/articulo/${related.slug})` : 'NO existe análisis de este producto en FitzDesk todavía — escribe una breve descripción propia del producto en vez de enlazar a nada'}
${informacion ? `INFORMACIÓN ADICIONAL DE LA NOTICIA ORIGINAL:\n${informacion}` : ''}

ESTRUCTURA OBLIGATORIA (usa estos encabezados exactos):

## Introducción
2-3 líneas. Por qué esta oferta merece atención. Cuánto se ahorra respecto al precio habitual (usa los precios dados, no inventes cifras). Transmite urgencia real sin ser agresivo ni usar frases de presión típicas de afiliados.

## ¿Por qué es buena oferta?
3-4 puntos en formato lista, cada uno explicando un aspecto de valor real del producto. ${related ? 'Enlaza al análisis existente de forma natural en el primer punto.' : 'Como no hay análisis propio, incluye una breve descripción honesta del producto basada en lo que es conocido de él.'}

## ¿Para quién es ideal?
1 párrafo describiendo el perfil de usuario que más se beneficia de esta oferta concreta.

## 🐿️ Fitz dice
2-3 frases en primera persona, con la personalidad de Fitz (ardilla mascota de FitzDesk: cercana, pícara, honesta). Veredicto corto sobre si merece la pena aprovechar la oferta. SIN puntuación numérica (las ofertas no llevan nota, solo análisis).

No incluyas el aviso de oferta ni el aviso de afiliado, se añaden automáticamente después.

PARÁMETROS: 250-400 palabras en total. Nunca inventes un precio, descuento o dato que no se te haya dado. Si el descuento no se especifica, no menciones ningún porcentaje concreto.`;

  const completion = await client.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    max_tokens: 1200,
    messages: [{ role: 'user', content: prompt }],
  });

  return completion.choices[0]?.message?.content?.trim() ?? '';
}

// ─── Construir el artículo completo (frontmatter + cuerpo) ───────────────────

function buildFrontmatter(config, slug, related) {
  const { producto, categoria, precio_oferta, precio_normal, descuento, enlace_afiliado, fuente } = config;
  const analisisSlug = related?.slug ?? '';
  // Si ya existe un análisis, reutilizamos su imagen (misma convención que
  // el resto del sitio: /images/articulos/[slug].webp); si no existe,
  // queda pendiente de imagen igual que cualquier borrador sin foto.
  const imagen = related ? `/images/articulos/${related.slug}.webp` : `/images/articulos/${slug}.webp`;

  const lines = [
    '---',
    `title: "${producto}: precio mínimo histórico a ${precio_oferta}"`,
    `slug: "${slug}"`,
    `categoria: "${categoria}"`,
    `fecha: "${today()}"`,
    `descripcion: "El ${producto} está en oferta a ${precio_oferta}${fuente ? ` en ${fuente}` : ''}, su precio más bajo hasta la fecha."`,
    `imagen: "${imagen}"`,
    `precio_oferta: "${precio_oferta}"`,
  ];
  if (precio_normal) lines.push(`precio_normal: "${precio_normal}"`);
  if (descuento)      lines.push(`descuento: "${descuento}"`);
  lines.push(
    `enlace_afiliado: "${enlace_afiliado ?? ''}"`,
    `tiempo_lectura: "2 min"`,
    `tipo: "oferta"`,
    `oferta_activa: true`,
  );
  if (analisisSlug) lines.push(`analisis_relacionado: "${analisisSlug}"`);
  lines.push('borrador: true', '---', '');

  return lines.join('\n');
}

function buildAviso() {
  return [
    '> ⚠️ Las ofertas son limitadas y pueden cambiar.',
    '> Comprueba el precio actual antes de comprar.',
    '',
    '> **Aviso de afiliado**: Este artículo contiene enlaces de afiliado. Si compras a través de ellos, FitzDesk puede recibir una comisión sin coste adicional para ti.',
  ].join('\n');
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const configArg = process.argv[process.argv.indexOf('--config') + 1];
  if (!configArg) {
    console.error('Uso: node offerGenerator.js --config oferta.json');
    process.exit(1);
  }
  if (!existsSync(configArg)) {
    console.error(`Archivo no encontrado: ${configArg}`);
    process.exit(1);
  }

  const config = JSON.parse(readFileSync(configArg, 'utf-8'));
  if (!config.producto || !config.categoria || !config.precio_oferta) {
    console.error('El JSON de configuración necesita al menos: producto, categoria, precio_oferta');
    process.exit(1);
  }

  console.log('\nFitzDesk Offer Generator');
  console.log('━'.repeat(48));
  console.log(`Producto       : ${config.producto}`);
  console.log(`Categoría      : ${config.categoria}`);
  console.log(`Precio oferta  : ${config.precio_oferta}`);
  if (config.precio_normal) console.log(`Precio normal  : ${config.precio_normal}`);
  if (config.descuento)      console.log(`Descuento      : ${config.descuento}`);
  if (config.fuente)         console.log(`Fuente         : ${config.fuente}`);
  console.log('━'.repeat(48));

  const slug = `${slugify(config.producto)}-oferta`;

  const related = findRelatedAnalysis(config.producto);
  console.log(related
    ? `🔗 Análisis relacionado encontrado: ${related.slug}`
    : 'ℹ️  Sin análisis relacionado — se incluirá descripción propia del producto');

  console.log('\nGenerando contenido con Groq...');
  const body = await generateOfertaContent(config, related);
  if (!body) {
    console.error('Groq no devolvió contenido.');
    process.exit(1);
  }

  const frontmatter = buildFrontmatter(config, slug, related);
  const aviso = buildAviso();
  const fullContent = `${frontmatter}\n${body}\n\n${aviso}\n`;

  if (!existsSync(CONTENT_DIR)) mkdirSync(CONTENT_DIR, { recursive: true });

  const filename = `borrador-${slug}.md`;
  const filepath = join(CONTENT_DIR, filename);
  writeFileSync(filepath, fullContent, 'utf-8');

  console.log(`\n✅ Borrador de oferta guardado: src/content/articulos/${filename}`);
  console.log('\n💡 Pendiente antes de publicar:');
  console.log(`   1. Verificar que el precio de oferta sigue activo`);
  console.log(`   2. Revisar el contenido generado`);
  if (!related) console.log(`   3. Añadir imagen: public/images/articulos/${slug}.webp`);
  console.log(`   ${related ? 3 : 4}. Quitar borrador: true y publicar`);

  await notifyOferta({
    titulo: config.producto,
    slug,
    precio_oferta: config.precio_oferta,
    precio_normal: config.precio_normal,
    descuento: config.descuento,
    fuente: config.fuente,
    analisis_relacionado: related?.slug,
    filePath: `src/content/articulos/${filename}`,
  });
}

main().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
