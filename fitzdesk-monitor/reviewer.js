import { logInfo, logWarn } from './notifier.js';

// ─────────────────────────────────────────────
// Capa 2 — Verificación con Gemini API
// Si GEMINI_API_KEY no está configurada, devuelve relevante=true (sin coste)
// ─────────────────────────────────────────────

const GEMINI_ENDPOINT =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

export async function verifyWithGemini({ title, description }) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return { relevante: true, categoria: null, producto: null, motivo: 'Sin clave Gemini, asumido relevante' };
  }

  const prompt = `Analiza este titular y descripción de una noticia tech:
Título: "${title}"
Descripción: "${description?.slice(0, 300) ?? ''}"

¿Es relevante para una web española de análisis de periféricos y setups de teletrabajo
(ratones, teclados, monitores, portátiles, auriculares, webcams, sillas ergonómicas)?

Responde SOLO con JSON válido (sin markdown, sin bloques de código):
{"relevante":true,"categoria":"ratones|teclados|monitores|portatiles|auriculares|setups|otro","producto":"nombre del producto o null","motivo":"explicación breve"}`;

  try {
    const res = await fetch(`${GEMINI_ENDPOINT}?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(8000),
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0, maxOutputTokens: 150 },
      }),
    });

    if (!res.ok) {
      logWarn(`Gemini respondió ${res.status} — saltando verificación`);
      return { relevante: true, categoria: null, producto: null };
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    const cleaned = text.replace(/```json\n?|```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);

    logInfo(`  Gemini: relevante=${parsed.relevante} | ${parsed.motivo ?? ''}`);
    return parsed;
  } catch (err) {
    logWarn(`Error en verificación Gemini: ${err.message} — asumiendo relevante`);
    return { relevante: true, categoria: null, producto: null };
  }
}
