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
    // Cards that fit this slot (for the inline "+" picker). Empty for locked slots.
    options?: ReadonlyArray<ContentCard>;
    onplace: (slot: SlotType) => void;
    onremove: (slot: SlotType) => void;
    ondropcard: (slot: SlotType, cardId: string) => void;
    // Place a card chosen from the inline picker (by id). Same effect as a drop.
    onchoose?: (slot: SlotType, cardId: string) => void;
  }

  let {
    slot,
    locked,
    accepts,
    placed,
    selectedCard,
    options = [],
    onplace,
    onremove,
    ondropcard,
    onchoose
  }: Props = $props();

  const t = $derived($_);
  // Can the currently selected inventory card go here? (drives the "active drop target" look)
  const canAccept = $derived(
    !locked && selectedCard !== null && selectedCard.type === accepts
  );
  // Empty + has fitting cards → the "+" opens an inline picker (a second way in, besides drag).
  const canChoose = $derived(!locked && !placed && options.length > 0);

  let dragOver = $state(false);
  let menuOpen = $state(false);
  const menuId = $derived(`slot-menu-${slot}`);

  let wrapEl = $state<HTMLDivElement>();
  let slotBtn = $state<HTMLButtonElement>();
  let menuEl = $state<HTMLUListElement>();

  function closeMenu(refocus = false): void {
    menuOpen = false;
    if (refocus) slotBtn?.focus();
  }

  function activate(): void {
    if (locked) return;
    if (placed) {
      onremove(slot);
      return;
    }
    // Fast path: a card is already picked in the inventory — drop it straight in.
    if (selectedCard && selectedCard.type === accepts) {
      onplace(slot);
      return;
    }
    // Otherwise toggle the inline picker dropdown.
    if (canChoose) menuOpen = !menuOpen;
  }

  function choose(card: ContentCard): void {
    onchoose?.(slot, card.id);
    closeMenu(true);
  }

  function onDrop(event: DragEvent): void {
    event.preventDefault();
    dragOver = false;
    if (locked) return;
    const cardId = event.dataTransfer?.getData('text/plain');
    if (cardId) ondropcard(slot, cardId);
  }

  // While the picker is open: close it on an outside pointer press or on Escape (from anywhere,
  // so it works regardless of which element holds focus).
  $effect(() => {
    if (!menuOpen) return;
    const onPointer = (e: PointerEvent): void => {
      if (wrapEl && !wrapEl.contains(e.target as Node)) closeMenu();
    };
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') closeMenu(true);
    };
    document.addEventListener('pointerdown', onPointer, true);
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('pointerdown', onPointer, true);
      document.removeEventListener('keydown', onKey, true);
    };
  });

  // Move focus into the picker when it opens (keyboard users land on the first choice).
  $effect(() => {
    if (menuOpen && menuEl) {
      menuEl.querySelector<HTMLButtonElement>('button')?.focus();
    }
  });
</script>

<div class="slot-wrap" class:locked style={catStyle(accepts)} bind:this={wrapEl}>
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
    bind:this={slotBtn}
    aria-haspopup={canChoose ? 'true' : undefined}
    aria-expanded={canChoose ? menuOpen : undefined}
    aria-controls={canChoose ? menuId : undefined}
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
      <span class="empty-hint" aria-hidden="true">+</span>
    {/if}
  </button>

  {#if menuOpen}
    <ul class="slot-menu" id={menuId} bind:this={menuEl}>
      {#each options as card (card.id)}
        <li>
          <button
            type="button"
            class="menu-item"
            onclick={() => choose(card)}
          >
            <span class="menu-icon" aria-hidden="true">{card.icon}</span>
            <span class="menu-label">{t(card.labelKey)}</span>
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .slot-wrap {
    position: relative;
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

  /* Inline picker — a dropdown of the cards that fit this slot. */
  .slot-menu {
    position: absolute;
    left: 0;
    right: 0;
    top: 100%;
    z-index: 20;
    margin: 0.3rem 0 0;
    padding: 0.3rem;
    list-style: none;
    background: var(--surface);
    border: 1.5px solid var(--cat, var(--line));
    border-radius: var(--radius-sm);
    box-shadow: var(--shadow);
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }

  .menu-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    width: 100%;
    text-align: left;
    background: transparent;
    border: 1px solid transparent;
    border-radius: var(--radius-sm);
    padding: 0.5rem 0.6rem;
    color: var(--ink);
    font-weight: 600;
    font-size: 0.9rem;
    min-height: var(--touch-min);
  }

  .menu-item:hover {
    background: var(--cat-soft, var(--accent-soft));
    border-color: var(--cat, var(--accent));
  }

  .menu-icon {
    font-size: 1.2rem;
    flex-shrink: 0;
  }
</style>
