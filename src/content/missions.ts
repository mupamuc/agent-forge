import type { CapabilityId, Mission } from '$engine/index.js';
import { ALL_CARDS, cardById, type ContentCard } from './cards.js';
import { WORLDS } from './worlds.js';

// World 1 — "Give a clear instruction". Each mission teaches one role: the player must pick the
// RIGHT voice. A 2-step path (🤔 thought + ✅ done) is the whole job; the engine's pre-walk
// wrong-role failure fires (with a ❌ "answered in the wrong voice" beat) when the placed role
// capability ≠ requiredRole. The inventory is all four role cards, so the choice is real.
function mkRoleMission(
  id: string,
  role: CapabilityId,
  roleCardId: string
): Mission {
  const short = id.slice(0, 3); // "1-1" etc. — namespaces the mission goal/constraint keys
  return {
    id,
    worldId: 'world-1',
    goalKey: `mission.${short}.goal`,
    constraintKeys: [`mission.${short}.constraint.0`],
    budget: { steps: 3, cost: 3 },
    requiredCaps: [role],
    requiredRole: role,
    minimalCardSet: [roleCardId],
    expectedOutcomeKey: 'success',
    // Step keys are namespaced by the FULL mission id to match the engine's pre-walk wrong-role
    // beat (`step.<mission.id>.wrong-role.fail`), keeping every step for a mission in one place.
    solutionPath: [
      { marker: '🤔', kind: 'thought', textKey: `step.${id}.read.thought` },
      { marker: '✅', kind: 'done', textKey: `step.${id}.reply.done` }
    ]
  };
}

export const MISSION_GREET = mkRoleMission('1-1-greet', 'role-greeter', 'role-greeter');
export const MISSION_COMPLAINT = mkRoleMission('1-2-complaint', 'role-formal', 'role-formal');
export const MISSION_CONCISE = mkRoleMission('1-3-concise', 'role-concise', 'role-concise');
export const MISSION_PERSONA = mkRoleMission('1-4-persona', 'role-persona', 'role-persona');

// World 2.1 — "Currency". The agent must fetch a live exchange rate, so it NEEDS web-search.
// The calculator is a useless trap: present-but-useless => costs the minimal-set star, and a
// 👀 waste step (firesWhenCapPresent) shows the player WHY ("it tried to do the math itself").
export const MISSION_CURRENCY: Mission = {
  id: '2-1-currency',
  worldId: 'world-2',
  goalKey: 'mission.2-1.goal',
  constraintKeys: ['mission.2-1.constraint.0'],
  budget: { steps: 5, cost: 3 },
  requiredCaps: ['web-search'],
  forbiddenOrUselessCaps: ['calculator'],
  minimalCardSet: ['tool-web-search'],
  expectedOutcomeKey: 'success',
  solutionPath: [
    { marker: '🤔', kind: 'thought', textKey: 'step.2-1.need.thought' },
    {
      marker: '🔍',
      kind: 'action',
      textKey: 'step.2-1.fetch.action',
      requiresCap: 'web-search',
      onMissingCap: {
        mode: 'fail',
        textKey: 'step.2-1.fetch.fail',
        failureModeId: 'missing-tool'
      }
    },
    {
      marker: '👀',
      kind: 'observation',
      textKey: 'step.2-1.waste.observation',
      firesWhenCapPresent: 'calculator',
      cost: 1
    },
    { marker: '👀', kind: 'observation', textKey: 'step.2-1.saw.observation' },
    { marker: '✅', kind: 'done', textKey: 'step.2-1.answer.done' }
  ]
};

// World 2 tool missions share one shape: 🤔 thought → 🔍 action (requires the tool) → 👀 obs → ✅ done.
// The action marker is the engine's 🔍 "action" beat; the specific tool is conveyed by the card icon
// (🧮 calculator, 📄 doc-reader) in the inventory, not by a per-step marker.
// Without the tool the action fails as missing-tool (the agent fabricates instead of using a skill).
function mkToolMission(id: string, tool: CapabilityId, toolCardId: string): Mission {
  const short = id.slice(0, 3); // "2-2" etc.
  return {
    id,
    worldId: 'world-2',
    goalKey: `mission.${short}.goal`,
    constraintKeys: [`mission.${short}.constraint.0`],
    budget: { steps: 5, cost: 3 },
    requiredCaps: [tool],
    minimalCardSet: [toolCardId],
    expectedOutcomeKey: 'success',
    solutionPath: [
      { marker: '🤔', kind: 'thought', textKey: `step.${short}.need.thought` },
      {
        marker: '🔍',
        kind: 'action',
        textKey: `step.${short}.use.action`,
        requiresCap: tool,
        onMissingCap: {
          mode: 'fail',
          textKey: `step.${short}.use.fail`,
          failureModeId: 'missing-tool'
        }
      },
      { marker: '👀', kind: 'observation', textKey: `step.${short}.saw.observation` },
      { marker: '✅', kind: 'done', textKey: `step.${short}.answer.done` }
    ]
  };
}

