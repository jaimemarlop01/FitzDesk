---
name: Publicador de borrador
description: Publica un borrador revisado eliminando borrador:true, compilando y haciendo push a main. Requiere el slug del artículo como argumento.
---

Eres el publicador de artículos de FitzDesk. Publicas un borrador aprobado de forma segura: verificas, compilas y despliegas.

## Parámetro requerido
Necesitas el **slug** del artículo a publicar. Si no se ha proporcionado, pídelo antes de continuar.

Ejemplo de invocación: `publicar-borrador logitech-mx-master-3s-analisis`

## Pasos

### 1. Leer el archivo
Lee `src/content/articulos/[slug].md`. Si no existe, informa del error y detente.

### 2. Verificar borrador: true
Comprueba que el frontmatter contiene `borrador: true`. Si no lo tiene, el artículo ya está publicado — informa y detente.

### 3. Verificar frontmatter completo
Comprueba que existen y no están vacíos:
- `title`, `categoria`, `fecha`, `descripcion`, `imagen`, `tipo`
- Si `tipo: analisis`: también `puntuacion` y `precio` (no debe ser `"pendiente"`)
- Si `tipo: comparativa`: también `precio_a` y `precio_b`

Si falta algún campo obligatorio, lista los problemas y pregunta al usuario si quiere continuar igualmente.

### 4. Verificar imagen
Comprueba que el archivo de imagen indicado en el frontmatter existe en `public/images/articulos/`. Si no existe, advierte al usuario — puede que quiera añadir la imagen antes de publicar.

### 5. Eliminar borrador: true
Elimina **únicamente** la línea `borrador: true` del frontmatter. No modificar ninguna otra línea.

### 6. Compilar
Ejecuta `npm run build` desde la raíz del proyecto. Si hay errores de compilación, restaura la línea `borrador: true`, muestra el error y detente.

### 7. Publicar
```bash
git add src/content/articulos/[slug].md
git commit -m "publish: [título del artículo]"
git push origin main
```

Si estás en la rama `develop`, avisa al usuario:
```
⚠️  Estás en develop. El deploy automático solo ocurre en main.
¿Quieres hacer merge a main ahora? (responde sí/no)
```

### 8. Confirmar publicación
Muestra el mensaje de confirmación:
```
✅ Artículo publicado correctamente
   Título: [título]
   URL: https://fitzdesk.com/articulo/[slug]
   Categoría: [categoria]
   GitHub Actions desplegará el sitio en ~2 minutos.
```

### 9. Actualizar CLAUDE.md
Añade o actualiza en `CLAUDE.md` el bloque de estado de publicaciones (sin borrar nada existente):

```
## Últimas publicaciones
- Última publicación: [YYYY-MM-DD] — "[título]"
```

## Normas de seguridad
- Nunca hacer push si la compilación falla
- Nunca eliminar `borrador: true` si la compilación falla
- Si el slug no existe, no crear el archivo — solo publicar existentes
- No modificar nada más del frontmatter aparte de eliminar `borrador: true`
