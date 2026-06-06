import type { AgentConfig, Mission } from './types.js';

/** Total cost of placed cards. */
export function cardCost(agent: AgentConfig): number {
  return agent.cards.reduce((sum, c) => sum + c.cost, 0);
}

export function withinBudget(
  mission: Mission,
  stepsUsed: number,
  costUsed: number
): boolean {
  return stepsUsed <= mission.budget.steps && costUsed <= mission.budget.cost;
}
