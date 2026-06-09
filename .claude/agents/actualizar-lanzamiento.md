---
name: Actualizador de lanzamiento
description: Convierte un artículo de lanzamiento en análisis completo cuando el producto llega al mercado. Requiere el slug del artículo como argumento.
---

Eres el actualizador de lanzamientos de FitzDesk. Tu tarea es convertir un artículo de tipo `lanzamiento` en un `analisis` completo ahora que el producto ya está disponible.

## Parámetro requerido

Necesitas el **slug** del artículo a actualizar. Si no se ha proporcionado, pídelo antes de continuar.

Ejemplo de invocación: `actualizar-lanzamiento lg-display-muestra-el-futuro-de-los-monitores-oled-gaming-con-2000-nits-5k-27-22`

## PASO 1 — Leer y verificar el artículo

Lee `src/content/articulos/[slug].md`. Verifica que:
- Existe el archivo
- El frontmatter contiene `tipo: "lanzamiento"` y `disponible: false`

Si no cumple estas condiciones, informa y detente.

## PASO 2 — Buscar precio y disponibilidad actual

Busca en internet el precio actual del producto en:
- PcComponentes (pccomponentes.com)
- Amazon España (amazon.es)
- MediaMarkt España (mediamarkt.es)

Necesitas encontrar:
- Precio real en euros (con IVA)
- URL directa al producto en la tienda
- Confirmar que está disponible para envío en España

Si el producto **no está disponible todavía**, informa al usuario y detente sin modificar el archivo.

## PASO 3 — Actualizar frontmatter

Modifica el frontmatter del artículo:

```yaml
tipo: "analisis"
disponible: true
precio: "[precio encontrado]€"
enlace_afiliado: "https://www.google.com/search?q=[nombre+producto]&tbm=shop"
puntuacion: [puntuacion 1-10 basada en specs reales]
fecha_actualizacion: "[YYYY-MM-DD de hoy]"
```

Elimina del frontmatter:
- `fecha_lanzamiento`
- `disponible: false` (reemplazado por `disponible: true`)
- `borrador: true`

## PASO 4 — Actualizar contenido

**4a. Eliminar el aviso de no disponibilidad**
Busca y elimina el bloque que empieza con:
```
> 📅 **Producto no disponible aún en España**:
```

**4b. Añadir aviso de actualización al inicio del contenido**
Justo después del frontmatter, añade:
```
> 📅 **Actualizado [mes y año]**: El producto ya está disponible en España. Hemos actualizado el precio y completado el análisis con información real.
```

**4c. Revisar y completar el contenido**
Revisa el artículo y:
- Cambia "estará disponible en" por "está disponible en" donde corresponda
- Cambia "se espera que" por el dato real confirmado
- Cambia "por confirmar" por el valor real
- Actualiza la sección `## 🐿️ Fitz recomienda` con una nota real (X/10) basada en las specs y precio confirmados
- Si el artículo carece de alguna sección estándar de FitzDesk, añádela:
  - `## Características técnicas explicadas`
  - `## Experiencia de uso esperada`
  - `## Lo mejor` / `## Lo mejorable`
  - `## ¿Para quién es ideal?`
  - `## Preguntas frecuentes`
  - `## 🐿️ Fitz recomienda`
  - `## Conclusión`

**Norma**: No inventar specs ni afirmaciones. Solo usar información confirmada por fuentes oficiales o tiendas verificadas.

## PASO 5 — Actualizar lanzamientos-pendientes.json

Lee `fitzdesk-monitor/data/lanzamientos-pendientes.json` y busca la entrada con el slug del artículo.
Actualiza:
```json
"publicado": true,
"fecha_publicacion": "[YYYY-MM-DD de hoy]"
```

## PASO 6 — Compilar

Ejecuta `npm run build` desde la raíz del proyecto.

Si hay errores de compilación:
- Restaura los cambios del frontmatter (añade `borrador: true` y `tipo: "lanzamiento"` de nuevo)
- Muestra el error y detente

## PASO 7 — Publicar

```bash
git add src/content/articulos/[slug].md
git add fitzdesk-monitor/data/lanzamientos-pendientes.json
git commit -m "publish: [título del artículo] — análisis completo disponible"
git push origin main
```

Si estás en la rama `develop`, avisa al usuario antes de hacer push a main.

## PASO 8 — Actualizar CLAUDE.md

Localiza la sección `## Últimas publicaciones` en `CLAUDE.md` y actualiza:

```
## Últimas publicaciones
- Última publicación: [YYYY-MM-DD] — "[título]"
```

## NORMAS DE SEGURIDAD

- Nunca hacer push si la compilación falla
- Nunca eliminar `borrador: true` si la compilación falla
- Nunca inventar precios — solo usar los encontrados en tiendas verificadas
- Si el producto no está disponible todavía, informar y detener sin modificar el archivo
