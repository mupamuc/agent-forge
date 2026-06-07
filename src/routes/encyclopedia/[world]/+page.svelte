<script lang="ts">
  import { base } from '$app/paths';
  import { page } from '$app/stores';
  import { _ } from '$i18n/index.js';
  import { getWorldGuide } from '$content/encyclopedia.js';

  const t = $derived($_);
  const worldId = $derived($page.params.world ?? '');
  const guide = $derived(getWorldGuide(worldId));
</script>

<div class="page">
  <a class="back-link" href="{base}/encyclopedia">← {t('enc.backToList')}</a>

  {#if guide}
    <header class="page-head">
      <h1>{t(guide.titleKey)}</h1>
      <p class="subtitle">{t(guide.introKey)}</p>
      <p class="ref"><span aria-hidden="true">📖</span> {t('enc.sourceLabel')}: {t(guide.refKey)}</p>
    </header>

    <ul class="thesis-list">
      {#each guide.theses as thesis (thesis.id)}
        <li class="thesis">
          <span class="thesis-icon" aria-hidden="true">{thesis.icon}</span>
          <span class="thesis-text">
            <span class="thesis-title">{t(thesis.titleKey)}</span>
            <span class="thesis-body">{t(thesis.bodyKey)}</span>
          </span>
        </li>
      {/each}
    </ul>

    <a class="play-cta" href="{base}/campaign">
      <span aria-hidden="true">🗺️</span>
      {t('ui.campaign.play')} — {t(guide.titleKey)}
    </a>
  {:else}
    <p class="missing">{t('ui.campaign.lockedMission')}</p>
  {/if}
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
    margin: 0.4rem 0 0;
    font-size: 1.05rem;
    max-width: 64ch;
  }

  .ref {
    margin: 0.5rem 0 0;
    color: var(--ink-soft);
    font-size: 0.85rem;
    font-style: italic;
  }

  .thesis-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
  }

  .thesis {
    display: flex;
    gap: 0.85rem;
    background: var(--surface);
    border: 1px solid var(--line);
    border-left: 4px solid var(--accent);
    border-radius: var(--radius);
    padding: 1rem 1.15rem;
    box-shadow: var(--shadow-soft);
  }

  .thesis-icon {
    font-size: 1.6rem;
    flex-shrink: 0;
    line-height: 1.2;
  }

  .thesis-text {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    min-width: 0;
  }

  .thesis-title {
    font-weight: 700;
    font-size: 1.05rem;
  }

  .thesis-body {
    color: var(--ink-soft);
    line-height: 1.5;
  }

  .play-cta {
    align-self: flex-start;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    text-decoration: none;
    color: var(--accent-ink);
    background: var(--accent-strong);
    border-radius: 999px;
    padding: 0.7rem 1.3rem;
    font-weight: 700;
    box-shadow: var(--shadow-soft);
    transition: transform 0.1s ease;
  }

  .play-cta:hover {
    transform: translateY(-1px);
  }

  .missing {
    color: var(--ink-soft);
  }
</style>
