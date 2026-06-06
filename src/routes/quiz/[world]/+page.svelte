<script lang="ts">
  import { base } from '$app/paths';
  import { page } from '$app/stores';
  import { _ } from '$i18n/index.js';
  import { getQuizForWorld } from '$content/quizzes.js';
  import QuizScreen from '../../../ui/QuizScreen.svelte';

  const t = $derived($_);

  // The quiz is selected by the route param. Re-resolve reactively so navigating between quizzes
  // (e.g. via the map) loads the right one.
  const worldId = $derived($page.params.world ?? '');
  const quiz = $derived(getQuizForWorld(worldId));
</script>

<div class="page">
  <a class="back-link" href="{base}/campaign">← {t('ui.backToCampaign')}</a>

  {#if quiz}
    {#key quiz.id}
      <QuizScreen {quiz} />
    {/key}
  {:else}
    <p class="missing">{t('ui.quiz.notFound')}</p>
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

  .missing {
    color: var(--ink-soft);
  }
</style>
