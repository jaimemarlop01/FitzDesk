/**
 * Generador one-shot para los 3 artículos de la categoría setups.
 * Uso: node generateSetups.js
 */
import 'dotenv/config';
import Groq from 'groq-sdk';
import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname   = dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = resolve(__dirname, '../src/content/articulos');
const client      = new Groq({ apiKey: process.env.GROQ_API_KEY });

const CONTEXTO = `Eres el redactor principal de FitzDesk, una web española de análisis de periféricos y setups para teletrabajo y productividad. Tono: cercano, honesto y técnico. Audiencia: trabajadores remotos que quieren mejorar su setup sin ser expertos en hardware. Mascota: Fitz, una ardilla con gafas y pajarita roja que da el veredicto final.

PRINCIPIOS OBLIGATORIOS:
- VERACIDAD: Nunca inventes pruebas. Usa "Según sus especificaciones...", "Sobre el papel...", "Cabe esperar que..."
- INDEPENDENCIA: No ocultes defectos. Los puntos negativos deben reflejarse.
- SIN ABSOLUTOS: No uses "El mejor del mercado". Usa "Destaca dentro de su categoría".
- Idioma: español de España.`;

// ─── GUÍA 1 ──────────────────────────────────────────────────────────────────

const guia1 = {
  slug: 'mejor-setup-teletrabajo-500-euros-2026',
  filename: 'mejor-setup-teletrabajo-500-euros-2026.md',
  prompt: `${CONTEXTO}

Escribe una guía de setup completo para FitzDesk.

DATOS DE LA GUÍA:
- Título: El mejor setup para teletrabajo por menos de 500€ en 2026
- Presupuesto total: ~277€ (muy por debajo de los 500€)
- Perfil: Trabajador remoto que empieza desde cero con presupuesto ajustado. Busca lo esencial sin gastar de más.

Productos del setup:
1. Monitor — BenQ GW2780 (149€) — enlace interno: /articulo/benq-gw2780-analisis/ — Monitor Full HD 27" IPS, panel de calidad con filtro de luz azul, perfecto para jornadas largas sin forzar la vista
2. Teclado — Keychron V1 (79€) — enlace interno: /articulo/keychron-v1-analisis/ — Teclado mecánico compacto 75%, switches pre-lubricados, excelente calidad-precio para escribir horas
3. Ratón — Logitech MX Anywhere 3S (49€) — enlace interno: /articulo/logitech-mx-anywhere-3s-analisis/ — Sensor de precisión, compacto, batería de 70 días, funciona en cualquier superficie

Genera el artículo completo en Markdown con este frontmatter EXACTO:

---
title: "El mejor setup para teletrabajo por menos de 500€ en 2026"
categoria: "setups"
fecha: "2026-05-29"
descripcion: "Monitor BenQ, teclado mecánico Keychron y ratón Logitech: el setup de teletrabajo más completo por solo 277€ en 2026."
imagen: "/images/articulos/mejor-setup-teletrabajo-500-euros-2026.webp"
precio: "Desde 277€"
presupuesto: "277€"
enlace_afiliado: "https://www.pccomponentes.com/benq-gw2780-monitor-led-27"
tiempo_lectura: "8 min"
tipo: "guia"
borrador: false
---

ESTRUCTURA OBLIGATORIA:

## Introducción
2 párrafos. Quién es el lector ideal (empieza desde cero, no quiere malgastar). Filosofía del setup: rendimiento máximo por el mínimo dinero. Menciona que el total es de ~277€, muy por debajo del presupuesto máximo de 500€.

## Resumen del setup

| Producto | Categoría | Precio | Enlace |
|---|---|---|---|
| BenQ GW2780 | Monitor | 149€ | [Ver en PcComponentes](https://www.pccomponentes.com/benq-gw2780-monitor-led-27) |
| Keychron V1 | Teclado mecánico | 79€ | [Ver en PcComponentes](https://www.pccomponentes.com/keychron-v1-teclado-mecanico) |
| Logitech MX Anywhere 3S | Ratón | 49€ | [Ver en PcComponentes](https://www.pccomponentes.com/logitech-mx-anywhere-3s) |
| **TOTAL** | | **277€** | |

## Por qué hemos elegido cada producto

### BenQ GW2780 — El monitor que cuida tus ojos
2-3 párrafos explicando por qué el BenQ GW2780 es la elección correcta para este setup de inicio. Menciona el análisis completo en [nuestro análisis del BenQ GW2780](/articulo/benq-gw2780-analisis/).

### Keychron V1 — El teclado mecánico sin compromisos
2-3 párrafos. Menciona el [análisis completo del Keychron V1](/articulo/keychron-v1-analisis/).

### Logitech MX Anywhere 3S — El ratón que no da problemas
2-3 párrafos. Menciona el [análisis completo del MX Anywhere 3S](/articulo/logitech-mx-anywhere-3s-analisis/).

## Cómo encajan todos juntos
1-2 párrafos sobre la coherencia del setup: todos son inalámbricos o de bajo perfil, el monitor no necesita dock externo, el conjunto es ordenado y productivo.

## Posibles mejoras futuras

### Mejora 1: Ampliar a monitor 4K
Cuándo plantearse el salto al 4K y por qué el BenQ es un buen punto de partida.

### Mejora 2: Añadir un hub USB-C
Por qué un hub mejora la organización del escritorio.

### Mejora 3: Upgrade del ratón al MX Master 3S
Cuándo el MX Anywhere se queda corto y merece la pena el salto al [MX Master 3S](/articulo/logitech-mx-master-3s-analisis/).

## Alternativas si el presupuesto no llega
- Monitor alternativo más económico (Full HD 24")
- Teclado de membrana como alternativa al Keychron
- Ratón básico con buen sensor a precio reducido

## 🐿️ Fitz recomienda este setup
4 frases máximo. Qué le gusta del conjunto, cuál es el componente estrella, a quién se lo recomendaría y con qué condiciones. Sin puntuación numérica. Personalidad de ardilla experta y directa.

## Conclusión
1 párrafo. Recuerda que por 277€ tienes todo lo que necesitas para trabajar productivamente desde casa. Llamada a la acción. Enlaza a los análisis individuales.

> ⚠️ **Aviso de afiliado**: Si compras a través de nuestros enlaces podemos recibir una pequeña comisión sin coste adicional para ti. Esto nos ayuda a seguir publicando análisis honestos e independientes.

Extensión: 1.000-1.300 palabras. Tono aspiracional pero realista. Tabla de resumen siempre al principio.`,
};

