<script lang="ts">
  import { _ } from '$i18n/index.js';
  import type { Step } from '$engine/index.js';
  import { renderTrace } from '$lib/trace-render.js';
  import StepLine from './StepLine.svelte';

  interface Props {
    steps: ReadonlyArray<Step> | null;
  }

  let { steps }: Props = $props();

  const t = $derived($_);
  // Re-derives on locale change => RU/EN toggle re-renders the trace WITHOUT re-running the engine.
  const lines = $derived(steps ? renderTrace(steps, t) : []);
</script>

<section class="story" aria-labelledby="story-heading" aria-live="polite">
  <h2 id="story-heading" class="section-title">
    <span aria-hidden="true">💬</span>
    {t('ui.storyLabel')}
  </h2>

  {#if lines.length === 0}
    <p class="empty">{t('ui.storyEmpty')}</p>
  {:else}
    <ul class="lines">
      {#each lines as line, i (i)}
        <StepLine {line} index={i} />
      {/each}
    </ul>
  {/if}
</section>

<style>
  .story {
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: var(--radius);
    padding: 1.1rem 1.25rem;
    box-shadow: var(--shadow-soft);
  }

  .section-title {
    font-size: 1rem;
    margin-bottom: 0.75rem;
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }

  .empty {
    color: var(--ink-soft);
    font-size: 0.9rem;
    margin: 0;
  }

  .lines {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
</style>
