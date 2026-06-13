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
- [ ] Publicar artículo del jueves esta semana
- [ ] Lanzar prompt de búsqueda de productos cuando queden menos de 6 borradores
- [ ] Solicitar alta en Awin en Julio 2026 cuando haya 30+ artículos publicados
- [x] Configurar Google Search Console — propiedad fitzdesk.com verificada por DNS (TXT record, 2026-06-12); sitemap enviado, pendiente confirmación de indexación por parte de Google (hasta 24h)
- [ ] Registrar @fitzdesk en redes sociales

## Estado de borradores
- Última revisión: 2026-06-12
- Borradores descartados (total acumulado): 8 correctos + 1 falso descarte (xbox-ally, asus-rog-strix, corsair-anade-icue, antec-computex + 6-tb-oferta-amazon, corsair-renueva-catalogo, nvidia-rtx-spark, borrador-surface-ultra-duplicado, corsair-anade-icue) · razer-seiren-v3-pro fue descarte incorrecto (micrófono para teletrabajo, regenerar)
- Borradores en calendario con imagen y fecha listos: 9 (samsung-s27a600, hp-probook-455-g10, razer-pro-click, logitech-k380, monitor-4k-vs-full-hd, intel-wildcat-lake, corsair-clipper-pro-mini-60, hp-935-creator-wireless, mejor-raton-presupuesto) — imágenes descargadas el 2026-06-11, sin pendientes
- Sin programar (fuera del horizonte de 4 semanas): logitech-mobi-fold-analisis (ratones, 2026-07-22), Cherry KC 6000 Slim (teclados), AOC Q27P3CV (monitores), Jabra Evolve2 30 SE (setups), Trust TK-350 Silent (teclados), ADATA Urban TapSafe (setups), dolor-muneca-teletrabajo-perifericos-ergonomicos (guia), asus-portatiles-trabajo-exigente-2026 (guia), Razer Seiren V3 Pro (setups — regenerar)
- Lanzamientos Computex pendientes de disponibilidad: borrador-adata-urban-tapsafe

## Estado del código
- Última revisión: 2026-06-11 (5ª pasada — correcciones de advertencias conocidas + revisión agente)
- Errores críticos pendientes: 0 | Estado: ✅ Sin errores críticos
- Advertencias: 0 — todas resueltas el 2026-06-12
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
- Última revisión de precios: 2026-06-12
- Artículos con precio desactualizado: 0
- Artículos pendientes de revisión (>30 días): 14 (logitech-mx-master-3s, logitech-lift-vertical, logitech-mx-anywhere-3s, lg-27un880, keychron-k8-pro, keychron-v1, keychron-k2-v2, benq-gw2780, dell-s2722qc, lg-27up850n-analisis, asus-vivobook-15-oled-analisis, lenovo-thinkpad-e14-gen6-analisis, lg-gram-14-2025-analisis, mejor-setup-teletrabajo-500-euros-2026)

## Estado del calendario de publicaciones
- Ritmo: Domingo c/2 semanas (guía/comparativa) · Martes y jueves (análisis/lanzamiento, 9:00–11:00)
- Calendario actualizado: 2026-06-11
- Próxima publicación: 2026-06-14 — mejor-raton-teletrabajo-presupuesto-2026 (guia, domingo) — publicación automática vía workflow
- Calendario completo hasta 2026-07-07 (9 publicaciones programadas, todas con imagen)
- Workflow automático: `.github/workflows/publicar-automatico.yml` — Dom/Mar/Jue a las 9:00 CEST, lee calendario y publica solo si hay entrada para hoy; notifica a Discord en caso de error
- Imágenes pendientes: ninguna — todas descargadas el 2026-06-11
- PENDIENTE: notifier.js no tiene lógica para disparar el recordatorio de domingo el sábado anterior a las 20:00 — checkPublicationReminders() solo actúa los días 2, 3 y 4 (mar, mié, jue). Para guías dominicales el recordatorio del sábado debe implementarse manualmente o extender la función.

## Lanzamientos en seguimiento
- LG OLED 27" 5K 2000 nits — próxima revisión: 2026-07-09 — slug: lg-display-muestra-el-futuro-de-los-monitores-oled-gaming-con-2000-nits-5k-27-22
- Surface Laptop Ultra RTX Spark — próxima revisión: 2026-07-09 — slug: el-nuevo-surface-ultra-con-el-rtx-spark-de-nvidia-cuenta-con-un-misterioso-puert
- Cuando lleguen al mercado: ejecutar agente actualizar-lanzamiento con el slug correspondiente

## Últimas publicaciones
- Última publicación: 2026-06-11 — "Surface Laptop Ultra: el portátil con NVIDIA RTX Spark que redefine Windows"
- 2026-06-10 — "LG OLED 27\" 5K 2000 nits" (tipo: lanzamiento) — publicado en main

---

## Monitor — GitHub Actions

- Migrado de Railway a GitHub Actions el 2026-06-10
- Se ejecuta diariamente — cron: `0 7 * * *` (8:00 CET en invierno / 9:00 CEST en verano); las notificaciones de Discord pueden llegar hasta las 13:00 por colas de GitHub Actions en plan gratuito
- Para ejecutar manualmente: GitHub → Actions → FitzDesk Monitor → Run workflow
- Workflow: `.github/workflows/monitor.yml`
- Secrets necesarios en el repo: `GROQ_API_KEY`, `DISCORD_WEBHOOK_URL`
- `GITHUB_TOKEN` y `GITHUB_REPO`/`GITHUB_OWNER` se inyectan automáticamente

## Publicación automática — GitHub Actions

- Workflow: `.github/workflows/publicar-automatico.yml`
- Se ejecuta Dom/Mar/Jue a las 9:00 CEST (7:00 UTC) — cron: `0 7 * * 0,2,4`
- Lee `fitzdesk-monitor/data/calendario-publicaciones.json`, busca entrada para hoy
- Si hay publicación: obtiene el borrador desde `develop`, elimina `borrador: true`, renombra el archivo y hace push a `main` (dispara deploy automáticamente)
- Si falta imagen o frontmatter inválido: notifica a Discord y no publica
- Para probar: GitHub → Actions → Publicar automático FitzDesk → Run workflow → `fecha_override: YYYY-MM-DD`
- Script helper: `fitzdesk-monitor/auto-publisher.js` (modos `--check` y `--process`)

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
