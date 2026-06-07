<script lang="ts">
  import { _ } from '$i18n/index.js';
  import type { SlotType } from '$engine/index.js';
  import type { ContentCard } from '$content/cards.js';
  import { session } from '$lib/stores/session.svelte.js';
  import { cardById } from '$content/cards.js';
  import Slot from './Slot.svelte';

  interface Props {
    selectedCard: ContentCard | null;
    onconsume: () => void;
    activeSlots?: SlotType[];
  }

  let { selectedCard, onconsume, activeSlots = ['role', 'tools'] }: Props = $props();

  const t = $derived($_);
  let rejection = $state('');

  const ALL_SLOTS: SlotType[] = [
    'role',
    'tools',
    'memory',
    'planner',
    'stopping',
    'guardrails',
    'review'
  ];
  // Whatever the current mission doesn't use stays visibly locked (progressive disclosure).
  const lockedSlots = $derived(ALL_SLOTS.filter((s) => !activeSlots.includes(s)));

  // Per-slot "wrong card type" message — chosen by the slot a card was dropped on.
  const REJECT_KEYS: Record<SlotType, string> = {
    role: 'ui.cannotPlaceRole',
    tools: 'ui.cannotPlaceTool',
    memory: 'ui.cannotPlaceMemory',
    planner: 'ui.cannotPlacePlanner',
    review: 'ui.cannotPlaceReview',
    stopping: 'ui.cannotPlaceStopping',
    guardrails: 'ui.cannotPlaceGuardrails'
  };

  function placedFor(slot: SlotType): ContentCard | null {
    return session.get(slot);
  }

  function clearRejection(): void {
    rejection = '';
  }

  // Place the SELECTED card into a slot via keyboard/click.
  function place(slot: SlotType): void {
    if (!selectedCard) return;
    tryPlace(slot, selectedCard);
  }

  // Place a DROPPED card (by id) into a slot.
  function dropCard(slot: SlotType, cardId: string): void {
    const card = cardById(cardId);
    if (card) tryPlace(slot, card);
  }

  function tryPlace(slot: SlotType, card: ContentCard): void {
    // A card only fits the slot whose type it matches (role->role, tools->tools, ...).
    if (card.type !== slot) {
      rejection = t(REJECT_KEYS[slot]);
      return;
    }
    session.place(slot, card);
    clearRejection();
    onconsume();
  }

  function remove(slot: SlotType): void {
    session.remove(slot);
    clearRejection();
  }
</script>

<section class="board" aria-labelledby="board-heading">
  <h2 id="board-heading" class="section-title">{t('ui.agentLabel')}</h2>

  <div class="slots active">
    {#each activeSlots as slot (slot)}
      <Slot
        {slot}
        locked={false}
        accepts={slot}
        placed={placedFor(slot)}
        {selectedCard}
        onplace={place}
        onremove={remove}
        ondropcard={dropCard}
      />
    {/each}
  </div>

  {#if rejection}
    <p class="rejection" role="alert">⚠️ {rejection}</p>
  {/if}

  <div class="slots locked-row">
    {#each lockedSlots as slot (slot)}
      <Slot
        {slot}
        locked={true}
        accepts={slot}
        placed={null}
        {selectedCard}
        onplace={place}
        onremove={remove}
        ondropcard={dropCard}
      />
    {/each}
  </div>
</section>

<style>
  .board {
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: var(--radius);
    padding: 1.1rem 1.25rem;
    box-shadow: var(--shadow-soft);
  }

  .section-title {
    font-size: 1rem;
    margin-bottom: 0.75rem;
  }

  .slots {
    display: grid;
    gap: 0.75rem;
  }

  .slots.active {
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  }

  .locked-row {
    grid-template-columns: repeat(4, 1fr);
    margin-top: 0.85rem;
  }

  .rejection {
    margin: 0.75rem 0 0;
    color: var(--warn-text);
    background: var(--warn-soft);
    border-radius: var(--radius-sm);
    padding: 0.5rem 0.7rem;
    font-size: 0.9rem;
    font-weight: 600;
  }

  @media (max-width: 560px) {
    .slots.active {
      grid-template-columns: 1fr;
    }
    .locked-row {
      grid-template-columns: repeat(2, 1fr);
    }
  }
</style>