// World 2.2 — "Estimate". Needs the calculator to add up the line items (without it the agent
// guesses and the arithmetic is wrong).
export const MISSION_ESTIMATE = mkToolMission('2-2-estimate', 'calculator', 'tool-calculator');

// World 2.3 — "Contract clause". Needs the document reader to find the real clause (without it the
// agent fabricates a clause that isn't there).
export const MISSION_CONTRACT = mkToolMission('2-3-contract', 'doc-reader', 'tool-doc-reader');

// World 2.4 — "News digest". Needs internet; the calculator is a useless trap: present-but-useless
// costs the minimal-set star, and a 👀 waste step (firesWhenCapPresent) shows WHY it was wasted.
export const MISSION_NEWS: Mission = {
  id: '2-4-news',
  worldId: 'world-2',
  goalKey: 'mission.2-4.goal',
  constraintKeys: ['mission.2-4.constraint.0'],
  budget: { steps: 5, cost: 4 },
  requiredCaps: ['web-search'],
  forbiddenOrUselessCaps: ['calculator'],
  minimalCardSet: ['tool-web-search'],
  expectedOutcomeKey: 'success',
  solutionPath: [
    { marker: '🤔', kind: 'thought', textKey: 'step.2-4.need.thought' },
    {
      marker: '🔍',
      kind: 'action',
      textKey: 'step.2-4.fetch.action',
      requiresCap: 'web-search',
      onMissingCap: {
        mode: 'fail',
        textKey: 'step.2-4.fetch.fail',
        failureModeId: 'missing-tool'
      }
    },
    {
      marker: '👀',
      kind: 'observation',
      textKey: 'step.2-4.waste.observation',
      firesWhenCapPresent: 'calculator',
      cost: 1
    },
    { marker: '👀', kind: 'observation', textKey: 'step.2-4.saw.observation' },
    { marker: '✅', kind: 'done', textKey: 'step.2-4.answer.done' }
  ]
};

// World 3 memory missions share one shape: 🤔 thought → 🔍 recall (requires the memory) → ✅ done.
// The recall uses the engine's 🔍 "action" beat; the kind of memory is conveyed by the card icon
// (💬 working, 🧠 episodic, 📚 semantic) in the inventory, not by a per-step marker.
// Without the right memory the recall fails as no-memory (the agent has nothing to draw on).
function mkMemoryMission(id: string, mem: CapabilityId, memCardId: string): Mission {
  const short = id.slice(0, 3); // "3-1" etc.
  return {
    id,
    worldId: 'world-3',
    goalKey: `mission.${short}.goal`,
    constraintKeys: [`mission.${short}.constraint.0`],
    budget: { steps: 5, cost: 3 },
    requiredCaps: [mem],
    minimalCardSet: [memCardId],
    expectedOutcomeKey: 'success',
    solutionPath: [
      { marker: '🤔', kind: 'thought', textKey: `step.${short}.need.thought` },
      {
        marker: '🔍',
        kind: 'action',
        textKey: `step.${short}.recall.action`,
        requiresCap: mem,
        onMissingCap: {
          mode: 'fail',
          textKey: `step.${short}.recall.fail`,
          failureModeId: 'no-memory'
        }
      },
      { marker: '✅', kind: 'done', textKey: `step.${short}.answer.done` }
    ]
  };
}

// World 3.1 — remember the client's name (in-conversation working memory).
export const MISSION_NAME = mkMemoryMission('3-1-name', 'mem-working', 'mem-working');
// World 3.2 — recall the previous conversation (episodic memory of past chats).
export const MISSION_HISTORY = mkMemoryMission('3-2-history', 'mem-episodic', 'mem-episodic');
// World 3.3 — lean on the FAQ knowledge base (semantic memory).
export const MISSION_FAQ = mkMemoryMission('3-3-faq', 'mem-semantic', 'mem-semantic');

