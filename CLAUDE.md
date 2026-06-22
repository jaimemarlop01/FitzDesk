# FitzDesk — Contexto para Claude Code

Web de análisis de periféricos y setups para teletrabajo.
Mascota: Fitz (ardilla con gafas, pajarita roja, personalidad pícara e inteligente).

---

## Rutas importantes

```
C:\xampp\htdocs\FitzDesk\                          → Proyecto Astro (web)
C:\xampp\htdocs\FitzDesk\src\content\articulos\    → Artículos Markdown
C:\xampp\htdocs\FitzDesk\public\images\articulos\  → Imágenes de productos
C:\xampp\htdocs\FitzDesk\fitzdesk-monitor\         → Monitor Node.js
C:\xampp\htdocs\FitzDesk\fitzdesk-monitor\data\    → Caché persistente
```

---

## Stack

- **Web**: Astro v4, CSS vanilla, JS vanilla, Fuse.js (buscador), @astrojs/sitemap@3.1.6 (generación automática — versión 3.1.x es la compatible con Astro 4; 3.7.x requiere Astro 5)
- **Monitor**: Node.js, Groq (llama-3.3-70b-versatile), Discord webhooks
- **Deploy web**: GitHub Actions → GitHub Pages
- **Deploy monitor**: GitHub Actions (diario — 8:00 CET / 9:00 CEST) — migrado desde Railway el 2026-06-10
- **URL**: https://fitzdesk.com (dominio propio verificado en Search Console por DNS el 2026-06-12)

---

## Identidad visual

```css
--color-primary: #F97316      /* naranja FitzDesk — usar siempre */
--color-primary-dark: #EA580C /* hover */
--color-text: #1F2937
--color-text-secondary: #6B7280
--color-background: #F9FAFB
--color-border: #E5E7EB
--color-success: #16a34a      /* puntuación alta (>= 9) */
--color-error: #DC2626        /* puntuación baja (< 7.5) */
```

---

## Tipos de artículo (campo `tipo` en frontmatter)

| tipo | puntuacion | enlace afiliado |
|---|---|---|
| `analisis` | ✓ obligatoria | un enlace |
| `comparativa` | ✗ no tiene | dos enlaces (a y b) |
| `guia` | ✗ no tiene | varios en array |
| `lanzamiento` | ✗ no tiene | vacío hasta disponibilidad |

Los artículos con `borrador: true` NO se publican en la web.
Los borradores generados por el monitor empiezan por `borrador-`.

---

## Comandos frecuentes

```bash
# Web
npm run dev                    # localhost:4321/
npm run build                  # genera /dist
git add . && git commit -m "mensaje" && git push  # publicar

# Monitor
node monitor.js --test         # comprobación manual sin guardar
node monitor.js --daemon       # modo continuo 24h (solo local — en producción usa GitHub Actions)
node test-discord.js           # probar Discord
node articleUpdater.js --slug [slug] --precio [precio]€
node compareGenerator.js --config comparativa.json
node guideGenerator.js --config guia.json
node launchGenerator.js --config lanzamiento.json
node imageCollector.js --slug [slug]
node imageCollector.js --slug [slug] --query "[texto de búsqueda manual]"  # sobrescribe el title (añadido 2026-06-21)
node socialPublisher.js --test --slug [slug]   # modo test, no publica nada real
node socialPublisher.js --slug [slug]          # publica en Instagram + Facebook
```

---

## Variables de entorno del monitor

```
GROQ_API_KEY
DISCORD_WEBHOOK_URL
ASTRO_CONTENT_PATH=C:\xampp\htdocs\FitzDesk\src\content\articulos
GEMINI_API_KEY (opcional)
```

---

## Normas de desarrollo

1. **Nunca modificar el slug de un artículo publicado** — rompe los enlaces
2. **CSS**: usar siempre las variables CSS, nunca colores hardcodeados
3. **Imágenes**: formato WebP, ratio 16:9, guardar en `/public/images/articulos/`
4. **Borradores**: siempre con `borrador: true` hasta revisión humana
5. **Enfoque editorial**: FitzDesk cubre todo lo que mejora el trabajo desde casa — incluyendo productos de origen gaming si son válidos para teletrabajo. El enfoque siempre es productividad, no ocio. NO cubrir: videojuegos, consolas, accesorios puramente de ocio sin utilidad laboral.
6. **Fitz**: aparece en sección `## 🐿️ Fitz recomienda` en cada artículo
7. **Afiliados**: aviso legal obligatorio al final de cada artículo

---

## Notas importantes

**NOTA: El campo `enlace_afiliado`** en el frontmatter de los artículos contiene actualmente URLs directas a PcComponentes **SIN tracking de afiliado real**. Esto cambiará cuando Awin apruebe el programa de PcComponentes (previsto julio 2026 con 30+ artículos). Hasta entonces, tratar este campo como **"enlace de producto"**, no como **"enlace de afiliado"**, en cuanto a prioridad de corrección: un enlace roto o incompleto es un problema de severidad baja / UX, no bloqueante, y no implica pérdida de ingresos (no hay ingresos de afiliados posibles todavía).

---

## Bugs pendientes de resolver

