<script lang="ts">
  import { _ } from '$i18n/index.js';
  import type { ContentCard } from '$content/cards.js';
  import TermTooltip from './TermTooltip.svelte';
  import { catStyle } from './category.js';

  interface Props {
    card: ContentCard;
    selected?: boolean;
    onpick: (card: ContentCard) => void;
  }

  let { card, selected = false, onpick }: Props = $props();

  const t = $derived($_);
</script>

<div class="chip" class:selected data-type={card.type} style={catStyle(card.type)}>
  <button
    type="button"
    class="chip-main"
    onclick={() => onpick(card)}
    aria-pressed={selected}
    draggable="true"
    ondragstart={(e) => e.dataTransfer?.setData('text/plain', card.id)}
  >
    <span class="cost" aria-label={`${t('ui.costLabel')}: ${card.cost}`}>
      {#each Array(card.cost) as _dot, i (i)}
        <span class="dot" aria-hidden="true"></span>
      {/each}
      {#if card.cost === 0}
        <span class="dot dot-free" aria-hidden="true">{t('ui.free')}</span>
      {/if}
    </span>
    <span class="icon" aria-hidden="true">{card.icon}</span>
    <span class="label">{t(card.labelKey)}</span>
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
  }

  .chip-main {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.3rem;
    width: 100%;
    min-height: 100px;
    text-align: center;
    background: var(--cat-soft, var(--surface));
    border: 1.5px solid var(--line);
    border-left: 4px solid var(--cat, var(--accent));
    border-radius: var(--radius-sm);
    padding: 0.7rem 0.55rem 0.65rem;
    color: var(--ink);
    box-shadow: var(--shadow-soft);
    transition:
      border-color 0.15s ease,
      transform 0.1s ease,
      box-shadow 0.15s ease;
  }

  .chip-main:hover {
    border-color: var(--cat, var(--accent));
    border-left-color: var(--cat, var(--accent));
    transform: translateY(-2px);
    box-shadow: var(--shadow);
  }

  .chip.selected .chip-main {
    border-color: var(--cat, var(--accent));
    border-left-color: var(--cat, var(--accent));
    box-shadow:
      0 0 0 2px var(--cat, var(--accent)),
      var(--shadow);
  }

  .icon {
    font-size: 1.8rem;
    line-height: 1;
    flex-shrink: 0;
  }

  .label {
    font-weight: 600;
    font-size: 0.85rem;
    line-height: 1.2;
  }

  .cost {
    display: inline-flex;
    align-items: center;
    gap: 0.2rem;
    min-height: 0.8rem;
    align-self: flex-start;
  }

  .dot {
    width: 7px;
    height: 7px;
    border-radius: 999px;
    background: var(--cat, var(--accent));
    display: inline-block;
  }

  .dot-free {
    width: auto;
    height: auto;
    border-radius: 999px;
    background: transparent;
    color: var(--ink-soft);
    font-size: 0.62rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .chip-term {
    position: absolute;
    right: 0.35rem;
    top: 0.35rem;
  }
</style>
