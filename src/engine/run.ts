import type { AgentConfig, Mission, Step, Verdict, WalkContext } from './types.js';
import {
  extraCards,
  placedCardIds,
  providedCaps,
  requiredMissing
} from './capabilities.js';
import { cardCost } from './budget.js';
import { computeStars } from './scoring.js';
import {
  BUDGET_EXCEEDED,
  NO_STOPPING_LOOP,
  failureModeById,
  matchInWalkFailure,
  preWalkModes
} from './failure-modes.js';
import type { FailureMode } from './types.js';

function buildWalkContext(agent: AgentConfig, mission: Mission): WalkContext {
  return {
    agent,
    mission,
    providedCaps: providedCaps(agent),
    placedCardIds: placedCardIds(agent),
    extraCards: extraCards(agent, mission),
    requiredMissing: requiredMissing(agent, mission),
    stepsUsed: 0,
    costUsed: cardCost(agent) // placing extra cards raises cost (affects withinBudget star, 2.4 trap)
  };
}

function buildFail(fm: FailureMode, steps: Step[], ctx: WalkContext): Verdict {
  return {
    passed: false,
    steps,
    failureModeId: fm.id,
    diagnosisKey: fm.diagnosisKey,
    stepsUsed: ctx.stepsUsed,
    costUsed: ctx.costUsed,
    stars: { passed: false, minimalSet: false, withinBudget: false }
  };
}

/**
 * Deterministic walk of a mission. PURE: same (agent, mission) -> byte-identical Verdict.
 * Language is NOT an input — the Verdict carries i18n keys only; rendering maps keys -> prose later.
 */
export function run(agent: AgentConfig, mission: Mission): Verdict {
  const ctx = buildWalkContext(agent, mission);
  const steps: Step[] = [];

  // 1. Pre-walk failure modes (setup-level): wrong-role, guardrail/injection teaser.
  for (const fm of preWalkModes()) {
    if (fm.trigger(ctx)) {
      // emit a ❌ story beat so the player sees the cause (e.g. "answered in the wrong voice")
      steps.push({ marker: '❌', kind: 'fail', textKey: `step.${mission.id}.${fm.id}.fail`, ok: false });
      return buildFail(fm, steps, ctx);
    }
  }

  // 2. Deterministic walk of the solution path.
  for (const tpl of mission.solutionPath) {
    // Observation/waste step: render only when its cap is present (e.g. 2.4 wasted calculator 👀).
    if (tpl.firesWhenCapPresent) {
      if (ctx.providedCaps.has(tpl.firesWhenCapPresent)) {
        ctx.costUsed += tpl.cost ?? 0;
        ctx.stepsUsed += 1;
        steps.push({ marker: tpl.marker, kind: tpl.kind, textKey: tpl.textKey, ok: true });
      }
      continue;
    }

    // Missing-required-cap branch — refusal vs. fail decided by DATA (onMissingCap).
    if (tpl.requiresCap && !ctx.providedCaps.has(tpl.requiresCap)) {
      const mode = tpl.onMissingCap?.mode ?? 'fail';
      if (mode === 'refuse') {
        // honest refusal (3.4): emit a ✅ refusal step, tagged so outcomeKey can detect it; PASS preserved.
        // Refusal is a TERMINAL success — stop the walk so the agent never fabricates the answer it lacks.
        ctx.stepsUsed += 1;
        steps.push({
          marker: '✅',
          kind: 'refusal',
          textKey: tpl.onMissingCap!.textKey,
          ok: true
        });
        break;
      }
      steps.push({
        marker: '❌',
        kind: 'fail',
        textKey: tpl.onMissingCap?.textKey ?? tpl.textKey,
        ok: false
      });
      const fm = matchInWalkFailure(ctx, tpl);
      return buildFail(fm, steps, ctx);
    }

    // Normal step.
    ctx.costUsed += tpl.cost ?? 0;
    ctx.stepsUsed += 1;
    steps.push({ marker: tpl.marker, kind: tpl.kind, textKey: tpl.textKey, ok: true });

    // Step-cap / loop guard — discriminate a missing-stop loop from plain over-budget.
    if (ctx.stepsUsed > mission.budget.steps) {
      const isLoop = mission.loopExpected === true && !ctx.providedCaps.has('stopping');
      const fm = failureModeById(isLoop ? NO_STOPPING_LOOP : BUDGET_EXCEEDED);
      return buildFail(fm!, steps, ctx);
    }
  }

  // 3. Success. The refusal path above kept passed=true via DATA (no per-mission code).
  const passed = true;
  const outcomeKey = steps.some((s) => s.kind === 'refusal')
    ? 'refusal'
    : mission.expectedOutcomeKey;

  return {
    passed,
    steps,
    outcomeKey,
    stepsUsed: ctx.stepsUsed,
    costUsed: ctx.costUsed,
    stars: computeStars({
      passed,
      agent,
      mission,
      stepsUsed: ctx.stepsUsed,
      costUsed: ctx.costUsed
    })
  };
}
