// @ts-check
import { defineConfig } from 'astro/config';

import tailwind from '@astrojs/tailwind';
import preact from '@astrojs/preact';

// https://astro.build/config
export default defineConfig({
  output: 'static',
  integrations: [preact(), tailwind()],
  vite: {
    ssr: {
      external: ['node:url'],
    },
    build: {
      rollupOptions: {
        external: ['node:url', 'clean-stack'],
      },
    },
  },
});