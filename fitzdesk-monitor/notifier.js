import { appendFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const LOG_DIR  = join(__dirname, 'logs');
const LOG_FILE = join(LOG_DIR, 'novedades.log');

// ─────────────────────────────────────────────
// Logging
// ─────────────────────────────────────────────

function ensureLogDir() {
  if (!existsSync(LOG_DIR)) mkdirSync(LOG_DIR, { recursive: true });
}

function timestamp() {
  return new Date().toISOString().replace('T', ' ').slice(0, 19);
}

function formatLog(level, message) {
  return `[${timestamp()}] [${level}] ${message}`;
}

export function logInfo(message) {
  const line = formatLog('INFO', message);
  console.log(`\x1b[36m${line}\x1b[0m`);
  ensureLogDir();
  appendFileSync(LOG_FILE, line + '\n', 'utf-8');
}

export function logSuccess(message) {
  const line = formatLog('OK  ', message);
  console.log(`\x1b[32m${line}\x1b[0m`);
  ensureLogDir();
  appendFileSync(LOG_FILE, line + '\n', 'utf-8');
}

export function logWarn(message) {
  const line = formatLog('WARN', message);
  console.warn(`\x1b[33m${line}\x1b[0m`);
  ensureLogDir();
  appendFileSync(LOG_FILE, line + '\n', 'utf-8');
}

export function logError(message) {
  const line = formatLog('ERR ', message);
  console.error(`\x1b[31m${line}\x1b[0m`);
  ensureLogDir();
  appendFileSync(LOG_FILE, line + '\n', 'utf-8');
}

// ─────────────────────────────────────────────
// Discord
// ─────────────────────────────────────────────

const CATEGORY_EMOJI = {
  ratones:    '🖱️',
  teclados:   '⌨️',
  monitores:  '🖥️',
  portatiles: '💻',
  auriculares:'🎧',
  setups:     '🏠',
  guias:      '📖',
};

async function discordPost(payload) {
  const url = process.env.DISCORD_WEBHOOK_URL;
  if (!url) return;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      logWarn(`Discord respondió ${res.status}: ${await res.text()}`);
    }
  } catch (e) {
    logWarn(`Error enviando notificación Discord: ${e.message}`);
  }
}

// ─────────────────────────────────────────────
// Notificación por borrador generado
// ─────────────────────────────────────────────

export async function notifyDraft({ title, slug, source, filePath, categoria, description, imageUrl, articleUrl, possibleDuplicate, pcPrice, pcUrl, usedGitHub }) {
  const msg = `BORRADOR GENERADO — "${title}" (fuente: ${source}) → ${filePath}`;
  logSuccess(msg);

  const emoji    = CATEGORY_EMOJI[categoria] ?? '📝';
  const catLabel = categoria
    ? categoria.charAt(0).toUpperCase() + categoria.slice(1)
    : 'General';

  const fields = [
    { name: '📦 Producto',        value: title.slice(0, 200),                                inline: false },
    { name: `${emoji} Categoría`, value: catLabel,                                            inline: true  },
    { name: '📡 Fuente',          value: articleUrl ? `[${source}](${articleUrl})` : source, inline: true  },
  ];

  if (pcPrice) {
    fields.push({ name: '💰 Precio en PcComponentes', value: pcPrice, inline: true });
  }
  if (pcUrl) {
    fields.push({ name: '🛒 Ver producto', value: `[PcComponentes](${pcUrl})`, inline: false });
  }

  fields.push(
    { name: '📝 Borrador', value: `\`borrador-${slug}.md\``, inline: false },
  );

  if (usedGitHub && filePath) {
    fields.push({
      name:   '📄 Ver borrador',
      value:  `[Abrir en GitHub](${filePath})`,
      inline: false,
    });
  }

  if (possibleDuplicate) {
    fields.push({
      name:   '⚠️ Posible duplicado',
      value:  `Ya existe \`${possibleDuplicate}\`. Revisa antes de publicar.`,
      inline: false,
    });
  }

  if (usedGitHub) {
    fields.push({
      name: '✅ Siguientes pasos',
      value: [
        '1. Revisa el borrador en GitHub (enlace de arriba)',
        '2. Completa precio, enlace de afiliado e imagen',
        '3. Quita `borrador: true` del frontmatter',
        '4. Renombra el archivo (quita el prefijo `borrador-`)',
        '5. Haz merge de la rama `borradores` a `main` para publicarlo',
      ].join('\n'),
      inline: false,
    });
  } else {
    fields.push({
      name: '✅ Siguientes pasos',
      value: [
        '1. Completar precio y enlace de afiliado',
        '2. Revisar y editar el contenido generado',
        '3. Quitar `borrador: true` del frontmatter',
        '4. Renombrar el archivo (quitar prefijo `borrador-`)',
        '5. Ejecutar `npm run build` para publicar',
      ].join('\n'),
      inline: false,
    });
  }

  const embed = {
    title: possibleDuplicate ? '🐿️ Fitz ha detectado una novedad ⚠️' : '🐿️ Fitz ha detectado una novedad',
    color: possibleDuplicate ? 0xEAB308 : 0xF97316,
    fields,
    footer: { text: `FitzDesk Monitor • ${timestamp()}` },
  };

  if (imageUrl) embed.image = { url: imageUrl };

  await discordPost({ embeds: [embed] });
}