- [x] Buscador muestra Fitz duplicado (estado vacío y estado sin resultados)
- [x] "undefined/10" en comparativas y guías en el buscador
- [x] Descripción en color naranja en resultados del buscador
- [x] Texto "Fitz no encuentra nada para" sin mostrar el término buscado
- [x] Gap visual excesivo en la home entre categorías y últimos análisis (2026-06-12)
- [x] Banner de cookies implementado (2026-06-11) — RGPD/AEPD, Consent Mode v2, clave fitzdesk_cookies_consent

---

## Hoja de ruta FitzDesk

### FASE 1 — Consolidación teletrabajo (Junio - Diciembre 2026)

**Junio 2026 — Arranque**
Publicaciones: 8 artículos
- Martes/Jueves: análisis de productos
- Sin guías dominicales este mes
Hitos:
- Web publicada en fitzdesk.com ✅
- Google Analytics instalado ✅
- GitHub Actions corriendo ✅
- [x] ✅ Cuenta Awin registrada (junio 2026)

**Julio 2026 — Primer mes completo**
Publicaciones: 10 artículos
- 2 domingos: guías o comparativas
- 8 martes/jueves: análisis de productos
Hitos:
- [ ] 30+ artículos publicados
- [ ] Solicitar programa PcComponentes en Awin
- [x] Configurar Google Search Console (completado en junio 2026, verificación por DNS)
- [ ] Registrar @fitzdesk en redes sociales

**Agosto 2026 — Crecimiento**
Publicaciones: 10 artículos
- 2 domingos: guías o comparativas
- 8 martes/jueves: análisis de productos
Hitos:
- [ ] Alta en Awin esperando respuesta
- [ ] Activar enlaces de afiliado si aprobado
- [ ] Primeras comisiones potenciales

**Septiembre 2026 — Monetización**
Publicaciones: 10 artículos
- 2 domingos: guías o comparativas
- 8 martes/jueves: análisis de productos
Hitos:
- [ ] 50+ artículos publicados
- [ ] Enlaces de afiliado activos
- [ ] Primeras comisiones reales
- [ ] Crear email hola@fitzdesk.com

**Octubre - Noviembre 2026 — Consolidación**
Publicaciones: 10 artículos/mes
- 2 domingos: guías o comparativas
- 8 martes/jueves: análisis de productos
Hitos:
- [ ] 70+ artículos publicados
- [ ] 1.000 visitas/mes objetivo
- [ ] Newsletter con Mailchimp

**Diciembre 2026 — Balance anual**
Publicaciones: 10 artículos
- Artículos "Mejores productos del año"
- Guías de regalos de Navidad
Hitos:
- [ ] 80+ artículos publicados
- [ ] Balance de tráfico y primeros ingresos
- [ ] Planificación Fase 2

---

### FASE 2 — Expansión tecnología profesional (2027 Q1-Q2)

**Enero - Febrero 2027**
Publicaciones: 12 artículos/mes (3/semana)
Nuevas categorías:
- Auriculares con cancelación de ruido
- Webcams para videollamadas
- Micrófonos para home office
Hitos:
- [ ] 100+ artículos publicados
- [ ] 2.000 visitas/mes objetivo
- [ ] 100€/mes en comisiones

**Marzo - Abril 2027**
Publicaciones: 16 artículos/mes (4/semana)
Nuevas categorías:
- Iluminación LED para escritorio
- Hubs y docks USB-C
- Soportes de monitor
- Sillas ergonómicas
Hitos:
- [ ] 5.000 visitas/mes objetivo
- [ ] 200€/mes en comisiones
- [ ] Newsletter activa con suscriptores

**Mayo - Junio 2027**
Publicaciones: 16 artículos/mes
Hitos:
- [ ] 120+ artículos publicados
- [ ] Presencia activa en redes sociales
- [ ] Primeras colaboraciones con marcas

---

### FASE 3 — Tecnología cotidiana (2027 Q3-Q4)

**Julio - Septiembre 2027**
Publicaciones: 20 artículos/mes (5/semana)
Nuevas categorías:
- Smartphones para productividad
- Tablets e iPads para trabajo
- Smart home aplicado al trabajo
- Comparativas entre ecosistemas
Hitos:
- [ ] 15.000 visitas/mes objetivo
- [ ] 500€/mes en comisiones
- [ ] Canal de YouTube con Fitz lanzado
- [ ] Múltiples programas de afiliados

**Octubre - Diciembre 2027**
Publicaciones: 20 artículos/mes
Hitos:
- [ ] 200+ artículos publicados
- [ ] YouTube consolidado
- [ ] 1.000€/mes en ingresos totales

---

### FASE 4 — Web de referencia (2028+)

Objetivos:
- [ ] 50.000+ visitas/mes
- [ ] 2.000€+/mes en ingresos
- [ ] Newsletter 10.000+ suscriptores
- [ ] Referencia tecnológica en España
- [ ] Afiliados + publicidad + patrocinios
- [ ] Comparador de precios propio

---

