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
node socialPublisher.js --slug [slug]                         # publica en Instagram + Facebook
node socialPublisher.js --slug [slug] --only facebook         # solo Facebook (reintentos sin duplicar Instagram, añadido 2026-06-23)
node socialPublisher.js --slug [slug] --only instagram        # solo Instagram
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
- [x] ✅ Merge completo `develop` → `main` (2026-06-24, commit `a9b108a`) — todo el sistema de imágenes/captions/revisión de redes (`socialImageGenerator.js`, `instagramImageGenerator.js`, `socialContent.js`, `socialReviewer.js`, dependencia `puppeteer`) ya está en producción
- [ ] Conseguir imagen oficial real de `airra-labs-rotary-mouse-analisis` (desplazado al 11/08, último slot del calendario, el 2026-06-22 — ver "Estado del calendario de publicaciones"). El placeholder genérico de ratón no es válido para publicar. `razer-seiren-v3-pro-analisis` ya resuelto con imagen oficial real (descargada directamente de Razer, 2026-06-21). `asus-portatiles-trabajo-exigente-2026` ya resuelto con foto real proporcionada por el usuario (2026-06-22)
- [ ] Activar Pinterest cuando se apruebe el scope `pins:write` en la API de Pinterest (aparcado el 2026-06-23 — se activó brevemente el mismo día y se revirtió a `PINTEREST_ENABLED = false` por falta de esa aprobación). Cuando se apruebe: cambiar `PINTEREST_ENABLED = true` en `socialPublisher.js` y confirmar que `PINTEREST_ACCESS_TOKEN`/`PINTEREST_BOARD_ID` existen como secrets reales en GitHub (a fecha de hoy no hay confirmación de que existan)
- [ ] Lanzar prompt de búsqueda de productos cuando queden menos de 6 borradores
- [ ] Solicitar alta en Awin en Julio 2026 cuando haya 30+ artículos publicados
- [x] Configurar Google Search Console — propiedad fitzdesk.com verificada por DNS (TXT record, 2026-06-12); sitemap enviado, pendiente confirmación de indexación por parte de Google (hasta 24h)
- [ ] Registrar @fitzdesk en redes sociales

