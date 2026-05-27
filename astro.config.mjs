import { defineConfig, squooshImageService } from 'astro/config';
import mdx from '@astrojs/mdx';
// sitemap requiere Node >= 18.17.1; actívalo tras actualizar Node:
// import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://fitzdesk.com',
  base: '/FitzDesk',          // sirve en http://localhost/FitzDesk/
  integrations: [mdx()],
  image: {
    service: squooshImageService(),
  },
});
