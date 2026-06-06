import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

// Path aliases ($engine, $content, $i18n) are declared in svelte.config.js so that
// SvelteKit, svelte-check, and Vite all agree. $lib is SvelteKit's built-in alias
// for src/lib and must not be redeclared here.
export default defineConfig({
  plugins: [sveltekit()]
});
