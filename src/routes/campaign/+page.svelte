<script lang="ts">
  import { base } from '$app/paths';
  import { _ } from '$i18n/index.js';
  import WorldMap from '../../ui/WorldMap.svelte';

  const t = $derived($_);
</script>

<div class="page">
  <a class="back-link" href="{base}/">← {t('ui.backToHome')}</a>
  <WorldMap />
</div>

<style>
  .page {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .back-link {
    align-self: flex-start;
    color: var(--ink-soft);
    font-weight: 600;
    text-decoration: none;
  }

  .back-link:hover {
    color: var(--accent-text);
  }
</style>
