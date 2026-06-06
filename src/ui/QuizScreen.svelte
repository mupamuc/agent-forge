<script lang="ts">
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import { _ } from '$i18n/index.js';
  import type { Quiz } from '$content/quizzes.js';
  import { quizPassed } from '$content/quizzes.js';
  import { progress } from '$lib/stores/progress.svelte.js';
  import QuizResult from './QuizResult.svelte';

  interface Props {
    quiz: Quiz;
  }

  let { quiz }: Props = $props();

  const t = $derived($_);
  const total = $derived(quiz.questionKeys.length);

  // One selected option index per question (null until the player picks). Reset whenever the quiz
  // changes (and on retake).
  let answers = $state<Array<number | null>>([]);
  let submitted = $state(false);

  let lastQuizId = $state<string | null>(null);
  $effect(() => {
    if (quiz.id !== lastQuizId) {
      lastQuizId = quiz.id;
      answers = quiz.questionKeys.map(() => null);
      submitted = false;
    }
  });

  const allAnswered = $derived(
    answers.length === total && answers.every((a) => a !== null)
  );

  const correct = $derived(
    quiz.questionKeys.reduce(
      (acc, q, i) => acc + (answers[i] === q.correctIndex ? 1 : 0),
      0
    )
  );
  const scorePct = $derived(total > 0 ? Math.round((correct / total) * 100) : 0);
  const passed = $derived(quizPassed(correct, total));

  function pick(questionIndex: number, optionIndex: number): void {
    if (submitted) return;
    answers = answers.map((a, i) => (i === questionIndex ? optionIndex : a));
  }

  function submit(): void {
    if (!allAnswered) return;
    submitted = true;
    progress.recordQuiz(quiz.worldId, scorePct);
  }

  function retake(): void {
    answers = quiz.questionKeys.map(() => null);
    submitted = false;
  }

  function back(): void {
    goto(`${base}/campaign`);
  }
</script>

<section class="quiz" aria-labelledby="quiz-heading">
  <header class="quiz-head">
    <h1 id="quiz-heading">{t('ui.quiz.title')}</h1>
    <p class="intro">{t('ui.quiz.intro')}</p>
  </header>

  {#if submitted}
    <QuizResult
      {passed}
      {correct}
      {total}
      {scorePct}
      onretake={retake}
      onback={back}
      oncontinue={back}
    />
  {:else}
    <ol class="question-list">
      {#each quiz.questionKeys as q, qi (q.stemKey)}
        <li class="question">
          <fieldset class="q-fieldset">
            <legend class="q-stem">
              <span class="q-num">{t('ui.quiz.questionOf')} {qi + 1} {t('ui.quiz.of')} {total}</span>
              <span class="q-text">{t(q.stemKey)}</span>
            </legend>
            <div class="options" role="radiogroup" aria-label={t(q.stemKey)}>
              {#each q.optionKeys as optKey, oi (optKey)}
                <label class="option" class:selected={answers[qi] === oi}>
                  <input
                    type="radio"
                    name={`q-${qi}`}
                    value={oi}
                    checked={answers[qi] === oi}
                    onchange={() => pick(qi, oi)}
                  />
                  <span class="option-text">{t(optKey)}</span>
                </label>
              {/each}
            </div>
          </fieldset>
        </li>
      {/each}
    </ol>

    <p class="hint" aria-live="polite">{t('ui.quiz.answerHint')}</p>

    <button type="button" class="submit-btn" onclick={submit} disabled={!allAnswered}>
      {t('ui.quiz.submit')}
    </button>
  {/if}
</section>

<style>
  .quiz {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .quiz-head h1 {
    font-size: 1.6rem;
  }

  .intro {
    margin: 0.25rem 0 0;
    color: var(--ink-soft);
  }

  .question-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .q-fieldset {
    margin: 0;
    padding: 1rem 1.1rem;
    border: 1px solid var(--line);
    border-radius: var(--radius);
    background: var(--surface);
    box-shadow: var(--shadow-soft);
  }

  .q-stem {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    padding: 0;
    margin-bottom: 0.85rem;
  }

  .q-num {
    font-size: 0.78rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    color: var(--ink-soft);
  }

  .q-text {
    font-size: 1.05rem;
    font-weight: 600;
  }

  .options {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .option {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    background: var(--surface-soft);
    border: 1.5px solid var(--line);
    border-radius: var(--radius-sm);
    padding: 0.65rem 0.8rem;
    cursor: pointer;
    transition:
      border-color 0.15s ease,
      background 0.15s ease;
  }

  .option:hover {
    border-color: var(--accent);
  }

  .option.selected {
    border-color: var(--accent);
    background: var(--accent-soft);
  }

  .option input {
    width: 1.1rem;
    height: 1.1rem;
    flex-shrink: 0;
    accent-color: var(--accent);
  }

  .option-text {
    font-size: 0.95rem;
  }

  .hint {
    margin: 0;
    color: var(--ink-soft);
    font-size: 0.85rem;
  }

  .submit-btn {
    align-self: flex-start;
    background: var(--accent-strong);
    color: var(--accent-ink);
    border: none;
    border-radius: 999px;
    padding: 0.8rem 1.8rem;
    font-size: 1.05rem;
    font-weight: 700;
    box-shadow: var(--shadow);
    transition:
      transform 0.1s ease,
      opacity 0.15s ease;
  }

  .submit-btn:hover:not(:disabled) {
    transform: translateY(-1px);
  }

  .submit-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