## Estado de borradores
- Última revisión: 2026-06-21
- Última ejecución de completar-borradores: 2026-06-24
- Borradores descartados: 0 en esta pasada
- Borradores completados y con fecha en el calendario: 18 (7 ya estaban calendarizados + 11 huérfanos incorporados hoy, ver "Estado del calendario de publicaciones")
- Lanzamientos Computex pendientes de disponibilidad: borrador-adata-urban-tapsafe (precio sin tocar, según instrucción — esperando disponibilidad real del producto; imagen rota corregida, ver pasada 2026-06-24)
- **Pasada 2026-06-24 — corrección puntual sobre 8 borradores señalados por el Revisor de borradores** (working directory; sin tocar `borrador: true`, sin renombrar archivos, sin push a `main`):
  - `borrador-adata-lleva-a-computex-b2026b-el-urban-tapsafe-un-ssd-externo-que-se-desbloquea-.md` — el campo `imagen` apuntaba a un archivo .webp inexistente en disco. Generado placeholder honesto (mismo estilo que el de Airra Labs: fondo `#F9FAFB`, patrón de puntos, icono genérico de SSD, texto "Imagen provisional — pendiente de imagen oficial") + thumb. Precio sigue sin resolver, intencionadamente (lanzamiento sin disponibilidad real todavía)
  - `airra-labs-rotary-mouse-analisis` — `precio: "Ver precio"` no se pudo resolver con una fuente fiable; queda pendiente de revisión humana o de disponibilidad real del producto. Imagen placeholder ya existente intencionadamente sin tocar
  - `borrador-asus-rog-strix-scar-18-analisis.md` — verificada la longitud real de `descripcion`: 147 caracteres, dentro del límite de 150 (el conteo de 153 reportado por el Revisor no se correspondía con el contenido actual del archivo). No requirió cambio. `precio: "Ver precio"` sigue sin resolver, pendiente
  - `lg-ultragear-34gx90sb-w-analisis` — `precio: "Ver precio"` sin fuente fiable, queda pendiente
  - `borrador-logitech-k380-analisis.md` — la imagen (`logitech-k380-analisis.webp`) era el logo genérico "logi" de Logitech, idéntica byte a byte a las de mk470 y mobi-fold. Se intentó `imageCollector.js --slug logitech-k380-analisis` con varias queries manuales (español e inglés): en todos los casos la ruta "vía fabricante" siguió devolviendo el mismo logo genérico del dominio logitech.com en vez de una foto del producto — bug del collector con el sitio de Logitech, no resuelto. Sustituida por un placeholder honesto propio (icono de teclado) + thumb, en vez de dejar la imagen engañosa. Precio (39,99€) ya estaba resuelto, sin cambios
  - `borrador-logitech-mk470-analisis.md` — mismo bug de imagen genérica que K380, mismo fix (placeholder honesto, icono de combo teclado+ratón). `title` recortado de 74 a 63 caracteres ("Logitech MK470: combo teclado y ratón para teletrabajo sencillo"). `precio: "Ver precio"` sin resolver, pendiente
  - `razer-seiren-v3-pro-analisis` — `precio: "Ver precio"` sin fuente fiable, queda pendiente (imagen oficial ya resuelta en pasada anterior, sin tocar)
  - `logitech-mobi-fold-analisis.md` — mismo bug de imagen genérica, mismo fix (placeholder honesto, icono de ratón). `title` recortado de 82 a 66 caracteres ("Logitech Mobi Fold: ratón compacto plegable para teletrabajo móvil"). Añadido `enlace_afiliado` que faltaba por completo (`https://www.pccomponentes.com/buscar/?query=logitech+mobi+fold`, mismo formato que el resto del sitio). `precio: "Ver precio"` sin resolver, pendiente
  - **Pendiente de resolución manual o con fuente externa**: precios reales de airra-labs-rotary-mouse, asus-rog-strix-scar-18, lg-ultragear-34gx90sb-w, logitech-mk470, razer-seiren-v3-pro, logitech-mobi-fold — y 2 imágenes honestas-placeholder (MK470, Mobi Fold) siguen pendientes de una foto real de producto, igual que Airra Labs
  - **✅ RESUELTO 2026-06-24 (tarde)**: `logitech-k380-analisis` ya tiene foto real del producto (3 teclas Bluetooth amarillas numeradas, característica distintiva del K380), proporcionada por el usuario en su carpeta de Descargas como `logitech-k380-analisis.jpg`. Procesada con Sharp (mismo método que el resto: fondo `#F9FAFB`, 1200x675 + thumb 400x225), sustituyendo el placeholder honesto. Resuelto justo a tiempo para su publicación programada del 2026-06-25
  - Build verificado con `npm run build` tras los cambios: 37 páginas generadas, sin errores ni warnings; los borradores con `borrador: true` no generan página propia, como se esperaba
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
- Última revisión: 2026-06-24 (7ª pasada — revisión de los archivos nuevos de redes sociales: socialPublisher.js, socialContent.js, socialReviewer.js, instagramImageGenerator.js, socialImageGenerator.js, además de barrido completo de src/ y fitzdesk-monitor/)
- Errores críticos pendientes: 0 | Estado: ✅ Sin errores críticos
- Advertencias 2026-06-24: 2 (1 nueva + 1 ya conocida sin corregir, ver detalle abajo). 1 advertencia conocida corregida en esta pasada.
- Correcciones aplicadas en esta pasada (2 archivos):
  - ScoreBox.astro — colores hardcodeados (#16a34a, #F97316, #DC2626) reemplazados por scoreColor() de src/lib/score.ts (advertencia pendiente desde 2026-06-17, ahora resuelta — mismo patrón ya aplicado en ArticleCard.astro y [slug].astro)
  - buscar.astro:591 — `.card-sep` usaba #9CA3AF hardcodeado en vez de var(--color-text-secondary); corregido
- Advertencias pendientes tras esta pasada:
  - global.css:5 — --color-brand-dark sigue siendo #EA6A00 mientras CLAUDE.md documenta #EA580C; dos valores distintos en uso (comparar.astro usa --color-primary-dark: #EA580C). Verificado de nuevo el 2026-06-24, persiste sin cambios.
  - index.astro / Footer.astro — colores #9CA3AF, #6B7280, #D1D5DB hardcodeados en CSS de secciones oscuras (why-section, footer); persisten sin cambios desde 2026-06-17, candidatos a var(--color-text-secondary) o una nueva variable para textos sobre fondo oscuro
- Sugerencias menores 2026-06-24 (sin corregir, bajo impacto):
  - slugify() está duplicada en 4 archivos del monitor (analyzer.js, compareGenerator.js, guideGenerator.js, launchGenerator.js) — mismo cuerpo de 8 líneas en los 4; candidata a extraer a un helper compartido si se vuelve a tocar alguno de estos scripts
  - instagramImageGenerator.js:86-90 — función scoreColor() local con colores hardcodeados (#16a34a/#F97316/#DC2626) que replica src/lib/score.ts; no se puede importar directamente porque ese módulo es TypeScript en el ámbito de Astro y este archivo corre en Node puro fuera del build — el comentario en el código ya lo explica, se deja igual
  - _convert_tmp.cjs (raíz del repo, sin trackear en git) — script de conversión puntual de una imagen con una ruta local de Windows hardcodeada (C:/Users/jaimi/Downloads/...); no forma parte del código fuente real, candidato a borrar si ya no se necesita
  - publicar-automatico.yml / publicar-en-redes.yml — el step "Setup Node.js" no usa `cache: npm`, a diferencia de monitor.yml y deploy.yml; impacto bajo porque fitzdesk-monitor tiene pocas dependencias y estos workflows corren pocas veces por semana
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
- Última revisión de precios: 2026-06-24
- **Precios actualizados con dato real verificado en PcComponentes (5 de 12 pendientes)**: benq-gw2780-analisis (149€→266,81€), logitech-mx-keys-s-analisis (119€→74,95€), logitech-mx-master-3s-analisis (99€→145,99€), logitech-lift-vertical-analisis (69€→45,90€), logitech-mx-anywhere-3s-analisis (49€→59,99€). Todos vía `articleUpdater.js --slug [slug] --precio [precio]€`, con `fecha_actualizacion` añadida automáticamente
- **Bug encontrado en `articleUpdater.js` (modo `completar-secciones`, el que corre sin `--slug`)**: al añadir `keyword_principal`/`keywords_secundarias` en artículos donde faltaban, inserta los campos nuevos antes de la línea `tipo:` existente sin eliminarla, dejando `tipo:` duplicado en el frontmatter (YAML lo tolera tomando el último valor, pero es un bug real). Detectado y corregido manualmente en los 5 archivos afectados en esta pasada (aoc-q27p3cv, cherry-kc-6000-slim, hp-935-creator-wireless, jabra-evolve2-30-se, logitech-k380, todos borradores). No se ha corregido el script en sí, solo los archivos ya afectados — pendiente si se vuelve a tocar `articleUpdater.js`
- **Ronda 2 — búsqueda en otras tiendas tras confirmar que PcComponentes ya no los lista** (a petición del usuario: "si no se encuentra en una o dos webs no detenerse y seguir buscando"). Resultado: 3 más actualizados con precio real de otra tienda, 1 confirmado descatalogado de verdad (no solo fuera de PcComponentes), 2 siguen sin precio fiable:
  - `dell-s2722qc-analisis` (623,83€, vía idealo.es — el producto SIGUE a la venta, confirmado también en MediaMarkt/Amazon/Dell oficial; solo desapareció del catálogo de PcComponentes, no es descatalogue real)
  - `lg-27un880` (479€→435,00€, vía idealo.es — confirmado también en Worten y LG España oficial; mismo caso, solo fuera de PcComponentes)
  - `keychron-k8-pro-analisis` (109€→119,95€, vía COOLMOD, switch Gateron G Pro Red ISO-ES, coincide con la config del artículo)
  - **`keychron-k2-v2` confirmado descatalogado de verdad** (no solo ausente en PcComponentes): comprobado en 5 fuentes independientes — PcComponentes, Amazon.es, idealo.es, COOLMOD y la tienda oficial `keychron.com.es` — ninguna lista ya el modelo "K2 V2" exacto, todas solo ofrecen K2 Pro/Max/HE (generaciones posteriores). Pendiente decidir si se marca como descatalogado en el propio artículo
  - `keychron-v1-analisis`: confirmado que SIGUE a la venta (listado en COOLMOD con el switch exacto del artículo, K Pro Red/Brown ISO-ES) pero no se ha podido leer el precio — Amazon.es bloqueó la lectura automática (503 repetido, protección anti-bots), COOLMOD redirige en bucle, y la tienda oficial keychron.com.es carga el precio por JS y no aparece en el HTML estático. Necesita una comprobación manual de 30 segundos en cualquiera de esas páginas
  - `lenovo-thinkpad-e14-gen6-analisis` y `asus-vivobook-15-oled-analisis`: sin cambios, la configuración exacta del artículo (Ryzen 7 8845HS/Core Ultra 7 para el Lenovo; Core i5-13500H/i7-13700H para el ASUS) sigue sin aparecer en ningún sitio comprobado (PcComponentes, Amazon, fabricante) — a diferencia de los casos anteriores, este parece ser un cambio de generación real en todo el mercado, no solo ausencia en una tienda
- Artículos pendientes de revisión (>30 días), tras esta pasada: 4 (keychron-v1-analisis — precio no legible automáticamente; keychron-k2-v2 — descatalogado, pendiente decidir tratamiento editorial; asus-vivobook-15-oled-analisis y lenovo-thinkpad-e14-gen6-analisis — generación de producto distinta en todo el mercado)

## Estado del calendario de publicaciones
- Ritmo: Domingo c/2 semanas (guía/comparativa) · Martes y jueves (análisis/lanzamiento, 9:00–14:00 — hora exacta no garantizada por retrasos de cola en GitHub Actions, ver nota 2026-06-18)
- Calendario generado: 2026-06-22
- **airra-labs-rotary-mouse pendiente de imagen oficial — no programar hasta conseguirla.** La búsqueda automática (imageCollector.js, incluso con `--query` manual) no encuentra una imagen real del producto; el placeholder generado el 2026-06-22 no es válido para publicar tal cual
- **Cambio de calendario 2026-06-22**: `airra-labs-rotary-mouse-analisis` se retira de su slot del 23/07 (jueves) por falta de imagen oficial. En vez de dejar hueco o descartarlo, se desplazó toda la secuencia martes/jueves un slot hacia atrás (jabra-evolve2-30-se 28/07→23/07, cherry-kc-6000-slim 30/07→28/07, logitech-mk470 04/08→30/07, trust-tk-350-silent 06/08→04/08, razer-seiren-v3-pro 11/08→06/08) y Airra Labs pasa a ocupar el último slot libre, el 11/08 (martes). Acuerdo con el usuario: si sigue sin imagen cuando se vuelva a regenerar el calendario, se desplaza de nuevo al final (no se descarta el borrador, solo se pospone indefinidamente). Categorías vecinas verificadas sin repetición consecutiva tras el desplazamiento (21/07 monitores → 23/07 setups → 26/07 guias → 28/07 teclados → 30/07 setups → 04/08 teclados → 06/08 setups → 09/08 guias → 11/08 ratones)
- **Corregido 2026-06-21: error de día de la semana.** Una sesión anterior calculó mal el día de semana de fechas de julio (asumió 10/07=jueves y 13/07=domingo cuando en realidad 10/07=viernes y 13/07=lunes). Verificado con cálculo de fecha real (no a mano): el jueves real sin cubrir era el **09/07** y el domingo quincenal real (14 días tras el 28/06) es el **12/07**. Todas las fechas de julio/agosto de esta entrada están verificadas con `Date.UTC()`, no contadas a mano
- Calendario completo hasta 2026-08-11 (22 publicaciones totales, 4 ya publicadas: mejor-raton 14/06, samsung 16/06, hp-probook 18/06, razer-pro-click 23/06)
- Próxima publicación pendiente: 2026-06-25 — logitech-k380-analisis (analisis, teclados, jueves)
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
- Última publicación: 2026-06-23 — "Razer Pro Click: el ratón profesional de Razer que olvida los LEDs" (analisis) — publicado automáticamente vía workflow a las 08:44 UTC; deploy disparado solo (vía `workflow_run`, sin push humano de rescate) y completado a los ~3 min. Primera publicación que confirma el fix del bug de deploy funcionando de extremo a extremo sin intervención manual. Confirmado visible en producción (HTTP 200, imagen + thumb + categoría ratones todos OK)
- 2026-06-18 — "HP ProBook 455 G10: AMD Ryzen empresarial sin precio empresarial" (analisis) — publicado automáticamente vía workflow el 18/06, pero invisible en el sitio real hasta el 21/06 por el bug de deploy (ver sección de bugs); confirmado visible en producción tras el fix
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
- **Facebook**: `POST /{FACEBOOK_PAGE_ID}/feed` (Graph API v25.0) con `message` (caption), `link` (URL del artículo) y `picture` (imagen — reintroducido 2026-06-24, ver imágenes de redes abajo). **Cambiado 2026-06-23** desde `/{FACEBOOK_PAGE_ID}/photos` — el motivo reportado ("usaba `publish_actions`, deprecado") no se correspondía con el código real (nunca se referenció ese permiso; `/photos` ya usaba `pages_manage_posts`), pero el cambio a `/feed` se aplicó igualmente porque añade la vista previa del enlace al artículo, no solo la foto suelta
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
- Manejo de errores: si Instagram falla, se loguea y continúa con Facebook; si Facebook falla, se loguea igual; si **ambas** fallan, se notifica a Discord vía `notifyDiscordError()` con el detalle de ambos errores — nunca falla en silencio. Pinterest no participa en esa comprobación (no aplica mientras esté desactivado)
- **Notificación de éxito a Discord (2026-06-24)**: hasta ahora, si la publicación salía bien no se avisaba de nada (solo quedaba en los logs de GitHub Actions) — detectado porque el usuario nunca veía confirmación de los éxitos, solo los fallos. `notifyDiscordSuccess()` notifica en cuanto **al menos una red** publique correctamente, con el id de cada red que tuvo éxito y el motivo concreto de la que falló (si alguna falló) — así nunca hay que mirar los logs para confirmar una publicación
- **Cuidado al probar `socialPublisher.js` sin `--test` en local**: si el `.env` local tiene un `DISCORD_WEBHOOK_URL` real configurado (para otras pruebas), cualquier ejecución real sin los tokens de Instagram/Facebook configurados dispara una notificación de fallo real al Discord de producción, aunque no se publique nada — pasó durante el desarrollo de esta función. Usar `--test` para probar el flujo sin ese efecto secundario
- Lee `title`, `descripcion` y `categoria` directamente del frontmatter del artículo ya publicado (no requiere pasar esos datos por el workflow) — solo necesita el slug
- Secrets usados: `INSTAGRAM_ACCESS_TOKEN`, `INSTAGRAM_ACCOUNT_ID`, `INSTAGRAM_APP_ID`, `INSTAGRAM_APP_SECRET`, `FACEBOOK_PAGE_ACCESS_TOKEN`, `FACEBOOK_PAGE_ID`, `GROQ_API_KEY` (mismo secret que ya usaba `analyzer.js`, reutilizado 2026-06-24 para los captions); `PINTEREST_ACCESS_TOKEN`/`PINTEREST_BOARD_ID` referenciados en el workflow pero todavía no creados como secrets (esperado, generan aviso benigno del linter del IDE)
- **Nueva dependencia 2026-06-24**: `puppeteer` (Chromium headless completo, ~150-300MB) añadido a `fitzdesk-monitor/package.json` solo para `instagramImageGenerator.js`. Aumenta el tiempo de `npm ci --omit=dev` en los workflows — los pasos ya existentes ("Instalar dependencias del monitor") no necesitan cambios, pero tardarán más
- **Sin idempotencia**: el script no comprueba en ningún sitio si un artículo ya se publicó antes en Instagram/Facebook (ni caché local ni consulta a la API). Relanzarlo para el mismo slug publica de nuevo en **ambas** redes, sin excepción. Para reintentar solo la red que falló sin duplicar la que ya tuvo éxito, usar `--only facebook` o `--only instagram` (añadido 2026-06-23) — tanto en el script como en el input `only` de `publicar-en-redes.yml`

### ✅ RESUELTO 2026-06-24: primera publicación real confirmada en Instagram y Facebook

Tras activar el publisher (22/06) y corregir los bugs de código (23/06 — `INSTAGRAM_ACCOUNT_ID`, endpoint `/feed`, `npm ci` faltante), las pruebas reales seguían fallando. Dos causas adicionales, ambas de configuración en el lado de Meta, no de código:

1. **Instagram — "Media ID is not available" (código 9007)**: `media_publish` se llamaba justo después de crear el contenedor, sin esperar a que Instagram terminara de descargar/procesar la imagen. **Corregido en código**: nueva función `waitForContainerReady()` que sondea `status_code` hasta `FINISHED` (máx. ~20s) antes de publicar.
2. **Facebook — error `(#200)` de permisos, persistente incluso con un token con todos los scopes concedidos** (`pages_read_engagement`, `pages_manage_posts` confirmados vía `/me/permissions`). Tras descartar rol de app, acceso a página y vínculo Business Manager (todo correcto), la causa real era que **`FACEBOOK_PAGE_ID` guardado en GitHub no era el ID correcto de la página** — el error `(#200)` de Meta es genérico y no distingue "permiso insuficiente" de "ID de página equivocado". Resuelto obteniendo el ID real (`1097597110114567`) vía `GET /me/accounts` con un token de Usuario del Sistema, y actualizando el secret.
3. De paso, se migró de un token personal (Graph API Explorer, con el problema recurrente de que el desplegable "página" revertía solo a "usuario") a un **Usuario del Sistema de Business Manager ya existente** ("FitzDesk Automatización", con Página + App + Instagram ya asignados con acceso total) — más robusto para automatización porque no caduca como un token personal. `FACEBOOK_PAGE_ACCESS_TOKEN` e `INSTAGRAM_ACCESS_TOKEN` actualizados con un token de ese Usuario del Sistema.

**Confirmado**: ejecución de `publicar-en-redes.yml` del 2026-06-24 08:32 UTC completada con éxito, publicación real verificada en ambas redes para `razer-pro-click-analisis`.

**Limpieza pendiente**: el `console.log` temporal de depuración en `publishFacebook()` (longitud + últimos 4 caracteres del token) sigue en el código — quitarlo ahora que el problema está resuelto.

### Bug crítico encontrado y corregido 2026-06-23: "Publicar en redes sociales" nunca había funcionado de verdad

`socialPublisher.js` usa `dotenv` y `gray-matter`, que no son built-ins de Node. `publicar-automatico.yml` nunca tuvo un paso `npm install`/`npm ci` para `fitzdesk-monitor` — el checkout no incluye `node_modules` (gitignored). Resultado: el step "Publicar en redes sociales" fallaba siempre con `ERR_MODULE_NOT_FOUND: Cannot find package 'dotenv'`, **independientemente de si los secrets existían o no**. No hay ningún registro en este documento de una publicación real confirmada en Instagram/Facebook (con ID de respuesta) desde que se integró el 22/06 — consistente con que nunca llegó a ejecutarse con éxito.

**Detectado** al intentar republicar manualmente `razer-pro-click-analisis` vía `workflow_dispatch` con `fecha_override`. Reproducido localmente simulando el checkout limpio de CI (`git archive origin/main` + sin `node_modules`): el script revienta en el `import 'dotenv/config'` antes de llegar siquiera a comprobar los secrets.

**✅ RESUELTO**: añadido el paso "Instalar dependencias del monitor" (`npm ci --omit=dev` en `fitzdesk-monitor/`) justo antes de "Publicar en redes sociales" en `publicar-automatico.yml`. Verificado localmente con una simulación completa del checkout de CI + `npm ci`: el script ya carga el artículo y genera los captions correctamente (faltan solo los secrets, que sí existen en GitHub Actions).

### Bug relacionado encontrado el mismo día: relanzar el workflow para un día ya publicado falla siempre

`auto-publisher.js --check` no distingue si la entrada del calendario ya tiene `publicado: true` — solo mira si hay una entrada para la fecha. Al relanzar `publicar-automatico.yml` con `fecha_override` sobre un día ya publicado, el paso "Obtener borrador e imagen desde develop" intenta hacer `git checkout origin/develop -- src/content/articulos/borrador-[slug].md`, pero ese archivo ya no existe (fue renombrado sin el prefijo `borrador-` al publicarse la primera vez) → falla siempre con el mismo error. No es un fallo puntual, se repetirá en cualquier reintento futuro sobre una fecha ya publicada.

**Solución aplicada — workflow nuevo en vez de tocar `auto-publisher.js`**: `.github/workflows/publicar-en-redes.yml`, disparable manualmente (`workflow_dispatch`, input `slug`), que solo ejecuta `socialPublisher.js --slug [slug]` sobre el artículo ya publicado en `main` — sin pasar por el calendario ni por `auto-publisher.js`. Sirve para republicar en redes sociales (o publicar la primera vez si el pipeline automático falló en ese paso) sin arriesgar el resto del pipeline de contenido. Uso: GitHub → Actions → "Publicar en redes sociales (manual)" → Run workflow → introducir el slug ya publicado (sin prefijo `borrador-`).

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
