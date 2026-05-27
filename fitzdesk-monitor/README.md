# FitzDesk Monitor

Sistema automático de alertas de novedades tech para FitzDesk. Monitoriza feeds RSS,
detecta productos relevantes y genera borradores de análisis usando la API de Claude.

## Instalación

```bash
cd fitzdesk-monitor
npm install
cp .env.example .env
# Editar .env con tu API key de Anthropic
```

## Cómo obtener la API key de Anthropic

1. Ve a [console.anthropic.com](https://console.anthropic.com)
2. Crea una cuenta o inicia sesión
3. En el menú lateral, ve a **API Keys**
4. Haz clic en **Create Key** y copia la clave
5. Pégala en el `.env` como `ANTHROPIC_API_KEY=sk-ant-...`

## Configuración (.env)

| Variable | Descripción | Por defecto |
|---|---|---|
| `ANTHROPIC_API_KEY` | API key de Anthropic | **Requerida** |
| `ASTRO_CONTENT_PATH` | Ruta a los artículos de FitzDesk | `../FitzDesk/src/content/articulos` |
| `CHECK_INTERVAL_HOURS` | Horas entre comprobaciones (daemon) | `24` |
| `DISCORD_WEBHOOK_URL` | Webhook de Discord (opcional) | vacío |
| `SLACK_WEBHOOK_URL` | Webhook de Slack (opcional) | vacío |

## Uso

### Comprobar novedades una vez
```bash
node monitor.js
# o
npm start
```

### Modo daemon (comprueba automáticamente cada X horas)
```bash
node monitor.js --daemon
# o
npm run daemon
```

### Solo detección (sin generar borradores — no necesita API key)
```bash
# Deja ANTHROPIC_API_KEY vacía en .env y ejecuta:
node monitor.js
```

## Añadir Google Alerts

1. Ve a [google.com/alerts](https://www.google.com/alerts)
2. Crea una alerta para términos como "teclado mecánico 2026", "ratón ergonómico nuevo"
3. En las opciones, selecciona **Entregar a** → **Feed RSS**
4. Copia la URL del feed y añádela en `sources.js`:

```js
{
  name: 'Google Alert — teclados',
  url: 'https://www.google.com/alerts/feeds/TU_ID/...',
  enabled: true,
}
```

## Estructura de archivos generados

Los borradores se guardan en la carpeta de artículos de FitzDesk con el prefijo `borrador-`:

```
FitzDesk/src/content/articulos/
└── borrador-logitech-mx-master-4s-analisis.md
```

Cada borrador incluye:
- Frontmatter completo con campos marcados como `pendiente`
- Aviso de revisión al inicio del archivo
- Checklist de datos a completar antes de publicar
- Contenido generado por Claude listo para editar

## Logs

La actividad se registra en `logs/novedades.log`. Los logs incluyen:
- Feeds leídos y número de artículos encontrados
- Artículos relevantes detectados
- Borradores generados
- Errores de conexión o API

## Flujo de trabajo recomendado

1. Ejecuta el monitor una vez al día (`npm start`) o en modo daemon (`npm run daemon`)
2. Cuando aparezca un borrador en `src/content/articulos/borrador-*.md`:
   - Abre el archivo y revisa el contenido generado
   - Completa los datos marcados como `[COMPLETAR]`
   - Actualiza el precio, enlace de afiliado e imagen
   - Pon la puntuación real basada en el análisis
   - Elimina la línea `borrador: true` del frontmatter
   - Renombra el archivo (quita el prefijo `borrador-`)
3. Ejecuta `npm run build` en el proyecto FitzDesk para publicar
