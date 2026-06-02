import { defineConfig, squooshImageService } from 'astro/config';
import mdx from '@astrojs/mdx';
// @astrojs/sitemap requiere Node >= 18.17.1 — usamos sitemap estático en public/
// Activar cuando se actualice Node: import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://fitzdesk.com',
  base: '/FitzDesk',          // sirve en http://localhost/FitzDesk/
  integrations: [mdx()],
  image: {
    service: squooshImageService(),
  },
});
