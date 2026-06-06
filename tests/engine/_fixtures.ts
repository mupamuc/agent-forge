import type { AgentConfig, Card, CapabilityId, Mission, SlotType } from '$engine/index.js';

export function mkCard(
  id: string,
  type: SlotType,
  capability: CapabilityId,
  cost = 1
): Card {
  return { id, type, capability, cost, labelKey: `card.${id}.label` };
}

export const CARDS = {
  roleGreeter: mkCard('role-greeter', 'role', 'role-greeter', 0),
  roleFormal: mkCard('role-formal', 'role', 'role-formal', 0),
  roleConcise: mkCard('role-concise', 'role', 'role-concise', 0),
  rolePersona: mkCard('role-persona', 'role', 'role-persona', 0),
  webSearch: mkCard('tool-web-search', 'tools', 'web-search', 1),
  calculator: mkCard('tool-calculator', 'tools', 'calculator', 1),
  docReader: mkCard('tool-doc-reader', 'tools', 'doc-reader', 1),
  memWorking: mkCard('mem-working', 'memory', 'mem-working', 1),
  memEpisodic: mkCard('mem-episodic', 'memory', 'mem-episodic', 1),
  memSemantic: mkCard('mem-semantic', 'memory', 'mem-semantic', 1),
  stopping: mkCard('ctrl-stopping', 'stopping', 'stopping', 1),
  guardrail: mkCard('ctrl-guardrail', 'guardrails', 'guardrail', 1)
} as const;

export function agent(...cards: Card[]): AgentConfig {
  return { cards };
}

// --- Sample missions -------------------------------------------------------

// World 2.1 — needs internet (tool). Trap-free.
export const MISSION_CURRENCY: Mission = {
  id: '2-1-currency',
  worldId: 'world-2',
  goalKey: 'mission.2-1.goal',
  constraintKeys: ['mission.2-1.constraint.0'],
  budget: { steps: 4, cost: 3 },
  requiredCaps: ['web-search'],
  minimalCardSet: ['tool-web-search'],
  expectedOutcomeKey: 'success',
  solutionPath: [
    { marker: '🤔', kind: 'thought', textKey: 'step.2-1.need.thought' },
    {
      marker: '🔍',
      kind: 'action',
      textKey: 'step.2-1.fetch.action',
      requiresCap: 'web-search',
      onMissingCap: { mode: 'fail', textKey: 'step.2-1.fetch.fail', failureModeId: 'missing-tool' }
    },
    { marker: '👀', kind: 'observation', textKey: 'step.2-1.saw.observation' },
    { marker: '✅', kind: 'done', textKey: 'step.2-1.answer.done' }
  ]
};

// World 2.4 — needs internet; calculator is a useless trap (👀 waste step + lost star).
export const MISSION_NEWS: Mission = {
  id: '2-4-news',
  worldId: 'world-2',
  goalKey: 'mission.2-4.goal',
  constraintKeys: ['mission.2-4.constraint.0'],
  budget: { steps: 5, cost: 4 },
  requiredCaps: ['web-search'],
  forbiddenOrUselessCaps: ['calculator', 'code-run'],
  minimalCardSet: ['tool-web-search'],
  expectedOutcomeKey: 'success',
  solutionPath: [
    { marker: '🤔', kind: 'thought', textKey: 'step.2-4.need.thought' },
    {
      marker: '🔍',
      kind: 'action',
      textKey: 'step.2-4.fetch.action',
      requiresCap: 'web-search',
      onMissingCap: { mode: 'fail', textKey: 'step.2-4.fetch.fail', failureModeId: 'missing-tool' }
    },
    {
      marker: '👀',
      kind: 'observation',
      textKey: 'step.2-4.waste.observation',
      firesWhenCapPresent: 'calculator',
      cost: 1
    },
    { marker: '✅', kind: 'done', textKey: 'step.2-4.answer.done' }
  ]
};

// World 1.2 — tone: requires the formal role specifically (wrong-role pre-walk fail).
export const MISSION_TONE: Mission = {
  id: '1-2-tone',
  worldId: 'world-1',
  goalKey: 'mission.1-2.goal',
  constraintKeys: ['mission.1-2.constraint.0'],
  budget: { steps: 4, cost: 3 },
  requiredCaps: ['role-formal'],
  requiredRole: 'role-formal',
  minimalCardSet: ['role-formal'],
  expectedOutcomeKey: 'success',
  solutionPath: [
    { marker: '🤔', kind: 'thought', textKey: 'step.1-2.read.thought' },
    { marker: '✅', kind: 'done', textKey: 'step.1-2.reply.done' }
  ]
};

// World 3.4 — honesty: missing memory must REFUSE and PASS, not fabricate.
export const MISSION_HONESTY: Mission = {
  id: '3-4-honesty',
  worldId: 'world-3',
  goalKey: 'mission.3-4.goal',
  constraintKeys: ['mission.3-4.constraint.0'],
  budget: { steps: 4, cost: 3 },
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

// World 3.1 — recall: a missing memory cap must hard-fail as no-memory (not missing-tool).
export const MISSION_RECALL: Mission = {
  id: '3-1-recall',
  worldId: 'world-3',
  goalKey: 'mission.3-1.goal',
  constraintKeys: ['mission.3-1.constraint.0'],
  budget: { steps: 4, cost: 3 },
  requiredCaps: ['mem-working'],
  minimalCardSet: ['mem-working'],
  expectedOutcomeKey: 'success',
  solutionPath: [
    { marker: '🤔', kind: 'thought', textKey: 'step.3-1.need.thought' },
    {
      marker: '🔍',
      kind: 'action',
      textKey: 'step.3-1.recall.action',
      requiresCap: 'mem-working',
      onMissingCap: { mode: 'fail', textKey: 'step.3-1.recall.fail', failureModeId: 'no-memory' }
    },
    { marker: '✅', kind: 'done', textKey: 'step.3-1.answer.done' }
  ]
};

// Fixture-only: over-budget (steps). Budget allows 1 step, path has 3 normal steps.
export const MISSION_BUDGET_FIXTURE: Mission = {
  id: 'fx-budget',
  worldId: 'fixture',
  goalKey: 'fx.goal',
  constraintKeys: [],
  budget: { steps: 1, cost: 99 },
  requiredCaps: [],
  minimalCardSet: [],
  expectedOutcomeKey: 'success',
  solutionPath: [
    { marker: '🤔', kind: 'thought', textKey: 'fx.s1' },
    { marker: '🔍', kind: 'action', textKey: 'fx.s2' },
    { marker: '✅', kind: 'done', textKey: 'fx.s3' }
  ]
};

// Fixture-only: missing-stop loop teaser (Worlds 6/7).
export const MISSION_LOOP_FIXTURE: Mission = {
  ...MISSION_BUDGET_FIXTURE,
  id: 'fx-loop',
  loopExpected: true
};

// Fixture-only: guardrail/injection teaser (Worlds 6/7).
export const MISSION_INJECTION_FIXTURE: Mission = {
  id: 'fx-injection',
  worldId: 'fixture',
  goalKey: 'fx.goal',
  constraintKeys: [],
  budget: { steps: 4, cost: 3 },
  requiredCaps: [],
  injectionExpected: true,
  minimalCardSet: ['ctrl-guardrail'],
  expectedOutcomeKey: 'success',
  solutionPath: [
    { marker: '🤔', kind: 'thought', textKey: 'fx.inj.thought' },
    { marker: '✅', kind: 'done', textKey: 'fx.inj.done' }
  ]
};
