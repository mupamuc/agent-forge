import type { Verdict } from '$engine/index.js';
import type { ContentCard } from '$content/cards.js';

// In-progress agent build + the last run Verdict. Svelte 5 runes class so any component
// that reads these fields re-renders when they change.
class SessionState {
  // Placeable slots wired so far: Role, Tools, Memory (others stay locked/decorative).
  role = $state<ContentCard | null>(null);
  tool = $state<ContentCard | null>(null);
  memory = $state<ContentCard | null>(null);
  verdict = $state<Verdict | null>(null);

  placeRole(card: ContentCard): void {
    this.role = card;
    this.verdict = null;
  }

  placeTool(card: ContentCard): void {
    this.tool = card;
    this.verdict = null;
  }

  placeMemory(card: ContentCard): void {
    this.memory = card;
    this.verdict = null;
  }

  removeRole(): void {
    this.role = null;
    this.verdict = null;
  }

  removeTool(): void {
    this.tool = null;
    this.verdict = null;
  }

  removeMemory(): void {
    this.memory = null;
    this.verdict = null;
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
    this.role = null;
    this.tool = null;
    this.memory = null;
    this.verdict = null;
  }

  /** Cards currently placed, in a stable order, for engine input. */
  placedCards(): ContentCard[] {
    const cards: ContentCard[] = [];
    if (this.role) cards.push(this.role);
    if (this.tool) cards.push(this.tool);
    if (this.memory) cards.push(this.memory);
    return cards;
  }
}

export const session = new SessionState();
