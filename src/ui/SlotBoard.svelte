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

  const ALL_SLOTS: SlotType[] = ['role', 'tools', 'memory', 'planner', 'stopping', 'guardrails'];
  // Whatever the current mission doesn't use stays visibly locked (progressive disclosure).
  const lockedSlots = $derived(ALL_SLOTS.filter((s) => !activeSlots.includes(s)));

  function placedFor(slot: SlotType): ContentCard | null {
    if (slot === 'role') return session.role;
    if (slot === 'tools') return session.tool;
    if (slot === 'memory') return session.memory;
    return null;
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
    if (slot === 'role') {
      if (card.type !== 'role') {
        rejection = t('ui.cannotPlaceRole');
        return;
      }
      session.placeRole(card);
    } else if (slot === 'tools') {
      if (card.type !== 'tools') {
        rejection = t('ui.cannotPlaceTool');
        return;
      }
      session.placeTool(card);
    } else if (slot === 'memory') {
      if (card.type !== 'memory') {
        rejection = t('ui.cannotPlaceMemory');
        return;
      }
      session.placeMemory(card);
    } else {
      return;
    }
    clearRejection();
    onconsume();
  }

  function remove(slot: SlotType): void {
    if (slot === 'role') session.removeRole();
    if (slot === 'tools') session.removeTool();
    if (slot === 'memory') session.removeMemory();
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