### Próximas acciones inmediatas
- [ ] Sustituir las 2 imágenes placeholder (provisionales, no son fotos reales del producto) por imagen real cuando exista: `airra-labs-rotary-mouse-analisis` (23/07, icono genérico de ratón) y `asus-portatiles-trabajo-exigente-2026` (26/07, ilustración genérica de 5 portátiles) — ver detalle en "Estado del calendario de publicaciones". `razer-seiren-v3-pro-analisis` ya resuelto con imagen oficial real (descargada directamente de Razer, 2026-06-21)
- [ ] Dar de alta los secrets `PINTEREST_ACCESS_TOKEN` y `PINTEREST_BOARD_ID` en GitHub cuando exista cuenta de Pinterest, y cambiar `PINTEREST_ENABLED = true` en `fitzdesk-monitor/socialPublisher.js`
- [ ] Lanzar prompt de búsqueda de productos cuando queden menos de 6 borradores
- [ ] Solicitar alta en Awin en Julio 2026 cuando haya 30+ artículos publicados
- [x] Configurar Google Search Console — propiedad fitzdesk.com verificada por DNS (TXT record, 2026-06-12); sitemap enviado, pendiente confirmación de indexación por parte de Google (hasta 24h)
- [ ] Registrar @fitzdesk en redes sociales

## Estado de borradores
- Última revisión: 2026-06-21
- Última ejecución de completar-borradores: 2026-06-21
- Borradores descartados: 0 en esta pasada
- Borradores completados y con fecha en el calendario: 18 (7 ya estaban calendarizados + 11 huérfanos incorporados hoy, ver "Estado del calendario de publicaciones")
- Lanzamientos Computex pendientes de disponibilidad: borrador-adata-urban-tapsafe (sin tocar, según instrucción — esperando disponibilidad real del producto)
- **Limpieza 2026-06-21 — duplicados obsoletos en develop**: `borrador-hp-probook-455-g10-analisis.md` y `borrador-samsung-s27a600-analisis.md` seguían en develop con el nombre antiguo pese a estar ya publicados en `main` (el workflow de publicación nunca sincroniza el cambio de vuelta a develop). Eliminados de develop — el contenido publicado vive en `main`, no hace falta duplicarlo. También se quitó `borrador: true` de `mejor-raton-teletrabajo-presupuesto-2026.md` en develop, que llevaba ese campo desincronizado pese a estar publicado sin él en `main`
- Dos ajustes de longitud en esta pasada: `dolor-muneca-teletrabajo-perifericos-ergonomicos` recortado de 1511 a 1395 palabras (superaba el máximo de guia); `logitech-mobi-fold-analisis` ampliado de 894 a 937 palabras (por debajo del mínimo de analisis)
- Bugs corregidos en esta revisión (2026-06-18):
  - revisar-borradores.md exigía incorrectamente un bloque "Aviso de afiliado" en el cuerpo de analisis/comparativa — el aviso real se inserta automáticamente desde Footer.astro (site-wide). Corregido: ahora el agente marca como problema si el bloque SÍ aparece en el cuerpo (sobra), no si falta
  - 4 borradores (aoc-q27p3cv, cherry-kc-6000-slim, trust-tk-350-silent, jabra-evolve2-30-se) tenían el campo `imagen` con el prefijo "borrador-" mezclado, inconsistente con el slug — corregido a `/images/articulos/[slug].webp`
  - 2 títulos superaban 70 caracteres (jabra-evolve2-30-se, samsung-s27a600) — recortados sin perder el producto
  - 2 borradores (corsair-clipper-pro-mini-60, intel-wildcat-lake) tenían un comentario HTML de plantilla obsoleto ("BORRADOR AUTOMÁTICO — Pendiente: ...") con checklist ya resuelto — eliminado
  - borrador-asus-portatiles-trabajo-exigente-2026: nombre de archivo no coincidía con el slug (huérfano desde su creación) — renombrado; cuerpo recortado de 1540 a 1396 palabras (rango guia 1000-1400); título recortado de 73 a 52 caracteres
  - **borrador-razer-seiren-v3-pro fue descartado incorrectamente el 2026-06-10** ("placeholder irrecuperable" — falso: el contenido estaba completo salvo la última frase de la Conclusión, cortada a mitad, y un placeholder sin rellenar `[nombra un micrófono similar]` en una pregunta de la FAQ). Regenerado completo: Conclusión terminada, placeholder eliminado (esa pregunta de FAQ se quitó en vez de inventar una comparación sin base), formato "Perfil A/B" convertido a párrafo, criterios añadidos (setups), imagen_thumb añadido, slug añadido. 1012 palabras, dentro de rango analisis

### Rama `borradores` — triaje 2026-06-18

La rama `borradores` (donde el monitor escribe directamente vía API de GitHub) está estructuralmente desactualizada respecto a `develop` (le faltan comparar.astro, score.ts y otros cambios — no se hizo merge completo, solo se trajeron los `.md` nuevos puntualmente). Tenía 20 archivos de artículos que no existían en `develop`: 5 eran obsoletos (ya gestionados, ya publicados, o decomisionados intencionadamente) y 14 eran borradores genuinamente nuevos sin triar.

De esos 14, **4 se conservaron y completaron** (traídos a `develop` con frontmatter, criterios e imagen placeholder estándar):
- `airra-labs-rotary-mouse-analisis` (ratones) — corregido un carácter chino suelto (可能) mezclado en el texto español
- `asus-rog-strix-scar-18-analisis` (portatiles) — Conclusión truncada terminada, enlace_afiliado roto corregido
- `lg-ultragear-34gx90sb-w-analisis` (monitores) — tenía una alerta interna de "POSIBLE DUPLICADO" frente a `lg-display-muestra-el-futuro-de-los-monitores-oled-gaming-con-2000-nits-5k-27-22`; verificado que son productos distintos (27" 5K vs 34" WQHD 240Hz) — no era duplicado, alerta descartada
- `logitech-mk470-analisis` (setups) — typo "esanother" corregido