// ─── GUÍA 2 ──────────────────────────────────────────────────────────────────

const guia2 = {
  slug: 'raton-ergonomico-vs-estandar-teletrabajo',
  filename: 'raton-ergonomico-vs-estandar-teletrabajo.md',
  prompt: `${CONTEXTO}

Escribe una comparativa entre dos ratones para FitzDesk.

PRODUCTO A — Logitech Lift Vertical (69€):
- Ratón vertical ergonómico, posición de apretón de manos, reduce tensión en muñeca y antebrazo
- Sensor óptico 400-4000 DPI, 6 botones, Bluetooth + receptor Logi Bolt, batería 24 meses (AA)
- Enlace interno: /articulo/logitech-lift-vertical-analisis/

PRODUCTO B — Logitech MX Master 3S (99€):
- Ratón estándar ergonómico premium, diseño curvo, sensor Darkfield 8000 DPI
- 7 botones programables, scroll MagSpeed, batería 70 días USB-C, Bluetooth + Logi Bolt
- Enlace interno: /articulo/logitech-mx-master-3s-analisis/

Dilema del lector: ¿Merece la pena pasarse al vertical o el MX Master 3S es suficientemente ergonómico?

Genera el artículo completo en Markdown con este frontmatter EXACTO:

---
title: "Ratón ergonómico vs estándar: ¿cuál necesitas para teletrabajar?"
categoria: "setups"
fecha: "2026-05-31"
descripcion: "Logitech Lift Vertical vs MX Master 3S: comparativa honesta para saber si el ratón vertical merece la pena en tu setup de teletrabajo."
imagen: "/images/articulos/raton-ergonomico-vs-estandar-teletrabajo.webp"
precio: "Desde 69€"
precio_a: "69€"
precio_b: "99€"
enlace_afiliado: "https://www.pccomponentes.com/logitech-lift-vertical"
enlace_afiliado_a: "https://www.pccomponentes.com/logitech-lift-vertical"
enlace_afiliado_b: "https://www.pccomponentes.com/logitech-mx-master-3s"
tiempo_lectura: "7 min"
tipo: "comparativa"
borrador: false
---

ESTRUCTURA OBLIGATORIA:

## Introducción
2 párrafos. El dilema real: muchos teletrabajadores con dolores de muñeca se preguntan si basta con un ratón ergonómico estándar o necesitan un vertical. Avanza que la respuesta depende del perfil.

## En qué se parecen
3-4 características comunes: ambos son de Logitech, compatibles con Logi Options+, inalámbricos, batería larga, funcionan en cualquier superficie, aptos para teletrabajo.

## En qué se diferencian

Tabla comparativa:

| Criterio | Logitech Lift Vertical | Logitech MX Master 3S |
|---|---|---|
| Posición de uso | Vertical (apretón de manos) | Horizontal (inclinado) |
| DPI máximo | 4.000 DPI | 8.000 DPI |
| Rueda de scroll | Estándar | MagSpeed electromagnética |
| Botones | 6 | 7 programables |
| Batería | 24 meses (AA) | 70 días (USB-C) |
| Precio | 69€ | 99€ |

Desarrolla las 3 diferencias clave con subsecciones H3: ergonomía y postura, precisión y productividad, precio y relación calidad-precio.

## Experiencia de uso comparada
1 párrafo por producto usando "cabe esperar que..." y "por sus características...". Menciona los análisis: [análisis del Lift Vertical](/articulo/logitech-lift-vertical-analisis/) y [análisis del MX Master 3S](/articulo/logitech-mx-master-3s-analisis/).

## ¿Cuál elegir según tu situación?

### Elige el Logitech Lift Vertical si...
3-4 situaciones específicas: dolores de muñeca o antebrazo, jornadas de más de 6 horas, nunca has probado un vertical, presupuesto ajustado.

### Elige el Logitech MX Master 3S si...
3-4 situaciones: quieres el mejor ratón estándar sin dolencias previas, necesitas precisión para edición, valoras la rueda MagSpeed, presupuesto algo mayor.

## Ganador según el tipo de usuario

| Perfil | Recomendación |
|---|---|
| Con dolores de muñeca | Logitech Lift Vertical |
| Sin problemas ergonómicos | Logitech MX Master 3S |
| Presupuesto ajustado | Logitech Lift Vertical |
| Máxima productividad | Logitech MX Master 3S |
| Primera experiencia en ergonómico | Logitech Lift Vertical |

## 🐿️ El veredicto de Fitz
3 frases. Cuál elegiría Fitz y por qué (sin dudarlo, el vertical si hay dolencias). Cuándo elegiría el MX Master. Consejo final para el lector indeciso. Sin puntuación numérica.

## Conclusión
1 párrafo. No hay ganador universal: depende de si tienes molestias o no. Llamada a la acción clara.

> ⚠️ **Aviso de afiliado**: Si compras a través de nuestros enlaces podemos recibir una pequeña comisión sin coste adicional para ti. Esto nos ayuda a seguir publicando análisis honestos e independientes.

Extensión: 800-1.100 palabras. Sin puntuación numérica en ningún momento. Tabla comparativa bien formateada.`,
};

