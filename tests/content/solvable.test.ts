import { describe, it, expect } from 'vitest';
import type { AgentConfig, Card } from '$engine/index.js';
import { run, WRONG_ROLE, MISSING_TOOL, NO_MEMORY } from '$engine/index.js';
import { cardById } from '$content/cards.js';
import { WORLDS } from '$content/worlds.js';
import { getMissionById } from '$content/missions.js';

// AC-5: every mission has a minimalCardSet that auto-solves to 3 stars, and the world-specific
// failure modes fire when the wrong (or no) cards are placed.

// Build the engine AgentConfig for a list of card ids (resolved via the content registry).
function agentFromIds(ids: ReadonlyArray<string>): AgentConfig {
  const cards = ids
    .map((id) => cardById(id))
    .filter((c): c is NonNullable<ReturnType<typeof cardById>> => c !== undefined)
    .map((c): Card => ({
      id: c.id,
      type: c.type,
      capability: c.capability,
      cost: c.cost,
      labelKey: c.labelKey
    }));
  return { cards };
}

const ALL_MISSION_IDS = WORLDS.flatMap((w) => w.missionIds);

describe('content — every mission is solvable to 3 stars (AC-5)', () => {
  it('covers World 1 (×4), World 2 (×4) and World 3 (×4)', () => {
    // Guard: we expect exactly the twelve campaign missions wired into the registry.
    expect(ALL_MISSION_IDS).toEqual([
      '1-1-greet',
      '1-2-complaint',
      '1-3-concise',
      '1-4-persona',
      '2-1-currency',
      '2-2-estimate',
      '2-3-contract',
      '2-4-news',
      '3-1-name',
      '3-2-history',
      '3-3-faq',
      '3-4-honesty'
    ]);
  });

  for (const missionId of ALL_MISSION_IDS) {
    it(`${missionId}: minimalCardSet passes with 3 stars`, () => {
      const mission = getMissionById(missionId)!;
      const verdict = run(agentFromIds(mission.minimalCardSet), mission);
      expect(verdict.passed).toBe(true);
      expect(verdict.stars).toEqual({
        passed: true,
        minimalSet: true,
        withinBudget: true
      });
    });
  }
});

describe('content — World-1 missions fail with wrong-role on a different role (AC-5)', () => {
  const WORLD_1_IDS = WORLDS.find((w) => w.id === 'world-1')!.missionIds;
  // A pool of role card ids to pick a "wrong" one from.
  const ROLE_CARD_IDS = ['role-greeter', 'role-formal', 'role-concise', 'role-persona'];

  for (const missionId of WORLD_1_IDS) {
    it(`${missionId}: a wrong role triggers the wrong-role failure`, () => {
      const mission = getMissionById(missionId)!;
      const correctRoleCardId = mission.minimalCardSet[0]!;
      const wrongRoleCardId = ROLE_CARD_IDS.find((id) => id !== correctRoleCardId)!;

      const verdict = run(agentFromIds([wrongRoleCardId]), mission);
      expect(verdict.passed).toBe(false);
      expect(verdict.failureModeId).toBe(WRONG_ROLE);
      // The engine emits the ❌ "answered in the wrong voice" beat as step.<mission.id>.wrong-role.fail.
      expect(
        verdict.steps.some((s) => s.textKey === `step.${missionId}.wrong-role.fail`)
      ).toBe(true);
    });
  }
});

describe('content — World-2 tool missions fail with missing-tool when the tool is absent (AC-5)', () => {
  // 2-1 and 2-4 fail the same way; we assert all four tool missions here, with an empty agent.
  for (const missionId of ['2-1-currency', '2-2-estimate', '2-3-contract', '2-4-news']) {
    it(`${missionId}: no tool -> missing-tool`, () => {
      const mission = getMissionById(missionId)!;
      const verdict = run(agentFromIds([]), mission);
      expect(verdict.passed).toBe(false);
      expect(verdict.failureModeId).toBe(MISSING_TOOL);
    });
  }
});

describe('content — 2-4 news: the calculator is a useless trap (AC-5)', () => {
  it('web-search + calculator passes but loses the minimal-set star and shows a waste step', () => {
    const mission = getMissionById('2-4-news')!;
    const verdict = run(agentFromIds(['tool-web-search', 'tool-calculator']), mission);
    expect(verdict.passed).toBe(true);
    // present-but-useless calculator costs the minimal-set star.
    expect(verdict.stars.minimalSet).toBe(false);
    // the 👀 waste step is rendered (firesWhenCapPresent: 'calculator').
    expect(verdict.steps.some((s) => s.textKey === 'step.2-4.waste.observation')).toBe(true);
  });
});

describe('content — World-3 memory missions fail with no-memory when memory is absent (AC-5)', () => {
  for (const missionId of ['3-1-name', '3-2-history', '3-3-faq']) {
    it(`${missionId}: no memory -> no-memory`, () => {
      const mission = getMissionById(missionId)!;
      const verdict = run(agentFromIds([]), mission);
      expect(verdict.passed).toBe(false);
      expect(verdict.failureModeId).toBe(NO_MEMORY);
    });
  }
});

describe('content — 3-4 honesty refusal (AC-8)', () => {
  it('without memory -> honest refusal PASSES with outcomeKey "refusal" and no fabricated answer', () => {
    const mission = getMissionById('3-4-honesty')!;
    const verdict = run(agentFromIds([]), mission);
    expect(verdict.passed).toBe(true);
    expect(verdict.outcomeKey).toBe('refusal');
    expect(verdict.steps.some((s) => s.kind === 'refusal')).toBe(true);
    // it must NOT fabricate the success answer.
    expect(verdict.steps.some((s) => s.textKey === 'step.3-4.answer.done')).toBe(false);
  });

  it('with memory -> normal success path', () => {
    const mission = getMissionById('3-4-honesty')!;
    const verdict = run(agentFromIds(['mem-episodic']), mission);
    expect(verdict.passed).toBe(true);
    expect(verdict.outcomeKey).toBe('success');
    expect(verdict.steps.some((s) => s.kind === 'refusal')).toBe(false);
    expect(verdict.steps.some((s) => s.textKey === 'step.3-4.answer.done')).toBe(true);
  });
});