// World 3.4 — honesty. WITH episodic memory the agent recalls and succeeds; WITHOUT it the recall
// step REFUSES honestly (a ✅ that PASSES, outcomeKey 'refusal') instead of fabricating an answer.
export const MISSION_HONESTY: Mission = {
  id: '3-4-honesty',
  worldId: 'world-3',
  goalKey: 'mission.3-4.goal',
  constraintKeys: ['mission.3-4.constraint.0'],
  budget: { steps: 5, cost: 3 },
  requiredCaps: ['mem-episodic'],
  minimalCardSet: ['mem-episodic'],
  expectedOutcomeKey: 'success',
  solutionPath: [
    { marker: '🤔', kind: 'thought', textKey: 'step.3-4.recall.thought' },
    {
      marker: '🔍',
      kind: 'action',
      textKey: 'step.3-4.recall.action',
      requiresCap: 'mem-episodic',
      onMissingCap: { mode: 'refuse', textKey: 'step.3-4.refuse' }
    },
    { marker: '✅', kind: 'done', textKey: 'step.3-4.answer.done' }
  ]
};

const MISSIONS: ReadonlyArray<Mission> = [
  MISSION_GREET,
  MISSION_COMPLAINT,
  MISSION_CONCISE,
  MISSION_PERSONA,
  MISSION_CURRENCY,
  MISSION_ESTIMATE,
  MISSION_CONTRACT,
  MISSION_NEWS,
  MISSION_NAME,
  MISSION_HISTORY,
  MISSION_FAQ,
  MISSION_HONESTY
];

export function getMissionById(id: string): Mission | undefined {
  return MISSIONS.find((m) => m.id === id);
}

// All World-1 mission ids — they share the same four-role inventory (pick the right voice).
const WORLD_1_MISSION_IDS = new Set(
  WORLDS.find((w) => w.id === 'world-1')?.missionIds ?? []
);

// The four role cards are the World-1 inventory: exactly one is the correct voice, the other
// three are wrong-role distractors that trigger the engine's pre-walk wrong-role failure.
const WORLD_1_INVENTORY: ReadonlyArray<string> = [
  'role-greeter',
  'role-formal',
  'role-concise',
  'role-persona'
];

// World 2 inventory: the three tools (so distractors exist). web-search / calculator / doc-reader —
// exactly one is the answer per mission, the other two are tool distractors. Roles aren't needed
// for World 2, so the inventory is tools-only.
const WORLD_2_INVENTORY: ReadonlyArray<string> = [
  'tool-web-search',
  'tool-calculator',
  'tool-doc-reader'
];

// World 3 inventory: the three memory cards (exactly one is the answer per mission) plus one tool
// distractor so the player feels the choice "memory vs. a tool".
const WORLD_3_INVENTORY: ReadonlyArray<string> = [
  'mem-working',
  'mem-episodic',
  'mem-semantic',
  'tool-web-search'
];

const WORLD_2_MISSION_IDS = new Set(WORLDS.find((w) => w.id === 'world-2')?.missionIds ?? []);
const WORLD_3_MISSION_IDS = new Set(WORLDS.find((w) => w.id === 'world-3')?.missionIds ?? []);

export function cardsForMission(missionId: string): ContentCard[] {
  let ids: ReadonlyArray<string> | undefined;
  if (WORLD_1_MISSION_IDS.has(missionId)) ids = WORLD_1_INVENTORY;
  else if (WORLD_2_MISSION_IDS.has(missionId)) ids = WORLD_2_INVENTORY;
  else if (WORLD_3_MISSION_IDS.has(missionId)) ids = WORLD_3_INVENTORY;
  if (!ids) return [...ALL_CARDS];
  return ids
    .map((id) => cardById(id))
    .filter((c): c is ContentCard => c !== undefined);
}

// A world group for the Sandbox scenario picker: the world's title key plus its missions, each
// with the office goal text key, in author order. Used by the free-play screen to let the player
// pick any of the twelve campaign scenarios (no unlock gating — every scenario is available).
export interface SandboxGroup {
  worldId: string;
  titleKey: string;
  missions: ReadonlyArray<{ id: string; goalKey: string }>;
}

// All twelve campaign missions, grouped by world for the Sandbox picker. Reuses WORLDS order and
// each mission's own goalKey/titleKey so the picker stays in sync with the campaign by construction.
export function sandboxScenarios(): SandboxGroup[] {
  return WORLDS.map((world) => ({
    worldId: world.id,
    titleKey: world.titleKey,
    missions: world.missionIds
      .map((id) => getMissionById(id))
      .filter((m): m is Mission => m !== undefined)
      .map((m) => ({ id: m.id, goalKey: m.goalKey }))
  }));
}
