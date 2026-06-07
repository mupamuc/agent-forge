import type { SlotType, Verdict } from '$engine/index.js';
import type { ContentCard } from '$content/cards.js';

// Canonical placement order — the order placed cards are fed to the engine (a stable,
// author-meaningful order: role first, then tools, memory, planner, review, stopping, guardrails).
export const SLOT_ORDER: SlotType[] = [
  'role',
  'model',
  'tools',
  'memory',
  'planner',
  'review',
  'stopping',
  'guardrails',
  'approval'
];

function emptySlots(): Record<SlotType, ContentCard | null> {
  return {
    role: null,
    model: null,
    tools: null,
    memory: null,
    planner: null,
    stopping: null,
    guardrails: null,
    approval: null,
    review: null
  };
}

// In-progress agent build + the last run Verdict. Svelte 5 runes class so any component
// that reads these fields re-renders when they change. Slots are a generic map keyed by
// SlotType so adding a slot (planner, review, stopping, guardrails) needs no new field.
class SessionState {
  slots = $state<Record<SlotType, ContentCard | null>>(emptySlots());
  verdict = $state<Verdict | null>(null);

  place(slot: SlotType, card: ContentCard): void {
    this.slots[slot] = card;
    this.verdict = null;
  }

  remove(slot: SlotType): void {
    this.slots[slot] = null;
    this.verdict = null;
  }

  get(slot: SlotType): ContentCard | null {
    return this.slots[slot];
  }

  setVerdict(verdict: Verdict): void {
    this.verdict = verdict;
  }

  /** Clear the verdict only (keep the build) — used by "Try again". */
  clearVerdict(): void {
    this.verdict = null;
  }

  /** Full reset — used by "Start over". */
  reset(): void {
    this.slots = emptySlots();
    this.verdict = null;
  }

  /** Cards currently placed, in canonical SLOT_ORDER, for engine input. */
  placedCards(): ContentCard[] {
    const cards: ContentCard[] = [];
    for (const slot of SLOT_ORDER) {
      const card = this.slots[slot];
      if (card) cards.push(card);
    }
    return cards;
  }
}

export const session = new SessionState();
