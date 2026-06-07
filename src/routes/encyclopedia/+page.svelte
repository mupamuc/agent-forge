<script lang="ts">
  import { base } from '$app/paths';
  import { _ } from '$i18n/index.js';
  import { ENCYCLOPEDIA } from '$content/encyclopedia.js';

  const t = $derived($_);
</script>

<div class="page">
  <a class="back-link" href="{base}/">← {t('ui.backToHome')}</a>

  <header class="page-head">
    <h1>📖 {t('enc.title')}</h1>
    <p class="subtitle">{t('enc.subtitle')}</p>
  </header>

  <ul class="world-list">
    {#each ENCYCLOPEDIA as guide (guide.worldId)}
      <li>
        <a class="world-link" href="{base}/encyclopedia/{guide.worldId}">
          <span class="world-text">
            <span class="world-name">{t(guide.titleKey)}</span>
            <span class="world-intro">{t(guide.introKey)}</span>
          </span>
          <span class="world-count" aria-hidden="true">{guide.theses.length}</span>
        </a>
      </li>
    {/each}
  </ul>
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

  .page-head h1 {
    font-size: 1.6rem;
  }

  .subtitle {
    margin: 0.25rem 0 0;
    color: var(--ink-soft);
    max-width: 60ch;
  }

  .world-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
  }

  .world-link {
    display: flex;
    align-items: center;
    gap: 1rem;
    text-decoration: none;
    color: var(--ink);
    background: var(--surface);
    border: 1.5px solid var(--line);
    border-radius: var(--radius);
    padding: 1rem 1.15rem;
    box-shadow: var(--shadow-soft);
    transition:
      border-color 0.15s ease,
      transform 0.1s ease;
  }

  .world-link:hover {
    border-color: var(--accent);
    transform: translateY(-1px);
  }

  .world-text {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    flex: 1;
    min-width: 0;
  }

  .world-name {
    font-weight: 700;
    font-size: 1.05rem;
  }

  .world-intro {
    color: var(--ink-soft);
    font-size: 0.9rem;
  }

  .world-count {
    flex-shrink: 0;
    font-weight: 700;
    color: var(--accent-text);
    background: var(--accent-soft);
    border-radius: 999px;
    min-width: 1.9rem;
    height: 1.9rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
</style>
