/**
 * FitzDesk Article Updater
 * Añade secciones faltantes (FAQ, Fitz, keywords SEO) a los artículos existentes
 * sin tocar el contenido ya escrito.
 *
 * Uso:
 *   node articleUpdater.js                        # todos los artículos
 *   node articleUpdater.js --slug logitech-mx-master-3s-analisis
 */

import 'dotenv/config';
import Groq from 'groq-sdk';
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname   = dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = resolve(__dirname, '../src/content/articulos');

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ─── Detección de secciones ──────────────────────────────────────────────────

function hasSection(content, heading) {
  return new RegExp(`^##\\s+${heading}`, 'mi').test(content);
}

function hasFrontmatterField(content, field) {
  return new RegExp(`^${field}:`, 'm').test(content);
}

function isAnalisis(content) {
  // Solo actualizamos análisis individuales (tienen puntuacion en frontmatter)
  return /^puntuacion:\s*\d/m.test(content);
}

// ─── Llamada a Groq ──────────────────────────────────────────────────────────

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

  // Extraer JSON aunque venga envuelto en markdown
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('Groq no devolvió JSON válido');
  return JSON.parse(match[0]);
}

// ─── Aplicar cambios al archivo ───────────────────────────────────────────────

function applyUpdates(content, data, slug) {
  let updated = content;
  const changes = [];

  // 1. Añadir campos al frontmatter si faltan
  if (data.keyword_principal && !hasFrontmatterField(content, 'keyword_principal')) {
    const insertion = `keyword_principal: "${data.keyword_principal}"\nkeywords_secundarias:\n${data.keywords_secundarias.map(k => `  - "${k}"`).join('\n')}`;
    updated = updated.replace(/^(tiempo_lectura:.*)/m, `$1\ntipo: "analisis"\n${insertion}`);
    if (!hasFrontmatterField(updated, 'tipo')) {
      // fallback: insertar antes del cierre del frontmatter
      updated = updated.replace(/^(borrador:.*)/m, `tipo: "analisis"\n${insertion}\n$1`);
    }
    changes.push('keyword_principal + keywords_secundarias');
  }

  // 2. Añadir tipo: "analisis" si falta (por si no se insertó arriba)
  if (!hasFrontmatterField(updated, 'tipo')) {
    updated = updated.replace(/^(borrador:.*)/m, `tipo: "analisis"\n$1`);
    if (!changes.includes('keyword_principal + keywords_secundarias')) changes.push('tipo: analisis');
  }

  // 3. Insertar FAQ y Fitz antes de ## Conclusión
  const sectionsToInsert = [];
  if (data.faq)  sectionsToInsert.push(data.faq);
  if (data.fitz) sectionsToInsert.push(data.fitz);

  if (sectionsToInsert.length > 0) {
    const insertion = '\n\n' + sectionsToInsert.join('\n\n');
    if (/^## Conclusión/m.test(updated)) {
      updated = updated.replace(/^(## Conclusión)/m, `${insertion}\n\n$1`);
    } else {
      // Si no hay Conclusión, insertar antes del aviso de afiliado
      updated = updated.replace(/(> ⚠️|\> \*\*Aviso de afiliado)/m, `${insertion}\n\n$1`);
    }
    if (data.faq)  changes.push('## Preguntas frecuentes');
    if (data.fitz) changes.push('## 🐿️ Fitz recomienda');
  }

  return { updated, changes };
}

// ─── Procesar un artículo ────────────────────────────────────────────────────

async function updateArticle(filename) {
  const filepath = join(CONTENT_DIR, filename);
  const slug = filename.replace('.md', '');
  const content = readFileSync(filepath, 'utf-8');

  // Solo procesar análisis individuales
  if (!isAnalisis(content)) {
    console.log(`   ⏭  ${slug} — guía/comparativa, omitida`);
    return false;
  }

  // Comprobar qué falta
  const missingFaq  = !hasSection(content, 'Preguntas frecuentes');
  const missingFitz = !hasSection(content, '🐿️ Fitz') && !hasSection(content, 'Fitz recomienda');
  const missingKw   = !hasFrontmatterField(content, 'keyword_principal');

  if (!missingFaq && !missingFitz && !missingKw) {
    console.log(`   ✓  ${slug} — ya completo`);
    return false;
  }

  console.log(`   📝 ${slug} — faltan: ${[missingFaq && 'FAQ', missingFitz && 'Fitz', missingKw && 'keywords'].filter(Boolean).join(', ')}`);

  const data = await getCompletions(content);
  const { updated, changes } = applyUpdates(content, data, slug);

  if (changes.length === 0) {
    console.log(`      Sin cambios aplicados`);
    return false;
  }

  writeFileSync(filepath, updated, 'utf-8');
  console.log(`   ✅ ${slug} — añadido: ${changes.join(', ')}`);
  return true;
}

// ─── Entrada principal ────────────────────────────────────────────────────────

async function main() {
  const singleIdx  = process.argv.indexOf('--slug');
  const singleSlug = singleIdx !== -1 ? process.argv[singleIdx + 1] : null;

  let files;
  if (singleSlug) {
    files = [`${singleSlug}.md`];
  } else {
    files = readdirSync(CONTENT_DIR).filter(f => f.endsWith('.md'));
  }

  console.log(`\nFitzDesk Article Updater — ${files.length} artículo(s)\n`);

  const startTime = Date.now();
  let updated = 0;

  for (let i = 0; i < files.length; i++) {
    try {
      const changed = await updateArticle(files[i]);
      if (changed) updated++;
    } catch (e) {
      console.error(`   ❌ ${files[i]}: ${e.message}`);
    }
    // Pausa entre llamadas a la API
    if (i < files.length - 1) await new Promise(r => setTimeout(r, 1500));
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n${'━'.repeat(48)}`);
  console.log(`Artículos actualizados: ${updated}/${files.length}`);
  console.log(`Tiempo: ${elapsed}s`);
  console.log('━'.repeat(48));
  console.log('\n💡 Recuerda hacer npm run build en FitzDesk/ para ver los cambios.');
}

main().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
