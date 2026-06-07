<script lang="ts">
  import { base } from '$app/paths';
  import { _ } from '$i18n/index.js';
  import { run } from '$engine/index.js';
  import { getMissionById, sandboxScenarios } from '$content/missions.js';
  import { ALL_CARDS, type ContentCard } from '$content/cards.js';
  import { session, SLOT_ORDER } from '$lib/stores/session.svelte.js';
  import { byok } from '$lib/stores/byok.svelte.js';
  import { askModel } from '$lib/llm/client.js';
  import { buildPrompt } from '$lib/llm/prompt.js';
  import MissionBrief from '../../ui/MissionBrief.svelte';
  import Inventory from '../../ui/Inventory.svelte';
  import SlotBoard from '../../ui/SlotBoard.svelte';
  import TraceStory from '../../ui/TraceStory.svelte';
  import Result from '../../ui/Result.svelte';

  const t = $derived($_);

  // Free play: the player picks any of the twelve campaign scenarios, grouped by world. The first
  // scenario is the default so the workspace is never empty.
  const groups = sandboxScenarios();
  const DEFAULT_SCENARIO_ID = groups[0]?.missions[0]?.id ?? '';

  let scenarioId = $state(DEFAULT_SCENARIO_ID);
  const mission = $derived(getMissionById(scenarioId));

  // Sandbox = experiment with anything: the inventory is the FULL card set (4 roles, 3 tools,
  // 3 memory), so "wrong" picks are allowed on purpose — that's the point of free play.
  const inventory = ALL_CARDS;

  // Free play opens every slot at once (role, tools, memory, planner, review, stopping, guardrails)
  // so the player can experiment with the full kit. SLOT_ORDER is the canonical seven-slot set.
  const activeSlots = SLOT_ORDER;

  // Currently picked inventory card (click-to-place flow). Cleared once placed.
  let selectedCard = $state<ContentCard | null>(null);

  // Reset the build whenever the chosen scenario changes (fresh board per scenario).
  let lastScenarioId = $state<string | null>(null);
  $effect(() => {
    if (scenarioId !== lastScenarioId) {
      lastScenarioId = scenarioId;
      session.reset();
      selectedCard = null;
    }
  });

  // A run needs at least one card placed; the engine handles correctness.
  const canRun = $derived(session.placedCards().length > 0);

  function pick(card: ContentCard): void {
    selectedCard = selectedCard?.id === card.id ? null : card;
  }

  function onConsume(): void {
    selectedCard = null;
  }

  function doRun(): void {
    if (!mission) return;
    const verdict = run({ cards: session.placedCards() }, mission);
    session.setVerdict(verdict);
    // Free play does NOT record stars or unlock worlds — no progress.recordResult here on purpose.
  }

  function retry(): void {
    session.clearVerdict();
  }

  function reset(): void {
    session.reset();
    selectedCard = null;
  }

  // OPT-IN "real AI" demo. Independent of the deterministic Run flow above — it never touches the
  // engine or progress. Builds a plain-language prompt from the placed cards + mission, calls the
  // user's chosen model with their own key, and shows the reply in a labelled panel.
  let aiLoading = $state(false);
  let aiReply = $state<string | null>(null);
  let aiError = $state<string | null>(null);

  async function askRealAI(): Promise<void> {
    if (!mission || !byok.isReady) return;
    aiLoading = true;
    aiReply = null;
    aiError = null;
    const { system, user } = buildPrompt(session.placedCards(), mission, t);
    const result = await askModel({
      provider: byok.provider,
      model: byok.model,
      apiKey: byok.apiKey,
      system,
      user,
      t
    });
    if (result.ok) {
      aiReply = result.text;
    } else {
      aiError = result.error;
    }
    aiLoading = false;
  }
</script>

