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

- **Web**: Astro v4, CSS vanilla, JS vanilla, Fuse.js (buscador)
- **Monitor**: Node.js, Groq (llama-3.3-70b-versatile), Discord webhooks
- **Deploy web**: GitHub Actions → GitHub Pages
- **Deploy monitor**: GitHub Actions (diario 8:00 ES) — migrado desde Railway el 2026-06-10
- **URL**: https://jaimemarlop01.github.io/FitzDesk/

---

## Identidad visual

```css
--color-primary: #F97316      /* naranja FitzDesk — usar siempre */
--color-primary-dark: #EA580C /* hover */
--color-text: #1F2937
--color-text-secondary: #6B7280
--color-background: #F9FAFB
--color-border: #E5E7EB
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
npm run dev                    # localhost:4321/FitzDesk/
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
- [ ] Gap visual excesivo en la home entre categorías y últimos análisis
- [ ] Banner de cookies (obligatorio RGPD España)

## Estado de borradores
- Última revisión: 2026-06-10 (revisión completa — 11 borradores analizados)
- Última ejecución de completar-borradores: 2026-06-10
- Borradores descartados (total acumulado): 8 (xbox-ally, asus-rog-strix, corsair-anade-icue, antec-computex + 6-tb-oferta-amazon, corsair-renueva-catalogo, nvidia-rtx-spark, borrador-surface-ultra-duplicado) — asus-equipos-5-portatiles recuperado y reescrito tras cambio de política editorial
- Borradores completados en esta pasada: 6 (3 guias + 3 lanzamientos)
- Borradores listos para revisión humana: 12 (8 analisis publicables + 3 guias completadas + 3 lanzamientos Computex)
- Guias completadas (listas para publicar): dolor-muneca-teletrabajo-perifericos-ergonomicos, monitor-4k-vs-full-hd-teletrabajo-2026, mejor-raton-teletrabajo-presupuesto-2026 — imágenes pendientes (ejecutar imageCollector al publicar)
- Lanzamientos Computex (tipo cambiado a lanzamiento): borrador-adata-urban-tapsafe, borrador-corsair-clipper-pro-mini-60, borrador-intel-wildcat-lake — pendientes de disponibilidad comercial
- Motivos de descarte en esta pasada: 6-tb (almacenamiento masivo no focal para teletrabajo + contenido especulativo), corsair-renueva (placeholder [Insertar modelo competidor] irrecuperable), nvidia-rtx-spark (incoherencia título/cuerpo monitor vs portátiles + placeholders), asus-equipos (incluye ROG Strix G18 y TUF Gaming A16 — violación norma Sin gaming), borrador-surface-ultra (duplicado del artículo ya publicado)

## Estado del código
- Última revisión: 2026-06-10 (3ª pasada completa — web + monitor + workflows)
- Errores críticos pendientes: 0 | Estado: ✅ Sin errores críticos
- Advertencias (8):
  - BaseLayout.astro:37 — google-site-verification con valor PENDIENTE_DE_CONFIGURAR (publicado en producción)
  - astro.config.mjs:7 — site='https://fitzdesk.com' pero deploy real es github.io (desalineado hasta tener dominio propio)
  - analyzer.js:5 — Groq client instanciado en top-level sin validar GROQ_API_KEY; falla con undefined si no está en env
  - articleUpdater.js:20 — mismo problema: Groq client top-level sin guardia
  - analisis.astro:234 — variable currentSort referenciada sin efecto en setView() (expresión sin usar)
  - buscar.astro — colores hardcodeados (#F97316, #EA580C, #64748b, #1F2937, #6B7280…) en estilos y en lógica JS
  - CookieBanner.astro — colores hardcodeados (#1F2937, #F97316, #EA580C, #D1D5DB) en lugar de var CSS
  - about.astro / index.astro / buscar.astro — gradients hardcodeados (#fff7ed, #fef3c7, #fdf2f8) en lugar de var CSS
- Sugerencias (4): scoreColor() duplicada en ArticleCard + buscar.astro + [slug].astro · PlaceholderImage hardcodea #F97316/#FFF7ED · imageCollector console.error debería ser logWarn · CategoryBadge colores hardcodeados por diseño (aceptable)
- Sugerencias (4): notifier.js entrada 'auriculares' obsoleta · fitzQuote en schema · validación GROQ_API_KEY en CLIs · variables badge-guide ausentes

## Estado de precios
- Última revisión de precios: 2026-06-10
- Artículos con precio desactualizado: 0
- Artículos pendientes de revisión (>30 días): 6 (logitech-mx-master-3s, logitech-lift-vertical, logitech-mx-anywhere-3s, lg-27un880, keychron-k8-pro, keychron-v1)

## Estado del calendario de publicaciones
- Ritmo: Domingo c/2 semanas (guía/comparativa) · Martes y jueves (análisis/lanzamiento, 9:00–11:00)
- Calendario generado: 2026-06-10
- Próxima publicación: 2026-06-11 — Surface Laptop Ultra RTX Spark (portatiles) — ejecutar publicar-borrador entre las 9:00 y las 11:00
- Semanas de contenido disponibles: 4 (Sem1: Surface Ultra + guía ratón · Sem2: Corsair Clipper + Intel Wildcat · Sem3: ADATA TapSafe + guía monitores · Sem5: guía dolor muñeca)
- Borradores listos para publicar: 3 lanzamientos (Corsair, Intel, ADATA) + 1 pendiente mañana (Surface Ultra) + 3 guías
- Borradores incompletos (no planificados): 0
- Sin programar: dolor-muneca-teletrabajo-perifericos-ergonomicos (semana 5, 2026-07-13 — fuera del horizonte de 4 semanas)
- Imágenes pendientes (3 guías): ejecutar imageCollector con cada slug al publicar

## Lanzamientos en seguimiento
- LG OLED 27" 5K 2000 nits — próxima revisión: 2026-07-09 — slug: lg-display-muestra-el-futuro-de-los-monitores-oled-gaming-con-2000-nits-5k-27-22
- Surface Laptop Ultra RTX Spark — próxima revisión: 2026-07-09 — slug: el-nuevo-surface-ultra-con-el-rtx-spark-de-nvidia-cuenta-con-un-misterioso-puert
- Cuando lleguen al mercado: ejecutar agente actualizar-lanzamiento con el slug correspondiente

## Últimas publicaciones
- 2026-06-10 — "LG OLED 27\" 5K 2000 nits" (tipo: lanzamiento) — publicado en main
- Pendiente (2026-06-11) — "Surface Laptop Ultra: el portátil con NVIDIA RTX Spark que redefine Windows" (tipo: lanzamiento) — ejecutar publicar-borrador el jueves entre las 9:00 y las 11:00

---

## Monitor — GitHub Actions

- Migrado de Railway a GitHub Actions el 2026-06-10
- Se ejecuta diariamente a las 8:00 (UTC+1) — cron: `0 7 * * *`
- Para ejecutar manualmente: GitHub → Actions → FitzDesk Monitor → Run workflow
- Workflow: `.github/workflows/monitor.yml`
- Secrets necesarios en el repo: `GROQ_API_KEY`, `DISCORD_WEBHOOK_URL`
- `GITHUB_TOKEN` y `GITHUB_REPO`/`GITHUB_OWNER` se inyectan automáticamente

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
