<script lang="ts">
  import { _ } from '$i18n/index.js';
  import type { Verdict } from '$engine/index.js';
  import { diagnosisText } from '$lib/trace-render.js';

  interface Props {
    verdict: Verdict;
    onretry: () => void;
    onreset: () => void;
    // Optional "go forward" action. When present and the run passed, it replaces the redundant
    // retry button with a primary "Next" (advance to the next mission / back to the map). Free-play
    // screens (sandbox) omit it — they have nowhere to advance to.
    onnext?: () => void;
  }

  let { verdict, onretry, onreset, onnext }: Props = $props();

  const t = $derived($_);
  const diagnosis = $derived(diagnosisText(verdict, t));

  // Three independent stars, each with a "why earned / why lost" line.
  const starRows = $derived([
    {
      earned: verdict.stars.passed,
      label: t('stars.passed'),
      why: verdict.stars.passed ? t('stars.passed.why') : ''
    },
    {
      earned: verdict.stars.minimalSet,
      label: t('stars.minimalSet'),
      why: verdict.stars.minimalSet ? t('stars.minimalSet.why') : t('stars.minimalSet.lost')
    },
    {
      earned: verdict.stars.withinBudget,
      label: t('stars.withinBudget'),
      why: verdict.stars.withinBudget
        ? t('stars.withinBudget.why')
        : t('stars.withinBudget.lost')
    }
  ]);
</script>

<section class="result" class:pass={verdict.passed} class:fail={!verdict.passed}>
  <p class="banner" role="status">
    <span class="banner-mark" aria-hidden="true">{verdict.passed ? '✅' : '❌'}</span>
    {verdict.passed ? t('ui.passBanner') : t('ui.failBanner')}
  </p>

  {#if !verdict.passed && diagnosis}
    <div class="diagnosis" role="alert">
      <span class="diag-label">{t('ui.diagnosisLabel')}</span>
      <p class="diag-text">{diagnosis}</p>
    </div>
  {/if}

  {#if verdict.passed}
    <div class="stars" aria-label={t('ui.starsLabel')}>
      <ul class="star-list">
        {#each starRows as row (row.label)}
          <li class="star-row" class:lost={!row.earned}>
            <span class="star" aria-hidden="true">{row.earned ? '⭐' : '☆'}</span>
            <span class="star-text">
              <span class="star-label">{row.label}</span>
              <span class="star-why">{row.why}</span>
            </span>
          </li>
        {/each}
      </ul>
    </div>
  {/if}

  <div class="actions">
    {#if verdict.passed && onnext}
      <button type="button" class="btn-secondary" onclick={onnext}>
        {t('ui.next')} →
      </button>
      <button type="button" class="btn-ghost" onclick={onreset}>
        {t('ui.reset')}
      </button>
    {:else}
      <button type="button" class="btn-secondary" onclick={onretry}>
        ↻ {t('ui.retry')}
      </button>
      <button type="button" class="btn-ghost" onclick={onreset}>
        {t('ui.reset')}
      </button>
    {/if}
  </div>
</section>

<style>
  .result {
    border-radius: var(--radius);
    padding: 1.1rem 1.25rem;
    border: 1px solid var(--line);
  }

  .result.pass {
    background: var(--ok-soft);
    border-color: #bfe6cd;
  }

  .result.fail {
    background: var(--warn-soft);
    border-color: #f3c9c2;
  }

  .banner {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 0 0 0.75rem;
    font-size: 1.1rem;
    font-weight: 700;
  }

  .banner-mark {
    font-size: 1.4rem;
  }

  .diagnosis {
    background: var(--surface);
    border-radius: var(--radius-sm);
    padding: 0.7rem 0.85rem;
    margin-bottom: 0.75rem;
  }

  .diag-label {
    display: block;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    color: var(--warn-text);
    margin-bottom: 0.2rem;
  }

  .diag-text {
    margin: 0;
    font-size: 0.95rem;
    line-height: 1.45;
  }

  .star-list {
    list-style: none;
    margin: 0 0 0.85rem;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .star-row {
    display: flex;
    align-items: flex-start;
    gap: 0.6rem;
    background: var(--surface);
    border-radius: var(--radius-sm);
    padding: 0.55rem 0.75rem;
  }

  .star-row.lost {
    opacity: 0.7;
  }

  .star {
    font-size: 1.2rem;
    line-height: 1.3;
  }

  .star-text {
    display: flex;
    flex-direction: column;
  }

  .star-label {
    font-weight: 600;
    font-size: 0.95rem;
  }

  .star-why {
    font-size: 0.82rem;
    color: var(--ink-soft);
  }

  .actions {
    display: flex;
    gap: 0.6rem;
    flex-wrap: wrap;
  }

  .btn-secondary,
  .btn-ghost {
    border-radius: 999px;
    padding: 0.6rem 1.2rem;
    min-height: var(--touch-min);
    font-weight: 600;
    border: 1.5px solid var(--accent);
  }

  .btn-secondary {
    background: var(--accent-strong);
    color: var(--accent-ink);
  }

  .btn-ghost {
    background: transparent;
    color: var(--accent-text);
    border-color: var(--accent-text);
  }
</style>
