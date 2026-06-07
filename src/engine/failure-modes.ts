import type { CapabilityId, FailureMode, StepTemplate, WalkContext } from './types.js';
import { hasAnyModel, isMemoryCap, isToolCap } from './capabilities.js';

// Registry of TRUE failure modes (extra-card is NOT here — it is a scoring penalty).
// MVP mission-backed: missing-tool, no-memory, budget-exceeded, wrong-role.
// Fixture-only teasers for deferred Worlds 6/7: no-stopping-loop, no-guardrail-injection.

export const MISSING_TOOL = 'missing-tool';
export const NO_MEMORY = 'no-memory';
export const NO_PLAN = 'no-plan';
export const NO_CRITIC = 'no-critic';
export const WRONG_ROLE = 'wrong-role';
export const NO_MODEL = 'no-model';
export const WEAK_MODEL = 'weak-model';
export const BUDGET_EXCEEDED = 'budget-exceeded';
export const NO_STOPPING_LOOP = 'no-stopping-loop';
export const NO_GUARDRAIL_INJECTION = 'no-guardrail-injection';
export const NO_APPROVAL = 'no-approval';

export const FAILURE_MODES: FailureMode[] = [
  {
    id: WRONG_ROLE,
    requiresPreWalk: true,
    evalOrder: 10,
    diagnosisKey: 'diag.wrong-role',
    trigger: (ctx) => {
      const required = ctx.mission.requiredRole;
      if (!required) return false;
      const placedRole = ctx.agent.cards.find((c) => c.type === 'role')?.capability;
      return placedRole !== required;
    }
  },
  {
    // Advanced trade-off: the task needs a model and none is placed.
    id: NO_MODEL,
    requiresPreWalk: true,
    evalOrder: 12,
    diagnosisKey: 'diag.no-model',
    trigger: (ctx) =>
      ctx.mission.requiresModel === true && !hasAnyModel(ctx.providedCaps)
  },
  {
    // Advanced trade-off: a hard task needs the strong model, but only the cheap one is placed.
    id: WEAK_MODEL,
    requiresPreWalk: true,
    evalOrder: 15,
    diagnosisKey: 'diag.weak-model',
    trigger: (ctx) =>
      ctx.mission.needsStrongModel === true && !ctx.providedCaps.has('model-strong')
  },
  {
    id: NO_GUARDRAIL_INJECTION,
    requiresPreWalk: true,
    evalOrder: 20,
    diagnosisKey: 'diag.no-guardrail-injection',
    trigger: (ctx) =>
      ctx.mission.injectionExpected === true && !ctx.providedCaps.has('guardrail')
  },
  {
    id: NO_PLAN,
    requiresPreWalk: false,
    evalOrder: 25,
    diagnosisKey: 'diag.no-plan',
    trigger: (ctx) => ctx.requiredMissing.includes('planner')
  },
  {
    id: NO_CRITIC,
    requiresPreWalk: false,
    evalOrder: 28,
    diagnosisKey: 'diag.no-critic',
    trigger: (ctx) => ctx.requiredMissing.includes('critic')
  },
  {
    // Advanced red-team boss: an irreversible action with no human sign-off.
    id: NO_APPROVAL,
    requiresPreWalk: false,
    evalOrder: 29,
    diagnosisKey: 'diag.no-approval',
    trigger: (ctx) => ctx.requiredMissing.includes('hitl')
  },
  {
    id: MISSING_TOOL,
    requiresPreWalk: false,
    evalOrder: 30,
    diagnosisKey: 'diag.missing-tool',
    trigger: (ctx) => ctx.requiredMissing.some((cap) => isToolCap(cap))
  },
  {
    id: NO_MEMORY,
    requiresPreWalk: false,
    evalOrder: 35,
    diagnosisKey: 'diag.no-memory',
    trigger: (ctx) => ctx.requiredMissing.some((cap) => isMemoryCap(cap))
  },
  {
    id: NO_STOPPING_LOOP,
    requiresPreWalk: false,
    evalOrder: 40,
    diagnosisKey: 'diag.no-stopping-loop',
    trigger: (ctx) =>
      ctx.mission.loopExpected === true &&
      !ctx.providedCaps.has('stopping') &&
      ctx.stepsUsed > ctx.mission.budget.steps
  },
  {
    id: BUDGET_EXCEEDED,
    requiresPreWalk: false,
    evalOrder: 50,
    diagnosisKey: 'diag.budget-exceeded',
    trigger: (ctx) =>
      ctx.stepsUsed > ctx.mission.budget.steps || ctx.costUsed > ctx.mission.budget.cost
  }
];

const BY_ID = new Map(FAILURE_MODES.map((m) => [m.id, m]));

export function failureModeById(id: string): FailureMode | undefined {
  return BY_ID.get(id);
}

export function preWalkModes(): FailureMode[] {
  return FAILURE_MODES.filter((m) => m.requiresPreWalk).sort((a, b) => a.evalOrder - b.evalOrder);
}

/**
 * Map a missing-cap step to the FailureMode that explains it.
 * - explicit onMissingCap.failureModeId wins
 * - a tool cap -> missing-tool
 * - otherwise the first in-walk mode whose trigger matches by evalOrder
 */
export function matchInWalkFailure(ctx: WalkContext, tpl: StepTemplate): FailureMode {
  const explicit = tpl.onMissingCap?.failureModeId;
  if (explicit) {
    const m = BY_ID.get(explicit);
    if (m) return m;
  }
  const missing: CapabilityId | undefined = tpl.requiresCap;
  if (missing && isToolCap(missing)) {
    return BY_ID.get(MISSING_TOOL)!;
  }
  const match = FAILURE_MODES.filter((m) => !m.requiresPreWalk)
    .sort((a, b) => a.evalOrder - b.evalOrder)
    .find((m) => m.trigger(ctx));
  return match ?? BY_ID.get(MISSING_TOOL)!;
}
