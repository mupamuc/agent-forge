<script lang="ts">
  import { _ } from '$i18n/index.js';
  import type { ContentCard } from '$content/cards.js';
  import TermTooltip from './TermTooltip.svelte';

  interface Props {
    card: ContentCard;
    selected?: boolean;
    onpick: (card: ContentCard) => void;
  }

  let { card, selected = false, onpick }: Props = $props();

  const t = $derived($_);
</script>

<div class="chip" class:selected>
  <button
    type="button"
    class="chip-main"
    onclick={() => onpick(card)}
    aria-pressed={selected}
    draggable="true"
    ondragstart={(e) => e.dataTransfer?.setData('text/plain', card.id)}
  >
    <span class="icon" aria-hidden="true">{card.icon}</span>
    <span class="label">{t(card.labelKey)}</span>
    <span class="cost" aria-label={`${t('ui.costLabel')}: ${card.cost}`}>
      {#each Array(card.cost) as _dot, i (i)}
        <span class="dot" aria-hidden="true"></span>
      {/each}
      {#if card.cost === 0}
        <span class="dot dot-free" aria-hidden="true"></span>
      {/if}
    </span>
  </button>
  {#if card.termKey}
    <span class="chip-term">
      <TermTooltip termKey={card.termKey} />
    </span>
  {/if}
</div>

<style>
  .chip {
    position: relative;
    display: flex;
    align-items: center;
  }

  .chip-main {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    width: 100%;
    text-align: left;
    background: var(--surface);
    border: 1.5px solid var(--line);
    border-radius: var(--radius-sm);
    padding: 0.6rem 2.1rem 0.6rem 0.7rem;
    color: var(--ink);
    box-shadow: var(--shadow-soft);
    transition:
      border-color 0.15s ease,
      transform 0.1s ease;
  }

  .chip-main:hover {
    border-color: var(--accent);
    transform: translateY(-1px);
  }

  .chip.selected .chip-main {
    border-color: var(--accent);
    background: var(--accent-soft);
  }

  .icon {
    font-size: 1.3rem;
    flex-shrink: 0;
  }

  .label {
    flex: 1;
    font-weight: 600;
    font-size: 0.95rem;
  }

  .cost {
    display: inline-flex;
    gap: 0.2rem;
    flex-shrink: 0;
  }

  .dot {
    width: 7px;
    height: 7px;
    border-radius: 999px;
    background: var(--accent);
    display: inline-block;
  }

  .dot-free {
    background: var(--line);
  }

  .chip-term {
    position: absolute;
    right: 0.5rem;
    top: 50%;
    transform: translateY(-50%);
  }
</style>
