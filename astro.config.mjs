// @ts-check
import { defineConfig } from 'astro/config';

import tailwind from '@astrojs/tailwind';
import preact from '@astrojs/preact';

// https://astro.build/config
export default defineConfig({
  output: 'static',
  integrations: [preact(), tailwind()],
  vite: {
    optimizeDeps: {
      exclude: ['clean-stack'], // clean-stack をクライアントビルドから除外
    },
    resolve: {
      alias: {
        // node:url 依存を、ブラウザで利用可能な url モジュールにエイリアス
        'node:url': 'url',
      },
    },
    ssr: {
      external: ['node:url', 'url'], // SSR環境では、node:urlとurlを外部依存とする
    },
  },
});