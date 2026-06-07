import { describe, it, expect } from 'vitest';
import type { AgentConfig, Card } from '$engine/index.js';
import {
  run,
  WRONG_ROLE,
  MISSING_TOOL,
  NO_MEMORY,
  NO_PLAN,
  NO_CRITIC,
  NO_STOPPING_LOOP,
  NO_GUARDRAIL_INJECTION
} from '$engine/index.js';
import { cardById } from '$content/cards.js';
import { WORLDS } from '$content/worlds.js';
import { cardsForMission, getMissionById } from '$content/missions.js';

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
  it('covers Worlds 1–7, four missions each (28 total)', () => {
    // Guard: we expect exactly the twenty-eight campaign missions wired into the registry.
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
      '3-4-honesty',
      '4-1-report',
      '4-2-onboarding',
      '4-3-move',
      '4-4-mailout',
      '5-1-press',
      '5-2-reports',
      '5-3-contract',
      '5-4-reply',
      '6-1-mailcap',
      '6-2-search',
      '6-3-noreply',
      '6-4-cheap',
      '7-1-transfer',
      '7-2-ignore',
      '7-3-address',
      '7-4-boss'
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

describe('content — Worlds 4–7 control missions fail with the right mode on a distractor (AC-5)', () => {
  // Each World 4–7 mission requires exactly one control cap. Its inventory carries two distractors
  // (a tool + a memory) that never provide that cap, so placing one instead of the correct control
  // card must trigger the world's failure mode. We resolve the inventory via cardsForMission and pick
  // the first card whose capability is NOT the mission's required control cap.
  const CONTROL_FAILURE: Record<string, string> = {
    'world-4': NO_PLAN,
    'world-5': NO_CRITIC,
    'world-6': NO_STOPPING_LOOP,
    'world-7': NO_GUARDRAIL_INJECTION
  };

  for (const world of WORLDS) {
    const expected = CONTROL_FAILURE[world.id];
    if (!expected) continue; // Worlds 1–3 are covered by their own blocks above.

    for (const missionId of world.missionIds) {
      it(`${missionId}: a distractor (not the control card) triggers ${expected}`, () => {
        const mission = getMissionById(missionId)!;
        const requiredCap = mission.requiredCaps[0]!;
        // A distractor from the world's own inventory that does NOT satisfy the required control cap.
        const distractor = cardsForMission(missionId).find((c) => c.capability !== requiredCap);
        expect(distractor, `no distractor in inventory for ${missionId}`).toBeDefined();

        const verdict = run(agentFromIds([distractor!.id]), mission);
        expect(verdict.passed).toBe(false);
        expect(verdict.failureModeId).toBe(expected);
      });
    }
  }

  it('an empty agent on a World 4–7 mission fails with the same control mode', () => {
    expect(run(agentFromIds([]), getMissionById('4-1-report')!).failureModeId).toBe(NO_PLAN);
    expect(run(agentFromIds([]), getMissionById('5-1-press')!).failureModeId).toBe(NO_CRITIC);
    expect(run(agentFromIds([]), getMissionById('6-1-mailcap')!).failureModeId).toBe(
      NO_STOPPING_LOOP
    );
    expect(run(agentFromIds([]), getMissionById('7-1-transfer')!).failureModeId).toBe(
      NO_GUARDRAIL_INJECTION
    );
  });
});
