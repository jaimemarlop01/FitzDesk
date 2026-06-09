---
name: Revisor de borradores
description: Analiza todos los borradores pendientes en src/content/articulos/ y genera un informe de estado indicando cuáles están listos para publicar y cuáles tienen problemas.
---

Eres el revisor de borradores de FitzDesk. Tu tarea es analizar todos los artículos con `borrador: true` y producir un informe claro de su estado.

## Pasos

### 1. Localizar borradores
Lee todos los archivos `.md` en `src/content/articulos/` que contengan `borrador: true` en el frontmatter.

### 2. Verificar cada borrador
Para cada borrador comprueba:

**Frontmatter completo** — deben existir y no estar vacíos:
- `title` (no vacío, máximo 70 caracteres)
- `slug` (si existe — algunos lo omiten)
- `categoria` — debe ser una de: `ratones`, `teclados`, `monitores`, `portatiles`, `setups`, `comparativas`, `guias`
- `fecha` (formato YYYY-MM-DD)
- `descripcion` (no vacío, máximo 150 caracteres)
- `imagen` (ruta definida)
- `tipo` — debe ser uno de: `analisis`, `comparativa`, `guia`, `lanzamiento`
- `puntuacion` — obligatorio si `tipo: analisis`
- `precio` — no debe ser `"pendiente"` ni estar vacío si `tipo: analisis`

**Imagen** — comprueba que el archivo existe en `public/images/articulos/` (la ruta del frontmatter sin la barra inicial).

**Contenido mínimo** — el cuerpo del artículo (fuera del frontmatter) debe superar las 300 palabras.

**Sección Fitz** — debe existir la sección `## 🐿️ Fitz recomienda` en el cuerpo.

**Aviso de afiliado** — si `tipo: analisis` o `tipo: comparativa`, debe existir el bloque de aviso de afiliado al final.

### 3. Generar informe
Muestra el informe con este formato:

```
━━━ INFORME DE BORRADORES — [fecha] ━━━

✅ LISTOS PARA PUBLICAR ([n])
  • [slug] — "[título]"

⚠️  CON PROBLEMAS ([n])
  • [slug] — "[título]"
    - [problema 1]
    - [problema 2]

📊 RESUMEN
  Total borradores: [n]
  Listos: [n]
  Con problemas: [n]
```

### 4. Actualizar CLAUDE.md
Localiza la sección `## Bugs pendientes de resolver` en `CLAUDE.md` y, justo después, añade o actualiza un bloque con este formato (sin borrar nada existente):

```
## Estado de borradores
- Última revisión: [YYYY-MM-DD]
- Borradores pendientes: [n]
- Listos para publicar: [n]
```

Si el bloque ya existe, actualiza solo los valores numéricos y la fecha.

## Normas
- No modificar ningún artículo, solo leer y analizar
- Si un campo de frontmatter usa un valor no estándar de FitzDesk, marcarlo como problema
- Informar de cualquier borrador con nombre `borrador-` que lleve más de 7 días sin modificarse
