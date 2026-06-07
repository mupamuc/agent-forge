<script lang="ts">
  import { base } from '$app/paths';
  import { _ } from '$i18n/index.js';
  import { ADVANCED_LEVELS } from '$content/advanced.js';
  import { progress } from '$lib/stores/progress.svelte.js';

  const t = $derived($_);

  // Linear unlock within the advanced track: the first level is always open; each later level
  // unlocks once the previous one has been passed (any star). Independent of campaign progress.
  const levels = $derived(
    ADVANCED_LEVELS.map((level, i) => {
      const prevId = i > 0 ? (ADVANCED_LEVELS[i - 1]?.id ?? null) : null;
      const unlocked = i === 0 || (prevId !== null && progress.isPassed(prevId));
      return { level, unlocked, stars: progress.starCount(level.id) };
    })
  );
</script>

<div class="page">
  <a class="back-link" href="{base}/">← {t('ui.backToHome')}</a>

  <header class="page-head">
    <h1>{t('adv.title')}</h1>
    <p class="subtitle">{t('adv.subtitle')}</p>
  </header>

  <ul class="levels">
    {#each levels as row (row.level.id)}
      <li>
        {#if row.unlocked}
          <a class="level" href="{base}/advanced/{row.level.id}">
            <span class="level-icon" aria-hidden="true">{row.level.icon}</span>
            <span class="level-text">
              <span class="level-name">{t(row.level.titleKey)}</span>
              <span class="level-desc">{t(row.level.descKey)}</span>
            </span>
            <span class="level-stars" aria-label={`${row.stars} / 3`}>
              {#each Array(3) as _s, i (i)}
                <span class="star" aria-hidden="true">{i < row.stars ? '⭐' : '☆'}</span>
              {/each}
            </span>
          </a>
        {:else}
          <div class="level locked" aria-disabled="true">
            <span class="level-icon" aria-hidden="true">🔒</span>
            <span class="level-text">
              <span class="level-name">{t(row.level.titleKey)}</span>
              <span class="level-desc">{t('adv.lockedHint')}</span>
            </span>
          </div>
        {/if}
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

  .levels {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
  }

  .level {
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

  a.level:hover {
    border-color: var(--accent);
    transform: translateY(-1px);
  }

  .level.locked {
    background: var(--locked);
    color: var(--ink-soft);
    cursor: not-allowed;
  }

  .level-icon {
    font-size: 1.8rem;
    flex-shrink: 0;
  }

  .level-text {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    flex: 1;
    min-width: 0;
  }

  .level-name {
    font-weight: 700;
    font-size: 1.05rem;
  }

  .level-desc {
    color: var(--ink-soft);
    font-size: 0.9rem;
  }

  .level-stars {
    flex-shrink: 0;
    font-size: 0.95rem;
    letter-spacing: 0.05em;
  }
</style>
