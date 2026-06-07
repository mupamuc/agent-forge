import type { AgentConfig, CapabilityId, Mission } from './types.js';

const TOOL_CAPS: ReadonlySet<CapabilityId> = new Set<CapabilityId>([
  'web-search',
  'calculator',
  'doc-reader',
  'code-run'
]);

const MEMORY_CAPS: ReadonlySet<CapabilityId> = new Set<CapabilityId>([
  'mem-working',
  'mem-episodic',
  'mem-semantic'
]);

const MODEL_CAPS: ReadonlySet<CapabilityId> = new Set<CapabilityId>([
  'model-cheap',
  'model-strong'
]);

export function isToolCap(cap: CapabilityId): boolean {
  return TOOL_CAPS.has(cap);
}

export function isMemoryCap(cap: CapabilityId): boolean {
  return MEMORY_CAPS.has(cap);
}

export function isModelCap(cap: CapabilityId): boolean {
  return MODEL_CAPS.has(cap);
}

/** Whether the agent has any model placed (cheap or strong). */
export function hasAnyModel(caps: ReadonlySet<CapabilityId>): boolean {
  return caps.has('model-cheap') || caps.has('model-strong');
}

export function providedCaps(agent: AgentConfig): Set<CapabilityId> {
  const set = new Set<CapabilityId>();
  for (const card of agent.cards) set.add(card.capability);
  return set;
}

export function placedCardIds(agent: AgentConfig): string[] {
  return agent.cards.map((c) => c.id);
}

export function extraCards(agent: AgentConfig, mission: Mission): string[] {
  const minimal = new Set(mission.minimalCardSet);
  return agent.cards.map((c) => c.id).filter((id) => !minimal.has(id));
}

export function requiredMissing(agent: AgentConfig, mission: Mission): CapabilityId[] {
  const have = providedCaps(agent);
  return mission.requiredCaps.filter((cap) => !have.has(cap));
}

/** The role capability currently placed (first role card), if any. */
export function placedRole(agent: AgentConfig): CapabilityId | undefined {
  const roleCard = agent.cards.find((c) => c.type === 'role');
  return roleCard?.capability;
}
