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
5. **Sin gaming**: FitzDesk es teletrabajo y productividad, no gaming
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
- Última revisión: 2026-06-09 (3ª pasada — cadena completa de agentes)
- Última ejecución de completar-borradores: 2026-06-09
- Borradores descartados (total): 4 (xbox-ally, asus-rog-strix, corsair-anade-icue, antec-computex)
- Borradores completados: 1 (Surface Laptop Ultra — tipo cambiado a lanzamiento)
- Borradores listos para revisión humana: 9 (8 tipo: analisis + 1 lanzamiento Surface Ultra) · 1 lanzamiento pendiente adicional (LG OLED)
- Imágenes placeholder: 6/9 (Surface Ultra ya tiene imagen WebP real; resoluble con imageCollector al publicar el resto)

## Estado del código
- Última revisión: 2026-06-09 (2ª pasada — confirma 0 nuevos errores tras cambios de lanzamiento)
- Errores críticos pendientes: 0 | Estado: ✅ Sin errores críticos
- Advertencias (6): analyzer.js prompt incluye aviso afiliado obsoleto · buscar.astro colores hardcodeados (#F97316, #EA580C, inline styles) · scoreColor() duplicada en 3 archivos · CookieBanner.astro usa hex en lugar de var CSS · about.astro gradient hardcodeado
- Sugerencias (4): notifier.js entrada 'auriculares' obsoleta · fitzQuote en schema · validación GROQ_API_KEY en CLIs · variables badge-guide ausentes

## Estado de precios
- Última revisión de precios: 2026-06-09
- Artículos con precio desactualizado: 0
- Artículos pendientes de revisión (>30 días): 5 (keychron-k8-pro, lg-27un880, logitech-lift-vertical, logitech-mx-anywhere-3s, logitech-mx-master-3s)

## Estado del calendario de publicaciones
- Calendario generado: 2026-06-09
- Próxima publicación: 2026-06-11 — Surface Laptop Ultra RTX Spark (portatiles) — listo para publicar
- Semanas de contenido disponibles: 4
- Borradores listos para publicar: 7 analisis + 1 lanzamiento preparado (Surface Ultra)
- Borradores incompletos (no planificados): 0
- Sin programar: ninguno (todos planificados hasta 2026-07-07)

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
