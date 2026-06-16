import { defineConfig, squooshImageService } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://fitzdesk.com',
  base: '/',
  integrations: [mdx(), sitemap()],
  image: {
    service: squooshImageService(),
  },
});
