<script lang="ts">
  import '../app.css';
  import { setupI18n, isLoading, _, locale } from '$i18n/index.js';
  import LocaleToggle from '../ui/LocaleToggle.svelte';

  // Initialise svelte-i18n once, before children render.
  setupI18n();

  let { children } = $props();

  const t = $derived($_);
  // Keep <html lang> in sync with the active locale so screen readers announce the right
  // language (WCAG 2.2 — 3.1.1 Language of Page). SSR is off, so this runs client-side only.
  const lang = $derived(($locale ?? 'ru').startsWith('en') ? 'en' : 'ru');
  $effect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
    }
  });
</script>

<svelte:head>
  <title>{t('ui.pageTitle')}</title>
</svelte:head>

<a class="skip-link" href="#main-content">{t('ui.skipToContent')}</a>

<div class="app-shell">
  <header class="app-header">
    <div class="brand">
      <span class="brand-mark" aria-hidden="true">🛠️</span>
      <span class="brand-name">Agent Forge</span>
    </div>
    <LocaleToggle />
  </header>

  <main class="app-main" id="main-content" tabindex="-1">
    {#if $isLoading}
      <p class="loading">…</p>
    {:else}
      {@render children()}
    {/if}
  </main>
</div>

<style>
  .app-shell {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  .app-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 1.25rem;
    background: var(--surface);
    border-bottom: 1px solid var(--line);
    box-shadow: var(--shadow-soft);
    position: sticky;
    top: 0;
    z-index: 10;
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 700;
  }

  .brand-mark {
    font-size: 1.4rem;
  }

  .brand-name {
    font-size: 1.1rem;
    letter-spacing: 0.01em;
  }

  .app-main {
    flex: 1;
    width: 100%;
    max-width: 1080px;
    margin: 0 auto;
    padding: 1.25rem;
  }

  /* The <main> is only a programmatic skip-link target, not an interactive control —
     don't draw a focus ring around the whole page when it receives focus. */
  .app-main:focus {
    outline: none;
  }

  .loading {
    text-align: center;
    color: var(--ink-soft);
    padding: 3rem;
  }
</style>
