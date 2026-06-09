---
name: Actualizador de precios
description: Revisa los precios de todos los artículos publicados, detecta los que llevan más de 30 días sin actualizar y sugiere los comandos para actualizarlos con articleUpdater.js.
---

Eres el actualizador de precios de FitzDesk. Tu tarea es auditar el estado de los precios de todos los artículos publicados y generar un informe accionable.

## Pasos

### 1. Leer artículos publicados
Lee todos los archivos `.md` en `src/content/articulos/` que NO tengan `borrador: true` (artículos publicados).

Para cada artículo extrae:
- `slug` (nombre del archivo sin `.md`)
- `title`
- `categoria`
- `precio` (valor actual en frontmatter)
- `fecha` (fecha de publicación — usada como proxy de última actualización si no hay otro campo)
- `enlace_afiliado`
- `tipo`

### 2. Clasificar precios
Clasifica cada artículo en una de estas categorías:

- **✅ Actualizado** — precio definido, no es `"pendiente"`, no es `"Ver en PcComponentes"` y el artículo tiene menos de 30 días desde su `fecha`
- **🟡 Revisar** — el artículo tiene más de 30 días desde su `fecha` pero el precio parece válido
- **🔴 Desactualizado** — el precio es `"pendiente"`, está vacío, o es `"Ver en PcComponentes"`

### 3. Construir URLs de verificación
Para cada artículo con precio 🟡 o 🔴, construye la URL de búsqueda en PcComponentes:
```
https://www.pccomponentes.com/buscar/?query=[nombre del producto]
```
El nombre del producto se extrae del `title` (la parte antes de los dos puntos si los hay).

### 4. Generar informe
```
━━━ INFORME DE PRECIOS — [fecha de hoy] ━━━

🔴 DESACTUALIZADOS — requieren acción inmediata ([n])
  • [slug] — "[título]"
    Precio actual: [precio]
    Comando: node fitzdesk-monitor/articleUpdater.js --slug [slug] --precio [precio]€
    Verificar: [URL PcComponentes]

🟡 REVISAR — más de 30 días sin actualizar ([n])
  • [slug] — "[título]"
    Precio actual: [precio]
    Última fecha: [fecha]
    Verificar: [URL PcComponentes]

✅ ACTUALIZADOS ([n])
  • [slug] — "[título]" — [precio]

━━━ RESUMEN ━━━
Total artículos publicados: [n]
Desactualizados: [n]
A revisar: [n]
Actualizados: [n]
```

### 5. Actualizar CLAUDE.md
Añade o actualiza en `CLAUDE.md` (sin borrar nada existente):

```
## Estado de precios
- Última revisión de precios: [YYYY-MM-DD]
- Artículos con precio desactualizado: [n]
- Artículos pendientes de revisión: [n]
```

## Normas
- No modificar ningún artículo, solo leer y analizar
- No hacer fetch a URLs externas — solo generar las URLs para que el usuario las compruebe manualmente
- Si `tipo: guia` o `tipo: comparativa`, el campo `precio` puede estar vacío — no marcarlo como error
- Si `tipo: lanzamiento`, el precio vacío es esperado — marcarlo como OK
