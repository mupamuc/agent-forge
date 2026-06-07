// Pure prompt builder for the OPT-IN "real AI" demo. It turns the assembled agent (the cards the
// player placed) plus the chosen mission into a {system, user} pair written in plain office
// language. PURE: no DOM, no fetch, no globals — just the cards, the mission, and a translate fn,
// so it's fully unit-testable. It never leaks card ids or JSON into the prompt.

import type { Mission } from '$engine/index.js';
import type { ContentCard } from '$content/cards.js';

export interface BuiltPrompt {
  system: string;
  user: string;
}

// A minimal translate signature (svelte-i18n's `$_` resolves a dotted key to a string). Keeping it
// local means the builder stays pure and test code can pass a tiny fake.
type Translate = (key: string) => string;

// Which capabilities count as "tools" vs "memory" when we describe the kit in plain words. We use
// the card's slot type so the description stays in step with the inventory by construction.
function describeCards(cards: ReadonlyArray<ContentCard>, t: Translate): string[] {
  const lines: string[] = [];
  for (const card of cards) {
    if (card.type === 'tools' || card.type === 'memory') {
      lines.push(`- ${t(card.labelKey)}`);
    }
  }
  return lines;
}

/**
 * Build a short office-language prompt from the placed cards + mission.
 *
 * - system: the placed ROLE card's meaning (its plain label) plus a plain list of the tools/memory
 *   the player gave, with an honest note that this text-only demo can't actually run those tools.
 * - user: the mission's goal text.
 *
 * All visible text comes from i18n keys via `t`, so the prompt is RU/EN aware and free of ids/JSON.
 */
export function buildPrompt(
  agentCards: ReadonlyArray<ContentCard>,
  mission: Mission,
  t: Translate
): BuiltPrompt {
  const role = agentCards.find((card) => card.type === 'role');
  const roleMeaning = role ? t(role.labelKey) : t('byok.prompt.noRole');

  const kit = describeCards(agentCards, t);
  const kitBlock = kit.length > 0 ? kit.join('\n') : t('byok.prompt.noKit');

  const system = [
    t('byok.prompt.intro'),
    '',
    `${t('byok.prompt.roleLabel')}: ${roleMeaning}`,
    '',
    `${t('byok.prompt.kitLabel')}:`,
    kitBlock,
    '',
    t('byok.prompt.toolsNote')
  ].join('\n');

  const user = t(mission.goalKey);

  return { system, user };
}
