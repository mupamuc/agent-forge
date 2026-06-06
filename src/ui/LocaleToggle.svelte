<script lang="ts">
  import { _, locale, setLocale } from '$i18n/index.js';

  const t = $derived($_);
  const current = $derived(($locale ?? 'ru').startsWith('en') ? 'en' : 'ru');

  function toggle(): void {
    setLocale(current === 'ru' ? 'en' : 'ru');
  }
</script>

<button
  type="button"
  class="locale-toggle"
  onclick={toggle}
  aria-label={t('locale.switchTo')}
>
  <span class:active={current === 'ru'}>{t('locale.ru')}</span>
  <span class="sep" aria-hidden="true">/</span>
  <span class:active={current === 'en'}>{t('locale.en')}</span>
</button>

<style>
  .locale-toggle {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    min-height: var(--touch-min);
    background: var(--surface-soft);
    border: 1px solid var(--line);
    border-radius: 999px;
    padding: 0.4rem 0.9rem;
    color: var(--ink-soft);
    font-weight: 600;
    transition: border-color 0.15s ease;
  }

  .locale-toggle:hover {
    border-color: var(--accent);
  }

  .locale-toggle .active {
    color: var(--accent-text);
  }

  .sep {
    color: var(--line);
  }
</style>
