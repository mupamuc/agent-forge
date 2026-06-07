<script lang="ts">
  import { _ } from '$i18n/index.js';
  import type { SlotType } from '$engine/index.js';
  import type { ContentCard } from '$content/cards.js';
  import TermTooltip from './TermTooltip.svelte';
  import { catStyle } from './category.js';

  interface Props {
    slot: SlotType;
    locked: boolean;
    accepts: SlotType;
    placed: ContentCard | null;
    selectedCard: ContentCard | null;
    onplace: (slot: SlotType) => void;
    onremove: (slot: SlotType) => void;
    ondropcard: (slot: SlotType, cardId: string) => void;
  }

  let {
    slot,
    locked,
    accepts,
    placed,
    selectedCard,
    onplace,
    onremove,
    ondropcard
  }: Props = $props();

  const t = $derived($_);
  // Can the currently selected inventory card go here? (drives the "active drop target" look)
  const canAccept = $derived(
    !locked && selectedCard !== null && selectedCard.type === accepts
  );
  let dragOver = $state(false);

  function activate(): void {
    if (locked) return;
    if (placed) {
      onremove(slot);
    } else if (selectedCard) {
      onplace(slot);
    }
  }

  function onDrop(event: DragEvent): void {
    event.preventDefault();
    dragOver = false;
    if (locked) return;
    const cardId = event.dataTransfer?.getData('text/plain');
    if (cardId) ondropcard(slot, cardId);
  }
</script>

<div class="slot-wrap" class:locked style={catStyle(accepts)}>
  <span class="slot-label-row">
    <span class="slot-dot" aria-hidden="true"></span>
    <span class="slot-label">{t(`slot.${slot}`)}</span>
    <TermTooltip termKey={`term.${slot}`} />
  </span>
  <button
    type="button"
    class="slot"
    class:locked
    class:filled={!!placed}
    class:can-accept={canAccept}
    class:drag-over={dragOver}
    disabled={locked && !placed}
    aria-label={placed
      ? `${t(`slot.${slot}`)}: ${t(placed.labelKey)} — ${t('ui.remove')}`
      : locked
        ? `${t(`slot.${slot}`)} — ${t('ui.slotLockedHint')}`
        : `${t(`slot.${slot}`)}`}
    title={locked ? t('ui.slotLockedHint') : undefined}
    onclick={activate}
    ondragover={(e) => {
      if (!locked) {
        e.preventDefault();
        dragOver = true;
      }
    }}
    ondragleave={() => (dragOver = false)}
    ondrop={onDrop}
  >
    {#if locked}
      <span class="lock" aria-hidden="true">🔒</span>
    {:else if placed}
      <span class="placed-icon" aria-hidden="true">{placed.icon}</span>
      <span class="placed-label">{t(placed.labelKey)}</span>
      <span class="remove-hint" aria-hidden="true">✕</span>
    {:else}
      <span class="empty-hint">+</span>
    {/if}
  </button>
</div>

<style>
  .slot-wrap {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }

  .slot-label-row {
    display: flex;
    align-items: center;
    gap: 0.35rem;
  }

  .slot-dot {
    width: 8px;
    height: 8px;
    border-radius: 999px;
    background: var(--cat, var(--accent));
    flex-shrink: 0;
  }

  .slot-label {
    font-size: 0.78rem;
    font-weight: 700;
    color: var(--cat, var(--ink-soft));
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  /* Locked slots are "not in this mission" — stay neutral grey, no family colour. */
  .slot-wrap.locked .slot-dot {
    background: var(--line);
  }

  .slot-wrap.locked .slot-label {
    color: var(--ink-soft);
  }

  .slot {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    min-height: 56px;
    width: 100%;
    border: 2px dashed var(--line);
    border-radius: var(--radius-sm);
    background: var(--surface);
    padding: 0.6rem 0.75rem;
    color: var(--ink);
    transition:
      border-color 0.15s ease,
      background 0.15s ease;
  }

  .slot.locked {
    background: var(--locked);
    border-style: solid;
    color: var(--ink-soft);
    cursor: not-allowed;
  }

  .slot.filled {
    border-style: solid;
    border-color: var(--cat, var(--accent));
    border-left-width: 4px;
    background: var(--cat-soft, var(--accent-soft));
  }

  .slot.can-accept {
    border-color: var(--cat, var(--accent));
    border-style: solid;
    background: var(--cat-soft, var(--accent-soft));
  }

  .slot.drag-over {
    border-color: var(--cat, var(--accent));
    background: var(--cat-soft, var(--accent-soft));
  }

  .placed-icon {
    font-size: 1.3rem;
  }

  .placed-label {
    flex: 1;
    font-weight: 600;
    text-align: left;
  }

  .remove-hint {
    color: var(--ink-soft);
    font-weight: 700;
  }

  .empty-hint {
    color: var(--ink-soft);
    font-size: 1.3rem;
    font-weight: 700;
  }

  .lock {
    margin: 0 auto;
    opacity: 0.6;
  }
</style>
