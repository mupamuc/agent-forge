import type { Card, CapabilityId, SlotType } from '$engine/index.js';

// Content cards for the playable slice. Every visible string is an i18n KEY, never prose.
// `icon` is a presentational emoji used by the UI only (not part of the engine contract).
export interface ContentCard extends Card {
  icon: string;
}

function mkCard(
  id: string,
  type: SlotType,
  capability: CapabilityId,
  cost: number,
  icon: string,
  termKey?: string
): ContentCard {
  return {
    id,
    type,
    capability,
    cost,
    icon,
    labelKey: `card.${id}.label`,
    ...(termKey ? { termKey } : {})
  };
}

// Roles cost 0 (a personality is free); tools/memory cost 1 (a "spend" the player feels).
// World 1 teaches "give a clear instruction/role" — four distinct roles so wrong-role is real.
export const CARDS = {
  roleGreeter: mkCard('role-greeter', 'role', 'role-greeter', 0, '🙂', 'term.role'),
  roleFormal: mkCard('role-formal', 'role', 'role-formal', 0, '🤝', 'term.role'),
  roleConcise: mkCard('role-concise', 'role', 'role-concise', 0, '✂️', 'term.role'),
  rolePersona: mkCard('role-persona', 'role', 'role-persona', 0, '🏢', 'term.role'),
  webSearch: mkCard('tool-web-search', 'tools', 'web-search', 1, '🌐', 'term.web-search'),
  calculator: mkCard('tool-calculator', 'tools', 'calculator', 1, '🧮', 'term.calculator'),
  docReader: mkCard('tool-doc-reader', 'tools', 'doc-reader', 1, '📄', 'term.doc-reader'),
  // World 3 — memory cards. Three distinct kinds so each mission teaches one (and the others are
  // present-as-distractors). Icons stay distinct for a non-technical audience: 💬 in-conversation,
  // 🧠 past chats, 📚 a knowledge base.
  memWorking: mkCard('mem-working', 'memory', 'mem-working', 1, '💬', 'term.mem-working'),
  memEpisodic: mkCard('mem-episodic', 'memory', 'mem-episodic', 1, '🧠', 'term.memory'),
  memSemantic: mkCard('mem-semantic', 'memory', 'mem-semantic', 1, '📚', 'term.mem-semantic'),
  // Worlds 4–7 — control cards. Data only for now; no MVP mission references them yet (a later
  // content pass wires them into missions). 🪜 break a task into steps, 🔎 review the result,
  // 🛑 know when to stop, 🛡️ stay within safe bounds.
  planSteps: mkCard('plan-steps', 'planner', 'planner', 1, '🪜', 'term.planner'),
  criticReview: mkCard('critic-review', 'review', 'critic', 1, '🔎', 'term.critic'),
  stopRule: mkCard('stop-rule', 'stopping', 'stopping', 1, '🛑', 'term.stopping'),
  guardCheck: mkCard('guard-check', 'guardrails', 'guardrail', 1, '🛡️', 'term.guardrails'),
  // Advanced cost/quality trade-off — two model tiers. Cheap is, well, cheap (cost 1); strong is
  // pricey (cost 3) but the only one good enough for hard tasks. Same family => one "model" slot.
  cheapModel: mkCard('model-cheap', 'model', 'model-cheap', 1, '🪙', 'term.model'),
  strongModel: mkCard('model-strong', 'model', 'model-strong', 3, '💎', 'term.model'),
  // Advanced red-team boss — human-in-the-loop sign-off before an irreversible action.
  humanApproval: mkCard('human-approval', 'approval', 'hitl', 1, '✋', 'term.hitl')
} as const;

export const ALL_CARDS: ReadonlyArray<ContentCard> = Object.values(CARDS);

export function cardById(id: string): ContentCard | undefined {
  return ALL_CARDS.find((c) => c.id === id);
}
