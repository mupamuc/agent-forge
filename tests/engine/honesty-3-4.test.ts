import { describe, expect, it } from 'vitest';
import { run } from '$engine/index.js';
import { CARDS, agent, MISSION_HONESTY } from './_fixtures.js';

// AC-8: mission 3.4 — without the required memory the agent must REFUSE and PASS,
// emitting a refusal outcome, NOT a fabricated answer.
describe('AC-8 honesty refusal (3.4)', () => {
  it('no memory -> honest refusal PASSES with outcomeKey "refusal"', () => {
    const v = run(agent(), MISSION_HONESTY);
    expect(v.passed).toBe(true);
    expect(v.outcomeKey).toBe('refusal');
    const refusal = v.steps.find((s) => s.kind === 'refusal');
    expect(refusal).toBeDefined();
    expect(refusal?.marker).toBe('✅');
    // it must NOT have fabricated the success answer
    expect(v.steps.some((s) => s.textKey === 'step.3-4.answer.done')).toBe(false);
  });

  it('with memory -> normal success path, outcomeKey "success"', () => {
    const v = run(agent(CARDS.memEpisodic), MISSION_HONESTY);
    expect(v.passed).toBe(true);
    expect(v.outcomeKey).toBe('success');
    expect(v.steps.some((s) => s.kind === 'refusal')).toBe(false);
    expect(v.steps.some((s) => s.textKey === 'step.3-4.answer.done')).toBe(true);
  });
});
