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
node socialPublisher.js --test --slug [slug]                  # modo test, no publica nada real
node socialPublisher.js --slug [slug]                         # publica en Instagram (Facebook desactivado — FACEBOOK_ENABLED = false)
node socialPublisher.js --slug [slug] --only instagram        # solo Instagram (--only facebook es no-op mientras FACEBOOK_ENABLED = false)
node socialImageGenerator.js --slug [slug]                    # genera/regenera la imagen de Facebook a mano (Sharp, añadido 2026-06-24)
node instagramImageGenerator.js --slug [slug]                 # genera/regenera el carrusel de 4 slides de Instagram a mano (Puppeteer, añadido 2026-06-24)
node socialReviewer.js --slug [slug]                          # revisa imágenes y textos sin publicar nada (añadido 2026-06-24)
```

---

## Variables de entorno del monitor

```
GROQ_API_KEY
DISCORD_WEBHOOK_URL
ASTRO_CONTENT_PATH=C:\xampp\htdocs\FitzDesk\src\content\articulos
GEMINI_API_KEY (opcional)
GOOGLE_SERVICE_ACCOUNT_KEY (opcional, para indexingChecker.js — JSON de cuenta de servicio en base64)
SEARCH_CONSOLE_SITE_URL (opcional, default "sc-domain:fitzdesk.com")
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

**IMPORTANTE — alcance real (corregido 2026-06-25): FitzDesk no tiene actualmente ninguna relación de afiliados activa con nadie**, ni con PcComponentes ni con ninguna otra tienda — no es solo que falte la aprobación de Awin, es que no existe ningún acuerdo comercial en absoluto. Se descubrió que `src/pages/privacidad.astro` y `src/pages/about.astro` afirmaban con detalle (nombrando incluso una plataforma de afiliados concreta, Tradedoubler, y describiendo cookies de seguimiento que nunca se instalan) una relación activa que era falsa — eliminado de ambas páginas. El aviso genérico "podemos recibir una comisión" que insertan los generadores de contenido en cada artículo (`analyzer.js`, `compareGenerator.js`, `guideGenerator.js`, `generateSetups.js`, `offerGenerator.js`) se dejó sin tocar en esa pasada, a petición explícita del usuario (alcance limitado a esas 2 páginas). No asumir ni escribir nunca contenido nuevo que dé por hecha una relación de afiliados activa, salvo que el usuario confirme explícitamente que ha cambiado.

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
- [x] ✅ Merge completo `develop` → `main` (2026-06-24, commit `a9b108a`) — todo el sistema de imágenes/captions/revisión de redes (`socialImageGenerator.js`, `instagramImageGenerator.js`, `socialContent.js`, `socialReviewer.js`, dependencia `puppeteer`) ya está en producción
- [x] ✅ Conseguir imagen oficial real de `airra-labs-rotary-mouse-analisis` — **RESUELTO 2026-07-07**: el usuario proporcionó `16x9_2133x1200_highres-rotary-mouse.webp` (imagen oficial del producto en 16:9). Procesada con Sharp (1200x675 quality:85 + 400x225 quality:80, WebP). Ya en disco. Artículo calendarizado para el 23/07 (tras adelantarse del 11/08). Precio: ~126€ Kickstarter con aviso editorial. Publica automáticamente.
- [ ] Activar Pinterest cuando se apruebe el scope `pins:write` en la API de Pinterest (aparcado el 2026-06-23 — se activó brevemente el mismo día y se revirtió a `PINTEREST_ENABLED = false` por falta de esa aprobación). Cuando se apruebe: cambiar `PINTEREST_ENABLED = true` en `socialPublisher.js` y confirmar que `PINTEREST_ACCESS_TOKEN`/`PINTEREST_BOARD_ID` existen como secrets reales en GitHub (a fecha de hoy no hay confirmación de que existan)
- [ ] Lanzar prompt de búsqueda de productos cuando queden menos de 6 borradores
- [ ] Solicitar alta en Awin en Julio 2026 cuando haya 30+ artículos publicados — **34 artículos publicados (2026-07-19), solicitud pendiente de enviar**
- [x] Configurar Google Search Console — propiedad fitzdesk.com verificada por DNS (TXT record, 2026-06-12); sitemap enviado, pendiente confirmación de indexación por parte de Google (hasta 24h)
- [ ] Registrar @fitzdesk en redes sociales
- [ ] Añadir secret `GOOGLE_SERVICE_ACCOUNT_KEY` en GitHub → repo → Settings → Secrets and variables → Actions (valor: JSON de `fitzdesk-monitor/google-credentials.json` en base64 — `[Convert]::ToBase64String([IO.File]::ReadAllBytes('google-credentials.json'))` en PowerShell) para que el step "Reenviar sitemap a Google Search Console" en `publicar-automatico.yml` funcione
- [x] ✅ Obtener foto real de producto para 5 borradores con `imagen_placeholder: true` — **RESUELTO 2026-07-19**: `logitech-mx-vertical-analisis`, `mejores-soportes-brazos-monitor-teletrabajo-2026`, `asus-proart-pa278cv-analisis`, `logitech-brio-505-analisis`, `microsoft-bluetooth-ergonomic-mouse-analisis` — imágenes reales obtenidas con `imageCollector.js --query` (DuckDuckGo), `imagen_placeholder: true` eliminado de todos los frontmatters. Los 5 artículos ya se publicarán automáticamente en sus fechas (20/08–22/09)
- [ ] **Publicar carruseles retroactivos en Instagram**: 24 artículos (mayo-junio 2026, anteriores al pipeline) tienen carruseles generados y commiteados en develop. Publicar con `node socialPublisher.js --slug [slug]` uno a uno — **casi terminado (2026-07-19), pendiente de revisión final**
- [x] ✅ Facebook manual al día (2026-07-19): Muñeca dolorida (12/07), SCAR 18 (14/07), Mobi Fold (16/07) publicados

## Estado de borradores
- Última revisión: 2026-07-14
- Borradores pendientes: 20
- Listos para publicar: 7
- Última ejecución de completar-borradores: 2026-06-24
- Borradores descartados: 0 en esta pasada
- **Pasada 2026-07-07 — revisión completa sobre los 28 borradores activos**:
  - `borrador-cherry-kc-6000-slim-analisis` — eliminadas las secciones duplicadas "Preguntas frecuentes" + "🐿️ Fitz recomienda" (bloque genérico de plantilla que convivía con el bloque real; bug conocido documentado en CLAUDE.md desde la pasada 2026-06-25)
  - `borrador-hp-935-creator-wireless-analisis` — sección "Experiencia de uso esperada" con lenguaje "cabe esperar" convertida a sección "Uso y ergonomía" con prosa declarativa. **Urgente: este artículo publica hoy (2026-07-07)**
  - `borrador-asus-vivobook-15-oferta` — imagen `asus-vivobook-15-oferta.webp` y thumb generadas con Sharp (copiadas desde la imagen del análisis del mismo producto, que sí existía en disco). Build verificado: 43 páginas, sin errores
  - `borrador-adata-urban-tapsafe` — imagen verificada: el frontmatter y el archivo en disco tienen el mismo nombre con prefijo `borrador-adata-lleva-a-computex...` — consistente, sin cambios necesarios
  - Los 14 borradores nuevos (08/13–09/22): sin problemas de "cabe esperar"; word counts correctos (924–1173 palabras); estructura de secciones completa
  - **10 borradores con sección "Experiencia de uso esperada" y lenguaje "cabe esperar" no corregidos** — no tienen fecha de publicación inmediata (más lejana: logitech-mobi-fold 16/07; la mayoría 07/08 en adelante): aoc-q27p3cv, airra-labs, asus-rog-strix-scar-18, cherry-kc-6000-slim, jabra-evolve2-30-se, lg-ultragear, logitech-mk470, razer-seiren-v3-pro, trust-tk-350-silent. Pendiente de pasada de calidad textual
- **Pasada 2026-07-06 — 14 borradores nuevos incorporados + guía de soportes reemplazando webcams**:
  - Traídos de la rama `borradores` e incorporados a `develop`: `corsair-k70-core-tkl-analisis` (teclados, 80€, imagen real del usuario), `corsair-xeneon-edge-analisis` (monitores, 272,99€, imagen oficial de Corsair CDN)
  - Generados por agente en background y añadidos al repo: `logitech-mx-vertical-analisis` (ratones, 64,98€), `logitech-signature-m650-analisis` (ratones, 39,32€), `microsoft-bluetooth-ergonomic-mouse-analisis` (ratones, 59,99€ Amazon.es — no disponible en PcComponentes), `logitech-mx-mechanical-analisis` (teclados, 155,99€), `keychron-k2-max-analisis` (teclados, 139,99€), `logitech-pop-keys-analisis` (teclados, 47,99€), `benq-pd2705q-analisis` (monitores, 299,00€), `asus-proart-pa278cv-analisis` (monitores, 289,00€, **imagen placeholder — pendiente foto real**), `msi-pro-mp341cq-analisis` (monitores, 224,78€), `logitech-brio-505-analisis` (periféricos, 70,95€), `mejores-webcams-teletrabajo-2026` (guía periféricos) y `monitor-ultrawide-teletrabajo-merece-la-pena` (guía monitores)
  - Guía de webcams (`mejores-webcams-teletrabajo-2026`) **eliminada y sustituida** por `mejores-soportes-brazos-monitor-teletrabajo-2026` (guía, setups, 23/08) — 4 opciones con precios reales de PcComponentes: Aisens DT32TSR-447 (27,99€), StarTech ARMPIVOTB (89,73€), Ergotron LX (197,99€), Onkron G140-B doble (94,99€). Nota: el Ergotron LX está a 197,99€ en PcComponentes, bastante por encima del ~130€ estimado inicialmente — el artículo ya lo advierte
  - `borrador-asus-vivobook-15-oferta.md` (tipo oferta, 649€) generado desde la rama `borradores` — no va al calendario regular; publica vía `monitor.js` si supera el umbral de descuento
  - Imágenes placeholder generadas con Sharp: `logitech-mx-vertical-analisis`, `asus-proart-pa278cv-analisis`, `mejores-soportes-brazos-monitor-teletrabajo-2026`
  - Todos los 14 borradores calendarizados: 2026-08-13 a 2026-09-22 (ver "Estado del calendario")
- Borradores completados y con fecha en el calendario: 18 (7 ya estaban calendarizados + 11 huérfanos incorporados hoy, ver "Estado del calendario de publicaciones")
- Lanzamientos Computex pendientes de disponibilidad: borrador-adata-urban-tapsafe (precio sin tocar, según instrucción — esperando disponibilidad real del producto; imagen rota corregida, ver pasada 2026-06-24)
- **Pasada 2026-06-24 — corrección puntual sobre 8 borradores señalados por el Revisor de borradores** (working directory; sin tocar `borrador: true`, sin renombrar archivos, sin push a `main`):
  - `borrador-adata-lleva-a-computex-b2026b-el-urban-tapsafe-un-ssd-externo-que-se-desbloquea-.md` — el campo `imagen` apuntaba a un archivo .webp inexistente en disco. Generado placeholder honesto (mismo estilo que el de Airra Labs: fondo `#F9FAFB`, patrón de puntos, icono genérico de SSD, texto "Imagen provisional — pendiente de imagen oficial") + thumb. Precio sigue sin resolver, intencionadamente (lanzamiento sin disponibilidad real todavía)
  - `airra-labs-rotary-mouse-analisis` — `precio: "Ver precio"` no se pudo resolver con una fuente fiable; queda pendiente de revisión humana o de disponibilidad real del producto. ✅ Imagen real obtenida el 2026-07-07 (imagen oficial del usuario)
  - `borrador-asus-rog-strix-scar-18-analisis.md` — verificada la longitud real de `descripcion`: 147 caracteres, dentro del límite de 150 (el conteo de 153 reportado por el Revisor no se correspondía con el contenido actual del archivo). No requirió cambio. `precio: "Ver precio"` sigue sin resolver, pendiente
  - `lg-ultragear-34gx90sb-w-analisis` — `precio: "Ver precio"` sin fuente fiable, queda pendiente
  - `borrador-logitech-k380-analisis.md` — la imagen (`logitech-k380-analisis.webp`) era el logo genérico "logi" de Logitech, idéntica byte a byte a las de mk470 y mobi-fold. Se intentó `imageCollector.js --slug logitech-k380-analisis` con varias queries manuales (español e inglés): en todos los casos la ruta "vía fabricante" siguió devolviendo el mismo logo genérico del dominio logitech.com en vez de una foto del producto — bug del collector con el sitio de Logitech, no resuelto. Sustituida por un placeholder honesto propio (icono de teclado) + thumb, en vez de dejar la imagen engañosa. Precio (39,99€) ya estaba resuelto, sin cambios
  - `borrador-logitech-mk470-analisis.md` — mismo bug de imagen genérica que K380, mismo fix (placeholder honesto, icono de combo teclado+ratón). `title` recortado de 74 a 63 caracteres ("Logitech MK470: combo teclado y ratón para teletrabajo sencillo"). `precio: "Ver precio"` sin resolver, pendiente
  - `razer-seiren-v3-pro-analisis` — `precio: "Ver precio"` sin fuente fiable, queda pendiente (imagen oficial ya resuelta en pasada anterior, sin tocar)
  - `logitech-mobi-fold-analisis.md` — mismo bug de imagen genérica, mismo fix (placeholder honesto, icono de ratón). `title` recortado de 82 a 66 caracteres ("Logitech Mobi Fold: ratón compacto plegable para teletrabajo móvil"). Añadido `enlace_afiliado` que faltaba por completo (`https://www.pccomponentes.com/buscar/?query=logitech+mobi+fold`, mismo formato que el resto del sitio). `precio: "Ver precio"` sin resolver, pendiente
  - **Pendiente de resolución manual o con fuente externa**: precios reales de airra-labs-rotary-mouse, asus-rog-strix-scar-18, lg-ultragear-34gx90sb-w, logitech-mk470, razer-seiren-v3-pro, logitech-mobi-fold — y 2 imágenes honestas-placeholder (MK470, Mobi Fold) siguen pendientes de una foto real de producto, igual que Airra Labs
  - **✅ RESUELTO 2026-06-24 (tarde)**: `logitech-k380-analisis` ya tiene foto real del producto (3 teclas Bluetooth amarillas numeradas, característica distintiva del K380), proporcionada por el usuario en su carpeta de Descargas como `logitech-k380-analisis.jpg`. Procesada con Sharp (mismo método que el resto: fondo `#F9FAFB`, 1200x675 + thumb 400x225), sustituyendo el placeholder honesto. Resuelto justo a tiempo para su publicación programada del 2026-06-25
  - Build verificado con `npm run build` tras los cambios: 37 páginas generadas, sin errores ni warnings; los borradores con `borrador: true` no generan página propia, como se esperaba. Build 2026-07-07: 43 páginas (5 publicaciones adicionales desde la pasada anterior)
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
- Última revisión: 2026-07-19 (17ª pasada — fotos lifestyle Gemini para guías de setup; precios actualizados; slide 3 portatil-vs-sobremesa regenerado)
- Errores críticos pendientes: 0 | Estado: ✅ Sin errores críticos
- **Correcciones 2026-07-19 (17ª pasada)**:
  - **Imágenes de guías de setup reemplazadas con fotos Gemini Imagen 3**: `mejor-setup-teletrabajo-500-euros-2026` (monitor + teclado + ratón sobre escritorio de madera clara, 23KB) y `setup-teletrabajo-profesional-2026` (Keychron K8 Pro + MX Master + monitor 4K sobre escritorio de nogal oscuro, 61KB). Las imágenes anteriores eran cuadrículas de productos generadas por el compositor automático (fondo blanco) que quedaban casi negras con el degradado del slide 1 de Instagram. Los 8 slides de Instagram regenerados (4 por guía, todos >50KB)
  - **`portatil-vs-sobremesa-teletrabajo-2026`**: slide 3 regenerado (estaba en 47KB, por debajo del umbral de 50KB de `socialReviewer.js`; ahora 51KB)
  - **LG 34GX90SB-W y 34GX90SA-W**: verificado que son el mismo hardware con nombres regionales distintos (SB-W es el nombre en algunos mercados, SA-W en otros). Mismas specs: OLED 34" WQHD 240Hz, MLA+, 1300 nits, webOS. Precio confirmado: 999€
- **Correcciones 2026-07-18 (16ª pasada)**:
  - `src/pages/articulo/[slug].astro` — añadido `aggregateRating` al `itemReviewed.Product` del schema `Review` de Google (resuelve las advertencias "Falta el campo aggregateRating" en Search Console para los 7 análisis con puntuación; `ratingValue` siempre es un número porque el bloque está dentro del guard `esAnalisisConPuntuacion`)
  - **Correcciones de calidad textual sobre 13 artículos publicados** (2 commits, 7d84f7d y bd63deb): lenguaje de uso inventado en primera persona corregido a tercera persona o "según especificaciones" (`lg-27up850n`, `lg-gram-14`, `asus-vivobook-15-oled`, `logitech-lift-vertical`, `logitech-mx-anywhere-3s`, `logitech-mx-keys-s`, `logitech-mx-master-3s`); `tipo: "analisis"` añadido a `keychron-k2-v2` que no lo tenía; 4 aperturas de sección "Fitz recomienda" variadas para no repetir la misma fórmula; 5 artículos expandidos a 900+ palabras (`asus-rog-strix-scar-18`, `razer-pro-click`, `aoc-q27p3cv`, `samsung-s27a600`, `hp-935-creator-wireless`); typos en `mejor-setup-500` y `lenovo-thinkpad-e14-gen6`
  - **Auditoría de carruseles de Instagram** (sesión 2026-07-18): 10 artículos con carrusel verificados (5 con socialReviewer.js completo ✅, 5 verificados por tamaño de slides en main ✅); 24 artículos sin carrusel (publicados antes del pipeline, mayo-junio 2026) — carruseles generados localmente con instagramImageGenerator.js y commiteados a develop para revisión manual antes de publicar. `monitor-4k-vs-full-hd` regenerado (slide 3 a 49KB, bajo el umbral)
  - **Pre-generación de slides de Instagram en borradores** (`analyzer.js`, `guideGenerator.js`, `instagramImageGenerator.js`, `publicar-automatico.yml`, `src/content/config.ts`): los borradores generados ahora incluyen en el frontmatter los textos de los slides (`instagram_veredicto`, `instagram_pros_frases`, `instagram_contras_frases` para análisis; `instagram_slide2/3_titulo`, `instagram_slide2/3_items`, `instagram_veredicto` para guías). `instagramImageGenerator.js` lee estos campos primero (Capa 0, sin Groq); usa Groq solo como fallback si los campos no existen. `publicar-automatico.yml` copia los slides pre-generados desde develop antes de intentar regenerarlos — elimina la dependencia de Groq y Puppeteer en tiempo de publicación. 7 nuevos campos opcionales añadidos al schema Zod de `config.ts`
