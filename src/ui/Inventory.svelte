<script lang="ts">
  import { _ } from '$i18n/index.js';
  import type { ContentCard } from '$content/cards.js';
  import CardChip from './CardChip.svelte';

  interface Props {
    cards: ReadonlyArray<ContentCard>;
    selectedId: string | null;
    onpick: (card: ContentCard) => void;
  }

  let { cards, selectedId, onpick }: Props = $props();

  const t = $derived($_);
</script>

<section class="inventory" aria-labelledby="inventory-heading">
  <h2 id="inventory-heading" class="section-title">{t('ui.inventoryLabel')}</h2>
  <p class="hint" id="inventory-hint">{t('ui.inventoryHint')}</p>
  <ul class="card-list" aria-describedby="inventory-hint">
    {#each cards as card (card.id)}
      <li>
        <CardChip {card} selected={selectedId === card.id} {onpick} />
      </li>
    {/each}
  </ul>
</section>

<style>
  .inventory {
    background: var(--surface-soft);
    border: 1px solid var(--line);
    border-radius: var(--radius);
    padding: 1rem 1.1rem;
  }

  .section-title {
    font-size: 1rem;
    margin-bottom: 0.25rem;
  }

  .hint {
    margin: 0 0 0.75rem;
    color: var(--ink-soft);
    font-size: 0.85rem;
  }

  .card-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }
</style>
