import { describe, expect, it } from 'vitest';
import {
  run,
  MISSING_TOOL,
  NO_MEMORY,
  NO_PLAN,
  NO_CRITIC,
  WRONG_ROLE,
  BUDGET_EXCEEDED,
  NO_STOPPING_LOOP,
  NO_GUARDRAIL_INJECTION
} from '$engine/index.js';
import {
  CARDS,
  agent,
  MISSION_CURRENCY,
  MISSION_RECALL,
  MISSION_TONE,
  MISSION_PLAN_FIXTURE,
  MISSION_CRITIC_FIXTURE,
  MISSION_BUDGET_FIXTURE,
  MISSION_LOOP_FIXTURE,
  MISSION_INJECTION_FIXTURE
} from './_fixtures.js';
import type { Card } from '$engine/index.js';
import { cardById } from '$content/cards.js';
import { getMissionById } from '$content/missions.js';

// Resolve a real content card (by its registry id) into the engine Card shape the walker expects.
// Using the campaign card id (e.g. 'stop-rule') — not the fixture id — keeps the minimalSet star true.
function contentCard(id: string): Card {
  const c = cardById(id)!;
  return { id: c.id, type: c.type, capability: c.capability, cost: c.cost, labelKey: c.labelKey };
}

// AC-3a: each registered failure mode fires on a crafted (agent, mission) pair.
describe('AC-3a failure modes (crafted fixtures)', () => {
  it('missing-tool: no web-search -> fails with missing-tool', () => {
    const v = run(agent(CARDS.calculator), MISSION_CURRENCY);
    expect(v.passed).toBe(false);
    expect(v.failureModeId).toBe(MISSING_TOOL);
    expect(v.steps.at(-1)?.kind).toBe('fail');
  });

  it('no-memory: no memory cap -> fails with no-memory (not missing-tool)', () => {
    const v = run(agent(), MISSION_RECALL);
    expect(v.passed).toBe(false);
    expect(v.failureModeId).toBe(NO_MEMORY);
    expect(v.steps.at(-1)?.kind).toBe('fail');
  });

  it('no-memory: a present tool does not satisfy a missing memory cap', () => {
    const v = run(agent(CARDS.webSearch), MISSION_RECALL);
    expect(v.passed).toBe(false);
    expect(v.failureModeId).toBe(NO_MEMORY);
  });

  it('no-plan: empty agent on a planner mission -> fails with no-plan', () => {
    const v = run(agent(), MISSION_PLAN_FIXTURE);
    expect(v.passed).toBe(false);
    expect(v.failureModeId).toBe(NO_PLAN);
    expect(v.steps.at(-1)?.kind).toBe('fail');
  });

  it('no-plan: providing the planner card passes', () => {
    const v = run(agent(CARDS.planner), MISSION_PLAN_FIXTURE);
    expect(v.passed).toBe(true);
  });

  it('no-critic: empty agent on a critic mission -> fails with no-critic', () => {
    const v = run(agent(), MISSION_CRITIC_FIXTURE);
    expect(v.passed).toBe(false);
    expect(v.failureModeId).toBe(NO_CRITIC);
    expect(v.steps.at(-1)?.kind).toBe('fail');
  });

  it('no-critic: providing the critic card passes', () => {
    const v = run(agent(CARDS.critic), MISSION_CRITIC_FIXTURE);
    expect(v.passed).toBe(true);
  });

  it('wrong-role: greeter role on a formal-tone mission -> wrong-role (pre-walk)', () => {
    const v = run(agent(CARDS.roleGreeter), MISSION_TONE);
    expect(v.passed).toBe(false);
    expect(v.failureModeId).toBe(WRONG_ROLE);
    expect(v.steps[0]?.kind).toBe('fail'); // pre-walk beat shows the cause
  });

  it('budget-exceeded: path longer than the step budget -> budget-exceeded', () => {
    const v = run(agent(), MISSION_BUDGET_FIXTURE);
    expect(v.passed).toBe(false);
    expect(v.failureModeId).toBe(BUDGET_EXCEEDED);
  });

  it('no-stopping-loop: loopExpected without stopping card -> no-stopping-loop', () => {
    const v = run(agent(), MISSION_LOOP_FIXTURE);
    expect(v.passed).toBe(false);
    expect(v.failureModeId).toBe(NO_STOPPING_LOOP);
  });

  it('no-guardrail-injection: injection mission without guardrail -> injection mode (pre-walk)', () => {
    const v = run(agent(), MISSION_INJECTION_FIXTURE);
    expect(v.passed).toBe(false);
    expect(v.failureModeId).toBe(NO_GUARDRAIL_INJECTION);
  });

  it('guardrail present neutralizes the injection teaser', () => {
    const v = run(agent(CARDS.guardrail), MISSION_INJECTION_FIXTURE);
    expect(v.passed).toBe(true);
  });
});

// AC-3a (real missions): the two control teasers are now backed by campaign missions (Worlds 6 & 7),
// not only by fixtures. An empty agent must hit the world's mode, and the right control card must pass.
describe('AC-3a control failure modes on real campaign missions (Worlds 6 & 7)', () => {
  it('no-stopping-loop: World 6 without a stopping card -> no-stopping-loop', () => {
    const mission = getMissionById('6-1-mailcap')!;
    const v = run(agent(), mission);
    expect(v.passed).toBe(false);
    expect(v.failureModeId).toBe(NO_STOPPING_LOOP);
  });

  it('no-stopping-loop: providing the stopping card passes World 6 with three stars', () => {
    const mission = getMissionById('6-1-mailcap')!;
    const v = run(agent(contentCard('stop-rule')), mission);
    expect(v.passed).toBe(true);
    expect(v.stars).toEqual({ passed: true, minimalSet: true, withinBudget: true });
  });

  it('no-guardrail-injection: World 7 without a guardrail card -> injection mode (pre-walk)', () => {
    const mission = getMissionById('7-1-transfer')!;
    const v = run(agent(), mission);
    expect(v.passed).toBe(false);
    expect(v.failureModeId).toBe(NO_GUARDRAIL_INJECTION);
    expect(v.steps[0]?.kind).toBe('fail'); // pre-walk beat shows the cause
  });

  it('no-guardrail-injection: providing the guardrail card passes World 7 with three stars', () => {
    const mission = getMissionById('7-1-transfer')!;
    const v = run(agent(contentCard('guard-check')), mission);
    expect(v.passed).toBe(true);
    expect(v.stars).toEqual({ passed: true, minimalSet: true, withinBudget: true });
  });
});
