# FitzDesk

Web de análisis y recomendaciones de setups de trabajo, periféricos y componentes para profesionales remotos. Construida con Astro.

## Comandos

| Comando          | Acción                               |
|------------------|--------------------------------------|
| `npm install`    | Instala las dependencias             |
| `npm run dev`    | Servidor de desarrollo en `localhost:4321` |
| `npm run build`  | Build de producción en `./dist/`     |
| `npm run preview`| Preview local de la build            |

## Añadir un artículo nuevo

1. Crea un archivo `.md` en `src/content/articulos/`
2. Usa el frontmatter con esta estructura:

```md
---
title: "Título del análisis"
categoria: "ratones"          # ratones | teclados | monitores | portatiles | setups
fecha: "2026-06-01"           # formato YYYY-MM-DD
descripcion: "Descripción corta que aparece en las cards y en el SEO."
imagen: "/images/nombre-producto.svg"
puntuacion: 8.5               # número del 0 al 10 con un decimal
precio: "129€"
enlace_afiliado: "https://www.pccomponentes.com/..."
fitzQuote: "La opinión de Fitz sobre el producto en primera persona."
especificaciones:
  Conexion: "Bluetooth 5.2 / USB-C"
  Bateria: "Hasta 100 horas"
  Peso: "95 g"
---

## Sección del artículo

Contenido en Markdown...
```

3. Guarda el archivo. El artículo aparece automáticamente en la home y en su categoría.
4. La URL será `/articulo/nombre-del-archivo` (sin la extensión `.md`).

### Imágenes de productos

Coloca las imágenes en `public/images/`. Para desarrollo puedes crear un SVG placeholder o usar una imagen real (JPG/PNG/WebP recomendado para producción).

Tamaño recomendado para imágenes de artículos: **1200×630px** (ratio 16:9 / Open Graph).

## Categorías disponibles

| Slug         | Etiqueta     |
|--------------|--------------|
| `ratones`    | Ratones      |
| `teclados`   | Teclados     |
| `monitores`  | Monitores    |
| `portatiles` | Portátiles   |
| `setups`     | Setups       |

Para añadir una categoría nueva, agrégala en:
- `src/components/CategoryBadge.astro` (colores del badge)
- `src/components/Header.astro` (enlace en el menú)
- `src/components/Footer.astro` (enlace en el footer)
- `src/pages/index.astro` (tarjeta de categoría en el home)

## Estructura de archivos

```
FitzDesk/
├── public/
│   ├── images/          # Imágenes de productos y OG
│   ├── favicon.svg
│   └── robots.txt
├── src/
│   ├── components/
│   │   ├── Header.astro
│   │   ├── Footer.astro
│   │   ├── ArticleCard.astro
│   │   ├── CategoryBadge.astro
│   │   ├── ScoreBox.astro
│   │   ├── SpecsTable.astro
│   │   ├── AffiliateButton.astro
│   │   └── FitzQuote.astro
│   ├── content/
│   │   ├── config.ts         # Schema de las colecciones
│   │   └── articulos/        # Artículos en Markdown
│   ├── layouts/
│   │   └── BaseLayout.astro  # HTML base + SEO
│   ├── pages/
│   │   ├── index.astro
│   │   ├── about.astro
│   │   ├── contacto.astro
│   │   ├── articulo/[slug].astro
│   │   └── categoria/[slug].astro
│   └── styles/
│       └── global.css
├── astro.config.mjs
└── package.json
```

## Deploy en Netlify (gratis)

1. Sube el proyecto a GitHub
2. Entra en [netlify.com](https://netlify.com) y conecta el repositorio
3. Configura el build:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
4. Haz clic en Deploy — Netlify genera una URL gratuita automáticamente

El sitemap se genera automáticamente en `sitemap-index.xml` con cada build.

## Personalización futura

Algunas ideas para expandir FitzDesk:

- **Sistema de búsqueda**: integra Pagefind (compatible con Astro, sin servidor)
- **Página de comparativas**: compara dos productos lado a lado
- **Newsletter**: integra ConvertKit o Mailchimp con un formulario
- **Comentarios**: integra Giscus (basado en GitHub Discussions, gratuito)
- **Precios en tiempo real**: usa la API de PcComponentes si está disponible
- **Modo oscuro**: añade un toggle con `prefers-color-scheme` como base
