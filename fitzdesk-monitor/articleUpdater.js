/**
 * FitzDesk Article Updater — v2
 *
 * MODOS:
 *   node articleUpdater.js                                              # completar secciones (todos los análisis)
 *   node articleUpdater.js --slug [slug]                                # completar secciones (uno)
 *   node articleUpdater.js --slug [slug] --precio [nuevo-precio]        # actualizar precio
 *   node articleUpdater.js --slug [slug] --descatalogado --sustituto [slug-sustituto]
 *   node articleUpdater.js --slug [slug] --nuevo-modelo [nombre] --precio-nuevo [precio]
 */

import 'dotenv/config';
import Groq from 'groq-sdk';
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname   = dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = resolve(__dirname, '../src/content/articulos');

if (!process.env.GROQ_API_KEY) {
  console.error('ERROR: GROQ_API_KEY no definida');
  process.exit(1);
}
const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ─── Utilidades ───────────────────────────────────────────────────────────────

function today() { return new Date().toISOString().slice(0, 10); }

function monthYear() {
  return new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
}

function hasSection(content, heading) {
  return new RegExp(`^##\\s+${heading}`, 'mi').test(content);
}

function hasFrontmatterField(content, field) {
  return new RegExp(`^${field}:`, 'm').test(content);
}

function isAnalisis(content) {
  return /^puntuacion:\s*\d/m.test(content);
}

function getArg(args, flag) {
  const i = args.indexOf(flag);
  return i !== -1 && i + 1 < args.length ? args[i + 1] : null;
}

/** Actualiza un campo existente en el frontmatter o lo inserta antes del cierre --- */
function setFrontmatterField(content, field, value) {
  const re = new RegExp(`^${field}:.*$`, 'm');
  if (re.test(content)) return content.replace(re, `${field}: ${value}`);
  const closeIdx = content.indexOf('\n---', 4);
  if (closeIdx === -1) return content;
  return content.slice(0, closeIdx) + `\n${field}: ${value}` + content.slice(closeIdx);
}

/** Inserta texto justo después del bloque frontmatter (tras el segundo ---) */
function insertAfterFrontmatter(content, text) {
  // Tolera BOM al inicio y saltos de línea CRLF o LF — algunos artículos
  // del repo usan CRLF, lo que rompía la búsqueda literal de '\n---\n'
  // y hacía que la función devolviera el contenido sin insertar nada,
  // sin avisar del fallo (bug detectado el 2026-06-24).
  const bomLen = content.charCodeAt(0) === 0xFEFF ? 1 : 0;
  const match  = content.slice(bomLen).match(/^-{3}\r?\n[\s\S]*?\r?\n-{3}\r?\n/);
  if (!match) return content;
  const insertPos = bomLen + match[0].length;
  return content.slice(0, insertPos) + text + '\n' + content.slice(insertPos);
}

// ─── Modo 1: Completar secciones con Groq (comportamiento original) ───────────

async function getCompletions(articleContent) {
  const prompt = `Eres el editor de FitzDesk. Necesitas completar un artículo con los elementos que le faltan. NO modifiques el contenido existente.

ARTÍCULO:
${articleContent}

GENERA en JSON con EXACTAMENTE este formato (usa null si la sección ya existe en el artículo):

{
  "keyword_principal": "keyword principal del producto en español",
  "keywords_secundarias": ["keyword2", "keyword3", "keyword4"],
  "faq": "## Preguntas frecuentes\\n\\n**¿Merece la pena comprarlo?**\\nRespuesta directa en 2-3 líneas basada en el artículo.\\n\\n**¿Cuál es su principal ventaja respecto a la competencia?**\\nLa ventaja más diferencial en 2-3 líneas.\\n\\n**¿Qué alternativa existe en el mismo rango de precio?**\\nNombra 1 alternativa concreta y cuándo elegirla.",
  "fitz": "## 🐿️ Fitz recomienda\\n\\nExactamente 3 frases en primera persona: punto fuerte clave + punto débil más importante + recomendación final. Termina con 'Mi nota: X/10' usando la puntuación del artículo."
}

REGLAS:
- Si el artículo YA tiene "## Preguntas frecuentes", devuelve null en "faq"
- Si el artículo YA tiene "## 🐿️ Fitz" o "## Fitz recomienda", devuelve null en "fitz"
- keywords: términos que un usuario español buscaría para encontrar este producto
- Devuelve SOLO el JSON, sin texto adicional, sin bloques de código markdown`;

  const completion = await client.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    max_tokens: 1200,
    messages: [{ role: 'user', content: prompt }],
  });

  const raw = completion.choices[0]?.message?.content ?? '';
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('Groq no devolvió JSON válido');
  return JSON.parse(match[0]);
}

