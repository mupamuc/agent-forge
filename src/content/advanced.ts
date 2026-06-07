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
  /**
   * Diagnose archetype: card ids the board starts PRE-FILLED with — a broken build. The level loads
   * already failing (its trace shown), and the player reads it and swaps the wrong cards for the
   * right ones. Absent on build-from-scratch levels.
   */
  preset?: ReadonlyArray<string>;
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

// ─────────────────────────────────────────────────────────────────────────────
// Archetype 2 — CHAIN. "Several steps in sequence, each feeding the next."
// Guide ref: 6.1 Tool Chaining (Search → fetch → read → summarise → write; each tool hands its
// output to the next). Scenario: bill a returning client. The agent must run three links in order,
// across three different families: recall the client's order (episodic memory) → add up the total
// (calculator) → have it reviewed before sending (critic). Drop any link and the chain breaks at
// that point — the engine fails on the FIRST missing-cap step, so the trace shows exactly where.
const CHAIN_INVOICE: Mission = {
  id: 'adv-chain-invoice',
  worldId: 'advanced',
  goalKey: 'adv.chain-invoice.goal',
  constraintKeys: [
    'adv.chain-invoice.constraint.0',
    'adv.chain-invoice.constraint.1',
    'adv.chain-invoice.constraint.2'
  ],
  // Three needed cards cost 1 each → 3 is the minimal spend; an extra pushes over budget too.
  budget: { steps: 7, cost: 3 },
  requiredCaps: ['mem-episodic', 'calculator', 'critic'],
  minimalCardSet: ['mem-episodic', 'tool-calculator', 'critic-review'],
  expectedOutcomeKey: 'success',
  solutionPath: [
    { marker: '🤔', kind: 'thought', textKey: 'step.adv-chain-invoice.need.thought' },
    {
      marker: '🔍',
      kind: 'action',
      textKey: 'step.adv-chain-invoice.recall.action',
      requiresCap: 'mem-episodic',
      onMissingCap: {
        mode: 'fail',
        textKey: 'step.adv-chain-invoice.recall.fail',
        failureModeId: 'no-memory'
      }
    },
    {
      marker: '🔍',
      kind: 'action',
      textKey: 'step.adv-chain-invoice.calc.action',
      requiresCap: 'calculator',
      onMissingCap: {
        mode: 'fail',
        textKey: 'step.adv-chain-invoice.calc.fail',
        failureModeId: 'missing-tool'
      }
    },
    {
      marker: '🔍',
      kind: 'action',
      textKey: 'step.adv-chain-invoice.review.action',
      requiresCap: 'critic',
      onMissingCap: {
        mode: 'fail',
        textKey: 'step.adv-chain-invoice.review.fail',
        failureModeId: 'no-critic'
      }
    },
    { marker: '✅', kind: 'done', textKey: 'step.adv-chain-invoice.answer.done' }
  ]
};

// ─────────────────────────────────────────────────────────────────────────────
// Archetype 3 — TRADE-OFF. "Two valid builds; the right one depends on the task."
// Guide ref: 7.3 Latency, Cost & Throughput (smaller-model routing — use a cheap model for simple
// tasks, the strong one only when needed). There is no single correct card: on a SIMPLE task the
// cheap model is the smart pick (it passes AND stays in budget; the strong model overpays), while on
// a HARD task only the strong model is good enough (the cheap one produces a flawed result). Taught
// as two contrasting levels so the lesson — match the model to the task — actually lands.
//
// The model gate is data, handled by the engine's pre-walk failure modes: `requiresModel` (needs
// some model) and `needsStrongModel` (cheap is not good enough). No run.ts change.
const TRADEOFF_MAILOUT: Mission = {
  id: 'adv-tradeoff-mailout',
  worldId: 'advanced',
  goalKey: 'adv.tradeoff-mailout.goal',
  constraintKeys: ['adv.tradeoff-mailout.constraint.0', 'adv.tradeoff-mailout.constraint.1'],
  // Cheap model (cost 1) fits exactly; the strong model (cost 3) busts the budget here.
  budget: { steps: 4, cost: 1 },
  requiredCaps: [],
  requiresModel: true,
  minimalCardSet: ['model-cheap'],
  expectedOutcomeKey: 'success',
  solutionPath: [
    { marker: '🤔', kind: 'thought', textKey: 'step.adv-tradeoff-mailout.need.thought' },
    { marker: '✅', kind: 'done', textKey: 'step.adv-tradeoff-mailout.answer.done' }
  ]
};

