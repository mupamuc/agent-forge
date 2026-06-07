<script lang="ts">
  import { base } from '$app/paths';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { _ } from '$i18n/index.js';
  import { run } from '$engine/index.js';
  import { getMissionById, cardsForMission } from '$content/missions.js';
  import { WORLDS } from '$content/worlds.js';
  import { getWorldGuide } from '$content/encyclopedia.js';
  import type { ContentCard } from '$content/cards.js';
  import { session, SLOT_ORDER } from '$lib/stores/session.svelte.js';
  import { progress } from '$lib/stores/progress.svelte.js';
  import MissionBrief from '../../../ui/MissionBrief.svelte';
  import Inventory from '../../../ui/Inventory.svelte';
  import SlotBoard from '../../../ui/SlotBoard.svelte';
  import TraceStory from '../../../ui/TraceStory.svelte';
  import Result from '../../../ui/Result.svelte';

  const t = $derived($_);

  // The mission is selected by the route param. Re-resolve reactively so navigating between
  // missions (e.g. via the map) loads the right one and clears the previous build.
  const missionId = $derived($page.params.id ?? '');
  const mission = $derived(getMissionById(missionId));
  const inventory = $derived(mission ? cardsForMission(missionId) : []);
  // The encyclopedia guide for this mission's world — links practice back to the theory.
  const guide = $derived(mission ? getWorldGuide(mission.worldId) : undefined);

  // Active slots = the slot types this mission's inventory actually uses (progressive disclosure:
  // World 1 shows Role, World 2 Tools, World 3 Memory). The rest stay locked.
  const activeSlots = $derived(
    SLOT_ORDER.filter((s) => inventory.some((c) => c.type === s))
  );

  // Currently picked inventory card (click-to-place flow). Cleared once placed.
  let selectedCard = $state<ContentCard | null>(null);

  // Reset the build whenever the mission id changes (fresh board per mission).
  let lastMissionId = $state<string | null>(null);
  $effect(() => {
    if (missionId !== lastMissionId) {
      lastMissionId = missionId;
      session.reset();
      selectedCard = null;
    }
  });

  // A run needs at least one card placed; the engine handles correctness.
  const canRun = $derived(session.placedCards().length > 0);

  // The next mission in campaign order (all worlds flattened). Null when this is the very last
  // mission — "Next" then returns to the campaign map instead.
  const ALL_MISSION_IDS = WORLDS.flatMap((w) => w.missionIds);
  const nextMissionId = $derived.by(() => {
    const i = ALL_MISSION_IDS.indexOf(missionId);
    return i >= 0 && i < ALL_MISSION_IDS.length - 1 ? ALL_MISSION_IDS[i + 1] : null;
  });

  // Advance after a win: go to the next mission, or back to the map if this was the last one.
  // Navigating to a new mission id resets the board via the missionId $effect above.
  function goNext(): void {
    void goto(nextMissionId ? `${base}/mission/${nextMissionId}` : `${base}/campaign`);
  }

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
    // Persist the result (best-star merge + unlock recompute) on every run, pass or fail.
    progress.recordResult(mission.id, verdict.stars);
  }

  function retry(): void {
    session.clearVerdict();
  }

  function reset(): void {
    session.reset();
    selectedCard = null;
  }
</script>

<div class="page">
  <a class="back-link" href="{base}/campaign">← {t('ui.backToCampaign')}</a>

  {#if mission}
    <header class="page-head">
      <h1>{t('ui.title')}</h1>
      <p class="subtitle">{t('ui.subtitle')}</p>
    </header>

    <MissionBrief {mission} />

    {#if guide}
      <a class="theory-link" href="{base}/encyclopedia/{mission.worldId}">
        📖 {t('ui.theoryLink')}
      </a>
    {/if}

    <div class="workspace">
      <div class="area-board">
        <SlotBoard {selectedCard} {activeSlots} {inventory} onconsume={onConsume} />
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

  .theory-link {
    align-self: flex-start;
    text-decoration: none;
    color: var(--accent-text);
    font-weight: 700;
    font-size: 0.9rem;
    background: var(--accent-soft);
    border-radius: 999px;
    padding: 0.45rem 0.9rem;
    min-height: var(--touch-min);
    display: inline-flex;
    align-items: center;
  }

  .theory-link:hover {
    text-decoration: underline;
  }

  /* Desktop: inventory on the left (spans both rows), the agent board top-right with its actions
     directly beneath. Mobile: the board comes FIRST (you see the slots you're filling without
     scrolling), then the inventory to pick from, then run + result. */
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
