import type { Mission } from '$engine/index.js';
import { cardById, type ContentCard } from './cards.js';

// "Сложная игра" (Advanced) — a SEPARATE track from the campaign. The basic campaign teaches one
// idea per mission ("pick the one right card"); the advanced track teaches the richer agentic
// patterns from the guide, where the player must COMBINE, SEQUENCE, TRADE OFF, DIAGNOSE, or DEFEND.
//
// It reuses the exact same deterministic engine, builder UI, cards, and progress store as the
// campaign. Advanced mission ids are namespaced `adv-*` so their stars persist independently and
// never touch the campaign's world-unlock logic (computeUnlockedWorlds only reads the WORLDS list).
//
// IMPORTANT engine constraint that shapes every design here: the agent board has ONE slot per
// family (role / tools / memory / planner / review / stopping / guardrails). So a "combine two
// cards" task must require caps from DIFFERENT families — e.g. memory + tool — never two of the
// same family (they would fight over a single slot).

export type Archetype = 'combo' | 'chain' | 'tradeoff' | 'diagnose' | 'redteam';

export interface AdvancedLevel {
  id: string;
  archetype: Archetype;
  icon: string;
  /** Picker title + one-line "what it teaches" — i18n keys. */
  titleKey: string;
  descKey: string;
  mission: Mission;
  /** Card ids offered for this level (the correct cards plus same-slot distractors). */
  inventory: ReadonlyArray<string>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Archetype 1 — COMBO. "Two cards, two families, both required."
// Guide refs: 5.3 Agent Memory Systems (episodic vs semantic) + 6.1 Tool Use + 4.3 RAG.
// Scenario: a returning client asks about their order under the return policy. The agent must
// BOTH recall who they are (episodic memory) AND look up the actual policy (a document tool).
// One alone is not enough: with only memory it invents the policy; with only the tool it does not
// know which order. A same-family distractor sits in each slot (working memory; web search), so the
// choice is a real two-axis decision, not "pick the one highlighted card".
const COMBO_RETURNING_CLIENT: Mission = {
  id: 'adv-combo-client',
  worldId: 'advanced',
  goalKey: 'adv.combo-client.goal',
  constraintKeys: ['adv.combo-client.constraint.0', 'adv.combo-client.constraint.1'],
  // Two needed cards cost 1 each → cost 2 is exactly the minimal spend; any extra card pushes over
  // budget AND out of the minimal set, costing two stars at once.
  budget: { steps: 6, cost: 2 },
  requiredCaps: ['mem-episodic', 'doc-reader'],
  minimalCardSet: ['mem-episodic', 'tool-doc-reader'],
  expectedOutcomeKey: 'success',
  solutionPath: [
    { marker: '🤔', kind: 'thought', textKey: 'step.adv-combo-client.need.thought' },
    {
      marker: '🔍',
      kind: 'action',
      textKey: 'step.adv-combo-client.recall.action',
      requiresCap: 'mem-episodic',
      onMissingCap: {
        mode: 'fail',
        textKey: 'step.adv-combo-client.recall.fail',
        failureModeId: 'no-memory'
      }
    },
    {
      marker: '🔍',
      kind: 'action',
      textKey: 'step.adv-combo-client.lookup.action',
      requiresCap: 'doc-reader',
      onMissingCap: {
        mode: 'fail',
        textKey: 'step.adv-combo-client.lookup.fail',
        failureModeId: 'missing-tool'
      }
    },
    { marker: '✅', kind: 'done', textKey: 'step.adv-combo-client.answer.done' }
  ]
};

export const ADVANCED_LEVELS: ReadonlyArray<AdvancedLevel> = [
  {
    id: 'adv-combo-client',
    archetype: 'combo',
    icon: '🧩',
    titleKey: 'adv.combo-client.title',
    descKey: 'adv.combo-client.desc',
    mission: COMBO_RETURNING_CLIENT,
    // Right memory + memory distractor, right tool + tool distractor — one wrong pick per slot.
    inventory: ['mem-episodic', 'mem-working', 'tool-doc-reader', 'tool-web-search']
  }
];

export const ADVANCED_LEVEL_IDS: ReadonlyArray<string> = ADVANCED_LEVELS.map((l) => l.id);

export function getAdvancedLevelById(id: string): AdvancedLevel | undefined {
  return ADVANCED_LEVELS.find((l) => l.id === id);
}

export function getAdvancedMissionById(id: string): Mission | undefined {
  return getAdvancedLevelById(id)?.mission;
}

export function advancedInventoryFor(id: string): ContentCard[] {
  const level = getAdvancedLevelById(id);
  if (!level) return [];
  return level.inventory
    .map((cardId) => cardById(cardId))
    .filter((c): c is ContentCard => c !== undefined);
}
