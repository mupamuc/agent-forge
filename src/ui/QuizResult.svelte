<script lang="ts">
  import { _ } from '$i18n/index.js';

  interface Props {
    passed: boolean;
    correct: number;
    total: number;
    scorePct: number;
    onretake: () => void;
    onback: () => void;
    oncontinue: () => void;
  }

  let { passed, correct, total, scorePct, onretake, onback, oncontinue }: Props = $props();

  const t = $derived($_);
</script>

<section class="quiz-result" class:pass={passed} class:fail={!passed}>
  <p class="banner" role="status">
    <span class="banner-mark" aria-hidden="true">{passed ? '🎉' : '🙂'}</span>
    {passed ? t('ui.quiz.passedBanner') : t('ui.quiz.failedBanner')}
  </p>

  <p class="score">
    <span class="score-label">{t('ui.quiz.yourScore')}:</span>
    <span class="score-value">{scorePct}%</span>
    <span class="score-detail">({correct} {t('ui.quiz.correctOf')} {total})</span>
  </p>

  <p class="note">{passed ? t('ui.quiz.passNote') : t('ui.quiz.failNote')}</p>

  <div class="actions">
    {#if passed}
      <button type="button" class="btn-primary" onclick={oncontinue}>
        {t('ui.quiz.continue')} →
      </button>
    {/if}
    <button type="button" class="btn-secondary" onclick={onretake}>
      ↻ {t('ui.quiz.retake')}
    </button>
    <button type="button" class="btn-ghost" onclick={onback}>
      {t('ui.quiz.backToMap')}
    </button>
  </div>
</section>

<style>
  .quiz-result {
    border-radius: var(--radius);
    padding: 1.1rem 1.25rem;
    border: 1px solid var(--line);
  }

  .quiz-result.pass {
    background: var(--ok-soft);
    border-color: #bfe6cd;
  }

  .quiz-result.fail {
    background: var(--warn-soft);
    border-color: #f3c9c2;
  }

  .banner {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 0 0 0.6rem;
    font-size: 1.1rem;
    font-weight: 700;
  }

  .banner-mark {
    font-size: 1.4rem;
  }

  .score {
    display: flex;
    align-items: baseline;
    gap: 0.4rem;
    margin: 0 0 0.4rem;
    flex-wrap: wrap;
  }

  .score-label {
    font-weight: 600;
  }

  .score-value {
    font-size: 1.3rem;
    font-weight: 700;
    color: var(--accent-text);
  }

  .score-detail {
    color: var(--ink-soft);
    font-size: 0.9rem;
  }

  .note {
    margin: 0 0 0.85rem;
    color: var(--ink-soft);
    font-size: 0.95rem;
  }

  .actions {
    display: flex;
    gap: 0.6rem;
    flex-wrap: wrap;
  }

  .btn-primary,
  .btn-secondary,
  .btn-ghost {
    border-radius: 999px;
    padding: 0.6rem 1.2rem;
    min-height: var(--touch-min);
    font-weight: 600;
    border: 1.5px solid var(--accent);
  }

  .btn-primary {
    background: var(--accent-strong);
    color: var(--accent-ink);
  }

  .btn-secondary {
    background: var(--surface);
    color: var(--accent-text);
  }

  .btn-ghost {
    background: transparent;
    color: var(--ink-soft);
    border-color: var(--line);
  }
</style>
