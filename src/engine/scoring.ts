import type { AgentConfig, Mission, Stars } from './types.js';
import { extraCards, providedCaps } from './capabilities.js';
import { withinBudget } from './budget.js';

export interface ScoreInput {
  passed: boolean;
  agent: AgentConfig;
  mission: Mission;
  stepsUsed: number;
  costUsed: number;
}

/**
 * Three independent booleans. Stars are only awarded on a passing run.
 * - minimalSet: no card outside minimalCardSet AND no forbidden/useless cap present
 *   (this is how the 2.4 calculator trap costs a star).
 * - withinBudget: steps and cost are both within the mission budget.
 */
export function computeStars(input: ScoreInput): Stars {
  const { passed, agent, mission, stepsUsed, costUsed } = input;
  if (!passed) {
    return { passed: false, minimalSet: false, withinBudget: false };
  }

  const extras = extraCards(agent, mission);
  const have = providedCaps(agent);
  const hasUselessCap = (mission.forbiddenOrUselessCaps ?? []).some((cap) => have.has(cap));

  return {
    passed: true,
    minimalSet: extras.length === 0 && !hasUselessCap,
    withinBudget: withinBudget(mission, stepsUsed, costUsed)
  };
}
