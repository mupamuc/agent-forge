<script lang="ts">
  import { base } from '$app/paths';
  import { _ } from '$i18n/index.js';
  import { progress } from '$lib/stores/progress.svelte.js';

  const t = $derived($_);

  // Campaign progress + the "Continue" target (first unsolved mission). Both react to the store.
  const totals = $derived(progress.campaignTotals());
  const nextMissionId = $derived(progress.nextMissionId());
  const pct = $derived(totals.max > 0 ? Math.round((totals.earned / totals.max) * 100) : 0);
  const started = $derived(totals.earned > 0);
</script>

<div class="home">
  <header class="home-head">
    <h1>{t('ui.home.title')}</h1>
    <p class="subtitle">{t('ui.home.subtitle')}</p>
  </header>

  {#if started || nextMissionId}
    <section class="resume" aria-label={t('ui.home.progressLabel')}>
      <div class="progress">
        <div
          class="bar"
          role="progressbar"
          aria-valuenow={totals.earned}
          aria-valuemin="0"
          aria-valuemax={totals.max}
          aria-label={t('ui.home.progressLabel')}
        >
          <span class="bar-fill" style={`width:${pct}%`}></span>
        </div>
        <span class="progress-count">⭐ {totals.earned} / {totals.max}</span>
      </div>
      {#if nextMissionId}
        <a class="continue" href="{base}/mission/{nextMissionId}">
          ▶ {started ? t('ui.home.continue') : t('ui.home.start')}
        </a>
      {/if}
    </section>
  {/if}

  <div class="modes">
    <a class="mode mode-campaign" href="{base}/campaign">
      <span class="mode-icon" aria-hidden="true">🗺️</span>
      <span class="mode-text">
        <span class="mode-name">{t('ui.home.campaign')}</span>
        <span class="mode-hint">{t('ui.home.campaignHint')}</span>
      </span>
    </a>

    <a class="mode mode-advanced" href="{base}/advanced">
      <span class="mode-icon" aria-hidden="true">🧩</span>
      <span class="mode-text">
        <span class="mode-name">{t('ui.home.advanced')}</span>
        <span class="mode-hint">{t('ui.home.advancedHint')}</span>
      </span>
    </a>

    <a class="mode mode-sandbox" href="{base}/sandbox">
      <span class="mode-icon" aria-hidden="true">🧪</span>
      <span class="mode-text">
        <span class="mode-name">{t('ui.home.sandbox')}</span>
        <span class="mode-hint">{t('ui.home.sandboxHint')}</span>
      </span>
    </a>

    <a class="mode mode-encyclopedia" href="{base}/encyclopedia">
      <span class="mode-icon" aria-hidden="true">📖</span>
      <span class="mode-text">
        <span class="mode-name">{t('ui.home.encyclopedia')}</span>
        <span class="mode-hint">{t('ui.home.encyclopediaHint')}</span>
      </span>
    </a>

    <a class="mode mode-settings" href="{base}/settings">
      <span class="mode-icon" aria-hidden="true">🧠</span>
      <span class="mode-text">
        <span class="mode-name">{t('ui.home.settings')}</span>
        <span class="mode-hint">{t('ui.home.settingsHint')}</span>
      </span>
    </a>
  </div>
</div>

<style>
  .home {
    display: flex;
    flex-direction: column;
    gap: 1.75rem;
    align-items: center;
    text-align: center;
    padding-top: 1.5rem;
  }

  .home-head h1 {
    font-size: 1.8rem;
  }

  .subtitle {
    margin: 0.4rem 0 0;
    color: var(--ink-soft);
    font-size: 1.05rem;
  }

  .resume {
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
    width: 100%;
    max-width: 720px;
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: var(--radius);
    padding: 1.1rem 1.25rem;
    box-shadow: var(--shadow-soft);
  }

  .progress {
    display: flex;
    align-items: center;
    gap: 0.85rem;
  }

  .bar {
    flex: 1;
    height: 12px;
    background: var(--surface-soft);
    border: 1px solid var(--line);
    border-radius: 999px;
    overflow: hidden;
  }

  .bar-fill {
    display: block;
    height: 100%;
    background: var(--star);
    border-radius: 999px;
    transition: width 0.3s ease;
  }

  .progress-count {
    flex-shrink: 0;
    font-weight: 700;
    font-size: 0.95rem;
    white-space: nowrap;
  }

  .continue {
    align-self: stretch;
    text-align: center;
    text-decoration: none;
    background: var(--accent-strong);
    color: var(--accent-ink);
    border-radius: 999px;
    padding: 0.8rem 1.5rem;
    font-size: 1.05rem;
    font-weight: 700;
    box-shadow: var(--shadow);
    transition: transform 0.1s ease;
  }

  .continue:hover {
    transform: translateY(-1px);
  }

  .modes {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.25rem;
    width: 100%;
    max-width: 720px;
  }

  .mode {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
    text-align: center;
    text-decoration: none;
    color: var(--ink);
    background: var(--surface);
    border: 2px solid var(--line);
    border-radius: var(--radius);
    padding: 2rem 1.5rem;
    box-shadow: var(--shadow-soft);
    transition:
      border-color 0.15s ease,
      transform 0.1s ease;
  }

  .mode:hover {
    border-color: var(--accent);
    transform: translateY(-2px);
  }

  .mode-campaign {
    background: var(--accent-soft);
  }

  .mode-advanced {
    background: var(--cat-planner-soft);
  }

  .mode-icon {
    font-size: 2.6rem;
  }

  .mode-text {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }

  .mode-name {
    font-size: 1.25rem;
    font-weight: 700;
  }

  .mode-hint {
    color: var(--ink-soft);
    font-size: 0.95rem;
  }

  @media (max-width: 560px) {
    .modes {
      grid-template-columns: 1fr;
    }
  }
</style>
