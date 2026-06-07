<script lang="ts">
  import { base } from '$app/paths';
  import { _ } from '$i18n/index.js';

  const t = $derived($_);
</script>

<div class="home">
  <header class="home-head">
    <h1>{t('ui.home.title')}</h1>
    <p class="subtitle">{t('ui.home.subtitle')}</p>
  </header>

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