const TRADEOFF_CONTRACT: Mission = {
  id: 'adv-tradeoff-contract',
  worldId: 'advanced',
  goalKey: 'adv.tradeoff-contract.goal',
  constraintKeys: ['adv.tradeoff-contract.constraint.0', 'adv.tradeoff-contract.constraint.1'],
  // Strong model (cost 3) is required and fits; cheap is not good enough (weak-model fail).
  budget: { steps: 4, cost: 3 },
  requiredCaps: [],
  requiresModel: true,
  needsStrongModel: true,
  minimalCardSet: ['model-strong'],
  expectedOutcomeKey: 'success',
  solutionPath: [
    { marker: '🤔', kind: 'thought', textKey: 'step.adv-tradeoff-contract.need.thought' },
    { marker: '✅', kind: 'done', textKey: 'step.adv-tradeoff-contract.answer.done' }
  ]
};

// ─────────────────────────────────────────────────────────────────────────────
// Archetype 4 — DIAGNOSE. "Here is a broken agent. Read its trace and fix it."
// Guide refs: 7.2 Observability & Tracing + 7.1 Trajectory Evaluation. The board starts pre-filled
// with a wrong build (in-conversation memory + web search) for a returning-client task that actually
// needs episodic memory + a document reader. It loads already failing; the trace points at the first
// broken link. The player swaps that card, re-runs, sees the NEXT symptom, and fixes it too — the
// iterative debug loop. The mission itself is an ordinary two-cap task; "diagnose" is the preset.
const DIAGNOSE_SUPPORT: Mission = {
  id: 'adv-diagnose-support',
  worldId: 'advanced',
  goalKey: 'adv.diagnose-support.goal',
  constraintKeys: ['adv.diagnose-support.constraint.0', 'adv.diagnose-support.constraint.1'],
  budget: { steps: 6, cost: 2 },
  requiredCaps: ['mem-episodic', 'doc-reader'],
  minimalCardSet: ['mem-episodic', 'tool-doc-reader'],
  expectedOutcomeKey: 'success',
  solutionPath: [
    { marker: '🤔', kind: 'thought', textKey: 'step.adv-diagnose-support.need.thought' },
    {
      marker: '🔍',
      kind: 'action',
      textKey: 'step.adv-diagnose-support.recall.action',
      requiresCap: 'mem-episodic',
      onMissingCap: {
        mode: 'fail',
        textKey: 'step.adv-diagnose-support.recall.fail',
        failureModeId: 'no-memory'
      }
    },
    {
      marker: '🔍',
      kind: 'action',
      textKey: 'step.adv-diagnose-support.lookup.action',
      requiresCap: 'doc-reader',
      onMissingCap: {
        mode: 'fail',
        textKey: 'step.adv-diagnose-support.lookup.fail',
        failureModeId: 'missing-tool'
      }
    },
    { marker: '✅', kind: 'done', textKey: 'step.adv-diagnose-support.answer.done' }
  ]
};

// ─────────────────────────────────────────────────────────────────────────────
// Archetype 5 — RED-TEAM (the bosses). "Spot the trick; get a human before the irreversible act."
// Guide refs: 8.3 Security & Adversarial Robustness (prompt injection — a malicious instruction
// hidden in content the agent reads) + 7.4 Safety & Guardrails (Human-in-the-Loop before money,
// mass mail, or deletion). The brief SHOWS the suspicious line, so the player learns to recognise it.
//
// Boss 1 teaches detection: a guardrail is needed or the agent obeys the hidden command.
// Boss 2 is the finale: detect the trick AND require a human sign-off before the irreversible
// transfer — both cards, across two families (guardrails + approval).
const REDTEAM_INJECT: Mission = {
  id: 'adv-redteam-inject',
  worldId: 'advanced',
  goalKey: 'adv.redteam-inject.goal',
  constraintKeys: ['adv.redteam-inject.constraint.0', 'adv.redteam-inject.constraint.1'],
  budget: { steps: 4, cost: 3 },
  requiredCaps: ['guardrail'],
  minimalCardSet: ['guard-check'],
  expectedOutcomeKey: 'success',
  solutionPath: [
    { marker: '🤔', kind: 'thought', textKey: 'step.adv-redteam-inject.need.thought' },
    {
      marker: '🔍',
      kind: 'action',
      textKey: 'step.adv-redteam-inject.check.action',
      requiresCap: 'guardrail',
      onMissingCap: {
        mode: 'fail',
        textKey: 'step.adv-redteam-inject.check.fail',
        failureModeId: 'no-guardrail-injection'
      }
    },
    { marker: '✅', kind: 'done', textKey: 'step.adv-redteam-inject.answer.done' }
  ]
};