<div class="page">
  <a class="back-link" href="{base}/">← {t('ui.backToHome')}</a>

  <header class="page-head">
    <h1>{t('ui.sandbox.title')}</h1>
    <p class="subtitle">{t('ui.sandbox.subtitle')}</p>
  </header>

  <section class="picker" aria-labelledby="picker-heading">
    <h2 id="picker-heading" class="section-title">{t('ui.sandbox.title')}</h2>
    <label class="picker-label" for="scenario-select">{t('ui.sandbox.pickerLabel')}</label>
    <p class="hint" id="picker-hint">{t('ui.sandbox.pickerHint')}</p>
    <select
      id="scenario-select"
      class="scenario-select"
      bind:value={scenarioId}
      aria-describedby="picker-hint"
    >
      {#each groups as group (group.worldId)}
        <optgroup label={t(group.titleKey)}>
          {#each group.missions as scenario (scenario.id)}
            <option value={scenario.id}>{t(scenario.goalKey)}</option>
          {/each}
        </optgroup>
      {/each}
    </select>
  </section>

  {#if mission}
    <MissionBrief {mission} />

    <div class="workspace">
      <div class="col-left">
        <Inventory cards={inventory} selectedId={selectedCard?.id ?? null} onpick={pick} />
      </div>

      <div class="col-right">
        <SlotBoard {selectedCard} {activeSlots} onconsume={onConsume} />

        <div class="run-row">
          <button type="button" class="run-btn" onclick={doRun} disabled={!canRun}>
            ▶ {t('ui.run')}
          </button>

          {#if byok.isReady}
            <button
              type="button"
              class="ai-btn"
              onclick={askRealAI}
              disabled={!canRun || aiLoading}
            >
              {aiLoading ? t('byok.sandbox.asking') : t('byok.sandbox.ask')}
            </button>
          {/if}
        </div>

        {#if session.verdict}
          <TraceStory steps={session.verdict.steps} />
          <Result verdict={session.verdict} onretry={retry} onreset={reset} />
        {:else}
          <TraceStory steps={null} />
        {/if}

        {#if !byok.isReady}
          <p class="ai-hint">
            {t('byok.sandbox.needKey')}
            <a href="{base}/settings">{t('byok.sandbox.goToSettings')}</a>
          </p>
        {/if}

        {#if aiLoading || aiReply || aiError}
          <section class="ai-panel" aria-labelledby="ai-reply-heading" aria-live="polite">
            <h3 id="ai-reply-heading" class="ai-panel-title">{t('byok.sandbox.replyLabel')}</h3>
            <p class="ai-experimental">{t('byok.sandbox.experimental')}</p>
            {#if aiLoading}
              <p class="ai-loading">{t('byok.sandbox.asking')}</p>
            {:else if aiError}
              <p class="ai-error">{aiError}</p>
            {:else if aiReply}
              <p class="ai-reply">{aiReply}</p>
            {/if}
          </section>
        {/if}
      </div>
    </div>
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

  .page-head h1 {
    font-size: 1.6rem;
  }

  .subtitle {
    margin: 0.25rem 0 0;
    color: var(--ink-soft);
  }

  .picker {
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: var(--radius);
    padding: 1.1rem 1.25rem;
    box-shadow: var(--shadow-soft);
  }

  .section-title {
    font-size: 1rem;
    margin-bottom: 0.4rem;
  }

  .picker-label {
    display: block;
    font-weight: 600;
    font-size: 0.95rem;
    margin-bottom: 0.2rem;
  }

  .hint {
    margin: 0 0 0.75rem;
    color: var(--ink-soft);
    font-size: 0.85rem;
  }

  .scenario-select {
    width: 100%;
    background: var(--surface);
    color: var(--ink);
    border: 1.5px solid var(--line);
    border-radius: var(--radius-sm);
    padding: 0.6rem 0.7rem;
    font-size: 0.95rem;
    font-weight: 600;
  }

  /* Keep the accent border on focus, but let the global :focus-visible outline show for
     keyboard users so the control has a clear, ≥3:1 focus indicator. */
  .scenario-select:focus {
    border-color: var(--accent);
  }

  .workspace {
    display: grid;
    grid-template-columns: minmax(240px, 320px) 1fr;
    gap: 1.25rem;
    align-items: start;
  }

  .col-left,
  .col-right {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    min-width: 0;
  }

  .run-btn {
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

  .run-btn:hover:not(:disabled) {
    transform: translateY(-1px);
  }

  .run-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .run-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    align-items: center;
  }

  .ai-btn {
    background: var(--surface);
    color: var(--accent-text);
    border: 1.5px solid var(--accent);
    border-radius: 999px;
    padding: 0.8rem 1.4rem;
    font-size: 1rem;
    font-weight: 700;
    min-height: var(--touch-min);
    transition:
      transform 0.1s ease,
      opacity 0.15s ease;
  }

  .ai-btn:hover:not(:disabled) {
    transform: translateY(-1px);
  }

  .ai-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .ai-hint {
    margin: 0;
    color: var(--ink-soft);
    font-size: 0.85rem;
  }

  .ai-hint a {
    color: var(--accent-text);
    font-weight: 600;
  }

  .ai-panel {
    background: var(--surface);
    border: 1.5px solid var(--accent);
    border-radius: var(--radius);
    padding: 1rem 1.1rem;
    box-shadow: var(--shadow-soft);
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .ai-panel-title {
    font-size: 1rem;
  }

  .ai-experimental {
    margin: 0;
    color: var(--ink-soft);
    font-size: 0.8rem;
    font-style: italic;
  }

  .ai-loading {
    margin: 0;
    color: var(--ink-soft);
  }

  .ai-error {
    margin: 0;
    color: var(--warn-text);
    font-weight: 600;
  }

  .ai-reply {
    margin: 0;
    white-space: pre-wrap;
    line-height: 1.55;
  }

  @media (max-width: 800px) {
    .workspace {
      grid-template-columns: 1fr;
    }
  }
</style>