- **Error crítico resuelto (verificado 2026-07-18)**: `privacidad.astro` ya no declara cookies ficticias `fitzdesk_session`/`fitzdesk_prefs` — muestra correctamente `fitzdesk_cookies_consent` en localStorage. Sin errores críticos pendientes.
- **Advertencias pendientes tras la 14ª pasada**:
  - `publicar-automatico.yml:148` — URL del artículo en notificación Discord enviada antes de que el deploy complete; puede dar 404 durante ~5-15 min
  - `index.astro:300`, `buscar.astro:394,603`, `AffiliateButton.astro:51,57`, `contacto.astro:185,205` — 7 instancias de `rgba(249,115,22,...)` hardcodeadas para box-shadows/highlight (2 nuevas en contacto.astro)
  - `deploy.yml:46` — `npm install` en vez de `npm ci` (inconsistente con la corrección de monitor.yml en la 12ª pasada)
  - `global.css:1` + `BaseLayout.astro:71-76` — Google Fonts cargado dos veces (via @import en CSS y via <link> en HTML); doble request a Google por cada carga de página
  - `socialPublisher.js:91,106,138,150,176,198` — 6 fetch() a la API de Meta/Pinterest sin AbortSignal.timeout()
- **Correcciones 2026-07-17 (15ª pasada — imagen_placeholder, Review schema, sitemap automation)**:
  - `fitzdesk-monitor/auto-publisher.js` — nuevo bloque de validación que bloquea la publicación si el frontmatter contiene `imagen_placeholder: true`. Reemplaza la heurística de tamaño de archivo (40KB) que daba falsos positivos para imágenes reales de fondo blanco pequeñas (p.ej. airra-labs: 12.9KB). Si el campo está presente, el workflow notifica a Discord con el motivo y termina sin publicar
  - `src/content/config.ts` — añadido `imagen_placeholder: z.boolean().optional()` al schema Zod
  - 5 borradores con `imagen_placeholder: true` en el frontmatter (pendientes de foto real, ver "Próximas acciones"): `logitech-mx-vertical-analisis`, `mejores-soportes-brazos-monitor-teletrabajo-2026`, `asus-proart-pa278cv-analisis`, `logitech-brio-505-analisis`, `microsoft-bluetooth-ergonomic-mouse-analisis`. `logitech-mk470-analisis` ya tiene foto real y se eliminó el campo
  - `src/pages/articulo/[slug].astro` — schema markup `Review` corregido para Google Search Console (error "Debe especificarse offers, review o aggregateRating" y "Falta el campo 'image'"): `itemReviewed.Product` ahora incluye `image` (URL absoluta `https://fitzdesk.com${imagen}`), `description` y `offers` con `Offer` completo (price, priceCurrency, availability). Los artículos que no son `tipo: "analisis"` con puntuación numérica usan schema `Article` en vez de `Review` — evita errores de Google en comparativas, guías y lanzamientos
  - `.github/workflows/publicar-automatico.yml` — nuevo step "Reenviar sitemap a Google Search Console" (`continue-on-error: true`) que ejecuta `node indexingChecker.js --fix` tras cada publicación exitosa, usando el secret `GOOGLE_SERVICE_ACCOUNT_KEY`. Requiere que el secret esté creado en GitHub (ver "Próximas acciones")
