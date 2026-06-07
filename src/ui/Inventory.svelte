<script lang="ts">
  import { _ } from '$i18n/index.js';
  import type { SlotType } from '$engine/index.js';
  import type { ContentCard } from '$content/cards.js';
  import { SLOT_ORDER } from '$lib/stores/session.svelte.js';
  import CardChip from './CardChip.svelte';
  import { catStyle } from './category.js';

  interface Props {
    cards: ReadonlyArray<ContentCard>;
    selectedId: string | null;
    onpick: (card: ContentCard) => void;
  }

  let { cards, selectedId, onpick }: Props = $props();

  const t = $derived($_);

  // Group the inventory by family in the canonical slot order, dropping empty families. Each group
  // becomes a colour-banded section so cards read as distinct sets (skill vs memory vs guard…) and
  // visually match the slot they belong in. A mission that only offers one family shows one band.
  const groups = $derived(
    SLOT_ORDER.map((type) => ({
      type,
      items: cards.filter((c) => c.type === type)
    })).filter((g) => g.items.length > 0)
  );
</script>

<section class="inventory" aria-labelledby="inventory-heading">
  <h2 id="inventory-heading" class="section-title">{t('ui.inventoryLabel')}</h2>
  <p class="hint" id="inventory-hint">{t('ui.inventoryHint')}</p>

  <div class="groups" aria-describedby="inventory-hint">
    {#each groups as group (group.type)}
      <section class="group" style={catStyle(group.type)} aria-label={t(`slot.${group.type}`)}>
        <h3 class="group-title">
          <span class="group-dot" aria-hidden="true"></span>
          {t(`slot.${group.type}`)}
        </h3>
        <ul class="card-grid">
          {#each group.items as card (card.id)}
            <li>
              <CardChip {card} selected={selectedId === card.id} {onpick} />
            </li>
          {/each}
        </ul>
      </section>
    {/each}
  </div>
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
    margin: 0 0 0.85rem;
    color: var(--ink-soft);
    font-size: 0.85rem;
  }

  .groups {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .group-title {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.72rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--cat, var(--ink-soft));
    margin: 0 0 0.5rem;
  }

  .group-dot {
    width: 9px;
    height: 9px;
    border-radius: 999px;
    background: var(--cat, var(--accent));
    flex-shrink: 0;
  }

  .card-grid {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
    gap: 0.55rem;
  }
</style>