function applyContentUpdates(content, data) {
  let updated = content;
  const changes = [];

  if (data.keyword_principal && !hasFrontmatterField(content, 'keyword_principal')) {
    const insertion = `keyword_principal: "${data.keyword_principal}"\nkeywords_secundarias:\n${data.keywords_secundarias.map(k => `  - "${k}"`).join('\n')}`;
    // Bug detectado y corregido el 2026-06-24: esta línea insertaba "tipo:
    // analisis" sin comprobar si ya existía en el frontmatter original,
    // duplicando el campo en casi todos los artículos reales (que ya
    // tienen "tipo" desde que se generaron). Ahora solo se añade si
    // realmente falta.
    const tipoLine = hasFrontmatterField(content, 'tipo') ? '' : 'tipo: "analisis"\n';
    updated = updated.replace(/^(tiempo_lectura:.*)/m, `$1\n${tipoLine}${insertion}`);
    if (!hasFrontmatterField(updated, 'tipo')) {
      updated = updated.replace(/^(borrador:.*)/m, `tipo: "analisis"\n${insertion}\n$1`);
    }
    changes.push('keyword_principal + keywords_secundarias');
  }

  if (!hasFrontmatterField(updated, 'tipo')) {
    updated = updated.replace(/^(borrador:.*)/m, `tipo: "analisis"\n$1`);
    if (!changes.includes('keyword_principal + keywords_secundarias')) changes.push('tipo: analisis');
  }

  const sectionsToInsert = [];
  if (data.faq)  sectionsToInsert.push(data.faq);
  if (data.fitz) sectionsToInsert.push(data.fitz);

  if (sectionsToInsert.length > 0) {
    const insertion = '\n\n' + sectionsToInsert.join('\n\n');
    if (/^## Conclusión/m.test(updated)) {
      updated = updated.replace(/^(## Conclusión)/m, `${insertion}\n\n$1`);
    } else {
      updated = updated.replace(/(> ⚠️|\> \*\*Aviso de afiliado)/m, `${insertion}\n\n$1`);
    }
    if (data.faq)  changes.push('## Preguntas frecuentes');
    if (data.fitz) changes.push('## 🐿️ Fitz recomienda');
  }

  return { updated, changes };
}

// ─── Modo 2: Actualizar precio ────────────────────────────────────────────────

function applyPrecioUpdate(content, nuevoPrecio) {
  let updated = content;
  const changes = [];

  const oldMatch = updated.match(/^precio:\s*"?([^"\n]+)"?/m);
  const oldPrecio = oldMatch ? oldMatch[1].trim() : '?';
  updated = updated.replace(/^precio:.*$/m, `precio: "${nuevoPrecio}"`);
  changes.push(`precio "${oldPrecio}" → "${nuevoPrecio}"`);

  updated = setFrontmatterField(updated, 'fecha_actualizacion', `"${today()}"`);
  updated = setFrontmatterField(updated, 'actualizado', 'true');
  changes.push('fecha_actualizacion');

  if (!/^> 📅 \*\*Artículo actualizado/m.test(updated)) {
    const notice = `> 📅 **Artículo actualizado en ${monthYear()}**: Precio actualizado a ${nuevoPrecio} en PcComponentes.`;
    updated = insertAfterFrontmatter(updated, notice);
    changes.push('aviso de actualización');
  }

  return { updated, changes };
}

// ─── Modo 2b: Precio de un artículo de tipo "oferta" ─────────────────────────

function isOfertaArticle(content) {
  return /^tipo:\s*"?oferta"?/m.test(content);
}

function parsePrecioNum(str) {
  if (!str) return null;
  const n = parseFloat(String(str).replace(/[^\d,.]/g, '').replace(',', '.'));
  return isNaN(n) ? null : n;
}

/**
 * Cuando se actualiza el precio de un artículo "oferta", comprueba si el
 * precio ha vuelto a su valor normal (la oferta ya terminó) en vez de
 * limitarse a sustituir el número. Margen del 3% para no marcar como
 * "terminada" una oferta por una diferencia de céntimos de redondeo.
 */
function applyOfertaPrecioUpdate(content, nuevoPrecio) {
  let updated = content;
  const changes = [];

  const precioNormalMatch = content.match(/^precio_normal:\s*"?([^"\n]+)"?/m);
  const precioNormal = precioNormalMatch ? parsePrecioNum(precioNormalMatch[1]) : null;
  const nuevoNum = parsePrecioNum(nuevoPrecio);
  const ofertaTerminada = precioNormal !== null && nuevoNum !== null && nuevoNum >= precioNormal * 0.97;

  const oldMatch = updated.match(/^precio_oferta:\s*"?([^"\n]+)"?/m);
  const oldPrecio = oldMatch ? oldMatch[1].trim() : '?';
  updated = updated.replace(/^precio_oferta:.*$/m, `precio_oferta: "${nuevoPrecio}"`);
  changes.push(`precio_oferta "${oldPrecio}" → "${nuevoPrecio}"`);

  if (!ofertaTerminada) {
    updated = setFrontmatterField(updated, 'fecha_actualizacion', `"${today()}"`);
    changes.push('fecha_actualizacion');
    return { updated, changes, ofertaTerminada: false };
  }

  // La oferta ya no está activa: precio_oferta queda como histórico, se
  // desactiva, se corrige el título y se avisa en el cuerpo — sin tocar la
  // introducción original con una reescritura por IA, mismo patrón ya usado
  // en applyDescatalogado() (aviso añadido, no reescritura del cuerpo).
  updated = updated.replace(/^oferta_activa:.*$/m, 'oferta_activa: false');
  changes.push('oferta_activa: false');

  const tituloMatch = updated.match(/^title:\s*"([^"]+)"/m);
  if (tituloMatch) {
    const producto = tituloMatch[1].split(':')[0].trim();
    const nuevoTitulo = `${producto}: análisis y mejor precio`;
    updated = updated.replace(/^title:.*$/m, `title: "${nuevoTitulo}"`);
    changes.push(`título → "${nuevoTitulo}"`);
  }

  if (!/^> ℹ️ \*\*Esta oferta ya no está activa/m.test(updated)) {
    const aviso = `> ℹ️ **Esta oferta ya no está activa** — el precio ha vuelto a su valor habitual (${nuevoPrecio}). Aun así, el producto sigue siendo una buena opción a tener en cuenta.`;
    updated = insertAfterFrontmatter(updated, aviso);
    changes.push('aviso de oferta finalizada');
  }

  updated = setFrontmatterField(updated, 'fecha_actualizacion', `"${today()}"`);
  changes.push('fecha_actualizacion');

  return { updated, changes, ofertaTerminada: true };
}