const REDTEAM_TRANSFER: Mission = {
  id: 'adv-redteam-transfer',
  worldId: 'advanced',
  goalKey: 'adv.redteam-transfer.goal',
  constraintKeys: [
    'adv.redteam-transfer.constraint.0',
    'adv.redteam-transfer.constraint.1',
    'adv.redteam-transfer.constraint.2'
  ],
  budget: { steps: 5, cost: 3 },
  requiredCaps: ['guardrail', 'hitl'],
  minimalCardSet: ['guard-check', 'human-approval'],
  expectedOutcomeKey: 'success',
  solutionPath: [
    { marker: '🤔', kind: 'thought', textKey: 'step.adv-redteam-transfer.need.thought' },
    {
      marker: '🔍',
      kind: 'action',
      textKey: 'step.adv-redteam-transfer.check.action',
      requiresCap: 'guardrail',
      onMissingCap: {
        mode: 'fail',
        textKey: 'step.adv-redteam-transfer.check.fail',
        failureModeId: 'no-guardrail-injection'
      }
    },
    {
      marker: '🔍',
      kind: 'action',
      textKey: 'step.adv-redteam-transfer.approve.action',
      requiresCap: 'hitl',
      onMissingCap: {
        mode: 'fail',
        textKey: 'step.adv-redteam-transfer.approve.fail',
        failureModeId: 'no-approval'
      }
    },
    { marker: '✅', kind: 'done', textKey: 'step.adv-redteam-transfer.answer.done' }
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
  },
  {
    id: 'adv-chain-invoice',
    archetype: 'chain',
    icon: '🔗',
    titleKey: 'adv.chain-invoice.title',
    descKey: 'adv.chain-invoice.desc',
    mission: CHAIN_INVOICE,
    // Memory slot: episodic vs working distractor. Tools slot: calculator vs web distractor.
    // Review slot: the one review card — the lesson here is including every link, in three families.
    inventory: [
      'mem-episodic',
      'mem-working',
      'tool-calculator',
      'tool-web-search',
      'critic-review'
    ]
  },
  {
    id: 'adv-tradeoff-mailout',
    archetype: 'tradeoff',
    icon: '📨',
    titleKey: 'adv.tradeoff-mailout.title',
    descKey: 'adv.tradeoff-mailout.desc',
    mission: TRADEOFF_MAILOUT,
    // Both models in the one model slot — the choice IS the lesson (cheap is right here).
    inventory: ['model-cheap', 'model-strong']
  },
  {
    id: 'adv-tradeoff-contract',
    archetype: 'tradeoff',
    icon: '⚖️',
    titleKey: 'adv.tradeoff-contract.title',
    descKey: 'adv.tradeoff-contract.desc',
    mission: TRADEOFF_CONTRACT,
    // Same two models — but here the hard task needs the strong one.
    inventory: ['model-cheap', 'model-strong']
  },
  {
    id: 'adv-diagnose-support',
    archetype: 'diagnose',
    icon: '🩺',
    titleKey: 'adv.diagnose-support.title',
    descKey: 'adv.diagnose-support.desc',
    mission: DIAGNOSE_SUPPORT,
    // The right cards plus the wrong ones already on the board, so the player swaps in place.
    inventory: ['mem-episodic', 'mem-working', 'tool-doc-reader', 'tool-web-search'],
    // Broken starting build: wrong memory + wrong tool.
    preset: ['mem-working', 'tool-web-search']
  },
  {
    id: 'adv-redteam-inject',
    archetype: 'redteam',
    icon: '🕵️',
    titleKey: 'adv.redteam-inject.title',
    descKey: 'adv.redteam-inject.desc',
    mission: REDTEAM_INJECT,
    // Guard is the answer; HITL + a tool are distractors that don't catch the trick.
    inventory: ['guard-check', 'human-approval', 'tool-web-search']
  },
  {
    id: 'adv-redteam-transfer',
    archetype: 'redteam',
    icon: '🚨',
    titleKey: 'adv.redteam-transfer.title',
    descKey: 'adv.redteam-transfer.desc',
    mission: REDTEAM_TRANSFER,
    // The finale needs both safety cards (guard + human approval); two distractors fill other slots.
    inventory: ['guard-check', 'human-approval', 'tool-web-search', 'mem-working']
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
