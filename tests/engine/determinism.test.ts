import { describe, expect, it } from 'vitest';
import { run } from '$engine/index.js';
import { CARDS, agent, MISSION_CURRENCY, MISSION_NEWS, MISSION_HONESTY } from './_fixtures.js';

// AC-2: run() is a pure function — same inputs -> byte-identical Verdict across many calls.
describe('AC-2 determinism', () => {
  it('produces identical verdicts across 1000 repeated calls', () => {
    const a = agent(CARDS.webSearch);
    const first = JSON.stringify(run(a, MISSION_CURRENCY));
    for (let i = 0; i < 1000; i++) {
      expect(JSON.stringify(run(a, MISSION_CURRENCY))).toBe(first);
    }
  });

  it('is order-independent and side-effect free across different missions', () => {
    const a1 = agent(CARDS.webSearch, CARDS.calculator);
    const a2 = agent(CARDS.memEpisodic);
    const v1a = JSON.stringify(run(a1, MISSION_NEWS));
    const v2a = JSON.stringify(run(a2, MISSION_HONESTY));
    // interleave; results must not depend on call order
    const v2b = JSON.stringify(run(a2, MISSION_HONESTY));
    const v1b = JSON.stringify(run(a1, MISSION_NEWS));
    expect(v1a).toBe(v1b);
    expect(v2a).toBe(v2b);
  });
});