**10 se descartaron** (no se incorporaron a develop):
- `corsair-shugo` (memorias RAM) y `corsair-icue-link-titan` (AIO cooler con pantalla) — componentes internos de PC, excluidos por línea editorial
- `computex-antec` — mezcla refrigeración/torres (componentes excluidos) + placeholder `[COMPLETAR]` sin rellenar
- `xbox-ally-x20` — consola de videojuegos portátil, excluida explícitamente por línea editorial
- `6tb-disco-duro-amazon` y `tarjetas-sd-8tb-sandisk` — almacenamiento que no encaja en ninguna categoría válida de FitzDesk, contenido genérico
- `corsair-nuevos-teclados` y `ducky-anne-pro` — no identifican un modelo concreto (demasiado genéricos para ser un análisis real), con placeholders sin rellenar
- `despliegue-portatiles-rtx-spark` — mal categorizado como "monitor", solapa con el lanzamiento ya publicado de Surface Laptop Ultra
- `logitech-mobi-fold` (trackpad) — duplicado exacto de un borrador ya existente y ya completado en `develop` (`logitech-mobi-fold-analisis.md`)

### Rama `borradores` — descartes 2026-06-21

2 borradores nuevos generados por el monitor desde el triaje del 18/06, descartados directamente en la rama `borradores` (eliminados con commit `375712c`, no se incorporaron a `develop`):
- `ASUS ROG Strix LC IV` — refrigeración líquida AIO con pantalla integrada, componente interno de PC fuera del enfoque de periféricos/portátiles de FitzDesk
- `ASUS ROG 20 Aniversario` — sobremesa gaming completa; doble motivo de descarte: FitzDesk no cubre sobremesas (ver `portatil-vs-sobremesa-teletrabajo-2026`) y es gaming puro sin utilidad de productividad

**Caso dudoso confirmado como correcto, sin recuperar**: "Sillas gaming vs. Sillas de oficina ergonómicas" — descartado por Capa 1 del monitor. No se recupera porque "sillas ergonómicas" no es todavía una categoría activa de FitzDesk (prevista Fase 2, Marzo-Abril 2027).

**Bug corregido en `analyzer.js`**: el segundo borrador descartado tenía `borrador: false` en el frontmatter pese a estar recién generado sin revisar. Causa: `generateDraft()` deja que la IA genere el frontmatter completo como texto libre (incluyendo el campo `borrador:`), y el código nunca lo validaba después — al contrario que `precio:` y `enlace_afiliado:`, que sí se sobrescriben siempre en `injectPcData()`. Corregido añadiendo una normalización forzada antes de `injectPcData()`: si el campo existe con cualquier valor (`true` o `false`), se fuerza a `true`; si no existe, se inserta antes del cierre del frontmatter. Mismo patrón defensivo que ya usaban `precio`/`enlace_afiliado`.

