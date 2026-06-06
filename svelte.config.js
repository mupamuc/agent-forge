import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      pages: 'build',
      assets: 'build',
      // SPA fallback: client-side routing (incl. the dynamic /mission/[id] route) works without
      // prerendering each page. With ssr=false everywhere, index.html boots the router.
      fallback: 'index.html',
      precompress: false,
      strict: false
    }),
    alias: {
      $engine: 'src/engine',
      $content: 'src/content',
      $i18n: 'src/i18n'
    }
  }
};

export default config;
