<script lang="ts">
  import { _ } from '$i18n/index.js';
  import type { Mission } from '$engine/index.js';

  interface Props {
    mission: Mission;
  }

  let { mission }: Props = $props();

  const t = $derived($_);
</script>

<section class="brief" aria-labelledby="brief-heading">
  <h2 id="brief-heading" class="brief-title">
    <span class="tag">{t('ui.missionLabel')}</span>
  </h2>
  <p class="goal">{t(mission.goalKey)}</p>

  {#each mission.constraintKeys as key (key)}
    <p class="constraint">
      <span class="constraint-mark" aria-hidden="true">📌</span>
      <span><strong>{t('ui.constraintLabel')}:</strong> {t(key)}</span>
    </p>
  {/each}

  <p class="budget">
    <span aria-hidden="true">🎯</span>
    {t('ui.budgetLabel')}: {mission.budget.steps}
  </p>
</section>

<style>
  .brief {
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: var(--radius);
    padding: 1.1rem 1.25rem;
    box-shadow: var(--shadow-soft);
  }

  .brief-title {
    margin-bottom: 0.5rem;
  }

  .tag {
    display: inline-block;
    background: var(--accent-soft);
    color: var(--accent-text);
    font-size: 0.8rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    padding: 0.2rem 0.6rem;
    border-radius: 999px;
  }

  .goal {
    font-size: 1.15rem;
    font-weight: 600;
    margin: 0.5rem 0 0.75rem;
  }

  .constraint {
    display: flex;
    gap: 0.5rem;
    align-items: flex-start;
    background: var(--surface-soft);
    border-radius: var(--radius-sm);
    padding: 0.6rem 0.75rem;
    margin: 0 0 0.5rem;
    color: var(--ink-soft);
    font-size: 0.95rem;
  }

  .budget {
    margin: 0.25rem 0 0;
    color: var(--ink-soft);
    font-size: 0.9rem;
    font-weight: 600;
  }
</style>