- **Correcciones 2026-07-07 (12ª pasada)**:
  - `comparar.astro` — Chart.js cargado con `defer` y SRI (`integrity="sha384-jb8JQMbMoBUzgWatfe6COACi2ljcDdZQ2OxczGA3bGNeWe+6DChMTBJemed7ZnvJ"`, versión pinned a `@4.5.1`); elimina la carga sin integridad de un CDN externo
  - `monitor.js` — `findExistingArticle()`: fetch envuelto con `signal: AbortSignal.timeout(15000)` para no colgar en llamada a GitHub API
  - `notifier.js` — `discordPost()`: `signal: AbortSignal.timeout(10000)` añadido al fetch de Discord
  - `socialContent.js` — `notifyDiscordError()` y `notifyDiscordSuccess()`: mismos timeouts de 10s
  - `ArticleCard.astro` / `buscar.astro` — colores hardcodeados del badge `.card-tipo-badge` (#FEF3C7, #92400E) reemplazados por nuevas variables CSS `--color-badge-comparativa-bg`/`--color-badge-comparativa-text`
  - `global.css` — `--color-brand-dark: #EA6A00` corregido a `#EA580C` (ahora coincide con `--color-primary-dark` y con CLAUDE.md). Añadidas `--color-text-on-dark: #D1D5DB` y `--color-text-on-dark-muted: #9CA3AF` para textos sobre fondos oscuros, y `--color-badge-comparativa-bg`/`--color-badge-comparativa-text` para el badge de tipo
  - `Footer.astro` — 6 colores hardcodeados (#D1D5DB, #9CA3AF, #6B7280) sustituidos por `var(--color-text-on-dark)`, `var(--color-text-on-dark-muted)` y `var(--color-text-secondary)`
  - `index.astro` — 2 colores hardcodeados (#9CA3AF) en `.why-section` sustituidos por `var(--color-text-on-dark-muted)`
  - `fitzdesk-monitor/utils/slugify.js` — nuevo módulo compartido `export function slugify(text, maxLen = 80)`. Reemplaza las 5 copias locales en `analyzer.js`, `guideGenerator.js` (maxLen 80) y `compareGenerator.js`, `launchGenerator.js`, `offerGenerator.js` (maxLen 60, con wrapper local)
  - `monitor.yml` — `npm install` → `npm ci --omit=dev`
  - `publicar-automatico.yml` / `publicar-en-redes.yml` — step `Setup Node.js` ahora incluye `cache: 'npm'` + `cache-dependency-path: fitzdesk-monitor/package-lock.json`
  - `monitor.js` — `addDuplicateWarning()` reescrita con regex CRLF-tolerante (`/^-{3}\r?\n[\s\S]*?\r?\n-{3}\r?\n/`) y BOM-aware, igual que el patrón ya usado en `insertFrontmatterLine()`
  - Build verificado: 44 páginas, sin errores. `node --check` sobre todos los JS modificados: OK
- **Correcciones 2026-06-26 (11ª pasada)**:
  - `instagramImageGenerator.js` — nueva función `getGuideCarouselContent()`: los artículos `tipo: "guia"` ahora generan slides 2 y 3 temáticamente personalizados (Groq extrae dos grupos de puntos clave del contenido del artículo, con heading e icono propios) en vez de "Lo mejor"/"Lo mejorable" (que no existen en guías). Fallback doble: si Groq falla → secciones "Cuándo SÍ/NO" del artículo → placeholder genérico. `generateInstagramCarousel()` refactorizada para detectar `data.tipo === 'guia'` y bifurcar. Los dos slides de guía usan `kind: 'pro'` (no `'con'`) para las explicaciones, evitando texto genérico de desventaja donde no procede
  - `socialReviewer.js` — detección `esGuia` añadida (con try/catch porque `loadArticleData` lanza si la imagen no existe en disco); las guías omiten `getCarouselContent()` igual que las ofertas, sin gastar tokens de Groq en un flujo que no aplica
  - `socialContent.js` — `buildFacebookCaption()` (plantilla de respaldo cuando Groq no está disponible) ahora incluye una pregunta de comentarios hardcodeada ("¿Lo tienes en tu setup o lo estás considerando? Cuéntanos 👇"), de forma que la plantilla pasa todas las comprobaciones del revisor sin necesitar Groq para corregirla — eliminada la causa del bloqueo permanente cuando tanto la generación como la corrección de Groq fallaban a la vez
  - `publicar-automatico.yml` / `publicar-en-redes.yml` — `GROQ_API_KEY: ${{ secrets.GROQ_API_KEY }}` añadida también al step "Generar carrusel de Instagram" (faltaba desde la sesión anterior; el step "Publicar en redes sociales" ya lo tenía)
  - **4 bugs corregidos por el revisor de código (11ª pasada)**:
    1. `socialReviewer.js:375` — `loadArticleData(slug)` sin try/catch: lanzaba una excepción no capturada si la imagen del artículo no existía en disco durante la revisión. Corregido con try/catch que deja `esGuia = false` si falla
    2. `instagramImageGenerator.js` — `getGuideCarouselContent()` aplicaba `slice(0,4/3)` DESPUÉS de llamar a `getItemExplanations()`, haciendo que Groq generara explicaciones para ítems que luego se descartaban. Corregido aplicando los slices ANTES de la llamada
    3. `instagramImageGenerator.js` — fallback de secciones "Cuándo SÍ/NO" usaba `siSection ? parseBulletList(...) : fallback` sin comprobar si `parseBulletList` devolvía un array vacío (sección presente pero sin bullets). Extraído a `siBullets`/`noBullets` con comprobación de `.length`
    4. `instagramImageGenerator.js` — el slide 3 de guías usaba `kind: 'con'` en `getItemExplanations()`, lo que provocaba texto genérico de "desventaja" cuando en realidad ese slide contiene conceptos válidos ("Cuándo no es necesario", no defectos del producto). Corregido a `kind: 'pro'`
- **Bug conocido pendiente — posts de Facebook no visibles para no-administradores (2026-06-26)**: las publicaciones hechas via API (token del Usuario del Sistema "FitzDesk Monitor") aparecen en la página pero solo las ve el admin. Los posts manuales (pegar URL → Facebook genera preview del enlace) sí son visibles para cualquier usuario. Causa probable: el token del Usuario del Sistema no tiene el mismo nivel de acceso de publicación que un token de acceso a Página normal. **Solución diferida**: investigar si `scheduled_publish_time: Math.floor(Date.now()/1000) + 300` con `published: false` resuelve el problema, o si hay que cambiar el tipo de token. Hasta entonces, el usuario publica en Facebook de forma manual pegando la URL en la caja de texto (Facebook genera la vista previa del artículo desde los og: tags)
- **Publicaciones de Facebook manuales preparadas (2026-06-26)**: el usuario publica pegando la URL directamente (sin texto ni imagen adicional — Facebook genera la preview del artículo a partir de og:image/og:title/og:description). ✅ Backlog confirmado publicado por el usuario el 2026-07-07 (logitech-k380-analisis 25/06, monitor-4k-vs-full-hd-teletrabajo-2026 28/06, intel-wildcat-lake 30/06, corsair-clipper-pro-mini-60 02/07, hp-935-creator-wireless-analisis 07/07 — todos verificados sin problemas en Facebook)
- **2 advertencias de la 9ª pasada, corregidas en esta**: `applyPrecioToExistingAnalysis()` en `monitor.js` mezclaba dos técnicas para localizar el cierre del frontmatter (`indexOf('\n---', ...)` frágil en 2 de 3 puntos de inserción, regex tolerante a CRLF solo en el tercero). Unificado en un único helper `insertFrontmatterLine()` (regex `/^-{3}\r?\n[\s\S]*?\r?\n-{3}\r?\n/` + bomLen, mismo patrón que `insertAfterFrontmatter()` en articleUpdater.js) usado por los 3 puntos de inserción de la función. Verificado en vivo con un caso CRLF sin campos previos y un caso LF con `precio` ya existente — ambos correctos. (`setFrontmatterField()` en articleUpdater.js, la advertencia equivalente fuera del módulo PCDays, queda sin tocar — no formaba parte de lo que se pidió corregir esta vez). De paso se corrigió también la inconsistencia que motivó la 2ª advertencia: `precio:` ahora comprueba si el campo existe antes de decidir reemplazar o insertar, igual que ya hacían `fecha_actualizacion`/`actualizado` en la misma función.
- **2 de las 3 sugerencias de la 9ª pasada, corregidas en esta**: el catch genérico del bucle de ofertas en `monitor.js` pasaba `slug: cand.itemTitle` a `notifyOfertaPendienteRevision()` (un título de noticia no es un slug) — corregido a `draft?.slug ?? null`. Se añadió un comentario explícito confirmando que la rama de "producto ya analizado" deliberadamente no dispara `publicar-en-redes.yml` tras actualizar el precio (decisión ya tomada, solo le faltaba quedar documentada en el propio código). La 3ª sugerencia (unificar `CONTENT_DIR` de `offerGenerator.js` con `ASTRO_CONTENT_PATH`) se deja sin tocar, tal y como la calificó el propio informe — bajo impacto, solo si se vuelve a tocar ese archivo.
- **Verificado sin problema 2026-06-25 (9ª pasada)**: scope de variables en el bucle nuevo de `ofertaCandidates` en monitor.js (`precioOfertaStr`/`descuentoStr` están en scope para el catch genérico en todos los caminos que lo alcanzan); `findRelatedAnalysis()` no se llama redundantemente entre monitor.js y `buildOfertaDraft()` para el mismo candidato (solo se invoca dos veces si la primera ya dio `null`); todas las llamadas a `fetch` en `githubPublisher.js` (16, incluidas `dispatchWorkflow`/`dispatchWorkflowAndWait` usadas hoy) pasan por el wrapper `ghFetch()` con timeout de 15s; sintaxis de los 6 archivos del bloque PCDays (`monitor.js`, `articleUpdater.js`, `offerGenerator.js`, `ofertaLimiter.js`, `pcdays-cleanup.js`, `githubPublisher.js`) verificada con `node --check`; barrido de todo `fitzdesk-monitor/*.js` en busca de otro regex de placeholder sin lookahead negativo tipo `/\[.*?\]/` (el que ya se corrigió en `offerGenerator.js`/`articleUpdater.js`) — no se encontró ningún otro caso, el único patrón de ese tipo en todo el proyecto es el ya corregido.
- **2 bugs corregidos 2026-06-24 (8ª pasada, encargo explícito de corrección)**:
  - `articleUpdater.js` — `applyContentUpdates()` insertaba `tipo: "analisis"` sin comprobar si el campo ya existía en el frontmatter original, duplicándolo en casi todos los artículos reales (que ya tienen `tipo` desde que se generan). Reproducido con un caso de prueba (confirmado: 2 líneas `tipo:`), corregido condicionando la inserción a `!hasFrontmatterField(content, 'tipo')`, y verificado tanto con el caso de prueba como en vivo contra `borrador-trust-tk-350-silent-analisis.md` (real, le faltaban las keywords) — resultado: 1 sola línea `tipo:`, frontmatter limpio, build verificado
  - `imageCollector.js` — la fuente "fabricante" (`tryManufacturer`) confiaba en el `og:image` de la página de búsqueda del fabricante. Para Logitech (y probablemente otras marcas con buscador SPA), esa página es renderizada por JS: el HTML estático que recibe `fetch()` nunca tiene el resultado real, solo el `og:image` genérico de la plantilla del sitio — confirmado pidiendo dos productos distintos ("k380" y "mx master 3s") y comprobando que devolvían exactamente la misma URL (`logitech-global-og-image.png`, el logo "logi"), sin importar la query. Corregido añadiendo un filtro de imágenes genéricas en `fetchOgImage()` (lista `GENERIC_IMAGE_PATTERNS`: favicon, logo, global-og-image, default-og, etc.) que rechaza esos resultados y deja que el pipeline caiga a Bing/DuckDuckGo, que sí encuentran la foto real. Verificado con `node imageCollector.js --slug logitech-k380-analisis` y `--slug logitech-mx-master-3s-analisis` (forzando una búsqueda real al borrar temporalmente las imágenes existentes): ambos devolvieron una foto real del producto vía DuckDuckGo, no el logo. Imágenes originales (ya válidas) restauradas tras la prueba para no introducir cambios innecesarios
- Advertencias 2026-06-24: 2 (1 nueva + 1 ya conocida sin corregir, ver detalle abajo). 1 advertencia conocida corregida en esta pasada.
- Correcciones aplicadas en esta pasada (2 archivos):
  - ScoreBox.astro — colores hardcodeados (#16a34a, #F97316, #DC2626) reemplazados por scoreColor() de src/lib/score.ts (advertencia pendiente desde 2026-06-17, ahora resuelta — mismo patrón ya aplicado en ArticleCard.astro y [slug].astro)
  - buscar.astro:591 — `.card-sep` usaba #9CA3AF hardcodeado en vez de var(--color-text-secondary); corregido
- Advertencias pendientes tras la 8ª pasada — resueltas en la 12ª:
  - ~~global.css:5 — --color-brand-dark era #EA6A00~~ ✅ corregido a #EA580C (12ª pasada)
  - ~~index.astro / Footer.astro — colores hardcodeados en secciones oscuras~~ ✅ sustituidos por vars CSS (12ª pasada)
- Sugerencias menores 2026-06-24 (seguimiento):
  - ~~slugify() duplicada en 4 archivos~~ ✅ extraída a `fitzdesk-monitor/utils/slugify.js` (12ª pasada); offerGenerator.js también incluido (5 archivos en total)
  - instagramImageGenerator.js:86-90 — función scoreColor() local con colores hardcodeados (#16a34a/#F97316/#DC2626) que replica src/lib/score.ts; no se puede importar directamente porque ese módulo es TypeScript en el ámbito de Astro y este archivo corre en Node puro fuera del build — el comentario en el código ya lo explica, se deja igual
  - _convert_tmp.cjs (raíz del repo, sin trackear en git) — script de conversión puntual de una imagen; no forma parte del código fuente real, candidato a borrar
  - ~~publicar-automatico.yml / publicar-en-redes.yml sin cache: npm~~ ✅ añadido cache npm (12ª pasada)
- Verificado sin regresión 2026-06-24 (archivos nuevos de esta sesión — socialPublisher.js, socialContent.js, socialReviewer.js, instagramImageGenerator.js, socialImageGenerator.js): todas las llamadas fetch están dentro de try/catch en el punto de uso; GROQ_API_KEY se comprueba con guard antes de instanciar el cliente Groq en socialContent.js y socialReviewer.js; sin console.log de debug (todos son output de CLI intencional); sin "as any"; sin acceso a DOM relevante (son scripts Node puro, no scripts de navegador)
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
- Última revisión de precios: 2026-07-19
- Artículos con precio desactualizado: 0 ✅
- Artículos pendientes de revisión: 3 (`lg-gram-14-2025-analisis`, `asus-vivobook-15-oled-analisis`, `lenovo-thinkpad-e14-gen6-analisis` — configuraciones descatalogadas del mercado español, no reabrir salvo dato nuevo del usuario, misma situación que revisiones anteriores)
- **Revisión 2026-07-19**: 5 precios actualizados en una pasada:
  - `lg-ultragear-34gx90sb-w-analisis` (borrador, publica 21/07): "Ver precio" → 999€. Confirmado que 34GX90SB-W y 34GX90SA-W son el mismo hardware con sufijos regionales distintos; ambos tienen MLA+ y 1300 nits. Precio oficial confirmado por el usuario
  - `asus-rog-strix-scar-18-analisis` (publicado 14/07): "Ver precio" → 4.599,99€ (PcComponentes, modelo G835LX). Nota añadida en el artículo: posible encontrarlo más barato desde 3.683,94€ en idealo/Amazon (modelo G835LR, entrada de gama)
  - `borrador-airra-labs-rotary-mouse-analisis` (publica 23/07): "Ver precio" → ~126€ (Kickstarter, $139 USD). Aviso añadido al inicio del artículo: precio Kickstarter, el retail puede diferir. El artículo publica automáticamente el 23/07 (no está bloqueado por `imagen_placeholder: true`)
  - `borrador-razer-seiren-v3-pro-analisis` (publica 11/08): "Ver precio" → 289,99€ (idealo.es). PcComponentes solo lista el Seiren V3 Chroma (variante RGB)
  - `lg-27up850n-analisis`: 459.96€ → 459,96€ (corrección de separador decimal, cosmética)
- **Revisión 2026-07-07 (pasada rápida)**: todos los artículos actualizados en 2026-06-24 están dentro del rango de 30 días. Un artículo supera los 30 días sin actualización: `lg-gram-14-2025-analisis` (publicado 2026-05-27, precio 1.099€). Buscado en PcComponentes: la config exacta del artículo (Intel Core Ultra 7 Serie 2 + 16GB + 512GB) no aparece listada; los modelos 14Z90S/14Z90T disponibles son 32GB/1TB a 1.150–1.319€. Situación análoga a asus-vivobook-15-oled y lenovo-thinkpad-e14-gen6 (generación de producto cambiada en el mercado). Sin actualizar — no reabrir salvo fuente nueva o dato del usuario.
- **Sesión de precios 2026-06-24 cerrada**: 10 de 12 artículos `>30 días` resueltos con precio real verificado (9 en la sesión + keychron-k2-v2 ya documentado abajo como "agotado", no descatalogado). Quedan 2 sin resolver y **se deja así, cerrado, hasta que haya información nueva**: `asus-vivobook-15-oled-analisis` y `lenovo-thinkpad-e14-gen6-analisis` — ambos por cambio real de generación de producto en todo el mercado (Ryzen 7 8845HS y Core i5-13500H/i7-13700H respectivamente ya no se venden en España bajo ninguna tienda comprobada: PcComponentes, Amazon, idealo.es, fabricante oficial), no por falta de búsqueda. No reabrir esta búsqueda salvo que aparezca una fuente nueva o el usuario aporte un dato concreto
- **Agente `actualizar-precios` ampliado 2026-06-24**: hasta ahora solo construía una URL de búsqueda de PcComponentes para que el usuario la comprobara a mano, nunca llegaba a visitarla. Tras esta sesión (búsqueda real de precios para 12 artículos, ver detalle abajo), se actualizó `.claude/agents/actualizar-precios.md` para que el propio agente use WebSearch/WebFetch y busque en orden: PcComponentes → idealo.es → tienda oficial del fabricante (Amazon.es y COOLMOD se descartaron como prioritarios por bloquear el fetch automático con frecuencia — 503 repetidos y bucles de redirección, confirmado en esta sesión). Reglas explícitas añadidas: nunca inventar un precio sin fuente verificada, nunca tocar `enlace_afiliado` (debe seguir apuntando siempre a PcComponentes, por el futuro programa de afiliados con Awin, aunque el precio mostrado venga de otra tienda), convertir y marcar explícitamente si el precio encontrado está en otra moneda, y distinguir "agotado" (puede recuperar stock) de "descatalogado de verdad" (el modelo exacto no aparece en ningún sitio)
- **Precios actualizados con dato real verificado en PcComponentes (5 de 12 pendientes)**: benq-gw2780-analisis (149€→266,81€), logitech-mx-keys-s-analisis (119€→74,95€), logitech-mx-master-3s-analisis (99€→145,99€), logitech-lift-vertical-analisis (69€→45,90€), logitech-mx-anywhere-3s-analisis (49€→59,99€). Todos vía `articleUpdater.js --slug [slug] --precio [precio]€`, con `fecha_actualizacion` añadida automáticamente
- **Bug encontrado en `articleUpdater.js` (modo `completar-secciones`, el que corre sin `--slug`)**: al añadir `keyword_principal`/`keywords_secundarias` en artículos donde faltaban, inserta los campos nuevos antes de la línea `tipo:` existente sin eliminarla, dejando `tipo:` duplicado en el frontmatter (YAML lo tolera tomando el último valor, pero es un bug real). Detectado y corregido manualmente en los 5 archivos afectados en esta pasada (aoc-q27p3cv, cherry-kc-6000-slim, hp-935-creator-wireless, jabra-evolve2-30-se, logitech-k380, todos borradores). No se ha corregido el script en sí, solo los archivos ya afectados — pendiente si se vuelve a tocar `articleUpdater.js`
- **Ronda 2 — búsqueda en otras tiendas tras confirmar que PcComponentes ya no los lista** (a petición del usuario: "si no se encuentra en una o dos webs no detenerse y seguir buscando"). Resultado: 3 más actualizados con precio real de otra tienda, 1 confirmado descatalogado de verdad (no solo fuera de PcComponentes), 2 siguen sin precio fiable:
  - `dell-s2722qc-analisis` (623,83€, vía idealo.es — el producto SIGUE a la venta, confirmado también en MediaMarkt/Amazon/Dell oficial; solo desapareció del catálogo de PcComponentes, no es descatalogue real)
  - `lg-27un880` (479€→435,00€, vía idealo.es — confirmado también en Worten y LG España oficial; mismo caso, solo fuera de PcComponentes)
  - `keychron-k8-pro-analisis` (109€→119,95€, vía COOLMOD, switch Gateron G Pro Red ISO-ES, coincide con la config del artículo)
  - **`keychron-k2-v2` — corregido el diagnóstico**: el usuario encontró la página real en `keychron.com` (tienda global, no la española): SKU K2-C2H, marcado **"Sold out"**, precio $68,24. No está descatalogado de fabricación, está agotado en la tienda oficial y ausente en las 5 tiendas españolas comprobadas. Resuelto: `precio: "60€ (agotado)"` (conversión desde USD, tasa BCE del 2026-06-24, 1$ = 0,8797€) + `fecha_actualizacion` + aviso en el cuerpo explicando la situación exacta (agotado, no descatalogado; precio no activo en España)
  - `keychron-v1-analisis`: confirmado que SIGUE a la venta (listado en COOLMOD con el switch exacto del artículo, K Pro Red/Brown ISO-ES) pero no se ha podido leer el precio — Amazon.es bloqueó la lectura automática (503 repetido, protección anti-bots), COOLMOD redirige en bucle, y la tienda oficial keychron.com.es carga el precio por JS y no aparece en el HTML estático. Necesita una comprobación manual de 30 segundos en cualquiera de esas páginas
  - `lenovo-thinkpad-e14-gen6-analisis` y `asus-vivobook-15-oled-analisis`: sin cambios, la configuración exacta del artículo (Ryzen 7 8845HS/Core Ultra 7 para el Lenovo; Core i5-13500H/i7-13700H para el ASUS) sigue sin aparecer en ningún sitio comprobado (PcComponentes, Amazon, fabricante) — a diferencia de los casos anteriores, este parece ser un cambio de generación real en todo el mercado, no solo ausencia en una tienda
- **Ronda 3 — búsqueda final con el agente `actualizar-precios` ya ampliado (idealo.es como fuente principal)**: confirmado con más fuentes para los 3 que quedaban, sin poder resolverlos:
  - `keychron-v1-analisis`: sigue confirmado a la venta (COOLMOD, switch ISO-ES exacto del artículo), pero el precio es técnicamente ilegible por herramientas automáticas tras 5 intentos distintos (PcComponentes 410, Amazon 503, COOLMOD bucle de redirección, idealo no indexa el V1 base, tienda oficial carga el precio por JS sin que aparezca en el HTML estático). Límite estructural, no falta de búsqueda — necesita una comprobación manual de 30 segundos
  - `lenovo-thinkpad-e14-gen6-analisis` (Ryzen 7 8845HS / Core Ultra 7): confirmado en idealo (comparador más completo probado) que el Gen 6 a la venta en España usa Ryzen 7000-series (7535HS/7735HS) o Intel Core Ultra, nunca el 8845HS (serie 8000) del artículo — y ya existe el Gen 7. Configuración descontinuada en todo el mercado español, no solo ausente de una tienda. Rango de precios de la familia Gen 6 actual (configs distintas, no comparables): 1.139€–1.305€
  - `asus-vivobook-15-oled-analisis` (i5-13500H/i7-13700H): mismo patrón — idealo solo lista variantes Go/Pro/S15/F1504/X1505 con otras CPUs, rango 430€–1.500€ según gama, ninguna coincide con la config del artículo
  - **No se ha escrito ningún precio para estos 3** — usar el rango de un producto distinto habría sido inventar un dato, contraviniendo la norma del proyecto
- Artículos pendientes de revisión (>30 días) tras todas las rondas: 2 (asus-vivobook-15-oled-analisis, lenovo-thinkpad-e14-gen6-analisis — generación de producto distinta en todo el mercado). keychron-k2-v2 y keychron-v1-analisis ya resueltos (ver abajo)
- **Ronda 4 — el usuario aportó capturas reales que destraban 2 de los 3 casos pendientes**:
  - `keychron-v1-analisis`: captura de Google Shopping confirmó COOLMOD a 71,39€ (switch Brown ISO-ES, coincide con el artículo), marcado "agotado para compras en línea". Actualizado `precio: "71,39€"` con aviso explícito de que está agotado online
  - `lenovo-thinkpad-e14-gen6-analisis`: la captura aportada era del **Ryzen 7 7735HS**, no del 8845HS del artículo — confirma una vez más que la config exacta no se vende (generación de Ryzen distinta), precios además con 27-51 semanas de antigüedad. No se ha usado para actualizar el precio, solo queda como referencia de que ni siquiera el modelo hermano tiene datos frescos
  - `asus-vivobook-15-oled-analisis`: el usuario aportó un rango estimado (700-900€) sin fuente concreta citada; como el precio actual del artículo (699€) ya cae dentro de ese rango, se ha dejado sin tocar en vez de sustituirlo por una estimación sin fuente verificable
- **Bug real encontrado y corregido en `articleUpdater.js`**: `insertAfterFrontmatter()` buscaba el patrón literal `'\n---\n'` para insertar el aviso de "Artículo actualizado" tras el frontmatter. Al menos 9 artículos del repo usan saltos de línea CRLF (`\r\n`) en vez de LF, por lo que el patrón nunca coincidía, la función devolvía el contenido sin cambios, y el script reportaba "✅ ... aviso de actualización" como si hubiera funcionado, **sin que el aviso se insertara realmente** — fallo silencioso. Afectó a las 9 actualizaciones de precio de esta sesión (benq-gw2780, dell-s2722qc, keychron-k8-pro, keychron-v1, lg-27un880, logitech-lift-vertical, logitech-mx-anywhere-3s, logitech-mx-keys-s, logitech-mx-master-3s). Corregido: la función ahora usa una regex tolerante a CRLF/LF y a BOM al inicio del archivo (`bomLen` + regex con `\r?\n`). Re-ejecutado `articleUpdater.js --precio` sobre los 9 artículos afectados para insertar el aviso que faltaba — verificado con `grep -c "📅"` que los 9 ya lo tienen
- **Bug relacionado, corregido manualmente**: el texto del aviso generado por `articleUpdater.js` siempre dice "en PcComponentes", aunque el precio real venga de otra tienda (idealo.es, COOLMOD). Corregido a mano en los 4 artículos donde aplicaba (dell-s2722qc, lg-27un880, keychron-k8-pro, keychron-v1) para que el aviso cite la fuente real. El script en sí sigue sin distinguir la fuente — pendiente si se vuelve a tocar `applyPrecioUpdate()`

## Estado del calendario de publicaciones
- Ritmo: Domingo c/2 semanas (guía/comparativa) · Martes y jueves (análisis/lanzamiento, 9:00–14:00 — hora exacta no garantizada por retrasos de cola en GitHub Actions, ver nota 2026-06-18)
- Calendario generado: 2026-06-22
- **✅ airra-labs-rotary-mouse ya tiene imagen oficial (2026-07-07)** — imagen real proporcionada por el usuario (`16x9_2133x1200_highres-rotary-mouse.webp`), procesada con Sharp. Slot del 11/08 desbloqueado.
- **Cambio de calendario 2026-06-22**: `airra-labs-rotary-mouse-analisis` se retira de su slot del 23/07 (jueves) por falta de imagen oficial. En vez de dejar hueco o descartarlo, se desplazó toda la secuencia martes/jueves un slot hacia atrás (jabra-evolve2-30-se 28/07→23/07, cherry-kc-6000-slim 30/07→28/07, logitech-mk470 04/08→30/07, trust-tk-350-silent 06/08→04/08, razer-seiren-v3-pro 11/08→06/08) y Airra Labs pasa a ocupar el último slot libre, el 11/08 (martes). Acuerdo con el usuario: si sigue sin imagen cuando se vuelva a regenerar el calendario, se desplaza de nuevo al final (no se descarta el borrador, solo se pospone indefinidamente). Categorías vecinas verificadas sin repetición consecutiva tras el desplazamiento (21/07 monitores → 23/07 setups → 26/07 guias → 28/07 teclados → 30/07 setups → 04/08 teclados → 06/08 setups → 09/08 guias → 11/08 ratones)
- **Corregido 2026-06-21: error de día de la semana.** Una sesión anterior calculó mal el día de semana de fechas de julio (asumió 10/07=jueves y 13/07=domingo cuando en realidad 10/07=viernes y 13/07=lunes). Verificado con cálculo de fecha real (no a mano): el jueves real sin cubrir era el **09/07** y el domingo quincenal real (14 días tras el 28/06) es el **12/07**. Todas las fechas de julio/agosto de esta entrada están verificadas con `Date.UTC()`, no contadas a mano
- Calendario completo hasta 2026-09-22 (36 publicaciones totales, 16 ya publicadas: mejor-raton 14/06, samsung 16/06, hp-probook 18/06, razer-pro-click 23/06, logitech-k380 25/06, monitor-4k-vs-full-hd 28/06, intel-wildcat-lake 30/06, corsair-clipper-pro-mini-60 02/07, hp-935-creator-wireless 07/07, aoc-q27p3cv 09/07, dolor-muneca 12/07, asus-rog-strix-scar-18 14/07, logitech-mobi-fold 16/07)
- Próxima publicación pendiente: 2026-07-21 — borrador-lg-ultragear-34gx90sb-w-analisis (analisis, monitores, martes)
- **Ampliación 2026-07-06 — 14 entradas nuevas (13/08 a 22/09)**: corsair-k70-core-tkl (13/08 jue, teclados), corsair-xeneon-edge (18/08 mar, monitores), logitech-mx-vertical (20/08 jue, ratones), mejores-soportes-brazos-monitor [guía] (23/08 dom, setups), logitech-mx-mechanical (25/08 mar, teclados), benq-pd2705q (27/08 jue, monitores), logitech-signature-m650 (01/09 mar, ratones), keychron-k2-max (03/09 jue, teclados), monitor-ultrawide-teletrabajo [guía] (06/09 dom, monitores), asus-proart-pa278cv (08/09 mar, monitores — imagen pendiente), logitech-pop-keys (10/09 jue, teclados), logitech-brio-505 (15/09 mar, periféricos), msi-pro-mp341cq (17/09 jue, monitores), microsoft-bluetooth-ergonomic-mouse (22/09 mar, ratones). Guía del 23/08 actualizada: webcams → soportes de monitor.
- Huérfanos incorporados al calendario en esta sesión (11): dolor-muneca-teletrabajo (12/07, domingo), asus-rog-strix-scar-18 (14/07), logitech-mobi-fold (16/07), lg-ultragear-34gx90sb-w (21/07), airra-labs-rotary-mouse (23/07), asus-portatiles-trabajo-exigente-2026 (26/07, domingo), jabra-evolve2-30-se (28/07), cherry-kc-6000-slim (30/07), logitech-mk470 (04/08), trust-tk-350-silent (06/08), razer-seiren-v3-pro (11/08)
- Guía nueva creada y calendarizada el mismo día: `doble-monitor-teletrabajo-merece-la-pena` (09/08, domingo) — cubre el hueco quincenal de guías que ya no tenía ningún borrador disponible (los 3 existentes ya estaban todos asignados). 1042 palabras, enlaza los 4 análisis de monitores ya publicados (LG 27UP850N-W, Dell S2722QC, LG 27UN880, BenQ GW2780)
- **Corrección sobre el sistema de imágenes de guías**: se asumió inicialmente que las guías usaban ilustración cartoon vía DALL-E (existe `dallePrompt` en `guides.js`), pero verificado contra las imágenes reales publicadas: el sistema real en producción es `generateGuideImages.js` (Sharp/canvas), que compone fotos reales de producto ya analizadas — el `dallePrompt` nunca se usó de hecho. Se añadió un 4º layout `dual-monitor` en `composer.js` (dos monitores lado a lado con símbolo "+" en vez de "VS", ya que es un setup conjunto, no una comparativa de rivales) y se generó la imagen real con fotos de Dell S2722QC + LG 27UN880. `doble-monitor-teletrabajo-merece-la-pena` ya tiene imagen y thumb en disco
- Categorías alternadas para no repetir dos seguidas: monitores→portátiles→ratones→monitores→ratones→guía→setups→teclados→guía→setups→teclados→setups→teclados→guía→setups
- **imageCollector.js ejecutado 2026-06-21 sobre los 12 huérfanos pendientes**: 9/12 obtuvieron imagen real válida (aoc-q27p3cv, dolor-muneca, asus-rog-strix-scar-18, logitech-mobi-fold, lg-ultragear-34gx90sb-w, jabra-evolve2-30-se, cherry-kc-6000-slim, logitech-mk470, trust-tk-350-silent — vía DuckDuckGo o web de fabricante). 3/12 fallaron y necesitan resolución manual (DALL-E o búsqueda manual):
  - `airra-labs-rotary-mouse-analisis` — la búsqueda devolvió una miniatura de YouTube sobre "cómo invertir la dirección de la rueda del ratón", sin relación con el producto. Eliminada. **Placeholder generado 2026-06-22** con canvas/Sharp (icono genérico de ratón en gris claro sobre fondo #F9FAFB, texto "Imagen provisional") — sustituir por foto real cuando exista
  - `asus-portatiles-trabajo-exigente-2026` (guía, 5 portátiles distintos) — HTTP 403 de DuckDuckGo, sin imagen. Generado placeholder esquemático el 2026-06-22 (luego descartado). **✅ RESUELTO el mismo día**: el usuario proporcionó una foto real (5 portátiles genéricos en fila sobre escritorio de madera clara, fondo gris claro) guardada en Descargas como "Sin título2.jpg" — procesada con Sharp (mismo método que el resto: fondo #F9FAFB, 1200x675 + thumb 400x225) y usada tal cual, sin marca FitzDesk ni logos ASUS visibles (limitación conocida y aceptada explícitamente por el usuario, distinta del resto de imágenes de guías que sí llevan logo/sello Fitz/banda naranja)
  - `razer-seiren-v3-pro-analisis` — la imagen encontrada era del modelo "Seiren V3 CHROMA" (variante RGB gaming), no "Pro" (USB/XLR profesional que describe el artículo). Eliminada. **Reintentado 2026-06-21 con `--query` manual** (parámetro nuevo añadido a `imageCollector.js`, antes no existía): dos intentos con queries explícitos mencionando "Pro", "USB XLR" y "no RGB" — ambos devolvieron igualmente el Chroma (confirmado por texto literal "RAZER SEIREN V3 CHROMA" visible en una de las capturas). El índice de DuckDuckGo está dominado por el Chroma para esta búsqueda independientemente del texto usado. **✅ RESUELTO el mismo día**: descargada la imagen oficial directamente del CDN de Razer (medias-p1.phoenix.razer.com, `seiren-v3-pro-black-500x500.png`) y procesada con Sharp (fondo #F9FAFB, 1200x675 + thumb 400x225) replicando el método de `imageCollector.js`. Ya en disco
  - Nota: 2 de los 9 obtenidos (`asus-rog-strix-scar-18`, `cherry-kc-6000-slim`) son fotos genéricas de la marca/línea de producto, no necesariamente la foto exacta del modelo — aceptable pero no 100% verificado
- `doble-monitor-teletrabajo-merece-la-pena` ya tenía imagen (generada con el compositor, ver nota arriba) — sin pendiente
- adata-urban-tapsafe: sigue sin tocar, esperando disponibilidad real del producto (no incorporado al calendario)
- Workflow automático: `.github/workflows/publicar-automatico.yml` — Dom/Mar/Jue, programado a las 5:35 UTC (7:35 CEST / 6:35 CET); lee calendario y publica solo si hay entrada para hoy; notifica a Discord en caso de error
- Ventana de publicación ajustada a 9:00-14:00 el 2026-06-18 (antes 9:00-11:00): los eventos `schedule` de GitHub Actions reciben prioridad de cola más baja que `push`/`workflow_dispatch`. `auto-publisher.js` no depende de la hora, solo de la fecha. **Corregido 2026-06-23**: el retraso real observado en el histórico de runs (16/06→18/06, 18/06→21/06) es de **2-3 días**, no de 4-7 horas como se documentó inicialmente — la estimación de horas quedó obsoleta. El run del 23/06 sí se ejecutó el mismo día (08:44 UTC, ~3h de retraso sobre el cron de las 5:35 UTC), así que el retraso es variable e impredecible, no hay un patrón fiable
- PENDIENTE: notifier.js no tiene lógica para disparar el recordatorio de domingo el sábado anterior a las 20:00 — checkPublicationReminders() solo actúa los días 2, 3 y 4 (mar, mié, jue). Para guías dominicales el recordatorio del sábado debe implementarse manualmente o extender la función.

### Bug crítico encontrado, corregido y RESUELTO 2026-06-23: el calendario de `main` se quedaba congelado y dejaba de tener entradas futuras

`publicar-automatico.yml` hace `checkout` de `main` y `auto-publisher.js` lee el calendario **desde esa copia**, no desde `develop`. El workflow solo copia a `main` el artículo y la imagen del día publicado — nunca el archivo `calendario-publicaciones.json` completo. Resultado: cualquier edición del calendario hecha en `develop` (nuevas fechas, reordenaciones, altas/bajas de borradores) no tenía ningún efecto en producción hasta el siguiente merge manual completo `develop → main`.

**Detectado al revisar la publicación de Razer Pro Click (23/06)**: el calendario de `main` solo tenía 9 entradas, hasta el 07/07 — le faltaban las 13 entradas siguientes (09/07 → 11/08) que ya existían en `develop`, incluido el desplazamiento de `airra-labs-rotary-mouse` aplicado ese mismo día. A partir del 09/07, `auto-publisher.js --check` no habría encontrado ninguna entrada para esa fecha y habría devuelto `status: skip` — sin error, sin notificación a Discord, simplemente sin publicar nada, de forma indefinida.

**✅ RESUELTO** — sincronizado `fitzdesk-monitor/data/calendario-publicaciones.json` de `develop` a `main` (commit `bdbf079`, vía worktree aislado, solo ese archivo — verificado con `git show --stat`). `main` ya tiene las 22 entradas completas hasta el 11/08.

**✅ Automatizado 2026-06-23, para que no vuelva a ocurrir**: nuevo paso "Sincronizar calendario desde develop" en `publicar-automatico.yml`, justo después de "Setup Node.js" y antes de "Comprobar calendario". En cada ejecución (incluidos los días sin publicación), sobrescribe la copia local de `calendario-publicaciones.json` con la versión de `develop` antes de leerla — así `auto-publisher.js --check` nunca vuelve a usar datos desfasados, aunque `main` no se haya sincronizado todavía. Si la versión de `develop` difiere de la que hay commiteada en `main`, el paso también la sube a `main` (mismo patrón que el paso 6b, que ya sincroniza develop tras publicar). `develop` queda así como única fuente de verdad real del calendario; la copia en `main` se mantiene al día automáticamente pero ya no es necesaria para que el sistema funcione bien.

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
- Última publicación: 2026-07-16 — "Logitech Mobi Fold: ratón compacto plegable para teletrabajo móvil" (analisis) — publicado automáticamente vía workflow. Instagram publicado. Facebook manual
- 2026-07-14 — "ASUS ROG Strix SCAR 18: potencia de sobremesa en formato portátil" (analisis) — publicado automáticamente vía workflow. Instagram publicado. Facebook manual
- 2026-07-12 — "Muñeca dolorida al trabajar: qué periféricos ergonómicos necesitas" (guia) — publicado automáticamente vía workflow. Instagram publicado (carrusel de guía personalizado). Facebook manual
- 2026-07-09 — "AOC Q27P3CV: el monitor QHD USB-C que desbanca a los referentes" (analisis) — publicado automáticamente vía workflow
- 2026-07-07 — "HP 935 Creator Wireless: el ratón multi-dispositivo para pantallas 4K" (analisis) — publicado automáticamente vía workflow
- 2026-07-02 — "Corsair Clipper Pro Mini 60: teclado mecánico compacto e inalámbrico" (lanzamiento) — publicado automáticamente vía workflow
- 2026-06-30 — "Intel Wildcat Lake: portátiles ultrafinos sin ventilador" (lanzamiento) — publicado automáticamente vía workflow
- 2026-06-28 — "Monitor 4K vs Full HD para teletrabajo: ¿merece la pena en 2026?" (guia) — publicado automáticamente vía workflow
- 2026-06-25 — "Logitech K380: el teclado compacto para los que trabajan desde cualquier sitio" (analisis) — publicado automáticamente vía workflow. Instagram correcto. Facebook bloqueado por el revisor (bug GROQ_API_KEY, corregido). Usuario publicó Facebook a mano
- 2026-06-23 — "Razer Pro Click: el ratón profesional de Razer que olvida los LEDs" (analisis) — primera publicación que confirma el fix del bug de deploy funcionando de extremo a extremo
- 2026-06-18 — "HP ProBook 455 G10: AMD Ryzen empresarial sin precio empresarial" (analisis)
- 2026-06-16 — "Samsung S27A600NAU: QHD de 27\" sin USB-C pero sin compromisos en imagen" (analisis)
- 2026-06-14 — "Mejor ratón para teletrabajo según tu presupuesto en 2026" (guia)
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
- Antes de comprobar el calendario, sincroniza `fitzdesk-monitor/data/calendario-publicaciones.json` desde `develop` (fuente real de verdad) — evita que `main` se quede con una copia desfasada (bug detectado y corregido 2026-06-23)
- Lee `fitzdesk-monitor/data/calendario-publicaciones.json`, busca entrada para hoy
- Si hay publicación: obtiene el borrador desde `develop`, elimina `borrador: true`, renombra el archivo y hace push a `main` (dispara deploy automáticamente)
- Si falta imagen o frontmatter inválido: notifica a Discord y no publica
- Para probar: GitHub → Actions → Publicar automático FitzDesk → Run workflow → `fecha_override: YYYY-MM-DD`
- Script helper: `fitzdesk-monitor/auto-publisher.js` (modos `--check` y `--process`)
- Tras publicar en `main`, sincronizar `develop` y antes de notificar a Discord: ejecuta `socialPublisher.js` (ver sección siguiente)

## Publicación en redes sociales — Instagram y Facebook (2026-06-22)

- Script: `fitzdesk-monitor/socialPublisher.js` — `node socialPublisher.js --slug [slug]` (real) / `--test --slug [slug]` (no publica nada, muestra captions + comprueba secrets sin revelarlos)
- Integrado como step "Publicar en redes sociales" en `publicar-automatico.yml`, justo después de sincronizar `develop` y antes de las notificaciones de Discord — solo corre si la publicación a `main` fue exitosa (`if: ... && success()`), timeout de 2 minutos
- **Instagram**: publica un **carrusel de 4 slides** (añadido 2026-06-24, ver detalle abajo) vía Graph API v25.0 — por cada slide, `POST /{INSTAGRAM_ACCOUNT_ID}/media` con `is_carousel_item: true` (sin publicarlo individualmente), se espera a que cada uno esté `FINISHED`, luego `POST /{INSTAGRAM_ACCOUNT_ID}/media` con `media_type: 'CAROUSEL'` + `children: [4 ids]` + el caption, se espera a que ese contenedor también esté listo, y por último `POST /.../media_publish` con su `creation_id`. **Corregido 2026-06-23**: el ID de cuenta antes se obtenía en tiempo real con `GET /me?fields=id,name`, que devuelve el ID del propietario del token (no necesariamente la cuenta de Instagram Business) — bug real, confirmado en el código. Ahora usa directamente el secret `INSTAGRAM_ACCOUNT_ID`, sin llamada adicional
- **Facebook**: **desactivado en el pipeline automático** desde 2026-06-26 — `const FACEBOOK_ENABLED = false` en `socialPublisher.js`, igual que Pinterest. El usuario publica a mano pegando la URL del artículo en Facebook, que genera la vista previa automáticamente a partir de los `og:` tags (`og:image`/`og:title`/`og:description` ya correctos en `BaseLayout.astro`). Motivo: los posts publicados vía API (token del Usuario del Sistema "FitzDesk Monitor") no son visibles para usuarios no-administradores — posts manuales sí son visibles. Activar `FACEBOOK_ENABLED = true` cuando se resuelva el bug del tipo de token (System User vs. token de acceso de Página normal)
- **Imagen de Facebook**: `socialImageGenerator.js` genera, con Sharp + un overlay SVG (sin canvas), `[slug]-facebook.webp` (1200x630) a partir de la imagen original del artículo — franja naranja `--color-primary` (#F97316) de 120px, "FitzDesk" en blanco a la izquierda y el título (truncado a 60 caracteres + "...") en blanco a la derecha. Usa la fuente del sistema disponible (sin fuente bundleada) vía `font-family="Arial, sans-serif"` en el SVG. Su función `generateInstagramImage()` (1080x1080, mismo método) quedó **sustituida 2026-06-24** por `instagramImageGenerator.js` (ver siguiente punto) — sigue en el archivo pero ya no la usa `socialPublisher.js`
- **Carrusel de Instagram, 4 slides (2026-06-24)**: `instagramImageGenerator.js` usa **Puppeteer** (Chromium headless) para renderizar 4 plantillas HTML/CSS distintas y capturarlas como `[slug]-instagram-1.png` a `-4.png`, todas 1080x1350 (4:5):
  1. **Gancho visual** — igual que la imagen única anterior: producto a pantalla completa, degradado inferior, logo, badge de categoría, título a 2 líneas, puntuación (mismo color por tramos que `ScoreBox.astro`) y precio
  2. **Lo mejor** — fondo `#1F2937`, título "✅ Lo mejor" en naranja, hasta 4 pros con icono ✅
  3. **Lo mejorable** — mismo fondo, título "⚠️ Lo mejorable" en **blanco** (a propósito, distinto del naranja del slide 2), hasta 3 contras con icono ⚠️
  4. **Veredicto de Fitz** — fondo naranja `#F97316`, icono 🐿️ grande, "Veredicto de Fitz" como subtítulo, frase de veredicto a 2 líneas, puntuación final grande y "fitzdesk.com"
- **Extracción de pros/contras/veredicto**: primero se comprueba el frontmatter (campos `lo_mejor`/`lo_mejorable`/`fitzQuote`, poco habituales en el esquema actual); si no están, se **parsean directamente las secciones Markdown** `## Lo mejor` / `## Lo mejorable` / `## Fitz recomienda` del cuerpo del artículo (rápido, gratuito, sin IA — estas secciones existen de forma consistente en los análisis ya publicados); solo si ese parseo no encuentra nada se generan/condensan con Groq como último recurso. El veredicto siempre se condensa con Groq a una frase de ≤2 líneas a partir de la sección "Fitz recomienda" (la sección original es varios párrafos, demasiado larga para el slide), con fallback a la primera frase disponible si Groq falla
- La imagen original se embebe en cada plantilla como `data:` URI (sin servir archivos por `file://`). Chromium se lanza con `--no-sandbox --disable-setuid-sandbox` (necesario en runners de GitHub Actions). Probado en local y en una simulación completa de checkout limpio + `npm ci --omit=dev`, incluida la extracción con Groq
- La imagen de Facebook (`socialImageGenerator.js`, Sharp) y el carrusel de Instagram (`instagramImageGenerator.js`, Puppeteer) se generan **bajo demanda** desde `socialPublisher.js` (`ensureFacebookImage()` / `ensureInstagramCarousel()`) si no existen todavía — no hace falta ejecutarlos a mano en el flujo normal, solo para pruebas o regeneración manual: `node socialImageGenerator.js --slug [slug]` (Facebook) / `node instagramImageGenerator.js --slug [slug]` (Instagram, genera los 4 slides de golpe)
- **Ajustes visuales del carrusel (2026-06-24)**: `autofitLineClamp()` reduce el `font-size` del título (slide 1, 58→36px) y del veredicto (slide 4, 50→28px) mientras el texto desborde su caja (`scrollHeight > clientHeight`, técnica estándar para detectar recorte con `-webkit-line-clamp`), ampliando de 2 a 3 líneas como último recurso antes de dejar que la elipsis de CSS corte. Slides 2 y 3 centrados verticalmente (`justify-content: center`). Slide 1 con degradado oscuro también arriba (no solo abajo) para tapar el texto de marca que trae la foto original de fondo
- **Bug real encontrado y corregido durante la verificación**: en `autofitVerdict()`, cuando una frase candidata no cabía, el bucle hacía `break` sin volver a fijar en el DOM el último texto que sí cabía — se quedaba puesto el candidato fallido (probado en el DOM antes de comprobar si encajaba), y el recorte de `-webkit-line-clamp` acababa cortando esa versión larga a media palabra con "…", justo el problema que se quería evitar. Corregido fijando siempre `truncated || sentences[0]` al final de la función, independientemente de en qué frase se detuvo el bucle
- **Mejoras visuales adicionales (2026-06-24)**: degradado superior del slide 1 reforzado (560px, negro opaco hasta el 75%) tras comprobar que la versión anterior dejaba un resto visible del texto de marca de la foto de fondo. Slides 2 y 3 con tres elementos nuevos para llenar el espacio vacío: (1) frase explicativa en gris claro `#9CA3AF` bajo cada pro/contra, generada con Groq a partir del contenido del artículo (`explainItemsWithGroq()`) con fallback a frases genéricas por tipo si Groq falla o el punto es el placeholder de "sin pros/contras"; (2) numeración "2/4" / "3/4" / "4/4" arriba a la derecha en slides 2, 3 y 4; (3) texto "Desliza →" centrado sobre el logo en slides 2 y 3 (no en el 4, que es el último)
- **Captions generados con IA (2026-06-24)**: `socialPublisher.js` genera el texto de Instagram y Facebook con Groq (`llama-3.3-70b-versatile`, mismo modelo que `analyzer.js`) a partir del frontmatter y el cuerpo del artículo, con una estructura distinta por red (Instagram: gancho + beneficios cortos + veredicto de Fitz + CTA fija + máx. 5 hashtags: Facebook: párrafo introductorio + 3-4 puntos clave + pregunta para comentarios + máx. 2 hashtags, sin URL inventada por la IA — el enlace real se añade después en código). **Si Groq falla o no devuelve nada, cae automáticamente a las plantillas fijas anteriores** (`buildInstagramCaption()`/`buildFacebookCaption()`) en vez de bloquear la publicación — verificado simulando una `GROQ_API_KEY` inválida
- **Bug conocido de Groq mitigado**: el modelo mezcla ocasionalmente algún carácter CJK suelto en medio de palabras en español (visto en vivo durante las pruebas: "te伴e" en vez de "te acompañe" — mismo tipo de fallo ya documentado para borradores de `analyzer.js`). `stripStrayCjk()` los elimina como red de seguridad antes de publicar cualquier caption generado con IA
- **Prompt de frases explicativas mejorado (2026-06-24)**: el prompt de `explainItemsWithGroq()` (slides 2 y 3) generaba frases mecánicas que repetían el punto técnico con otras palabras ("Rueda menos fluida causa frustración"). Reescrito con reglas explícitas (céntrate en el impacto real, no en el dato técnico; máximo 8 palabras; no repitas palabras del punto) y ejemplos buenos/malos — verificado en vivo: "Si eres zurdo busca otra", "La rueda se atasca un poco"
- **Refactor (2026-06-24)**: la carga de artículo y la generación de captions con Groq (antes duplicadas en `socialPublisher.js`) se movieron a un módulo nuevo, `socialContent.js`, para que tanto `socialPublisher.js` como `socialReviewer.js` puedan reutilizarlas sin crear una dependencia circular entre ambos (el reviewer necesita generar el mismo contenido que el publisher para su modo CLI en solitario, y el publisher necesita llamar al reviewer antes de publicar)
- **Bug real corregido durante el refactor**: la plantilla de respaldo de Instagram (`buildInstagramCaption()`, usada solo si Groq falla) tenía 6 hashtags fijos, violando la regla de máximo 5 que el propio reviewer comprueba — si Groq fallaba, el reviewer habría bloqueado la publicación intentando corregir un texto que también necesitaba Groq (que ya sabíamos que no estaba disponible). Reducido a 5 hashtags
- **Carrusel de guías personalizado (2026-06-26)**: los artículos `tipo: "guia"` generan slides 2 y 3 temáticamente específicos en vez de "Lo mejor"/"Lo mejorable" (que no existen en guías). `getGuideCarouselContent()` (nueva función en `instagramImageGenerator.js`) pide a Groq dos grupos de puntos clave con heading e icono propios, usando el contenido completo del artículo como contexto — por ejemplo, para la guía 4K vs Full HD: slide 2 "Cuándo merece la pena el 4K" y slide 3 "Cuándo el Full HD es suficiente". Fallback doble: Groq falla → parse de secciones "Cuándo SÍ/NO" del Markdown → placeholder genérico. `socialReviewer.js` omite `getCarouselContent()` para guías (igual que ya hacía con ofertas), sin gastar tokens en el flujo que no aplica. La plantilla de respaldo `buildFacebookCaption()` incluye ahora una pregunta de comentarios hardcodeada, de modo que el revisor la acepta sin necesitar Groq para corregirla — elimina el bloqueo permanente cuando ambos (generación + corrección) fallan a la vez

### Agente de revisión antes de publicar — socialReviewer.js (2026-06-24)

`fitzdesk-monitor/socialReviewer.js` revisa imágenes y textos antes de que `socialPublisher.js` llame a la API de Meta. Prueba en solitario: `node socialReviewer.js --slug [slug]` (genera captions de prueba con Groq, revisa, no publica nada).

- **Imágenes de Instagram (programático, sin IA)**: para los 4 PNG, comprueba que existen, que son exactamente 1080x1350 (`sharp`), que pesan entre 50KB y 2MB, y que los magic bytes corresponden a PNG real (no solo la extensión del archivo). Si alguna falla, regenera el carrusel completo con `generateInstagramCarousel()` y vuelve a comprobar una vez — verificado corrompiendo deliberadamente un slide y confirmando la regeneración automática. Si sigue fallando tras regenerar, bloquea
- **Textos — diseño híbrido, no "todo con Groq" pese al enunciado de la tarea**: las comprobaciones mecánicas (URLs, nº de hashtags, puntuación final, caracteres CJK/raros, presencia de pregunta o enlace) se hacen con regex en código — más fiable que pedirle a un LLM que cuente caracteres, que puede fallar el conteo. Groq se reserva para lo que el código no puede juzgar: si el tono es cercano y no genérico (`judgeToneWithGroq()`, no bloqueante, solo informativo en el reporte) y para reescribir el texto cuando una comprobación mecánica falla (`fixCaptionWithGroq()`)
- **Instagram**: gancho en la primera línea, sin URLs, máximo 5 hashtags, sin caracteres raros (bloqueantes si Groq no logra corregirlos); frases explicativas no genéricas y veredicto del slide 4 terminado en punto (informativos, no bloquean — corregirlos significaría regenerar las imágenes, no solo el texto); tono coherente con FitzDesk (informativo)
- **Facebook**: pregunta para comentarios, enlace completo al artículo (`https://fitzdesk.com/articulo/[slug]` — **corregido para comprobar la URL completa, no solo el prefijo**, tras detectar en pruebas que permitía un enlace roto sin slug si Groq lo truncaba), máximo 2 hashtags, sin caracteres raros (bloqueantes); no idéntico al de Instagram via similitud de palabras (Jaccard, informativo)
- **Si un fallo mecánico no se puede corregir** (p. ej. `GROQ_API_KEY` no configurada o Groq caído) → bloquea la publicación de esa red y `socialPublisher.js` notifica a Discord con el motivo concreto, sin publicar nada — verificado simulando ausencia de Groq
- **Integración en `socialPublisher.js`**: genera el caption y las imágenes primero, luego llama a `reviewBeforePublish()` con ese contenido exacto (no se genera dos veces, así lo que se revisa es literalmente lo que se va a publicar) y usa el caption que devuelve (corregido o no) para la llamada real a la API. Si la revisión bloquea, no se intenta publicar en absoluto
- **Limitación conocida**: las frases explicativas y el veredicto que revisa el texto se obtienen llamando de nuevo a `getCarouselContent()` (mismo Groq, mismo prompt) en vez de recibir literalmente el texto ya horneado en los píxeles del PNG ya generado — por la no-determinismo de Groq, en teoría podría revisar un texto ligeramente distinto al que ya quedó renderizado en la imagen si esta no se regeneró en la misma ejecución. Aceptado como simplificación razonable; no afecta a Facebook ni a las comprobaciones mecánicas de Instagram
- **Pinterest**: preparado en el código (`publishPinterest()`, `buildPinterestDescription()`) pero **desactivado** — `const PINTEREST_ENABLED = false` al inicio del archivo. **Activado brevemente y revertido el mismo día (2026-06-23)**: se probó activarlo, pero queda aparcado hasta conseguir la aprobación del scope `pins:write` en la API de Pinterest. No depende solo de los secrets — sin ese scope aprobado, las llamadas a la API fallarían aunque `PINTEREST_ACCESS_TOKEN`/`PINTEREST_BOARD_ID` existieran
- Manejo de errores: si Instagram falla, se notifica a Discord con el error — nunca falla en silencio. Facebook y Pinterest no participan en la comprobación de éxito/fallo (ambos desactivados)
- **Notificación de éxito a Discord (2026-06-24)**: hasta ahora, si la publicación salía bien no se avisaba de nada (solo quedaba en los logs de GitHub Actions) — detectado porque el usuario nunca veía confirmación de los éxitos, solo los fallos. `notifyDiscordSuccess()` notifica en cuanto **al menos una red** publique correctamente, con el id de cada red que tuvo éxito y el motivo concreto de la que falló (si alguna falló) — así nunca hay que mirar los logs para confirmar una publicación
- **Cuidado al probar `socialPublisher.js` sin `--test` en local**: si el `.env` local tiene un `DISCORD_WEBHOOK_URL` real configurado (para otras pruebas), cualquier ejecución real sin los tokens de Instagram/Facebook configurados dispara una notificación de fallo real al Discord de producción, aunque no se publique nada — pasó durante el desarrollo de esta función. Usar `--test` para probar el flujo sin ese efecto secundario
- Lee `title`, `descripcion` y `categoria` directamente del frontmatter del artículo ya publicado (no requiere pasar esos datos por el workflow) — solo necesita el slug
- Secrets usados: `INSTAGRAM_ACCESS_TOKEN`, `INSTAGRAM_ACCOUNT_ID`, `INSTAGRAM_APP_ID`, `INSTAGRAM_APP_SECRET`, `FACEBOOK_PAGE_ACCESS_TOKEN`, `FACEBOOK_PAGE_ID`, `GROQ_API_KEY` (mismo secret que ya usaba `analyzer.js`, reutilizado 2026-06-24 para los captions); `PINTEREST_ACCESS_TOKEN`/`PINTEREST_BOARD_ID` referenciados en el workflow pero todavía no creados como secrets (esperado, generan aviso benigno del linter del IDE)
- **Nueva dependencia 2026-06-24**: `puppeteer` (Chromium headless completo, ~150-300MB) añadido a `fitzdesk-monitor/package.json` solo para `instagramImageGenerator.js`. Aumenta el tiempo de `npm ci --omit=dev` en los workflows — los pasos ya existentes ("Instalar dependencias del monitor") no necesitan cambios, pero tardarán más
- **Sin idempotencia**: el script no comprueba si un artículo ya se publicó antes en Instagram. Relanzarlo para el mismo slug vuelve a publicar en Instagram. `--only instagram` permite relanzar solo Instagram sin riesgo de duplicar nada en Facebook (que está desactivado). `--only facebook` existe en el código pero es no-op mientras `FACEBOOK_ENABLED = false`

### ✅ RESUELTO 2026-06-24: primera publicación real confirmada en Instagram y Facebook

Tras activar el publisher (22/06) y corregir los bugs de código (23/06 — `INSTAGRAM_ACCOUNT_ID`, endpoint `/feed`, `npm ci` faltante), las pruebas reales seguían fallando. Dos causas adicionales, ambas de configuración en el lado de Meta, no de código:

1. **Instagram — "Media ID is not available" (código 9007)**: `media_publish` se llamaba justo después de crear el contenedor, sin esperar a que Instagram terminara de descargar/procesar la imagen. **Corregido en código**: nueva función `waitForContainerReady()` que sondea `status_code` hasta `FINISHED` (máx. ~20s) antes de publicar.
2. **Facebook — error `(#200)` de permisos, persistente incluso con un token con todos los scopes concedidos** (`pages_read_engagement`, `pages_manage_posts` confirmados vía `/me/permissions`). Tras descartar rol de app, acceso a página y vínculo Business Manager (todo correcto), la causa real era que **`FACEBOOK_PAGE_ID` guardado en GitHub no era el ID correcto de la página** — el error `(#200)` de Meta es genérico y no distingue "permiso insuficiente" de "ID de página equivocado". Resuelto obteniendo el ID real (`1097597110114567`) vía `GET /me/accounts` con un token de Usuario del Sistema, y actualizando el secret.
3. De paso, se migró de un token personal (Graph API Explorer, con el problema recurrente de que el desplegable "página" revertía solo a "usuario") a un **Usuario del Sistema de Business Manager ya existente** ("FitzDesk Automatización", con Página + App + Instagram ya asignados con acceso total) — más robusto para automatización porque no caduca como un token personal. `FACEBOOK_PAGE_ACCESS_TOKEN` e `INSTAGRAM_ACCESS_TOKEN` actualizados con un token de ese Usuario del Sistema.

**Confirmado**: ejecución de `publicar-en-redes.yml` del 2026-06-24 08:32 UTC completada con éxito, publicación real verificada en ambas redes para `razer-pro-click-analisis`.

### ❌→✅ Bug real encontrado 2026-06-25: la publicación de Logitech K380 en redes falló (bloqueada por el revisor), causa real distinta de lo que parecía

La publicación automática del 25/06 (`logitech-k380-analisis`) llegó a Discord con un aviso de fallo: *"La revisión automática bloqueó la publicación... No se pudo corregir el texto de Facebook: GROQ_API_KEY no configurada — no se puede corregir automáticamente"*. El paso "Publicar en redes sociales" del workflow había terminado con conclusion `success` a nivel de GitHub Actions (el proceso no se cuelga ni revienta cuando el revisor bloquea una red, solo lo registra y notifica) — por eso parecía que todo había ido bien hasta que el usuario confirmó que no había nada publicado en Facebook/Instagram.

**Causa real**: ni `publicar-automatico.yml` ni `publicar-en-redes.yml` pasaban `GROQ_API_KEY` en el bloque `env:` del step "Publicar en redes sociales" — pese a que `GROQ_API_KEY` es un secret que ya existe en el repo (usado por `monitor.yml`). El caption de Facebook se generó con Groq sin problema en pasos anteriores del propio script (con fallback a plantilla si fallara), pero cuando `socialReviewer.js` detectó algo corregible solo con Groq (`fixCaptionWithGroq()`) y lo intentó, `process.env.GROQ_API_KEY` era `undefined` en ese step concreto — `callGroq()` lanza esa excepción exacta cuando no hay cliente Groq instanciado. Esto explica por qué el 23/06 con `razer-pro-click-analisis` sí funcionó (la plantilla de esa vez pasó todas las comprobaciones mecánicas sin necesitar el arreglo de Groq) y el 25/06 con K380 no.

**No se pudo ver el log real del job** para diagnosticar esto directamente: la API de GitHub exige permisos de administrador del repo para descargar logs de Actions, y no había `gh` CLI ni token configurado en el entorno de trabajo. Diagnosticado en su lugar a partir del texto exacto del aviso de Discord que pegó el usuario, y confirmado leyendo el bloque `env:` de ambos workflows.

**Corregido**: añadida la línea `GROQ_API_KEY: ${{ secrets.GROQ_API_KEY }}` al bloque `env:` del step "Publicar en redes sociales" en ambos workflows (`publicar-automatico.yml` y `publicar-en-redes.yml`).

### Segundo bug encontrado el mismo día, tras corregir el primero: Groq sin reintentos ante fallos de red transitorios

Con `GROQ_API_KEY` ya bien configurada, el usuario relanzó `publicar-en-redes.yml` para `logitech-k380-analisis` y volvió a bloquearse — esta vez con `Invalid response body while trying to fetch https://api.groq.com/openai/v1/chat/completions: Premature close`. El log completo (pegado por el usuario) mostró que **todas** las llamadas a Groq de esa ejecución fallaron con el mismo error (caption de Instagram, caption de Facebook, veredicto del carrusel, explicaciones de pros y de contras, dos veces cada una) — la firma clásica de un socket keep-alive que el servidor ya cerró pero el cliente intenta reutilizar, un problema conocido del `fetch` de Node en entornos de corta vida como los runners de GitHub Actions. Sin ningún reintento, un solo parpadeo de red bloqueaba la publicación entera.

**De paso, se encontró que había 3 clientes Groq duplicados** en el monitor (`socialContent.js`, `instagramImageGenerator.js`, `socialReviewer.js`), cada uno con su propia copia casi idéntica de la llamada a `groqClient.chat.completions.create(...)`. Aprovechando la corrección, se centralizó todo en `callGroq()` de `socialContent.js` — `instagramImageGenerator.js` y `socialReviewer.js` ya no instancian su propio cliente Groq, solo importan y usan `callGroq()`.

**Corregido**: `callGroq()` ahora reintenta hasta 3 veces (backoff 500ms/1000ms) solo ante errores de red transitorios reconocidos (`premature close`, `econnreset`, `fetch failed`, `socket hang up`) — errores no transitorios (como `GROQ_API_KEY no configurada`) siguen fallando inmediatamente sin reintentar, ya que reintentar no solucionaría nada. Verificado con 3 casos simulados (se recupera tras fallos transitorios, agota intentos y lanza el error si persiste, no reintenta errores no transitorios) — no se pudo probar contra la API real de Groq sin gastar cuota.

**No se pudo ver el log real del job** para diagnosticar el primer bug directamente: la API de GitHub exige permisos de administrador del repo para descargar logs de Actions, y no había `gh` CLI ni token configurado en el entorno de trabajo. Diagnosticado en su lugar a partir del texto exacto del aviso de Discord que pegó el usuario, y confirmado leyendo el bloque `env:` de ambos workflows. El segundo bug se diagnosticó igual, a partir del log completo que pegó el usuario.

### Tercer y cuarto bug del mismo día, tras corregir los dos anteriores: ambas redes fallaron por motivos distintos, ninguno de Groq

Con los dos bugs anteriores corregidos, el usuario relanzó otra vez y llegaron dos errores nuevos, esta vez reales de la API de Meta:

1. **Instagram — error 9004/2207052, "Only photo or video can be accepted as media type"**: Meta no pudo descargar `https://fitzdesk.com/images/redes/logitech-k380-analisis-instagram-1.png`. Confirmado con `curl -I` que esa URL daba **404** en producción. Causa raíz: el carrusel de Instagram se genera bajo demanda en el propio runner de GitHub Actions (`instagramImageGenerator.js`, dentro de `ensureInstagramCarousel()` en `socialPublisher.js`), pero **ningún workflow comiteaba ni desplegaba esas imágenes** — vivían solo en el filesystem efímero del runner y desaparecían al terminar el job. Meta intentaba descargar una URL que nunca llegó a existir en el sitio real.
2. **Facebook — error `(#100)` "Only owners of the URL have the ability to specify the picture, name, thumbnail or description params"**: `publishFacebook()` enviaba un parámetro `picture` propio al `POST /feed`. Meta solo permite sobreescribir ese campo si el dominio está verificado como propio en Meta Business Manager (verificación de dominio, distinta de la verificación de Search Console) — algo que FitzDesk no tiene configurado.

**Corregido (Facebook, simple)**: eliminado el parámetro `picture` (y la generación de la imagen de Facebook que ya no se usaba para nada) de `publishFacebook()` en `socialPublisher.js`. FitzDesk ya tiene `og:image`/`og:title`/`og:description` correctos en cada artículo (`BaseLayout.astro`), así que Facebook genera la vista previa solo a partir del `link`, sin necesitar ningún override ni verificación de dominio.

**Corregido (Instagram, más complejo)**: tanto `publicar-en-redes.yml` como `publicar-automatico.yml` ahora, antes de llamar a `socialPublisher.js`: generan el carrusel (`instagramImageGenerator.js --slug ...`), lo comitean y empujan a `main`, **disparan `deploy.yml` explícitamente con `gh workflow run`** (el push hecho con el `GITHUB_TOKEN` automático no dispara el `workflow_run` de otro workflow por sí solo) y esperan con `gh run watch` a que el deploy termine, y por último comprueban con `curl` que las 4 URLs del carrusel devuelven `200` antes de seguir. Si algo de esto falla o tarda más de los tiempos de espera fijados (∼5 min para el deploy, ∼2.5 min para la propagación), el job falla con un mensaje claro en vez de llamar a Meta con URLs rotas. Requiere permiso `actions: write` añadido a ambos workflows (antes solo tenían `contents`).

**No se pudo probar el flujo completo de extremo a extremo** (generar → comitear → desplegar → publicar) desde este entorno de trabajo, al no poder lanzar `workflow_dispatch` sin `gh` CLI/token local — verificado en su lugar: sintaxis YAML válida de ambos workflows, sintaxis JS válida de `socialPublisher.js`, build de Astro sin errores, y `node socialPublisher.js --test --slug logitech-k380-analisis` en local confirma que el caption de Facebook ya no menciona ninguna imagen propia y que Groq sigue funcionando bien tras el fix de reintentos.

**✅ RESUELTO Y CONFIRMADO 2026-06-25**: el usuario re-ejecutó `publicar-en-redes.yml` con `slug: logitech-k380-analisis` y confirmó publicación correcta en ambas redes. Los 4 bugs encontrados y corregidos en una sola tarde (GROQ_API_KEY faltante en el `env:` del workflow, sin reintentos ante fallos de red transitorios de Groq, carrusel de Instagram nunca desplegado antes de llamar a Meta, y el override `picture` de Facebook bloqueado por falta de verificación de dominio) quedan todos verificados de extremo a extremo, no solo en teoría.

**Nota de limpieza anterior ya resuelta**: el `console.log` de depuración del token de Facebook que se mencionaba aquí ya no está en el código (comprobado el 2026-06-25) — esta nota quedaba desactualizada.

### Bug crítico encontrado y corregido 2026-06-23: "Publicar en redes sociales" nunca había funcionado de verdad

`socialPublisher.js` usa `dotenv` y `gray-matter`, que no son built-ins de Node. `publicar-automatico.yml` nunca tuvo un paso `npm install`/`npm ci` para `fitzdesk-monitor` — el checkout no incluye `node_modules` (gitignored). Resultado: el step "Publicar en redes sociales" fallaba siempre con `ERR_MODULE_NOT_FOUND: Cannot find package 'dotenv'`, **independientemente de si los secrets existían o no**. No hay ningún registro en este documento de una publicación real confirmada en Instagram/Facebook (con ID de respuesta) desde que se integró el 22/06 — consistente con que nunca llegó a ejecutarse con éxito.

**Detectado** al intentar republicar manualmente `razer-pro-click-analisis` vía `workflow_dispatch` con `fecha_override`. Reproducido localmente simulando el checkout limpio de CI (`git archive origin/main` + sin `node_modules`): el script revienta en el `import 'dotenv/config'` antes de llegar siquiera a comprobar los secrets.

**✅ RESUELTO**: añadido el paso "Instalar dependencias del monitor" (`npm ci --omit=dev` en `fitzdesk-monitor/`) justo antes de "Publicar en redes sociales" en `publicar-automatico.yml`. Verificado localmente con una simulación completa del checkout de CI + `npm ci`: el script ya carga el artículo y genera los captions correctamente (faltan solo los secrets, que sí existen en GitHub Actions).

### Bug relacionado encontrado el mismo día: relanzar el workflow para un día ya publicado falla siempre

`auto-publisher.js --check` no distingue si la entrada del calendario ya tiene `publicado: true` — solo mira si hay una entrada para la fecha. Al relanzar `publicar-automatico.yml` con `fecha_override` sobre un día ya publicado, el paso "Obtener borrador e imagen desde develop" intenta hacer `git checkout origin/develop -- src/content/articulos/borrador-[slug].md`, pero ese archivo ya no existe (fue renombrado sin el prefijo `borrador-` al publicarse la primera vez) → falla siempre con el mismo error. No es un fallo puntual, se repetirá en cualquier reintento futuro sobre una fecha ya publicada.

**Solución aplicada — workflow nuevo en vez de tocar `auto-publisher.js`**: `.github/workflows/publicar-en-redes.yml`, disparable manualmente (`workflow_dispatch`, input `slug`), que solo ejecuta `socialPublisher.js --slug [slug]` sobre el artículo ya publicado en `main` — sin pasar por el calendario ni por `auto-publisher.js`. Sirve para republicar en redes sociales (o publicar la primera vez si el pipeline automático falló en ese paso) sin arriesgar el resto del pipeline de contenido. Uso: GitHub → Actions → "Publicar en redes sociales (manual)" → Run workflow → introducir el slug ya publicado (sin prefijo `borrador-`).

## Comprobación de indexación en Google — indexingChecker.js (2026-06-25)

`fitzdesk-monitor/indexingChecker.js` — comprueba qué artículos publicados (sin `borrador: true`) están indexados en Google, usando la **URL Inspection API** de Search Console (`urlInspection.index.inspect`, de solo lectura).

- **Uso**: `node indexingChecker.js` (solo informe) / `node indexingChecker.js --fix` (informe + reenvía el sitemap si hay pendientes)
- **Clasificación por URL**: ✅ Indexada (`verdict: PASS`) · ⏳ Rastreada pero no indexada (`coverageState` contiene "crawled" + "not indexed") · ❌ Descubierta pero no indexada (`coverageState` contiene "discovered") · 🔴 Error (bloqueada por robots.txt/meta noindex, o fallo de API)
- **Por qué no hay "solicitar indexación" real vía API (decisión consultada con el usuario antes de implementar)**: la API de Indexación de Google (`indexing.googleapis.com`) está restringida por los términos de servicio de Google a contenido tipo JobPosting o BroadcastEvent — usarla para artículos de blog normales incumpliría esos términos y podría acabar en revocación de acceso a la API. La URL Inspection API es de solo lectura, no tiene ningún método para forzar indexación. La única vía oficial para forzar la indexación de una página normal es el botón "Solicitar indexación" de la interfaz de Search Console, manual, sin API
- **El antiguo endpoint de ping de sitemaps está muerto**: `google.com/ping?sitemap=` fue deprecado por Google en 2023 y devuelve 404 desde entonces — confirmado con búsqueda antes de implementar nada con él, para no construir un `--fix` que en realidad no hiciera nada
- **Qué hace `--fix` en su lugar**: reenvía el sitemap vía `sitemaps.submit`, un método real y soportado de la propia Search Console API (no la API de Indexación restringida) — es la señal más fuerte que se puede dar a Google por API sin incumplir sus normas. Además imprime, para cada URL no indexada, un enlace directo a la herramienta de inspección de Search Console (`search.google.com/search-console/inspect?resource_id=...&id=...`) para que la solicitud manual — la única que realmente fuerza el rastreo — sea de un clic
- **Autenticación**: cuenta de servicio de Google, vía `GOOGLE_SERVICE_ACCOUNT_KEY` (JSON en base64) o `fitzdesk-monitor/google-credentials.json` (en `.gitignore`, nunca se commitea). **Paso manual obligatorio que no se puede hacer por API**: añadir el email de la cuenta de servicio como usuario en Search Console → Configuración → Usuarios y permisos para la propiedad `sc-domain:fitzdesk.com` (propiedad de dominio, no de prefijo de URL, porque la verificación fue por DNS) — sin ese paso la API devuelve error de permisos aunque las credenciales sean correctas
- **Dependencia nueva**: `googleapis` añadida a `fitzdesk-monitor/package.json`. Al instalarla, `npm audit` reportó 1 vulnerabilidad alta (form-data, CRLF injection) resuelta con `npm audit fix` sin cambios incompatibles; quedan 2 moderadas (js-yaml vía gray-matter, uuid vía node-cron) que solo se resuelven con `--force` y un downgrade/breaking change de esas dependencias — no aplicado, fuera de alcance de esta tarea
- **Probado sin credenciales reales** (no existe todavía cuenta de servicio configurada): verificado que falla con un mensaje claro explicando qué falta y el paso manual de permisos necesario, en vez de un error críptico de la librería. La lógica de carga de artículos (23 publicados encontrados, URLs construidas correctamente) y de clasificación (5 casos representativos de respuesta de la API, incluyendo bloqueo por robots.txt) se probaron de forma aislada con datos simulados, ya que la llamada real a la API no se puede probar hasta que exista una cuenta de servicio con acceso a la propiedad
- **Integración semanal con `monitor.js` (sugerida como opcional en el encargo) — NO implementada todavía**: pendiente a propósito, porque tocar el bucle `--daemon` de `monitor.js` para añadir una rama "lunes" con su propia notificación a Discord es un cambio más invasivo al orquestador principal, y no se puede probar de extremo a extremo sin que la cuenta de servicio exista y tenga permisos reales en Search Console. Cuando haya credenciales configuradas y verificadas con `node indexingChecker.js` en local, retomar esta integración
- **Estado real de indexación — corregido 2026-06-25**: el dato de "11" que dio el usuario inicialmente no eran 11 *artículos*, sino 11 *URLs* indexadas en total (home + 2 páginas de categoría + 4 artículos reales, con 3 de esos 4 artículos/categorías duplicados con y sin barra final como URLs distintas). Solo 4 artículos reales confirmados indexados de los 23 publicados: lg-display-muestra-el-futuro-de-los-monitores-oled-gaming-con-2000-nits-5k-27-22, portatil-vs-sobremesa-teletrabajo-2026, keychron-k2-v2, el-nuevo-surface-ultra-con-el-rtx-spark-de-nvidia-cuenta-con-un-misterioso-puert (captura del usuario mostraba "1-10 de 11", falta confirmar la 11ª URL en la página 2 del informe de Search Console)
- **2 bugs técnicos de SEO encontrados a partir de esa captura, 1 corregido y 1 pendiente de acción manual**:
  - **✅ CORREGIDO — canonical autorreferenciado (corregido dos veces, la primera en la dirección equivocada)**: `BaseLayout.astro` generaba `<link rel="canonical">` a partir de `Astro.url.pathname` tal cual, sin normalizar — cada variante (con o sin barra) se autodeclaraba canónica a sí misma, sin consolidar nunca la señal en una sola URL. Esto explica los duplicados vistos en Search Console (`/keychron-k2-v2` y `/keychron-k2-v2/` como páginas distintas, mismo patrón en lg-display y en `/categoria/comparativas`). **Primer intento (incorrecto)**: se normalizó quitando la barra final, asumiendo que esa era la forma servida sin redirección — resultó ser al revés, detectado al comprobar en vivo con `curl -I` contra varias páginas reales (keychron-k2-v2, razer-pro-click, categoria/teclados): GitHub Pages siempre devuelve `301` en la versión sin barra hacia la versión con barra, que es la única que responde `200` directamente. **Corrección final**: canonical normalizado para que SIEMPRE termine en barra (salvo la raíz `/`); además se corrigió `src/lib/url.ts` (la función `u()`, usada por todos los enlaces internos del sitio — Header, Footer, ArticleCard, índice, buscador) para que genere las rutas también con barra final, evitando que cada clic interno pasara por una redirección innecesaria. Verificado en el HTML generado: canonical y sitemap ya usan `https://fitzdesk.com/articulo/keychron-k2-v2/` con barra
  - **🔴 BUG CRÍTICO introducido por la propia corrección anterior, detectado y corregido el mismo día 2026-06-25**: al hacer que `u()` añadiera siempre barra final, también se la añadía a las imágenes (`u(imagen)`, usado en `ArticleCard.astro` y `[slug].astro` para CADA imagen del sitio) — el resultado era `src="/images/articulos/foo.webp/"`, una URL que no existe como archivo en GitHub Pages (solo las rutas de página tienen "variante con barra", los archivos estáticos no). **Esto rompió todas las imágenes del sitio en producción** tras el merge a `main` de la corrección del canonical, hasta que el usuario lo reportó ("no se ven las imágenes en la web"). Corregido añadiendo un filtro en `u()`: si la ruta termina en una extensión de archivo (`\.[a-z0-9]+$`), se trata como recurso estático y NO se le añade barra; el resto (rutas de página) sigue recibiéndola como antes. Verificado en el HTML generado: imágenes sin barra (`/images/articulos/keychron-v1-analisis.webp`), enlaces de página con barra (`/articulo/keychron-k2-v2/`), canonical sin cambios. Lección: cualquier cambio en un helper de URL compartido por rutas de página Y recursos estáticos necesita probarse contra ambos casos, no solo el que motivó el cambio.
  - **✅ RESUELTO 2026-07-19**: "Enforce HTTPS" activado por el usuario en GitHub → Settings → Pages. El dominio ya fuerza HTTPS y no sirve el sitio en `http://`.
- **Automatizaciones acordadas como siguiente paso (pendientes de credenciales, no implementadas todavía)**: (1) llamar a `indexingChecker.js --fix` desde `publicar-automatico.yml` justo después de cada publicación, para reenviar el sitemap sin esperar a que alguien lo note; (2) retomar la integración semanal de arriba para que el lunes se notifique a Discord qué páginas siguen atascadas, con el enlace de "Solicitar indexación" ya preparado — sigue exigiendo un clic humano, Google no permite que sea 100% automático para contenido normal
- **Bug real corregido 2026-06-25 — enlaces de "solicitar indexación manual" rotos (siempre 404)**: se generaron a mano construyendo `https://search.google.com/search-console/inspect?resource_id=...&id=[URL del artículo]`, asumiendo que el parámetro `id` era la URL de la página. Falso: ese `id` es un identificador opaco que genera Google en cada inspección real, devuelto por la propia API en el campo `inspectionResult.inspectionResultLink` — no se puede construir a mano. Confirmado con el usuario (los enlaces dieron 404 en la práctica) y verificado por búsqueda antes de corregir. `indexingChecker.js` corregido para capturar `inspectionResultLink` directamente de la respuesta de la API en vez de intentar reconstruirlo; si la API no lo devuelve (p. ej. en un error), cae a instrucciones de uso manual de la herramienta (`search.google.com/search-console/inspect`, seleccionar la propiedad, pegar la URL a mano). **Mientras no exista la cuenta de servicio**, la única vía real para solicitar indexación manual es: entrar en https://search.google.com/search-console/, seleccionar la propiedad fitzdesk.com, pegar cada URL en la barra de "Inspección de URLs" y pulsar "Solicitar indexación" si hace falta — sin enlaces directos posibles todavía

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
| `socialPublisher.js` | Publica en Instagram y Facebook con captions generados por IA, tras pasar por `socialReviewer.js` (Pinterest preparado, desactivado) |
| `socialContent.js` | Carga de artículo + generación de captions con Groq, compartido por `socialPublisher.js` y `socialReviewer.js` |
| `socialReviewer.js` | Revisa imágenes y textos antes de publicar — regenera imágenes rotas, corrige texto con Groq, bloquea si no puede |
| `socialImageGenerator.js` | Genera la imagen de Facebook (Sharp + SVG) a partir de la imagen del artículo |
| `instagramImageGenerator.js` | Genera el carrusel de 4 slides de Instagram (Puppeteer: gancho, lo mejor, lo mejorable, veredicto) |
| `indexingChecker.js` | Comprueba el estado de indexación en Google de los artículos publicados vía Search Console API (añadido 2026-06-25) |
| `offerGenerator.js` | Genera un borrador de tipo "oferta" a partir de una oferta detectada (precio rebajado, descuento, fuente) — añadido 2026-06-25 |
| `ofertaLimiter.js` | Cuenta las ofertas publicadas automáticamente hoy, persistido entre ejecuciones de CI — modo PCDays, añadido 2026-06-25 |
| `pcdays-cleanup.js` | Cierre del evento PCDays: comprueba si las ofertas activas han subido de precio y las marca como finalizadas — añadido 2026-06-25 |

## Tipo de artículo "oferta" (añadido 2026-06-25)

Quinto tipo de artículo (junto a `analisis`, `comparativa`, `guia`, `lanzamiento`) para rebajas puntuales de productos — más corto que un análisis, centrado en el precio, sin puntuación numérica.

**Frontmatter específico**: `precio_oferta`, `precio_normal`, `descuento`, `oferta_activa` (boolean), `analisis_relacionado` (slug, opcional — solo si ya existe un análisis del producto en FitzDesk). Esquema Zod actualizado en `src/content/config.ts`.

**Estructura del cuerpo** (generada por `offerGenerator.js` con Groq): Introducción (ahorro + urgencia sin agresividad) → ¿Por qué es buena oferta? (enlaza al análisis existente si lo hay, o describe el producto si no) → ¿Para quién es ideal? → 🐿️ Fitz dice (sin nota numérica) → aviso de oferta + aviso de afiliado estándar.

**Detector en `sources.js`** (`detectOferta()`, capa independiente del filtro de relevancia de 3 capas): exige palabra clave de oferta (`KEYWORDS_OFERTA`) + producto físico + precio concreto en € + tienda fiable (`FUENTES_OFERTA_FIABLES`: PcComponentes, Amazon, MediaMarkt, El Corte Inglés) + descuento ≥15% **solo si el texto menciona un % explícito** — si no lo menciona, se deja pasar como "descuento no verificado" en vez de descartarlo o inventarlo (mismo criterio de "nunca inventar un dato" que el resto del proyecto).

**`offerGenerator.js`**: `node offerGenerator.js --config oferta.json` (config con `producto`, `categoria`, `precio_oferta` obligatorios; `precio_normal`, `descuento`, `fuente`, `enlace_afiliado`, `informacion` opcionales). Busca automáticamente si ya existe un análisis del producto en `src/content/articulos/` (por coincidencia de nombre en el título) para enlazarlo o reutilizar su imagen. Guarda como `borrador-[producto]-oferta.md` (mismo prefijo que usa el monitor para sus borradores automáticos) y notifica a Discord (`notifyOferta()` en `notifier.js`) con producto, precios, descuento, si tiene análisis relacionado y la ruta del borrador. Probado de extremo a extremo con un caso real (Logitech MX Master 3S): encontró el análisis existente, generó el contenido correctamente estructurado y notificó — borrador de prueba eliminado tras verificar, no se ha dejado en el repo.

**Integración en `articleUpdater.js`**: cuando se ejecuta `--slug [slug] --precio [nuevo]` sobre un artículo `tipo: "oferta"`, compara el nuevo precio con `precio_normal` (margen del 3% para redondeos). Si sigue por debajo, solo actualiza `precio_oferta`. Si ha vuelto al precio normal: marca `oferta_activa: false`, corrige el título (quita "precio mínimo histórico a X€", pone "[Producto]: análisis y mejor precio"), e inserta un aviso en el cuerpo indicando que la oferta ya no está activa pero el producto sigue siendo buena opción — mismo patrón que `applyDescatalogado()` (aviso añadido, sin reescribir la introducción original con IA). Probado con ambos casos (oferta sigue activa / oferta finalizada) sobre un artículo de prueba, eliminado tras verificar.

**Web (Astro)**: `ArticleCard.astro` muestra precio tachado + precio de oferta en naranja + badge de descuento para ofertas activas, y badge "🔥 En oferta" (naranja) / "Oferta finalizada" (gris) en la esquina de la imagen — mismo patrón ya usado para comparativa/guía/lanzamiento. `[slug].astro` muestra el mismo badge junto al precio en la barra lateral, con el ahorro estimado si la oferta sigue activa. `analisis.astro` tiene un nuevo filtro "🔥 Ofertas" en las pills de categoría (filtra por `tipo`, no por `categoria`, ya que "ofertas" no es una categoría real). Todo verificado generando artículos de oferta de prueba (activa y finalizada), inspeccionando el HTML generado, y eliminados tras la verificación.

**PARTE 7 del encargo — revisión de borradores existentes (2026-06-25)**: el agente "Revisor de borradores" revisó los 17 borradores existentes con `borrador: true` buscando candidatos a reclasificar a `tipo: "oferta"`. **Ninguno cumple los criterios** — todos son análisis en profundidad (con `puntuacion`/`criterios` completos), lanzamientos informativos o guías, ninguno centrado en una rebaja puntual como tema principal. El tipo "oferta" no tiene candidatos retroactivos; aplicará solo a contenido nuevo. De paso, el agente detectó (sin tocarlo) un bloque duplicado de "Preguntas frecuentes" y "🐿️ Fitz recomienda" en `borrador-cherry-kc-6000-slim-analisis.md` (líneas 75-109) no documentado hasta ahora — pendiente de limpieza en una próxima pasada. Tampoco existe ningún archivo persistente de "casos dudosos" en `fitzdesk-monitor/data/` que revisar (son notificaciones efímeras solo a Discord, ya confirmado en sesiones anteriores).

**Decisión de alcance del usuario (2026-06-25)**: el flujo de ofertas se activa primero solo para ofertas que detecte el monitor vía RSS (`detectOferta()` en `sources.js` → `offerGenerator.js`), sobre productos que pueden o no tener ya un análisis publicado en FitzDesk. **Queda pendiente de decidir más adelante** si también se generan artículos de oferta de forma proactiva para productos que YA tienen un análisis publicado en la web (es decir, vigilar bajadas de precio sobre el catálogo existente, no solo sobre lo que aparezca en el RSS) — no implementar esto todavía, es una fase 2 a decidir.

**✅ Conectado al bucle real de `monitor.js` (2026-06-25, mismo día — quedó pendiente en la implementación inicial y se completó tras que el usuario preguntara "¿hay ofertas?" y se detectara el hueco)**: `detectOferta()` y `buildOfertaDraft()` (nueva función exportada de `offerGenerator.js`, reutilizable sin pasar por el CLI) ya se llaman dentro de `runCheck()`, justo después de que Gemini confirme que un item del RSS es relevante y antes de generar el análisis normal — si el item es una oferta, se genera el borrador de oferta en su lugar (reutilizando `review.producto`/`review.categoria` ya extraídos por Gemini, sin duplicar esa extracción) y se salta el análisis completo para ese item. Añadido contador `totalOfertas` al resumen de cada ejecución y a `notifyDailySummary()` (nuevo campo "🔥 Ofertas detectadas" en el embed de Discord). El consumo de tokens de Groq del borrador de oferta se contabiliza con el valor real devuelto por la API (`completion.usage.total_tokens`), igual que hace `analyzer.js` para los análisis normales, no con una estimación. Verificado: sintaxis de los 4 archivos tocados (`monitor.js`, `notifier.js`, `offerGenerator.js`, `sources.js`), y el CLI de `offerGenerator.js` sigue funcionando igual tras refactorizar su lógica interna a la función compartida `buildOfertaDraft()`. **No se ha podido probar el ciclo completo en vivo** (`runCheck()` no es invocable de forma aislada sin ejecutar fetch real de RSS + Gemini + Groq contra las fuentes reales del proyecto) — la próxima ejecución real del monitor (diaria, vía GitHub Actions) será la primera prueba de extremo a extremo; si detecta alguna oferta real, debería notificar a Discord con el embed nuevo.

**Triaje de 3 borradores de Prime Day encontrados en la rama `borradores` (2026-06-25, el usuario preguntó por uno en concreto)**: el monitor (vía analyzer.js, antes de la integración de ofertas de hoy) había generado 3 borradores sobre rebajas de Prime Day como artículos `tipo: "analisis"` normales — ninguno pasó por el detector nuevo porque se generaron antes de conectarlo.

- **`borrador-seleccion-prime-day-monitores-gaming-con-hasta-un-36-de-descuento-y-desde-tan-so.md`** — roundup de 3 monitores distintos (Samsung Odyssey, ASUS TUF Gaming, Lenovo L27Q-10) sin verificar, contenido genérico ("cabe esperar que...") y ya marcado como posible duplicado de `lg-display-muestra-el-futuro-de-los-monitores-oled-gaming-con-2000-nits-5k-27-22`. No encaja en "oferta" (ese tipo es para un solo producto) ni vale como "analisis" real. **Descartado** de la rama `borradores` a petición del usuario.
- **`borrador-las-mejores-ofertas-en-televisores-oled-de-lg-y-philips-del-amazon-prime-day.md`** — roundup de 2 TVs de marcas distintas, categorizado (mal) como "monitores". Los televisores no son una categoría de FitzDesk (la web cubre periféricos/setups de teletrabajo, no TVs) — fuera de la línea editorial independientemente del tipo. **Descartado** de la rama `borradores` a petición del usuario.
- **`borrador-adelantate-al-prime-day-con-este-portatil-de-asus-con-150-euros-de-descuento.md`** — single-product real (ASUS Vivobook 15, 150€ de descuento, 799€→649€), categoría correcta (portátiles). Tenía además `borrador: false` ya puesto sin haber pasado ninguna revisión — señal de un posible fallo similar al ya documentado y corregido en `analyzer.js` sobre normalización forzada del campo `borrador`, pendiente de investigar si reaparece. **Reclasificado a `tipo: "oferta"`** y traído a `develop` como `borrador-asus-vivobook-15-oferta.md`, regenerado con `offerGenerator.js` a partir de los datos reales del borrador original (precio, specs) en vez de copiar el texto tal cual.

**Bug real encontrado durante la reclasificación, corregido en el mismo momento**: `findRelatedAnalysis()` en `offerGenerator.js` usaba `.includes()` para buscar coincidencias de nombre de producto — "ASUS Vivobook 15" coincidía por subcadena con el título existente "ASUS Vivobook 15 OLED (2025): la pantalla de lujo a precio razonable", un modelo con pantalla y CPU distintos (confirmado: la oferta describe pantalla Full HD sin OLED y "Intel Core 7" genérico, frente al Core i5-13500H/i7-13700H + OLED del análisis existente). Groq generó el primer borrador enlazando a ese análisis incorrecto y mezclando specs de ambos productos ("pantalla OLED" mencionada dos veces en una oferta que en realidad no es OLED) — confirmado leyendo el resultado antes de comitearlo, nunca llegó a publicarse. Corregido exigiendo coincidencia exacta del nombre de producto contra el prefijo del título (antes de los dos puntos), no por subcadena — mejor no enlazar que enlazar mal, consistente con el resto de "nunca inventar un dato" del proyecto. Regenerado tras el fix: sin enlace (correcto, son modelos distintos) y sin ninguna mención a OLED.

## Modo PCDays — DESCARTADO (2026-07-06)

El modo PCDays se implementó para los PCDays de PcComponentes de junio-julio 2026 (umbral de auto-publicación al 15%, límite de 8 ofertas/día, workflow cada 2h con interruptor remoto `PCDAYS_MODE`), pero nunca llegó a usarse en producción porque no estuvo listo a tiempo para el evento. El código completo se eliminó en julio 2026:

- `pcdays-monitor.yml` — eliminado
- `pcdays-cleanup.js` — eliminado
- `ofertaLimiter.js` — eliminado (contador diario persistido entre ejecuciones de CI via rama `borradores`)
- `notifyPcdaysModeStatus` y `notifyPcdaysCleanupReport` — eliminados de `notifier.js`
- Flag `--pcdays` — eliminado de `monitor.js`
- Entrada desactivada `Alert: ofertas PcComponentes (PCDays)` — eliminada de `sources.js`

El resto de la funcionalidad de ofertas (tipo `"oferta"`, `detectOferta()`, `buildOfertaDraft()`, `offerGenerator.js`, `articleUpdater.js` para actualización de precio, carrusel y captions de oferta en redes sociales) **sigue intacta** — solo se eliminó lo específico del modo PCDays.

## Modo PCDays — publicación automática de ofertas sin revisión humana (2026-06-25) — REFERENCIA HISTÓRICA

Sistema construido para los PCDays de PcComponentes, donde se lanzan muchas ofertas en poco tiempo y el usuario no puede estar disponible para revisar cada una (ausente del 27/06 al 04/07, solo con acceso a GitHub desde el móvil). **Es la primera vez en el proyecto que se publica contenido en la web y en redes sociales sin que ningún humano lo revise antes** — decisión explícita del usuario, no una suposición: dado que no estaría disponible, prefirió que las ofertas de alta confianza (≥20% de descuento normalmente, ≥15% en modo PCDays) se publiquen solas, con un tramo intermedio (15-20% en modo normal) que sí queda en cola para revisión manual.

**Dos correcciones de alcance respecto al encargo original, decididas con el usuario antes de implementar**:
1. **"Verificar con el agente revisar-borradores desde offerGenerator.js" no es técnicamente posible** — los agentes de Claude Code solo se invocan desde una sesión interactiva, nunca desde un script Node sin supervisión en CI. Sustituido por `checkOfertaCompleteness()`, una comprobación mecánica equivalente (campos completos, sin placeholders, imagen real en disco, secciones obligatorias presentes, longitud razonable) — mismo patrón ya usado en `socialReviewer.js` para las comprobaciones de redes sociales.
2. **Nivel de autonomía**: el usuario eligió que el nivel ≥20% (≥15% en PCDays) se publique de extremo a extremo —web y redes— sin intervención humana, precisamente porque no podrá estar para aprobar nada. El tramo 15-20% (en modo normal) queda en cola de revisión manual, tal como se especificó.

### TAREA 1 — Publicación inmediata, sin pasar por el calendario

Hasta ahora el monitor solo escribía borradores en la rama `borradores` vía la API de GitHub (`githubPublisher.js`) — nunca tocaba `main` ni disparaba el deploy. Para que una oferta de alta confianza llegue de verdad a la web sin esperar al calendario ni a una revisión manual, se añadió:

- **`githubPublisher.js`**: `publishDirectly(slug, content)` — escribe el artículo directamente en `main`, sin prefijo `borrador-` y sin pasar por la rama `borradores`. `downloadDataFile`/`uploadDataFile` — generalización de las funciones que antes solo servían para `cache.json`, ahora reutilizables para cualquier archivo de estado (ver TAREA 3). `dispatchWorkflow`/`dispatchWorkflowAndWait` — disparan un workflow por `workflow_dispatch` vía API REST (no hay `gh` CLI dentro de un proceso Node) y, en el caso de `...AndWait`, esperan a que el run termine — mismo patrón "gh workflow run + gh run watch" ya usado a mano en `publicar-en-redes.yml`.
- **`offerGenerator.js`**: `checkOfertaCompleteness({ content, slug })` — valida título/descripción/precio/enlace_afiliado, que la imagen referenciada exista de verdad en disco (las ofertas de productos sin análisis previo en FitzDesk no tienen foto real — eso por sí solo ya bloquea el auto-publish, una propiedad de seguridad deliberada, no un descuido), que estén las 4 secciones obligatorias, sin placeholders sin rellenar, longitud 120-500 palabras.
- **`monitor.js`**: tras generar el contenido de una oferta, si `checkOfertaCompleteness` falla → borrador + Discord. Si pasa y el descuento supera el umbral → `publishDirectly()`, luego `dispatchWorkflowAndWait('deploy.yml')` (para que la página esté en vivo) y `dispatchWorkflow('publicar-en-redes.yml', { slug })` sin esperar (ese workflow ya notifica su propio resultado a Discord — evita duplicar lógica).

**Bug real encontrado y corregido durante la integración**: los borradores de oferta que SÍ necesitan revisión manual (incompletos, descuento bajo, límite diario alcanzado) se guardaban con `saveDraft()` directo al disco local — en CI eso se pierde al terminar el job, igual que cualquier archivo no comiteado. Corregido con `saveDraftPersisted()`, que usa `githubCreateDraft()` (API de GitHub a la rama `borradores`, persiste) si está disponible, igual que ya hace el flujo de análisis normal.

**Segundo bug real, más sutil, encontrado al integrar**: `offerGenerator.js` ejecutaba su `main()` sin ninguna guarda — al importar `buildOfertaDraft()` desde `monitor.js`, también se disparaba el CLI completo, que intentaba leer `process.argv[0]` (la ruta del binario de node) como si fuera un archivo de configuración JSON y fallaba con un error de parseo confuso ("Unexpected token M in JSON"). Corregido añadiendo la guarda `if (process.argv[1] === fileURLToPath(import.meta.url))`, mismo patrón que ya usaba `imageCollector.js`. Se aprovechó para aplicar la misma corrección preventiva en `socialPublisher.js` y `articleUpdater.js`, que tenían el mismo defecto sin que nada los importara todavía (riesgo latente, no un bug activo en ese momento).

### TAREA 2 — Priorización por descuento

El contenido de una oferta (la llamada a Groq) ya no se genera durante el escaneo del RSS — se recolectan los candidatos (`ofertaCandidates`) mientras se escanean las fuentes, y se procesan TODOS juntos al final, ordenados por `descuentoEstimado` descendente. Así, si hay varias ofertas a la vez, el presupuesto de tokens de Groq y los huecos del límite diario se gastan en las mejores primero.

### TAREA 3 — Límite diario de publicaciones

Nuevo módulo `ofertaLimiter.js`: cuenta cuántas ofertas se han publicado automáticamente hoy, persistido entre ejecuciones de CI a través de la misma rama `borradores` (vía `downloadDataFile`/`uploadDataFile` de `githubPublisher.js`, generalizando el mecanismo que ya usaba `cache.json`) — sin esto, cada ejecución de GitHub Actions partiría de un checkout limpio y el límite nunca se respetaría entre ejecuciones distintas, crítico en modo PCDays con comprobaciones cada 2h. Límite: 5/día en modo normal, 8/día en modo PCDays. Al alcanzarse, las ofertas adicionales (aun con descuento suficiente) quedan en cola de revisión manual con el motivo explícito.

### TAREA 4 — Redes sociales adaptadas para ofertas

- **`instagramImageGenerator.js`**: nuevo carrusel de 3 slides (`generateOfertaCarousel()`) — gancho de oferta (badge rojo "🔥 OFERTA" en vez del badge de categoría, precio tachado + precio de oferta grande + % de descuento en rojo), por qué comprarlo ahora (fondo oscuro, hasta 3 razones extraídas de la sección "¿Por qué es buena oferta?" del artículo, cuenta atrás solo si se conociera una fecha de fin real — nunca inventada, y de momento el frontmatter de oferta no tiene ese campo así que el bloque simplemente no aparece), veredicto de Fitz con urgencia (fondo naranja, CTA "No la dejes escapar 🔥", fitzdesk.com). `isOfertaArticle(slug)` decide qué carrusel generar — `socialPublisher.js` y `socialReviewer.js` lo usan para saber si esperar 3 o 4 slides.
- **`socialContent.js`**: prompts y plantillas de respaldo específicas de oferta para Instagram (primera línea exacta "🔥 Producto a precio€ (-%)", ahorro en €, CTA "Enlace en bio 🐿️", máximo 3 hashtags fijos `#oferta #pccomponentes #teletrabajo`) y Facebook (tono más urgente, precio normal tachado, pregunta fija "¿Lo tienes en el carrito?", enlace directo). `getInstagramCaption`/`getFacebookCaption` detectan `article.tipo === 'oferta'` y eligen la plantilla correcta automáticamente.
- **`socialReviewer.js`**: el límite mecánico de hashtags de Instagram pasa de 5 a 3 para ofertas; la extracción de pros/contras (`getCarouselContent`, pensada para el carrusel de 4 slides) se omite por completo para ofertas, ya que gastaría Groq en contenido que el carrusel de 3 slides ni siquiera usa.
- Probado de extremo a extremo con el borrador real de ASUS Vivobook 15 oferta: captions de Instagram y Facebook generados correctamente con la estructura exacta pedida, comprobaciones mecánicas del revisor (incluido el límite de 3 hashtags) pasando en verde.

### TAREA 5 — Fuente RSS de ofertas de PcComponentes

Confirmado de nuevo (`curl -I https://www.pccomponentes.com/rss` → 403, reto de Cloudflare) que el RSS directo de PcComponentes sigue bloqueado, igual que ya documentaba este archivo. Como alternativa, se añadió una entrada en `sources.js` (`Alert: ofertas PcComponentes (PCDays)`) siguiendo el mismo patrón que el resto de Google Alerts ya configuradas — **pero con `enabled: false` y `url: ''`, pendiente de que el usuario cree la alerta a mano** en https://www.google.com/alerts (búsqueda sugerida: `oferta site:pccomponentes.com`, tipo de fuente "Feed RSS") y pegue la URL del feed. No se puede crear una Google Alert por API — requiere iniciar sesión con una cuenta de Google en el navegador, igual que las demás alertas ya existentes en el archivo.

### TAREA 6 — Modo PCDays

`node monitor.js --pcdays` — comprobación puntual (no un daemon) con umbral de publicación automática al 15% (en vez de 20%) y límite diario de 8 (en vez de 5). Pensado para lanzarse cada 2 horas vía un nuevo workflow, `.github/workflows/pcdays-monitor.yml`.

**Interruptor remoto pensado específicamente para que el usuario pueda controlarlo desde el móvil sin terminal**: el cron del workflow (`cron: '17 */2 * * *'`) está siempre activo, pero cada ejecución comprueba primero la variable de repositorio `PCDAYS_MODE` (GitHub → repo → Settings → Secrets and variables → Actions → Variables — editable desde el navegador móvil). Si no vale exactamente `"true"`, el job no hace nada. Para activar el modo: cambiar esa variable a `true` desde el móvil. Para pausarlo en cualquier momento sin esperar al final del evento: volver a poner `false`.

"Activado"/"desactivado" se notifican a Discord: cada ejecución con el modo activo manda un resumen (`notifyPcdaysModeStatus(true, ...)`); `pcdays-cleanup.js` (TAREA 7) manda la notificación de desactivación al cerrar el evento.

### TAREA 7 — pcdays-cleanup.js

Al terminar el evento (ejecución manual: `node pcdays-cleanup.js`): busca todos los artículos PUBLICADOS (sin `borrador: true`) con `tipo: "oferta"` y `oferta_activa: true`, intenta leer el precio actual desde `enlace_afiliado`, y si subió más de un 3% sobre el precio de oferta, ejecuta `node articleUpdater.js --slug [slug] --precio [precio]€` como subproceso — que ya sabe, desde la integración de la sesión anterior, detectar que una oferta ha terminado y marcar `oferta_activa: false` automáticamente (`applyOfertaPrecioUpdate()`, ya existente). Informe final a Discord: ofertas terminadas, ofertas que siguen activas, ofertas sin precio verificable, total de artículos de oferta generados durante el evento (cuenta todos los `tipo: "oferta"`, publicados o no).

**Limitación conocida y aceptada, no un descuido**: el "scraper" de precio (`tryFetchCurrentPrice()`) es deliberadamente simple (un regex buscando el primer patrón "NN,NN €" en el HTML de la página) porque no hay forma robusta de aislar "el precio actual" de cualquier tienda arbitraria sin un scraper dedicado por tienda — y PcComponentes bloquea el scraping automático con Cloudflare en la mayoría de casos, confirmado repetidamente en esta sesión. Si no se puede leer un precio fiable, la oferta se reporta como "no verificable" en vez de inventar un número o asumir que sigue activa — mismo principio de "nunca inventar un dato" que el resto del proyecto.

**Verificación realizada sin poder probar el ciclo completo en vivo**: se verificó la sintaxis de los 12 archivos tocados/creados, el build de Astro (sin cambios funcionales para la web, solo para el monitor), la lógica de filtrado de `pcdays-cleanup.js` contra el contenido real del repositorio, y las captions de oferta de extremo a extremo con Groq real contra el borrador de ASUS. **No se ha podido probar** la llamada real a la API de GitHub (`publishDirectly`, `dispatchWorkflow`) ni el ciclo completo del monitor contra RSS real, porque hacerlo habría significado publicar contenido de verdad en producción o disparar workflows reales como efecto secundario de una prueba — la primera ejecución real del modo PCDays (o de una oferta de alta confianza en el modo normal) será la primera prueba de extremo a extremo de esta parte.

### Pasada de seguridad adicional (2026-06-25) — el sistema no habría publicado nada solo

A petición explícita del usuario ("para más seguridad, podemos hacer que se lancen los agentes"), se lanzó el agente "Revisor de código" centrado específicamente en los riesgos de la publicación 100% automática (sin revisión humana) construida ese mismo día. Cada hallazgo se verificó de forma independiente (ejecución real, no solo lectura del informe) antes de corregirlo — ninguno resultó ser un falso positivo.

**🔴 2 bugs críticos que dejaban el sistema completamente inoperativo, no solo arriesgado**:
- `monitor.js` llamaba a `buildOfertaDraft()` con `enlace_afiliado: ''` siempre (codeado a fuego, no un dato real), mientras `checkOfertaCompleteness()` en `offerGenerator.js` exige que ese campo empiece por `https://www.pccomponentes.com` para considerar una oferta completa. Resultado: **toda oferta detectada caía siempre en la rama "incompleta"**, nunca llegaba a comprobar el umbral de descuento ni el límite diario, y el sistema construido específicamente para funcionar sin el usuario durante su ausencia (27/06-04/07) no habría publicado nada en absoluto — sin ningún error visible, solo borradores acumulándose en silencio en la rama `borradores`. Corregido construyendo una URL de búsqueda real de PcComponentes a partir de `cand.producto` (mismo formato de "enlace de producto" sin tracking que usa el resto del proyecto), verificado en vivo con `checkOfertaCompleteness()` ya no listando `enlace_afiliado` como campo ausente.
- `pcdays-cleanup.js` (TAREA 7, cierre del evento) importaba `logOk` de `notifier.js`, una función que no existe (la real se llama `logSuccess`) — el script fallaba con un `SyntaxError` antes de ejecutar ninguna línea, confirmado en vivo (`node pcdays-cleanup.js` reventaba en el import). Como no hay ningún workflow que dispare este script automáticamente (es manual, pensado para after del evento), el usuario se habría encontrado con un script roto justo cuando quisiera cerrar el evento. Corregido el import y su único uso.

**🟡 4 advertencias corregidas, ninguna bloqueante pero todas con riesgo real durante una ventana sin supervisión humana**:
- `checkOfertaCompleteness()` se llamaba sin try/catch dentro del bucle de procesado de ofertas en `monitor.js` — una excepción ahí (por ejemplo, un YAML roto por una comilla suelta sin escapar, ver siguiente punto) abortaba `runCheck()` completo sin notificar nada a Discord, dejando sin procesar el resto de la cola y sin sincronizar el contador diario/caché. Envuelto todo el bloque de procesado por candidato en un try/catch con notificación a Discord vía `notifyOfertaPendienteRevision()` como red de seguridad genérica.
- El frontmatter de oferta interpolaba `producto`/`fuente`/etc. directamente en YAML con comillas dobles sin escapar — un carácter `"` suelto en el título o snippet original de una noticia de RSS rompía el parseo YAML más adelante. Añadido `yamlEscape()` en `offerGenerator.js`, aplicado a todos los valores interpolados; verificado en vivo con un texto de prueba conteniendo comillas, generó YAML válido.
- El regex de detección de descuento en `sources.js` (`detectOferta()`) capturaba el **primer** porcentaje de todo el texto sin contexto — un "95% de autonomía de batería" en la misma noticia se habría leído como el descuento de la oferta. Corregido para exigir que el `%` vaya precedido de "-" o seguido de "descuento/dto/rebaja"; verificado en vivo con 3 casos (descuento real con guion, descuento real con la palabra "descuento", porcentaje no relacionado) — los 3 se comportan como se espera, ninguno cuela un dato falso.
- Condición de carrera real en `ofertaLimiter.js` si dos ejecuciones del monitor se solapan (cron cada 2h en modo PCDays + posibles disparos manuales, ventana ampliada por los minutos que `dispatchWorkflowAndWait` mantiene el proceso vivo por cada oferta publicada). Mitigado (no eliminado del todo — no es un lock atómico real) haciendo que `recordPublished()` vuelva a sincronizar con GitHub justo antes de incrementar y justo después de guardar, en vez de depender solo de la sincronización única al principio/final de `runCheck()`.
- Ninguna llamada `fetch()` en `githubPublisher.js` tenía timeout propio — un fallo de red puntual podía dejar el job colgado hasta el límite del runner en vez de fallar rápido y notificar. Centralizado en un wrapper `ghFetch()` con timeout de 15s, aplicado a las 14 llamadas del archivo.

Build de Astro y sintaxis de los 6 archivos tocados en esta pasada (`monitor.js`, `offerGenerator.js`, `sources.js`, `ofertaLimiter.js`, `githubPublisher.js`, `pcdays-cleanup.js`) verificados tras los cambios.

**🔴 Tercer bug crítico encontrado el mismo día, al probar en vivo (no por el agente)**: `PLACEHOLDER_PATTERNS` en `offerGenerator.js` usaba `/\[.*?\]/` para detectar placeholders sin rellenar (tipo `[COMPLETAR]`) en `checkOfertaCompleteness()` — pero esa regex también coincide con un enlace Markdown normal `[texto](url)`, exactamente el tipo de enlace que `findRelatedAnalysis()` inserta cuando ya existe un análisis del producto. Confirmado generando una oferta de prueba real con enlace al análisis: `checkOfertaCompleteness()` la marcaba SIEMPRE como incompleta por ese enlace, aunque el resto del contenido fuera perfecto — un tercer camino, distinto de los dos que encontró el agente, por el que el sistema de auto-publicación tampoco habría publicado nada (cualquier oferta con enlace a un análisis relacionado, que es precisamente el caso que `findRelatedAnalysis()` existe para producir). Corregido con un lookahead negativo (`/\[[^\]]*\](?!\()/`, no coincide si el corchete va seguido de `(`) en `offerGenerator.js` y en el patrón equivalente añadido a `articleUpdater.js` (ver más abajo). Verificado en vivo: la misma oferta de prueba con el enlace pasa `checkOfertaCompleteness()` correctamente tras el fix.

## Reescritura del cuerpo al finalizar una oferta + decisión de alcance sobre productos ya analizados (2026-06-25)

El usuario señaló un hueco real: cuando una oferta termina (el precio vuelve a subir), `applyOfertaPrecioUpdate()` en `articleUpdater.js` solo cambiaba el título y añadía un aviso de una línea — el resto del cuerpo (secciones como "¿Por qué es buena oferta?", lenguaje de urgencia, "su precio más bajo hasta la fecha" en la descripción) se quedaba igual para siempre, contradiciendo el aviso.

**Reescritura automática del cuerpo, con validación mecánica y fallback seguro** (decisión del usuario: sí, automática, no en cola de revisión — coherente con que no va a estar disponible para revisarlo): `applyOfertaPrecioUpdate()` ahora, cuando detecta que la oferta ha terminado, intenta reescribir el cuerpo con Groq (`rewriteOfertaBodyAsNormal()`) quitando todo el lenguaje de oferta/urgencia y dejándolo como una descripción neutra y atemporal del producto, sin inventar datos nuevos. El resultado se valida mecánicamente (`validateRewrittenBody()`: longitud razonable, sin placeholders sin rellenar, sin restos de frases de urgencia tipo "no la dejes escapar"/"🔥"/"precio mínimo histórico") antes de aplicarse — si la validación falla o Groq no está disponible, se cae al aviso simple de toda la vida (`> ℹ️ Esta oferta ya no está activa...`), nunca se bloquea la actualización del precio por esto. Si la reescritura SÍ se aplica, el aviso pasa a ser el estándar de "Artículo actualizado en [mes]" (sin la explicación de "esta oferta terminó", porque el cuerpo ya no afirma estar en oferta).

Probado de extremo a extremo con un artículo de oferta real generado para la prueba (Logitech MX Master 3S, eliminado tras verificar): la primera vez, la validación rechazó correctamente la reescritura por el bug del regex de placeholders (ver arriba) y cayó al aviso simple como se esperaba del mecanismo de seguridad; tras corregir ese regex, `checkOfertaCompleteness()` y la lógica de reescritura quedaron verificadas. La reescritura con Groq en sí no se pudo probar en su camino feliz por haberse agotado la cuota diaria de tokens de la cuenta de Groq durante esta sesión (límite de 100.000 tokens/día) — sí se confirmó en vivo que el fallo de Groq (HTTP 429) se captura correctamente y cae al aviso simple sin romper la actualización del precio.

**Decisión de alcance, a petición explícita del usuario tras revisar este flujo**: si una oferta detectada por el monitor es de un producto que **YA tiene un análisis publicado** en FitzDesk, NO se crea un artículo de oferta aparte — eso habría dejado, tras terminar la oferta, una página "zombi" duplicando el análisis real del mismo producto. En su lugar, `monitor.js` comprueba `findRelatedAnalysis(producto)` antes de generar ningún contenido con Groq; si encuentra un análisis ya publicado, **solo actualiza el campo `precio` de ese análisis** (función nueva `applyPrecioToExistingAnalysis()`, definida directamente en `monitor.js` en vez de importada de `articleUpdater.js`, para no disparar el `process.exit(1)` de nivel superior de ese script si faltara `GROQ_API_KEY` — este camino no necesita Groq en absoluto). Mismas reglas de umbral de descuento (≥20%/≥15% en PCDays) y límite diario que el resto del sistema: si no se cumplen, se notifica a Discord para revisión manual en vez de tocar el artículo. Probado en aislado contra una copia de un análisis real (Logitech MX Master 3S, en el directorio de scratchpad, sin tocar el archivo real del repositorio): precio, `fecha_actualizacion` y `actualizado: true` se actualizan correctamente; el aviso de "Artículo actualizado" no se renueva en una segunda actualización porque ya existía uno de una pasada anterior — mismo comportamiento que ya tiene `applyPrecioUpdate()` en el resto del proyecto (solo inserta el aviso si no hay ninguno todavía), no es un bug nuevo de este cambio. Deliberadamente NO se dispara `publicar-en-redes.yml` para este camino (el análisis ya se publicó y compartió en su momento; publicar de nuevo en redes solo por un cambio de precio sería ruido) — coherente con la instrucción literal del usuario ("se cambia solo el precio").

## Revisión específica del pipeline de redes sociales para ofertas (2026-06-25) — 2 bugs críticos más

A petición explícita del usuario ("¿también está correcto el tema de las publicaciones en las redes sociales?"), se lanzó una 3ª ronda del agente "Revisor de código" centrada solo en la parte de redes sociales del modo PCDays (que no había recibido el mismo escrutinio que monitor.js/articleUpdater.js en las 2 rondas anteriores). Encontró 2 bugs críticos más, ambos verificados de forma independiente con pruebas en vivo antes de corregirlos — los dos habrían hecho que **ninguna oferta autopublicada llegara nunca a Instagram/Facebook**, sin que nadie lo notara hasta revisar manualmente un run fallido en GitHub Actions:

- **`.github/workflows/publicar-en-redes.yml` y `publicar-automatico.yml`** — el paso "Esperar a que las imágenes estén servidas en vivo" tenía `for n in 1 2 3 4` hardcodeado en bash, sin tener en cuenta que el carrusel de una oferta solo genera 3 slides (`generateOfertaCarousel()`). Con 4 fijo, el slide 4 (inexistente para una oferta) nunca llegaba a `200` y el paso fallaba siempre por timeout (150s) para cualquier oferta — justo el camino que dispara `monitor.js` al autopublicar una de alta confianza. Corregido: ambos workflows ahora cuentan cuántos `${SLUG}-instagram-*.png` existen de verdad (ya generados y comiteados en el paso anterior) en vez de asumir un número fijo. Verificado en vivo simulando la detección con archivos reales: 3 para una oferta, 4 para un análisis normal.
- **`fitzdesk-monitor/socialReviewer.js`** — `MIN_IMAGE_BYTES = 50KB` se aplicaba igual a los 3 slides de oferta que a los 4 de análisis normal, pero el slide 2 de oferta ("Por qué comprarlo ahora": fondo oscuro liso + hasta 3 líneas cortas, sin las frases explicativas en gris que sí rellenan los slides 2/3 del carrusel normal) pesa de forma consistente ~44KB — confirmado por el agente regenerando el carrusel real, no un fallo puntual de compresión. Resultado: `reviewInstagramImages()` bloqueaba siempre la publicación de cualquier oferta en redes, incluso con todo lo demás correcto. Corregido con dos umbrales (`MIN_IMAGE_BYTES_NORMAL = 50KB`, `MIN_IMAGE_BYTES_OFERTA = 25KB`), elegido según `slideCountFor()`. Verificado en vivo: el caso real (44,1KB) pasa con el umbral de oferta y seguiría bloqueado con el antiguo umbral de 50KB; una imagen genuinamente corrupta (2KB) sigue bloqueada con el nuevo umbral también, así que no se ha perdido la protección real.

**1 advertencia menor corregida de paso**: comentarios desactualizados en `socialPublisher.js` que decían "carrusel de 4 slides" de forma absoluta en la cabecera del archivo y en un comentario junto a la creación del contenedor de Instagram — la lógica funcional ya usaba `slideCountFor()` correctamente en ambos sitios, solo la documentación in-code podía confundir. Actualizada para mencionar el caso de oferta (3 slides).

Build de Astro y sintaxis de los archivos tocados (`socialPublisher.js`, `socialReviewer.js`, los 2 workflows YAML) verificados tras los cambios. No se ha podido probar el flujo end-to-end completo contra la API real de Meta (necesitaría publicar de verdad), pero sí se verificó en vivo, de forma aislada, tanto la detección del número real de slides (bash) como el nuevo umbral de peso (Node) contra los valores reales observados.

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