// ─── GUÍA 3 ──────────────────────────────────────────────────────────────────

const guia3 = {
  slug: 'setup-teletrabajo-profesional-2026',
  filename: 'setup-teletrabajo-profesional-2026.md',
  prompt: `${CONTEXTO}

Escribe una guía de setup completo premium para FitzDesk.

DATOS DE LA GUÍA:
- Título: Setup de teletrabajo profesional: la configuración para trabajar en serio
- Presupuesto total: ~607€
- Perfil: Profesional exigente que pasa más de 8 horas al día frente al ordenador, no le importa pagar más si la calidad lo justifica.

Productos del setup:
1. Monitor — LG 27UP850N (399€) — enlace interno: /articulo/lg-27up850n-analisis/ — Monitor 4K 27" IPS con USB-C 96W (carga el portátil con un solo cable), panel Nano IPS con cobertura DCI-P3 95%
2. Teclado — Keychron K8 Pro (109€) — enlace interno: /articulo/keychron-k8-pro-analisis/ — Teclado mecánico TKL inalámbrico hot-swap, compatible Mac/Windows, construcción premium con aluminio
3. Ratón — Logitech MX Master 3S (99€) — enlace interno: /articulo/logitech-mx-master-3s-analisis/ — El mejor ratón para productividad: sensor Darkfield 8000 DPI, scroll MagSpeed, 7 botones programables

Genera el artículo completo en Markdown con este frontmatter EXACTO:

---
title: "Setup de teletrabajo profesional: la configuración para trabajar en serio"
categoria: "setups"
fecha: "2026-06-02"
descripcion: "Monitor 4K LG, Keychron K8 Pro y MX Master 3S: el setup de teletrabajo profesional definitivo por 607€ en 2026."
imagen: "/images/articulos/setup-teletrabajo-profesional-2026.webp"
precio: "Desde 607€"
presupuesto: "607€"
enlace_afiliado: "https://www.pccomponentes.com/lg-27up850n-monitor-4k"
tiempo_lectura: "9 min"
tipo: "guia"
borrador: false
---

ESTRUCTURA OBLIGATORIA:

## Introducción
2 párrafos. El lector ideal trabaja en remoto más de 8 horas al día y sabe que las herramientas correctas hacen la diferencia. Filosofía: no el más caro del mercado, sino el mejor ratio calidad-precio en la gama alta. Total: 607€.

## Resumen del setup

| Producto | Categoría | Precio | Enlace |
|---|---|---|---|
| LG 27UP850N | Monitor 4K | 399€ | [Ver en PcComponentes](https://www.pccomponentes.com/lg-27up850n-monitor-4k) |
| Keychron K8 Pro | Teclado mecánico | 109€ | [Ver en PcComponentes](https://www.pccomponentes.com/keychron-k8-pro) |
| Logitech MX Master 3S | Ratón | 99€ | [Ver en PcComponentes](https://www.pccomponentes.com/logitech-mx-master-3s) |
| **TOTAL** | | **607€** | |

## Por qué hemos elegido cada producto

### LG 27UP850N — El monitor que lo cambia todo
2-3 párrafos. El USB-C que carga el portátil con un solo cable es el argumento más fuerte. Resolución 4K en 27" a la distancia correcta. Enlaza al [análisis completo del LG 27UP850N](/articulo/lg-27up850n-analisis/).

### Keychron K8 Pro — El teclado mecánico que no da concesiones
2-3 párrafos. Hot-swap permite cambiar switches sin soldar. Compatibilidad Mac y Windows. Construcción con placa de aluminio. Enlaza al [análisis completo del Keychron K8 Pro](/articulo/keychron-k8-pro-analisis/).

### Logitech MX Master 3S — El ratón para los que escriben todo el día
2-3 párrafos. La rueda MagSpeed cambia cómo navegas por documentos largos. El sensor Darkfield funciona en cualquier superficie. Enlaza al [análisis completo del MX Master 3S](/articulo/logitech-mx-master-3s-analisis/).

## Cómo encajan todos juntos
1-2 párrafos sobre la sinergia del setup: el USB-C del LG elimina cables, los tres dispositivos conectan vía Bluetooth o receptores, el escritorio queda limpio y profesional. El Keychron y el MX Master comparten la estética discreta.

## Posibles mejoras futuras

### Mejora 1: Segundo monitor
Cuándo añadir un segundo monitor y qué modelo complementa bien al LG 27UP850N.

### Mejora 2: Hub USB-C con Ethernet
Por qué un hub con puerto de red mejora la estabilidad en videollamadas.

### Mejora 3: Mejora de audio — auriculares para videollamadas
Cuándo el audio se convierte en el cuello de botella del setup profesional.

## Alternativas si el presupuesto no llega
- Monitor alternativo: Dell S2722QC como opción más económica a ~280€. El sacrificio: QHD en vez de 4K.
- Teclado alternativo: Keychron V1 a 79€. El sacrificio: sin hot-swap ni aluminio.
- Ratón alternativo: Logitech MX Anywhere 3S a 49€. El sacrificio: sin scroll MagSpeed ni botones extra.

## 🐿️ Fitz recomienda este setup
4 frases máximo. Qué destaca Fitz del conjunto (el USB-C del LG es el MVP). A quién se lo recomendaría sin reservas. Qué componente cambiaría si tuviera que recortar. Personalidad directa y honesta. Sin puntuación numérica.

## Conclusión
1 párrafo. 607€ bien invertidos si pasas muchas horas al día trabajando desde casa. Llamada a la acción hacia los análisis individuales.

> ⚠️ **Aviso de afiliado**: Si compras a través de nuestros enlaces podemos recibir una pequeña comisión sin coste adicional para ti. Esto nos ayuda a seguir publicando análisis honestos e independientes.

Extensión: 1.100-1.400 palabras. Tono exigente y técnico. Tabla obligatoria al principio.`,
};