// ─────────────────────────────────────────────
// Resumen al final de cada ejecución
// ─────────────────────────────────────────────

export async function notifySummary({ totalNew, totalDrafts, errors, totalDiscard = 0 }) {
  if (!process.env.DISCORD_WEBHOOK_URL) return;
  if (totalNew === 0 && errors.length === 0) return;

  const hasErrors = errors.length > 0;
  const color = hasErrors ? 0xEF4444 : totalDrafts > 0 ? 0x22C55E : 0x6B7280;
  const emoji = hasErrors ? '⚠️' : totalDrafts > 0 ? '✅' : 'ℹ️';

  const fields = [
    { name: '✅ Relevantes',         value: String(totalNew),     inline: true },
    { name: '📝 Borradores',         value: String(totalDrafts),  inline: true },
    { name: '🗑️ Descartados',        value: String(totalDiscard), inline: true },
  ];

  if (hasErrors) {
    fields.push({
      name:  `⚡ Fuentes con error (${errors.length})`,
      value: errors.map(e => `• ${e}`).join('\n'),
      inline: false,
    });
  }

  await discordPost({
    embeds: [{
      title: `${emoji} FitzDesk Monitor — Resumen`,
      color,
      fields,
      footer: { text: `FitzDesk Monitor • ${timestamp()}` },
    }],
  });
}

// ─────────────────────────────────────────────
// Resumen diario (se envía siempre a las 9 AM)
// ─────────────────────────────────────────────

export async function notifyDailySummary({ totalScanned, totalRelevant, totalDrafts, totalOfertas, totalDiscard, totalCached, discardLayer1, discardLayer2, discardLayer3, dudosos, draftTitles, errors, productos }) {
  if (!process.env.DISCORD_WEBHOOK_URL) return;

  const l1 = discardLayer1 ?? 0;
  const l2 = discardLayer2 ?? 0;
  const l3 = discardLayer3 ?? 0;
  const cached = totalCached ?? 0;

  const fields = [
    {
      name:   '🔍 Artículos escaneados',
      value:  `${totalScanned ?? 0} artículos revisados`,
      inline: true,
    },
    {
      name:   '✅ Borradores generados',
      value:  `${totalDrafts ?? 0} nuevos borradores`,
      inline: true,
    },
    {
      name:   '💾 Ya en caché',
      value:  `${cached} artículos ya procesados anteriormente`,
      inline: true,
    },
    {
      name:   '🔥 Ofertas detectadas',
      value:  `${totalOfertas ?? 0} borradores de oferta generados`,
      inline: true,
    },
    {
      name:   '❌ Descartados por filtro',
      value:  `${totalDiscard ?? 0} artículos — desglose:\n• Capa 1 (palabras descarte): ${l1}\n• Capa 2 (sin producto físico): ${l2}\n• Capa 3 (sin marca reconocida): ${l3}`,
      inline: false,
    },
  ];

  // ── Casos dudosos ──
  const dudosoList = Array.isArray(dudosos) ? dudosos : [];
  if (dudosoList.length > 0) {
    const lines = dudosoList.slice(0, 8).map(d =>
      `⚠️ ${d.title.slice(0, 80)}\n   _${d.hint}_`
    );
    if (dudosoList.length > 8) lines.push(`_…y ${dudosoList.length - 8} más_`);
    fields.push({
      name:   '⚠️ Casos dudosos',
      value:  lines.join('\n\n').slice(0, 1024),
      inline: false,
    });
  } else {
    fields.push({
      name:   '⚠️ Casos dudosos',
      value:  'Sin casos dudosos hoy ✅',
      inline: false,
    });
  }

  // ── Borradores generados hoy ──
  const titles = Array.isArray(draftTitles) ? draftTitles : [];
  fields.push({
    name:   '📦 Borradores generados hoy',
    value:  titles.length > 0
      ? titles.slice(0, 10).map(t => `• ${t.slice(0, 90)}`).join('\n').slice(0, 1024)
      : 'Ninguno hoy',
    inline: false,
  });

  // ── Agrupamiento por marca ──
  if (Array.isArray(productos) && productos.length > 0) {
    const byBrand  = {};
    const sinMarca = [];

    for (const p of productos) {
      if (p.brand) {
        const key = p.brand.toLowerCase();
        (byBrand[key] = byBrand[key] ?? []).push(p);
      } else {
        sinMarca.push(p);
      }
    }

    for (const [brand, items] of Object.entries(byBrand)) {
      if (items.length >= 2) {
        fields.push({
          name:  `⚠️ ${items.length} artículos de ${brand.toUpperCase()} detectados hoy`,
          value: (items.map(i => `• ${i.title.slice(0, 80)} _(${i.categoria})_`).join('\n') +
                 '\n→ Revisa cuál tiene más interés para FitzDesk antes de publicar.').slice(0, 1024),
          inline: false,
        });
      } else {
        sinMarca.push(...items);
      }
    }

    if (sinMarca.length > 0) {
      fields.push({
        name:   '📦 Otros productos detectados',
        value:  sinMarca.slice(0, 8).map(p => `• ${p.title.slice(0, 80)}`).join('\n').slice(0, 1024),
        inline: false,
      });
    }
  }

  if ((errors?.length ?? 0) > 0) {
    fields.push({
      name:   `⚡ Fuentes con error (${errors.length})`,
      value:  errors.map(e => `• ${e}`).join('\n').slice(0, 1024),
      inline: false,
    });
  }

  await discordPost({
    embeds: [{
      title:     '📊 Resumen diario de FitzDesk Monitor',
      color:     0xF97316,
      fields,
      footer:    { text: 'FitzDesk Monitor • Resumen diario' },
      timestamp: new Date().toISOString(),
    }],
  });
}