// ─── Modo 3: Producto descatalogado ──────────────────────────────────────────

function applyDescatalogado(content, sustitutoSlug) {
  let updated = content;
  const changes = [];

  if (!/^> ⚠️ \*\*Este producto ya no está disponible/m.test(updated)) {
    const warning = `> ⚠️ **Este producto ya no está disponible en PcComponentes.** Te recomendamos su sucesor: [Ver alternativa](/articulo/${sustitutoSlug}).`;
    updated = insertAfterFrontmatter(updated, warning);
    changes.push('aviso de descatalogado');
  }

  updated = setFrontmatterField(updated, 'fecha_actualizacion', `"${today()}"`);
  updated = setFrontmatterField(updated, 'actualizado', 'true');
  changes.push('fecha_actualizacion');

  return { updated, changes };
}

// ─── Modo 4: Nuevo modelo disponible ─────────────────────────────────────────

async function buildNuevoModeloSection(content, nombreModelo, precioNuevo) {
  const prompt = `Eres el editor de FitzDesk. Escribe ÚNICAMENTE la sección de comparativa con el nuevo modelo del producto analizado. Sin texto adicional fuera de la sección.

ARTÍCULO EXISTENTE (extracto):
${content.slice(0, 2000)}

NUEVO MODELO: ${nombreModelo}
PRECIO NUEVO: ${precioNuevo}

Genera SOLO esta sección en Markdown (máximo 200 palabras):

## ¿Vale la pena el nuevo ${nombreModelo}?

2 párrafos comparando el modelo analizado con el nuevo. Usa expresiones como "Según sus especificaciones..." o "Sobre el papel...". Recomienda cuándo quedarse con el modelo analizado y cuándo merece la pena el salto. Sin inventar pruebas realizadas.`;

  const completion = await client.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    max_tokens: 500,
    messages: [{ role: 'user', content: prompt }],
  });

  return completion.choices[0]?.message?.content?.trim() ?? '';
}

