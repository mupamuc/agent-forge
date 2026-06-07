import type { SlotType } from '$engine/index.js';

// Purely presentational, never part of the engine contract. Each card/slot family carries its own
// colour so the inventory and the agent board read as grouped, related sets — and so a card visually
// "matches" the slot it belongs in. The actual colour values live in app.css (the --cat-* tokens);
// this helper just wires the active family's pair into the generic --cat / --cat-soft custom props
// that the chip and slot styles consume.
export function catStyle(type: SlotType): string {
  return `--cat: var(--cat-${type}); --cat-soft: var(--cat-${type}-soft);`;
}