// ─────────────────────────────────────────────
// Recordatorio de publicación
// ─────────────────────────────────────────────

export async function notifyPublicationReminder({ slug, titulo, categoria, prioridad }) {
  const githubUrl = `https://github.com/jaimemarlop01/FitzDesk/blob/borradores/src/content/articulos/${slug}.md`;

  await discordPost({
    embeds: [{
      title:       '📅 Recordatorio de publicación',
      color:       16345364,
      description: 'Hoy toca publicar un artículo en FitzDesk',
      fields: [
        { name: '📝 Artículo',  value: titulo,    inline: false },
        { name: '📂 Categoría', value: categoria, inline: true  },
        { name: '⭐ Prioridad', value: prioridad, inline: true  },
        {
          name:  '⏰ Horario de publicación',
          value: 'Recuerda publicar entre las **9:00 y las 14:00** para maximizar el tráfico (hora exacta no garantizada por retrasos de cola en GitHub Actions)',
          inline: false,
        },
        {
          name: '✅ Checklist',
          value: [
            '□ Revisar el artículo',
            '□ Verificar precio en PcComponentes',
            '□ Comprobar que la imagen carga',
            '□ Eliminar borrador: true',
            '□ Ejecutar agente publicar-borrador',
            '□ Verificar en fitzdesk.com',
          ].join('\n'),
          inline: false,
        },
        {
          name:  '🔗 Borrador en GitHub',
          value: `[Abrir en GitHub](${githubUrl})`,
          inline: false,
        },
      ],
      footer: { text: 'FitzDesk · Recordatorio de publicación' },
    }],
  });
  logSuccess(`📅 Recordatorio de publicación enviado: "${titulo}"`);
}

// ─────────────────────────────────────────────
// Seguimiento de lanzamientos pendientes
// ─────────────────────────────────────────────

export async function notifyLaunchReminder({ slug, titulo, fecha_lanzamiento, tiendas_a_revisar }) {
  const tiendasText = (tiendas_a_revisar ?? [])
    .map(url => {
      const name = url.includes('pccomponentes') ? 'PcComponentes'
                 : url.includes('amazon')        ? 'Amazon España'
                 : url.includes('mediamarkt')    ? 'MediaMarkt'
                 : url;
      return `[${name}](${url})`;
    })
    .join('\n');

  await discordPost({
    embeds: [{
      title:       '🚀 Seguimiento de lanzamiento pendiente',
      color:       16345364,
      description: `Es momento de revisar si ya está disponible`,
      fields: [
        { name: '📦 Producto',       value: titulo,            inline: false },
        { name: '📅 Fecha prevista', value: fecha_lanzamiento, inline: true  },
        { name: '🔍 Revisar disponibilidad en', value: tiendasText, inline: false },
        {
          name:  '✅ Siguiente paso',
          value: `Si ya está disponible ejecuta el agente actualizar-lanzamiento con slug: \`${slug}\``,
          inline: false,
        },
      ],
      footer: { text: 'FitzDesk · Seguimiento de lanzamientos' },
    }],
  });
  logSuccess(`🚀 Recordatorio de lanzamiento enviado: "${titulo}"`);
}