async function applyNuevoModelo(content, nombreModelo, precioNuevo) {
  let updated = content;
  const changes = [];

  if (/^## ¿Vale la pena el nuevo/mi.test(updated)) {
    return { updated, changes: ['sección ya existe — omitida'] };
  }

  const seccion = await buildNuevoModeloSection(content, nombreModelo, precioNuevo);
  if (seccion) {
    const block = `\n\n${seccion}\n`;
    if (/^## Conclusión/m.test(updated)) {
      updated = updated.replace(/^(## Conclusión)/m, `${block}\n$1`);
    } else {
      updated += block;
    }
    changes.push(`sección "¿Vale la pena el nuevo ${nombreModelo}?"`);
  }

  updated = setFrontmatterField(updated, 'fecha_actualizacion', `"${today()}"`);
  updated = setFrontmatterField(updated, 'actualizado', 'true');
  changes.push('fecha_actualizacion');

  return { updated, changes };
}

// ─── Procesador de un artículo ────────────────────────────────────────────────

async function updateArticle(filename, options) {
  const filepath = join(CONTENT_DIR, filename);
  const slug     = filename.replace('.md', '');

  let content;
  try {
    content = readFileSync(filepath, 'utf-8');
  } catch {
    console.error(`   ❌ ${slug} — archivo no encontrado`);
    return false;
  }

  if (options.precio) {
    if (isOfertaArticle(content)) {
      const { updated, changes, ofertaTerminada } = applyOfertaPrecioUpdate(content, options.precio);
      writeFileSync(filepath, updated, 'utf-8');
      console.log(`   ✅ ${slug} — ${ofertaTerminada ? '🏁 oferta finalizada — ' : ''}${changes.join(', ')}`);
      return true;
    }
    const { updated, changes } = applyPrecioUpdate(content, options.precio);
    writeFileSync(filepath, updated, 'utf-8');
    console.log(`   ✅ ${slug} — ${changes.join(', ')}`);
    return true;
  }

  if (options.descatalogado) {
    if (!options.sustituto) {
      console.error(`   ❌ ${slug} — --descatalogado requiere --sustituto [slug]`);
      return false;
    }
    const { updated, changes } = applyDescatalogado(content, options.sustituto);
    writeFileSync(filepath, updated, 'utf-8');
    console.log(`   ✅ ${slug} — ${changes.join(', ')}`);
    return true;
  }

  if (options.nuevoModelo) {
    const { updated, changes } = await applyNuevoModelo(
      content, options.nuevoModelo, options.precioNuevo ?? 'por confirmar'
    );
    if (changes[0] === 'sección ya existe — omitida') {
      console.log(`   ✓  ${slug} — ${changes[0]}`);
      return false;
    }
    writeFileSync(filepath, updated, 'utf-8');
    console.log(`   ✅ ${slug} — ${changes.join(', ')}`);
    return true;
  }

  // Modo completar secciones (original)
  if (!isAnalisis(content)) {
    console.log(`   ⏭  ${slug} — guía/comparativa, omitida`);
    return false;
  }

  const missingFaq  = !hasSection(content, 'Preguntas frecuentes');
  const missingFitz = !hasSection(content, '🐿️ Fitz') && !hasSection(content, 'Fitz recomienda');
  const missingKw   = !hasFrontmatterField(content, 'keyword_principal');

  if (!missingFaq && !missingFitz && !missingKw) {
    console.log(`   ✓  ${slug} — ya completo`);
    return false;
  }

  console.log(`   📝 ${slug} — faltan: ${[missingFaq && 'FAQ', missingFitz && 'Fitz', missingKw && 'keywords'].filter(Boolean).join(', ')}`);

  const data = await getCompletions(content);
  const { updated, changes } = applyContentUpdates(content, data);

  if (changes.length === 0) {
    console.log(`      Sin cambios aplicados`);
    return false;
  }

  writeFileSync(filepath, updated, 'utf-8');
  console.log(`   ✅ ${slug} — añadido: ${changes.join(', ')}`);
  return true;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);

  const slug          = getArg(args, '--slug');
  const precio        = getArg(args, '--precio');
  const sustituto     = getArg(args, '--sustituto');
  const nuevoModelo   = getArg(args, '--nuevo-modelo');
  const precioNuevo   = getArg(args, '--precio-nuevo');
  const descatalogado = args.includes('--descatalogado');

  const options = { precio, descatalogado, sustituto, nuevoModelo, precioNuevo };

  const files = slug
    ? [`${slug}.md`]
    : readdirSync(CONTENT_DIR).filter(f => f.endsWith('.md'));

  const mode = precio       ? 'precio'
    : descatalogado         ? 'descatalogado'
    : nuevoModelo           ? 'nuevo-modelo'
    : 'completar-secciones';

  console.log(`\nFitzDesk Article Updater — modo: ${mode} — ${files.length} artículo(s)\n`);

  const t0 = Date.now();
  let updated = 0;

  for (let i = 0; i < files.length; i++) {
    try {
      if (await updateArticle(files[i], options)) updated++;
    } catch (e) {
      console.error(`   ❌ ${files[i]}: ${e.message}`);
    }
    if (mode === 'completar-secciones' && i < files.length - 1) {
      await new Promise(r => setTimeout(r, 1500));
    }
  }

  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`\n${'━'.repeat(48)}`);
  console.log(`Artículos actualizados: ${updated}/${files.length}`);
  console.log(`Tiempo: ${elapsed}s`);
  console.log('━'.repeat(48));
  if (mode === 'completar-secciones') {
    console.log('\n💡 Recuerda: npm run build en FitzDesk/ para ver los cambios.');
  }
}

// Solo ejecutar main() al lanzar el script directamente — mismo bug y mismo
// fix que en offerGenerator.js (2026-06-25): sin esta guarda, importar
// cualquier función de este módulo desde otro script dispara el CLI sin querer.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch(e => {
    console.error('Error:', e.message);
    process.exit(1);
  });
}