## Estado del código
- Última revisión: 2026-06-17 (6ª pasada — revisión post-sesión calidad textual y comparar.astro)
- Errores críticos pendientes: 0 | Estado: ✅ Sin errores críticos
- Advertencias: 3 — ver detalle abajo
- Advertencias detectadas 2026-06-17:
  - ScoreBox.astro:20-22 — colores hardcodeados (#16a34a, #F97316, #DC2626) duplican var(--color-success/primary/error); deberían usar scoreColor() de src/lib/score.ts
  - global.css:5 — --color-brand-dark es #EA6A00 pero CLAUDE.md documenta #EA580C; hay dos valores distintos en uso (comparar.astro usa --color-primary-dark: #EA580C)
  - index.astro:378,398 / Footer.astro:89,134,154,169,174,180 — color #9CA3AF y #6B7280/#D1D5DB en CSS de secciones oscuras; candidatos a var(--color-text-secondary/#D1D5DB)
- Correcciones aplicadas en esta pasada (8 archivos):
  - BaseLayout.astro — meta google-site-verification reemplazada por comentario HTML
  - buscar.astro — todos los colores hardcodeados → CSS vars; gradient → var(--color-background)
  - CookieBanner.astro — colores hardcodeados → CSS vars
  - about.astro / index.astro — gradients → var(--color-background)
  - analyzer.js / articleUpdater.js / guideGenerator.js / compareGenerator.js / launchGenerator.js / generateSetups.js — GROQ_API_KEY guard añadida antes de instanciar cliente
  - analisis.astro:234 — expresión sin efecto `currentSort;` eliminada
  - monitor.js:643 — doble llamada a notifyDailySummary() en modo daemon corregida
  - src/content/config.ts — campos opcionales del monitor añadidos al schema Zod (imagen_thumb, presupuesto, enlace_a, enlace_b, enlaces, keyword_principal, keywords_secundarias, fecha_actualizacion, actualizado)
- Sugerencias (1): monitor.yml no invalida caché npm entre runs del build web
- Correcciones 2026-06-12 (sesión actual): sources.js — KEYWORDS_DESCARTE usa ahora hasWordDescarte() con \b para todos los términos (antes solo ≤4 chars), evita falsos positivos como "tablet" en "tablets" o "movil" en nombres de producto tipo Logitech Mobi Fold · monitor.yml — comentario de horario corregido (8:00 CET / 9:00 CEST + nota de retrasos GitHub) · tres agentes actualizados para criterios/radar · logitech-mobi-fold-analisis.md creado
- Correcciones 2026-06-17 — completar-borradores sobre calendario:
  - 4 analisis con criterios: añadido bloque criterios: a hp-probook-455-g10, razer-pro-click, logitech-k380, hp-935-creator-wireless (valores derivados del texto, escala 1-10)
  - Longitud ajustada: hp-probook +100w, razer-pro-click +110w, hp-935-creator +175w, logitech-k380 +30w — todos en rango 900-1200
  - Lanzamientos recortados: intel-wildcat-lake (1062→730w), corsair-clipper-pro-mini-60 (1170→770w) — eliminado relleno y texto de plantilla
  - monitor-4k-vs-full-hd: sección Conclusión añadida
  - corsair-clipper-pro-mini-60: añadido imagen_thumb faltante
  - completar-borradores.md: corregida numeración invertida (criterios era paso 9 antes que aviso paso 8); corregido bug imagen_thumb (está en schema Zod, no eliminar)
- Correcciones 2026-06-13 — revisar-calidad-textual (primera auditoría):
  - Automáticas (6 en 4 archivos): "multiple pantallas"→"múltiples", "teclas mécanicas"×3, emoji corrupto lg-gram-14, "laptops"→"portátiles" en index.astro
  - Estructura (3 artículos): keychron-k2-v2 — H2 Fitz recomienda añadido + Veredicto→Conclusión; lg-27un880 — contenido de plantilla en Fitz reemplazado por voz real; mejor-monitor-guia — sección Conclusión añadida
  - Afirmaciones absolutas (4 artículos): logitech-mx-master-3s, logitech-mx-anywhere-3s, keychron-v1, lg-gram-14 — "el mejor/único/sin rival/definitivo" → formulaciones no absolutas; secciones Fitz reescritas con voz propia
  - Agente revisar-calidad-textual.md creado en .claude/agents/
- Resueltas el 2026-06-12: scoreColor() extraída a src/lib/score.ts (era triplicada) · PlaceholderImage usa vars CSS · imageCollector usa logWarn · dominio fitzdesk.com confirmado · gap visual home corregido · Search Console verificada por DNS · sitemap automático activado (@astrojs/sitemap@3.1.6, bajado desde 3.7.3 que requiere Astro 5) · sitemaps manuales de public/ eliminados · URL eliminada (raton-ergonomico-vs-estandar-teletrabajo) ya no aparece en el sitemap
- Añadidos el 2026-06-11/12 (no forman parte de la revisión de código):
  - comparar.astro — nueva página `/comparar` con radar Chart.js, selección de productos, tabla comparativa y URL compartible; CSS con `is:global` (todos los elementos son JS-dinámicos); botones afiliado solo si hay `enlace_afiliado`; `--color-compare-b: #3B82F6` añadida a `:root`
  - config.ts — `criterios: z.record(z.number()).optional()` añadido al schema Zod
  - 14 artículos de análisis — bloque `criterios:` con 5 valores reales por categoría (ratones: ergonomia/precision/autonomia/conectividad/calidad_precio · teclados: tacto/ruido/conectividad/durabilidad/calidad_precio · monitores: calidad_imagen/ergonomia_soporte/conectividad/cuidado_ocular/calidad_precio · portátiles: rendimiento/bateria/pantalla/teclado_trackpad/calidad_precio)

## Estado de precios
- Última revisión de precios: 2026-06-17
- Artículos con precio desactualizado: 1 (lg-27un880 — enlace_afiliado apunta a URL raíz sin producto)
- Artículos pendientes de revisión (>30 días): 13 (logitech-mx-master-3s, logitech-lift-vertical, logitech-mx-anywhere-3s, lg-27un880, keychron-k8-pro, keychron-k2-v2, keychron-v1, benq-gw2780, dell-s2722qc, logitech-mx-keys-s-analisis, asus-vivobook-15-oled-analisis, lenovo-thinkpad-e14-gen6-analisis, lg-gram-14-2025-analisis)
- Notas: lg-27up850n-analisis (28 días) y mejor-setup-teletrabajo-500-euros-2026 (19 días) ya no superan los 30 días desde la última revisión manual del 2026-06-12; lg-27un880 tiene enlace_afiliado incompleto (solo dominio raíz)

## Estado del calendario de publicaciones
- Ritmo: Domingo c/2 semanas (guía/comparativa) · Martes y jueves (análisis/lanzamiento, 9:00–14:00 — hora exacta no garantizada por retrasos de cola en GitHub Actions, ver nota 2026-06-18)
- Calendario generado: 2026-06-21
- **Corregido 2026-06-21: error de día de la semana.** Una sesión anterior calculó mal el día de semana de fechas de julio (asumió 10/07=jueves y 13/07=domingo cuando en realidad 10/07=viernes y 13/07=lunes). Verificado con cálculo de fecha real (no a mano): el jueves real sin cubrir era el **09/07** y el domingo quincenal real (14 días tras el 28/06) es el **12/07**. Todas las fechas de julio/agosto de esta entrada están verificadas con `Date.UTC()`, no contadas a mano
- Calendario completo hasta 2026-08-11 (22 publicaciones totales, 3 ya publicadas: mejor-raton 14/06, samsung 16/06, hp-probook 18/06)
- Próxima publicación pendiente: 2026-07-09 — aoc-q27p3cv-analisis (analisis, monitores, jueves)
- Huérfanos incorporados al calendario en esta sesión (11): dolor-muneca-teletrabajo (12/07, domingo), asus-rog-strix-scar-18 (14/07), logitech-mobi-fold (16/07), lg-ultragear-34gx90sb-w (21/07), airra-labs-rotary-mouse (23/07), asus-portatiles-trabajo-exigente-2026 (26/07, domingo), jabra-evolve2-30-se (28/07), cherry-kc-6000-slim (30/07), logitech-mk470 (04/08), trust-tk-350-silent (06/08), razer-seiren-v3-pro (11/08)
- Guía nueva creada y calendarizada el mismo día: `doble-monitor-teletrabajo-merece-la-pena` (09/08, domingo) — cubre el hueco quincenal de guías que ya no tenía ningún borrador disponible (los 3 existentes ya estaban todos asignados). 1042 palabras, enlaza los 4 análisis de monitores ya publicados (LG 27UP850N-W, Dell S2722QC, LG 27UN880, BenQ GW2780)
- **Corrección sobre el sistema de imágenes de guías**: se asumió inicialmente que las guías usaban ilustración cartoon vía DALL-E (existe `dallePrompt` en `guides.js`), pero verificado contra las imágenes reales publicadas: el sistema real en producción es `generateGuideImages.js` (Sharp/canvas), que compone fotos reales de producto ya analizadas — el `dallePrompt` nunca se usó de hecho. Se añadió un 4º layout `dual-monitor` en `composer.js` (dos monitores lado a lado con símbolo "+" en vez de "VS", ya que es un setup conjunto, no una comparativa de rivales) y se generó la imagen real con fotos de Dell S2722QC + LG 27UN880. `doble-monitor-teletrabajo-merece-la-pena` ya tiene imagen y thumb en disco
- Categorías alternadas para no repetir dos seguidas: monitores→portátiles→ratones→monitores→ratones→guía→setups→teclados→guía→setups→teclados→setups→teclados→guía→setups
- **imageCollector.js ejecutado 2026-06-21 sobre los 12 huérfanos pendientes**: 9/12 obtuvieron imagen real válida (aoc-q27p3cv, dolor-muneca, asus-rog-strix-scar-18, logitech-mobi-fold, lg-ultragear-34gx90sb-w, jabra-evolve2-30-se, cherry-kc-6000-slim, logitech-mk470, trust-tk-350-silent — vía DuckDuckGo o web de fabricante). 3/12 fallaron y necesitan resolución manual (DALL-E o búsqueda manual):
  - `airra-labs-rotary-mouse-analisis` — la búsqueda devolvió una miniatura de YouTube sobre "cómo invertir la dirección de la rueda del ratón", sin relación con el producto. Eliminada. **Placeholder generado 2026-06-22** con canvas/Sharp (icono genérico de ratón en gris claro sobre fondo #F9FAFB, texto "Imagen provisional") — sustituir por foto real cuando exista
  - `asus-portatiles-trabajo-exigente-2026` (guía, 5 portátiles distintos) — HTTP 403 de DuckDuckGo, sin imagen. **Placeholder generado 2026-06-22** con el estilo completo de guía (logo, sello Fitz, banda naranja inferior, "mesa de madera" con 5 portátiles esquemáticos) indicando que necesita generación manual con DALL-E — sustituir cuando exista
  - `razer-seiren-v3-pro-analisis` — la imagen encontrada era del modelo "Seiren V3 CHROMA" (variante RGB gaming), no "Pro" (USB/XLR profesional que describe el artículo). Eliminada. **Reintentado 2026-06-21 con `--query` manual** (parámetro nuevo añadido a `imageCollector.js`, antes no existía): dos intentos con queries explícitos mencionando "Pro", "USB XLR" y "no RGB" — ambos devolvieron igualmente el Chroma (confirmado por texto literal "RAZER SEIREN V3 CHROMA" visible en una de las capturas). El índice de DuckDuckGo está dominado por el Chroma para esta búsqueda independientemente del texto usado. **✅ RESUELTO el mismo día**: descargada la imagen oficial directamente del CDN de Razer (medias-p1.phoenix.razer.com, `seiren-v3-pro-black-500x500.png`) y procesada con Sharp (fondo #F9FAFB, 1200x675 + thumb 400x225) replicando el método de `imageCollector.js`. Ya en disco
  - Nota: 2 de los 9 obtenidos (`asus-rog-strix-scar-18`, `cherry-kc-6000-slim`) son fotos genéricas de la marca/línea de producto, no necesariamente la foto exacta del modelo — aceptable pero no 100% verificado
- `doble-monitor-teletrabajo-merece-la-pena` ya tenía imagen (generada con el compositor, ver nota arriba) — sin pendiente
- adata-urban-tapsafe: sigue sin tocar, esperando disponibilidad real del producto (no incorporado al calendario)
- Workflow automático: `.github/workflows/publicar-automatico.yml` — Dom/Mar/Jue, programado a las 5:35 UTC (7:35 CEST / 6:35 CET); lee calendario y publica solo si hay entrada para hoy; notifica a Discord en caso de error
- Ventana de publicación ajustada a 9:00-14:00 el 2026-06-18 (antes 9:00-11:00): los eventos `schedule` de GitHub Actions reciben prioridad de cola más baja que `push`/`workflow_dispatch`, y este repo viene observando retrasos sistemáticos de 4-7h respecto a la hora programada. `auto-publisher.js` no depende de la hora, solo de la fecha
- PENDIENTE: notifier.js no tiene lógica para disparar el recordatorio de domingo el sábado anterior a las 20:00 — checkPublicationReminders() solo actúa los días 2, 3 y 4 (mar, mié, jue). Para guías dominicales el recordatorio del sábado debe implementarse manualmente o extender la función.

### Bug crítico encontrado, corregido y RESUELTO 2026-06-21: el deploy no se disparaba de forma fiable tras publicación automática

`publicar-automatico.yml` publica haciendo `git push origin main` con el `GITHUB_TOKEN` automático del propio workflow. GitHub Actions tiene una restricción de seguridad: los pushes hechos con ese token pueden no disparar otros workflows con trigger `on: push` (anti-bucle-infinito). Como `deploy.yml` solo escuchaba `push`, esto dejaba publicaciones automáticas en el código fuente de `main` sin desplegarse al sitio real.

**Investigación más a fondo (mismo día):** de las 3 publicaciones hechas por el bot (`ca531f8` mejor-ratón 14/06, `8194316` Samsung 16/06, `e566697` HP ProBook 18/06), ninguna disparó su propio deploy dedicado — pero mejor-ratón y Samsung quedaron "rescatados" por deploys posteriores disparados por otros pushes humanos cercanos en el tiempo (cada deploy reconstruye el sitio completo desde el estado actual de `main`, no solo el diff). HP ProBook fue el único que no tuvo esa suerte: no hubo ninguna otra actividad en `main` entre el 18/06 y el 21/06, así que quedó invisible los 3 días completos.

**Fix aplicado** en `.github/workflows/deploy.yml`: añadido trigger `workflow_run` que escucha la finalización de "Publicar automático FitzDesk", independientemente del token que hizo el push. Incluye `ref: main` explícito en el checkout.

**Fix relacionado** en `.github/workflows/publicar-automatico.yml`: nuevo paso "Sincronizar develop con el artículo publicado" justo después de publicar en `main`. Sin esto, `develop` se quedaba para siempre con el borrador antiguo (`borrador: true`) tras cada publicación automática — invisible también en pruebas locales sobre `develop` y desincronizado del estado real. El paso cambia a `develop`, sustituye el borrador antiguo por el contenido ya publicado (sin `borrador: true`), copia la imagen si existe, y hace commit + push.

**✅ RESUELTO — ambos fixes ya están en `main`** (cherry-pick puntual, commit `ef6be93`, solo esos dos archivos de workflow — sin tocar contenido editorial ni el calendario). El push del cherry-pick disparó el deploy de inmediato (vía el trigger `push` ya existente), confirmado con éxito (run `27900752065`). Verificado en producción tras el deploy:
- ✅ `hp-probook-455-g10-analisis` — visible (HTTP 200, título correcto)
- ✅ `mejor-raton-teletrabajo-presupuesto-2026` — visible
- ✅ `samsung-s27a600-analisis` — visible

A partir de ahora, cualquier publicación automática futura disparará el deploy de forma fiable (vía `workflow_run`) y sincronizará `develop` automáticamente.

## Lanzamientos en seguimiento
- LG OLED 27" 5K 2000 nits — próxima revisión: 2026-07-09 — slug: lg-display-muestra-el-futuro-de-los-monitores-oled-gaming-con-2000-nits-5k-27-22
- Surface Laptop Ultra RTX Spark — próxima revisión: 2026-07-09 — slug: el-nuevo-surface-ultra-con-el-rtx-spark-de-nvidia-cuenta-con-un-misterioso-puert
- Cuando lleguen al mercado: ejecutar agente actualizar-lanzamiento con el slug correspondiente

## Últimas publicaciones
- Última publicación: 2026-06-18 — "HP ProBook 455 G10: AMD Ryzen empresarial sin precio empresarial" (analisis) — publicado automáticamente vía workflow el 18/06, pero invisible en el sitio real hasta el 21/06 por el bug de deploy (ver sección de bugs); confirmado visible en producción tras el fix
- 2026-06-16 — "Samsung S27A600NAU: QHD de 27\" sin USB-C pero sin compromisos en imagen" (analisis) — publicado automáticamente vía workflow (no manual, corregido este dato: los 3 artículos del bot tuvieron el mismo problema de deploy, ver bug arriba)
- 2026-06-14 — "mejor-raton-teletrabajo-presupuesto-2026" (guia) — publicado automáticamente vía workflow
- 2026-06-11 — "Surface Laptop Ultra: el portátil con NVIDIA RTX Spark que redefine Windows" (lanzamiento)

---

## Monitor — GitHub Actions

- Migrado de Railway a GitHub Actions el 2026-06-10
- Se ejecuta diariamente — cron: `13 6 * * *` (7:13 CET en invierno / 8:13 CEST en verano), minuto descuadrado para evitar la congestión de los cron en punto; las notificaciones de Discord pueden llegar hasta varias horas después por colas de GitHub Actions en plan gratuito
- Para ejecutar manualmente: GitHub → Actions → FitzDesk Monitor → Run workflow
- Workflow: `.github/workflows/monitor.yml`
- Secrets necesarios en el repo: `GROQ_API_KEY`, `DISCORD_WEBHOOK_URL`
- `GITHUB_TOKEN` y `GITHUB_REPO`/`GITHUB_OWNER` se inyectan automáticamente

## Publicación automática — GitHub Actions

- Workflow: `.github/workflows/publicar-automatico.yml`
- Se ejecuta Dom/Mar/Jue, programado a las 5:35 UTC (7:35 CEST / 6:35 CET) — cron: `35 5 * * 0,2,4` — minuto descuadrado para evitar la congestión del minuto en punto; aun así, los eventos `schedule` quedan en cola de baja prioridad en GitHub Actions y pueden tardar varias horas en ejecutarse (ver nota en "Estado del calendario de publicaciones")
- Lee `fitzdesk-monitor/data/calendario-publicaciones.json`, busca entrada para hoy
- Si hay publicación: obtiene el borrador desde `develop`, elimina `borrador: true`, renombra el archivo y hace push a `main` (dispara deploy automáticamente)
- Si falta imagen o frontmatter inválido: notifica a Discord y no publica
- Para probar: GitHub → Actions → Publicar automático FitzDesk → Run workflow → `fecha_override: YYYY-MM-DD`
- Script helper: `fitzdesk-monitor/auto-publisher.js` (modos `--check` y `--process`)
- Tras publicar en `main`, sincronizar `develop` y antes de notificar a Discord: ejecuta `socialPublisher.js` (ver sección siguiente)

## Publicación en redes sociales — Instagram y Facebook (2026-06-22)

- Script: `fitzdesk-monitor/socialPublisher.js` — `node socialPublisher.js --slug [slug]` (real) / `--test --slug [slug]` (no publica nada, muestra captions + comprueba secrets sin revelarlos)
- Integrado como step "Publicar en redes sociales" en `publicar-automatico.yml`, justo después de sincronizar `develop` y antes de las notificaciones de Discord — solo corre si la publicación a `main` fue exitosa (`if: ... && success()`), timeout de 2 minutos
- **Instagram**: flujo de 2 pasos vía Graph API (`POST /{ig-user-id}/media` para crear el contenedor, luego `POST /{ig-user-id}/media_publish`); el `ig-user-id` se obtiene en tiempo real con `GET /me?fields=id,name` usando `INSTAGRAM_ACCESS_TOKEN`
- **Facebook**: `POST /{FACEBOOK_PAGE_ID}/photos` con la imagen y el caption
- **Pinterest**: preparado en el código (`publishPinterest()`, `buildPinterestDescription()`) pero **desactivado** — `const PINTEREST_ENABLED = false` al inicio del archivo. Activar cambiando ese valor a `true` cuando se den de alta `PINTEREST_ACCESS_TOKEN` y `PINTEREST_BOARD_ID` en los secrets del repo
- Manejo de errores: si Instagram falla, se loguea y continúa con Facebook; si Facebook falla, se loguea igual; si **ambas** fallan, se notifica a Discord vía `DISCORD_WEBHOOK_URL` con el detalle de ambos errores — nunca falla en silencio
- Lee `title`, `descripcion` y `categoria` directamente del frontmatter del artículo ya publicado (no requiere pasar esos datos por el workflow) — solo necesita el slug
- Secrets nuevos usados: `INSTAGRAM_ACCESS_TOKEN`, `INSTAGRAM_APP_ID`, `INSTAGRAM_APP_SECRET`, `FACEBOOK_PAGE_ACCESS_TOKEN`, `FACEBOOK_PAGE_ID` (ya disponibles en GitHub); `PINTEREST_ACCESS_TOKEN`/`PINTEREST_BOARD_ID` referenciados en el workflow pero todavía no creados como secrets (esperado, generan aviso benigno del linter del IDE)

## Archivos clave del monitor

| Archivo | Función |
|---|---|
| `monitor.js` | Orquesta todo el proceso |
| `analyzer.js` | Genera borradores con Groq |
| `sources.js` | Fuentes RSS + filtros de relevancia (3 capas) |
| `cache.js` | Anti-duplicados con persistencia en data/cache.json |
| `notifier.js` | Notificaciones Discord con embeds e imagen |
| `imageCollector.js` | Busca y descarga imágenes de productos |
| `articleUpdater.js` | Actualiza precio, descatalogados, nuevos modelos |
| `auto-publisher.js` | Valida y procesa borradores para publicación automática |
| `socialPublisher.js` | Publica en Instagram y Facebook (Pinterest preparado, desactivado) |

---

## Páginas de la web

| Ruta | Archivo |
|---|---|
| `/` | `src/pages/index.astro` |
| `/analisis` | `src/pages/analisis.astro` |
| `/buscar` | `src/pages/buscar.astro` |
| `/about` | `src/pages/about.astro` |
| `/contacto` | `src/pages/contacto.astro` |
| `/privacidad` | `src/pages/privacidad.astro` |
| `/articulo/[slug]` | `src/pages/articulo/[slug].astro` |
| `/categoria/[slug]` | `src/pages/categoria/[slug].astro` |
| `/comparar` | `src/pages/comparar.astro` |
