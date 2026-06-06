import { describe, expect, it } from 'vitest';
import { run } from '$engine/index.js';
import { CARDS, agent, MISSION_CURRENCY, MISSION_NEWS } from './_fixtures.js';

// AC-4: stars = three independent booleans, only on a passing run.
// AC-7: the 2.4 calculator trap costs the minimal-set star and shows a 👀 waste step.
describe('AC-4 / AC-7 scoring', () => {
  it('minimal correct agent earns all 3 stars', () => {
    const v = run(agent(CARDS.webSearch), MISSION_CURRENCY);
    expect(v.passed).toBe(true);
    expect(v.stars).toEqual({ passed: true, minimalSet: true, withinBudget: true });
  });

  it('failed run earns 0 stars', () => {
    const v = run(agent(CARDS.calculator), MISSION_CURRENCY);
    expect(v.stars).toEqual({ passed: false, minimalSet: false, withinBudget: false });
  });

  it('AC-7 trap: adding the useless calculator passes but loses the minimal-set star', () => {
    const v = run(agent(CARDS.webSearch, CARDS.calculator), MISSION_NEWS);
    expect(v.passed).toBe(true);
    expect(v.stars.minimalSet).toBe(false);
    // the waste is visible in the story
    const wasteStep = v.steps.find((s) => s.textKey === 'step.2-4.waste.observation');
    expect(wasteStep).toBeDefined();
    expect(wasteStep?.marker).toBe('👀');
  });

  it('AC-7 control: web-search alone (no calculator) keeps the minimal-set star and shows no waste step', () => {
    const v = run(agent(CARDS.webSearch), MISSION_NEWS);
    expect(v.passed).toBe(true);
    expect(v.stars.minimalSet).toBe(true);
    expect(v.steps.find((s) => s.textKey === 'step.2-4.waste.observation')).toBeUndefined();
  });
});
