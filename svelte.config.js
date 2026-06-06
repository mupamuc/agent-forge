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
      // prerendering each page. GitHub Pages serves 404.html for unknown deep links, which boots
      // the SPA router; the prerendered build/index.html (from src/routes/+page.ts) handles `/`.
      fallback: '404.html',
      precompress: false,
      strict: false
    }),
    // base is '' locally and in tests (byte-identical output), and set to the repo subpath on
    // GitHub Pages via BASE_PATH=/repo so internal links resolve under username.github.io/repo/.
    paths: { base: process.env.BASE_PATH || '' },
    alias: {
      $engine: 'src/engine',
      $content: 'src/content',
      $i18n: 'src/i18n'
    }
  }
};

export default config;