// ─── Generador ────────────────────────────────────────────────────────────────

async function generate(config) {
  console.log(`\n📝 Generando: ${config.slug}`);
  console.log('   Llamando a Groq...');

  const completion = await client.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    max_tokens: 3200,
    messages: [{ role: 'user', content: config.prompt }],
  });

  const content = completion.choices[0]?.message?.content ?? '';
  if (!content) throw new Error('Groq no devolvió contenido');

  const filepath = `${CONTENT_DIR}/${config.filename}`;
  writeFileSync(filepath, content, 'utf-8');
  console.log(`   ✅ Guardado: src/content/articulos/${config.filename}`);
  console.log(`   Palabras aprox.: ${content.split(/\s+/).length}`);
  return content;
}

async function main() {
  console.log('\nFitzDesk — Generador de artículos de Setups');
  console.log('━'.repeat(48));

  for (const guia of [guia1, guia2, guia3]) {
    try {
      await generate(guia);
      if (guia !== guia3) await new Promise(r => setTimeout(r, 2000));
    } catch (e) {
      console.error(`   ❌ Error en ${guia.slug}: ${e.message}`);
    }
  }

  console.log('\n━'.repeat(48));
  console.log('Generación completada.');
  console.log('💡 Recuerda: npm run build en FitzDesk/ para ver los cambios.');
}

main().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