// ─────────────────────────────────────────────
// Borrador de oferta generado
// ─────────────────────────────────────────────

export async function notifyOferta({ titulo, slug, precio_oferta, precio_normal, descuento, fuente, analisis_relacionado, filePath }) {
  const fields = [
    { name: '📦 Producto',     value: titulo,                                inline: false },
    { name: '🔥 Precio oferta', value: precio_oferta ?? 'por confirmar',     inline: true  },
  ];
  if (precio_normal) fields.push({ name: '💰 Precio normal', value: precio_normal, inline: true });
  if (descuento)      fields.push({ name: '📉 Descuento estimado', value: descuento, inline: true });
  if (fuente)          fields.push({ name: '🏬 Fuente', value: fuente, inline: true });

  fields.push({
    name:  '🔗 Análisis relacionado en FitzDesk',
    value: analisis_relacionado ? `Sí — \`${analisis_relacionado}\`` : 'No existe todavía — el borrador incluye una breve descripción del producto',
    inline: false,
  });

  fields.push({ name: '📝 Borrador', value: `\`${filePath}\``, inline: false });

  fields.push({
    name: '✅ Siguientes pasos',
    value: [
      '1. Verificar que el precio de oferta sigue activo',
      '2. Revisar y completar el contenido generado',
      '3. Añadir imagen si falta',
      '4. Quitar `borrador: true` y publicar',
    ].join('\n'),
    inline: false,
  });

  await discordPost({
    embeds: [{
      title: '🐿️ Fitz ha detectado una oferta',
      color: 0xF97316,
      fields,
      footer: { text: `FitzDesk Monitor • ${timestamp()}` },
    }],
  });
  logSuccess(`🔥 Oferta detectada y notificada: "${titulo}"`);
}

// ─────────────────────────────────────────────
// Modo PCDays — ofertas que necesitan revisión manual antes de publicar
// ─────────────────────────────────────────────

export async function notifyOfertaPendienteRevision({ titulo, slug, precio_oferta, descuento, motivo, filePath }) {
  await discordPost({
    embeds: [{
      title: '⏳ Oferta pendiente de revisión manual',
      color: 15105570, // ámbar
      fields: [
        { name: '📦 Producto',    value: titulo, inline: false },
        { name: '🔥 Precio oferta', value: precio_oferta ?? 'por confirmar', inline: true },
        ...(descuento ? [{ name: '📉 Descuento', value: descuento, inline: true }] : []),
        { name: '❓ Motivo de la revisión manual', value: motivo, inline: false },
        { name: '📝 Borrador', value: `\`${filePath}\``, inline: false },
        {
          name: '✅ Para publicarla',
          value: 'Revisa el borrador, completa lo que falte y quita `borrador: true` — o usa el agente "Publicador de borrador" con el slug.',
          inline: false,
        },
      ],
      footer: { text: `FitzDesk Monitor — Modo PCDays • ${timestamp()}` },
    }],
  });
  logSuccess(`⏳ Oferta en cola de revisión manual: "${titulo}" (${motivo})`);
}

/** Publicación automática de una oferta (sin pasar por el calendario). */
export async function notifyOfertaPublicada({ titulo, slug, url, precio_oferta, precio_normal, descuento }) {
  const fields = [
    { name: '📦 Producto',     value: titulo, inline: false },
    { name: '🔥 Precio oferta', value: precio_oferta, inline: true },
  ];
  if (precio_normal) fields.push({ name: '💰 Precio normal', value: precio_normal, inline: true });
  if (descuento)      fields.push({ name: '📉 Descuento',    value: descuento,     inline: true });
  fields.push({ name: '🔗 Artículo en vivo', value: url, inline: false });
  fields.push({ name: '📣 Redes sociales', value: 'Publicación disparada — recibirás otra notificación cuando termine.', inline: false });

  await discordPost({
    embeds: [{
      title:       '🚀 Oferta publicada automáticamente',
      description: 'Sin pasar por el calendario — modo PCDays.',
      color:       5763719, // verde
      fields,
      footer: { text: `FitzDesk Monitor — Modo PCDays • ${timestamp()}` },
    }],
  });
  logSuccess(`🚀 Oferta publicada automáticamente: "${titulo}" → ${url}`);
}

