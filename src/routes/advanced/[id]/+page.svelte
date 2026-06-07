<script lang="ts">
  import { base } from '$app/paths';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { _ } from '$i18n/index.js';
  import { run } from '$engine/index.js';
  import {
    getAdvancedMissionById,
    advancedInventoryFor,
    ADVANCED_LEVEL_IDS
  } from '$content/advanced.js';
  import type { ContentCard } from '$content/cards.js';
  import { session, SLOT_ORDER } from '$lib/stores/session.svelte.js';
  import { progress } from '$lib/stores/progress.svelte.js';
  import MissionBrief from '../../../ui/MissionBrief.svelte';
  import Inventory from '../../../ui/Inventory.svelte';
  import SlotBoard from '../../../ui/SlotBoard.svelte';
  import TraceStory from '../../../ui/TraceStory.svelte';
  import Result from '../../../ui/Result.svelte';

  const t = $derived($_);

  // The level is selected by the route param. Re-resolve reactively so navigating between advanced
  // levels loads the right one and clears the previous build.
  const levelId = $derived($page.params.id ?? '');
  const mission = $derived(getAdvancedMissionById(levelId));
  const inventory = $derived(mission ? advancedInventoryFor(levelId) : []);

  // Active slots = the families this level's inventory uses (progressive disclosure). The rest stay
  // locked. Advanced combos span several families, so several slots open at once.
  const activeSlots = $derived(
    SLOT_ORDER.filter((s) => inventory.some((c) => c.type === s))
  );

  let selectedCard = $state<ContentCard | null>(null);

  // Reset the build whenever the level id changes (fresh board per level).
  let lastLevelId = $state<string | null>(null);
  $effect(() => {
    if (levelId !== lastLevelId) {
      lastLevelId = levelId;
      session.reset();
      selectedCard = null;
    }
  });

  const canRun = $derived(session.placedCards().length > 0);

  // The next advanced level, or null when this is the last one ("Next" then returns to the list).
  const nextLevelId = $derived.by(() => {
    const i = ADVANCED_LEVEL_IDS.indexOf(levelId);
    return i >= 0 && i < ADVANCED_LEVEL_IDS.length - 1 ? ADVANCED_LEVEL_IDS[i + 1] : null;
  });

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
    // Stars persist under the advanced id (best-star merge). This never touches campaign unlocks —
    // computeUnlockedWorlds only reads the campaign WORLDS list.
    progress.recordResult(mission.id, verdict.stars);
  }

  function retry(): void {
    session.clearVerdict();
  }

  function reset(): void {
    session.reset();
    selectedCard = null;
  }

  function goNext(): void {
    void goto(nextLevelId ? `${base}/advanced/${nextLevelId}` : `${base}/advanced`);
  }
</script>

<div class="page">
  <a class="back-link" href="{base}/advanced">← {t('adv.backToList')}</a>

  {#if mission}
    <header class="page-head">
      <h1>{t('ui.title')}</h1>
      <p class="subtitle">{t('ui.subtitle')}</p>
    </header>

    <MissionBrief {mission} />

    <div class="workspace">
      <div class="area-board">
        <SlotBoard {selectedCard} {activeSlots} onconsume={onConsume} />
      </div>

      <div class="area-inv">
        <Inventory cards={inventory} selectedId={selectedCard?.id ?? null} onpick={pick} />
      </div>

      <div class="area-actions">
        <button type="button" class="run-btn" onclick={doRun} disabled={!canRun}>
          ▶ {t('ui.run')}
        </button>

        {#if session.verdict}
          <TraceStory steps={session.verdict.steps} />
          <Result verdict={session.verdict} onretry={retry} onreset={reset} onnext={goNext} />
        {:else}
          <TraceStory steps={null} />
        {/if}
      </div>
    </div>
  {:else}
    <p class="missing">{t('ui.campaign.lockedMission')}</p>
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

  /* Same responsive layout as the campaign mission: desktop inventory-left / board+actions-right,
     mobile board-first so the slots are reachable without scrolling. */
  .workspace {
    display: grid;
    grid-template-columns: minmax(240px, 320px) 1fr;
    grid-template-areas:
      'inv board'
      'inv actions';
    gap: 1.25rem;
    align-items: start;
  }

  .area-inv {
    grid-area: inv;
    min-width: 0;
  }

  .area-board {
    grid-area: board;
    min-width: 0;
  }

  .area-actions {
    grid-area: actions;
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

  .missing {
    color: var(--ink-soft);
  }

  @media (max-width: 800px) {
    .workspace {
      grid-template-columns: 1fr;
      grid-template-areas:
        'board'
        'inv'
        'actions';
    }
  }
</style>
