import 'dotenv/config';

const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

if (!webhookUrl) {
  console.error('❌ DISCORD_WEBHOOK_URL no está configurada en .env');
  process.exit(1);
}

const payload = {
  embeds: [{
    title: '🐿️ Fitz ha detectado una novedad [PRUEBA]',
    color: 16345364,
    fields: [
      { name: '📦 Producto',      value: 'Logitech MX Master 4 Pro (TEST)', inline: true },
      { name: '📂 Categoría',     value: 'Ratones',                         inline: true },
      { name: '🔗 Fuente',        value: 'Xataka — https://xataka.com/test', inline: false },
      { name: '📝 Borrador generado', value: 'src/content/articulos/test-logitech-mx-master-4.md', inline: false },
      { name: '✅ Siguiente paso', value: 'Revisa el borrador, añade precio y enlace de afiliado, luego elimina borrador: true', inline: false },
    ],
    image: {
      url: 'https://resource.logitech.com/content/dam/logitech/en/products/mice/mx-master-3s/gallery/mx-master-3s-top-view-graphite.png',
    },
    footer: {
      text: `FitzDesk Monitor TEST • ${new Date().toLocaleString('es-ES')}`,
    },
  }],
};

console.log('Enviando notificación de prueba a Discord...');

const res = await fetch(webhookUrl, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
});

if (res.ok) {
  console.log('✅ Discord funcionando correctamente');
} else {
  const body = await res.text().catch(() => '');
  console.error(`❌ Error ${res.status} ${res.statusText}`);
  if (body) console.error(`   Detalle: ${body}`);
  process.exit(1);
}
