import OpenAI from 'openai';

let client = null;

function getClient() {
  if (client) return client;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey.startsWith('sk-...') || apiKey === 'tu_api_key_de_openai') {
    console.error('❌ OPENAI_API_KEY no configurada.');
    console.error('   Crea el archivo fitzdesk-guide-images/.env con:');
    console.error('   OPENAI_API_KEY=sk-...');
    console.error('   Obtén tu key en: https://platform.openai.com/api-keys');
    process.exit(1);
  }

  client = new OpenAI({ apiKey });
  return client;
}

/**
 * Genera una imagen con DALL-E 3 y devuelve el buffer PNG descargado.
 * @param {string} prompt  Descripción de la imagen
 * @param {string} slug    Slug de la guía (solo para logging)
 * @returns {Promise<Buffer>}
 */
export async function generateWithDalle(prompt, slug) {
  const openai = getClient();

  console.log('   ⏳ Llamando a DALL-E 3 (puede tardar 15-30 segundos)...');

  let imageUrl;
  try {
    const response = await openai.images.generate({
      model:   'dall-e-3',
      prompt,
      size:    '1792x1024',
      quality: 'hd',
      style:   'vivid',
      n:       1,
    });
    imageUrl = response.data[0].url;
    console.log('   ✓ Imagen generada correctamente');
  } catch (e) {
    if (e.status === 400) {
      throw new Error(`Política de contenido: ${e.message}`);
    }
    if (e.status === 429 || (e.message && e.message.includes('billing'))) {
      console.error('\n❌ Sin créditos en OpenAI. Recarga en: https://platform.openai.com/billing');
      process.exit(1);
    }
    throw e;
  }

  // Descargar la URL temporal (expira en 1 hora)
  console.log('   ⬇️  Descargando imagen temporal...');
  let buffer;
  let lastErr;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(imageUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      buffer = Buffer.from(await res.arrayBuffer());
      console.log('   ✓ Descargada');
      break;
    } catch (e) {
      lastErr = e;
      if (attempt < 3) {
        console.log(`   ⚠️  Reintentando descarga (${attempt}/3)...`);
        await new Promise(r => setTimeout(r, 2000));
      }
    }
  }

  if (!buffer) throw new Error(`Fallo al descargar imagen: ${lastErr.message}`);

  return buffer;
}
